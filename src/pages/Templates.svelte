<script>
  /**
   * Templates (Noah, 4.10.2026, answer 9): all saved packing setups on their own page.
   * Rename, see what is in them, start a new trip from one, or delete one.
   * What is inside a template changes from a trip: open a trip made from it and press
   * "Save as template" → "Update" (answer 7a).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY, saveTemplates } from '../lib/templates.js';
  import { NIGHT_SETS, newTrip } from '../lib/trips.js';
  import { SETS_KEY, allSets, templateBlocks, blocksLine, blockLabel } from '../lib/sets.js';
  import { RIDES } from '../lib/layers.js';
  import { templateHints, applyTemplateHint, rejectTemplateHint, TEMPLATE_AFTER, REJECT_FOR } from '../lib/debrief.js';
  import TemplateEdit from './TemplateEdit.svelte';
  import { t, tn, locale } from '../lib/i18n.svelte.js';

  // #/pack/templates/<id> opens the editor for one template (answer 7b).
  let hash = $state(location.hash);
  $effect(() => {
    const update = () => (hash = location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  });
  const editId = $derived(decodeURIComponent(hash.split('/')[3] ?? ''));

  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const bagsQ = liveQuery(() => db.containers.toArray());
  const templates = $derived([...($tplQ?.value ?? [])].sort((a, b) => a.name.localeCompare(b.name)));
  // v0.19.0: after 3 debriefs the templates learn what you never use and what was missing.
  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const doneN = $derived(($debriefsQ ?? []).filter((d) => d.status === 'done').length);
  const hintsFor = (tp) => templateHints(tp, $tripsQ ?? [], $debriefsQ ?? [], $itemsQ ?? []);
  // v0.28.0 (AP25): every decision goes into the template's history (tpl.hintLog) with the trips behind it.
  async function applyHint(tp, h) {
    await saveTemplates(db, templates.map((x) => (x.id === tp.id ? applyTemplateHint(x, h, $itemsQ ?? [], new Date().toISOString(), doneN) : x)));
  }
  // Noah 4a: "Not now" hides the hint until 3 more debriefs are done; the template stays as it is.
  async function rejectHint(tp, h) {
    await saveTemplates(db, templates.map((x) => (x.id === tp.id ? rejectTemplateHint(x, h, doneN) : x)));
  }
  const tripTitle = $derived(Object.fromEntries(($tripsQ ?? []).map((x) => [x.id, x.title])));
  const day = (iso) => (iso ? new Date(iso.length > 10 ? iso : `${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const history = (tp) => [...(tp.hintLog ?? [])].reverse();
  const logTrips = (x) => (x.trips ?? []).map((id, n) => tripTitle[id] ?? x.tripTitles?.[n] ?? id).join(', ');
  const bagName = $derived(Object.fromEntries(($bagsQ ?? []).map((b) => [b.id, b.name])));

  let error = $state('');
  async function rename(tp, value) {
    const clean = value.trim();
    error = '';
    if (!clean || clean === tp.name) return;
    if (templates.some((x) => x.id !== tp.id && x.name.toLowerCase() === clean.toLowerCase())) return (error = t('There is already a template "{name}".', { name: clean }));
    await saveTemplates(db, templates.map((x) => (x.id === tp.id ? { ...x, name: clean } : x)));
  }
  async function remove(tp) {
    if (!confirm(t('Delete the template "{name}"? Trips made from it stay. A backup file can bring it back.', { name: tp.name }))) return;
    await saveTemplates(db, templates.filter((x) => x.id !== tp.id));
  }
  function start(tp) {
    try {
      localStorage.setItem('pack.startFrom', tp.id);
    } catch {
      /* private mode: the trip dialog opens without the template chosen */
    }
    location.hash = '#/pack';
  }
  // Design audit T2: from the empty page straight to "Save as template" on Pack.
  function saveCurrent() {
    try {
      localStorage.setItem('pack.saveTemplate', '1');
    } catch {
      /* private mode: Pack opens without the dialog */
    }
    location.hash = '#/pack';
  }
  // v0.32.0 (finding 5, stage 1): a template in the app's two words, "Standard + Rain + 2 extra"
  // (the same line as in "New trip"; the standard set of a day ride without a night, like there).
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const blockSets = $derived(allSets($setsQ?.value));
  const stdIds = $derived(newTrip({ title: '', startDate: '', days: 1, bike: { id: '', setup: {} }, overnight: 'none' }, [], $itemsQ ?? [], 0).entries.map((e) => e.itemId));
  const blocksOf = (tp) => blocksLine(templateBlocks((tp.entries ?? []).map((e) => e.itemId), stdIds, blockSets, $itemsQ ?? []), blockLabel);
  const bags = (tp) => Object.values(tp.setup ?? {}).filter(Boolean).map((id) => bagName[id] ?? id);
  const nights = (tp) => NIGHT_SETS.filter((n) => tp.sets?.[n.key]).map((n) => t(n.name));
</script>

{#if editId}
  <TemplateEdit id={editId} />
{:else}
<div class="tpls">
  <p class="back"><a href="#/pack">← {t('Pack')}</a></p>
  <h1 class="title big">{t('Templates')}</h1>
  <p class="hint">{t('A template is a packing setup you can start new trips from. Save one on the Pack page with "Save as template". Change what is inside with "Edit", or from a trip made from it with "Save as template" → "Update".')}</p>
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  {#if templates.length && doneN < TEMPLATE_AFTER}<p class="hint">{t('After {n} debriefs the templates learn what you never use and what was missing ({done} of {n} done).', { n: TEMPLATE_AFTER, done: doneN })}</p>{/if}
  <ul class="list">
    {#each templates as tp (tp.id)}
      <li class="card">
        <label class="nm"><span class="lbl">{t('Name')}</span><input class="inp" value={tp.name} onchange={(e) => rename(tp, e.currentTarget.value)} /></label>
        <!-- v0.26.0 (Noah 1a): a template made from a kit keeps what the kit was for (read-only). -->
        {#if tp.note}<p class="facts tnote">{tp.note}</p>{/if}
        <p class="blocksline">{blocksOf(tp)}</p>
        <p class="facts">
          {tn(tp.entries.length, '{n} item', '{n} items')} · {tn(tp.ready.length, '{n} check', '{n} checks')}
          {#if tp.ride}{' · '}{t(RIDES.find((r) => r.key === tp.ride)?.name ?? '')}{/if}{#if tp.hours}{' · '}{tp.hours} h{/if}{#if tp.days > 1}{' · '}{tn(tp.days, '{n} day', '{n} days')}{/if}{#if tp.overnight === 'outdoor'}{' · '}{t('Outdoor')}{:else if tp.overnight === 'lodging'}{' · '}{t('Lodging')}{/if}
          {#if nights(tp).length}{' · '}{t('Night: {sets}', { sets: nights(tp).join(', ') })}{/if}
        </p>
        {#if bags(tp).length}<p class="facts">{t('Bags: {bags}', { bags: bags(tp).join(', ') })}</p>{/if}
        <p class="facts muted">{t('Saved {date}', { date: tp.updatedAt?.slice(0, 10) })}</p>
        {#if hintsFor(tp).length}
          <div class="hints">
            <span class="lbl">{t('From your debriefs')}</span>
            <p class="note">{t('Not used does not mean not needed: you decide.')}</p>
            <ul>
              {#each hintsFor(tp) as h (h.id)}
                <li class="hint-row" data-hint={h.id}>
                  <b>{h.kind === 'out' ? t('Take {name} out of the template?', { name: h.name }) : t('Put {name} into the template?', { name: h.name })}</b>
                  <details class="src">
                    <summary>{h.kind === 'out' ? t('{count} of {of} trips not used', { count: h.count, of: h.of }) : t('Missing on {count} of {of} trips', { count: h.count, of: h.of })}</summary>
                    <span class="lbl">{h.kind === 'out' ? t('Not needed on:') : t('Missing on:')}</span>
                    <ul class="trips">
                      {#each h.trips as tr (tr.id)}<li><span class="tt">{tr.title}</span> <small>{[day(tr.startDate), tr.ctx].filter(Boolean).join(' · ')}</small></li>{/each}
                    </ul>
                  </details>
                  <div class="hacts">
                    <button type="button" class="btn sm" onclick={() => applyHint(tp, h)}>{h.kind === 'out' ? t('Take out') : t('Put in')}</button>
                    <button type="button" class="btn sm" onclick={() => rejectHint(tp, h)}>{t('Not now')}</button>
                  </div>
                </li>
              {/each}
            </ul>
            <p class="note">{t('"Not now" asks again after {n} more debriefs.', { n: REJECT_FOR })}</p>
          </div>
        {/if}
        {#if tp.hintLog?.length}
          <details class="hist">
            <summary>{t('History')} ({tp.hintLog.length})</summary>
            <ul>
              {#each history(tp) as x, n (n)}
                <li>
                  <b>{x.decision === 'applied' ? t('Applied') : t('Not now')}</b>: {x.kind === 'out' ? t('Take out: {name}', { name: x.name ?? x.itemId }) : t('Put in: {name}', { name: x.name ?? x.itemId })}
                  <small>{day(x.at)}{#if x.trips?.length}{' · '}{t('from {trips}', { trips: logTrips(x) })}{/if}</small>
                </li>
              {/each}
            </ul>
          </details>
        {/if}
        <div class="acts">
          <button type="button" class="btn hi" onclick={() => start(tp)}>{t('New trip from it')}</button>
          <a class="btn" href="#/pack/templates/{encodeURIComponent(tp.id)}">{t('Edit')}</a>
          <button type="button" class="btn del" onclick={() => remove(tp)}>{t('Delete')}</button>
        </div>
      </li>
    {:else}
      <li class="card empty">
        <b>{t('No templates yet.')}</b>
        <p>{t('A template remembers bags, items and checks of a trip, so the next trip starts packed.')}</p>
        <button type="button" class="btn hi" onclick={saveCurrent}>{t('Save the current trip as a template')}</button>
      </li>
    {/each}
  </ul>
</div>
{/if}

<style>
  .big {
    font-size: var(--fs-page);
    line-height: var(--lh-title);
  }
  .back {
    margin: 0 0 6px;
  }
  .hint {
    color: var(--ink-3);
    max-width: 60ch;
  }
  .err {
    color: var(--bad);
  }
  .list {
    list-style: none;
    margin: 16px 0 0;
    padding: 0;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  }
  .nm {
    display: grid;
    gap: 4px;
  }
  /* v0.32.0: what is in the template, in building blocks ("Standard + Rain + 2 extra"). */
  .blocksline {
    margin: 8px 0 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .facts {
    margin: 8px 0 0;
    font-size: 14px;
  }
  .muted {
    color: var(--ink-3);
  }
  .tnote {
    color: var(--ink-2);
    font-style: italic;
    overflow-wrap: anywhere;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .hints {
    margin-top: 12px;
    padding: 8px 12px;
    border-left: 4px solid var(--ink);
    background: var(--paper-2);
    border-radius: 6px;
  }
  .hints ul {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
  }
  .hint-row {
    display: grid;
    gap: 6px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .hint-row:first-child {
    border-top: 0;
  }
  .note {
    margin: 4px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .src summary,
  .hist summary {
    cursor: pointer;
    min-height: 32px;
    display: flex;
    align-items: center;
    font-size: 14px;
  }
  @media (pointer: coarse) {
    .src summary,
    .hist summary {
      min-height: 44px;
    }
    .hacts .btn {
      min-height: 44px;
    }
  }
  .trips {
    margin: 2px 0 4px;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 4px;
  }
  .trips li,
  .hist li {
    font-size: 14px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .trips small,
  .hist small {
    display: block;
    color: var(--ink-3);
  }
  .hacts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .hist {
    margin-top: 10px;
  }
  .hist ul {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
</style>
