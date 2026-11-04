<script>
  /**
   * «Regen in den nächsten 24 Stunden» (Noah 04.11.2026 «2a»): an own rain strip, one bar per hour, from the
   * weather core of the page. It always works (no outside page needed) and says it in one line:
   * «Rain from 16:00, strongest around 18:00».
   */
  import { CloudRain } from '@lucide/svelte';
  import { rainStrip, barPct } from './regen24.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { core = null, now = Date.now() } = $props();

  const strip = $derived(core ? rainStrip(core, now) : null);
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const say = $derived.by(() => {
    if (!strip) return '';
    if (strip.dry) return t('Dry for the next 24 hours.');
    if (strip.nowWet && strip.to) return t('It rains now, until about {to}.', { to: hm(strip.to) }) + (strip.peak ? ' ' + t('Strongest around {at}.', { at: hm(strip.peak) }) : '');
    if (strip.nowWet) return t('It rains now and stays wet for the next 24 hours.');
    return t('Rain from about {from}.', { from: hm(strip.from) }) + (strip.peak ? ' ' + t('Strongest around {at}.', { at: hm(strip.peak) }) : '');
  });
</script>

<section class="card wx-r24" aria-labelledby="wx-r24" data-wx-r24>
  <h2 id="wx-r24" class="wx-r24-h"><CloudRain size={18} aria-hidden="true" />{t('Rain in the next 24 hours')}</h2>
  {#if strip}
    <p class="wx-r24-say" data-wx-r24-say>{say}</p>
    <div class="wx-r24-bars" role="img" aria-label={say}>
      {#each strip.bars as b (b.ms)}
        <span class="wx-r24-bar" class:wet={b.wet} style="height:{barPct(b, strip.max)}%" title="{hm(b.ms)} · {num(Math.round(b.mm * 10) / 10)} mm"></span>
      {/each}
    </div>
    <div class="wx-r24-axis" aria-hidden="true">
      <span>{t('now')}</span><span>+6 h</span><span>+12 h</span><span>+18 h</span><span>+24 h</span>
    </div>
    <p class="rc-src">{t('From the forecast, hour by hour: {mm} mm in total.', { mm: num(strip.total) })}</p>
  {:else}
    <p class="rc-note" data-wx-r24-empty>{t('No forecast yet. Set a place and the rain strip shows here.')}</p>
  {/if}
</section>

<style>
  .wx-r24 {
    padding: 12px;
    display: grid;
    gap: 8px;
  }
  .wx-r24-h {
    margin: 0;
    font-size: var(--fs-sub);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .wx-r24-say {
    margin: 0;
    font-weight: 600;
  }
  .wx-r24-bars {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 72px;
  }
  .wx-r24-bar {
    flex: 1;
    background: var(--line);
    border-radius: 3px 3px 0 0;
  }
  .wx-r24-bar.wet {
    background: var(--accent);
  }
  .wx-r24-axis {
    display: flex;
    justify-content: space-between;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
</style>
