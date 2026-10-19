<script>
  /**
   * Tour-Seite, answer 3b (Noah 19.10.2026): correct km, Hm and the moving time of a finished tour, and the
   * kind of sport of one activity. Strava's value stays and shows under each field; an empty field means
   * «Strava's value». onsave({ km, hm, movingS, kind? }) with null for «Strava's value».
   * base: Strava's (or the app's) values { km, hm, movingS, kind }; own: the corrected ones now.
   */
  import TourSheet from './TourSheet.svelte';
  import { t } from '../../i18n.svelte.js';
  import { KIND_NAMES } from '../../training.js';
  import { parseNumber, parseDuration, durationText } from '../tour.js';
  import { n0, n1 } from '../../review/fmt.js';

  let { base = {}, own = {}, kinds = false, onsave, onclose } = $props();
  // svelte-ignore state_referenced_locally
  let km = $state(own.km != null ? String(own.km) : '');
  // svelte-ignore state_referenced_locally
  let hm = $state(own.hm != null ? String(own.hm) : '');
  // svelte-ignore state_referenced_locally
  let dur = $state(own.movingS != null ? durationText(own.movingS) : '');
  // svelte-ignore state_referenced_locally
  let kind = $state(own.kind ?? '');
  let err = $state('');
  let sheet = $state();

  function save() {
    const v = { km: parseNumber(km), hm: parseNumber(hm), movingS: parseDuration(dur) };
    if ([v.km, v.hm, v.movingS].some((x) => Number.isNaN(x))) {
      err = t('Please check the numbers: km and Hm as numbers, the time as 2:30.');
      return;
    }
    if (v.hm != null) v.hm = Math.round(v.hm);
    onsave?.(kinds ? { ...v, kind: kind || null } : v);
    sheet.close();
  }
  function reset() {
    km = '';
    hm = '';
    dur = '';
    kind = '';
  }
</script>

<TourSheet bind:this={sheet} id="tc-h" data="correct" title={t('Correct values')} text={t('Empty means the value from Strava. The tour then shows «changed».')} {onclose}>
  {#snippet body()}
    <div class="cg">
      <label class="cf"><span>{t('Distance')} (km)</span><input type="text" inputmode="decimal" bind:value={km} placeholder={n1(base.km)} data-own="km" /><small>{t('Strava: {v}', { v: `${n1(base.km)} km` })}</small></label>
      <label class="cf"><span>{t('Climbing')} (Hm)</span><input type="text" inputmode="numeric" bind:value={hm} placeholder={n0(base.hm)} data-own="hm" /><small>{t('Strava: {v}', { v: `${n0(base.hm)} Hm` })}</small></label>
      <label class="cf"><span>{t('Moving time')} (h:mm)</span><input type="text" inputmode="numeric" bind:value={dur} placeholder={durationText(base.movingS) || '2:30'} data-own="movingS" /><small>{t('Strava: {v}', { v: durationText(base.movingS) || '–' })}</small></label>
      {#if kinds}
        <label class="cf"><span>{t('Sport')}</span>
          <select bind:value={kind} data-own="kind">
            <option value="">{t('As in Strava: {kind}', { kind: t(KIND_NAMES[base.kind] ?? 'Other|kind') })}</option>
            {#each Object.entries(KIND_NAMES) as [k, name] (k)}<option value={k}>{t(name)}</option>{/each}
          </select>
        </label>
      {/if}
    </div>
    {#if err}<p class="err" role="alert">{err}</p>{/if}
  {/snippet}
  {#snippet foot()}
    <button type="button" class="btn btn-link" onclick={reset} data-own-reset>{t('Back to Strava values')}</button>
    <button type="button" class="btn hi" onclick={save} data-own-save>{t('Save')}</button>
  {/snippet}
</TourSheet>

<style>
  .cg {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px 16px;
  }
  .cf {
    display: grid;
    gap: 4px;
    font: 500 var(--fs-small) / 1.3 var(--font-body);
  }
  .cf input,
  .cf select {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: 400 var(--fs-body) var(--font-body);
  }
  .cf small {
    color: var(--ink-3);
    font-weight: 400;
  }
  .err {
    margin: 10px 0 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
</style>
