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
   * v0.102.0 Design-Refresh P4 «Touren» (T24, approved 12.10.2026 «T24 ok»): the new look. The sentence
   * with «Neue Vorlage», the areas as chips, «Deine Vorlagen» as a gallery (the three used last), «Alle
   * Vorlagen» as rows in a card, each with «Neue Tour» in sight and •••; on the side «Aus der aktuellen
   * Tour» (save it as a template) and the archived ones with «Zurückholen».
   */
  import { liveQuery } from 'dexie';
  import { Archive, Plus, Backpack, ChevronRight, Ellipsis } from '@lucide/svelte';
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
  const lastUsed = $derived(rows.find((r) => r.use.n) ?? null);
  // the trip Pack opens (the one chosen last on this device, else the next one): «save it as a template»
  const current = $derived.by(() => {
    let id = null;
    try {
      id = localStorage.getItem('pack.currentTrip');
    } catch {
      /* private mode */
    }
    const live = trips.filter((x) => !x.skipped && x.entries?.length);
    return live.find((x) => x.id === id) ?? live.filter((x) => (x.startDate ?? '') >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
  });
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
      if (current) localStorage.setItem('pack.currentTrip', current.id);
    } catch {
      /* private mode: Pack opens without the dialog */
    }
    location.hash = '#/pack';
  }
</script>

{#snippet art(n)}
  <!-- v0.102.0 P4 (T24): the gallery picture (the same three calm tints as in «Neue Tour») -->
  <svg class="art t{n % 3}" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><rect width="120" height="40" class="sky" /><circle cx="94" cy="11" r="5" class="sun" /><path d="M0 34 L22 16 L38 28 L60 8 L80 26 L96 18 L120 32 L120 40 L0 40 Z" class="m1" /><path d="M0 40 L0 32 L26 24 L52 33 L78 25 L120 34 L120 40 Z" class="m2" /></svg>
{/snippet}

{#if isNew}
  <TemplateNew area={newArea} />
{:else if editId}
  <TemplateEdit id={editId} />
{:else}
  <div class="tpls">
    <div class="head">
      <h1 class="title big">{t('Templates')}</h1>
    </div>
    <div class="cols">
      <div class="mainc">
        <div class="intro">
          <p class="lead">{t('A template is building blocks plus single items, so the next trip starts packed.')}</p>
          <a class="btn hi new" href={newHref}><Plus size={18} aria-hidden="true" /> {t('New template')}</a>
        </div>

        {#if showSwitch}
          <div class="areas">
            <span class="albl" id="tpl-area">{t('Area')}</span>
            <div class="chips" role="group" aria-labelledby="tpl-area">
              {#each areas as a (a.key)}<button type="button" class="chip" aria-pressed={area === a.key} onclick={() => pickArea(a.key)}>{t(domainName(a.key))}<small class="num">{a.n}</small></button>{/each}
              <button type="button" class="chip" aria-pressed={area === 'all'} onclick={() => pickArea('all')}>{t('All|areas')}<small class="num">{active.length}</small></button>
            </div>
          </div>
        {/if}

        {#if rows.length}
          <section class="sect" aria-labelledby="tpl-gal-h">
            <h2 class="sh" id="tpl-gal-h">{t('Your templates')}</h2>
            <p class="ss">{[tn(rows.length, '{n} active', '{n} active'), lastUsed ? t('last {name}', { name: lastUsed.tp.name }) : ''].filter(Boolean).join(' · ')}</p>
            <div class="card galc">
              <ul class="gal">
                {#each rows.slice(0, 3) as r, n (r.tp.id)}
                  <li><a class="gcard" href="#/pack/templates/{encodeURIComponent(r.tp.id)}">{@render art(n)}<b>{r.tp.name}</b><small>{[tn(r.w.n, '{n} item', '{n} items'), weight(r.w)].join(' · ')}</small></a></li>
                {/each}
              </ul>
              {#if lastUsed}<p class="gl">{t('Last used: {name}', { name: lastUsed.tp.name })}{lastUsed.use.trips[0]?.title ? ` (${lastUsed.use.trips[0].title})` : ''}</p>{/if}
            </div>
          </section>

          <section class="sect" aria-labelledby="tpl-all-h">
            <h2 class="sh" id="tpl-all-h">{t('All templates')}</h2>
            <ul class="list card">
              {#each rows as r (r.tp.id)}
                <li class="row" data-tpl={r.tp.id}>
                  <span class="ic" aria-hidden="true"><Backpack size={16} /></span>
                  <a class="main" href="#/pack/templates/{encodeURIComponent(r.tp.id)}">
                    <span class="nm">{r.tp.name}</span>
                    <span class="comp">{[r.line, weight(r.w), r.use.n ? useLine(r.use) : ''].filter(Boolean).join(' · ')}{#if r.hints}<i class="pill">{tn(r.hints, '{n} suggestion', '{n} suggestions')}</i>{/if}</span>
                  </a>
                  <span class="acts">
                    {#if r.stale}<i class="pill warn">{t('long not used')}</i>{:else if !r.use.n}<i class="never">{t('not used yet')}</i>{/if}
                    <button type="button" class="btn sm" onclick={() => start(r.tp)}>{t('New trip')}</button>
                    <Menu label={t('More for {name}', { name: r.tp.name })} actions={menuOf(r.tp)} onpick={(k) => pick(r.tp, k)} />
                  </span>
                  {#if r.stale}
                    <div class="stale">
                      <Archive size={16} aria-hidden="true" /><span>{t('«{name}» long not used: keep or archive. Nothing is deleted.', { name: r.tp.name })}</span>
                      <button type="button" class="lnk" onclick={() => keep(r.tp)}>{t('Keep')}</button>
                      <button type="button" class="lnk" onclick={() => archive(r.tp)}>{t('Archive')}</button>
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
          </section>
        {:else if !archived.length}
          <div class="card empty">
            <b>{t('No templates yet.')}</b>
            <p>{t('A template is building blocks plus single items, so the next trip starts packed.')}</p>
            <button type="button" class="btn" onclick={saveCurrent} data-explain={t('Save the current trip as a template')}>{t('As template|save')}</button>
          </div>
        {/if}
      </div>

      <aside class="side">
        {#if current}
          <section class="sect" aria-labelledby="tpl-cur-h">
            <h2 class="sh" id="tpl-cur-h">{t('From the current trip')}</h2>
            <button type="button" class="card saverow" onclick={saveCurrent}>
              <span class="ic" aria-hidden="true"><Plus size={16} /></span>
              <span class="st"><b>{t('Save {name} as a template', { name: current.title })}</b><small>{tn(current.entries?.length ?? 0, '{n} item', '{n} items')}</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </section>
        {/if}
        {#if archived.length}
          <section class="sect" aria-labelledby="tpl-arch-h">
            <h2 class="sh" id="tpl-arch-h">{t('Archived')}</h2>
            <p class="ss">{t('{n} · not offered in «New trip»', { n: archived.length })}</p>
            <ul class="list card">
              {#each archived as tp (tp.id)}
                <li class="row arch">
                  <span class="ic" aria-hidden="true"><Archive size={16} /></span>
                  <a class="main" href="#/pack/templates/{encodeURIComponent(tp.id)}"><span class="nm">{tp.name}</span><span class="comp">{lineOf(tp, setsValue)}</span></a>
                  <span class="acts">
                    <button type="button" class="btn sm btn-link" onclick={() => restore(tp)}>{t('Bring back')}</button>
                    <Menu label={t('More for {name}', { name: tp.name })} actions={menuOf(tp)} onpick={(k) => pick(tp, k)} />
                  </span>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
        <p class="hint"><Ellipsis size={16} aria-hidden="true" /><span>{t('In the menu of every template: duplicate, archive, delete. Trips made from a template stay, also when it is deleted.')}</span></p>
      </aside>
    </div>
  </div>
{/if}
<Toast />

<style>
  .tpls {
    max-width: 1240px;
  }
  .head h1 {
    margin: 0;
  }
  .big {
    font-size: var(--fs-page);
    line-height: var(--lh-title);
  }
  .cols {
    display: grid;
    gap: var(--sp-5);
    margin-top: var(--sp-4);
  }
  @media (min-width: 1100px) {
    .cols {
      grid-template-columns: minmax(0, 1fr) 400px;
      align-items: start;
    }
  }
  .mainc,
  .side {
    display: grid;
    gap: var(--sp-5);
    min-width: 0;
  }
  .intro {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-3) var(--sp-4);
  }
  .lead {
    flex: 1 1 280px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-body);
    line-height: 1.45;
  }
  .new {
    flex: none;
  }
  .areas {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
  }
  .albl {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .chip small {
    font-weight: 400;
    opacity: 0.8;
  }
  .sh {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .ss {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sh + .card,
  .ss + .card {
    margin-top: var(--sp-2);
  }
  .galc {
    display: grid;
    gap: var(--sp-3);
  }
  .gal {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .gcard {
    display: grid;
    gap: 2px;
    height: 100%;
    padding: 0 0 var(--sp-2);
    overflow: hidden;
    border-radius: var(--r-ctl);
    color: var(--ink);
    text-decoration: none;
  }
  .gcard:hover b {
    text-decoration: underline;
  }
  .gcard b,
  .gcard small {
    padding: 0 var(--sp-2);
    overflow-wrap: break-word;
  }
  .gcard b {
    margin-top: 6px;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .gcard small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .art {
    display: block;
    width: 100%;
    height: 64px;
    border-radius: var(--r-ctl);
  }
  .art .sky {
    fill: var(--hi-soft);
  }
  .art .sun {
    fill: var(--paper);
  }
  .art .m1 {
    fill: var(--l3);
    opacity: 0.55;
  }
  .art .m2 {
    fill: var(--hi);
  }
  .art.t1 .sky {
    fill: var(--info-soft);
  }
  .art.t1 .m2 {
    fill: var(--ink-3);
  }
  .art.t2 .sky {
    fill: var(--warn-soft);
  }
  .art.t2 .m1 {
    fill: var(--l2);
  }
  .art.t2 .m2 {
    fill: var(--warn);
  }
  .gl {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .list {
    margin: 0;
    padding: 0 var(--sp-4);
    list-style: none;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    min-height: 64px;
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .row:first-child {
    border-top: 0;
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .main {
    display: grid;
    flex: 1 1 200px;
    gap: 2px;
    min-width: 0;
    min-height: 44px;
    align-content: center;
    color: var(--ink);
    text-decoration: none;
  }
  .main:hover .nm {
    text-decoration: underline;
  }
  .nm {
    font-size: var(--fs-body);
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .comp {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .comp .pill {
    margin-left: var(--sp-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 4px var(--sp-2);
    margin-left: auto;
  }
  .never {
    color: var(--ink);
    font-size: var(--fs-tiny);
    font-style: normal;
    font-weight: 600;
  }
  .stale {
    display: flex;
    flex: 1 1 100%;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .stale span {
    flex: 1 1 200px;
    margin-right: auto;
  }
  .lnk {
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .arch .comp {
    color: var(--ink-3);
  }
  .saverow {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 64px;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .st {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .st b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .st small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint {
    display: flex;
    gap: var(--sp-2);
    margin: 0;
    padding: 0 var(--sp-3);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .hint :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .empty {
    display: grid;
    gap: 6px;
    justify-items: start;
  }
  .empty p {
    margin: 0;
    color: var(--ink-2);
  }
</style>
