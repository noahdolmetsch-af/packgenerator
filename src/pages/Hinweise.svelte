<script>
  /**
   * Paket Q #148 «Hinweise und News-Feed» (Noah 19.10.2026 «1a 2a»): Ich › Hinweise.
   * 1. For you: weather warnings of MeteoSwiss for your region, the avalanche danger (SLF, in winter)
   *    and your passes with their usual season. The important ones also show as one line on Today.
   * 2. News: the newest of your sources (velo and mountains at the start). Sources are yours: add,
   *    rename, change the address and delete them (with Undo).
   * Everything comes through /api/news; offline the last answer stays, with its time.
   */
  import { liveQuery } from 'dexie';
  import { RefreshCw, Plus, Pencil, Trash2, ExternalLink, TriangleAlert, Mountain, Route } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { FEEDS_KEY, ALERTS_KEY, PASSES, PASS_INFO, feedsOf, alertsOf, checkFeed, seasonOf, usuallyOpen, avalancheSeason, warningsFor } from '../lib/clear/news.js';
  import { news, loadAlerts, loadFeed } from '../lib/clear/news.svelte.js';

  const q = liveQuery(async () => {
    const [f, a, home] = await Promise.all([db.settings.get(FEEDS_KEY), db.settings.get(ALERTS_KEY), db.settings.get('homePlace')]);
    return { feeds: feedsOf(f?.value), prefs: alertsOf(a?.value), home: home?.value?.name ?? '' };
  });
  const feeds = $derived($q?.feeds ?? []);
  const prefs = $derived($q?.prefs ?? alertsOf(null));
  const now = new Date();
  const month = now.getMonth() + 1;
  const when = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const ERR = { offline: 'Offline: this is the last state.', source_unreachable: 'The source does not answer right now.', source_failed: 'The source does not answer right now.', bad_address: 'This address cannot be read. Check it under «Change».', failed: 'Could not load just now. Try again later.' };
  const errText = (code) => t(ERR[code] ?? ERR.failed);

  let started = false;
  $effect(() => {
    if (!$q || started) return;
    started = true;
    loadAlerts();
    for (const f of $q.feeds) loadFeed(f);
  });
  async function refresh() {
    news.busy = true;
    await Promise.all([loadAlerts({ force: true }), ...feeds.map((f) => loadFeed(f, { force: true }))]);
    news.busy = false;
  }

  const savePrefs = (p) => db.settings.put({ key: ALERTS_KEY, value: { ...prefs, ...p } });
  const saveFeeds = (list) => db.settings.put({ key: FEEDS_KEY, value: list });
  const togglePass = (key, on) => savePrefs({ passes: on ? [...new Set([...(prefs.passes ?? []), key])] : (prefs.passes ?? []).filter((k) => k !== key) });

  const warnings = $derived(warningsFor(news.alerts?.warnings ?? [], prefs.region, now));
  const watched = $derived(PASSES.filter((p) => (prefs.passes ?? []).includes(p.key)));

  // the news: every source's items together, newest first
  const items = $derived(
    feeds
      .flatMap((f) => (news.feeds[f.url]?.items ?? []).map((x) => ({ ...x, source: f.name, key: `${f.id}|${x.link}` })))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 30),
  );

  // add / change / delete a source
  let edit = $state(null); // { id|null, name, url, error }
  let undo = $state(null);
  function saveEdit(e) {
    e.preventDefault();
    const r = checkFeed(edit, feeds, edit.id);
    if (r.error) return (edit.error = t(r.error));
    const list = edit.id ? feeds.map((f) => (f.id === edit.id ? r.feed : f)) : [...feeds, r.feed];
    saveFeeds(list);
    loadFeed(r.feed, { force: true });
    edit = null;
  }
  function remove(f) {
    const before = feeds;
    saveFeeds(feeds.filter((x) => x.id !== f.id));
    undo = { name: f.name, before };
    setTimeout(() => undo?.before === before && (undo = null), 6000);
  }
</script>

<section class="hw" data-page="hinweise">
  <Crumbs crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Alerts and news')} />
  <PageHead title={t('Alerts and news')} text={t('What concerns you on the way, and news about velo and mountains. Everything is optional.')} />
  <div class="hw-top">
    <button type="button" class="btn sm" onclick={refresh} disabled={news.busy} data-news-refresh><RefreshCw size={16} aria-hidden="true" />{t('Refresh')}</button>
    {#if news.alerts?.at}<small>{t('As of {when}', { when: when(news.alerts.at) })}</small>{/if}
  </div>

  <section class="ich-sec" aria-labelledby="hw-for">
    <div class="ich-h"><div><h2 id="hw-for">{t('For you')}</h2><p class="ich-hs">{t('Important things also show as one line on Today.')}</p></div></div>
    <div class="card ich-body hw-body">
      {#if news.alerts?.error}<p class="small" role="status">{errText(news.alerts.error)}</p>{/if}

      <h3><TriangleAlert size={16} aria-hidden="true" />{t('Weather warnings (MeteoSwiss)')}</h3>
      <label class="hw-field">{t('Your region (part of the name, e.g. your canton or valley)')}
        <input type="text" value={prefs.region} placeholder={$q?.home || t('all of Switzerland')} onchange={(e) => savePrefs({ region: e.currentTarget.value.trim() })} data-alert-region />
      </label>
      <label class="hw-sw"><input type="checkbox" role="switch" checked={prefs.weather} onchange={(e) => savePrefs({ weather: e.currentTarget.checked })} />{t('Show warnings')}</label>
      {#if prefs.weather}
        {#if warnings.length}
          <ul class="hw-list">
            {#each warnings.slice(0, 8) as w, i (i)}
              <li class="lvl-{w.level}" data-warning>
                <b>{w.event}</b> · {w.area}
                <small>{when(w.onset)}{w.expires ? ` – ${when(w.expires)}` : ''}</small>
                {#if w.link}<a href={w.link} target="_blank" rel="noopener">{t('Details')}<ExternalLink size={14} aria-hidden="true" /></a>{/if}
              </li>
            {/each}
          </ul>
        {:else if news.alerts}
          <p class="small">{t('No warning for your region right now.')}</p>
        {/if}
      {/if}

      <h3><Mountain size={16} aria-hidden="true" />{t('Avalanche bulletin (SLF)')}</h3>
      <label class="hw-sw"><input type="checkbox" role="switch" checked={prefs.avalanche} onchange={(e) => savePrefs({ avalanche: e.currentTarget.checked })} />{t('Show in winter (November to May)')}</label>
      {#if prefs.avalanche}
        {#if !avalancheSeason(month)}
          <p class="small">{t('Outside the winter season. From November it shows here.')}</p>
        {:else if news.alerts?.avalanche?.level}
          <p data-avalanche>{t('Danger up to level {n} in Switzerland today.', { n: news.alerts.avalanche.level })} <a href={news.alerts.avalanche.link} target="_blank" rel="noopener">{t('Open the bulletin')}</a></p>
        {:else}
          <p class="small">{t('The level could not be read.')} <a href="https://www.slf.ch/de/lawinenbulletin-und-schneesituation/" target="_blank" rel="noopener">{t('Open the bulletin')}</a></p>
        {/if}
      {/if}

      <h3><Route size={16} aria-hidden="true" />{t('Passes')}</h3>
      <p class="small">{t('Tick your passes. The app knows their usual season; today\'s state is on alpen-paesse.ch.')} <a href={PASS_INFO} target="_blank" rel="noopener">alpen-paesse.ch</a></p>
      <ul class="hw-pass">
        {#each PASSES as p (p.key)}
          {@const s = seasonOf(p)}
          <li>
            <label><input type="checkbox" checked={(prefs.passes ?? []).includes(p.key)} onchange={(e) => togglePass(p.key, e.currentTarget.checked)} data-pass={p.key} />
              <span><b>{p.name}</b> <small>{s ? t('usually open {from}–{to}', { from: t(s[0]), to: t(s[1]) }) : t('open all year')}{watched.includes(p) && s ? ` · ${usuallyOpen(p, month) ? t('now in season') : t('now usually closed')}` : ''}</small></span>
            </label>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="ich-sec" aria-labelledby="hw-news">
    <div class="ich-h"><div><h2 id="hw-news">{t('News')}</h2><p class="ich-hs">{t('The newest of your sources')}</p></div></div>
    <div class="card ich-body hw-body">
      {#if items.length}
        <ul class="hw-news">
          {#each items as x (x.key)}
            <li data-news-item><a href={x.link} target="_blank" rel="noopener">{x.title}</a><small>{x.source}{x.date ? ` · ${when(x.date)}` : ''}</small></li>
          {/each}
        </ul>
      {:else if !feeds.length}
        <Empty text={t('No sources yet. Add a site with velo or mountain news.')} action={{ label: t('Add source'), onclick: () => (edit = { id: null, name: '', url: '', error: '' }) }} />
      {:else}
        <p class="small">{t('Nothing loaded yet. Tap «Refresh» when you are online.')}</p>
      {/if}
    </div>
  </section>

  <section class="ich-sec" aria-labelledby="hw-src">
    <div class="ich-h"><div><h2 id="hw-src">{t('Your sources')}</h2><p class="ich-hs">{t('Add, rename, change or delete; any site with a news feed (RSS)')}</p></div></div>
    <ul class="card ich-list">
      {#each feeds as f (f.id)}
        {@const st = news.feeds[f.url]}
        <li class="ich-row hw-src" data-feed={f.id}>
          <span class="ich-m"><b>{f.name}</b><small>{f.url}{st?.error ? ` · ${errText(st.error)}` : st?.at ? ` · ${t('{n} entries', { n: st.items.length })}` : ''}</small></span>
          <button type="button" class="btn sm" aria-label={t('Change {name}', { name: f.name })} onclick={() => (edit = { id: f.id, name: f.name, url: f.url, error: '' })}><Pencil size={16} aria-hidden="true" /></button>
          <button type="button" class="btn sm" aria-label={t('Delete {name}', { name: f.name })} onclick={() => remove(f)} data-feed-delete><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
    {#if undo}<p class="msg" role="status">{t('«{name}» deleted.', { name: undo.name })} <button type="button" class="lnk" onclick={() => (saveFeeds(undo.before), (undo = null))}>{t('Undo')}</button></p>{/if}
    {#if edit}
      <form class="card ich-body hw-form" onsubmit={saveEdit} data-feed-form>
        <label class="hw-field">{t('Name')}<input type="text" bind:value={edit.name} data-feed-name /></label>
        <label class="hw-field">{t('Address of the feed')}<input type="url" inputmode="url" placeholder="https://…/feed" bind:value={edit.url} data-feed-url /></label>
        {#if edit.error}<p class="msg" role="alert">{edit.error}</p>{/if}
        <div class="ich-acts"><button type="button" class="btn" onclick={() => (edit = null)}>{t('Cancel')}</button><button type="submit" class="btn hi" data-feed-save>{t('Save')}</button></div>
      </form>
    {:else}
      <button type="button" class="btn" onclick={() => (edit = { id: null, name: '', url: '', error: '' })} data-feed-add><Plus size={16} aria-hidden="true" />{t('Add source')}</button>
    {/if}
  </section>
</section>

<style>
  .hw {
    display: grid;
    gap: var(--sp-4);
    max-width: 760px;
    margin: 0 auto;
  }
  .hw-top {
    display: flex;
    gap: var(--sp-3);
    align-items: center;
    color: var(--ink-2);
  }
  .hw-body {
    display: grid;
    gap: var(--sp-2);
  }
  .hw-body h3 {
    display: flex;
    gap: 6px;
    align-items: center;
    margin: var(--sp-3) 0 0;
    font-size: var(--fs-body);
  }
  .hw-body h3:first-of-type {
    margin-top: 0;
  }
  .hw-field {
    display: grid;
    gap: 4px;
  }
  .hw-sw {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .hw-list,
  .hw-news,
  .hw-pass {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .hw-list li {
    display: grid;
    padding: 8px 10px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
    border-left: 4px solid var(--line);
  }
  .hw-list li.lvl-3,
  .hw-list li.lvl-4 {
    border-left-color: var(--warn);
  }
  .hw-list small,
  .hw-news small,
  .hw-pass small {
    color: var(--ink-2);
  }
  .hw-news li {
    display: grid;
  }
  .hw-pass {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  .hw-pass label {
    display: flex;
    gap: 8px;
    align-items: baseline;
  }
  .hw-src {
    gap: 8px;
  }
  .hw-form {
    display: grid;
    gap: var(--sp-2);
  }
</style>
