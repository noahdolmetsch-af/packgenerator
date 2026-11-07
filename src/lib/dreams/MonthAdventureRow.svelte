<script>
  /**
   * «Ein Abenteuer im Monat» (Träume und Neuland N12, Noah 07.11.2026 «ok N12»), on Heute: one quiet line, «Adventure of
   * the month: Train there, bike home». A tap opens Touren › Träume (where the adventures are); «Not this month» closes
   * the line until next month. No tile. The line can be switched off on Träume. Rules in monatsabenteuer.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { ADV_KEY, advCfg, adventureFor, showToday, monthOf, skipMonth } from './monatsabenteuer.js';
  import { t } from '../i18n.svelte.js';
  import { Tent } from '@lucide/svelte';

  let { today } = $props();
  const q = liveQuery(async () => (await db.settings.get(ADV_KEY))?.value ?? null);
  const homeQ = liveQuery(async () => (await db.settings.get('homePlace'))?.value ?? null);
  const cfg = $derived(advCfg($q));
  const month = $derived(monthOf(today));
  const adv = $derived(adventureFor(cfg, month));
  // the built-in kinds start from your home place; without it only your own idea is worth a line
  const show = $derived($q !== undefined && $homeQ !== undefined && showToday(cfg, today) && (!!$homeQ || !!adv?.own));
  const name = $derived(adv ? (adv.own ? adv.text : t(adv.text)) : '');
  const close = () => db.settings.put({ key: ADV_KEY, value: skipMonth(cfg, month) });
</script>

{#if show && adv}
  <div class="ma" data-section="monats-abenteuer" data-month-adventure>
    <a class="row" href="#/trips/dreams">
      <Tent size={20} aria-hidden="true" />
      <span class="tx"><b>{t('Adventure of the month: {name}', { name })}</b><small>{adv.hint ? t(adv.hint) : t('Your own idea. A tap opens Dreams.')}</small></span>
    </a>
    <button type="button" class="btn sm no" onclick={close} data-month-adventure-skip>{t('Not this month')}</button>
  </div>
{/if}

<style>
  /* the look of «Neu seit gestern» */
  .ma {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--sp-2);
    margin: 0 0 14px;
    padding-right: 10px;
    border: 1px solid var(--hi-soft);
    border-radius: var(--radius-card);
    background: var(--hi-soft);
  }
  .row {
    display: flex;
    flex: 1 1 14em;
    min-width: 0;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 4px 8px 14px;
    color: var(--ink);
    text-decoration: none;
  }
  .row :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .tx {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: 2px;
    overflow-wrap: break-word;
  }
  b {
    font-size: var(--fs-body);
    font-weight: 600;
  }
  small {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .no {
    flex: none;
    margin: 0 0 8px 14px;
  }
  @media (min-width: 560px) {
    .no {
      margin: 0;
    }
  }
</style>
