<script>
  /**
   * «Tagebuch» (Noah 20.10.2026: «idee: tagebuch. schaue dir die app dayone an und baue sie nach, damit wir
   * ein wunderschönes und funktionales tagebuch haben»; answers «1b … 2b … 3a … 365 Fragen … diktierfunktion
   * … wichtig 4a 5a»). #/tagebuch: the diary like Day One: entries by month with date, photo and preview, a
   * calendar, a photo wall, «On this day», search, tags and favourites, the question of the day, dictation.
   * #/tagebuch/<id>: one entry to read, with Change, Share, Download and Delete. #/tagebuch?neu: a new entry,
   * #/tagebuch?diktat: a new entry that starts listening. A lock with an own code (Settings).
   * Data: journal.js and journaldb.js (rows of the table «frei», kind 'diary'; in every backup and sync).
   */
  import { onDestroy } from 'svelte';
  import { Plus, Mic, Search, Star, Settings2, BookOpen, Shuffle, X, ChevronLeft, ChevronRight, Pencil, Share2, Download, Trash2, MapPin, Sun, CloudSun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning, Feather } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import Lightbox from '../lib/ui/Lightbox.svelte';
  import AreaIntro from '../lib/intro/AreaIntro.svelte';
  import EntrySheet from '../lib/tagebuch/EntrySheet.svelte';
  import Settings from '../lib/tagebuch/Settings.svelte';
  import LockScreen from '../lib/tagebuch/LockScreen.svelte';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { entriesQuery, cfgQuery, changeCfg, deleteEntry, restoreEntry } from '../lib/tagebuch/journaldb.js';
  import { sortEntries, filterEntries, byMonth, allTags, onThisDay, stats, monthGrid, shiftMonth, photosOf, headOf, weatherKind, WEATHER_WORDS, entryMarkdown, journalMarkdown, fileName, HREF } from '../lib/tagebuch/journal.js';
  import { QUESTIONS, questionOf } from '../lib/tagebuch/fragen.js';
  import { gate, lockNow, watchHidden } from '../lib/tagebuch/lock.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { phone } from '../lib/media.svelte.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';

  let { hash = '' } = $props();
  const today = localDay();
  const now = () => new Date().toTimeString().slice(0, 5);

  const eq = entriesQuery();
  const cq = cfgQuery();
  const all = $derived(sortEntries($eq ?? []));
  const cfg = $derived($cq);
  const locked = $derived(!!cfg?.lock?.hash && !gate.open);
  const tags = $derived(allTags(all));
  const st = $derived(stats(all, today));

  watchHidden();
  onDestroy(lockNow);

  /* ---------- address ---------- */
  const path = $derived(hash.split('?')[0]);
  const query = $derived(new URLSearchParams(hash.split('?')[1] ?? ''));
  const openId = $derived(decodeURIComponent(path.split('/')[2] ?? ''));
  const reading = $derived(openId ? all.find((e) => e.id === openId) ?? null : null);

  /* ---------- views: list, calendar, photos (remembered on this device) ---------- */
  const VIEW_KEY = 'tb.view';
  const readView = () => {
    try {
      return localStorage.getItem(VIEW_KEY) || 'list';
    } catch {
      return 'list';
    }
  };
  let view = $state(readView());
  function setView(k) {
    view = k;
    try {
      localStorage.setItem(VIEW_KEY, k);
    } catch {
      /* not kept */
    }
  }
  let q = $state('');
  let tag = $state('');
  let starOnly = $state(false);
  const shown = $derived(filterEntries(all, { q, tag, star: starOnly }));
  const months = $derived(byMonth(shown));
  const filtered = $derived(!!(q || tag || starOnly));

  /* ---------- writing ---------- */
  let edit = $state(null); // { entry, dictate }
  const write = (extra = {}, dictate = false) => (edit = { entry: { day: today, time: now(), ...extra }, dictate });
  // #/tagebuch?neu and ?diktat open a new entry once (then the address is cleaned)
  $effect(() => {
    if (locked || !cfg) return;
    if (query.has('neu') || query.has('diktat')) {
      const d = query.has('diktat');
      history.replaceState(null, '', `${location.pathname}${location.search}${HREF}`);
      write({}, d);
    }
  });

  /* ---------- question of the day (3a) ---------- */
  const HIDE_KEY = 'tb.qhide';
  let qHidden = $state((() => {
    try {
      return localStorage.getItem(HIDE_KEY) === today;
    } catch {
      return false;
    }
  })());
  let skip = $state(0);
  const qi = $derived(questionOf(today, skip));
  const answeredToday = $derived(all.some((e) => e.day === today && e.q === questionOf(today, 0)));
  function hideQuestion() {
    qHidden = true;
    try {
      localStorage.setItem(HIDE_KEY, today);
    } catch {
      /* only for now */
    }
  }

  /* ---------- on this day ---------- */
  const memories = $derived(onThisDay(all, today));

  /* ---------- calendar ---------- */
  let month = $state(today.slice(0, 7));
  let pickedDay = $state(today);
  const weeks = $derived(monthGrid(month));
  const byDay = $derived(Object.groupBy ? Object.groupBy(all, (e) => e.day) : all.reduce((m, e) => ((m[e.day] ??= []).push(e), m), {}));
  const dayEntries = $derived(byDay[pickedDay] ?? []);
  const monthName = (m) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const weekdayNames = $derived(Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2024, 0, 1 + i, 12)).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short' })));

  /* ---------- photos ---------- */
  const photos = $derived(photosOf(shown));

  /* ---------- formatting ---------- */
  const long = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const wd = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short' });
  const dnum = (d) => Number(d.slice(8));
  const WX = { sun: Sun, partly: CloudSun, cloud: Cloud, fog: CloudFog, rain: CloudRain, snow: CloudSnow, storm: CloudLightning };
  const wxWord = (w) => `${w.temp} °C ${t(WEATHER_WORDS[weatherKind(w.code)])}`;
  const yearsAgo = (n) => (n === 1 ? t('One year ago') : t('{n} years ago', { n }));

  const sentence = $derived.by(() => {
    if (!all.length) return t('Write down what matters to you: with photos, place, weather and tags. Or just speak.');
    const parts = [tn(st.entries, 'You have written {n} entry', 'You have written {n} entries')];
    if (st.streak > 1) parts.push(t('{n} days in a row', { n: st.streak }));
    return `${parts.join(', ')}.`;
  });

  /* ---------- share and download (2b) ---------- */
  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  const downloadAll = () => download(fileName(t('diary'), today), journalMarkdown(shown.length ? shown : all, { t, fmt: long, title: t('Diary') }));
  const downloadOne = (e) => download(fileName(t('diary'), e.day), entryMarkdown(e, { t, fmt: long }));
  async function share(e) {
    const text = entryMarkdown(e, { t, fmt: long }).replace(/^## /, '');
    try {
      const files = await Promise.all((e.photos ?? []).map(async (p, i) => {
        const blob = await (await fetch(p.src)).blob();
        return new File([blob], `${e.day}-${i + 1}.${blob.type.includes('png') ? 'png' : 'jpg'}`, { type: blob.type });
      }));
      if (navigator.share) {
        const data = files.length && navigator.canShare?.({ files }) ? { text, files } : { text };
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(text);
        offerDone(t('Copied. Paste it into a message.'));
      }
    } catch (err) {
      if (err?.name !== 'AbortError') offerDone(t('Sharing did not work here. Use «Download» instead.'));
    }
  }
  async function remove(e) {
    const name = headOf(e).title || long(e.day);
    const a = await askDelete({ title: t('Delete «{name}»?', { name }), text: t('The entry and its photos go. You can undo this for a few seconds.') });
    if (a !== 'delete') return;
    location.hash = HREF;
    await deleteWithUndo({ run: () => deleteEntry(e.id), undo: (rec) => restoreEntry(rec), text: t('"{name}" deleted.', { name }), name });
  }
  const neighbours = $derived.by(() => {
    if (!reading) return {};
    const i = all.findIndex((e) => e.id === reading.id);
    return { newer: all[i - 1] ?? null, older: all[i + 1] ?? null };
  });

  let settings = $state(false);
  let lightbox = $state(null); // { list, start }
  const href = (e) => `${HREF}/${encodeURIComponent(e.id)}`;
  const thumb = (e) => e.photos?.[0]?.src ?? null;
</script>

{#snippet card(e)}
  {@const h = headOf(e, phone.matches ? 90 : 160)}
  <a class="tb-card" href={href(e)} data-tb-entry={e.id}>
    <span class="tb-date" aria-hidden="true"><b>{dnum(e.day)}</b><small>{wd(e.day)}</small></span>
    <span class="tb-main">
      <b class="tb-title">{h.title || t('Untitled')}{#if e.star}<Star class="tb-starmini" size={14} fill="currentColor" aria-label={t('Favourite')} />{/if}</b>
      {#if h.preview}<span class="tb-prev">{h.preview}</span>{/if}
      <small class="tb-meta">
        {#if e.time}<span>{e.time}</span>{/if}
        {#if e.place?.name}<span><MapPin size={12} aria-hidden="true" />{e.place.name}</span>{/if}
        {#if e.weather}{@const W = WX[weatherKind(e.weather.code)]}<span><W size={12} aria-hidden="true" />{e.weather.temp} °C</span>{/if}
        {#each e.tags ?? [] as x (x)}<span class="tb-tagmini">#{x}</span>{/each}
      </small>
    </span>
    {#if thumb(e)}<img class="tb-thumb" src={thumb(e)} alt="" loading="lazy" />{/if}
  </a>
{/snippet}

{#if !cfg}
  <div class="tb" aria-busy="true"></div>
{:else if locked}
  <div class="tb"><LockScreen {cfg} /></div>
{:else if openId}
  <!-- one entry to read -->
  <div class="tb tb-read" data-page="tagebuch-entry">
    <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: HREF, label: t('Diary') }]} here={reading ? long(reading.day) : ''} />
    {#if !reading}
      <h1 class="tb-h1" tabindex="-1" data-page-title>{t('Diary')}</h1>
      <p class="tb-empty">{t('This entry is not here (any more).')} <a href={HREF}>{t('To the diary')}</a></p>
    {:else}
      {@const h = headOf(reading)}
      <article class="tb-article" data-tb-reading={reading.id}>
        <p class="tb-kick">{long(reading.day)}{#if reading.time}{` · ${reading.time}`}{/if}</p>
        <h1 class="tb-h1" tabindex="-1" data-page-title>{reading.title?.trim() || h.title || t('Untitled')}{#if reading.star}<Star class="tb-starbig" size={22} fill="currentColor" aria-label={t('Favourite')} />{/if}</h1>
        {#if Number.isInteger(reading.q) && QUESTIONS[reading.q]}<p class="tb-askq">{t(QUESTIONS[reading.q][0])}</p>{/if}
        {#if reading.place?.name || reading.weather}
          <p class="tb-metabig">
            {#if reading.place?.name}<span><MapPin size={16} aria-hidden="true" />{#if reading.place.lat}<a href={`https://www.google.com/maps/search/?api=1&query=${reading.place.lat},${reading.place.lon}`} target="_blank" rel="noopener">{reading.place.name || t('On the map')}</a>{:else}{reading.place.name}{/if}</span>{/if}
            {#if reading.weather}{@const W = WX[weatherKind(reading.weather.code)]}<span><W size={16} aria-hidden="true" />{wxWord(reading.weather)}</span>{/if}
          </p>
        {/if}
        {#if reading.photos?.length}
          <div class="tb-gal" class:one={reading.photos.length === 1}>
            {#each reading.photos as p, n (n)}
              <button type="button" class="tb-galbtn" onclick={() => (lightbox = { list: reading.photos.map((x, i) => ({ src: x.src, name: t('Photo {i} of {n}', { i: i + 1, n: reading.photos.length }), sub: long(reading.day) })), start: n })} aria-label={t('Show photo {i} big', { i: n + 1 })}><img src={p.src} alt="" /></button>
            {/each}
          </div>
        {/if}
        {#if (reading.title?.trim() ? reading.text : reading.text.split('\n').slice(1).join('\n')).trim()}
          <div class="tb-body">{reading.title?.trim() ? reading.text.trim() : reading.text.split('\n').slice(1).join('\n').trim()}</div>
        {/if}
        {#if reading.tags?.length}
          <div class="tb-chips">{#each reading.tags as x (x)}<a class="tb-chip" href={HREF} onclick={() => ((tag = x), setView('list'))}>#{x}</a>{/each}</div>
        {/if}
        <div class="tb-acts">
          <button type="button" class="btn hi" onclick={() => (edit = { entry: reading, dictate: false })} data-tb-edit><Pencil size={16} aria-hidden="true" />{t('Change')}</button>
          <button type="button" class="btn" onclick={() => share(reading)} data-tb-share><Share2 size={16} aria-hidden="true" />{t('Share')}</button>
          <button type="button" class="btn" onclick={() => downloadOne(reading)} data-tb-download><Download size={16} aria-hidden="true" />{t('Download it')}</button>
          <button type="button" class="btn del" onclick={() => remove(reading)} data-tb-remove><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
        </div>
        <nav class="tb-pager" aria-label={t('More entries')}>
          {#if neighbours.older}<a class="btn" href={href(neighbours.older)} data-tb-older><ChevronLeft size={16} aria-hidden="true" />{t('Older')}</a>{:else}<span></span>{/if}
          {#if neighbours.newer}<a class="btn" href={href(neighbours.newer)} data-tb-newer>{t('Newer')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
        </nav>
      </article>
    {/if}
  </div>
{:else}
  <div class="tb" data-page="tagebuch">
    <Crumb path={[{ href: '#/me', label: t('Me|place') }]} here={t('Diary')} />
    <div class="tb-head">
      <h1 class="tb-h1" tabindex="-1" data-page-title>{t('Diary')}</h1>
      <button type="button" class="tb-ic" aria-label={t('Diary settings')} title={t('Diary settings')} onclick={() => (settings = true)} data-tb-settings-open><Settings2 size={20} aria-hidden="true" /></button>
    </div>
    <p class="tb-sentence" data-tb-sentence>{sentence}</p>
    <AreaIntro place="tagebuch" />
    {#if cfg.resetAt}
      <p class="tb-notice" role="status" data-tb-reset>{t('The lock of the diary was removed on {day}.', { day: long(cfg.resetAt.slice(0, 10)) })} <button type="button" class="btn sm" onclick={() => changeCfg((c) => ({ ...c, resetAt: null }))}>{t('OK')}</button></p>
    {/if}

    <div class="tb-acts">
      <button type="button" class="btn hi" onclick={() => write()} data-tb-new><Plus size={18} aria-hidden="true" />{t('New entry')}</button>
      <button type="button" class="btn" onclick={() => write({}, true)} data-tb-dictate><Mic size={18} aria-hidden="true" />{t('Dictate an entry')}</button>
    </div>

    {#if cfg.questions !== false && !qHidden && !answeredToday}
      <section class="tb-q" aria-labelledby="tb-q-h" data-tb-question={qi}>
        <div class="tb-q-top">
          <h2 id="tb-q-h" class="tb-q-kick"><Feather size={16} aria-hidden="true" />{t('Question of the day')}</h2>
          <button type="button" class="tb-ic sm" aria-label={t('Not today')} title={t('Not today')} onclick={hideQuestion} data-tb-question-hide><X size={18} aria-hidden="true" /></button>
        </div>
        <p class="tb-q-text">{t(QUESTIONS[qi][0])}</p>
        <div class="tb-acts">
          <button type="button" class="btn hi sm" onclick={() => write({ q: qi })} data-tb-answer>{t('Answer it')}</button>
          <button type="button" class="btn sm" onclick={() => write({ q: qi }, true)} data-tb-answer-speak><Mic size={16} aria-hidden="true" />{t('Answer by speaking')}</button>
          <button type="button" class="btn sm" onclick={() => skip++} data-tb-question-next><Shuffle size={16} aria-hidden="true" />{t('Other question')}</button>
        </div>
      </section>
    {/if}

    {#if memories.length}
      <section class="tb-mem" aria-labelledby="tb-mem-h" data-tb-memories>
        <h2 id="tb-mem-h" class="tb-h2">{t('On this day')}</h2>
        {#each memories as m (m.years)}
          <p class="tb-mem-y">{yearsAgo(m.years)}</p>
          <div class="tb-list">{#each m.items as e (e.id)}{@render card(e)}{/each}</div>
        {/each}
      </section>
    {/if}

    {#if all.length}
      <div class="tb-bar">
        <Seg full={false} label={t('View')} value={view} onchange={setView} options={[{ key: 'list', name: t('Entries') }, { key: 'cal', name: t('Calendar') }, { key: 'photos', name: t('Photos') }]} />
      </div>
      {#if view !== 'cal'}
        <div class="tb-filter">
          <label class="tb-search"><Search size={18} aria-hidden="true" /><input class="inp" type="search" bind:value={q} placeholder={t('Search the diary')} aria-label={t('Search the diary')} data-tb-search /></label>
          <div class="tb-chips" role="group" aria-label={t('Filter')}>
            <button type="button" class="tb-chip" aria-pressed={starOnly} onclick={() => (starOnly = !starOnly)} data-tb-staronly><Star size={14} aria-hidden="true" fill={starOnly ? 'currentColor' : 'none'} />{t('Favourites')}</button>
            {#each tags.slice(0, phone.matches ? 6 : 12) as x (x.name)}
              <button type="button" class="tb-chip" aria-pressed={tag === x.name} onclick={() => (tag = tag === x.name ? '' : x.name)} data-tb-filter-tag={x.name}>#{x.name}</button>
            {/each}
          </div>
        </div>
      {/if}
    {/if}

    {#if !all.length}
      <div class="tb-first" data-tb-empty>
        <span class="tb-first-ic" aria-hidden="true"><BookOpen size={28} /></span>
        <p>{t('Your diary is still empty. One sentence is enough for a start.')}</p>
      </div>
    {:else if view === 'cal'}
      <section class="tb-cal" aria-label={t('Calendar')} data-tb-calendar>
        <div class="tb-cal-head">
          <button type="button" class="tb-ic" aria-label={t('Month before')} onclick={() => (month = shiftMonth(month, -1))} data-tb-month-prev><ChevronLeft size={20} aria-hidden="true" /></button>
          <h2 class="tb-h2" data-tb-month={month}>{monthName(month)}</h2>
          <button type="button" class="tb-ic" aria-label={t('Month after')} onclick={() => (month = shiftMonth(month, 1))} data-tb-month-next><ChevronRight size={20} aria-hidden="true" /></button>
        </div>
        <table class="tb-grid">
          <thead><tr>{#each weekdayNames as w (w)}<th scope="col">{w}</th>{/each}</tr></thead>
          <tbody>
            {#each weeks as wk, i (i)}
              <tr>
                {#each wk as d, j (j)}
                  <td>
                    {#if d}
                      {@const n = byDay[d]?.length ?? 0}
                      {@const ph = (byDay[d] ?? []).find((e) => e.photos?.length)?.photos[0]?.src}
                      <button type="button" class="tb-day" class:has={n} class:today={d === today} class:picked={d === pickedDay} style={ph ? `background-image:url(${ph})` : ''} class:ph={!!ph} aria-pressed={d === pickedDay} aria-label={`${long(d)}${n ? `, ${tn(n, '{n} entry', '{n} entries')}` : ''}`} onclick={() => (pickedDay = d)} data-tb-day={d}>
                        <span>{dnum(d)}</span>{#if n && !ph}<i aria-hidden="true"></i>{/if}
                      </button>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
        <h3 class="tb-h3">{long(pickedDay)}</h3>
        {#if dayEntries.length}
          <div class="tb-list">{#each dayEntries as e (e.id)}{@render card(e)}{/each}</div>
        {:else}
          <p class="tb-empty">{t('No entry on this day.')}</p>
        {/if}
        {#if pickedDay <= today}
          <button type="button" class="btn" onclick={() => write({ day: pickedDay, time: pickedDay === today ? now() : '20:00' })} data-tb-write-day><Plus size={16} aria-hidden="true" />{t('Write about this day')}</button>
        {/if}
      </section>
    {:else if view === 'photos'}
      {#if photos.length}
        <div class="tb-wall" data-tb-wall>
          {#each photos as p (p.id + p.n)}
            <a class="tb-wall-item" href={`${HREF}/${encodeURIComponent(p.id)}`} aria-label={long(p.day)}><img src={p.src} alt="" loading="lazy" /><small>{dnum(p.day)}. {new Date(`${p.day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', month: 'short', year: 'numeric' })}</small></a>
          {/each}
        </div>
      {:else}
        <p class="tb-empty">{filtered ? t('Nothing fits this filter.') : t('No photos yet. Add one to an entry.')}</p>
      {/if}
    {:else}
      {#if !shown.length}<p class="tb-empty">{t('Nothing fits this filter.')}</p>{/if}
      {#each months as m (m.month)}
        <section class="tb-month" aria-label={monthName(m.month)}>
          <h2 class="tb-h2">{monthName(m.month)} <small>{tn(m.items.length, '{n} entry', '{n} entries')}</small></h2>
          <div class="tb-list">{#each m.items as e (e.id)}{@render card(e)}{/each}</div>
        </section>
      {/each}
    {/if}

    {#if all.length}
      <p class="tb-foot">{[tn(st.entries, '{n} entry', '{n} entries'), tn(st.days, '{n} day', '{n} days'), tn(st.words, '{n} word', '{n} words'), tn(st.photos, '{n} photo', '{n} photos')].join(' · ')}</p>
    {/if}
  </div>
{/if}

{#if edit}
  <EntrySheet entry={edit.entry} dictate={edit.dictate} {tags} onclose={() => (edit = null)} />
{/if}
{#if settings}
  <Settings {cfg} entries={all} ondownload={downloadAll} onclose={() => (settings = false)} />
{/if}
{#if lightbox}
  <Lightbox list={lightbox.list} start={lightbox.start} onclose={() => (lightbox = null)} />
{/if}

<style>
  .tb {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 880px;
    margin: 0 auto;
    padding-bottom: 32px;
  }
  .tb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .tb-h1 {
    margin: 0;
    font: 700 var(--fs-page) / var(--lh-title) var(--font-title);
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .tb-h2 {
    margin: 8px 0 0;
    font: 700 var(--fs-section) / 1.25 var(--font-title);
  }
  .tb-h2 small {
    font-weight: 400;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .tb-h3 {
    margin: 8px 0 0;
    font-size: var(--fs-sub);
  }
  .tb-sentence {
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 700;
    color: var(--ink-2);
  }
  .tb-ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
  .tb-ic.sm {
    border: 0;
    background: none;
  }
  .tb-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tb-notice {
    margin: 0;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--warn-soft);
    color: var(--ink);
  }
  /* the question of the day: a soft card, the question big */
  .tb-q {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px 20px;
    border-radius: 20px;
    background: var(--accent-soft);
  }
  .tb-q-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .tb-q-kick {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent);
  }
  .tb-q-text {
    margin: 0;
    font-size: var(--fs-section);
    line-height: 1.35;
    font-weight: 600;
    color: var(--ink);
  }
  .tb-mem {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tb-mem-y {
    margin: 0;
    color: var(--ink-3);
    font-weight: 600;
  }
  .tb-bar {
    display: flex;
    justify-content: flex-start;
  }
  .tb-filter {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tb-search {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-3);
  }
  .tb-search .inp {
    flex: 1;
  }
  .tb-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tb-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: none;
    cursor: pointer;
  }
  .tb-chip[aria-pressed='true'] {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .tb-month {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  /* the list: one calm card per entry, the date big on the left like a diary page */
  .tb-list {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--paper);
    overflow: hidden;
  }
  .tb-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 16px;
    color: inherit;
    text-decoration: none;
  }
  .tb-card + :global(.tb-card) {
    border-top: 1px solid var(--line);
  }
  .tb-card:hover {
    background: var(--paper-2);
  }
  .tb-date {
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 44px;
  }
  .tb-date b {
    font-size: var(--fs-section);
    line-height: 1;
    font-weight: 700;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .tb-date small {
    margin-top: 4px;
    font-size: var(--fs-tiny);
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .tb-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .tb-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .tb-title :global(.tb-starmini) {
    flex: none;
    color: var(--warn);
  }
  .tb-prev {
    color: var(--ink-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .tb-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .tb-meta span {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .tb-tagmini {
    color: var(--accent);
  }
  .tb-thumb {
    flex: none;
    width: 72px;
    height: 72px;
    border-radius: 12px;
    object-fit: cover;
  }
  .tb-empty {
    margin: 0;
    color: var(--ink-3);
  }
  .tb-first {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 32px 16px;
    border: 1px dashed var(--line);
    border-radius: 20px;
    text-align: center;
    color: var(--ink-2);
  }
  .tb-first p {
    margin: 0;
  }
  .tb-first-ic {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  /* calendar */
  .tb-cal {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 560px;
  }
  .tb-cal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .tb-cal-head .tb-h2 {
    margin: 0;
    text-transform: capitalize;
  }
  .tb-grid {
    width: 100%;
    border-collapse: separate;
    border-spacing: 4px;
    table-layout: fixed;
  }
  .tb-grid th {
    font-size: var(--fs-tiny);
    font-weight: 600;
    color: var(--ink-3);
    text-transform: uppercase;
  }
  .tb-grid td {
    padding: 0;
  }
  .tb-day {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1;
    min-height: 40px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 12px;
    background: var(--paper);
    background-size: cover;
    background-position: center;
    color: var(--ink-2);
    font: inherit;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .tb-day.has {
    background-color: var(--accent-soft);
    color: var(--ink);
    font-weight: 700;
  }
  .tb-day.ph span {
    padding: 0 6px;
    border-radius: 999px;
    background: var(--paper);
  }
  .tb-day i {
    width: 6px;
    height: 6px;
    margin-top: 3px;
    border-radius: 999px;
    background: var(--accent);
  }
  .tb-day.today {
    border-color: var(--accent);
  }
  .tb-day.picked {
    outline: 3px solid var(--accent);
    outline-offset: 1px;
  }
  /* photo wall */
  .tb-wall {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 6px;
  }
  @media (max-width: 600px) {
    .tb-wall {
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }
  }
  .tb-wall-item {
    position: relative;
    display: block;
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
  }
  .tb-wall-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .tb-wall-item small {
    position: absolute;
    left: 6px;
    bottom: 6px;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-tiny);
  }
  .tb-foot {
    margin: 8px 0 0;
    text-align: center;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* reading one entry */
  .tb-article {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 720px;
  }
  .tb-kick {
    margin: 0;
    color: var(--accent);
    font-weight: 600;
  }
  .tb-h1 :global(.tb-starbig) {
    margin-left: 8px;
    vertical-align: middle;
    color: var(--warn);
  }
  .tb-askq {
    margin: 0;
    padding-left: 12px;
    border-left: 3px solid var(--accent);
    color: var(--ink-2);
    font-style: italic;
  }
  .tb-metabig {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
    color: var(--ink-3);
  }
  .tb-metabig span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .tb-gal {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 6px;
  }
  .tb-gal.one {
    grid-template-columns: 1fr;
  }
  .tb-galbtn {
    padding: 0;
    border: 0;
    border-radius: 14px;
    overflow: hidden;
    background: none;
    cursor: zoom-in;
    aspect-ratio: 1;
  }
  .tb-gal.one .tb-galbtn {
    aspect-ratio: auto;
    max-height: 480px;
  }
  .tb-galbtn img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .tb-body {
    font-size: var(--fs-sub);
    line-height: 1.7;
    color: var(--ink);
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  .tb-pager {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
</style>
