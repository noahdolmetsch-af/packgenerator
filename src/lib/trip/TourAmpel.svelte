<script>
  /**
   * «Tour-Ampel» (Noah 05.11.2026, Touren 3a): on Pack, before the trip, one small card: packed, weather,
   * bike, devices. Each line has a tone (a sign and a word as well as the colour) and, when something is
   * open, a tap to the place that fixes it. Only an observation; nothing is blocked. Rules: ampel.js.
   */
  import { t } from '../i18n.svelte.js';
  import { ampelHead } from './ampel.js';
  import { Check, Clock, TriangleAlert, Minus, ChevronRight } from '@lucide/svelte';

  /** rows: ampelRows(); onact(act) runs the tap of a line. */
  let { rows = [], onact = null } = $props();
  const head = $derived(ampelHead(rows));
  const ICON = { ok: Check, wait: Clock, stop: TriangleAlert, none: Minus };
  const WORD = { ok: 'OK', wait: 'To do|ampel', stop: 'Soon|ampel', none: 'No data|ampel' };
</script>

{#if rows.length}
  <section class="tp-card ampel" aria-labelledby="ampel-h" data-ampel={head === 'Ready to go' ? 'ok' : head === 'Almost ready' ? 'wait' : 'stop'}>
    <div class="top">
      <h2 id="ampel-h">{t('Ready to go?')}</h2>
      <span class="state">{t(head)}</span>
    </div>
    <ul>
      {#each rows as r (r.key)}
        {@const Icon = ICON[r.tone]}
        <li class={r.tone} data-ampel-row={r.key}>
          {#if r.act && onact}
            <button type="button" class="row" onclick={() => onact(r.act)}>
              <span class="sign" aria-hidden="true"><Icon size={14} /></span>
              <span class="txt">{t(r.text, r.vars)}</span>
              <span class="w">{t(WORD[r.tone])}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          {:else}
            <div class="row">
              <span class="sign" aria-hidden="true"><Icon size={14} /></span>
              <span class="txt">{t(r.text, r.vars)}</span>
              <span class="w">{t(WORD[r.tone])}</span>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="fine">{t('Only a look at your data; nothing is blocked. Tap a line to fix it.')}</p>
  </section>
{/if}

<style>
  .ampel {
    display: grid;
    gap: 8px;
  }
  .top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .state {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 6px 10px;
    border: 0;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink);
    font: inherit;
    text-align: left;
  }
  button.row {
    cursor: pointer;
  }
  button.row:hover {
    background: var(--paper-3, var(--paper-2));
  }
  .sign {
    flex: none;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
  }
  .ok .sign {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .wait .sign {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .stop .sign {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .none .sign {
    background: var(--paper);
    color: var(--ink-2);
  }
  .txt {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .w {
    flex: none;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
  .fine {
    margin: 0;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
</style>
