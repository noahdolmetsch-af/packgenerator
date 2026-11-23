<script>
  /**
   * «Regen in den nächsten 3 Stunden» (Wetter-Ausbau B, Noah 22.11.2026 «a»): the card of the part «Jetzt» under «Today».
   * 15-minute bars for the next three hours and one sentence («Dry until 16:30. Then about 40 minutes of rain …»).
   * It answers «Should I go now?» without a window; the Landi radar stays one tap away (it opens the part «Radar and cameras»).
   * Quiet: without a place or without an answer it shows nothing. The strip fills itself every 5 minutes.
   */
  import { CloudRain } from '@lucide/svelte';
  import { db } from '../db.js';
  import { loadRain15, rain15Strip, rain15Say, bar15Pct } from './regen15.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { place = null, now = Date.now(), onradar = null } = $props();

  let rows = $state(null);
  let key = '';
  const read = (pl, k, force = false) =>
    loadRain15(db, pl, { force })
      .then((r) => k === key && (rows = r?.rows ?? null))
      .catch(() => {});
  $effect(() => {
    const k = place ? `${Number(place.lat)},${Number(place.lon)}` : '';
    if (k === key) return;
    key = k;
    rows = null;
    if (place) read(place, k);
  });
  $effect(() => {
    const id = setInterval(() => place && read(place, key), 5 * 60_000);
    return () => clearInterval(id);
  });

  const strip = $derived(rows ? rain15Strip(rows, now) : null);
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const say = $derived.by(() => {
    const s = rain15Say(strip);
    if (!s) return '';
    if (s.kind === 'dry') return t('Dry for the next 3 hours.');
    if (s.kind === 'nowAll') return t('It rains now and keeps on for the next 3 hours.');
    if (s.kind === 'now') return t('It rains now, until about {to}.', { to: hm(s.to) });
    if (s.kind === 'laterAll') return t('Dry until {from}. Then it rains for the rest of the next 3 hours.', { from: hm(s.from) });
    return t('Dry until {from}. Then about {min} minutes of rain, dry again from {to}.', { from: hm(s.from), min: num(s.minutes), to: hm(s.to) });
  });
  const axis = $derived(strip ? [strip.bars[0], strip.bars[Math.min(4, strip.bars.length - 1)], strip.bars[Math.min(8, strip.bars.length - 1)], strip.bars.at(-1)] : []);
</script>

{#if strip}
  <section class="card wx-r3" aria-labelledby="wx-r3" data-wx-r3>
    <h2 id="wx-r3" class="wx-r3-h"><CloudRain size={18} aria-hidden="true" />{t('Rain in the next 3 hours')}</h2>
    <p class="wx-r3-say" data-wx-r3-say>{say}</p>
    <div class="wx-r3-bars" role="img" aria-label={say}>
      {#each strip.bars as b (b.ms)}
        <span class="wx-r3-bar" class:wet={b.wet} style="height:{bar15Pct(b, strip.max)}%" title="{hm(b.ms)} · {num(Math.round(b.mm * 10) / 10)} mm"></span>
      {/each}
    </div>
    <div class="wx-r3-axis" aria-hidden="true">
      {#each axis as a, i (i)}<span>{i === 0 ? t('now') : hm(a.ms)}</span>{/each}
    </div>
    {#if onradar}<button type="button" class="btn sm" onclick={onradar} data-wx-r3-radar><CloudRain size={16} aria-hidden="true" />{t('Landi rain radar in a window')}</button>{/if}
    <p class="rc-src">{t('From the forecast, in steps of 15 minutes. A guide, not a promise.')}</p>
  </section>
{/if}

<style>
  .wx-r3 {
    padding: 12px;
    display: grid;
    gap: 8px;
  }
  .wx-r3-h {
    margin: 0;
    font-size: var(--fs-sub);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .wx-r3-say {
    margin: 0;
    font-weight: 600;
  }
  .wx-r3-bars {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 64px;
  }
  .wx-r3-bar {
    flex: 1;
    background: var(--line);
    border-radius: 3px 3px 0 0;
  }
  .wx-r3-bar.wet {
    background: var(--accent);
  }
  .wx-r3-axis {
    display: flex;
    justify-content: space-between;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
  .wx-r3 .btn {
    justify-self: start;
  }
</style>
