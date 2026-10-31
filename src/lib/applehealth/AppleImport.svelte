<script>
  /**
   * «Apple-Health-Export einlesen» (Noah 27.10.2026 «4a»): the zip from the iPhone's Health app becomes
   * days of sleep, resting heart rate, HRV, steps, active calories, VO2max and weight (healthDays, the
   * same table as Fitbit). Choose the file → preview with counts → «Take over» → «Undo» puts every day
   * back as it was. The file stays on this device. Rules: src/lib/applehealth.js.
   */
  import { Upload, Undo2, X, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { saveDays } from '../health.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';

  let input = $state();
  let busy = $state(false);
  let readMb = $state(0);
  let error = $state('');
  let rows = $state.raw([]);
  let info = $state(null); // { name, summary, range, workouts }
  let done = $state(null); // { changed, before, undone }

  const isZip = async (file) => /\.zip$/i.test(file.name) || new Uint8Array(await file.slice(0, 4).arrayBuffer()).every((b, i) => b === [0x50, 0x4b, 0x03, 0x04][i]);

  async function pick(e) {
    const file = e.currentTarget.files?.[0];
    if (input) input.value = '';
    if (!file) return;
    busy = true;
    error = '';
    done = null;
    readMb = 0;
    try {
      const ah = await import('../applehealth.js');
      const c = ah.appleCollector();
      let stream;
      if (await isZip(file)) {
        const { zipEntries, entryStream } = await import('../fitbit/zipread.js');
        const entry = (await zipEntries(file)).find((x) => ah.isExportXml(x.name));
        if (!entry) throw new Error('no_export');
        stream = await entryStream(file, entry);
      } else stream = file.stream();
      await ah.feedStream(stream, c, (b) => (readMb = Math.round(b / 1048576)));
      rows = c.days();
      if (!rows.length) throw new Error('empty');
      info = { name: file.name, summary: ah.summaryOf(rows), range: c.range(), workouts: c.counts.workouts };
    } catch (err) {
      rows = [];
      info = null;
      const m = err?.message;
      error =
        m === 'no_export' ? t('There is no export.xml in this zip. Choose the zip from «Export All Health Data».') : m === 'empty' ? t('Nothing usable in this file.') : m === 'not_zip' ? t('This zip could not be read.') : m === 'no_decompression' ? t('This browser cannot unpack the zip. Unzip it and choose the files from the folder.') : t('The file could not be read.');
    }
    busy = false;
  }

  function reset() {
    rows = [];
    info = null;
    error = '';
  }
  async function takeOver() {
    if (!rows.length) return;
    busy = true;
    const ah = await import('../applehealth.js');
    const r = await ah.applyDays(db, rows, saveDays);
    done = { ...r, n: rows.length, undone: false };
    rows = [];
    info = null;
    busy = false;
  }
  async function undo() {
    if (!done || done.undone) return;
    busy = true;
    const ah = await import('../applehealth.js');
    await ah.undoDays(db, done.before);
    done = { ...done, undone: true };
    busy = false;
  }
  const LINES = [
    ['sleep', 'Sleep|night'],
    ['restingHr', 'Resting heart rate'],
    ['hrvMs', 'HRV'],
    ['steps', 'Steps'],
    ['kcalActive', 'Active calories'],
    ['vo2max', 'VO2max'],
    ['weightKg', 'Weight'],
  ];
</script>

<section class="ah" aria-labelledby="ah-h" data-apple-import>
  <div>
    <h2 id="ah-h">{t('Apple Health (iPhone)')}</h2>
    <p class="ah-sub">{t('Sleep, resting heart rate, HRV, steps, VO2max and weight from your iPhone or Apple Watch. A web app cannot read Apple Health itself, so you export it once and choose the file here.')}</p>
  </div>
  <div class="card ah-body">
    {#if done}
      <p class="ah-done" role="status">
        {#if done.undone}
          {t('Taken back. Every day is as it was before.')}
        {:else}
          <Check size={16} aria-hidden="true" />
          <span>{tn(done.n, '{n} day taken over from Apple Health.', '{n} days taken over from Apple Health.')}</span>
          <button type="button" class="btn sm" disabled={busy} onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>
        {/if}
      </p>
    {/if}
    {#if !info}
      <ol class="ah-how">
        <li>{t('On the iPhone open the Health app and tap your picture at the top right.')}</li>
        <li>{t('Tap «Export All Health Data» and wait (it can take a few minutes).')}</li>
        <li>{t('Save the zip (Files, AirDrop to the computer) and choose it here. The file stays on this device.')}</li>
      </ol>
    {/if}
    <input bind:this={input} class="sr" type="file" accept=".zip,.xml,application/zip,text/xml,application/xml" aria-label={t('Choose the Apple Health file')} onchange={pick} />
    <div class="ah-btns">
      <button type="button" class="btn" disabled={busy} onclick={() => input?.click()}><Upload size={16} aria-hidden="true" />{t('Choose the Apple Health file')}</button>
      {#if info}<button type="button" class="btn" disabled={busy} onclick={reset}><X size={16} aria-hidden="true" />{t('Cancel')}</button>{/if}
    </div>
    {#if busy}<p class="ah-sub" role="status">{readMb ? t('Reading… {mb} MB', { mb: num(readMb) }) : t('Reading…')}</p>{/if}
    {#if error}<p class="ah-err" role="alert">{error}</p>{/if}
  </div>
  {#if info}
    <div class="card ah-body" data-apple-preview>
      <p class="ah-sum"><b>{tn(info.summary.days, '{n} day with values', '{n} days with values')}</b>{#if info.range}<span>{t('from {from} to {to}', { from: dateOf(info.range.from), to: dateOf(info.range.to) })}</span>{/if}</p>
      <ul class="ah-list">
        {#each LINES as [k, label] (k)}
          {#if info.summary[k]}<li><span>{t(label)}</span><b class="num">{tn(info.summary[k], '{n} day', '{n} days')}</b></li>{/if}
        {/each}
      </ul>
      {#if info.workouts}<p class="ah-sub">{tn(info.workouts, '{n} workout is in the file; workouts come in a later step.', '{n} workouts are in the file; workouts come in a later step.')}</p>{/if}
      <p class="ah-sub">{t('Days that already have a value from Fitbit take the value from Apple Health. «Undo» puts everything back.')}</p>
      <div class="ah-btns"><button type="button" class="btn hi" disabled={busy} onclick={takeOver}>{tn(info.summary.days, 'Take over {n} day', 'Take over {n} days')}</button></div>
    </div>
  {/if}
</section>

<style>
  .ah {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .ah h2 {
    margin: 0;
  }
  .ah-sub {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ah-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ah-how {
    margin: 0;
    padding-left: 1.2em;
    font-size: var(--fs-small);
    color: var(--ink-2);
    display: grid;
    gap: 4px;
  }
  .ah-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ah-sum {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    align-items: baseline;
    margin: 0;
  }
  .ah-sum span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ah-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .ah-list li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
    font-size: var(--fs-small);
  }
  .ah-list li + li {
    border-top: 1px solid var(--line);
  }
  .ah-done {
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
  .ah-done span {
    flex: 1 1 auto;
  }
  .ah-err {
    margin: 0;
    color: var(--warn);
    font-size: var(--fs-small);
  }
</style>
