<script>
  import { localDay } from './localday.js';
  import { askDelete } from './ui/ask.js';
  /**
   * The bar on top while a demo runs: which demo, the demo day, and "End demo".
   * Ending puts your own data back exactly as it was before the demo.
   * v0.88.0 (mockup G): the playground (Ich › Ausprobieren, play.js) says so in one line: your data
   * is safe and nothing counts; «End» ends it the same way.
   */
  import { liveQuery } from 'dexie';
  import { db } from './db.js';
  import { demoState, endDemo, setClock, clockOffset } from './demo.js';
  import { t } from './i18n.svelte.js';

  const demoQ = liveQuery(() => demoState(db));
  const demo = $derived($demoQ ?? null);
  const today = localDay();
  const shifted = clockOffset() !== 0;
  let busy = $state(false);

  function goTo(date) {
    setClock(date || null);
    location.reload();
  }
  async function end() {
    const ask = demo?.play ? t('End the playground? Your own data comes back exactly as it was. Everything done in the playground is removed.') : t('End the demo? Your own data comes back exactly as it was before the demo. Everything done in the demo is removed.');
    if ((await askDelete({ title: ask, label: demo?.play ? t('End the playground') : t('End the demo') })) !== 'delete') return;
    busy = true;
    await endDemo(db);
    location.hash = '#/';
    location.reload();
  }
</script>

{#if demo}
  <div class="demo" role="region" aria-label={t('Demo')}>
    {#if demo.play}<span class="t"><b>{t('Playground')}</b> · {t('your data is safe · nothing counts')}</span>{:else}<span class="t"><b>{t('Demo')}:</b> {demo.name}</span>{/if}
    {#if demo.days.length || shifted}<label>
      <span>{demo.play ? t('Play day') : t('Demo day')}</span>
      <select value={shifted ? today : ''} onchange={(e) => goTo(e.currentTarget.value)}>
        <option value="">{t('Real today')}</option>
        {#each demo.days as d (d.date)}<option value={d.date}>{d.label}</option>{/each}
        {#if shifted && !demo.days.some((d) => d.date === today)}<option value={today}>{today}</option>{/if}
      </select>
    </label>{/if}
    <button type="button" class="end" disabled={busy} onclick={end}>{demo.play ? t('End|playground') : t('End demo')}</button>
    {#if demo.note}<p class="note">{demo.note}</p>{/if}
  </div>
{/if}

<style>
  .demo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
    padding: 8px var(--gut);
    background: #ffd84d;
    color: #1f1a00;
    font-size: var(--fs-body);
  }
  .t {
    min-width: 0;
    overflow-wrap: break-word;
  }
  label {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  select {
    min-height: 40px;
    max-width: 60vw;
    font: inherit;
  }
  .end {
    min-height: 40px;
    padding: 0 12px;
    border: 1.5px solid #1f1a00;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: 700 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .note {
    flex-basis: 100%;
    margin: 0;
    font-size: var(--fs-small);
  }
</style>
