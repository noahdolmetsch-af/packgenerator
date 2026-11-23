<script>
  /**
   * «Tourenvorschläge»: the ground strip under the height profile (single trail, gravel or path, asphalt; one letter per
   * sample in `cls`: s, u, p). It stays as it was when the profile became the shared block of the app (Noah 23.11.2026 «1-5a»).
   */
  import { t } from '../i18n.svelte.js';

  /** cls: the ground string, one letter per sample */
  let { cls = '' } = $props();
  /** Runs of the same ground: [{ c, from, to }] in sample units. */
  const runs = $derived.by(() => {
    const out = [];
    for (let i = 0; i < cls.length; i++) {
      const last = out[out.length - 1];
      if (last && last.c === cls[i]) last.to = i + 1;
      else out.push({ c: cls[i], from: i, to: i + 1 });
    }
    return out;
  });
  const GROUND = { s: 'Single trail|tour', u: 'Gravel or path|tour', p: 'Asphalt|tour' };
</script>

<div class="ug" data-vs-ground-strip>
  <svg class="strip" viewBox="0 0 {Math.max(1, cls.length)} 1" preserveAspectRatio="none" role="img" aria-label={t('Ground along the tour: single trail, gravel or path, asphalt')}>
    {#each runs as r (r.from)}<rect x={r.from} y="0" width={r.to - r.from} height="1" class={`g-${r.c}`} />{/each}
  </svg>
  <ul class="key">
    {#each Object.keys(GROUND) as k (k)}<li><i class={`g-${k}`}></i>{t(GROUND[k])}</li>{/each}
  </ul>
</div>

<style>
  .ug { display: grid; gap: 6px; }
  .strip { display: block; width: 100%; height: 12px; border-radius: 4px; overflow: hidden; }
  .g-s { fill: var(--ok); background: var(--ok); }
  .g-u { fill: var(--warn, var(--accent)); background: var(--warn, var(--accent)); }
  .g-p { fill: var(--ink-3); background: var(--ink-3); }
  .key { display: flex; flex-wrap: wrap; gap: 4px 14px; list-style: none; margin: 0; padding: 0; font-size: var(--fs-small); color: var(--ink-2); }
  .key li { display: flex; align-items: center; gap: 6px; }
  .key i { width: 14px; height: 10px; border-radius: 3px; display: inline-block; }
</style>
