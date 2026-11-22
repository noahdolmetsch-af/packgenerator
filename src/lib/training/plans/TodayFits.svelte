<script>
  /**
   * «Training verbessern» 4 «Heute passt» (Noah 03.11.2026): when the readiness of today is low and a session is
   * planned for today, one calm card offers a lighter version: «Lighter» changes the session (with Undo),
   * «Keep it» leaves it as it is and the card stays away for today. Always a suggestion, never an alarm.
   */
  import { Leaf } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../../db.js';
  import { t } from '../../i18n.svelte.js';
  import { lighterSession } from '../suggest.js';
  import { KIND_NAMES, TODAYKEEP_KEY as KEEP_KEY } from '../../training.js';

  let { plan = [], today, level = null, name = (s) => s.name, onlighter } = $props();
  const keepQ = liveQuery(async () => (await db.settings.get(KEEP_KEY))?.value ?? null);
  const kept = $derived($keepQ?.day === today);
  const mine = $derived(plan.find((s) => s.day === today && lighterSession(s, level)));
  const lighter = $derived(mine ? lighterSession(mine, level) : null);
  const keep = () => db.settings.put({ key: KEEP_KEY, value: { day: today } });
  const label = (s) => `${s.mins} min${s.zone ? ` · Z${s.zone}` : ''}`;
</script>

{#if mine && lighter && !kept}
  <section class="card tf" aria-labelledby="tf-h" data-section="today-fits">
    <span class="ti" aria-hidden="true"><Leaf size={20} /></span>
    <div class="tc">
      <h2 id="tf-h" class="th">{t('Today a lighter one fits')}</h2>
      <p class="ts">{level === 'rest' ? t('You are tired today.') : t('You are a little tired today.')} «{name(mine) || t(KIND_NAMES[mine.kind])}»: {label(mine)} → {label(lighter)}</p>
      <div class="row">
        <button type="button" class="btn hi sm" onclick={() => onlighter(mine, lighter)} data-today-lighter>{t('Lighter|session')}</button>
        <button type="button" class="btn sm" onclick={keep} data-today-keep>{t('Keep it')}</button>
      </div>
    </div>
  </section>
{/if}

<style>
  .tf { display: flex; gap: 12px; margin-bottom: 16px; }
  .ti { color: var(--accent); padding-top: 2px; }
  .tc { flex: 1; min-width: 0; }
  .th { margin: 0; font-size: var(--fs-sub); }
  .ts { margin: 2px 0 8px; color: var(--ink-2); font-size: var(--fs-small); }
  .row { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
