<script>
  /**
   * v0.102.0 Design-Refresh P4 «Touren» (T3 «Etappen», Etappen-Teiler G11, approved 12.10.2026): the days
   * of a trip of two days or more, each «Tag 1 · Biel → Chasseral · 58 km», a tent for a night after it.
   * «Einteilen» opens a small sheet: where each day ends (km) and the name of the place. Without own
   * stages the route is shared out evenly, as before. Stored as trip.stages (stages.js), with Undo through
   * Pack's change (onchange). Unterwegs takes the same days (ride.js stage).
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { stagePlan, ownStages, cleanStages } from '../stages.js';
  import { backClose } from '../ui/backclose.js';
  import { t, num } from '../i18n.svelte.js';
  import { ChevronRight, Tent, Flag } from '@lucide/svelte';
  import { weiter } from '../daumen.js'; // FE16: «Weiter» to the next field, the number keyboard

  let { trip, onchange = null } = $props();

  const plan = $derived(stagePlan(trip));
  const own = $derived(ownStages(trip));
  const hasRoute = $derived(trip.route?.km > 0);
  const sub = $derived([t('{n} days', { n: plan.length }), own ? t('your own stages') : hasRoute ? t('shared out evenly') : ''].filter(Boolean).join(' · '));
  const way = (s) => [s.day === 0 ? s.from : '', s.to].some(Boolean) ? `${s.day === 0 && s.from ? `${s.from} ` : ''}→ ${s.to || (s.night ? t('night {n}', { n: s.day + 1 }) : t('Finish'))}` : '';

  let el = $state();
  let open = $state(false);
  let form = $state({ start: '', days: [] });
  function edit() {
    form = { start: trip.stages?.start ?? '', days: plan.map((s, n) => ({ km: s.night && s.toKm != null ? String(s.toKm) : '', name: trip.stages?.days?.[n]?.name ?? '' })) };
    open = true;
  }
  $effect(() => {
    if (open && el && !el.open) el.showModal();
  });
  async function save(e) {
    e.preventDefault();
    await onchange?.(() => ({ stages: cleanStages($state.snapshot(form), trip) }));
    el?.close();
  }
  async function reset() {
    await onchange?.(() => ({ stages: null }));
    el?.close();
  }
</script>

<section class="sc" aria-labelledby="sc-h">
  <div class="hd">
    <div>
      <h2 id="sc-h">{t('Stages|trip')}</h2>
      <p class="sub">{sub}</p>
    </div>
    {#if onchange}<button type="button" class="btn btn-link lk" onclick={edit}>{t('Divide|stages')}<ChevronRight size={16} aria-hidden="true" /></button>{/if}
  </div>
  <ol class="card rows">
    {#each plan as s (s.day)}
      <li>
        <span class="ic" aria-hidden="true">{#if s.night}<Tent size={16} />{:else}<Flag size={16} />{/if}</span>
        <span class="tx"><b>{t('Day {n}', { n: s.day + 1 })}</b>{#if way(s)}{' · '}{way(s)}{/if}</span>
        {#if s.km != null}<span class="km num">{num(Math.round(s.km))} km</span>{/if}
      </li>
    {/each}
  </ol>
</section>

{#if open}
  <dialog use:keepTyped={'stages:' + (trip?.id ?? '')} class="sheet stg" bind:this={el} use:backClose onclose={() => (open = false)} aria-labelledby="stg-h">
    <form onsubmit={save} use:weiter>
      <h2 id="stg-h">{t('Divide into stages')}</h2>
      <p class="note">{hasRoute ? t('Where does each day end? In km from the start, and the place if you like. Empty: shared out evenly.') : t('Name the places where each day ends, if you like. With a GPX route the km follow.')}</p>
      <label class="fld"><span class="lbl">{t('Start')}</span><input class="inp" bind:value={form.start} placeholder={t('e.g. Biel')} /></label>
      {#each form.days as d, n (n)}
        <fieldset class="day">
          <legend class="lbl">{t('Day {n}', { n: n + 1 })}</legend>
          <div class="two">
            {#if hasRoute && n < form.days.length - 1}<label><input class="inp num" inputmode="decimal" bind:value={d.km} placeholder={num(Math.round(plan[n].toKm ?? 0))} aria-label={t('Day {n} ends at km', { n: n + 1 })} /><span class="s">{t('ends at km')}</span></label>{/if}
            <label><input class="inp" bind:value={d.name} placeholder={n < form.days.length - 1 ? t('e.g. Chasseral') : t('e.g. Delémont')} aria-label={t('Day {n} ends in', { n: n + 1 })} /><span class="s">{n < form.days.length - 1 ? t('night in') : t('finish in')}</span></label>
          </div>
        </fieldset>
      {/each}
      <div class="foot">
        {#if own}<button type="button" class="btn btn-link" onclick={reset} data-explain={t('Share out evenly again')}>{t('Even out')}</button>{/if}
        <button type="button" class="btn" onclick={() => el.close()}>{t('Cancel')}</button>
        <button type="submit" class="btn hi">{t('Save')}</button>
      </div>
    </form>
  </dialog>
{/if}

<style>
  .sc {
    min-width: 0;
  }
  .hd {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 0 0 8px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lk {
    gap: 2px;
    padding-inline: 4px;
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .rows {
    display: grid;
    margin: 0;
    padding-top: 4px;
    padding-bottom: 4px;
    list-style: none;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .tx {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .tx b {
    font-weight: 500;
  }
  .km {
    flex: none;
    font-weight: 500;
  }
  .stg h2 {
    font-size: var(--fs-section);
  }
  .note {
    margin: 6px 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fld {
    display: grid;
    gap: 2px;
  }
  .day {
    margin: 12px 0 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }
  .two label {
    display: grid;
    gap: 2px;
  }
  .s {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
  .foot .btn-link {
    margin-right: auto;
  }
</style>
