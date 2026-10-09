<script>
  /**
   * v0.51.0 «Im Flow» on Today (mockup ImFlow-Heute-Phone): right under the next trip. The three
   * rings (rolling 7 days), what is still open today as one-tap buttons (daily goals), the daily
   * check (Start, or the four numbers when done), «Im Flow ›» and a commute in one tap.
   */
  import { ChevronRight, Sun, Bike, Check } from '@lucide/svelte';
  import Rings from '../flow/Rings.svelte';
  import TickGrid from '../flow/TickGrid.svelte';
  import { flowQuery, seedIfNeeded } from '../flow/data.svelte.js';
  import { flowStates, rings as ringsOf } from '../flow.js';
  import { checkOf, complete, rotating, FIXED } from '../flowcheck.js';
  import { ui, tickWith, actName, qText } from '../flow/ui.svelte.js';
  import { phone } from '../media.svelte.js';
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
  const rot = $derived(data ? rotating(data.pool, today) : null);
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
          <TickGrid states={openToday} {today} cols={2} />
        {/if}
        {#if complete(check)}
          <div class="crow done">
            <Sun size={20} aria-hidden="true" />
            <ul class="nums">
              {#each FIXED as f (f.key)}<li><b class="num">{check[f.key]}</b><small>{t(f.short)}</small></li>{/each}
              <li><b class="num">{check.extra}</b><small>{qText(data.pool.find((x) => x.id === check.q) ?? rot?.q, 'short') || t('4th')}</small></li>
            </ul>
          </div>
        {:else}
          <div class="crow">
            <Sun size={20} aria-hidden="true" />
            <span class="ct"><b>{t('Daily check')}</b><small>{t('4 questions · one tap per question')}</small></span>
            <button type="button" class="btn start" onclick={() => (ui.checkOpen = true)}>{t('Start|check')}</button>
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

<style>
  .fc {
    padding: 18px 22px;
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
  @media (min-width: 900px) {
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
