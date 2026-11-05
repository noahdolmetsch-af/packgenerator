<script>
  /**
   * «Licht für die Fahrt» (Noah 04.11.2026 «5 alle»): sunrise, sunset, the length of the daylight and when to
   * switch the lights on, for today and tomorrow, from the weather core of the page. A suggestion only.
   */
  import { Sunrise, Sunset, Lightbulb } from '@lucide/svelte';
  import { lightDays, hm as split } from './licht.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { core = null, now = Date.now() } = $props();

  const days = $derived(core ? lightDays(core, now) : []);
  const clock = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const length = (min) => {
    const { h, m } = split(min);
    return t('{h} h {m} min of daylight', { h: num(h), m: num(m) });
  };
</script>

{#if days.length}
  <section class="card wx-light" aria-labelledby="wx-light" data-wx-light>
    <h2 id="wx-light" class="wx-light-h"><Sunrise size={18} aria-hidden="true" />{t('Light for your ride')}</h2>
    <ul class="wx-light-days">
      {#each days as d (d.date)}
        <li data-wx-light-day={d.day}>
          <b>{d.day === 'today' ? t('Today') : t('Tomorrow')}</b>
          <span><Sunrise size={16} aria-hidden="true" />{clock(d.rise)}</span>
          <span><Sunset size={16} aria-hidden="true" />{clock(d.set)}</span>
          <small>{length(d.lengthMin)}</small>
          <small class="wx-light-lamp"><Lightbulb size={14} aria-hidden="true" />{t('Lights on from {at}', { at: clock(d.lampOn) })}</small>
        </li>
      {/each}
    </ul>
    <p class="rc-src">{t('Sunrise and sunset from the forecast. The time for the lights is a suggestion: half an hour before sunset.')}</p>
  </section>
{:else}
  <section class="card wx-light" aria-labelledby="wx-light" data-wx-light>
    <h2 id="wx-light" class="wx-light-h"><Sunrise size={18} aria-hidden="true" />{t('Light for your ride')}</h2>
    <p class="rc-note" data-wx-light-empty>{t('No sun times yet. Set a place and sunrise, sunset and the time for the lights show here.')}</p>
  </section>
{/if}

<style>
  .wx-light {
    padding: 12px;
    display: grid;
    gap: 8px;
  }
  .wx-light-h {
    margin: 0;
    font-size: var(--fs-sub);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .wx-light-days {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .wx-light-days li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 14px;
    padding: 6px 8px;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .wx-light-days span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .wx-light-days small {
    color: var(--ink-2);
  }
  .wx-light-lamp {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
</style>
