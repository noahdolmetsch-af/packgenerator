<script>
  /**
   * «Tour-Ampel» (Noah 05.11.2026, Touren 3a): on Pack, before the trip, one small card: packed, weather,
   * bike, devices. Each line has a tone (a sign and a word as well as the colour) and, when something is
   * open, a tap to the place that fixes it. Only an observation; nothing is blocked. Rules: ampel.js.
   */
  import { t } from '../i18n.svelte.js';
  import { ampelHead } from './ampel.js';
  import { Check, Clock, TriangleAlert, Minus, ChevronRight, ChevronDown } from '@lucide/svelte';

  /** rows: ampelRows(); onact(act) runs the tap of a line. */
  let { rows = [], onact = null } = $props();
  const head = $derived(ampelHead(rows));
  // lines with a tap come first as buttons; the calm ones (done, or nothing to fix) share one short line each
  const todo = $derived(onact ? rows.filter((r) => r.act) : []);
  const calm = $derived(rows.filter((r) => !todo.includes(r)));
  const ICON = { ok: Check, wait: Clock, stop: TriangleAlert, none: Minus };
  const WORD = { ok: 'OK', wait: 'To do|ampel', stop: 'Soon|ampel', none: 'No data|ampel' };
</script>

{#if rows.length}
  <!-- closed at first: the page stays short; the signs in the title line already say how it stands, a tap opens the lines -->
  <details class="tp-card ampel" data-ampel={head === 'Ready to go' ? 'ok' : head === 'Almost ready' ? 'wait' : 'stop'}>
    <summary class="top">
      <h2>{t('Ready to go?')}</h2>
      <span class="signs" aria-hidden="true">
        {#each rows as r (r.key)}
          {@const Icon = ICON[r.tone]}
          <span class="sign {r.tone}"><Icon size={14} /></span>
        {/each}
      </span>
      <span class="state">{t(head)}</span>
      <ChevronDown class="chev" size={18} aria-hidden="true" />
    </summary>
    {#if todo.length}
      <ul>
        {#each todo as r (r.key)}
          {@const Icon = ICON[r.tone]}
          <li class={r.tone} data-ampel-row={r.key}>
            <button type="button" class="row" onclick={() => onact(r.act)}>
              <span class="sign" aria-hidden="true"><Icon size={14} /></span>
              <span class="txt">{t(r.text, r.vars)}</span>
              <span class="w">{t(WORD[r.tone])}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    {#if calm.length}
      <ul class="calm">
        {#each calm as r (r.key)}
          {@const Icon = ICON[r.tone]}
          <li class={r.tone} data-ampel-row={r.key}>
            <span class="sign" aria-hidden="true"><Icon size={14} /></span>
            <span class="txt">{t(r.text, r.vars)}</span>
            <span class="sr">{t(WORD[r.tone])}</span>
          </li>
        {/each}
      </ul>
    {/if}
    <p class="fine">{t('Only a look at your data; nothing is blocked. Tap a line to fix it.')}</p>
  </details>
{/if}

<style>
  .ampel {
    display: grid;
    gap: 6px;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    cursor: pointer;
    list-style: none;
  }
  .top::-webkit-details-marker {
    display: none;
  }
  .signs {
    display: flex;
    gap: 4px;
  }
  .state {
    margin-left: auto;
  }
  details[open] > .top :global(.chev) {
    transform: rotate(180deg);
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
    gap: 2px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 2px 10px;
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
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  .ok .sign,
  .sign.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .wait .sign,
  .sign.wait {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .stop .sign,
  .sign.stop {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .none .sign,
  .sign.none {
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
  .calm {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    padding: 0 4px;
  }
  .calm li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--fs-small);
    min-width: 0;
  }
  .fine {
    margin: 0;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
</style>
