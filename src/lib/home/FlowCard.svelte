<script>
  /**
   * v0.51.0 «Im Flow» on Today (mockup ImFlow-Heute-Phone): right under the next trip. The three
   * rings (rolling 7 days), what is still open today as one-tap buttons (daily goals), the daily
   * check (Start, or the four numbers when done), «Im Flow ›» and a commute in one tap.
   * v0.94.0 «Kachel-Wand»: a tap on Meditation opens its start sheet here too, as on Aktiv (Q5 a).
   * v0.127.0 «Tages-Check» 1: the check row opens the morning check page; from 20:30 the evening review.
   * WG «Wi gaht's?» takes over the daily check: the row shows today's sleep, energy and mood (answered in
   * «Wi gaht's?», mirrored into the day's check) and leads to «Wi gaht's?» (#/me/abfragen); from the
   * evening round time the evening round with the satisfaction of «Wi gaht's?».
   */
  import { ChevronRight, Sun, Moon, Bike, Check } from '@lucide/svelte';
  import Rings from '../flow/Rings.svelte';
  import TickGrid from '../flow/TickGrid.svelte';
  import { flowQuery, seedIfNeeded } from '../flow/data.svelte.js';
  import { flowStates, rings as ringsOf } from '../flow.js';
  import { checkOf, FIXED } from '../flowcheck.js';
  import { abQuery } from '../abdb.js';
  import { configOf, isEveningRound, lastAnswer, stampOf } from '../abfragen.js';
  import { tickWith, actName } from '../flow/ui.svelte.js';
  import { phone } from '../media.svelte.js';
  import MedStartSheet from '../flow/MedStartSheet.svelte';
  import { t } from '../i18n.svelte.js';

  let { today } = $props();
  const q = $derived(flowQuery(today));
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const states = $derived(data ? flowStates(data.acts, data.log, today, data.tripDays) : []);
  const rings = $derived(ringsOf(states, data?.log ?? [], today));
  // still open today: the daily goals not reached, and what was ticked today (to see it and take it back)
  const openToday = $derived(states.filter((s) => !s.resting && s.daily && (s.open || s.todayDone)).slice(0, phone.matches ? 2 : 4));
  const commuter = $derived(states.find((s) => !s.resting && s.act.counts.includes('commute')) ?? null);
  const check = $derived(checkOf(data?.checks.find((c) => c.day === today), today));
  // WG: the evening round from its time (Ich › «Wi gaht's?» › «Feste Runden»), the satisfaction from «Wi gaht's?»
  const abq = $derived(abQuery(today));
  const ab = $derived($abq);
  let now = $state(stampOf());
  $effect(() => {
    const id = setInterval(() => (now = stampOf()), 60_000);
    return () => clearInterval(id);
  });
  const evening = $derived(isEveningRound(now, configOf(ab?.cfg).rounds));
  const sat = $derived(lastAnswer((ab?.answers ?? []).filter((a) => a.day === today), 'erreicht.zufrieden')?.value ?? check.sat);
  const known = $derived(FIXED.some((f) => check[f.key] != null));
  let medFor = $state(null);
  const medSt = $derived(medFor ? (states.find((s) => s.act.id === medFor) ?? null) : null);
</script>

{#if data && states.length}
  <section class="fc surf" data-section="flow" aria-labelledby="fc-h">
    <div class="hd">
      <h2 id="fc-h" class="sh">{t('In the flow')}</h2>
      <span class="quiet">{t('last 7 days')}</span>
    </div>
    <div class="body">
      <div class="rg"><Rings {rings} size={phone.matches ? 104 : 120} compact /></div>
      <div class="now">
        {#if openToday.length}
          <p class="kick">{t('Still today')}</p>
          <TickGrid states={openToday} {today} cols={2} onmed={(s) => (medFor = s.act.id)} />
        {/if}
        {#if evening}
          <!-- WG: from the evening round time the entry offers the evening round of «Wi gaht's?» -->
          <div class="crow" class:done={sat != null} data-check-entry="evening">
            <Moon size={20} aria-hidden="true" />
            <span class="ct"><b>{t('Evening round')}</b><small>{sat != null ? t('Satisfaction {n} of 10', { n: sat }) : t('How was your day? · about 30 seconds')}</small></span>
            <a class="btn start" href="#/me/abfragen">{sat != null ? t('Change') : t('Start|check')}</a>
          </div>
        {:else if known}
          <!-- WG: today's sleep, energy and mood from «Wi gaht's?» (through the day's check) -->
          <div class="crow done" data-check-entry="morning">
            <Sun size={20} aria-hidden="true" />
            <ul class="nums">
              {#each FIXED as f (f.key)}<li data-val={f.key}><b class="num">{check[f.key] ?? '–'}</b><small>{t(f.short)}</small></li>{/each}
            </ul>
            <a class="btn start" href="#/me/abfragen">{t('Change')}</a>
          </div>
        {:else}
          <div class="crow" data-check-entry="morning">
            <Sun size={20} aria-hidden="true" />
            <span class="ct"><b>{t('Morning round')}</b><small>{t('a few questions · one tap each')}</small></span>
            <a class="btn start" href="#/me/abfragen">{t('Start|check')}</a>
          </div>
        {/if}
      </div>
    </div>
    <div class="ft">
      <a class="lk" href="#/flow">{t('In the flow')}<ChevronRight size={16} aria-hidden="true" /></a>
      {#if commuter}
        {#if commuter.commuteToday}
          <span class="quiet cm"><Check size={16} aria-hidden="true" />{t('{name} today: commute', { name: actName(commuter.act) })}</span>
        {:else}
          <button type="button" class="btn sm cmb" onclick={() => tickWith(commuter.act, { via: 'commute', n: 1 })}><Bike size={16} aria-hidden="true" />{t('Commute')}</button>
        {/if}
      {/if}
    </div>
  </section>
{/if}
{#if medSt}<MedStartSheet st={medSt} {today} onclose={() => (medFor = null)} />{/if}

<style>
  .fc {
    padding: 18px 22px;
    /* v0.94.0 «Kachel-Wand»: the card can be a large tile (half the wall) or a whole row */
    container-type: inline-size;
  }
  @media (max-width: 719px) {
    .fc {
      padding: 14px 14px;
    }
  }
  .hd {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .sh {
    margin: 0;
    font-size: var(--fs-section);
    font-weight: 500;
  }
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  @container (min-width: 760px) {
    .body {
      grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
      gap: 28px;
      align-items: start;
    }
  }
  .now {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .kick {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .crow {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 8px 8px 14px;
    border-radius: 14px;
    background: var(--paper-2);
    color: var(--warn);
  }
  .crow.done {
    color: var(--ok);
    padding-block: 10px;
  }
  .ct {
    flex: 1;
    min-width: 0;
    color: var(--ink);
    line-height: 1.3;
  }
  .ct b {
    display: block;
    font-weight: 500;
  }
  .ct small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .start {
    min-height: 44px;
    border-color: transparent;
    border-radius: 10px;
    box-shadow: var(--card-shadow);
  }
  .nums {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink);
  }
  .nums b {
    display: block;
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-section);
    line-height: 1;
  }
  .nums small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ft {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    margin-top: 8px;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    color: var(--accent);
    font-weight: 500;
    text-decoration: none;
  }
  .cm {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .cmb {
    border-color: var(--line);
    border-radius: 10px;
  }
</style>
