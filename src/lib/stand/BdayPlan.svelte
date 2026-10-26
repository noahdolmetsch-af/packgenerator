<script>
  /**
   * Paket A, UC-257-I2 «Geburtstag als Beziehungsvorhaben»: under a birthday in Merken, the small steps for this
   * year (gift, something together, getting in touch), each a tick. Shown in the 30 days before the birthday.
   */
  import { Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { updateTodo } from '../merkendb.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';
  import { bdaySteps, tickBdayStep } from './stand.js';

  let { td, year } = $props();
  const steps = $derived(bdaySteps(td, year));
  async function tick(s) {
    const undo = await updateTodo(db, td.id, tickBdayStep(td, s.key, year));
    offerDone(s.done ? t('Open again.') : t('Done: {what}', { what: s.own ? s.text : t(s.text) }), undo);
  }
</script>

{#if steps.length}
  <span class="bp" role="group" aria-label={t('Steps for the birthday of {name}', { name: td.text })} data-bday-plan={td.id}>
    {#each steps as s (s.key)}
      <button type="button" class="st" aria-pressed={s.done} onclick={() => tick(s)} data-bday-step={s.key}>{#if s.done}<Check size={14} aria-hidden="true" />{/if}{s.own ? s.text : t(s.text)}</button>
    {/each}
  </span>
{/if}

<style>
  .bp {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 0 8px 40px;
  }
  .st {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    padding: 4px 12px;
    border: 1.5px solid var(--line);
    border-radius: 18px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .st[aria-pressed='true'] {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
