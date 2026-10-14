<script>
  /**
   * Ich › Bezahlen (#/me/pay; mockups BZ1 + BZ2b, Noah 14.10.2026 01:31 «1a 2b», «bz freigeben»):
   * explains what the payment parts can already do (prepared, test mode only, nothing locked) and
   * what Noah could build on them. Ideas as cards on top, then prepared, costs, still missing.
   * Read only: no buttons that pay or switch anything on.
   * Rechnungen (Noah 14.10.2026 03:39 «1a», mockups QR1–QR8 approved 04:00): the one row on top
   * leads to the invoices without a provider (QR bill + TWINT).
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, tn } from '../lib/i18n.svelte.js';
  import { USE_CASES, PREPARED, COSTS, MISSING } from '../lib/pay/info.js';
  import { Info, Star, Volleyball, Route, Wrench, FileText, Gift, CreditCard, KeyRound, ShoppingBag, CalendarDays, Users, Check } from '@lucide/svelte';
  import { listInvoices, openSummary } from '../lib/pay/invoices.js';
  import { formatAmount } from '../lib/pay/qrbill.js';
  import { ChevronRight, ReceiptText } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  let invLine = $state('');
  listInvoices().then((list) => {
    const s = openSummary(list);
    invLine = list.length ? `${tn(s.count, '{n} open', '{n} open')} · ${t('{amount} CHF outstanding', { amount: formatAmount(s.sum) })}` : t('QR bill and TWINT, free');
  });

  const ICONS = { star: Star, tennis: Volleyball, route: Route, wrench: Wrench, file: FileText, gift: Gift, card: CreditCard, key: KeyRound, bag: ShoppingBag, cal: CalendarDays, users: Users };
</script>

<div class="ich-page pay">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Payments')} sub={t('What is prepared and what you could do with it.')} />

  <p class="pay-band" role="note">
    <Info size={18} aria-hidden="true" />
    <span><b>{t('Prepared, not active yet.')}</b> {t('Nothing in the app is locked and no money moves. Testing happens only in test mode with test cards.')}</span>
  </p>

  <a class="card ich-row pay-inv" href="#/me/pay/invoices">
    <span class="ich-ib"><ReceiptText size={18} aria-hidden="true" /></span>
    <span class="ich-m"><b>{t('Invoices')}</b><small>{invLine || t('QR bill and TWINT, free')}</small></span>
    <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
  </a>

  <section class="ich-sec" aria-labelledby="pay-uc-h">
    <div class="ich-h"><div><h2 id="pay-uc-h">{t('What you could use it for')}</h2></div></div>
    <ul class="pay-cards">
      {#each USE_CASES as u (u.title)}
        {@const Icon = ICONS[u.icon]}
        <li class="card pay-card">
          <span class="pay-ib"><Icon size={20} aria-hidden="true" /></span>
          <b>{t(u.title)}</b>
          <p>{t(u.text)}</p>
          <small>{t(u.example)}</small>
        </li>
      {/each}
    </ul>
  </section>

  <div class="ich-cols">
    <div class="ich-main">
      <section class="ich-sec" aria-labelledby="pay-have-h">
        <div class="ich-h"><div><h2 id="pay-have-h">{t('Already prepared')}</h2></div></div>
        <ul class="card ich-list">
          {#each PREPARED as p (p.title)}
            {@const Icon = ICONS[p.icon]}
            <li class="ich-row">
              <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t(p.title)}</b><small>{t(p.text)}</small></span>
              <span class="pay-ok"><Check size={14} strokeWidth={3} aria-hidden="true" />{t('ready|pay')}</span>
            </li>
          {/each}
        </ul>
      </section>
    </div>
    <div class="ich-side">
      <section class="ich-sec" aria-labelledby="pay-cost-h">
        <div class="ich-h"><div><h2 id="pay-cost-h">{t('What it costs')}</h2></div></div>
        <div class="card pay-cost">
          <dl>
            {#each COSTS.filter((c) => !c.later) as c (c.label)}<dt>{t(c.label)}</dt><dd class="num">{t(c.value)}</dd>{/each}
          </dl>
          <h3>{t('Later, with real money')}</h3>
          <dl>
            {#each COSTS.filter((c) => c.later) as c (c.label)}<dt>{t(c.label)}</dt><dd class="num">{t(c.value)}</dd>{/each}
          </dl>
          <p class="ich-fine">{t('Selling to others needs terms, a privacy notice and an imprint, and the income is taxed.')}</p>
        </div>
      </section>
      <section class="ich-sec" aria-labelledby="pay-miss-h">
        <div class="ich-h"><div><h2 id="pay-miss-h">{t('Still missing')}</h2></div></div>
        <ul class="card pay-miss">
          {#each MISSING as m (m)}<li>{t(m)}</li>{/each}
        </ul>
      </section>
    </div>
  </div>
</div>

<style>
  .pay-band {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0 0 24px;
    padding: 12px 16px;
    border-radius: var(--radius-card);
    background: var(--warn-soft);
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .pay-band :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--warn);
  }
  .pay-band span {
    min-width: 0;
  }
  .pay-cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: 14px;
  }
  .pay-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .pay-card b {
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .pay-card p {
    margin: 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .pay-card small {
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pay-ib {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    display: grid;
    place-items: center;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .pay-ok {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: none;
    color: var(--ok);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .pay-cost dl {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px 16px;
    margin: 0;
  }
  .pay-cost dt {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .pay-cost dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
    white-space: nowrap;
  }
  .pay-cost h3 {
    margin: 16px 0 8px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-3);
  }
  .pay-cost .ich-fine {
    margin-top: 14px;
  }
  .pay-inv {
    margin: 0 0 20px;
  }
  .pay-miss {
    margin: 0;
    padding: 12px 16px 12px 36px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--ink-2);
  }
</style>
