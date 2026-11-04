<script>
  /**
   * «What made it good?» (Noah 04.11.2026 «3a», Persönliches Lernen Idee 6): four small scales on the debrief, each
   * 1–5 and optional: riding fun, nature, flow, company. A second tap on the chosen value takes it away. Over
   * several tours one calm line says which of the four was highest on average; it describes, never explains.
   * d: the debrief (reads d.joy); onchange(joy | null): the caller stores it on the debrief (set or patch).
   */
  import { liveQuery } from 'dexie';
  import { Smile } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num } from '../i18n.svelte.js';
  import { JOY, MAX, joyOf, joyChange, overview } from '../freude.js';

  let { d, onchange } = $props();
  const mine = $derived(joyOf(d));
  const histQ = liveQuery(() => db.debriefs.toArray());
  const seen = $derived(overview($histQ ?? []));
  const top = $derived(seen?.top ? JOY.find((j) => j.key === seen.top) : null);
  const topMean = $derived(seen?.means[0]?.mean ?? null);
</script>

<section class="rv-sec joy" aria-labelledby="joy-h" data-debrief-joy>
  <div class="rv-h"><div><h2 id="joy-h"><Smile size={18} aria-hidden="true" />{t('What made it good?')}</h2><p class="rv-sub">{t('Four small scales, all optional. 1 = a little, 5 = a lot.')}</p></div></div>
  <div class="rv-box pad jy">
    {#each JOY as j (j.key)}
      <div class="jr" role="group" aria-labelledby="joy-{j.key}">
        <div class="jl"><b id="joy-{j.key}">{t(j.name)}</b><span class="jh">{t(j.hint)}</span></div>
        <div class="jb">
          {#each Array.from({ length: MAX }, (_, i) => i + 1) as n (n)}
            <button type="button" class="fb num" aria-pressed={mine[j.key] === n} onclick={() => onchange(joyChange(d, j.key, n))} data-joy={j.key} data-joy-n={n}>{n}</button>
          {/each}
        </div>
      </div>
    {/each}
    {#if top}<p class="jw" data-joy-line>{t('Over {n} tours «{name}» was highest on average ({mean} of 5). This only counts what you answered.', { n: seen.n, name: t(top.name), mean: num(topMean) })}</p>{:else if seen}<p class="jw" data-joy-line>{t('Over {n} tours no one of the four stands out. This only counts what you answered.', { n: seen.n })}</p>{/if}
  </div>
</section>

<style>
  h2 { display: flex; align-items: center; gap: 8px; }
  .jy { display: grid; gap: 14px; min-width: 0; }
  .jr { display: grid; gap: 6px; min-width: 0; }
  .jl { display: grid; gap: 2px; }
  .jh, .jw { color: var(--ink-2); font-size: var(--fs-small); }
  .jw { margin: 0; }
  .jb { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .fb { min-height: 44px; min-width: 0; padding: 0; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font-weight: 600; cursor: pointer; }
  .fb[aria-pressed='true'] { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
</style>
