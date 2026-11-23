<script>
  /**
   * «Mein Tag» step 4 (Noah 23.11.2026 «ja»): «Plan my day». A proposal for the own entries of the day that have no time yet,
   * made by rules (src/lib/tag/plan.js), with the reason for each line. Leichter / Normal / Härter changes how full the day gets.
   * Every line can be unticked; nothing is saved before «Take over» (the page saves the times and offers Undo).
   * entries: the entries of the day; day, today, now (minutes), wet (rain is forecast); onapply(moves).
   */
  import { X } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, tn } from '../i18n.svelte.js';
  import { planDay } from './plan.js';
  import '../ui/daumen.css';

  let { entries = [], day, today, now = 0, wet = false, onapply, onclose } = $props();

  let mode = $state('normal');
  let off = $state([]); // ids the user unticked
  let dialog;
  const plan = $derived(planDay(entries, { day, today, now, wet, mode }));
  const picked = $derived(plan.moves.filter((m) => !off.includes(m.id)));
  const toggle = (id) => (off = off.includes(id) ? off.filter((x) => x !== id) : [...off, id]);

  $effect(() => {
    dialog.showModal();
  });

  const why = (w) => (w.code === 'after' ? t('Free slot after «{name}»', { name: w.other }) : t('Free slot'));
  const hint = (h) => (h.code === 'rain' ? t('Rain is forecast: «{name}» may want a plan indoors.', { name: h.title }) : h.code === 'busy' ? t('A full day: more than six hours are booked.') : t('It is late: little of the day is left.'));

  async function apply() {
    if (!picked.length) return;
    await onapply?.(picked);
    dialog.close();
  }
</script>

<dialog class="sheet from-below plan" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="pl-h" data-plan-sheet>
  <div class="head">
    <h2 id="pl-h">{t('Plan my day')}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="hint">{t('A proposal for what has no time yet. Nothing is saved before you take it over.')}</p>
  <Seg label={t('How full the day gets')} value={mode} options={[{ key: 'lighter', name: t('Lighter|plan') }, { key: 'normal', name: t('Normal|plan') }, { key: 'harder', name: t('Harder|plan') }]} onchange={(k) => (mode = k)} />

  {#if plan.moves.length}
    <ul class="moves">
      {#each plan.moves as m (m.id)}
        <li>
          <label>
            <input type="checkbox" checked={!off.includes(m.id)} onchange={() => toggle(m.id)} data-plan-pick={m.id} />
            <span class="what"><b>{m.title}</b><small>{why(m.why)}</small></span>
            <span class="num time">{m.time}</span>
          </label>
        </li>
      {/each}
    </ul>
  {:else if !plan.left.length}
    <p class="none" data-plan-none>{t('Nothing without a time on this day. Add an entry and plan again.')}</p>
  {/if}
  {#each plan.left as l (l.id)}
    <p class="left"><b>{l.title}</b> <small>{l.code === 'full' ? t('Does not fit today, it stays without a time.') : t('Left for later to keep the day light.')}</small></p>
  {/each}
  {#each plan.hints as h, i (i)}
    <p class="note">{hint(h)}</p>
  {/each}

  <div class="foot daumen-foot">
    <button type="button" class="btn hi" disabled={!picked.length} onclick={apply} data-plan-apply>{tn(picked.length, 'Take over {n} entry', 'Take over {n} entries')}</button>
  </div>
</dialog>

<style>
  .plan {
    width: min(480px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .hint,
  .none {
    margin: 0 0 10px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .moves {
    list-style: none;
    margin: 12px 0 8px;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .moves label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 6px 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--card);
    cursor: pointer;
  }
  .what {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .what small,
  .left small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .time {
    font-weight: 600;
  }
  .left {
    margin: 4px 0;
  }
  .note {
    margin: 8px 0 0;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--surface-2, var(--card));
    font-size: var(--fs-small);
  }
</style>
