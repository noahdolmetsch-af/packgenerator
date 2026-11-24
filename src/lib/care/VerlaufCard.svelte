<script>
  /**
   * «Verlauf» on a bike's care page (Noah 21.11.2026 «1a 2a 3a 4a 5a», Schritt D): service, checks and parts you
   * replaced in ONE list with what each cost. Shut it shows the newest three; «Whole history» opens all of it with
   * a filter (service, checks, parts), the years and the sum. Worked out from existing data (verlauf.js).
   * bike: the view with workshop jobs (withVisits); visits: all visits; open: bindable, the glance card opens it.
   */
  import { liveQuery } from 'dexie';
  import { History, ChevronRight, ChevronUp } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { chfText } from '../money.js';
  import { bikesHash } from '../bikes.js';
  import { levelName } from '../inspect/names.js';
  import { phone } from '../media.svelte.js';
  import { PHONE_ROWS } from '../touren/kurz.js';
  import ChipChoice from '../ui/ChipChoice.svelte';
  import ShowMore from '../ui/ShowMore.svelte';
  import Empty from '../ui/Empty.svelte';
  import { verlaufRows, yearsOf, filterRows, sumRows, KINDS } from './verlauf.js';

  let { bike, visits = [], open = $bindable(false) } = $props();

  const inspQ = liveQuery(() => db.inspections.toArray());
  const rows = $derived(verlaufRows(bike, visits, $inspQ ?? []));
  let kind = $state('all');
  let year = $state('');
  let all = $state(false);
  const years = $derived(yearsOf(rows));
  const shown = $derived(filterRows(rows, kind, year));
  const sum = $derived(sumRows(shown));
  const capped = $derived(phone.matches && !all ? shown.slice(0, PHONE_ROWS) : shown);
  const newest = $derived(rows.slice(0, 3));

  const KIND_NAME = { all: 'All', service: 'Service', check: 'Checks', part: 'Parts' };
  const kindOptions = $derived(['all', ...KINDS].map((k) => ({ value: k, label: `${t(KIND_NAME[k])} ${k === 'all' ? rows.length : rows.filter((r) => r.kind === k).length}` })));
  const yearOptions = $derived([{ value: '', label: t('All years') }, ...years.map((y) => ({ value: y, label: y }))]);

  const title = (r) => (r.kind === 'service' ? t('Service at the bike shop') : r.kind === 'check' ? levelName(r.level) : r.action === 'replace' ? t('{part} replaced', { part: r.name }) : t('{part} serviced', { part: r.name }));
  const meta = (r) => {
    const bits = [];
    if (r.kind === 'service') {
      if (r.shop) bits.push(r.shop);
      if (r.km != null) bits.push(`${num(r.km)} km`);
      if (r.jobs.length) bits.push(r.jobs.join(', '));
    } else if (r.kind === 'check') {
      if (r.km != null) bits.push(`${num(r.km)} km`);
      bits.push(t('{ok} OK, {watch} to watch, {fix} to fix', { ok: r.ok, watch: r.watch, fix: r.fix }));
    } else {
      if (r.model) bits.push(r.model);
      if (r.km != null) bits.push(`${num(r.km)} km`);
      bits.push(r.by === 'shop' ? t('bike shop|by') : t('me|by'));
    }
    return bits.join(' · ');
  };
  const cost = (r) => (typeof r.chf === 'number' ? chfText(r.chf) : r.kind === 'service' ? t('cost unknown') : '');
  const sumText = $derived(year ? t('Total {year}: {chf}', { year, chf: chfText(sum.chf) || 'CHF 0' }) : t('Total: {chf}', { chf: chfText(sum.chf) || 'CHF 0' }));
</script>

{#snippet list(list)}
  <ul class="tl">
    {#each list as r (r.id)}
      <li data-verlauf-row={r.kind}>
        <span class="d num">{dateOf(r.day)}</span>
        <span class="w"><b>{title(r)}</b><small>{meta(r)}</small></span>
        <span class="c num" class:quiet={typeof r.chf !== 'number'}>{cost(r)}</span>
      </li>
    {/each}
  </ul>
{/snippet}

<section class="vl" aria-labelledby="vl-h-{bike.id}" id="verlauf-{bike.id}" data-verlauf>
  <h3 id="vl-h-{bike.id}"><History size={20} aria-hidden="true" />{t('History')}</h3>
  <p class="lead">{t('What was done on the bike and what it cost: workshop, checks and parts in one list.')}</p>

  {#if !rows.length}
    <Empty text={t('Nothing recorded yet. Finished checks, workshop visits and parts you replace appear here.')} action={{ label: t('Open inspections'), href: bikesHash({ tab: 'care', view: 'inspect', bike: bike.id }) }} />
  {:else if !open}
    {@render list(newest)}
    <button type="button" class="btn sm" aria-expanded="false" onclick={() => (open = true)} data-verlauf-open>{t('Whole history')}<span class="n num">{rows.length}</span><ChevronRight size={16} aria-hidden="true" /></button>
  {:else}
    <div class="filters">
      <ChipChoice options={kindOptions} bind:value={kind} onchange={() => (all = false)} aria-label={t('Show')} data-verlauf-kind />
      {#if years.length > 1}<ChipChoice options={yearOptions} bind:value={year} onchange={() => (all = false)} aria-label={t('Year')} data-verlauf-year />{/if}
    </div>
    {#if shown.length}
      {@render list(capped)}
      {#if capped.length < shown.length}<ShowMore n={shown.length - capped.length} onclick={() => (all = true)} data-verlauf-more />{/if}
      <p class="sum num" data-verlauf-sum><b>{sumText}</b>{#if sum.unknown}<small>{' · '}{tn(sum.unknown, '{n} visit without a price', '{n} visits without a price')}</small>{/if}</p>
    {:else}
      <p class="hint">{t('Nothing in this filter.')}</p>
    {/if}
    <div class="acts">
      <button type="button" class="btn sm" aria-expanded="true" onclick={() => (open = false)}><ChevronUp size={16} aria-hidden="true" />{t('Show less')}</button>
      <a class="btn sm" href={bikesHash({ tab: 'shop', bike: bike.id })}>{t('Workshop & receipts')}</a>
    </div>
  {/if}
</section>

<style>
  .vl {
    margin: 0 0 14px;
    padding: 14px 16px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .lead,
  .hint {
    margin: 4px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .filters {
    display: grid;
    gap: 8px;
    margin: 0 0 10px;
  }
  .tl {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
  }
  .tl li {
    display: grid;
    grid-template-columns: 7.5rem minmax(0, 1fr) auto;
    gap: 4px 10px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    align-items: start;
  }
  .tl li:first-child {
    border-top: 0;
  }
  .d {
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .w {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .w small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .c {
    font-weight: 600;
    white-space: nowrap;
    text-align: right;
  }
  .c.quiet {
    color: var(--ink-2);
    font-weight: 400;
    font-size: var(--fs-small);
    white-space: normal;
  }
  .sum {
    margin: 6px 0 8px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .sum small {
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .n {
    margin-left: 6px;
    color: var(--ink-2);
  }
  @media (max-width: 420px) {
    .tl li {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .d {
      grid-column: 1 / -1;
    }
  }
</style>
