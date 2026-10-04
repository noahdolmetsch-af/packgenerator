<script>
  /**
   * The bar on top while a demo runs: which demo, the demo day, and "End demo".
   * Ending puts your own data back exactly as it was before the demo.
   */
  import { liveQuery } from 'dexie';
  import { db } from './db.js';
  import { demoState, endDemo, setClock, clockOffset } from './demo.js';

  const demoQ = liveQuery(() => demoState(db));
  const demo = $derived($demoQ ?? null);
  const today = new Date().toISOString().slice(0, 10);
  const shifted = clockOffset() !== 0;
  let busy = $state(false);

  function goTo(date) {
    setClock(date || null);
    location.reload();
  }
  async function end() {
    if (!confirm('End the demo? Your own data comes back exactly as it was before the demo. Everything done in the demo is removed.')) return;
    busy = true;
    await endDemo(db);
    location.hash = '#/';
    location.reload();
  }
</script>

{#if demo}
  <div class="demo" role="region" aria-label="Demo">
    <span class="t"><b>Demo:</b> {demo.name}</span>
    <label>
      <span>Demo day</span>
      <select value={shifted ? today : ''} onchange={(e) => goTo(e.currentTarget.value)}>
        <option value="">Real today</option>
        {#each demo.days as d (d.date)}<option value={d.date}>{d.label}</option>{/each}
        {#if shifted && !demo.days.some((d) => d.date === today)}<option value={today}>{today}</option>{/if}
      </select>
    </label>
    <button type="button" class="end" disabled={busy} onclick={end}>End demo</button>
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
    font-size: 15px;
  }
  .t {
    min-width: 0;
    overflow-wrap: anywhere;
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
    font: 700 15px var(--font-body);
    cursor: pointer;
  }
  .note {
    flex-basis: 100%;
    margin: 0;
    font-size: 14px;
  }
</style>
