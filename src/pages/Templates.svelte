<script>
  /**
   * Templates (Noah, 4.10.2026, answer 9): all saved packing setups on their own page.
   * v0.39.0 (AP28, "Vorlagen neu"): one quiet row per template (no box), linked to the building
   * blocks (3a). Noah's choices:
   *   2a  the row: name and weight, "Standard + Rain + 2 extra", quietly "last 5 Oct · 4 trips";
   *   4a/5a  the area switch on top, only areas with templates plus All, remembered per device;
   *   6a  "long not used" after 12 months, with Archive (Undo) and Keep (12 months rest, Q6a);
   *   8a  "New trip" in the ••• (phone) and on hover or focus (computer); always inside the template.
   * Desktop: a table with Weight, Last, Trips (the header once). Archived templates fold away below.
   * #/pack/templates/new opens the 3 steps of a new template, #/pack/templates/<id> one template.
   */
  import { liveQuery } from 'dexie';
  import { Archive, Plus, Route } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY, saveTemplates, templateUse, isStale, templateAreas, tplDomain, templateWeight, duplicateTemplate, freeName } from '../lib/templates.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { knownWeight } from '../lib/gear.js';
  import { domainName } from '../lib/domains.js';
  import { templateHints } from '../lib/debrief.js';
  import { changeTemplates } from '../lib/tpl/toast.svelte.js';
  import Toast from '../lib/tpl/Toast.svelte';
  import { newTrip } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { lineOf } from '../lib/tpl/view.js';
  import Menu from '../lib/tpl/Menu.svelte';
  import TemplateEdit from './TemplateEdit.svelte';
  import TemplateNew from './TemplateNew.svelte';
  import { t, tn, locale } from '../lib/i18n.svelte.js';

  // #/pack/templates/<id> opens one template; #/pack/templates/new?area=… a new one.
  let hash = $state(location.hash);
  $effect(() => {
    const update = () => (hash = location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  });
  const sub = $derived(decodeURIComponent(hash.split('/')[3] ?? ''));
  const editId = $derived(sub.startsWith('new') ? '' : sub);
  const isNew = $derived(sub === 'new' || sub.startsWith('new?'));
  const newArea = $derived(new URLSearchParams(sub.split('?')[1] ?? '').get('area'));

  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const all = $derived($tplQ?.value ?? []);
  const items = $derived($itemsQ ?? []);
  const setsValue = $derived($setsQ?.value ?? []);
  const trips = $derived($tripsQ ?? []);
  const today = localDay();

  // Noah 5a: only the areas that have templates, plus All; the choice is remembered on this device.
  const AREA_KEY = 'templates.area';
  const areas = $derived(templateAreas(all));
  let picked = $state(readArea());
  function readArea() {
    try {
      return localStorage.getItem(AREA_KEY) || '';
    } catch {
      return '';
    }
  }
  function pickArea(key) {
    picked = key;
    try {
      localStorage.setItem(AREA_KEY, key);
    } catch {
      /* private mode: the choice lasts until the page closes */
    }
  }
  const area = $derived(picked === 'all' || areas.some((a) => a.key === picked) ? picked : (areas.find((a) => a.key === 'bikepacking') ?? areas[0])?.key ?? 'all');
  const showSwitch = $derived(areas.length > 1);
  const active = $derived(all.filter((x) => !x.archivedAt));
  const archived = $derived(all.filter((x) => x.archivedAt).sort((a, b) => a.name.localeCompare(b.name)));

  // One row per template: the last use first (Noah 7a: trips started or ridden), never used ones last.
  const rows = $derived(
    active
      .filter((x) => !showSwitch || area === 'all' || tplDomain(x) === area)
      .map((tp) => {
        const use = templateUse(tp, trips, today);
        const w = templateWeight(tp, items, setsValue);
        const hints = templateHints(tp, trips, $debriefsQ ?? [], items).length;
        return { tp, use, w, hints, line: lineOf(tp, setsValue), stale: isStale(tp, trips, today) };
      })
      .sort((a, b) => (b.use.last ?? '').localeCompare(a.use.last ?? '') || (b.tp.createdAt ?? '').localeCompare(a.tp.createdAt ?? '') || a.tp.name.localeCompare(b.tp.name)),
  );
  const day = (iso) => {
    if (!iso) return '';
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString(locale(), { day: 'numeric', month: 'short', ...(iso.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}) });
  };
  const weight = (w) => (w.n ? knownWeight(w.g, w.missing) : '–');
  const useLine = (use) => (use.n ? `${t('last {date}', { date: day(use.last) })} · ${tn(use.n, '{n} trip', '{n} trips')}` : t('not used yet'));
  const newHref = $derived(`#/pack/templates/new${showSwitch && area !== 'all' ? `?area=${area}` : areas.length === 1 ? `?area=${areas[0].key}` : ''}`);

  /* ---------- actions, each with Undo for a few seconds (tpl/toast.svelte.js) ---------- */
  const change = (fn, text) => changeTemplates(fn, text);
  const now = () => new Date().toISOString();
  const setOne = (id, patch) => (list) => list.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x));
  const archive = (tp) => change(setOne(tp.id, { archivedAt: now() }), t('{name} archived', { name: tp.name }));
  const restore = (tp) => change(setOne(tp.id, { archivedAt: null, keptAt: now() }), t('{name} is back', { name: tp.name }));
  const keep = (tp) => change(setOne(tp.id, { keptAt: now() }), t('{name} kept. No hint for 12 months.', { name: tp.name }));
  async function remove(tp) {
    if (!confirm(t('Delete the template "{name}"? Trips made from it stay. A backup file can bring it back.', { name: tp.name }))) return;
    await change((list) => list.filter((x) => x.id !== tp.id), t('{name} deleted', { name: tp.name }));
  }
  async function duplicate(tp) {
    const id = `tpl-${Date.now().toString(36)}`;
    await change((list) => [...list, duplicateTemplate(tp, { id, name: freeName(t('{name} copy', { name: tp.name }), list), now: now() })], t('Copy made'));
    location.hash = `#/pack/templates/${encodeURIComponent(id)}`;
  }
  const start = (tp) => newTrip(tp.id);
  function pick(tp, key) {
    if (key === 'trip') start(tp);
    if (key === 'dup') duplicate(tp);
    if (key === 'archive') archive(tp);
    if (key === 'restore') restore(tp);
    if (key === 'delete') remove(tp);
  }
  const menuOf = (tp) => [
    ...(tp.archivedAt ? [{ key: 'restore', label: t('Bring back') }] : [{ key: 'trip', label: t('New trip') }]),
    { key: 'dup', label: t('Duplicate') },
    ...(tp.archivedAt ? [] : [{ key: 'archive', label: t('Archive') }]),
    { key: 'delete', label: t('Delete'), bad: true },
  ];
  // Design audit T2: from the empty page straight to "Save as template" on Pack.
  function saveCurrent() {
    try {
      localStorage.setItem('pack.saveTemplate', '1');
    } catch {
      /* private mode: Pack opens without the dialog */
    }
    location.hash = '#/pack';
  }
</script>

{#if isNew}
  <TemplateNew area={newArea} />
{:else if editId}
  <TemplateEdit id={editId} />
{:else}
  <div class="tpls">
    <p class="back"><a href="#/pack">← {t('Trips|place')}</a></p>
    <div class="head">
      <h1 class="title big">{t('Templates')}</h1>
      <a class="btn hi new" href={newHref}><Plus size={18} aria-hidden="true" /> {t('New template')}</a>
    </div>
    <p class="lead">{t('Building blocks plus single items. Change a building block and the templates change with it.')}</p>

    {#if showSwitch}
      <div class="seg" role="group" aria-label={t('Area')}>
        {#each areas as a (a.key)}<button type="button" aria-pressed={area === a.key} onclick={() => pickArea(a.key)}>{t(domainName(a.key))}<small class="num">{a.n}</small></button>{/each}
        <button type="button" aria-pressed={area === 'all'} onclick={() => pickArea('all')}>{t('All|areas')}<small class="num">{active.length}</small></button>
      </div>
    {/if}

    {#if rows.length}
      <div class="thead" aria-hidden="true"><span>{t('Template')}</span><span class="r">{t('Weight')}</span><span class="r">{t('Last')}</span><span class="r">{t('Trips|place')}</span><span></span></div>
      <ul class="list">
        {#each rows as r (r.tp.id)}
          <li class="row" data-tpl={r.tp.id}>
            <a class="main" href="#/pack/templates/{encodeURIComponent(r.tp.id)}">
              <span class="l1"><span class="nm">{r.tp.name}</span><span class="w num ph">{weight(r.w)}</span></span>
              <span class="comp">{r.line}{#if r.hints}<i class="badge">{tn(r.hints, '{n} suggestion', '{n} suggestions')}</i>{/if}</span>
              <span class="use num ph">{useLine(r.use)}</span>
            </a>
            <span class="c-w num dk">{weight(r.w)}</span>
            <span class="c-last num dk">{r.use.n ? day(r.use.last) : '–'}</span>
            <span class="c-n num dk">{r.use.n}</span>
            <span class="acts">
              <button type="button" class="btn sm dk" onclick={() => start(r.tp)}><Route size={16} aria-hidden="true" /> {t('New trip')}</button>
              <Menu label={t('More for {name}', { name: r.tp.name })} actions={menuOf(r.tp)} onpick={(k) => pick(r.tp, k)} />
            </span>
            {#if r.stale}
              <div class="stale">
                <Archive size={16} aria-hidden="true" /><span>{t('long not used')}</span>
                <button type="button" class="lnk" onclick={() => keep(r.tp)}>{t('Keep')}</button>
                <button type="button" class="lnk" onclick={() => archive(r.tp)}>{t('Archive')}</button>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else if !archived.length}
      <div class="empty">
        <b>{t('No templates yet.')}</b>
        <p>{t('A template is building blocks plus single items, so the next trip starts packed.')}</p>
        <button type="button" class="btn" onclick={saveCurrent}>{t('Save the current trip as a template')}</button>
      </div>
    {/if}

    {#if archived.length}
      <details class="fold">
        <summary>{t('Archived')} <small class="num">{archived.length}</small></summary>
        <p class="note">{t('Archived templates are not offered in "New trip". Nothing is deleted.')}</p>
        <ul class="list">
          {#each archived as tp (tp.id)}
            <li class="row arch">
              <a class="main" href="#/pack/templates/{encodeURIComponent(tp.id)}"><span class="l1"><span class="nm">{tp.name}</span></span><span class="comp">{lineOf(tp, setsValue)}</span></a>
              <span class="acts">
                <button type="button" class="btn sm" onclick={() => restore(tp)}>{t('Bring back')}</button>
                <Menu label={t('More for {name}', { name: tp.name })} actions={menuOf(tp)} onpick={(k) => pick(tp, k)} />
              </span>
            </li>
          {/each}
        </ul>
      </details>
    {/if}
  </div>
{/if}
<Toast />

<style>
  .tpls {
    max-width: 1040px;
  }
  .back {
    margin: 0;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    margin: 4px 0;
  }
  .head h1 {
    flex: 1 1 auto;
    min-width: 0;
  }
  .big {
    font-size: var(--fs-page);
    line-height: var(--lh-title);
  }
  .new {
    min-height: 44px;
  }
  .lead {
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: 15px;
    max-width: 60ch;
  }
  /* Segmented toggle (Noah 4a/5a). */
  .seg {
    display: inline-flex;
    flex-wrap: wrap;
    max-width: 100%;
    margin: 16px 0 4px;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    overflow: hidden;
  }
  .seg button {
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-right: 1.5px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink);
    font: 600 15px var(--font-body);
    cursor: pointer;
  }
  .seg button:last-child {
    border-right: 0;
  }
  .seg button[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .seg small {
    margin-left: 5px;
    font-weight: 500;
    opacity: 0.8;
  }
  /* One row per template, no box per row. */
  .thead {
    display: none;
  }
  .list {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    border-top: 1px solid var(--line);
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 8px;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .main {
    min-width: 0;
    display: grid;
    gap: 2px;
    text-decoration: none;
    color: var(--ink);
    min-height: 44px;
  }
  .main:visited {
    color: var(--ink);
  }
  .l1 {
    display: flex;
    gap: 8px;
    align-items: baseline;
  }
  .nm {
    font-weight: 600;
    font-size: 16px;
    overflow-wrap: anywhere;
    flex: 1;
    min-width: 0;
  }
  .w {
    text-align: right;
    white-space: nowrap;
    font-size: 15px;
  }
  .comp {
    font-size: 15px;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .use {
    font-size: 14px;
    color: var(--ink-3);
  }
  .badge {
    display: inline-block;
    margin-left: 8px;
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .acts {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: flex-end;
  }
  .dk {
    display: none;
  }
  .stale {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    font-size: 14px;
    color: var(--ink-3);
  }
  .stale span {
    margin-right: auto;
  }
  .lnk {
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 14px var(--font-body);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .arch .comp {
    color: var(--ink-3);
  }
  .fold {
    margin-top: 16px;
  }
  .fold summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--ink-2);
    cursor: pointer;
  }
  .fold summary small {
    color: var(--ink-3);
  }
  .note {
    margin: 0 0 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .empty {
    margin-top: 16px;
    display: grid;
    gap: 6px;
    justify-items: start;
  }
  .empty p {
    margin: 0;
    color: var(--ink-2);
  }
  @media (min-width: 720px) {
    .thead {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 90px 120px 70px 180px;
      gap: 12px;
      margin-top: 12px;
      font-size: 13px;
      font-weight: 700;
      color: var(--ink-3);
      padding: 0 8px 4px;
    }
    .thead .r {
      text-align: right;
    }
    .thead + .list {
      margin-top: 0;
      border-top: 1px solid var(--line-strong);
    }
    .row {
      grid-template-columns: minmax(0, 1fr) 90px 120px 70px 180px;
      gap: 4px 12px;
      padding: 6px 8px;
      min-height: 56px;
    }
    .row.arch {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .row:hover,
    .row:focus-within {
      background: var(--paper);
    }
    .ph {
      display: none;
    }
    .dk {
      display: inline-flex;
    }
    .c-w,
    .c-last,
    .c-n {
      justify-content: flex-end;
      font-size: 15px;
    }
    .c-last,
    .c-n {
      color: var(--ink-2);
    }
    /* Row actions: quiet, full on hover and on keyboard focus. */
    .row:not(.arch) .acts {
      opacity: 0;
    }
    .row:hover .acts,
    .row:focus-within .acts {
      opacity: 1;
    }
  }
  /* A touch screen has no hover: the ••• stays visible. */
  @media (hover: none) {
    .row .acts {
      opacity: 1 !important;
    }
  }
</style>
