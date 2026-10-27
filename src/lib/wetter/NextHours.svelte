<script>
  /**
   * «Die nächsten Stunden» (Ziel 6, Noah 27.10.2026 «4a»): the next 2, 4, 6 and 8 hours from several weather
   * models side by side (wetter/stunden.js). Each row says whether the models agree (all dry, all rain, or
   * «2 of 5 models: rain»), the rain range, temperatures and the strongest gust. «Show the models» opens the
   * numbers of each model. Only a guide: the page says where the numbers come from.
   */
  import { CloudRain, Sun, CloudSun, Wind, Zap, RefreshCw, ChevronDown } from '@lucide/svelte';
  import { db } from '../db.js';
  import { loadHours, steps, AGREE_TEXT } from './stunden.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { place = null } = $props();

  let data = $state(null);
  let busy = $state(false);
  let err = $state('');
  let now = $state(Date.now());
  let open = $state(false);

  async function load(force = false) {
    if (!place) return;
    busy = true;
    err = '';
    try {
      data = await loadHours(db, place, { force });
      if (!data) err = navigator.onLine === false ? t('Offline: no hours kept for this place yet.') : t('The weather models did not answer. Try again in a moment.');
    } finally {
      busy = false;
      now = Date.now();
    }
  }
  let lastKey = '';
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k && k !== lastKey) {
      lastKey = k;
      load();
    }
  });

  const rows = $derived(data ? steps(data, now) : []);
  const names = $derived((data?.models ?? []).map((m) => m.name));
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const asOf = $derived(data?.at ? hm(data.at) : '');
  const range = (a, unit) => (a ? (a[0] === a[1] ? `${num(a[0])} ${unit}` : `${num(a[0])}–${num(a[1])} ${unit}`) : '');
  const agreeText = (r) => t(AGREE_TEXT[r.agree], { n: r.of, wet: r.wet });
</script>

<section class="card nh" aria-labelledby="nh-h" data-wx-hours>
  <h2 id="nh-h" class="nh-h"><CloudSun size={18} aria-hidden="true" />{t('The next hours')}</h2>
  <p class="nh-lead">{t('Several weather models side by side. Where they agree, the forecast is surer.')}</p>

  {#if err}<p class="rc-warn" role="status" data-wx-hours-error>{err}</p>{/if}
  {#if busy && !data}<p class="rc-note">{t('Loading…')}</p>{/if}

  {#if rows.length && rows[0].of}
    <ul class="nh-rows">
      {#each rows as r (r.h)}
        <li class="nh-row" data-wx-hours-step={r.h} data-agree={r.agree}>
          <b class="nh-in">{t('in {n} h', { n: r.h })}</b>
          <span class="nh-agree a-{r.agree}">
            {#if r.agree === 'dry'}<Sun size={15} aria-hidden="true" />{:else}<CloudRain size={15} aria-hidden="true" />{/if}
            {agreeText(r)}
          </span>
          <span class="nh-vals">
            {#if r.rainMm && r.rainMm[1] > 0}<span>{range(r.rainMm, 'mm')}{#if r.rainFrom}{' '}· {t('from {at}', { at: hm(r.rainFrom) })}{/if}</span>{/if}
            {#if r.temp}<span>{range(r.temp, '°C')}</span>{/if}
            {#if r.gust != null}<span><Wind size={13} aria-hidden="true" />{t('gusts up to {kmh} km/h', { kmh: num(Math.round(r.gust)) })}</span>{/if}
            {#if r.thunder}<span class="nh-thunder"><Zap size={13} aria-hidden="true" />{t('{n} models: thunderstorms', { n: r.thunder })}</span>{/if}
          </span>
        </li>
      {/each}
    </ul>

    <details class="nh-more" bind:open>
      <summary data-wx-hours-models><ChevronDown size={16} aria-hidden="true" />{t('Show the models')}</summary>
      <div class="nh-tw">
        <table>
          <thead><tr><th>{t('Model')}</th>{#each rows as r (r.h)}<th>{t('{n} h', { n: r.h })}</th>{/each}</tr></thead>
          <tbody>
            {#each names as name, i (name)}
              <tr>
                <th scope="row">{name}</th>
                {#each rows as r (r.h)}
                  {@const m = r.models.find((x) => x.name === name)}
                  <td>{m ? `${num(m.w.rainMm ?? 0)} mm · ${num(Math.round(m.w.tmax ?? 0))} °C` : '–'}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="rc-src">{t('Rain is the sum from now until then; °C the warmest hour. MeteoSchweiz covers Switzerland and its neighbours, AROME France, ICON-D2 Central Europe, ECMWF the whole world. A model that does not cover the place is left out.')}</p>
    </details>
  {/if}

  <div class="nh-foot">
    {#if asOf}<small>{t('As of {at}', { at: asOf })}{data?.old ? ` · ${t('older than an hour')}` : ''} · {t('Open-Meteo, {n} models', { n: names.length })}</small>{/if}
    <button type="button" class="btn sm" onclick={() => load(true)} disabled={busy || !place} data-wx-hours-reload><RefreshCw size={14} aria-hidden="true" />{t('Update')}</button>
  </div>
</section>

<style>
  .nh {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-3);
  }
  .nh-h {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    font-size: var(--fs-section);
  }
  .nh-lead {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nh-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .nh-row {
    display: grid;
    grid-template-columns: 4.5rem 1fr;
    gap: var(--sp-1) var(--sp-3);
    padding-bottom: var(--sp-2);
    border-bottom: 1px solid var(--line);
  }
  .nh-in {
    grid-row: span 2;
    font-variant-numeric: tabular-nums;
  }
  .nh-agree {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    font-weight: 600;
  }
  .a-split {
    color: var(--warn);
  }
  .a-wet {
    color: var(--accent);
  }
  .nh-vals {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1) var(--sp-3);
    color: var(--ink-2);
    font-size: var(--fs-small);
    min-width: 0;
  }
  .nh-vals span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .nh-thunder {
    color: var(--warn);
  }
  .nh-more summary {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    font-weight: 600;
    min-height: 44px;
  }
  .nh-more {
    min-width: 0;
  }
  .nh-tw {
    overflow-x: auto;
    max-width: 100%;
  }
  table {
    border-collapse: collapse;
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
  }
  th,
  td {
    text-align: left;
    padding: 4px 8px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  .nh-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    color: var(--ink-2);
  }
</style>
