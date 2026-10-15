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
   * SN3 «Seiten neu» (Noah 13.10.2026 «ich gebe alle bild mockups frei», answer 3a): the gallery is gone.
   * The head with its path and «Neue Vorlage», one calm list «Deine Vorlagen» (last used first), each
   * row with «Neue Tour» and «…» (edit, duplicate, keep, archive, delete). On the side «Aus deinen
   * Touren»: a planned or rated trip can be saved as a template right here; a completed trip waits for
   * its debrief («Bewerten»).
   */
  import { liveQuery } from 'dexie';
  import { Archive, Plus, Backpack, Ellipsis, Tent, BedDouble, Bike, Mountain, Pencil, Copy, Trash2, Route, Undo2, Check, Star } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Section from '../lib/ui/Section.svelte';
  import '../lib/ui/daumen.css'; // FE1
  import Btn from '../lib/ui/Btn.svelte';
  import MoreActions from '../lib/ui/MoreActions.svelte';
  import TripState from '../lib/ui/TripState.svelte';
  import TemplateDialog from '../lib/pack/TemplateDialog.svelte';
  import { tripStates } from '../lib/tripstate.js';
  import { offer } from '../lib/tpl/toast.svelte.js';
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
  import { lineOf, tripSources } from '../lib/tpl/view.js';
  import { tplByBike } from '../lib/templates.js';
  import TemplateEdit from './TemplateEdit.svelte';
  import TemplateNew from './TemplateNew.svelte';
  import { t, tn } from '../lib/i18n.svelte.js';

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
  const ridesQ = liveQuery(() => db.rides.toArray());
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
  const weight = (w) => (w.n ? knownWeight(w.g, w.missing) : '–');
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
  const open = (tp) => (location.hash = `#/pack/templates/${encodeURIComponent(tp.id)}`);
  // SN3: «…» of a row (ui/MoreActions): edit, duplicate, keep (a long unused one), archive or bring back, delete.
  const actionsOf = (r) => {
    const tp = r.tp ?? r;
    return [
      ...(tp.archivedAt ? [{ name: t('Bring back'), icon: Undo2, run: () => restore(tp) }] : [{ name: t('New trip'), icon: Route, run: () => start(tp) }]),
      { name: t('Edit|template'), explain: t('Blocks, single items, bike and days'), icon: Pencil, run: () => open(tp) },
      { name: t('Duplicate'), icon: Copy, run: () => duplicate(tp) },
      ...(r.stale ? [{ name: t('Keep'), explain: t('No hint for 12 months'), icon: Check, run: () => keep(tp) }] : []),
      ...(tp.archivedAt ? [] : [{ name: t('Archive'), explain: t('Not offered for new trips any more; nothing is deleted'), icon: Archive, run: () => archive(tp) }]),
      { name: t('Delete'), icon: Trash2, run: () => remove(tp) },
    ];
  };
  // SN3: the icon of a template: the night it brings, else the bike or the backpack of its area.
  const iconOf = (tp) => (tp.overnight === 'outdoor' ? Tent : tp.overnight === 'lodging' ? BedDouble : tplByBike(tp) ? Bike : Backpack);
  const monthsSince = (iso) => (iso ? Math.max(12, Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${iso.slice(0, 10)}T12:00:00Z`)) / (30.44 * 864e5))) : 12);

  /* ---------- SN3 «Aus deinen Touren»: save a planned or rated trip as a template ---------- */
  const infos = $derived(tripStates(trips, { debriefs: $debriefsQ ?? [], rides: $ridesQ ?? [], today }));
  const sources = $derived(tripSources(trips, infos, all, today));
  let saving = $state(null); // the trip whose «Save as template» window is open
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

{#if isNew}
  <TemplateNew area={newArea} />
{:else if editId}
  <TemplateEdit id={editId} />
{:else}
  <div class="tpls">
    <PathHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} title={t('Templates')} sub={[active.length ? tn(active.length, '{n} template', '{n} templates') : '', t('Building blocks plus single items, so the next trip starts packed')].filter(Boolean).join(' · ')}>
      <!-- SN3: one main button; with no template yet the empty card below carries it -->
      <!-- FE1: on a phone «New template» sits at the bottom, in reach of the thumb -->
      <span class="daumen"><Btn kind={rows.length || archived.length ? 'hi' : 'normal'} icon={Plus} label={t('New template')} href={newHref} /></span>
    </PathHead>

    {#if showSwitch}
      <div class="areas">
        <span class="albl" id="tpl-area">{t('Area')}</span>
        <div class="chips" role="group" aria-labelledby="tpl-area">
          {#each areas as a (a.key)}<button type="button" class="chip" aria-pressed={area === a.key} onclick={() => pickArea(a.key)}>{t(domainName(a.key))}<small class="num">{a.n}</small></button>{/each}
          <button type="button" class="chip" aria-pressed={area === 'all'} onclick={() => pickArea('all')}>{t('All|areas')}<small class="num">{active.length}</small></button>
        </div>
      </div>
    {/if}

    <div class="cols">
      <div class="mainc">
        {#if rows.length}
          <Section title={t('Your templates')} sub={t('last used first')} id="tpl-all-h">
            <ul class="card slist">
              {#each rows as r (r.tp.id)}
                {@const Icon = iconOf(r.tp)}
                <li class="srow row" data-tpl={r.tp.id}>
                  <span class="sib" class:ok={!r.stale} class:warn={r.stale} aria-hidden="true"><Icon size={18} /></span>
                  <a class="sm main" href="#/pack/templates/{encodeURIComponent(r.tp.id)}">
                    <b>{r.tp.name}</b>
                    <small>{[r.line, r.w.n ? tn(r.w.n, '{n} item', '{n} items') : '', weight(r.w), r.stale ? `${t('long not used')} (${tn(monthsSince(r.use.last ?? r.tp.createdAt), '{n} month', '{n} months')})` : ''].filter(Boolean).join(' · ')}</small>
                    {#if r.hints}<span class="spill"><i class="pill">{tn(r.hints, '{n} suggestion', '{n} suggestions')}</i></span>{/if}
                  </a>
                  <span class="rowacts">
                    <Btn label={t('New trip')} explain={t('New trip from it')} onclick={() => start(r.tp)} />
                    <MoreActions title={r.tp.name} label={t('More for {name}', { name: r.tp.name })} actions={actionsOf(r)} />
                  </span>
                </li>
              {/each}
            </ul>
            <p class="shint"><Ellipsis size={16} aria-hidden="true" /><span>{t('Under «…»: edit, duplicate, archive. Trips made from a template stay, also when it is gone.')}</span></p>
          </Section>
        {:else if !archived.length}
          <!-- v0.127.0 A-U2: the one empty building block -->
          <Empty icon={Backpack} title={t('No templates yet.')} text={t('A template is building blocks plus single items, so the next trip starts packed.')} action={{ label: t('As template|save'), onclick: saveCurrent, explain: t('Save the current trip as a template') }} />
        {/if}
      </div>

      <aside class="side">
        {#if sources.length}
          <Section title={t('From your trips')} sub={t('only from Planned or Rated')} id="tpl-src-h">
            <ul class="card slist">
              {#each sources as s (s.trip.id)}
                <li class="srow" data-src={s.trip.id}>
                  <span class="sib {s.state}" aria-hidden="true">{#if s.state === 'plan'}<Pencil size={18} />{:else if s.state === 'rated'}<Star size={18} />{:else}<Mountain size={18} />{/if}</span>
                  <span class="sm">
                    <b>{s.trip.title}</b>
                    <small>{s.state === 'done' ? t('possible after the debrief') : [tn(s.trip.entries?.length ?? 0, '{n} item', '{n} items'), s.state === 'plan' ? t('as planned') : t('as ridden')].join(' · ')}</small>
                    <span class="spill"><TripState state={s.state} /></span>
                  </span>
                  <span class="rowacts">
                    {#if s.state === 'done'}<Btn kind="quiet" label={t('Debrief')} href="#/debrief/{encodeURIComponent(s.trip.id)}" explain={t('Open the debrief')} />
                    {:else}<Btn icon={Plus} label={t('Save|template')} explain={t('Save {name} as a template', { name: s.trip.title })} onclick={() => (saving = s.trip)} />{/if}
                  </span>
                </li>
              {/each}
            </ul>
          </Section>
        {/if}
        {#if archived.length}
          <Section title={t('Archived')} sub={t('{n} · not offered in «New trip»', { n: archived.length })} id="tpl-arch-h">
            <ul class="card slist">
              {#each archived as tp (tp.id)}
                <li class="srow row arch">
                  <span class="sib" aria-hidden="true"><Archive size={18} /></span>
                  <a class="sm main" href="#/pack/templates/{encodeURIComponent(tp.id)}"><b>{tp.name}</b><small>{lineOf(tp, setsValue)}</small></a>
                  <span class="rowacts">
                    <Btn kind="quiet" label={t('Bring back')} onclick={() => restore(tp)} />
                    <MoreActions title={tp.name} label={t('More for {name}', { name: tp.name })} actions={actionsOf(tp)} />
                  </span>
                </li>
              {/each}
            </ul>
          </Section>
        {/if}
      </aside>
    </div>
  </div>
{/if}
{#if saving}
  <TemplateDialog trip={saving} templates={all} onclose={() => (saving = null)} onsaved={(name) => offer(t('Saved as template "{name}".', { name }))} />
{/if}
<Toast />

<style>
  .tpls {
    max-width: 1240px;
  }
  .areas {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    margin: 0 0 var(--sp-5);
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
  .cols {
    display: grid;
    gap: var(--sp-5);
  }
  @media (min-width: 1100px) {
    .cols {
      grid-template-columns: minmax(0, 1fr) 420px;
      align-items: start;
    }
  }
  .mainc,
  .side {
    display: grid;
    gap: var(--sp-5);
    min-width: 0;
  }
  .main {
    display: block;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
  }
  .arch .main small {
    color: var(--ink-3);
  }
</style>
