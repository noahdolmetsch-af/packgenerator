<script>
  /**
   * v0.31.0 (Noah 9a, variant A): the card "Wer schraubt" on Bikes → Setup. The year as one bar
   * (my jobs against the bike shop's visits and what they cost), the last jobs with a badge
   * "me" / "bike shop", and what to give the bike shop next: only the jobs I have not done myself
   * before, with the price from the receipts, and the button to the workshop order.
   */
  import { Wrench, User, Store } from '@lucide/svelte';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { whoYear, recentWork } from './who.js';

  let { bike, visits = [], tasks = [], year, per = null, next = null, onorder } = $props();

  const y = $derived(whoYear(bike, visits, tasks, year));
  const recent = $derived(recentWork(bike, visits, tasks, 2));
  const chf = (n) => `CHF ${Number(n).toLocaleString('de-CH', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  const pct = $derived(y.share == null ? null : Math.round(y.share * 100));
</script>

<section class="card who" aria-labelledby="who-h">
  <h2 id="who-h"><Wrench size={18} aria-hidden="true" />{t('Who works on it')}<span class="r num">{y.year}</span></h2>
  {#if pct != null}
    <div class="split" role="img" aria-label={t('{year}: me {self}, bike shop {shop}', { year: y.year, self: y.self, shop: y.shop })}>
      <i class="me" style:width="{pct}%"></i><i class="shop" style:width="{100 - pct}%"></i>
    </div>
  {/if}
  <p class="legend num">
    <span><i class="dot me"></i>{tn(y.self, 'me: {n} job', 'me: {n} jobs')}</span>
    <span><i class="dot shop"></i>{tn(y.shop, 'bike shop: {n} visit', 'bike shop: {n} visits')}{y.shop ? ` · ${chf(y.chf)}` : ''}{y.unknown ? ` · ${tn(y.unknown, '{n} without a price', '{n} without a price')}` : ''}</span>
    {#if per?.chf != null}<span>{t('{chf} per 1000 km', { chf: chf(per.chf) })}</span>{/if}
  </p>
  <ul class="list">
    {#each recent as r (r.id)}
      <li>
        <span class="nm"><b>{r.what}</b><small class="num">{[dateOf(r.date), r.km != null ? `${num(r.km)} km` : '', r.shop, r.chf != null ? chf(r.chf) : ''].filter(Boolean).join(' · ')}</small></span>
        {#if r.who === 'shop'}<span class="badge mech"><Store size={12} aria-hidden="true" />{t('bike shop|who')}</span>{:else}<span class="badge"><User size={12} aria-hidden="true" />{t('me|who')}</span>{/if}
      </li>
    {:else}
      <li class="quiet">{t('Nothing recorded yet. Bike care keeps who did the work.')}</li>
    {/each}
    <li class="next">
      {#if next?.rows.length}
        <span class="nm"><b>{t('Next for the bike shop')}</b><small class="num">{next.rows.map((r) => r.name).join(', ')}{next.total ? ` · ${t('about CHF {chf}', { chf: num(next.total) })}` : ''}{next.unknown ? ` · ${tn(next.unknown, '{n} without a price', '{n} without a price')}` : ''}</small></span>
        <button type="button" class="btn" onclick={() => onorder?.()}>{t('Order|workshop')}</button>
      {:else}
        <span class="nm"><b>{t('Next for the bike shop')}</b><small>{t('nothing due that you do not do yourself')}</small></span>
      {/if}
    </li>
  </ul>
</section>

<style>
  .who {
    border-radius: 12px;
    margin: 0 0 12px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.25;
  }
  h2 :global(svg) {
    color: var(--ink-3);
    flex: none;
  }
  h2 .r {
    margin-left: auto;
    font-size: 14px;
    font-weight: 400;
    color: var(--ink-3);
  }
  .split {
    display: flex;
    height: 10px;
    border-radius: 9px;
    overflow: hidden;
    margin: 12px 0 6px;
    background: var(--paper-2);
  }
  .split i {
    display: block;
    height: 100%;
  }
  .me {
    background: var(--ink);
  }
  .shop {
    background: #7f9cc4;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 16px;
    margin: 6px 0 4px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: none;
  }
  .list {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
  }
  .list li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .list li:first-child {
    border-top: 0;
  }
  .nm {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: anywhere;
  }
  .nm b {
    font-weight: 600;
  }
  .nm small {
    font-size: 13px;
    color: var(--ink-3);
  }
  .quiet {
    color: var(--ink-3);
    font-size: 14px;
  }
  .badge {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 8px;
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink-2);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  .badge.mech {
    background: #e8eef7;
    border-color: #c5d3e8;
    color: #2c4a75;
  }
  .next .btn {
    flex: none;
    min-height: 44px;
  }
</style>
