<script>
  /**
   * v0.45.2 (Noah: "vor jedem Ride einen kurzen Reminder"): the base check on the ride page.
   * The trip's ready check (checks.js READY_DEFAULT: lock, mini backpack, bottle, sunglasses, cap,
   * wind jacket …) as big tap buttons until everything is ticked, then one quiet line.
   */
  import { buzz } from '../bedienung.svelte.js';
  import { db } from '../db.js';
  import { readyDone, tickReady, touched } from '../trips.js';
  import { t, num } from '../i18n.svelte.js';
  import { targetPressure, pressureText } from '../bikespecs.js';
  import { Check, ChevronDown } from '@lucide/svelte';

  // Impeccable (Noah 18.10.2026): `compact` from day 2 of a running trip (Ride.svelte):
  // the open check is one quiet line; a tap opens the chips as before.
  let { trip, bike = null, compact = false } = $props();
  // v0.65.0 «Velo-Masse»: the tyre pressure row names the bike's target pressure when it is set.
  const target = $derived(pressureText(targetPressure(bike), num));
  const label = (r) => (r.id === 'tyres' && target ? `${t(r.label)} · ${t('Target')} ${target}` : t(r.label));

  const rows = $derived((trip.ready ?? []).filter((r) => !r.itemId));
  const open = $derived(rows.filter((r) => !readyDone(r, trip)));
  let show = $state(false);
  let unfold = $state(false);
  const line = $derived(compact && open.length && !unfold);

  const save = (ready) => db.trips.update(trip.id, touched({ ready }));
  // FE7 (Noah 13.10.2026): a short buzz when a check gets ticked, where the phone can
  const toggle = (row) => (!readyDone(row, trip) && buzz(), save($state.snapshot(trip.ready).map((r) => (r.id === row.id ? { ...r, done: !r.done } : r))));
  const all = () => save(tickReady($state.snapshot(trip.ready)));
</script>

<!-- v0.106.0 Design-Refresh P5 (T12, approved 12.10.2026): one light card, the name on the left, the chips
     in the middle, «1 von 2» on the right (on the phone one under the other). -->
{#if rows.length && line}
  <section class="card bc one" aria-labelledby="bc-h-{trip.id}">
    <button type="button" class="lineb" aria-expanded="false" onclick={() => (unfold = true)}>
      <span class="txt"><b id="bc-h-{trip.id}">{t('Base check')}:</b> {t('{list} with me?', { list: open.map((r) => label(r).split(/,| · /)[0].trim()).join(', ') })}</span>
      <span class="act">{t('Tick off')}<ChevronDown size={16} aria-hidden="true" /></span>
    </button>
  </section>
{:else if rows.length}
  <section class="card bc" class:ok={!open.length} aria-labelledby="bc-h-{trip.id}">
    <h2 id="bc-h-{trip.id}">{t('Base check')}</h2>
    {#if open.length || show}
      <ul class="chips">
        {#each rows as r (r.id)}
          <li><button type="button" class="chip" aria-pressed={readyDone(r, trip)} onclick={() => toggle(r)}>{#if readyDone(r, trip)}<Check size={16} aria-hidden="true" />{/if}{label(r)}</button></li>
        {/each}
      </ul>
    {:else}
      <span class="done"><Check size={18} aria-hidden="true" /> {t('All with me')}</span>
    {/if}
    <div class="end">
      {#if open.length}
        <span class="n num">{t('{n} of {total}', { n: rows.length - open.length, total: rows.length })}</span>
        <button type="button" class="link" onclick={all}>{t('All with me')}</button>
        {#if compact}<button type="button" class="link" aria-expanded="true" onclick={() => (unfold = false)}>{t('Hide')}</button>{/if}
      {:else}
        <button type="button" class="link" aria-expanded={show} onclick={() => (show = !show)}>{show ? t('Hide') : t('Show')}</button>
      {/if}
    </div>
  </section>
{/if}

<style>
  .bc {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px 16px;
    margin: 0 0 16px;
  }
  .bc.ok {
    padding-top: 6px;
    padding-bottom: 6px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .n {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .end {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0 10px;
  }
  .done {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .chips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    max-width: 100%;
    padding: 8px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    text-align: left;
    overflow-wrap: break-word;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .link {
    border: 0;
    background: none;
    min-height: 44px;
    padding: 0 4px;
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .bc.one {
    display: block;
    padding: 0;
  }
  .lineb {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 8px 16px;
    border: 0;
    border-radius: inherit;
    background: none;
    color: var(--ink);
    font: 400 var(--fs-small) / 1.35 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .lineb .txt {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .lineb .txt b {
    font-weight: 600;
  }
  .lineb .act {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: none;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  @media (max-width: 639px) {
    .bc {
      grid-template-columns: minmax(0, 1fr);
    }
    .end {
      justify-content: space-between;
    }
  }
</style>
