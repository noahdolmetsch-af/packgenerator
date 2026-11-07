<script>
  /**
   * «Training verbessern» 6 «Wochenlast-Wächter» (Noah 03.11.2026): when the planned week is clearly more than the
   * last weeks, or comes after three growing weeks, one calm card offers a lighter week («Entlastungswoche»).
   * «Shorten» scales the sessions still to come (with Undo), «Keep it» hides the card for this week.
   */
  import { Scale } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../../db.js';
  import { t } from '../../i18n.svelte.js';
  import { LOADKEEP_KEY as KEEP_KEY } from '../../training.js';

  let { hint = null, monday, planned = 0, hours = (m) => `${m} min`, onshorten } = $props();
  const keepQ = liveQuery(async () => (await db.settings.get(KEEP_KEY))?.value ?? null);
  const kept = $derived($keepQ?.monday === monday);
  const keep = () => db.settings.put({ key: KEEP_KEY, value: { monday } });
</script>

{#if hint && !kept}
  <section class="card wl" aria-labelledby="wl-h" data-section="week-load">
    <span class="wi" aria-hidden="true"><Scale size={20} /></span>
    <div class="wc">
      <h2 id="wl-h" class="wh">{hint.kind === 'deload' ? t('A lighter week would fit') : t('This week is a lot more than your last ones')}</h2>
      <p class="wp">{hint.kind === 'deload' ? t('Three weeks went up. A lighter week lets the body take it in.') : t('A big step in one week is hard to take in. A bit less is a calmer start.')} {hours(planned)} → {hours(hint.target)}</p>
      <div class="row">
        <button type="button" class="btn hi sm" onclick={() => onshorten(hint)} data-load-shorten>{t('Shorten the week')}</button>
        <button type="button" class="btn sm" onclick={keep} data-load-keep>{t('Keep it')}</button>
      </div>
    </div>
  </section>
{/if}

<style>
  .wl { display: flex; gap: 12px; margin-bottom: 16px; }
  .wi { color: var(--accent); padding-top: 2px; }
  .wc { flex: 1; min-width: 0; }
  .wh { margin: 0; font-size: var(--fs-sub); }
  .wp { margin: 2px 0 8px; color: var(--ink-2); font-size: var(--fs-small); }
  .row { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
