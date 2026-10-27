<script>
  /**
   * «Zielzeit nonstop» (Noah 27.10.2026, idea 2): when are you at the finish if you ride through? On the page
   * «Rennen detailliert planen» › a race. km, metres up and start come from the race (route, start day) and
   * can be changed here (stored.nonstop); speed, climbing, stops and tiredness are the race's assumptions
   * (stored.assume, the same as under Strategy). Three answers: good day, as planned, hard day (nonstop.js).
   */
  import { Timer } from '@lucide/svelte';
  import { nonstop, hm } from './nonstop.js';
  import { assumptionsOf, ASSUME } from './strategy.js';
  import { msOf } from './race.js';
  import { t, locale } from '../i18n.svelte.js';

  let { ctx } = $props();
  const ns = $derived(ctx.stored.nonstop ?? {});
  const route = $derived(ctx.stored.route ?? ctx.trip.route ?? null);
  const as = $derived(assumptionsOf(ctx.stored));
  const startDef = $derived(ctx.trip.startDate ? `${ctx.trip.startDate}T${as.startAt?.value ?? '06:00'}` : '');
  const vals = $derived({
    km: ns.km ?? (route?.km ? Math.round(route.km) : ''),
    gainM: ns.gainM ?? (route?.gainM ? Math.round(route.gainM) : ''),
    start: ns.start ?? startDef,
    napMin: ns.napMin ?? 0,
    flatKmh: as.flatKmh.value,
    climbMh: as.climbMh.value,
    pausePct: as.pausePct.value,
    fatiguePct: as.fatiguePct.value,
  });
  const rows = $derived(nonstop(vals));
  const OWN = ['km', 'gainM', 'start', 'napMin'];
  function put(k, raw) {
    const v = k === 'start' ? raw : raw === '' ? '' : Number(raw);
    if (OWN.includes(k)) ctx.save((s) => ({ ...s, nonstop: { ...(s.nonstop ?? {}), [k]: v } }));
    else ctx.save((s) => ({ ...s, assume: { ...(s.assume ?? {}), [k]: v } }));
  }
  const when = (local) => new Date(msOf(local)).toLocaleString(locale(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const dur = (h) => ((x) => t('{h} h {m} min', { h: x.h, m: String(x.m).padStart(2, '0') }))(hm(h));
  const FIELDS = [
    { k: 'km', label: 'Distance', unit: 'km', step: 1 },
    { k: 'gainM', label: 'Metres up', unit: 'm', step: 10 },
    { k: 'flatKmh', label: ASSUME.flatKmh.name, unit: 'km/h', step: 0.5 },
    { k: 'climbMh', label: ASSUME.climbMh.name, unit: 'm/h', step: 10 },
    { k: 'pausePct', label: ASSUME.pausePct.name, unit: '%', step: 1 },
    { k: 'fatiguePct', label: ASSUME.fatiguePct.name, unit: '%', step: 1 },
    { k: 'napMin', label: 'Naps in all', unit: 'min', step: 5 },
  ];
</script>

<section class="rc-box" aria-labelledby="ns-h" data-race-nonstop>
  <h2 id="ns-h" class="rc-h2"><Timer size={18} aria-hidden="true" /> {t('Finish time riding through')}</h2>
  <p class="rc-note">{t('When are you at the finish if you ride through without sleeping? Change any number; speed, climbing, stops and tiredness are the same as under Strategy.')}</p>

  {#if rows}
    <ul class="ns-rows">
      {#each rows as r (r.key)}
        <li class="ns-row" class:ns-plan={r.key === 'plan'} data-nonstop={r.key}>
          <span class="ns-name">{t(r.name)}</span>
          <b class="ns-at">{when(r.finish)}</b>
          <small>{t('{total} in all: riding {ride}, stops {stops}', { total: dur(r.totalH), ride: dur(r.rideH), stops: dur(r.stopH) })}{#if r.napH}{' '}· {t('naps {naps}', { naps: dur(r.napH) })}{/if}</small>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="rc-warn" data-nonstop-missing>{t('Put in the km and the start, then the finish time shows.')}</p>
  {/if}

  <details class="ns-more">
    <summary data-nonstop-edit>{t('Change the numbers')}</summary>
    <div class="ns-fields">
      <label class="rc-lab">{t('Start')}<input class="inp" type="datetime-local" value={vals.start} onchange={(e) => put('start', e.currentTarget.value)} data-nonstop-field="start" /></label>
      {#each FIELDS as f (f.k)}
        <label class="rc-lab">{t(f.label)}{f.unit ? ` (${f.unit})` : ''}<input class="inp" type="number" inputmode="decimal" min="0" step={f.step} value={vals[f.k]} onchange={(e) => put(f.k, e.currentTarget.value)} data-nonstop-field={f.k} /></label>
      {/each}
    </div>
    <p class="rc-note">{t('Good day: 10 % faster and fewer stops. Hard day: 10 % slower and more stops. Only a guide.')}</p>
  </details>
  <small class="rc-note">{t('Rule: km ÷ speed on the flat + metres up ÷ climbing rate, plus tiredness, then the stops on top.')}</small>
</section>

<style>
  .ns-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .ns-row {
    display: grid;
    gap: 2px;
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  .ns-plan {
    border-color: var(--accent);
  }
  .ns-name {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ns-at {
    font-size: var(--fs-section);
  }
  .ns-more summary {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: 600;
  }
  .ns-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 8px;
  }
</style>
