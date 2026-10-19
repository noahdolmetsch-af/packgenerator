<script>
  /**
   * TZ-2 «Fest nach der Fahrt» (mockup TZ2 Tour-Kopf, Noah 13.10.2026 «1-5 a», «TZ1–TZ3 freigegeben»):
   * the band under the step bar of a trip says what its state means here and offers the next step,
   * in the colour of the state (tokens --st-*), always with icon and words:
   *   plan   «Geplant: alles bleibt änderbar.» · Als Vorlage speichern (Plan only)
   *          Impeccable 18.10.2026 (Planen 3): one line «Alles bleibt änderbar, bis du losfährst.» with the
   *          quiet link «Als Vorlage speichern» on the right
   *   done   «Abgeschlossen am 1. Okt.: so bist du gefahren.» the list is fixed · Rückblick ausfüllen · Wieder öffnen
   *          the date passed, never ended: «Datum vorbei. Bist du gefahren?» · Ja · Nicht gefahren
   *   rated  «Bewertet: Rückblick gespeichert am 6. Sept.» · Als Vorlage speichern · Rückblick ändern
   * The buttons are normal ones: the one main button of the page stays in the MainBar.
   * info: tripStateInfo(); debrief: the trip's debrief or null; ontemplate: opens «Save as template»
   * (null: none here); bike: a trip with a bike (the words say «bike» only then).
   */
  import { Pencil, Flag, Star, Undo2 } from '@lucide/svelte';
  import { t, locale } from '../i18n.svelte.js';
  import { tripEnd } from '../tripstate.js';
  import { tabHref } from '../tabs.js';
  import { openTrip } from '../nav.js';
  import Btn from '../ui/Btn.svelte';
  import { asksRide } from './fixed.js';
  import { tz2, askReopen, answerRide } from './reopen.svelte.js';

  let { trip, info, debrief = null, tab = 'plan', ontemplate = null, bike = true } = $props();
  const ICON = { plan: Pencil, done: Flag, rated: Star };
  const Icon = $derived(ICON[info?.state]);
  const ask = $derived(asksRide(info));
  const day = (iso) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '');
  // the day it ended: «Tour beenden» or «Ja» (finished), else its last day
  const endedOn = $derived(day(typeof trip.finished === 'string' ? trip.finished : tripEnd(trip)));
  const ratedOn = $derived(day(debrief?.doneAt ?? debrief?.updatedAt ?? null));
  const debriefHref = $derived(tabHref('debrief', trip));
  // a trip packed in the app waits for its debrief (an imported ride without a list gets «Kurz bewerten» later)
  const canDebrief = $derived(!!trip.entries?.length && !trip.noDebrief);
  const undoHere = $derived(tz2.done?.id === trip.id ? tz2.done : null);
  // the plan band on Plan only (on the packing day it would only repeat itself); done and rated everywhere
  const shown = $derived(!!Icon && !info.early && (info.state !== 'plan' || tab === 'plan'));
  let timer;
  $effect(() => {
    if (!undoHere) return;
    clearTimeout(timer);
    timer = setTimeout(() => (tz2.done = null), 10000);
    return () => clearTimeout(timer);
  });
  async function answer(yes) {
    const undo = await answerRide($state.snapshot(trip), yes);
    if (undo) tz2.done = { id: trip.id, text: yes ? t('Saved: you rode it. The list is fixed now.') : bike ? t('Marked as not ridden.') : t('Marked as not gone.'), undo };
  }
  async function undo() {
    const u = tz2.done;
    tz2.done = null;
    await u?.undo?.();
  }
</script>

{#if shown}
  <section class="stn {info.state}" class:one={info.state === 'plan'} data-state={info.state} data-ask={ask ? '' : undefined} aria-labelledby="stn-h">
    <span class="ic" aria-hidden="true"><Icon size={22} fill={info.state === 'rated' ? 'currentColor' : 'none'} /></span>
    <div class="tx">
      {#if info.state === 'plan'}
        <h2 id="stn-h">{bike ? t('Everything stays changeable until you set off.') : t('Everything stays changeable until you leave.')}</h2>
      {:else if ask}
        <h2 id="stn-h">{bike ? t('Date passed. Did you ride?') : t('Date passed. Did you go?')}</h2>
        <p>{bike ? t('«Yes» ends the trip and fixes its packing list, then the debrief comes. «Not ridden» takes it out of your trips.') : t('«Yes» ends the trip and fixes its packing list, then the debrief comes. «Did not happen» takes it out of your trips.')}</p>
      {:else if info.state === 'done'}
        <h2 id="stn-h">{bike ? t('Completed on {date}: this is how you rode.', { date: endedOn }) : t('Completed on {date}: this is how it went.', { date: endedOn })}</h2>
        <p>{t('The packing list is fixed now.')}{#if canDebrief}{' '}{t('A debrief takes 2 minutes and improves the next trip.')}{/if}</p>
      {:else}
        <h2 id="stn-h">{ratedOn ? t('Rated: debrief saved on {date}', { date: ratedOn }) : t('Rated: debrief saved.')}</h2>
        <p>{t('The learnings help the next trip.')}{#if ontemplate}{' '}{t('As a template you take the list with all changes from the debrief.')}{/if}</p>
      {/if}
      {#if undoHere}<p class="und" role="status"><span>{undoHere.text}</span> <button type="button" class="tp-link" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button></p>{/if}
    </div>
    <div class="rowacts">
      {#if info.state === 'plan'}
        {#if ontemplate}<button type="button" class="btn btn-link tpl" onclick={ontemplate}>{t('Save as template')}</button>{/if}
      {:else if ask}
        <Btn label={t('Yes|rode')} onclick={() => answer(true)} />
        <Btn label={bike ? t('Not ridden|answer') : t('Did not happen')} onclick={() => answer(false)} />
      {:else if info.state === 'done'}
        {#if canDebrief && tab !== 'debrief'}<Btn label={t('Fill in the debrief')} href={debriefHref} onclick={() => openTrip(trip.id)} />{/if}
        <Btn label={t('Reopen')} onclick={() => askReopen(trip)} />
      {:else}
        {#if ontemplate}<Btn label={t('Save as template')} onclick={ontemplate} />{/if}
        <Btn label={t('Change debrief')} href={debriefHref} onclick={() => openTrip(trip.id)} />
      {/if}
    </div>
  </section>
{/if}

<style>
  .stn {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-3) var(--sp-4);
    margin: var(--sp-3) 0 0;
    padding: var(--sp-3) var(--sp-4);
    border-left: 4px solid var(--st-line);
    border-radius: var(--r-ctl);
    background: var(--st-soft);
    color: var(--ink);
  }
  .plan {
    --st-ink: var(--st-plan);
    --st-soft: var(--st-plan-soft);
    --st-line: var(--st-plan-line);
  }
  .done {
    --st-ink: var(--st-done);
    --st-soft: var(--st-done-soft);
    --st-line: var(--st-done-line);
  }
  .rated {
    --st-ink: var(--st-rated);
    --st-soft: var(--st-rated-soft);
    --st-line: var(--st-rated-line);
  }
  /* Planen 3: the plan note is one calm line, the link on the right (also on a phone) */
  .stn.one {
    gap: 0 var(--sp-3);
    padding-block: var(--sp-1);
  }
  /* the words keep a readable width; on a very small phone the link goes under them */
  .stn.one .tx {
    flex: 1 1 120px;
  }
  .stn.one .ic {
    align-self: center;
    margin-top: 0;
  }
  .stn.one h2 {
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .stn.one .rowacts {
    flex: none;
    width: auto;
    margin-left: auto;
  }
  .tpl {
    min-height: 44px;
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    align-self: flex-start;
    margin-top: 2px;
    color: var(--st-ink);
  }
  .tx {
    flex: 1 1 320px;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 700 var(--fs-body) / 1.35 var(--font-body);
    overflow-wrap: break-word;
  }
  p {
    margin: 2px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .und {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    color: var(--ink);
  }
  /* the buttons: the kit's .rowacts (app.css): right on a computer, under the words on a phone;
     there the icon stays beside the words */
  @media (max-width: 719px) {
    .stn:not(.one) {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: start;
    }
  }
  /* a phone turned sideways keeps the band low (as TripBand, v0.30.1 D6): the plan band goes (it only
     explains), the others keep their title and buttons */
  @media (max-height: 500px) {
    .stn.plan {
      display: none;
    }
    .stn {
      margin-top: 6px;
      padding: 6px var(--sp-3);
    }
    .tx > p:not(.und) {
      display: none;
    }
  }
  @media print {
    .stn {
      display: none;
    }
  }
</style>
