<script>
  /**
   * «Auf einen Blick» (Noah 21.11.2026 «1a 2a 3a 4a 5a»): on top of a bike's care page. The chain (km done and left,
   * when it runs out, last measurement, price), the last service (day, workshop, price, km since), the last
   * check (day, what it found, when the next one is due) and what the year cost. Everything is worked out from the
   * data the page has (glance.js); an empty tile says why and where to start.
   * bike: the view with workshop jobs (withVisits); visits: all visits; entries: this bike's km book.
   */
  import { liveQuery } from 'dexie';
  import { Link2, Wrench, ClipboardCheck, Wallet } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, num, dateOf, locale } from '../i18n.svelte.js';
  import { chfText } from '../money.js';
  import { bikesHash } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { insp } from '../inspect/live.svelte.js';
  import { levelName } from '../inspect/names.js';
  import { chainGlance, serviceGlance, checkGlance, costGlance } from './glance.js';

  let { bike, visits = [], entries = [], onrecord = null } = $props();

  const today = localDay();
  const inspQ = liveQuery(() => db.inspections.toArray());
  const chain = $derived(chainGlance(bike, { entries, today }));
  const service = $derived(serviceGlance(bike, visits, today));
  const check = $derived(checkGlance($inspQ ?? [], bike.id, insp.byBike[bike.id] ?? null));
  const cost = $derived(costGlance(bike, visits, today.slice(0, 4)));
  const month = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const daysAgo = (day) => Math.max(0, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 864e5));
  const wearHref = $derived(bikesHash({ tab: 'care', view: 'wear', bike: bike.id }));
  const checkHref = $derived(bikesHash({ tab: 'care', view: 'inspect', bike: bike.id }));
  const shopHref = $derived(bikesHash({ tab: 'shop', bike: bike.id }));
  const tone = $derived(!chain ? '' : chain.state === 'due' ? 'bad' : chain.state === 'soon' ? 'warn' : '');
  const nextCheck = $derived.by(() => {
    const n = check?.next;
    if (!n) return '';
    if (n.due) return t('Next check: due now.');
    const bits = [n.kmLeft != null ? t('in {km} km', { km: num(n.kmLeft) }) : '', n.day ? t('by {date}', { date: dateOf(n.day) }) : ''].filter(Boolean);
    return bits.length ? `${t('Next check')}: ${bits.join(` ${t('or|either')} `)}` : '';
  });
  const pct = $derived(chain ? Math.max(0, Math.min(100, Math.round((chain.frac ?? 0) * 100))) : 0);
</script>

<section class="gl" aria-labelledby="gl-h-{bike.id}" data-glance>
  <h3 id="gl-h-{bike.id}">{t('At a glance')}</h3>
  <div class="grid">
    <div class="tile chain" data-glance-chain={chain ? chain.state : 'none'}>
      <span class="k"><Link2 size={15} aria-hidden="true" />{t('Chain')}{#if chain?.model}<span class="m">{' · '}{chain.model}</span>{/if}</span>
      {#if chain}
        <p class="big num">{t('{km} km done', { km: num(chain.km) })}</p>
        <div class="meter {tone}" role="img" aria-label={t('{km} of {life} km', { km: num(chain.km), life: num(chain.life) })}><i style:width="{pct}%"></i></div>
        <div class="scale num"><span>0</span><span>{chain.left == null ? '' : chain.left > 0 ? t('about {km} km left', { km: num(chain.left) }) : t('{km} km over', { km: num(-chain.left) })}</span><span>{num(chain.life)} km</span></div>
        <dl class="kv">
          {#if chain.due}<dt>{t('Runs out about')}</dt><dd>{month(chain.due)}</dd>{/if}
          {#if chain.measured}<dt>{t('Chain checker')}</dt><dd class="num">{String(chain.measured.value).replace('.', ',')} % · {dateOf(chain.measured.date)}{chain.measured.limit ? ` · ${t('limit {value} %', { value: String(chain.measured.limit).replace('.', ',') })}` : ''}</dd>{/if}
          {#if chain.since}<dt>{t('On since')}</dt><dd class="num">{dateOf(chain.since)}{chain.chf != null ? ` · ${chfText(chain.chf)}` : ''}</dd>{/if}
          <dt>{t('Lasts about')}</dt><dd class="num">{t('{km} km', { km: num(chain.life) })}{chain.own ? ` · ${t('your value')}` : ''}</dd>
        </dl>
        <div class="acts">
          {#if onrecord}<button type="button" class="btn sm" onclick={onrecord} data-glance-record>{t('Record the chain')}</button>{/if}
          <a class="btn sm" href={wearHref}>{t('Forecast and all parts')}</a>
        </div>
      {:else}
        <p class="empty">{t('No start point for the chain yet. Say when the current chain went on, then the app counts its km.')}</p>
        <div class="acts">{#if onrecord}<button type="button" class="btn sm" onclick={onrecord} data-glance-record>{t('Record the chain')}</button>{/if}<a class="btn sm" href={wearHref}>{t('Open Wear')}</a></div>
      {/if}
    </div>

    <div class="tile" data-glance-service={service ? service.kind : 'none'}>
      <span class="k"><Wrench size={15} aria-hidden="true" />{service?.kind === 'visit' ? t('Last bike shop visit') : t('Last service|glance')}</span>
      {#if service}
        <p class="v num">{dateOf(service.day)}</p>
        <p class="s">{[service.shop, service.chf != null ? chfText(service.chf) : '', service.km != null ? t('at {km} km', { km: num(service.km) }) : ''].filter(Boolean).join(' · ')}</p>
        {#if service.sinceKm != null}<p class="s num">{t('{km} km since then.', { km: num(service.sinceKm) })}{#if service.kmLeft != null}{' '}{t('Next in about {km} km.', { km: num(service.kmLeft) })}{/if}</p>{/if}
        {#if service.chf == null}<p class="s quiet">{t('Price not recorded.')}</p>{/if}
      {:else}
        <p class="empty">{t('No service recorded yet. Add the last bike shop visit with date and price.')}</p>
        <div class="acts"><a class="btn sm" href={shopHref}>{t('Add a visit')}</a></div>
      {/if}
    </div>

    <div class="tile" data-glance-check={check ? 'done' : 'none'}>
      <span class="k"><ClipboardCheck size={15} aria-hidden="true" />{t('Last check')}</span>
      {#if check}
        <p class="v num">{dateOf(check.day)}</p>
        <p class="s">{levelName(check.level)} · {daysAgo(check.day) === 0 ? t('today') : tn(daysAgo(check.day), '{n} day ago|glance', '{n} days ago|glance')}{check.km != null ? ` · ${t('at {km} km', { km: num(check.km) })}` : ''}</p>
        <p class="s">
          {#if check.watch || check.fix}
            {#if check.fix}<span class="gpill bad">{tn(check.fix, '{n} to fix', '{n} to fix')}</span>{/if}
            {#if check.watch}<span class="gpill warn">{t('{n} to watch', { n: check.watch })}</span>{/if}
          {:else}<span class="gpill">{tn(check.ok, '{n} OK', '{n} OK')}</span>{/if}
        </p>
        {#if nextCheck}<p class="s num">{nextCheck}</p>{/if}
        {#if check.fullDay}<p class="s quiet">{t('Full inspection: {date}', { date: dateOf(check.fullDay) })}</p>{/if}
      {:else}
        <p class="empty">{t('No check done yet. Start the first one when it suits you.')}</p>
        <div class="acts"><a class="btn sm" href={checkHref}>{t('Open inspections')}</a></div>
      {/if}
    </div>

    <div class="tile" data-glance-cost>
      <span class="k"><Wallet size={15} aria-hidden="true" />{t('Costs {year}', { year: cost.year })}</span>
      {#if cost.total > 0}
        <p class="v num">{chfText(cost.total)}</p>
        <p class="s">{[cost.work > 0 ? t('Bike shop {chf}', { chf: chfText(cost.work) }) : '', cost.parts > 0 ? t('Parts {chf}', { chf: chfText(cost.parts) }) : ''].filter(Boolean).join(' · ')}{#if cost.top.length}{' ('}{cost.top.map((x) => `${x.name} ${num(Math.round(x.chf))}`).join(', ')}{')'}{/if}</p>
        {#if cost.unknown}<p class="s quiet">{tn(cost.unknown, '{n} visit without a price', '{n} visits without a price')}</p>{/if}
      {:else}
        <p class="empty">{t('No costs recorded in {year}. Prices of visits and parts add up here.', { year: cost.year })}</p>
      {/if}
      <div class="acts"><a class="btn sm" href={bikesHash({ tab: 'care', view: 'year', bike: bike.id })}>{t('Year summary')}</a></div>
    </div>
  </div>
</section>

<style>
  .gl {
    margin: 0 0 14px;
    min-width: 0;
  }
  h3 {
    margin: 0 0 8px;
    font-size: var(--fs-sub);
  }
  .grid {
    display: grid;
    gap: 10px;
    grid-template-columns: minmax(0, 1fr);
  }
  @media (min-width: 760px) {
    .grid {
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    }
    .chain {
      grid-row: span 3;
    }
  }
  .tile {
    min-width: 0;
    padding: 12px 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .k {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .k .m {
    font-weight: 400;
  }
  .big {
    margin: 4px 0 0;
    font-size: var(--fs-page);
    font-weight: 700;
    line-height: 1.15;
  }
  .v {
    margin: 2px 0;
    font-size: var(--fs-section);
    font-weight: 700;
  }
  .s,
  .empty {
    margin: 2px 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .quiet {
    opacity: 0.85;
  }
  .meter {
    height: 14px;
    margin: 10px 0 6px;
    border-radius: 99px;
    background: var(--line);
    overflow: hidden;
  }
  .meter i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--ok);
  }
  .meter.warn i {
    background: var(--warn);
  }
  .meter.bad i {
    background: var(--bad);
  }
  .scale {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .kv {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 2px 12px;
    margin: 10px 0 0;
    font-size: var(--fs-small);
  }
  .kv dt {
    color: var(--ink-2);
  }
  .kv dd {
    margin: 0;
    text-align: right;
    overflow-wrap: break-word;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 2px;
  }
  .gpill {
    display: inline-block;
    padding: 1px 9px;
    border-radius: 99px;
    background: var(--line);
    font-size: var(--fs-small);
  }
  .gpill.warn {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .gpill.bad {
    background: var(--bad-soft);
    color: var(--bad);
  }
</style>
