<script>
  /**
   * «Gestern nichts abgehakt? Nachtragen» (Noah 21.11.2026, Festlegung Abhaken, Punkt 5): in the morning, when yesterday has no
   * tick, one quiet line on Aktiv. «Nachtragen» shows the tiles; a tap on one opens its tick window with «Gestern» chosen.
   * It only reminds: «Nicht heute» hides it for the day on this device. Rules: nachtragen.js.
   */
  import { History } from '@lucide/svelte';
  import { ui, actName } from './ui.svelte.js';
  import { showNachtragHint, HINT_NO_KEY } from './nachtragen.js';
  import { addDays } from '../flow.js';
  import { t } from '../i18n.svelte.js';

  let { today, log = [], acts = [] } = $props();
  let open = $state(false);
  let hidden = $state(read());
  function read() {
    try {
      return localStorage.getItem(HINT_NO_KEY) === today;
    } catch {
      return false;
    }
  }
  const show = $derived(!hidden && acts.length > 0 && showNachtragHint(log, today, new Date().getHours()));
  function no() {
    hidden = true;
    try {
      localStorage.setItem(HINT_NO_KEY, today);
    } catch {
      /* private mode: it only hides until the page is reloaded */
    }
  }
  function pick(a) {
    open = false;
    ui.tickDay = addDays(today, -1);
    ui.tick = a.id;
  }
</script>

{#if show}
  <section class="nh" data-nachtrag aria-label={t('A gentle hint')}>
    <History size={18} aria-hidden="true" />
    <div class="tx">
      <b data-nachtrag-title>{t('Yesterday nothing ticked off? Add it.')}</b>
      <span>{t('Only a hint. You can also add a day from «•••» on any tile.')}</span>
      <span class="acts">
        <button type="button" class="btn sm" aria-expanded={open} data-nachtrag-open onclick={() => (open = !open)}>{t('Add it|day')}</button>
        <button type="button" class="btn btn-link sm" data-nachtrag-no onclick={no}>{t('Not today')}</button>
      </span>
      {#if open}
        <span class="lst" role="group" aria-label={t('What did you do yesterday?')} data-nachtrag-list>
          {#each acts as a (a.id)}<button type="button" class="chip" data-nachtrag-act={a.id} onclick={() => pick(a)}>{actName(a)}</button>{/each}
        </span>
      {/if}
    </div>
  </section>
{/if}

<style>
  .nh {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .nh > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--l3);
  }
  .tx {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .tx b {
    color: var(--ink);
  }
  .acts,
  .lst {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
    margin-top: var(--sp-1);
  }
  .chip {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
</style>
