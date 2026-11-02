<script>
  /**
   * «Meilensteine aktiver machen» PR 2 (Noah «2a und b»): on a sport's page, after how many days without a tick «Schon lange
   * nicht» shows on Heute. By default it comes from the weekly goal; here you set your own number or switch it off.
   */
  import { liveQuery } from 'dexie';
  import { Minus, Plus } from '@lucide/svelte';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { NUDGE_KEY, nudgesOf, limitFor, setNudge, MIN_DAYS, MAX_DAYS } from '../home/nudge.js';
  import { t, tn } from '../i18n.svelte.js';

  let { act } = $props();
  const q = $derived(liveQuery(() => db.settings.get(NUDGE_KEY)));
  const nudges = $derived(nudgesOf($q?.value));
  const mine = $derived(nudges[act.id] ?? {});
  const limit = $derived(limitFor(act, nudges));
  const save = (patch) => putSetting(db, NUDGE_KEY, setNudge(nudges, act.id, patch));
  const step = (k) => save({ days: Math.max(1, Math.min(MAX_DAYS, limit + k)), off: false });
</script>

<section class="ns" data-nudge-setting aria-labelledby="nus-h">
  <h3 id="nus-h">{t('Reminder when it has been a while')}</h3>
  {#if mine.off}
    <p class="sub">{t('Switched off. This sport never shows «Not for a while» on Today.')}</p>
    <button type="button" class="b" data-nudge-on onclick={() => save({ off: false })}>{t('Switch on')}</button>
  {:else}
    <p class="sub">{mine.days ? t('Your number: after {n} days without a tick.', { n: limit }) : t('By itself from your goal: after {n} days without a tick.', { n: limit })}</p>
    <div class="row">
      <button type="button" class="b sq" aria-label={t('One day less')} disabled={limit <= 1} onclick={() => step(-1)}><Minus size={16} aria-hidden="true" /></button>
      <b class="num" data-nudge-days>{tn(limit, '{n} day', '{n} days')}</b>
      <button type="button" class="b sq" aria-label={t('One day more')} disabled={limit >= MAX_DAYS} onclick={() => step(1)}><Plus size={16} aria-hidden="true" /></button>
      {#if mine.days}<button type="button" class="b" data-nudge-auto onclick={() => save({ days: null })}>{t('By itself')}</button>{/if}
      <button type="button" class="b" data-nudge-off onclick={() => save({ off: true })}>{t('Switch off')}</button>
    </div>
  {/if}
</section>

<style>
  .ns {
    display: grid;
    gap: 8px;
    padding: 12px 0;
  }
  h3 {
    margin: 0;
    font: 600 var(--fs-body)/1.3 var(--font-body);
  }
  .sub {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .b {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small)/1 var(--font-body);
    cursor: pointer;
  }
  .b.sq {
    display: grid;
    place-items: center;
    width: 44px;
    padding: 0;
  }
  .b:disabled {
    opacity: 0.5;
  }
</style>
