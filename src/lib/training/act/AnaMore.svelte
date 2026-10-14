<script>
  /**
   * TR5b «Mehr aus der Leistung» (Noah 14.10.2026 «TR5–TR7 freigegeben»): W/kg, work, kcal from the
   * work, intensity (IF), evenness (VI), the load from power and Relative Effort, then one calm sentence.
   * Only with a power meter; observation only, no rating.
   */
  import AnaCard from '../AnaCard.svelte';
  import { ftpEstimate, powerLoad, wkg } from '../../training.js';
  import { kgOn } from '../../weight.js';
  import { weight } from '../../weight.svelte.js';
  import { fixed, hasMeter, intensity, variability, ifBand, viBand, IF_WORDS, VI_WORDS } from './power.js';
  import { t, num, locale } from '../../i18n.svelte.js';
  const f1 = (v) => fixed(v, 1, locale());
  const f2 = (v) => fixed(v, 2, locale());

  let { act = null, all = [], today = '' } = $props();

  const meter = $derived(hasMeter(act));
  const ftp = $derived(meter ? ftpEstimate(all, today) : null);
  const kg = $derived(meter ? kgOn(weight.entries, act.day) : null);
  const f = $derived(meter ? intensity(act.wNorm, ftp) : null);
  const vi = $derived(meter ? variability(act.wNorm, act.wAvg) : null);
  const load = $derived(meter && ftp ? powerLoad(act, ftp) : null);
  const vals = $derived.by(() => {
    if (!meter) return [];
    const v = [];
    const a = wkg(act.wAvg, kg);
    const n = wkg(act.wNorm, kg);
    if (a != null) v.push({ k: 'wkg', b: n != null ? `${f1(a)} / ${f1(n)}` : f1(a), s: n != null ? t('W/kg Ø / NP') : t('W/kg Ø') });
    if (wkg(act.w20, kg) != null) v.push({ k: 'wkg20', b: f1(wkg(act.w20, kg)), s: t('W/kg best 20 min') });
    if (act.kj != null) {
      v.push({ k: 'kj', b: `${num(act.kj)} kJ`, s: t('Work|power') });
      v.push({ k: 'kcal', b: `≈ ${num(act.kj)} kcal`, s: t('from the work (kJ ≈ kcal)') });
    }
    if (f != null) v.push({ k: 'if', b: f2(f), s: t('Intensity IF (NP ÷ FTP)') });
    if (vi != null) v.push({ k: 'vi', b: f2(vi), s: t('Evenness VI (NP ÷ Ø)') });
    if (load) v.push({ k: 'load', b: String(load.load), s: t('Load from power') });
    if (act.effort != null) v.push({ k: 'effort', b: String(act.effort), s: t('Relative Effort (Strava)') });
    return v;
  });
  const sentence = $derived(
    [
      f != null ? t('IF {f}: {words}.', { f: f2(f), words: t(IF_WORDS[ifBand(f)]) }) : '',
      vi != null ? t('VI {v}: {words} (1.00 = completely even).', { v: f2(vi), words: t(VI_WORDS[viBand(vi)]) }) : '',
      f != null || vi != null ? t('Just to look at, without rating.') : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
</script>

{#if meter && vals.length}
  <AnaCard key="more" sub={t('W/kg, work, intensity, evenness')}>
    <div class="vals num">
      {#each vals as v (v.k)}<span data-more={v.k}><b>{v.b}</b><small>{v.s}</small></span>{/each}
    </div>
    {#if sentence}<p class="cap" data-more-sentence>{sentence}</p>{/if}
  </AnaCard>
{/if}

<style>
  .vals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: 8px;
  }
  .vals span {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
    min-width: 0;
  }
  .vals b {
    font: 700 var(--fs-sub) / 1.25 var(--font-body);
  }
  .vals small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
</style>
