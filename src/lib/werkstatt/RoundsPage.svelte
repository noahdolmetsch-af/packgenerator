<script>
  /**
   * Velo-Idee 76 «Eigene Wartungsabläufe» (Noah 26.10.2026 «4a 5a»): Bikes › Care › «Werkstatt-Runden»
   * (#/bikes?tab=care&view=rounds&bike=<id>). Own routines for the work at home: jobs, tools and material
   * in one round, made once and ticked off again and again. «Runde starten» shows a tick per job; «Fertig»
   * writes the ticked jobs with a part into that part («gewartet», «geprüft», «ersetzt», by yourself),
   * with Undo. Every round, job, tool and material can be added, renamed, moved (arrows and drag) and
   * deleted (with Undo). Loaded only when opened (Bikes.svelte). Rules: rounds.js.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2, Play, Check, X, Wrench, Package, ListChecks, Lightbulb } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, dateOf } from '../i18n.svelte.js';
  import { bikesHash, sortBikes } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { PART, partName, logPart, ensureParts } from '../care.js';
  import { JOB_PARTS, withVisits, visitsOf } from '../workshop.js';
  import { STOCK_KEY, stockOf, stockRow } from '../griff.js';
  import { changeSetting, putSetting } from '../griffdb.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone, offerRename } from '../ui/rename.svelte.js';
  import { sortable } from '../ui/sortable.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import VeloHead from '../bikes/VeloHead.svelte';
  import { ROUNDS_KEY, ROUND_IDEAS, STEP_ACTIONS, roundsOf, roundsFor, fromIdea, fromVisit, normRound, changeRound, addRow, editRow, dropRow, moveRow, moveRound, runEntries, materialState } from './rounds.js';
  import { JOBS } from './split.js';

  let { bikeId = null } = $props();
  const today = localDay();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const roundsQ = liveQuery(() => db.settings.get(ROUNDS_KEY));
  const stockQ = liveQuery(() => db.settings.get(STOCK_KEY));
  const bikes = $derived(sortBikes($bikesQ ?? []).filter((b) => !b.archived && !b.gone));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const all = $derived(roundsOf($roundsQ?.value));
  const mine = $derived(bike ? roundsFor(all, bike.id) : all);
  let selId = $state(null);
  const round = $derived(mine.find((r) => r.id === selId) ?? mine[0] ?? null);
  const lastVisit = $derived(bike ? visitsOf($visitsQ ?? [], bike.id).find((v) => (v.parts ?? []).some((l) => l.part && l.part !== 'other')) ?? null : null);
  const ideas = $derived(ROUND_IDEAS.filter((i) => !all.some((r) => r.name === t(i.name))));
  const stock = $derived.by(() => {
    const views = bikes.map((b) => withVisits(b, $visitsQ ?? []));
    return stockOf($stockQ?.value).map((r) => stockRow(r, views));
  });
  const material = $derived(round ? materialState(round, stock) : []);
  const parts = JOB_PARTS.filter((p) => p.key !== 'other');
  const pname = (key) => (PART[key] ? partName({ key }) : key);
  const jobName = (a) => t(JOBS.find((j) => j.key === a)?.name ?? 'serviced');

  const newId = () => `wr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  /** One change of the rounds; returns the rounds as they were (for Undo). */
  const change = (fn) => changeSetting(ROUNDS_KEY, [], (old) => fn(roundsOf(old)));
  const undoTo = (old) => () => putSetting(ROUNDS_KEY, old);

  // ---------- rounds ----------
  let newName = $state('');
  let msg = $state('');
  async function addRound(e) {
    e?.preventDefault();
    const name = newName.trim();
    if (!name) return (msg = t('Give it a name.'));
    const r = normRound({ id: newId(), name, bikes: [] });
    const old = await change((list) => [...list, r]);
    selId = r.id;
    newName = '';
    msg = '';
    offerDone(t('"{name}" added.', { name }), undoTo(old));
  }
  async function addIdea(idea) {
    const r = fromIdea(idea, { tr: t, newId });
    const old = await change((list) => [...list, r]);
    selId = r.id;
    offerDone(t('"{name}" added.', { name: r.name }), undoTo(old));
  }
  async function addFromVisit() {
    const r = fromVisit(lastVisit, { name: t('Like at {shop}', { shop: lastVisit.shop || t('the bike shop') }), partName: pname, newId });
    const old = await change((list) => [...list, r]);
    selId = r.id;
    offerDone(t('"{name}" added.', { name: r.name }), undoTo(old));
  }
  async function removeRound(r) {
    if ((await askDelete({ title: t('Delete "{name}"?', { name: r.name }), text: t('Only the round goes. What you ticked stays on the parts.') })) !== 'delete') return;
    await deleteWithUndo({
      name: r.name,
      text: t('"{name}" deleted.', { name: r.name }),
      run: () => change((list) => list.filter((x) => x.id !== r.id)),
      undo: (old) => putSetting(ROUNDS_KEY, old),
    });
  }
  const moveR = (from, to) => change((list) => {
    // the page shows the rounds of this bike; move them among all rounds by their ids
    const a = list.findIndex((x) => x.id === mine[from]?.id);
    const b = list.findIndex((x) => x.id === mine[to]?.id);
    return moveRound(list, a, b);
  });
  async function toggleBike(r, id) {
    const has = r.bikes.includes(id);
    await change((list) => changeRound(list, r.id, (x) => ({ ...x, bikes: has ? x.bikes.filter((b) => b !== id) : [...x.bikes, id] })));
  }

  // ---------- rows ----------
  let draft = $state({ steps: '', tools: '', material: '' });
  let draftPart = $state('');
  async function add(list, e) {
    e?.preventDefault();
    const text = draft[list].trim();
    if (!text || !round) return;
    const row = list === 'steps' ? { id: newId(), text, part: draftPart || null, action: 'service' } : { id: newId(), name: text };
    await change((l) => addRow(l, round.id, list, row));
    draft = { ...draft, [list]: '' };
    if (list === 'steps') draftPart = '';
  }
  const edit = (list, row, patch) => change((l) => editRow(l, round.id, list, row.id, patch));
  async function drop(list, row) {
    const name = row.text ?? row.name;
    const old = await change((l) => dropRow(l, round.id, list, row.id));
    offerDone(t('"{name}" removed.', { name }), undoTo(old));
  }
  const move = (list) => (from, to) => change((l) => moveRow(l, round.id, list, from, to));
  let renaming = $state(null); // { kind: 'round' } | { list, row }
  async function rename(value) {
    const r = renaming;
    if (r.kind === 'round') {
      const old = await change((l) => changeRound(l, round.id, (x) => ({ ...x, name: value })));
      offerRename(value.trim(), undoTo(old));
    } else {
      const field = r.list === 'steps' ? 'text' : 'name';
      const old = await change((l) => editRow(l, round.id, r.list, r.row.id, { [field]: value }));
      offerRename(value.trim(), undoTo(old));
    }
  }

  // ---------- a run ----------
  let running = $state(false);
  let ticked = $state([]);
  const start = () => ((running = true), (ticked = []));
  const tick = (id) => (ticked = ticked.includes(id) ? ticked.filter((x) => x !== id) : [...ticked, id]);
  async function finish() {
    const b = await db.bikes.get(bike.id);
    const entries = runEntries(round, ticked, { km: typeof b.km === 'number' ? b.km : null, day: today });
    const before = b.parts ?? null;
    let list = ensureParts(b);
    for (const e of entries) list = logPart(list, e.key, e.entry);
    if (entries.length) await db.bikes.update(b.id, { parts: list });
    const old = await change((l) => changeRound(l, round.id, (x) => ({ ...x, last: { ...x.last, [b.id]: today } })));
    running = false;
    const text = entries.length ? t('{round} done: {parts} recorded.', { round: round.name, parts: entries.map((e) => `${pname(e.key)} ${jobName(e.entry.action)}`).join(', ') }) : t('{round} done.', { round: round.name });
    ticked = [];
    offerDone(text, async () => {
      if (entries.length) await db.bikes.update(b.id, { parts: before ?? [] });
      await putSetting(ROUNDS_KEY, old);
    });
  }
</script>

<div class="rounds">
  <VeloHead
    crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bike?.id ?? null }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care', bike: bike?.id ?? null, open: !!bike }) }]}
    title={t('Workshop rounds')}
    sub={t('Your own routines for the work at home')}
  />
  <p class="lead">{t('Jobs, tools and material in one round. Make it once, tick it off again and again. What you tick with a part goes into the part as done by you.')}</p>
  {#if bikes.length > 1}
    <nav class="chips" aria-label={t('Choose a bike')}>
      {#each bikes as b (b.id)}<a class="chip" aria-current={b.id === bike?.id ? 'page' : undefined} href={bikesHash({ tab: 'care', view: 'rounds', bike: b.id })}>{b.name}</a>{/each}
    </nav>
  {/if}

  <div class="cols">
    <div class="left">
      {#if mine.length}
        <ul class="rlist" use:sortable={{ onmove: moveR }} aria-label={t('Workshop rounds')}>
          {#each mine as r, i (r.id)}
            <li data-sort-id={r.id} class:on={r.id === round?.id} data-round={r.id}>
              <SortGrip name={r.name} onstep={(dir) => moveR(i, i + dir)} />
              <button type="button" class="pick" aria-pressed={r.id === round?.id} onclick={() => ((selId = r.id), (running = false))}>
                <b>{r.name}</b>
                <small>{tn(r.steps.length, '{n} job', '{n} jobs')} · {bike && r.last[bike.id] ? t('last {date}', { date: dateOf(r.last[bike.id]) }) : t('not yet done')}</small>
              </button>
              <SortArrows name={r.name} {i} n={mine.length} onstep={(dir) => moveR(i, i + dir)} />
            </li>
          {/each}
        </ul>
      {:else}
        <p class="quiet">{t('No round yet. Start with a suggestion or make your own.')}</p>
      {/if}
      <form class="addrow" onsubmit={addRound}>
        <input class="inp" maxlength="60" aria-label={t('Name of the new round')} placeholder={t('New round, e.g. Spring service')} bind:value={newName} oninput={() => (msg = '')} data-round-new />
        <button type="submit" class="btn sm" data-round-add><Plus size={16} aria-hidden="true" />{t('Round')}</button>
      </form>
      {#if msg}<p class="err" role="alert">{msg}</p>{/if}
      {#if lastVisit}<button type="button" class="btn sm" onclick={addFromVisit} data-round-from-visit>{t('From the workshop visit of {date}', { date: dateOf(lastVisit.date) })}</button>{/if}
      {#if ideas.length}
        <div class="ideas">
          <p class="quiet"><Lightbulb size={14} aria-hidden="true" />{t('Suggestions, one tap adds one:')}</p>
          {#each ideas as idea (idea.key)}<button type="button" class="chip" onclick={() => addIdea(idea)} data-round-idea={idea.key}><Plus size={14} aria-hidden="true" />{t(idea.name)}</button>{/each}
        </div>
      {/if}
    </div>

    {#if round}
      <div class="right">
        <section class="rcard" aria-labelledby="rd-h">
          <h2 id="rd-h">{round.name}</h2>
          <fieldset class="for">
            <legend class="quiet">{round.bikes.length ? t('For these bikes:') : t('For all bikes. Tap to choose some.')}</legend>
            {#each bikes as b (b.id)}<label class="chip"><input type="checkbox" checked={round.bikes.includes(b.id)} onchange={() => toggleBike(round, b.id)} />{b.name}</label>{/each}
          </fieldset>
          <div class="acts">
            {#if running}
              <button type="button" class="btn hi" onclick={finish} data-round-finish><Check size={16} aria-hidden="true" />{t('Done|round')} ({ticked.length}/{round.steps.length})</button>
              <button type="button" class="btn" onclick={() => (running = false)}><X size={16} aria-hidden="true" />{t('Cancel')}</button>
            {:else}
              <button type="button" class="btn hi" onclick={start} disabled={!round.steps.length || !bike} data-round-start><Play size={16} aria-hidden="true" />{t('Start the round')}</button>
              <button type="button" class="btn" onclick={() => (renaming = { kind: 'round' })}><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>
              <button type="button" class="btn" onclick={() => removeRound(round)} data-round-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
            {/if}
          </div>
          {#if running}<p class="quiet">{t('Tick what you did on {bike}. «Done» writes the jobs with a part into the part.', { bike: bike.name })}</p>{/if}
        </section>

        <section class="rcard" aria-labelledby="rd-steps">
          <h2 id="rd-steps"><ListChecks size={18} aria-hidden="true" />{t('Jobs|round')}</h2>
          <ul class="rows" use:sortable={{ onmove: move('steps') }}>
            {#each round.steps as s, i (s.id)}
              <li data-sort-id={s.id} data-round-step={s.id}>
                {#if running}
                  <label class="tickrow"><input type="checkbox" checked={ticked.includes(s.id)} onchange={() => tick(s.id)} data-round-tick /><span><b>{s.text}</b>{#if s.part}<small>{pname(s.part)} → {jobName(s.action)}</small>{/if}</span></label>
                {:else}
                  <SortGrip name={s.text} onstep={(dir) => move('steps')(i, i + dir)} />
                  <span class="nm"><button type="button" class="txt" onclick={() => (renaming = { list: 'steps', row: s })}>{s.text}</button></span>
                  <SortArrows name={s.text} {i} n={round.steps.length} onstep={(dir) => move('steps')(i, i + dir)} />
                  <button type="button" class="ib" aria-label={t('Delete {name}', { name: s.text })} onclick={() => drop('steps', s)}><Trash2 size={16} aria-hidden="true" /></button>
                    <span class="sels">
                      <select class="sel" aria-label={t('Part of {name}', { name: s.text })} value={s.part ?? ''} onchange={(e) => edit('steps', s, { part: e.currentTarget.value || null })}>
                        <option value="">{t('No part')}</option>
                        {#each parts as p (p.key)}<option value={p.key}>{partName({ key: p.key })}</option>{/each}
                      </select>
                      {#if s.part}
                        <select class="sel" aria-label={t('Job of {name}', { name: s.text })} value={s.action} onchange={(e) => edit('steps', s, { action: e.currentTarget.value })}>
                          {#each STEP_ACTIONS as a (a)}<option value={a}>{jobName(a)}</option>{/each}
                        </select>
                      {/if}
                    </span>
                {/if}
              </li>
            {:else}
              <li class="quiet">{t('No job yet.')}</li>
            {/each}
          </ul>
          {#if !running}
            <form class="addrow" onsubmit={(e) => add('steps', e)}>
              <input class="inp" maxlength="80" aria-label={t('New job')} placeholder={t('New job, e.g. Clean the chain')} bind:value={draft.steps} data-round-step-new />
              <select class="sel" aria-label={t('Part of the new job')} bind:value={draftPart}>
                <option value="">{t('No part')}</option>
                {#each parts as p (p.key)}<option value={p.key}>{partName({ key: p.key })}</option>{/each}
              </select>
              <button type="submit" class="btn sm" data-round-step-add><Plus size={16} aria-hidden="true" />{t('Job|round')}</button>
            </form>
          {/if}
        </section>

        <div class="two">
          {#each [['tools', 'Tools|round', Wrench, 'New tool, e.g. Pump'], ['material', 'Material|round', Package, 'New material, e.g. Chain oil']] as [list, title, Icon, ph] (list)}
            <section class="rcard" aria-labelledby="rd-{list}" data-round-list={list}>
              <h2 id="rd-{list}"><Icon size={18} aria-hidden="true" />{t(title)}</h2>
              <ul class="rows" use:sortable={{ onmove: move(list) }}>
                {#each list === 'material' ? material : round[list] as x, i (x.id)}
                  <li data-sort-id={x.id}>
                    <SortGrip name={x.name} onstep={(dir) => move(list)(i, i + dir)} />
                    <span class="nm"><button type="button" class="txt" onclick={() => (renaming = { list, row: x })}>{x.name}</button>
                      {#if list === 'material' && x.left != null}<small class="tag" class:low={x.left === 0} data-round-stock>{x.left === 0 ? t('buy') : t('at home: {n}', { n: x.left })}</small>{/if}</span>
                    <SortArrows name={x.name} {i} n={round[list].length} onstep={(dir) => move(list)(i, i + dir)} />
                    <button type="button" class="ib" aria-label={t('Delete {name}', { name: x.name })} onclick={() => drop(list, x)}><Trash2 size={16} aria-hidden="true" /></button>
                  </li>
                {:else}
                  <li class="quiet">{t('Nothing yet.')}</li>
                {/each}
              </ul>
              <form class="addrow" onsubmit={(e) => add(list, e)}>
                <input class="inp" maxlength="60" aria-label={t(ph)} placeholder={t(ph)} bind:value={draft[list]} data-round-row-new={list} />
                <button type="submit" class="btn sm" aria-label={t('Add|part')}><Plus size={16} aria-hidden="true" /></button>
              </form>
            </section>
          {/each}
        </div>
        {#if material.some((m) => m.left != null)}<p class="quiet">{t('«at home» comes from Spare parts at home, matched by the name.')}</p>{/if}
      </div>
    {/if}
  </div>
</div>

{#if renaming}
  <RenameSheet
    kicker={renaming.kind === 'round' ? t('Workshop round') : t(renaming.list === 'steps' ? 'Jobs|round' : renaming.list === 'tools' ? 'Tools|round' : 'Material|round')}
    title={t('Rename')}
    value={renaming.kind === 'round' ? round.name : (renaming.row.text ?? renaming.row.name)}
    onsave={rename}
    onclose={() => (renaming = null)}
  />
{/if}

<style>
  .lead {
    margin: 0 0 12px;
    color: var(--ink-2);
    max-width: 760px;
  }
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .chips,
  .ideas {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 12px;
  }
  .ideas .quiet {
    flex: 1 0 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 8px 0 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  .chip[aria-current='page'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
    gap: 16px;
    align-items: start;
  }
  @media (max-width: 800px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .left {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  .rlist,
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
  }
  .rlist li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    margin: 0 0 8px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .rlist li.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .pick {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 4px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .pick small,
  .nm small,
  .tickrow small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .addrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
    margin-top: 8px;
  }
  .addrow .inp {
    flex: 1 1 160px;
    min-width: 0;
    min-height: 44px;
  }
  .addrow .sel {
    flex: 1 1 140px;
    min-width: 0;
    min-height: 44px;
  }
  .rcard {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px 16px;
    margin: 0 0 14px;
  }
  .rcard h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    font-size: var(--fs-section);
  }
  .for {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 10px;
    padding: 0;
    border: 0;
  }
  .for legend {
    margin-bottom: 6px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .rows li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
  }
  .nm {
    flex: 1;
    min-width: 0;
  }
  .txt {
    min-height: 40px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .sels {
    flex: 1 0 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-left: 34px;
  }
  .sels .sel {
    flex: 1 1 140px;
    min-width: 0;
    min-height: 40px;
  }
  .ib {
    flex: none;
    min-width: 40px;
    min-height: 40px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .tickrow {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 44px;
    width: 100%;
    cursor: pointer;
  }
  .tickrow input {
    width: 22px;
    height: 22px;
    margin-top: 2px;
    flex: none;
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
  }
  @media (max-width: 640px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .tag {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 600;
  }
  .tag.low {
    background: var(--warn-soft);
    color: var(--warn);
  }
</style>
