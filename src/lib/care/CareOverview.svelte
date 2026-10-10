<script>
  /**
   * v0.48.0 «Pflege-Übersicht C» (Noah, «Drei Seiten» C 1-15 a): the top of Velopflege.
   * - one ring per bike (0-100, the share of parts with nothing due; brakes and drivetrain double),
   *   km since the last check and «n due»; a tap opens that bike;
   * - «Due now»: at most three cards over all bikes, each with its one button and the part's flow;
   * - the problems of all bikes as one flat list (ProblemList), a milestone («8 weeks without a
   *   breakdown»), km since the last check as bars;
   * - beside: for the bike shop (the order), the costs of the year, the bike diary.
   */
  import { Flag, Trophy, Droplet, Gauge, Wrench, CircleAlert, Check, ChevronRight, Store, CircleDollarSign, BookOpen, ArrowLeftRight, Ruler, Tag, Plus, Share } from '@lucide/svelte';
  import { ringScore, ringTone, dueCards, kmSinceService, calmWeeks, diary, costYear } from './overview.js';
  import { workWords } from './last.js';
  import ProblemList from './ProblemList.svelte';
  import { bikesHash, bikeTypeName } from '../bikes.js';
  import { openNew } from '../nav.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';

  let { checks = [], problems = [], tasks = [], visits = [], today, bikeIdOf, onopen, ondone, onflow, onorder, onrepair, onwork } = $props();

  const bikes = $derived(checks.map((c) => c.bike));
  const rings = $derived(checks.map((c) => ({ c, ring: ringScore(c.bike, c.time, today), km: kmSinceService(c.bike) })));
  const due = $derived(dueCards(checks, 3));
  const openProblems = $derived(problems.filter((x) => x.status === 'open' || x.status === 'needed'));
  const calm = $derived(calmWeeks(tasks, bikes, today));
  const log = $derived(diary(bikes, tasks, 5));
  const year = $derived(today.slice(0, 4));
  const cost = $derived(costYear(bikes, visits, year));
  const orders = $derived(checks.filter((c) => c.order?.rows.length));

  const short = (name) => String(name ?? '');
  const chf = (n) => n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const C = 2 * Math.PI * 26;
  const KIND_ICON = { km: Droplet, time: Wrench, check: Gauge, part: CircleAlert };
  const LOG_ICON = { replace: ArrowLeftRight, service: Droplet, check: Check, wash: Droplet, repair: Wrench, milestone: Trophy };
  const when = (r) => (r.kind === 'part' ? t('now|due') : r.detail?.match(/overdue|überfällig/i) ? t('overdue|part') : t('due|part'));
</script>

<section class="ov" aria-label={t('Care overview')}>
  <div class="ovhead">
    <p class="page-sub num">{[tn(bikes.length, '{n} bike', '{n} bikes'), tn(due.total, '{n} due now', '{n} due now'), tn(openProblems.length, '{n} problem open', '{n} problems open')].join(' · ')}</p>
    <div class="ovacts">
      <button type="button" class="btn" onclick={() => openNew('problem')}><Plus size={16} aria-hidden="true" />{t('Report a problem')}</button>
      <button type="button" class="btn hi" onclick={onwork}><Wrench size={16} aria-hidden="true" />{t('Record work')}</button>
    </div>
  </div>

  <ul class="rings" aria-label={t('Bikes')}>
    {#each rings as { c, ring, km } (c.bike.id)}
      <li>
        <button type="button" class="ring surf" onclick={() => onopen(c.bike.id)} aria-label={ring.score == null ? t('{bike}: no data yet', { bike: c.bike.name }) : t('{bike}: {score} of 100', { bike: c.bike.name, score: ring.score })}>
          <svg class="dial {ringTone(ring.score)}" viewBox="0 0 64 64" aria-hidden="true">
            <circle class="track" cx="32" cy="32" r="26" />
            {#if ring.score != null}<circle class="val" cx="32" cy="32" r="26" stroke-dasharray="{(C * ring.score) / 100} {C}" transform="rotate(-90 32 32)" />{/if}
            <text x="32" y="38" text-anchor="middle">{ring.score ?? '–'}</text>
          </svg>
          <span class="rt">
            <b class="bn">{c.bike.name}</b>
            <small class="num">{[c.bike.type ? t(bikeTypeName(c.bike.type)) : '', c.bike.km != null ? `${num(c.bike.km)} km` : t('km not set')].filter(Boolean).join(' · ')}</small>
            {#if km}<span class="mini"><span class="mb" aria-hidden="true"><i style="width:{Math.max(4, Math.min(100, Math.round((km.since / km.every) * 100)))}%" class:late={km.since >= km.every}></i></span><small class="num">{t('{km} km since the check', { km: num(km.since) })}</small></span>{/if}
            {#if c.care.rows.filter((r) => r.kind !== 'repair').length}<i class="pill act">{tn(c.care.rows.filter((r) => r.kind !== 'repair').length, '{n} due', '{n} due')}</i>{:else if ring.score == null}<i class="pill">{t('no data')}</i>{:else}<i class="pill ok">{t('nothing due')}</i>{/if}
          </span>
          <ChevronRight class="chev" size={18} aria-hidden="true" />
        </button>
      </li>
    {/each}
  </ul>

  <div class="ovcols">
    <div class="ovmain">
      <div class="duehead">
        <h2 class="sh"><Flag size={18} aria-hidden="true" />{t('Due now')} <span class="n num">{due.total}</span></h2>
        {#if calm != null && calm >= 2}<p class="calm"><Trophy size={16} aria-hidden="true" />{tn(calm, '{n} week without a breakdown', '{n} weeks without a breakdown')}</p>{/if}
      </div>
      {#if due.cards.length}
        <ul class="cards">
          {#each due.cards as d (`${d.bike.id}:${d.row.key}`)}
            {@const I = KIND_ICON[d.row.kind] ?? Wrench}
            <li class="dcard surf {d.row.kind === 'part' ? 'bad' : 'warn'}">
              <div class="dtop"><span class="ic" aria-hidden="true"><I size={18} /></span><i class="nbadge">{short(d.bike.name)}</i><i class="pill" class:act={d.row.kind === 'part'} class:warn={d.row.kind !== 'part'}>{when(d.row)}</i></div>
              <p class="dn">{d.row.name}</p>
              <p class="dd">{d.row.detail}</p>
              <div class="dacts">
                {#if d.row.kind === 'time' || d.row.kind === 'km'}
                  <button type="button" class="btn sm" onclick={() => ondone(d.bike.id, d.row)}><Check size={16} aria-hidden="true" />{t('Done|task')}</button>
                  {#if d.row.part}<button type="button" class="btn sm" onclick={() => onflow(d.bike.id, d.row.part, 'service')}>{t('Record …')}</button>{/if}
                {:else if d.row.kind === 'part' && d.row.part}
                  <button type="button" class="btn sm" onclick={() => onflow(d.bike.id, d.row.part, 'replace')}>{t('Replace|part')}</button>
                  <button type="button" class="btn sm" onclick={() => onflow(d.bike.id, d.row.part, 'service')}>{t('Check|verb')}</button>
                {:else}
                  <button type="button" class="btn sm" onclick={() => onopen(d.bike.id, 'check')}>{t('Look at the check')}</button>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
        {#if due.total > due.cards.length}<p class="more">{tn(due.total - due.cards.length, '{n} more due: open the bike', '{n} more due: open the bike')}</p>{/if}
      {:else}
        <p class="quiet">{t('Nothing due now on any bike.')}</p>
      {/if}

      <ProblemList repairs={problems} {bikes} {today} {bikeIdOf} {onrepair} filterable />

      {#if rings.some((r) => r.km)}
        <section class="kms surf" aria-labelledby="kms-h">
          <h2 id="kms-h" class="sh"><Gauge size={18} aria-hidden="true" />{t('km since the check')}</h2>
          <ul>
            {#each rings.filter((r) => r.km) as { c, km } (c.bike.id)}
              <li>
                <span class="kn"><b>{c.bike.name}</b>{#if km.date}<small>{t('since {date}', { date: dateOf(km.date) })}</small>{/if}</span>
                <span class="kb" aria-hidden="true"><i style="width:{Math.max(2, Math.min(100, Math.round((km.since / km.every) * 100)))}%" class:late={km.since >= km.every}></i></span>
                <span class="kv num">{num(km.since)} <span class="m">/ {num(km.every)}</span></span>
              </li>
            {/each}
          </ul>
          <p class="foot">{t('Bar = share of the check interval, from zero.')}</p>
        </section>
      {/if}
    </div>

    <aside class="ovside">
      <section class="side surf" aria-labelledby="shop-h">
        <h2 id="shop-h" class="sh"><Store size={18} aria-hidden="true" />{t('For the bike shop')}</h2>
        {#if orders.length}
          <ul class="olist">
            {#each orders as c (c.bike.id)}
              {#each c.order.rows.slice(0, 3) as r (r.key)}<li><span>{r.name}</span><i class="nbadge">{short(c.bike.name)}</i></li>{/each}
            {/each}
          </ul>
          <div class="sacts">
            {#each orders as c (c.bike.id)}<button type="button" class="btn sm" onclick={() => onorder(c.bike.id)}><Share size={16} aria-hidden="true" />{orders.length > 1 ? t('Order for {bike}', { bike: short(c.bike.name) }) : t('Share the order')}</button>{/each}
          </div>
        {:else}
          <p class="quiet">{t('Nothing for the bike shop right now.')}</p>
        {/if}
        <a class="slink" href={bikesHash({ tab: 'shop' })}>{t('Workshop & receipts')}<ChevronRight size={16} aria-hidden="true" /></a>
      </section>

      <section class="side surf" aria-labelledby="cost-h">
        <div class="costh"><h2 id="cost-h" class="sh"><CircleDollarSign size={18} aria-hidden="true" />{t('Costs {year}', { year })}</h2><b class="bignum num">CHF {num(Math.round(cost.total))}</b></div>
        <ul class="costs">
          {#each cost.rows as r (r.bike.id)}
            <li><span class="cn">{short(r.bike.name)}</span><span class="cb" aria-hidden="true"><i style="width:{cost.max ? Math.round((r.chf / cost.max) * 100) : 0}%"></i></span><span class="cv num">{chf(r.chf)}</span></li>
          {/each}
        </ul>
      </section>

      <section class="side surf" aria-labelledby="diary-h">
        <h2 id="diary-h" class="sh"><BookOpen size={18} aria-hidden="true" />{t('Bike diary')}</h2>
        {#if log.length}
          <ol class="diary">
            {#each log as h, n (n)}
              {@const I = h.milestone ? Trophy : h.start ? Tag : h.action === 'check' && h.value != null ? Ruler : LOG_ICON[h.action] ?? Wrench}
              <li class:ms={h.milestone}>
                <span class="dic" aria-hidden="true"><I size={15} /></span>
                <span class="dt">
                  <small>{dateOf(h.date)}</small>
                  <b>{h.milestone ? t('{bike} has {km} km', { bike: short(h.bikeName), km: num(h.km) }) : `${h.what}${h.action !== 'wash' && h.action !== 'repair' ? `: ${h.action === 'check' && h.value != null ? `${num(h.value)} ${h.unit}`.trim() : h.action === 'replace' ? t('replaced') : h.action === 'service' ? t('serviced') : h.result === 'needed' ? t('work needed') : t('checked, OK')}` : ''}`}</b>
                  <small>{h.milestone ? t('Milestone') : [short(h.bikeName), h.by === 'shop' ? t('bike shop|by') : h.by === 'self' ? t('me|by') : '', h.km != null ? `${num(h.km)} km` : '', typeof h.chf === 'number' && h.chf > 0 ? `CHF ${chf(h.chf)}` : ''].filter(Boolean).join(' · ')}</small>
                </span>
              </li>
            {/each}
          </ol>
        {:else}
          <p class="quiet">{t('Nothing recorded yet.')}</p>
        {/if}
      </section>
    </aside>
  </div>
</section>

<style>
  .ov {
    margin: 0 0 20px;
  }
  .ovhead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    margin: 0 0 12px;
  }
  .ovhead .page-sub {
    margin: 0;
  }
  .ovacts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .rings {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
    list-style: none;
    margin: 0 0 18px;
    padding: 0;
  }
  .ring {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 100px;
    padding: 12px 12px 12px 14px;
    font: inherit;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .ring:hover {
    background: var(--paper-2);
  }
  .ring :global(.chev) {
    flex: none;
    color: var(--ink-3);
  }
  .dial {
    flex: none;
    width: 68px;
    height: 68px;
  }
  .dial circle {
    fill: none;
    stroke-width: 6;
  }
  .dial .track {
    stroke: var(--paper-2);
  }
  .dial.good .val {
    stroke: var(--accent);
  }
  .dial.mid .val {
    stroke: var(--warn);
  }
  .dial.low .val {
    stroke: var(--bad);
  }
  .dial .val {
    stroke-linecap: round;
  }
  .dial text {
    font: 800 var(--fs-sub) var(--font-brand);
    fill: var(--ink);
  }
  .rt {
    display: grid;
    gap: 3px;
    flex: 1;
    min-width: 0;
    justify-items: start;
  }
  .bn {
    font-weight: 600;
    overflow-wrap: break-word;
    max-width: 100%;
  }
  .rt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mini {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
  }
  /* v0.76.0 «Fünf Orte»: next to the sidebar a card can be narrow; the line wraps between words */
  .mini small {
    min-width: 0;
  }
  .rings > li {
    min-width: 0;
  }
  .mb,
  .kb,
  .cb {
    display: block;
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .mb {
    width: 36px;
    flex: none;
  }
  .mb i,
  .kb i,
  .cb i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--accent);
  }
  .mb i.late,
  .kb i.late {
    background: var(--warn);
  }
  .cb i {
    background: var(--l3);
  }
  .ovcols {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 20px;
    align-items: start;
  }
  @media (max-width: 1000px) {
    .ovcols {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .ovmain {
    min-width: 0;
  }
  .duehead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    margin: 0 0 10px;
  }
  .sh {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sh .n {
    font-weight: 400;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .calm {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 6px 12px;
    border-radius: 10px;
    background: var(--l4-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .calm :global(svg) {
    color: var(--l4);
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
  }
  .dcard {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    border-top: 4px solid var(--warn);
  }
  .dcard.bad {
    border-top-color: var(--bad);
  }
  .dtop {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .dtop .pill {
    margin-left: auto;
  }
  .ic {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .dcard.bad .ic {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .dn {
    margin: 6px 0 0;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .dd {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .dacts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
    padding-top: 10px;
  }
  .more,
  .quiet {
    margin: 0 0 16px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .kms {
    padding: 14px 16px;
    margin: 0 0 16px;
  }
  .kms ul {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .kms li {
    display: grid;
    grid-template-columns: minmax(90px, 160px) minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
  }
  .kn small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .kn b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .kb {
    height: 8px;
  }
  .kv .m {
    color: var(--ink-3);
  }
  .foot {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ovside {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    min-width: 0;
  }
  .side {
    padding: 14px 16px;
  }
  .olist {
    list-style: none;
    margin: 10px 0;
    padding: 0;
  }
  .olist li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .olist li span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  /* Long bike names: the badge wraps to a second line instead of cutting the name, the order button
     wraps too (no sideways scroll at 320 px, and the whole name stays readable). */
  .ov .nbadge {
    max-width: 100%;
    min-width: 0;
    white-space: normal;
    overflow-wrap: break-word;
    text-align: left;
  }
  .sacts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sacts .btn {
    max-width: 100%;
    white-space: normal;
    text-align: left;
  }
  .slink {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    margin-top: 4px;
    color: var(--accent);
    font-weight: 500;
    text-decoration: none;
  }
  .slink:visited {
    color: var(--accent);
  }
  .costh {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  .costs {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .costs li {
    display: grid;
    grid-template-columns: minmax(70px, 110px) minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    font-size: var(--fs-small);
  }
  .cn {
    overflow-wrap: break-word;
  }
  .diary {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
  }
  .diary li {
    position: relative;
    display: flex;
    gap: 10px;
    padding: 0 0 12px;
  }
  .diary li::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 30px;
    bottom: 0;
    width: 1px;
    background: var(--line);
  }
  .diary li:last-child::before {
    display: none;
  }
  .dic {
    flex: none;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .ms .dic {
    background: var(--l4-soft);
    color: var(--l4);
  }
  .dt {
    display: grid;
    min-width: 0;
  }
  .dt b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .dt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
