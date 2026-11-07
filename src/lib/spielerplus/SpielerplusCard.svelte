<script>
  /**
   * Spielerplus-Kalender (Noah 06.11.2026 «1a 2a 3a 4a 5a», later «anderes Eishockey-Team»): on Ich ›
   * Verbindungen. Paste the private calendar link of a team (several teams possible), test it, name it, pick the
   * sport page it shows on (default Eishockey), switch it off, fetch again, remove it (with Undo).
   * Read only. The link stays on this device (a DEVICE_SETTING: no backup, no sync) and is shown hidden.
   * The dates come to «Woche planen», to «Heute fällig» and to the sport page. Rules: lib/spielerplus.js.
   */
  import { liveQuery } from 'dexie';
  import { Plus, RefreshCw, Trash2, Users, ArrowRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { SP_KEY, DEFAULT_ACT, prefsOf, cleanCal, cleanLink, maskLink, fetchLink, refreshAll, newCalId } from '../spielerplus.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { actName } from '../flow/ui.svelte.js';
  import { localDay } from '../localday.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  const today = localDay();
  const q = liveQuery(async () => ({ rec: await db.settings.get(SP_KEY), acts: await db.flowActs.toArray() }));
  const prefs = $derived(prefsOf($q?.rec?.value));
  const acts = $derived(($q?.acts ?? []).filter((a) => !a.paused));

  let link = $state('');
  let name = $state('');
  let busy = $state('');
  let msg = $state('');
  let added = $state(false);

  const when = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const errorText = (code) =>
    ({
      no_link: t('This is not a Spielerplus calendar link. It looks like https://www.spielerplus.de/events/ics?t=…&u=…'),
      link_invalid: t('Spielerplus does not give a calendar for this link (any more). Copy the calendar link again in Spielerplus.'),
      unreachable: t('Spielerplus does not answer right now. Try again later.'),
      not_calendar: t('The answer from Spielerplus is not a calendar. Check the link.'),
      network: t('No connection. Try again later.'),
      daily_cap: t('The server has done enough for today. Tomorrow it works again.'),
    })[code] ?? t('Something went wrong while reading the calendar. Try again later.');

  /** Save the list: the record is read again just before, so a fetch in between is not lost. */
  async function saveCals(change) {
    const cur = prefsOf((await db.settings.get(SP_KEY))?.value);
    const cals = change(cur.cals);
    await db.settings.put({ key: SP_KEY, value: JSON.parse(JSON.stringify({ cals })) });
  }
  const patchCal = (id, patch) => saveCals((cals) => cals.map((c) => (c.id === id ? { ...c, ...patch } : c))).catch(saveFailed);

  async function add(e) {
    e?.preventDefault();
    msg = '';
    added = false;
    if (!cleanLink(link)) {
      msg = errorText('no_link');
      return;
    }
    if (prefs.cals.some((c) => c.url === cleanLink(link))) {
      msg = t('This link is already there.');
      return;
    }
    busy = 'add';
    try {
      const r = await fetchLink(link, { today });
      if (!r.ok) {
        msg = errorText(r.code);
        return;
      }
      await saveCals((cals) => {
        const c = cleanCal({ id: newCalId(cals), name, url: link, on: true, act: DEFAULT_ACT, events: r.events, fetchedAt: new Date().toISOString() });
        return [...cals, c];
      });
      msg = tn(r.events.length, 'Done: {n} team date found.', 'Done: {n} team dates found.');
      added = true;
      link = '';
      name = '';
    } catch (err) {
      saveFailed(err);
    } finally {
      busy = '';
    }
  }

  async function again(id = null) {
    busy = id ?? 'all';
    msg = '';
    try {
      const r = await refreshAll(db, { force: true, today, only: id });
      msg = r.failed.length ? errorText(prefs.cals.find((c) => c.id === r.failed[0])?.error || 'network') : t('Up to date.');
    } finally {
      busy = '';
    }
  }

  async function remove(c) {
    const label = c.name || t('Team calendar');
    const a = await askDelete({ title: t('Remove "{name}"?', { name: label }), text: t('The link and its dates are removed from this device. Spielerplus itself stays as it is. You can undo this.'), label: t('Remove') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        await saveCals((cals) => cals.filter((x) => x.id !== c.id));
        return c;
      },
      undo: (saved) => saveCals((cals) => [...cals, saved]),
      text: t('"{name}" removed.', { name: label }),
      name: label,
    });
  }

  const actOptions = (c) => {
    const list = acts.map((a) => ({ id: a.id, name: actName(a) }));
    return list.some((o) => o.id === c.act) ? list : [...list, { id: c.act, name: c.act === DEFAULT_ACT ? t('Ice hockey') : c.act }];
  };
  const stateLine = (c) => (c.error ? errorText(c.error) : c.fetchedAt ? `${tn(c.events.length, '{n} date', '{n} dates')} · ${t('last fetch {when}', { when: when(c.fetchedAt) })}` : t('no dates fetched yet'));
</script>

<section class="ich-sec spcard" aria-labelledby="cn-sp-h" data-section="spielerplus">
  <div class="ich-h"><div><h2 id="cn-sp-h">{t('Spielerplus calendar')}</h2><p class="ich-hs">{t('your team dates in the app, read only')}</p></div></div>
  <div class="card ich-body">
    <p class="ich-help">{t('In Spielerplus, copy the calendar link of your team (the calendar subscription) and paste it here. The dates then show in the week, on Today and on the sport page. Signing up stays in Spielerplus: every date has a button that opens it.')}</p>

    {#if prefs.cals.length}
      <ul class="cals">
        {#each prefs.cals as c (c.id)}
          <li class="cal" data-sp-cal={c.id}>
            <div class="top">
              <Users size={16} aria-hidden="true" />
              <input class="nm" type="text" value={c.name} placeholder={t('Team name (your own)')} aria-label={t('Team name')} maxlength="40" onchange={(e) => patchCal(c.id, { name: e.currentTarget.value.trim().slice(0, 40) })} />
              <label class="swt"><input type="checkbox" role="switch" checked={c.on} onchange={(e) => patchCal(c.id, { on: e.currentTarget.checked })} />{c.on ? t('on|conn') : t('off|conn')}</label>
            </div>
            <code class="masked" aria-label={t('The link is hidden. It stays on this device.')}>{maskLink(c.url)}</code>
            <p class="state" class:bad={!!c.error} role={c.error ? 'alert' : undefined}>{stateLine(c)}</p>
            <div class="row">
              <label class="act">{t('Shows on the page of')}
                <select value={c.act} onchange={(e) => patchCal(c.id, { act: e.currentTarget.value })}>
                  {#each actOptions(c) as o (o.id)}<option value={o.id}>{o.name}</option>{/each}
                </select>
              </label>
              <button type="button" class="btn" disabled={busy === c.id || !c.on} onclick={() => again(c.id)}><RefreshCw size={16} aria-hidden="true" />{t('Fetch again')}</button>
              <button type="button" class="btn" onclick={() => remove(c)}><Trash2 size={16} aria-hidden="true" />{t('Remove')}</button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

    <form class="spform" onsubmit={add}>
      <h3>{prefs.cals.length ? t('Add another team') : t('Add a team')}</h3>
      <label>{t('Calendar link from Spielerplus')}
        <input id="sp-link" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" bind:value={link} placeholder="https://www.spielerplus.de/events/ics?t=…&u=…" data-sp-link />
      </label>
      <label>{t('Team name (your own)')}
        <input id="sp-name" type="text" maxlength="40" bind:value={name} placeholder={t('e.g. the team you play in')} />
      </label>
      <p class="ich-help">{t('The link works like a password: it stays on this device (not in the backup, not in the sync) and is not shown in full. Do not pass it on.')}</p>
      <div class="btns"><button type="submit" class="btn hi" disabled={busy === 'add' || !link.trim()}><Plus size={16} aria-hidden="true" />{busy === 'add' ? t('Reading the calendar …') : t('Test and add')}</button>
        {#if prefs.cals.length > 1}<button type="button" class="btn" disabled={busy === 'all'} onclick={() => again()}><RefreshCw size={16} aria-hidden="true" />{t('Fetch all again')}</button>{/if}</div>
    </form>
    {#if msg}<p class="msg" class:ok={added} role="status">{msg}</p>{/if}
    {#if added || prefs.cals.length}
      <p class="next"><a href="#/week/plan">{t('Next: plan the week')}<ArrowRight size={14} aria-hidden="true" /></a></p>
    {/if}
  </div>
</section>

<style>
  .cals {
    list-style: none;
    margin: 0 0 var(--sp-3);
    padding: 0;
    display: grid;
    gap: var(--sp-3);
  }
  .cal {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nm {
    flex: 1 1 0;
    min-width: 0;
    min-height: 44px;
    font: 600 var(--fs-body) / 1.2 var(--font-body);
  }
  .swt {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    font-size: var(--fs-small);
  }
  .masked {
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .state {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .state.bad {
    color: var(--bad);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px;
  }
  .act {
    display: grid;
    gap: 2px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .spform {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-2);
  }
  .spform h3 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .spform label {
    display: grid;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .spform input {
    min-height: 44px;
    width: 100%;
    min-width: 0;
  }
  .btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .msg {
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-small);
    color: var(--bad);
  }
  .msg.ok {
    color: var(--ok);
  }
  .next {
    margin: var(--sp-3) 0 0;
    font-size: var(--fs-small);
  }
  .next a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
  }
</style>
