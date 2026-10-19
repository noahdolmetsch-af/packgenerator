<script>
  /**
   * Package G «Daten kommen von selbst» (#157, #158): the old Fitbit data from the Google Takeout
   * export becomes Aktiv history. Trainings (Tennis, walks, runs, rides …) become entries of the
   * matching activity, mindfulness sessions become meditation sessions. Choose the .zip or the files
   * out of it → preview with counts, the activity per Fitbit type changeable (or «skip») → «Take over»
   * writes it in one go → «Undo» removes exactly that. Nothing is written before «Take over»; a
   * second import adds nothing twice. The file stays on this device. Rules: fitbitexport.js.
   */
  import { liveQuery } from 'dexie';
  import { Upload, Undo2, X, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { wantedPath, parseFile, planImport } from '../fitbitexport.js';
  import { applyPlan, undoPlan } from './importdb.js';
  import { t, tn, num, dateOf, lang } from '../i18n.svelte.js';

  let { onapplied = null } = $props();

  const actsQ = liveQuery(() => db.flowActs.toArray());
  const logQ = liveQuery(() => db.flowLog.toArray());
  const sessQ = liveQuery(() => db.flowSessions.toArray());
  const acts = $derived([...($actsQ ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  const actName = (a) => (a ? (lang.v === 'de' && a.nameDe ? a.nameDe : a.name) || t('Activity') : '');
  const nameOf = (id) => actName(acts.find((a) => a.id === id));

  /* ---------- files ---------- */
  let input = $state();
  let files = $state([]); // [{ name, n, ok }]
  let items = $state.raw([]);
  let busy = $state(false);
  let progress = $state(null); // { i, total }
  let error = $state('');

  const isZip = async (file) => /\.zip$/i.test(file.name) || new Uint8Array(await file.slice(0, 4).arrayBuffer()).every((b, i) => b === [0x50, 0x4b, 0x03, 0x04][i]);

  async function add(list) {
    if (!list.length) return;
    busy = true;
    error = '';
    done = null;
    const got = [...items];
    const seen = [];
    try {
      for (const file of list) {
        if (await isZip(file)) {
          const { zipTexts } = await import('./zipread.js');
          let n = 0;
          for await (const { name, text, index, total } of zipTexts(file, wantedPath)) {
            progress = { i: index + 1, total };
            const r = parseFile(name, text);
            n += r.items.length;
            for (const x of r.items) got.push(x);
          }
          seen.push({ name: file.name, n, ok: n > 0 });
        } else {
          const r = parseFile(file.name, await file.text());
          for (const x of r.items) got.push(x);
          seen.push({ name: file.name, n: r.items.length, ok: !!r.kind });
        }
      }
    } catch (e) {
      error = e?.message === 'not_zip' ? t('This zip could not be read.') : e?.message === 'no_decompression' ? t('This browser cannot unpack the zip. Unzip it and choose the files from the folder.') : t('The file could not be read.');
    }
    items = got;
    files = [...files, ...seen];
    progress = null;
    busy = false;
    if (input) input.value = '';
  }
  function reset() {
    items = [];
    files = [];
    map = {};
    error = '';
  }

  /* ---------- the plan and your choices ---------- */
  let map = $state({}); // Fitbit type → activity id, '' = skip
  let auto = $state(false); // what the watch recognised by itself (mostly short commutes) only on request
  const plan = $derived(items.length ? planImport(items, { acts, log: $logQ ?? [], sessions: $sessQ ?? [], map: { ...map }, auto }) : null);
  const typeText = (ty) => (ty.known ? t(ty.label) : ty.label);
  const exTypes = $derived(plan ? plan.types.filter((x) => x.kind === 'ex') : []);
  const mindTypes = $derived(plan ? plan.types.filter((x) => x.kind === 'mind') : []);
  const autoN = $derived(items.filter((x) => x.auto).length);

  /* ---------- take over, undo ---------- */
  let done = $state(null); // { added, n, undone }
  async function takeOver() {
    if (!plan?.entries.length) return;
    busy = true;
    const n = plan.entries.length;
    const added = await applyPlan(db, plan);
    done = { added, n: added.entryIds.length || n, undone: false };
    items = [];
    files = [];
    busy = false;
    onapplied?.(done);
  }
  async function undo() {
    if (!done || done.undone) return;
    busy = true;
    await undoPlan(db, done.added);
    done = { ...done, undone: true };
    busy = false;
  }
</script>

{#snippet typeRow(ty)}
  <li class="fi-row">
    <span class="fi-m">
      <b>{typeText(ty)}</b>
      <small class="num">
        {tn(ty.n, '{n} in the file', '{n} in the file')}{#if ty.actId}{' · '}{t('{n} new', { n: ty.fresh })}{#if ty.have}{' · '}{t('{n} already there', { n: ty.have })}{/if}{/if}{#if ty.auto}{' · '}{t('{n} recognised by the watch, left out', { n: ty.auto })}{/if}
      </small>
    </span>
    <select class="sel" aria-label={t('Activity for {type}', { type: typeText(ty) })} value={ty.actId ?? ''} onchange={(e) => (map = { ...map, [ty.key]: e.currentTarget.value })}>
      <option value="">{t('skip|fitbit')}</option>
      {#each acts as a (a.id)}<option value={a.id}>{actName(a)}</option>{/each}
    </select>
  </li>
{/snippet}

<section class="fi" aria-labelledby="fi-h">
  <div class="fi-h">
    <h2 id="fi-h">{t('Old Fitbit data')}</h2>
    <p class="fi-sub">{t('Trainings such as tennis, walks or rides and your mindfulness sessions from the Fitbit export become your activity history. Once is enough; new ones come through the connection.')}</p>
  </div>

  <div class="card fi-body">
    {#if done}
      <p class="fi-done" role="status">
        {#if done.undone}
          {t('Taken back. Nothing from the Fitbit file is left.')}
        {:else}
          <Check size={16} aria-hidden="true" />
          <span>{tn(done.n, '{n} entry added to your activity history.', '{n} entries added to your activity history.')}</span>
          <button type="button" class="btn sm" disabled={busy} onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>
        {/if}
      </p>
    {/if}

    {#if !plan}
      <p class="fi-help">{t('How: takeout.google.com › choose only «Fitbit» › export. Then choose the .zip here, or from the unzipped folder the files exercise-….json, UserExercises_….csv and Mindfulness Sessions.csv. The file stays on this device.')}</p>
    {/if}

    {#if files.length}
      <ul class="fi-files">
        {#each files as f, i (i)}
          <li><b>{f.name}</b><span class="num">{f.ok ? tn(f.n, '{n} entry read', '{n} entries read') : t('nothing usable in it')}</span></li>
        {/each}
      </ul>
    {/if}

    <input bind:this={input} class="sr" type="file" multiple accept=".zip,.json,.csv,application/zip,application/json,text/csv" aria-label={t('Choose the Fitbit file')} onchange={(e) => add([...e.currentTarget.files])} />
    <div class="fi-btns">
      <button type="button" class="btn" disabled={busy} onclick={() => input?.click()}><Upload size={16} aria-hidden="true" />{files.length ? t('Add a file') : t('Choose the Fitbit file')}</button>
      {#if plan}<button type="button" class="btn" disabled={busy} onclick={reset}><X size={16} aria-hidden="true" />{t('Cancel')}</button>{/if}
    </div>
    {#if progress}<p class="fi-help" role="status">{t('Reading the zip… file {i} of {total}', { i: progress.i, total: progress.total })}</p>{:else if busy}<p class="fi-help" role="status">{t('Reading…')}</p>{/if}
    {#if error}<p class="fi-err" role="alert">{error}</p>{/if}
  </div>

  {#if plan}
    <div class="card fi-body">
      <p class="fi-sum">
        <b>{tn(plan.counts.fresh, '{n} new entry', '{n} new entries')}</b>
        {#if plan.range}<span>{t('from {from} to {to}', { from: dateOf(plan.range.from), to: dateOf(plan.range.to) })}</span>{/if}
      </p>
      <p class="fi-help num">
        {t('{n} already there', { n: num(plan.counts.have) })} · {t('{n} skipped', { n: num(plan.counts.skipped + plan.counts.auto) })}{#if plan.counts.short}{' · '}{t('{n} under a minute, left out', { n: plan.counts.short })}{/if}
      </p>
      <p class="fi-help">{t('Already there: the same entry from an earlier import, or you already ticked that activity on that day. It is not added twice.')}</p>
      {#if plan.perAct.length}
        <ul class="fi-acts">
          {#each plan.perAct as p (p.actId)}<li><span>{nameOf(p.actId)}</span><b class="num">+{num(p.fresh)}</b></li>{/each}
        </ul>
      {/if}
      {#if autoN}
        <label class="fi-switch">
          <span><b>{t('Also what the watch recognised by itself')}</b><small>{t('The watch notices walks or rides by itself. Off: only what you started on the watch.')}</small></span>
          <input type="checkbox" class="fi-check" bind:checked={auto} />
        </label>
      {/if}
    </div>

    {#if exTypes.length}
      <section class="fi-sec" aria-labelledby="fi-ex">
        <h3 id="fi-ex" class="zlabel">{t('Trainings → activity')}</h3>
        <p class="fi-help">{t('Suggested by the name. Change it, or choose «skip»: those stay out.')}</p>
        <ul class="card fi-list">{#each exTypes as ty (ty.key)}{@render typeRow(ty)}{/each}</ul>
      </section>
    {/if}
    {#if mindTypes.length}
      <section class="fi-sec" aria-labelledby="fi-mind">
        <h3 id="fi-mind" class="zlabel">{t('Mindfulness → meditation log')}</h3>
        <p class="fi-help">{t('Each session becomes a session in the meditation log, with its time and minutes.')}</p>
        <ul class="card fi-list">{#each mindTypes as ty (ty.key)}{@render typeRow(ty)}{/each}</ul>
      </section>
    {/if}
    {#if plan.skipped.length}
      <p class="fi-help">{t('Skipped: {types}.', { types: plan.skipped.map((x) => `${typeText(x)} (${x.n})`).join(', ') })}</p>
    {/if}

    <div class="fi-btns">
      <button type="button" class="btn hi" disabled={busy || !plan.counts.fresh} onclick={takeOver}>{plan.counts.fresh ? tn(plan.counts.fresh, 'Take over {n} entry', 'Take over {n} entries') : t('Nothing new to take over')}</button>
    </div>
  {/if}
</section>

<style>
  .fi {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .fi-h h2 {
    margin: 0;
  }
  .fi-sub,
  .fi-help {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fi-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .fi-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .fi-files,
  .fi-acts,
  .fi-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .fi-files li,
  .fi-acts li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
    font-size: var(--fs-small);
    min-width: 0;
  }
  .fi-files b {
    overflow-wrap: break-word;
  }
  .fi-acts li + li,
  .fi-row + .fi-row {
    border-top: 1px solid var(--line);
  }
  .fi-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    flex-wrap: wrap;
  }
  .fi-m {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1 1 180px;
  }
  .fi-m small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fi-row .sel {
    flex: 0 1 220px;
    min-width: 0;
  }
  .fi-sum {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    align-items: baseline;
    margin: 0;
  }
  .fi-sum span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fi-sec {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .fi-sec h3 {
    margin: 0;
  }
  .fi-switch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .fi-switch span {
    display: flex;
    flex-direction: column;
  }
  .fi-switch small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fi-check {
    flex: none;
    width: 22px;
    height: 22px;
    accent-color: var(--hi);
  }
  .fi-done {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--ok-soft);
    color: var(--ink);
  }
  .fi-done span {
    flex: 1 1 auto;
  }
  .fi-err {
    margin: 0;
    color: var(--warn);
    font-size: var(--fs-small);
  }
</style>
