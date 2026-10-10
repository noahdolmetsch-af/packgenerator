<script>
  /**
   * v0.48.0 «Teile pro Velo» (board «Komponenten»): the parts of one bike as one table by area:
   * part and model, the last work, km since, the wear bar and what comes next. The parts shown by
   * default first; frame, suspension details, clamp, battery, axles, saddle, cockpit, charger, own
   * parts and the check points under «More». A tap on a row opens the part (measure, replace,
   * service, its spec sheet, its history).
   * bike: from withVisits; time: the bike's timeDue rows.
   */
  import { ChevronRight, ChevronDown, ArrowLeftRight, Droplet, Wrench, Check, Ruler, Tag, CircleAlert } from '@lucide/svelte';
  import { PART, kmSince, isMore, partName } from '../care.js';
  import { partStart, partKm } from '../kmbook.js';
  import { lastWork, partStatus, workWords, isDueState, RANK } from './last.js';
  import { partAreas } from './overview.js';
  import Seg from '../ui/Seg.svelte';
  import { t, num, dateOf } from '../i18n.svelte.js';

  // v0.68.0 «Q1 Jeder km zählt» (Q1.7 a): q1 on: the column «Start point» (mounted on, at bike km) and
  // «km on part» instead of «Last done» and «since»; a part without one shows «without start point · set».
  let { bike, time = [], today, onpart, compact = false, q1 = false, onstartpoint = null, bikes = [] } = $props();

  const SORTS = [
    ['area', 'By area'],
    ['last', 'Last done|sort'],
    ['due', 'Due first'],
  ];
  let sort = $state(read());
  function read() {
    try {
      const v = localStorage.getItem('care.partsort');
      return SORTS.some(([k]) => k === v) ? v : 'area';
    } catch {
      return 'area';
    }
  }
  function setSort(v) {
    sort = v;
    try {
      localStorage.setItem('care.partsort', v);
    } catch {
      /* only this visit */
    }
  }

  const rowOf = (part) => {
    const last = lastWork(part);
    const st = partStatus(bike, part, time, today);
    const since = last ? kmSince(bike, last.main) : null;
    const days = last?.main?.date ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${last.main.date}T00:00:00Z`)) / 864e5) : null;
    const start = q1 ? partStart(part) : null;
    return { part, last, st, since, days, start, onPart: start ? partKm(bike, part) : null };
  };
  const rows = $derived((bike.parts ?? []).map(rowOf));
  const groups = $derived(partAreas(bike.parts ?? [], isMore));
  const byKey = $derived(Object.fromEntries(rows.map((r) => [r.part.key, r])));
  const flat = $derived.by(() => {
    const main = groups.main.flatMap((g) => g.parts.map((p) => byKey[p.key]));
    if (sort === 'last') return [...main].sort((a, b) => (b.last?.main?.date ?? '').localeCompare(a.last?.main?.date ?? ''));
    if (sort === 'due') return [...main].sort((a, b) => RANK[b.st.state] - RANK[a.st.state] || (b.st.fill ?? -1) - (a.st.fill ?? -1));
    return main;
  });
  const total = $derived(rows.filter((r) => !(PART[r.part.key]?.area === 'checks')).length);
  let moreOpen = $state(false);
  const moreCount = $derived(groups.more.reduce((s, g) => s + g.parts.length, 0));

  const iconOf = (h, key) =>
    h.start ? Tag : h.result === 'needed' ? CircleAlert : h.action === 'check' ? (typeof h.value === 'number' ? Ruler : Check) : h.action === 'replace' ? ArrowLeftRight : PART[key]?.service || typeof h.sealantMl === 'number' ? Droplet : Wrench;
  const BADGE = { soon: 'soon|part', due: 'due|part', overdue: 'overdue|part', work: 'work needed|part' };
  const sinceText = (r) => (r.since != null ? `${num(r.since)} km` : r.days != null ? t('{n} days|since', { n: num(r.days) }) : '–');
  const nameOfBike = (id) => bikes.find((b) => b.id === id)?.name ?? t('another bike');
  /** The line under the start point: brought from another bike, the last work after it, or from the factory. */
  function startSub(r) {
    if (r.start.from) return { from: true, text: t('from {bike}, brought {km} km', { bike: nameOfBike(r.start.from), km: num(r.start.carried) }) };
    if (r.last && r.last.main !== r.start.entry) return { text: `${workWords(r.part.key, r.last.main)} ${dateOf(r.last.main.date)}` };
    return { text: r.start.start ? t('from the factory') : `${workWords(r.part.key, r.start.entry)} ${dateOf(r.start.date)}` };
  }
  function tap(e, key, r) {
    if (q1 && !r.start && e.target.closest('[data-set]') && onstartpoint) onstartpoint(key);
    else onpart(key);
  }
</script>

{#snippet row(r)}
  {@const L = r.last ? iconOf(r.last.main, r.part.key) : null}
  <li>
    <button type="button" class="prow" class:late={isDueState(r.st.state)} onclick={(e) => tap(e, r.part.key, r)}>
      <span class="pn"><span class="nm">{partName(r.part)}</span>{#if r.part.model}<small>{r.part.model}</small>{/if}</span>
      {#if q1}
        <span class="lw sp">
          {#if r.start}
            {@const sub = startSub(r)}
            <span class="spd num">{t('{date} · at {km} km', { date: dateOf(r.start.date), km: num(r.start.km) })}</span><small class:from={sub.from}>{sub.text}</small>
          {:else}
            <span class="nost" data-set><i class="pill warn">{t('without start point')}</i> <u>{t('set|start')}</u></span>
          {/if}
        </span>
        <span class="sn num">{r.onPart != null ? `${num(r.onPart)} km` : '?'}</span>
      {:else}
      <span class="lw">{#if r.last}<L size={15} aria-hidden="true" /><span>{workWords(r.part.key, r.last.main)} {dateOf(r.last.main.date)}</span>{:else}<span class="m">–</span>{/if}</span>
      <span class="sn num">{r.last ? sinceText(r) : ''}</span>
      {/if}
      <span class="wb">{#if r.st.fill != null}<span class="bar {r.st.tone}" role="img" aria-label="{Math.round(r.st.fill * 100)} %"><i style="width:{Math.max(4, Math.round(r.st.fill * 100))}%"></i></span>{:else if r.last}<span class="bar empty" aria-hidden="true"></span>{/if}</span>
      <span class="nx" class:late={isDueState(r.st.state)}>{r.st.next || (r.last ? '' : '–')}{#if BADGE[r.st.state]}{' '}<i class="pill" class:act={isDueState(r.st.state)} class:warn={r.st.state === 'soon'}>{t(BADGE[r.st.state])}</i>{/if}</span>
      <ChevronRight class="chev" size={18} aria-hidden="true" />
    </button>
  </li>
{/snippet}

<section class="ptable" aria-labelledby="pt-h-{bike.id}">
  <div class="phead">
    <h3 id="pt-h-{bike.id}" class="ph"><Wrench size={18} aria-hidden="true" />{t('Parts')} <span class="n num">{total}</span></h3>
    {#if !compact}<div class="sorts"><Seg small full={false} label={t('Sort the parts')} value={sort} onchange={setSort} options={SORTS.map(([k, n]) => ({ key: k, name: t(n) }))} /></div>{/if}
  </div>
  {#if q1}<p class="sphint">{t('Start point = date and bike km at mounting. From it the app counts the km of every part, also across several bikes. To change: tap the part.')}</p>{/if}
  <div class="cols" aria-hidden="true"><span>{t('Part')}</span><span>{q1 ? t('Start point: mounted on · at bike km') : t('Last done')}</span><span class="r">{q1 ? t('km on part') : t('since|km')}</span><span>{t('Wear|column')}</span><span>{t('Next|care')}</span><span></span></div>
  {#if sort === 'area'}
    {#each groups.main as g (g.key)}
      <p class="zlabel">{t(g.name)}</p>
      <ul class="plist">{#each g.parts as p (p.key)}{@render row(byKey[p.key])}{/each}</ul>
    {/each}
  {:else}
    <ul class="plist">{#each flat as r (r.part.key)}{@render row(r)}{/each}</ul>
  {/if}
  {#if moreCount}
    <button type="button" class="morebtn" aria-expanded={moreOpen} onclick={() => (moreOpen = !moreOpen)}>
      {#if moreOpen}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}
      <span>{t('More')}</span><span class="n">{groups.more.flatMap((g) => g.parts).slice(0, 4).map(partName).join(', ')}{moreCount > 4 ? ' …' : ''}</span>
    </button>
    {#if moreOpen}
      {#each groups.more as g (g.key)}
        <p class="zlabel">{t(g.name)}</p>
        <ul class="plist">{#each g.parts as p (p.key)}{@render row(byKey[p.key])}{/each}</ul>
      {/each}
    {/if}
  {/if}
</section>

<style>
  .ptable {
    margin: 6px 0 12px;
  }
  .phead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    margin: 8px 0 6px;
  }
  .ph {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .ph .n {
    font-weight: 400;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sorts {
    max-width: 100%;
  }
  .plist {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .plist li + li {
    border-top: 1px solid var(--line);
  }
  .cols,
  .prow {
    display: grid;
    grid-template-columns: minmax(130px, 1.3fr) minmax(130px, 1.4fr) 76px minmax(90px, 1fr) minmax(140px, 1.6fr) 18px;
    gap: 4px 14px;
    align-items: center;
  }
  .cols {
    padding: 4px 4px 6px;
    border-bottom: 1px solid var(--line);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .cols .r,
  .sn {
    text-align: right;
  }
  .prow {
    width: 100%;
    min-height: 52px;
    padding: 6px 4px;
    border: 0;
    background: none;
    font: inherit;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .prow:hover {
    background: var(--paper-2);
  }
  .pn {
    min-width: 0;
  }
  .pn .nm {
    display: block;
    font-weight: 500;
    overflow-wrap: break-word;
    /* «Scheibenbremse vorne» in a 320 px half column: a syllable break, not a cut in the middle */
    hyphens: auto;
  }
  .pn small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .lw {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lw :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .m {
    color: var(--ink-3);
  }
  .lw.sp {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    color: var(--ink);
  }
  .lw.sp small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .lw.sp small.from {
    color: var(--accent);
  }
  .nost {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .nost u {
    color: var(--accent);
    font-weight: 600;
  }
  .sphint {
    margin: 0 0 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sn {
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .nx {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .nx.late {
    color: var(--bad);
  }
  .bar {
    display: block;
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--accent);
  }
  .bar.warn i {
    background: var(--warn);
  }
  .bar.bad i {
    background: var(--bad);
  }
  .bar.empty {
    background: repeating-linear-gradient(90deg, var(--line) 0 4px, transparent 4px 8px);
  }
  .prow :global(.chev) {
    color: var(--ink-3);
  }
  .morebtn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 48px;
    margin-top: 6px;
    padding: 4px;
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    font: 600 var(--fs-body) var(--font-body);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .morebtn .n {
    min-width: 0;
    font-weight: 400;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Phone: name and next on top, the last work and the bar below. */
  @media (max-width: 760px) {
    .cols {
      display: none;
    }
    .prow {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 18px;
      grid-template-areas: 'pn nx ch' 'lw sn ch' 'wb wb ch';
      gap: 2px 10px;
      padding: 8px 2px;
    }
    .pn {
      grid-area: pn;
    }
    .nx {
      grid-area: nx;
      text-align: right;
    }
    .lw {
      grid-area: lw;
    }
    .sn {
      grid-area: sn;
    }
    .wb {
      grid-area: wb;
    }
    .wb:empty {
      display: none;
    }
    .prow :global(.chev) {
      grid-area: ch;
    }
  }
</style>
