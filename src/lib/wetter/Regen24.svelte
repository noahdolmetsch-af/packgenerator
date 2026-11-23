<script>
  /**
   * «Regen in den nächsten 24 Stunden» (Noah 04.11.2026 «2a»): an own rain strip, one bar per hour, from the
   * weather core of the page. It always works (no outside page needed) and says it in one line:
   * «Rain from 16:00, strongest around 18:00».
   */
  import { CloudRain } from '@lucide/svelte';
  import { rainStrip } from './regen24.js';
  import BarChart from '../charts/BarChart.svelte'; // Wetterseite aufräumen: the one bar chart of the app, with an axis and the exact values on pointing
  import { t, num, locale } from '../i18n.svelte.js';

  let { core = null, now = Date.now() } = $props();

  const strip = $derived(core ? rainStrip(core, now) : null);
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const MM_STEPS = [0.2, 0.5, 1, 2, 5, 10, 20];
  const r1 = (v) => Math.round(v * 10) / 10;
  const cols = $derived((strip?.bars ?? []).map((b, i) => ({ key: b.ms, x: i === 0 ? t('now') : i % 6 === 0 ? hm(b.ms) : '', top: '', parts: b.mm > 0 ? [{ v: b.mm, color: b.wet ? 'var(--accent)' : 'var(--ink-3)' }] : [] })));
  const readout = (i) => {
    const b = strip.bars[i];
    return { title: `${hm(b.ms)}–${hm(b.ms + 36e5)}`, items: [{ label: t('Rain'), value: `${num(r1(b.mm))} mm` }, ...(b.p != null ? [{ label: t('Chance'), value: `${num(Math.round(b.p))} %` }] : [])] };
  };
  const table = $derived({
    head: [t('Hour'), t('Rain'), t('Chance')],
    rows: (strip?.bars ?? []).map((b) => ({ key: b.ms, cells: [`${hm(b.ms)}–${hm(b.ms + 36e5)}`, `${num(r1(b.mm))} mm`, b.p != null ? `${num(Math.round(b.p))} %` : '–'] })),
  });
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
    <BarChart id="wxr24" {cols} {readout} {table} unit="mm" steps={MM_STEPS} maxTop={0} initial={0} height={110} label={say} hint={t('Point at an hour, or tap it, for its rain.')} />
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
</style>
