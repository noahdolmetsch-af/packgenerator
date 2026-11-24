<script>
  /**
   * «Rennatlas» view Zeitstrahl (Noah 24.11.2026, Mockup 2): «Mein Rennjahr». The three cards (what falls
   * due next), the warning when two races of yours do not fit, and the year line: a bar per race (the
   * strong part the shortest time, the light part the longest, the grey edge two rest days), overlaps
   * hatched in red, and green where a further race fits (with the number that would). Two calendar files.
   */
  import { TriangleAlert, CalendarDays, Bell } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { keyOf } from './atlas.js';
  import { yearLine, freeCounts, dueCards, yearsOfMine, calendarOf, addDay, diffDays } from './atlas-view.js';
  import { shortDay, spanDay, download } from './atlas-text.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { rows, mine, ctx, wide = true, oncreate = null, fresh = 0 } = $props();
  let pick = $state('');
  const years = $derived(yearsOfMine(mine, ctx.today));
  const year = $derived(years.includes(pick) ? pick : (years[0] ?? ctx.today.slice(0, 4)));
  const line = $derived(yearLine(rows, mine, Number(year)));
  const wins = $derived(freeCounts(line, rows, mine));
  const cards = $derived(dueCards(rows, ctx.today));
  const monthName = (m) => new Date(Date.UTC(2027, m, 15, 12)).toLocaleDateString(locale(), { month: 'short', timeZone: 'UTC' }).replace('.', '')
  const monthLong = (m) => new Date(Date.UTC(2027, m, 15, 12)).toLocaleDateString(locale(), { month: 'long', timeZone: 'UTC' });;

  // geometry: a wide screen puts the name behind the bar, a phone above it
  const W = $derived(wide ? 1000 : 500);
  const ROW = $derived(wide ? 38 : 62);
  const TOP = $derived(wide ? 30 : 50);
  const FS = $derived(wide ? 15 : 20);
  const days = $derived(line.from ? diffDays(line.from, line.to) + 1 : 1);
  const X = (d) => (diffDays(line.from, d) / days) * W;
  const E = (d) => X(addDay(d, 1));
  const H = $derived(TOP + Math.max(1, line.items.length) * ROW + 30);
  const months = $derived.by(() => {
    if (!line.from) return [];
    const out = [];
    for (let m = Number(line.from.slice(5, 7)) - 1; m <= Number(line.to.slice(5, 7)) - 1; m++) out.push({ m, x: X(`${year}-${String(m + 1).padStart(2, '0')}-01`) });
    return out;
  });
  const dayWord = (s) => (s.min === s.max ? `${s.min}` : `${s.min}–${s.max}`);
  const labelOf = (x) => `${x.row.name} · ${shortDay(x.row.date)} · ${t('{days} d|race', { days: dayWord(x.s) })} ${x.row.registered ? '✔' : '☆'}`;
  const bars = $derived(
    line.items.map((x, i) => {
      const x0 = X(x.from);
      const light = Math.max(10, E(x.maxTo) - x0);
      const strong = Math.max(10, Math.min(light, E(x.minTo) - x0));
      const restEnd = Math.max(x0 + light, E(x.restTo));
      const label = labelOf(x);
      const wLabel = label.length * FS * 0.52;
      const after = restEnd + 8;
      const end = !wide || after + wLabel <= W;
      const y = TOP + i * ROW;
      return { x, x0, light, strong, restEnd, label, y, ly: wide ? y + 13 : y - 4, lx: wide ? (end ? after : x0 - 8) : 6, anchor: wide && !end ? 'end' : 'start', by: wide ? y + 2 : y + 8, bh: wide ? 16 : 18 };
    }),
  );
  const hatches = $derived(line.pairs.map((p) => {
    const a = line.items.find((x) => x.key === keyOf(p.a));
    const b = line.items.find((x) => x.key === keyOf(p.b));
    const from = b.from;
    const to = a.restTo < b.restTo ? a.restTo : b.restTo;
    return { x: X(from), w: Math.max(4, E(to) - X(from)) };
  }));
  const rangeText = (x) => spanDay(x.from, x.maxTo);
  const itemOf = (r) => line.items.find((x) => x.key === keyOf(r));
  const dayRange = (x) => {
    const s = x.s;
    return t('{days} days', { days: dayWord(s) });
  };
  const mark = (r) => (r.registered ? t('registered|race') : t('favourite|race'));
  const detail = (c) => {
    const r = c.row;
    const when = r.closes ? spanDay(r.opens, r.closes) : shortDay(r.opens);
    return `${r.closes ? t('Registration {when}', { when }) : t('Registration opens on {when}', { when })} (${mark(r)})`;
  };
  const dueDays = (n) => tn(n, '{n} day', '{n} days');
  const first = $derived(line.pairs[0]);
  const rest = $derived(line.pairs.slice(1));
  const ics = (kind) => {
    const text = calendarOf(kind, mine, ctx.today);
    if (text) download(kind === 'races' ? 'rennen.ics' : 'anmeldetermine.ics', text);
  };
  const hasOpens = $derived(calendarOf('opens', mine, ctx.today) !== '');
</script>

<div class="ll" data-atlas-line>
  <div class="ll-head">
    <div><h2 class="ll-h">{t('My race year {year}', { year })}</h2>{#if line.from}<small>{t('Cut from {a} to {b}', { a: monthLong(Number(line.from.slice(5, 7)) - 1), b: monthLong(Number(line.to.slice(5, 7)) - 1) })}</small>{/if}</div>
    {#if years.length > 1}<Seg small label={t('Year|race')} value={year} options={years.map((y) => ({ key: y, name: y }))} onchange={(k) => (pick = k)} />{/if}
  </div>

  {#if !line.items.length}
    <div class="ll-empty" data-atlas-line-empty>
      <p>{t('Star races or mark them as registered in the list: they stand here on the year line.')}</p>
    </div>
  {:else}
    {#if cards.soon || cards.then || cards.check}
      <div class="ll-cards" data-atlas-cards>
        {#if cards.soon}<div class="ll-card"><small>{t('Due soon')}</small><span class="c">{dueDays(cards.soon.days)}</span><b>{cards.soon.row.name}</b><small>{detail(cards.soon)}</small></div>{/if}
        {#if cards.then}<div class="ll-card"><small>{t('After that')}</small><span class="c">{dueDays(cards.then.days)}</span><b>{cards.then.row.name}</b><small>{detail(cards.then)}</small></div>{/if}
        {#if cards.check}<div class="ll-card"><small>{t('Check|race')}</small><span class="c bad">!</span><b>{cards.check.name}</b><small>{t('is marked «registered», but the registration is not open yet.')}</small></div>{/if}
      </div>
    {/if}

    {#if first}
      <div class="ll-warn" role="status" data-atlas-clash>
        <TriangleAlert size={20} aria-hidden="true" />
        <div>
          <p>
            <b>{t('Conflict:')}</b>
            {#if first.sure}{t('{a} ({da}) and {b} ({db}) are on the same days.', { a: first.a.name, da: rangeText(itemOf(first.a)), b: first.b.name, db: shortDay(first.b.date) })}
            {:else}{t('{a} ({da}, {days}) and {b} ({db}) only work if you ride {a} in at most {n} days.', { a: first.a.name, da: shortDay(first.a.date), days: dayRange(itemOf(first.a)), b: first.b.name, db: shortDay(first.b.date), n: first.atMost })}{/if}
          </p>
          {#each rest as p (keyOf(p.a) + keyOf(p.b))}<small>{t('Also: {a} ({da}) overlaps with {b} ({db}).', { a: p.a.name, da: rangeText(itemOf(p.a)), b: p.b.name, db: shortDay(p.b.date) })}</small>{/each}
        </div>
      </div>
    {/if}

    <svg class="ll-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('Year line {year}', { year })} data-atlas-svg>
      <defs>
        <pattern id="ll-hat" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" class="hat-bg" /><line x1="0" y1="0" x2="0" y2="8" class="hat-ln" stroke-width="3" /></pattern>
      </defs>
      {#each wins as w (w.from)}<rect class="free" x={X(w.from)} y={TOP - 6} width={Math.max(0, E(w.to) - X(w.from))} height={H - TOP - 18} />{/each}
      {#each hatches as h, i (i)}<rect x={h.x} y={TOP - 6} width={h.w} height={H - TOP - 18} fill="url(#ll-hat)" />{/each}
      {#each months as m (m.m)}
        <line class="mline" x1={m.x} y1={TOP - 8} x2={m.x} y2={H - 16} />
        <text class="mname" x={m.x + 5} y={18} font-size={FS}>{monthName(m.m)}</text>
      {/each}
      {#each bars as b (b.x.key)}
        <g class:clash={b.x.clash} data-atlas-bar={b.x.key}>
          <rect class="rest" x={b.x0 - 4} y={b.by - 3} width={b.restEnd - b.x0 + 8} height={b.bh + 6} rx="7" />
          <rect class="light" x={b.x0} y={b.by} width={b.light} height={b.bh} rx="5" />
          <rect class="strong" class:fav={!b.x.row.registered} x={b.x0} y={b.by} width={b.strong} height={b.bh} rx="5" />
          <text class="lab" x={b.lx} y={b.ly} font-size={FS} text-anchor={b.anchor}>{b.label}</text>
        </g>
      {/each}
      {#each wins as w (w.from + 'l')}
        {#if w.n > 0 && E(w.to) - X(w.from) > (wide ? 60 : 30)}<text class="flab" x={(X(w.from) + E(w.to)) / 2} y={H - 4} font-size={wide ? 14 : 18} text-anchor="middle">{wide ? t('free · {n} races', { n: w.n }) : t('{n} free', { n: w.n })}</text>{/if}
      {/each}
    </svg>
    <p class="ll-key">{t('Strong = registered (✔), paler = favourite (☆). The light part of a bar is the longest time, the grey edge are 2 rest days. Red hatched = overlap, green = free for one more race (with the number of races that fit).')}</p>
    <div class="ll-btns">
      <button type="button" class="btn hi" onclick={() => ics('races')} data-atlas-ics-races><CalendarDays size={16} aria-hidden="true" />{t('Download calendar file (.ics)')}</button>
      {#if hasOpens}<button type="button" class="btn" onclick={() => ics('opens')} data-atlas-ics-opens><Bell size={16} aria-hidden="true" />{t('Registration dates into my calendar')}</button>{/if}
      {#if fresh && oncreate}<button type="button" class="btn" onclick={oncreate} data-atlas-make>{tn(fresh, 'Create {n} race in the app', 'Create {n} races in the app')}</button>{/if}
    </div>
  {/if}
</div>

<style>
  .ll {
    display: grid;
    gap: 14px;
    min-width: 0;
  }
  .ll-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }
  .ll-h {
    margin: 0;
    font: 700 var(--fs-section) / 1.2 var(--font-body);
  }
  .ll small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ll-empty {
    padding: 18px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-card);
  }
  .ll-empty p {
    margin: 0;
    color: var(--ink-2);
  }
  .ll-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 10px;
  }
  .ll-card {
    display: grid;
    gap: 2px;
    align-content: start;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .ll-card .c {
    font-size: var(--fs-num);
    font-weight: 800;
    line-height: 1.15;
    color: var(--warn);
  }
  .ll-card .c.bad {
    color: var(--bad);
  }
  .ll-warn {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--bad) 30%, transparent);
    border-radius: var(--radius-card);
    background: var(--bad-soft);
    color: var(--ink);
  }
  .ll-warn :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--bad);
  }
  .ll-warn p {
    margin: 0;
  }
  .ll-warn b {
    color: var(--bad);
  }
  .ll-warn small {
    display: block;
    color: var(--ink-2);
  }
  .ll-svg {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }
  .ll-svg .free {
    fill: var(--accent-soft);
  }
  .ll-svg .hat-bg {
    fill: var(--bad-soft);
  }
  .ll-svg .hat-ln {
    stroke: color-mix(in srgb, var(--bad) 35%, transparent);
  }
  .ll-svg .mline {
    stroke: var(--line);
  }
  .ll-svg .mname {
    fill: var(--ink-3);
    font-weight: 600;
  }
  .ll-svg .lab {
    fill: var(--ink);
  }
  .ll-svg .rest {
    fill: var(--line);
    opacity: 0.55;
  }
  .ll-svg .light {
    fill: var(--accent);
    opacity: 0.28;
  }
  .ll-svg .strong {
    fill: var(--accent);
  }
  .ll-svg .strong.fav {
    opacity: 0.55;
  }
  .ll-svg .clash .light,
  .ll-svg .clash .strong {
    fill: var(--bad);
  }
  .ll-svg .flab {
    fill: var(--accent);
    font-weight: 600;
  }
  .ll-key {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ll-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
