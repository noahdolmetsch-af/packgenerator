<script>
  /**
   * One bike in Velopflege. v0.31.0 made it an accordion item; v0.38.0 (Noah 5a, 6a, 7a) makes the
   * open bike one list instead of boxes:
   * - one row per part: part, last done · km, what comes next, the wear bar, the state;
   *   on a phone compact rows, on a computer a table with the column heads once;
   * - what is due first (overdue and work needed on top), with "Done" or "Look at the check" in the
   *   row; then what is due soon; the rest folded as "4 ok" with the names;
   * - a tap on a part opens its row: tubeless or tube (tyres), "Put on the wishlist", "Record …";
   * - "me" is no longer on every row: only the bike shop's work gets a small shop sign, explained once;
   * - folded rows: parts without data, the 1000 km check, the log, "Bike shop & 2026".
   */
  import { Check, ChevronDown, ChevronRight, Store, Info, ListChecks, BookOpen } from '@lucide/svelte';
  import MoreMenu from './MoreMenu.svelte';
  import { CHECK_KM, bikeLog, EXTRA, needsWork, PART } from '../care.js';
  import { visitTotal, costByYear, costByPart } from '../workshop.js';
  import { GROUPS, groupOf, lastWork, lastLine, partStatus, usualBy, isDueState, yearSummary } from './last.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { bikeCareWords } from '../readiness.js';

  let {
    c, tasks = [], visits = [], wished = {}, kmMsg = null, open = false, filter = 'all', today,
    ontoggle, onkm, oncheck, ondone, onpart, ontyre, onvisit, onorder, onwish, onrepair,
  } = $props();

  const bike = $derived(c.bike);
  const words = $derived(bikeCareWords(c.care));
  const lastVisit = $derived(c.mine[0] ?? null);
  const nothingYet = $derived(!bike.parts.some((p) => p.history?.length) && !c.mine.length);

  /* ---------- the parts: last work and state ---------- */
  const rows = $derived(
    open
      ? bike.parts.map((part) => {
          const last = lastWork(part);
          return { part, last, st: partStatus(bike, part, c.time, today), group: groupOf(part.key) };
        })
      : [],
  );
  const rowOf = $derived(Object.fromEntries(rows.map((r) => [r.part.key, r])));
  const known = $derived(rows.filter((r) => r.last || r.st.state !== 'none'));
  const blind = $derived(rows.filter((r) => !r.last && r.st.state === 'none'));
  const BADGE = { ok: 'good|part', soon: 'soon|part', due: 'due|part', overdue: 'overdue|part', work: 'work needed|part' };
  // Neutral for ok and soon; the warning colour only for due and overdue, red for work needed.
  const TONE = { ok: 'n', soon: 'n', due: 'warn', overdue: 'warn', work: 'bad' };
  const RANK = { work: 5, overdue: 4, due: 3, soon: 2, ok: 1, none: 0 };

  /* ---------- what is due: first, overdue and work needed on top ---------- */
  const partOf = (key) => bike.parts.find((p) => p.key === key);
  /** Who does this job: the bike shop when it usually did this part; waxing, the check and repairs are mine. */
  const whoDoes = (r) => (r.kind === 'time' || r.kind === 'part') && r.part && usualBy(partOf(r.part)) === 'shop' ? 'shop' : 'self';
  const fitsWho = (by) => (filter === 'self' ? by === 'self' : filter === 'shop' ? by === 'shop' : true);
  const stub = (d) => ({ part: { key: d.part, model: '' }, last: null, st: { state: 'due', fill: null, tone: 'warn', next: d.detail }, group: groupOf(d.part) });
  const rankOf = (x) => (x.d?.kind === 'repair' ? (x.d.task.status === 'needed' ? RANK.work : RANK.due) : x.d?.kind === 'check' ? RANK.due : RANK[x.r?.st.state] ?? RANK.due);
  const due = $derived.by(() => {
    if (!open) return [];
    const list = c.care.rows
      .map((d) => ({ d, by: whoDoes(d), r: d.part && d.kind !== 'check' ? (rowOf[d.part] ?? stub(d)) : null }))
      .filter((x) => fitsWho(x.by));
    const taken = new Set(c.care.rows.map((d) => d.part).filter(Boolean));
    // A part in a due state that the care rows do not name (a worn pad measured today): due too.
    for (const r of known) if (isDueState(r.st.state) && !taken.has(r.part.key) && fitsWho(r.last?.by ?? 'self')) list.push({ d: null, by: r.last?.by ?? 'self', r });
    return list.map((x, n) => ({ ...x, n })).sort((a, b) => rankOf(b) - rankOf(a) || a.n - b.n);
  });
  const dueParts = $derived(new Set(due.map((x) => x.r?.part.key).filter(Boolean)));
  const fits = (r) => (filter === 'due' ? false : filter === 'self' ? r.last?.by === 'self' : filter === 'shop' ? r.last?.by === 'shop' : true);
  const rest = $derived(known.filter((r) => !dueParts.has(r.part.key) && !c.care.rows.some((d) => d.part === r.part.key) && fits(r)));
  const soon = $derived(rest.filter((r) => r.st.state === 'soon'));
  const ok = $derived(rest.filter((r) => r.st.state !== 'soon'));
  const okGroups = $derived(GROUPS.map((g) => ({ ...g, rows: ok.filter((r) => r.group === g.key) })).filter((g) => g.rows.length));
  const partName = (r) => t(PART[r.part.key]?.name ?? r.part.key);
  let okOpen = $state(false);
  let expanded = $state(null); // the part key whose row is open
  const toggle = (key) => (expanded = expanded === key ? null : key);
  const hasBar = $derived([...due.map((x) => x.r).filter(Boolean), ...soon, ...(okOpen ? ok : [])].some((r) => r.st.fill != null));
  const checkLate = $derived(c.check.rows.filter((r) => r.due).map((r) => r.name));

  /* ---------- folds ---------- */
  let kmOpen = $state(false);
  let blindOpen = $state(false);
  let checkOpen = $state(false);
  let logOpen = $state(false);
  let shopOpen = $state(false);
  let visitsOpen = $state(false);
  const log = $derived(logOpen ? bikeLog(bike, tasks) : []);
  const logCount = $derived(open ? bikeLog(bike, tasks).length : 0);
  function showCheck() {
    checkOpen = true;
    requestAnimationFrame(() => document.getElementById(`check-${bike.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  /* ---------- the year and the shop ---------- */
  const year = $derived(open ? yearSummary(bike, visits, tasks, today.slice(0, 4)) : null);
  const split = $derived(year && year.self + year.shop ? Math.round((year.self / (year.self + year.shop)) * 100) : 0);
  const chf = (n) => `CHF ${n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // v0.30.1 (D1): km save on Enter, on leaving the field and with the button; the field then shows
  // the number as stored ("2.287" becomes 2287). An empty field goes back to the stored km.
  async function km(input) {
    const n = await onkm(input.value);
    if (n != null) input.value = n;
    else if (input.value.trim() === '') input.value = bike.km ?? '';
  }
  const wishable = (r) => {
    const s = c.time.find((x) => x.key === r.part.key);
    return s && !s.never && (s.overdue || s.days <= 30) ? s : null;
  };
  /** The last work without its km (the km has its own column on a computer). */
  const lastText = (r) => {
    const line = lastLine(r.part.key, r.last);
    return typeof r.last?.main.km === 'number' ? line.filter((x, n) => n !== 1) : line;
  };
</script>

{#snippet shop()}
  <span class="who mech" title={t('bike shop|by')}><Store size={14} aria-hidden="true" /><span class="sr">{t('bike shop|by')}</span></span>
{/snippet}

{#snippet badge(state)}
  {#if state && state !== 'none'}<span class="badge {TONE[state]}">{t(BADGE[state])}</span>{/if}
{/snippet}

{#snippet bar(st)}
  {#if st.fill != null}<span class="bar {st.tone}" role="img" aria-label="{Math.round(st.fill * 100)} %"><i style="width:{Math.max(4, Math.round(st.fill * 100))}%"></i></span>{/if}
{/snippet}

{#snippet partRow(r, x)}
  {@const key = r.part.key}
  {@const text = lastText(r)}
  {@const wish = wishable(r)}
  {@const isOpen = expanded === key}
  <li class="pt" class:due={!!x} class:x={isOpen}>
    <span class="pn"><button type="button" class="part-btn" aria-expanded={isOpen} aria-controls="px-{bike.id}-{key}" onclick={() => toggle(key)}>{partName(r)}{#if r.part.model}<small>{r.part.model}</small>{/if}</button></span>
    <span class="st">{@render badge(r.st.state === 'ok' ? null : r.st.state)}</span>
    <span class="last">
      <span class="lt">{#if text.length}{text.join(' · ')}{#if r.last?.by === 'shop'}{@render shop()}{/if}{:else}<span class="m">–</span>{/if}</span>
      {#if typeof r.last?.main.km === 'number'}<span class="kmv num">{num(r.last.main.km)}</span>{/if}
    </span>
    <span class="next" class:late={isDueState(r.st.state)}>{r.st.next || '–'}</span>
    <span class="wear">{@render bar(r.st)}</span>
    <span class="act">
      {#if x}
        {#if x.by === 'shop'}
          {@render shop()}
          <button type="button" class="btn sm" onclick={() => onpart(key)}>{t('Record')}</button>
        {:else if x.d && (x.d.kind === 'time' || x.d.kind === 'km')}
          <button type="button" class="btn sm" onclick={() => ondone(x.d)}><Check size={16} aria-hidden="true" />{t('Done|task')}</button>
        {:else}
          <button type="button" class="btn sm" onclick={() => onpart(key)}>{t('Record')}</button>
        {/if}
      {/if}
    </span>
    {#if isOpen}
      <div class="extra" id="px-{bike.id}-{key}">
        {#if key === 'tyres'}{@render tyres()}{/if}
        <button type="button" class="btn sm" onclick={() => onpart(key)}>{t('Record …')}</button>
        {#if wish}
          <button type="button" class="btn sm" onclick={() => onwish(wish)}>{t('Put on the wishlist')}</button>
          {#if wished[`${bike.id}.${wish.key}`]}<small role="status">{wished[`${bike.id}.${wish.key}`]}</small>{/if}
        {/if}
      </div>
    {/if}
  </li>
{/snippet}

<section class="acc" class:open id="care-{bike.id}" aria-labelledby="care-h-{bike.id}">
  <div class="ah">
    <div class="grow">
      <h2 class="name" id="care-h-{bike.id}">
        <button type="button" class="ah-btn" aria-expanded={open} aria-controls="care-in-{bike.id}" onclick={() => ontoggle?.(!open)}>{bike.name}</button>
      </h2>
      <small class="sub num">
        {#if bike.km != null}{num(bike.km)} km{:else}{t('km not set')}{/if}
        {#if open}
          {#if bike.kmDate} · {t('as of {date}', { date: dateOf(bike.kmDate) })}{/if}
          · <button type="button" class="lnk" aria-expanded={kmOpen || bike.km == null} onclick={() => (kmOpen = !kmOpen)}>{bike.km == null ? t('enter km') : t('change km')}</button>
        {:else if lastVisit}
          · {t('bike shop {date}', { date: dateOf(lastVisit.date) })}
        {:else if nothingYet}
          · {t('nothing recorded yet')}
        {/if}
      </small>
    </div>
    <span class="r">
      {#if c.care.status === 'due'}<span class="badge warn">{words.tag}</span>{:else if c.care.status === 'nodata'}<span class="badge nodata">{words.tag}</span>{:else}<span class="badge n">{words.tag}</span>{/if}
      <span class="chev" aria-hidden="true">{#if open}<ChevronDown size={20} />{:else}<ChevronRight size={20} />{/if}</span>
    </span>
  </div>

  {#if open}
    <div class="in" id="care-in-{bike.id}">
      {#if kmOpen || bike.km == null}
        <form class="km" onsubmit={(e) => (e.preventDefault(), km(e.currentTarget.elements.km))}>
          <label>
            <span class="lbl">{t('km now')}</span>
            <input class="inp num" name="km" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" value={bike.km ?? ''} placeholder={t('not set')} onchange={(e) => km(e.currentTarget)} />
          </label>
          <button type="submit" class="btn sm">{t('Save km')}</button>
          {#if bike.kmDate}<small>{t('set {date}', { date: dateOf(bike.kmDate) })}</small>{/if}
        </form>
      {/if}
      {#if kmMsg?.error}<p class="err" role="alert">{kmMsg.text}</p>{:else if kmMsg}<p class="saved" role="status">{kmMsg.text}</p>{/if}
      {#if words.text && c.care.status !== 'due'}<p class="quiet">{words.text}</p>{/if}

      <div class="th" aria-hidden="true"><span>{t('Part')}</span><span>{t('Last done')}</span><span class="r-al">km</span><span>{t('Next|care')}</span><span>{t('Wear|column')}</span><span>{t('Status')}</span><span></span></div>
      <ul class="parts">
        {#each due as x (x.d?.key ?? x.r.part.key)}
          {#if x.r}
            {@render partRow(x.r, x)}
          {:else if x.d.kind === 'check'}
            <li class="pt due">
              <span class="pn"><button type="button" class="part-btn" onclick={showCheck}>{t('{km} km check', { km: num(CHECK_KM) })}</button></span>
              <span class="st">{@render badge('due')}</span>
              <span class="last"><span class="lt">{x.d.detail}</span></span>
              <span class="next late">{checkLate.join(', ') || '–'}</span>
              <span class="wear"></span>
              <span class="act"><button type="button" class="btn sm" onclick={showCheck}>{t('Look at the check')}</button></span>
            </li>
          {:else}
            {@const task = x.d.task}
            <li class="pt due">
              <span class="pn"><b class="rn">{x.d.name}</b></span>
              <span class="st">{@render badge(task.status === 'needed' ? 'work' : 'due')}</span>
              <span class="last"><span class="lt">{x.d.detail}{#if task.note} · {task.note}{/if}</span></span>
              <span class="next">{#if task.priority}{t({ high: 'High', medium: 'Medium', low: 'Low' }[task.priority] ?? task.priority)}{:else}–{/if}</span>
              <span class="wear"></span>
              <span class="act">
                <button type="button" class="btn sm" onclick={() => onrepair(task, 'done')}><Check size={16} aria-hidden="true" />{t('Done|task')}</button>
                <MoreMenu label={task.task} actions={[{ name: t('Work needed'), run: () => onrepair(task, 'needed') }, { name: t('Not needed any more'), run: () => onrepair(task, 'gone') }]} />
              </span>
            </li>
          {/if}
        {/each}
        {#each soon as r (r.part.key)}
          {@render partRow(r, null)}
        {/each}
        {#if ok.length}
          <li class="okrow">
            <button type="button" class="okfold" aria-expanded={okOpen} aria-controls="ok-{bike.id}" onclick={() => (okOpen = !okOpen)}>
              <span class="chev" aria-hidden="true">{#if okOpen}<ChevronDown size={18} />{:else}<ChevronRight size={18} />{/if}</span>
              <b>{t('{n} ok', { n: ok.length })}</b>
              <span class="names">{ok.map(partName).join(', ')}</span>
            </button>
          </li>
          {#if okOpen}
            {#each okGroups as g (g.key)}
              <li class="gh" id={g === okGroups[0] ? `ok-${bike.id}` : undefined}><h3>{t(g.name)}</h3></li>
              {#each g.rows as r (r.part.key)}
                {@render partRow(r, null)}
              {/each}
            {/each}
          {/if}
        {/if}
        {#if !due.length && !soon.length && !ok.length}
          <li class="none"><p class="quiet">{filter === 'due' ? t('Nothing due on this bike.') : t('No part fits this filter.')}</p></li>
        {/if}
      </ul>

      <div class="folds">
        {#if blind.length && filter === 'all'}
          <details class="fold" bind:open={blindOpen}>
            <summary><Info size={18} aria-hidden="true" /><span class="fl">{t('No data')}</span><span class="r">{tn(blind.length, '{n} part', '{n} parts')}<ChevronRight size={18} aria-hidden="true" /></span></summary>
            {#if blindOpen}
              <ul class="plain">
                {#each blind as r (r.part.key)}
                  <li>
                    <button type="button" class="part-btn row" onclick={() => onpart(r.part.key)}>{t(PART[r.part.key]?.name ?? r.part.key)}{#if r.part.model}<small>{r.part.model}</small>{/if}</button>
                    {#if r.part.key === 'tyres'}{@render tyres()}{/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </details>
        {/if}
        <details class="fold" id="check-{bike.id}" bind:open={checkOpen}>
          <summary><ListChecks size={18} aria-hidden="true" /><span class="fl">{t('{km} km check', { km: num(CHECK_KM) })}</span><span class="r">{#if c.check.due}<span class="badge warn">{t('{n} open', { n: c.check.due })}</span>{/if}<ChevronRight size={18} aria-hidden="true" /></span></summary>
          {#if checkOpen}
            <ul class="checks">
              {#each c.check.rows as r (r.key)}
                <li class:late={r.due}><span>{r.name}</span><span class="num m">{needsWork(bike.parts.find((p) => p.key === r.key)) ? t('work needed') : r.unknown ? (bike.km == null ? t('set km') : t('not recorded')) : t('{km} km ago', { km: num(r.since) })}</span></li>
              {/each}
            </ul>
            <button type="button" class="btn sm" onclick={() => oncheck(c.check.rows.map((r) => r.key), 'check', t('{km} km check', { km: CHECK_KM }))}>{t('All checked, OK')}</button>
            <p class="hint">{t('Something not OK? Open the part and tap "Replace or work needed".')}</p>
          {/if}
        </details>
        <details class="fold" bind:open={logOpen}>
          <summary><BookOpen size={18} aria-hidden="true" /><span class="fl">{t('Log: everything that was done')}</span><span class="r num">{logCount}<ChevronRight size={18} aria-hidden="true" /></span></summary>
          {#if logOpen}
            {#if log.length}
              <ol class="log">
                {#each log as h, n (n)}
                  <li>
                    <span class="num when">{dateOf(h.date)}{h.km != null ? ` · ${num(h.km)} km` : ''}</span>
                    <span><b>{h.what}</b>{#if h.action !== 'wash'}: {h.action === 'repair' ? t('done') : h.action === 'replace' ? (h.unit ? t('replaced') : t('done')) : h.action === 'service' ? t('serviced') : h.result === 'needed' ? t('work needed') : t('checked, OK')}{/if}{h.value != null ? ` · ${h.value} ${h.unit}` : ''}{#each Object.keys(EXTRA).filter((k) => h[k] != null) as k (k)}{` · ${t(EXTRA[k].name.toLowerCase())} ${h[k]} ${EXTRA[k].unit}`}{/each}{h.note ? ` · ${h.note}` : ''}{typeof h.chf === 'number' && h.chf > 0 ? ` · CHF ${num(h.chf)}` : ''} {#if h.by === 'shop'}{@render shop()}{/if}</span>
                  </li>
                {/each}
              </ol>
            {:else}
              <p class="hint">{t('Nothing recorded yet. The service photos will be the first entries.')}</p>
            {/if}
          {/if}
        </details>
        <details class="fold" bind:open={shopOpen}>
          <summary><Store size={18} aria-hidden="true" /><span class="fl">{t('Bike shop & {year}', { year: year.year })}</span><span class="r num">{#if c.order?.rows.length}<span class="badge n">{tn(c.order.rows.length, '{n} job', '{n} jobs')}</span>{/if}{t('me|by')} {year.self} · {t('bike shop|by')} {year.shop}<ChevronRight size={18} aria-hidden="true" /></span></summary>
          {#if shopOpen}
            <section class="sub-sec" aria-labelledby="shop-h-{bike.id}">
              <h3 id="shop-h-{bike.id}" class="ch">{t('For the bike shop')}</h3>
              {#if c.order?.rows.length}
                <p class="quiet">{c.order.rows.map((r) => r.name).join(' · ')}{#if c.order.total} · {t('about CHF {chf}', { chf: c.order.total })}{c.order.unknown ? ` + ${t('unknown')}` : ''}{/if}</p>
                <button type="button" class="btn" onclick={onorder}>{t('Send workshop order')}</button>
              {:else}
                <p class="quiet">{t('Nothing for the bike shop right now.')}</p>
              {/if}
            </section>
            <section class="sub-sec" aria-labelledby="year-h-{bike.id}">
              <h3 id="year-h-{bike.id}" class="ch">{t('{year} on this bike', { year: year.year })}</h3>
              {#if year.self + year.shop}
                <div class="split" aria-hidden="true"><i style="width:{split}%" class="me"></i><i style="width:{100 - split}%" class="mech"></i></div>
              {/if}
              <p class="legend">
                <span><i class="dot me" aria-hidden="true"></i>{tn(year.self, 'me: {n} job', 'me: {n} jobs')}</span>
                <span><i class="dot mech" aria-hidden="true"></i>{tn(year.shop, 'bike shop: {n} visit', 'bike shop: {n} visits')}{#if year.shop} · <span class="num">{year.unknown === year.shop ? t('cost unknown') : `${chf(year.chf)}${year.unknown ? ` + ${t('unknown')}` : ''}`}</span>{/if}</span>
              </p>
              <p class="quiet num">{year.per?.chf != null ? t('CHF {chf} per 1000 km', { chf: num(year.per.chf) }) : year.per?.wait ? t('Cost per 1000 km after {km} more km', { km: num(year.per.wait) }) : t('Cost per 1000 km: add the km at a visit')}</p>
              {#if lastVisit}
                <p class="lbl last-lbl">{t('Last visit')}</p>
                <button type="button" class="visit" onclick={() => onvisit(lastVisit.id)}>
                  <span class="pn">{dateOf(lastVisit.date)} · {lastVisit.shop}<small>{tn((lastVisit.parts ?? []).length, '{n} job', '{n} jobs')}{lastVisit.km != null ? ` · ${num(lastVisit.km)} km` : ''}</small></span>
                  <span class="num">{visitTotal(lastVisit) == null ? t('cost unknown') : chf(visitTotal(lastVisit))}</span>
                </button>
                <details class="fold small" bind:open={visitsOpen}>
                  <summary><span class="fl">{t('All visits and costs')}</span><span class="r num">{c.mine.length}<ChevronRight size={18} aria-hidden="true" /></span></summary>
                  {#if visitsOpen}
                    <ul class="plain">
                      {#each c.mine as v (v.id)}
                        <li>
                          <button type="button" class="visit" onclick={() => onvisit(v.id)}>
                            <span class="pn">{dateOf(v.date)} · {v.shop}<small>{v.invoice ? `${v.invoice} · ` : ''}{tn((v.parts ?? []).length, '{n} job', '{n} jobs')}{v.km != null ? ` · ${num(v.km)} km` : ''}{v.photos?.length ? ` · ${tn(v.photos.length, '{n} receipt photo', '{n} receipt photos')}` : ''}</small></span>
                            <span class="num">{visitTotal(v) == null ? t('cost unknown') : chf(visitTotal(v))}</span>
                          </button>
                        </li>
                      {/each}
                    </ul>
                    <ul class="totals">
                      {#each costByYear(c.mine) as y (y.year)}<li><span>{y.year}</span><span class="num">{y.unknown === y.visits ? t('cost unknown') : `${chf(y.chf)}${y.unknown ? ` + ${t('unknown')}` : ''}`}</span></li>{/each}
                    </ul>
                    {@const top = costByPart(c.mine, 3)}
                    {#if top.length}<p class="hint">{t('Most:')} {top.map((r) => `${r.name} ${chf(r.chf)}`).join(' · ')}</p>{/if}
                  {/if}
                </details>
              {:else}
                <p class="hint">{t('No workshop visits yet. Send Claude a photo of the receipt; it comes back as a file to import.')}</p>
              {/if}
            </section>
          {/if}
        </details>
      </div>
      <p class="legend foot">
        {#if hasBar}<span><span class="bar ok demo" aria-hidden="true"><i style="width:60%"></i></span>{t('Bar: how much of the interval or the wear is used')}</span>{/if}
        <span><Store size={14} aria-hidden="true" />{t('= bike shop, otherwise me.')}</span>
      </p>
    </div>
  {/if}
</section>

{#snippet tyres()}
  <span class="tyres" role="group" aria-label={t('Tube or tubeless')}>
    {#each [['front', 'Front'], ['rear', 'Rear']] as [w, label] (w)}
      <span class="tw">
        <span class="tl">{t(label)}</span>
        <span class="seg" role="group" aria-label="{t(label)}: {t('Tube or tubeless')}">
          <button type="button" aria-pressed={c.tyres[w] === 'tubeless'} onclick={() => ontyre(w, 'tubeless')}>{t('Tubeless')}</button>
          <button type="button" aria-pressed={c.tyres[w] === 'tube'} onclick={() => ontyre(w, 'tube')}>{t('Tube')}</button>
        </span>
      </span>
    {/each}
  </span>
{/snippet}

<style>
  /* One bike: a light head on a rule, no box (v0.38.0). */
  .acc {
    border-bottom: 1px solid var(--line);
  }
  .ah {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 64px;
    padding: 8px 0;
  }
  .acc.open .ah {
    border-bottom: 1.5px solid var(--ink);
  }
  .grow {
    flex: 1;
    min-width: 0;
  }
  .name {
    margin: 0;
    font-size: var(--fs-sub);
    line-height: 1.25;
  }
  /* The whole header row opens and closes the bike (a stretched button); "change km" sits above it. */
  .ah-btn {
    border: 0;
    background: none;
    padding: 0;
    font: 700 var(--fs-sub) / 1.25 var(--font-body);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .ah-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 10px;
  }
  .ah-btn:focus-visible {
    outline: none;
  }
  .ah-btn:focus-visible::after {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .sub {
    display: block;
    font-size: 14px;
    color: var(--ink-3);
  }
  .lnk {
    position: relative;
    z-index: 1;
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  /* 44 px tap area without moving the layout. */
  .lnk::before {
    content: '';
    position: absolute;
    left: -6px;
    right: -6px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
  }
  .r {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-3);
    font-size: 14px;
    flex: none;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .badge.warn {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .badge.bad {
    background: var(--bad-soft);
    color: var(--bad);
  }
  /* v0.22.0 (AP06): no data is said in words, with a dashed edge, not as "fine". */
  .badge.nodata {
    background: none;
    border: 1.5px dashed var(--ink-3);
  }
  /* The bike shop's sign: only on its work, explained once under the list. */
  .who.mech {
    display: inline-flex;
    align-items: center;
    margin-left: 6px;
    color: var(--ink-2);
    vertical-align: -2px;
  }
  .in {
    padding: 0 0 14px;
  }
  .km {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 8px 0;
  }
  .km label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .km .lbl {
    margin: 0;
  }
  .km .inp {
    width: 110px;
    min-height: 44px;
  }
  .km .btn {
    min-height: 44px;
  }
  .saved {
    margin: 6px 0;
    font-size: 14px;
    color: var(--ok);
    font-weight: 700;
  }
  .err {
    color: var(--bad);
    font-size: 14px;
  }
  small {
    font-size: 13px;
    color: var(--ink-3);
    font-weight: 400;
  }
  .quiet,
  .hint {
    font-size: 14px;
    color: var(--ink-3);
    margin: 6px 0 10px;
  }
  .btn.sm {
    min-height: 44px;
    gap: 6px;
  }
  .parts,
  .plain,
  .checks,
  .totals,
  .log {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  /* ---------- the list: phone first ---------- */
  .pt {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-areas:
      'pn st act'
      'last last act'
      'next wear act';
    gap: 2px 10px;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid var(--line);
  }
  .pn {
    grid-area: pn;
    min-width: 0;
  }
  .st {
    grid-area: st;
    justify-self: end;
  }
  .last {
    grid-area: last;
    min-width: 0;
    font-size: 14px;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .last .kmv::before {
    content: ' · ';
  }
  .last .kmv::after {
    content: ' km';
  }
  .next {
    grid-area: next;
    min-width: 0;
    font-size: 13px;
    color: var(--ink-3);
    overflow-wrap: anywhere;
  }
  .next.late {
    color: var(--warn);
    font-weight: 600;
  }
  .wear {
    grid-area: wear;
    justify-self: end;
    width: 48px;
  }
  .wear:empty {
    display: none;
  }
  .act {
    grid-area: act;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
  .act:empty {
    display: none;
  }
  .m {
    color: var(--ink-3);
  }
  .rn {
    font-size: 16px;
    overflow-wrap: anywhere;
  }
  .part-btn {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 6px;
    min-height: 44px;
    margin: -8px 0;
    padding: 0;
    border: 0;
    background: none;
    font: 600 16px/1.25 var(--font-body);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: var(--line-strong);
    text-underline-offset: 3px;
    overflow-wrap: anywhere;
  }
  .part-btn:hover {
    text-decoration-color: var(--ink);
  }
  .part-btn small {
    font-weight: 400;
  }
  .bar {
    display: block;
    height: 5px;
    border-radius: 9px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 9px;
    background: var(--ink-2);
  }
  .bar.warn i {
    background: #c48a14;
  }
  .bar.bad i {
    background: var(--bad);
  }
  .extra {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 8px 0 2px;
  }
  /* "4 ok" with the names: one row; open, the groups as light subtitles. */
  .okrow {
    border-bottom: 1px solid var(--line);
  }
  .okfold {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 48px;
    padding: 4px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 15px var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .okfold b {
    flex: none;
    font-weight: 600;
  }
  .okfold .names {
    min-width: 0;
    flex: 1;
    color: var(--ink-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chev {
    display: inline-flex;
    color: var(--ink-3);
  }
  .gh h3 {
    margin: 10px 0 0;
    padding: 0 0 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-3);
    border-bottom: 1px solid var(--line);
  }
  .none .quiet {
    margin: 10px 0;
  }
  .tyres {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
  }
  .tw {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .tl {
    font-size: 13px;
    color: var(--ink-3);
  }
  .seg {
    display: inline-flex;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    overflow: hidden;
  }
  .seg button {
    min-height: 44px;
    padding: 4px 10px;
    border: 0;
    background: var(--paper);
    font: 600 13px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .seg button + button {
    border-left: 1px solid var(--line);
  }
  .seg button[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .th {
    display: none;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    align-items: center;
    font-size: 13px;
    color: var(--ink-3);
    margin: 10px 0 0;
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .bar.demo {
    width: 32px;
    flex: none;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    flex: none;
  }
  .dot.me,
  .split .me {
    background: var(--ink);
  }
  .dot.mech,
  .split .mech {
    background: #7f9cc4;
  }

  /* ---------- folded rows: list rows, no boxes ---------- */
  .fold {
    border-bottom: 1px solid var(--line);
  }
  .fold > summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 4px 0;
    list-style: none;
    cursor: pointer;
    font-weight: 500;
    color: var(--ink);
  }
  .fold > summary::-webkit-details-marker {
    display: none;
  }
  .fold > summary :global(svg) {
    color: var(--ink-3);
    flex: none;
  }
  .fold[open] > summary .r > :global(svg:last-child) {
    transform: rotate(90deg);
  }
  .fl {
    min-width: 0;
  }
  .fold > .btn {
    margin-bottom: 10px;
  }
  .fold.small {
    margin: 10px 0 0;
    border-top: 1px solid var(--line);
  }
  .fold.small > summary {
    min-height: 44px;
    font-size: 15px;
  }
  .plain li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    border-top: 1px solid var(--line);
    padding: 2px 0;
  }
  .plain li:first-child {
    border-top: 0;
  }
  .part-btn.row {
    margin: 0;
    font-weight: 500;
  }
  .checks li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
    font-size: 15px;
  }
  .checks + .btn {
    margin-top: 8px;
  }
  .late {
    font-weight: 700;
  }
  .log li {
    display: grid;
    grid-template-columns: 190px 1fr;
    gap: 2px 12px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }
  .log li:last-child {
    border-bottom: 0;
  }
  .when {
    color: var(--ink-3);
  }
  .sub-sec {
    padding: 4px 0 12px;
  }
  .sub-sec + .sub-sec {
    border-top: 1px solid var(--line);
    padding-top: 12px;
  }
  .ch {
    margin: 0;
    font-size: 16px;
  }
  .split {
    display: flex;
    height: 10px;
    border-radius: 9px;
    overflow: hidden;
    margin: 10px 0 4px;
    background: var(--paper-2);
  }
  .split i {
    display: block;
    height: 100%;
  }
  .last-lbl {
    margin: 10px 0 2px;
  }
  .visit {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 4px 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 15px;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .visit .pn {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .visit > .num {
    text-align: right;
    white-space: nowrap;
  }
  @media (hover: hover) {
    .visit:hover {
      background: var(--paper-2);
    }
  }
  .totals li {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    font-size: 15px;
  }
  @media (max-width: 640px) {
    .log li {
      grid-template-columns: 1fr;
    }
  }

  /* ---------- computer: a table, the column heads once ---------- */
  @media (min-width: 900px) {
    .th,
    .pt {
      display: grid;
      grid-template-columns: minmax(0, 2.2fr) minmax(0, 2.6fr) 72px minmax(0, 2.6fr) 80px 116px 150px;
      grid-template-areas: 'pn last km next wear st act';
      gap: 4px 14px;
      align-items: center;
    }
    .th {
      font-size: 13px;
      color: var(--ink-3);
      padding: 10px 0 4px;
      border-bottom: 1px solid var(--line);
    }
    .th > span:nth-child(1) { grid-area: pn; }
    .th > span:nth-child(2) { grid-area: last; }
    .th > span:nth-child(3) { grid-area: km; }
    .th > span:nth-child(4) { grid-area: next; }
    .th > span:nth-child(5) { grid-area: wear; }
    .th > span:nth-child(6) { grid-area: st; }
    .r-al {
      text-align: right;
    }
    .pt {
      min-height: 52px;
      padding: 4px 0;
    }
    .last {
      display: contents;
    }
    .lt {
      grid-area: last;
      min-width: 0;
      font-size: 15px;
    }
    .last .kmv {
      grid-area: km;
      text-align: right;
      font-size: 15px;
    }
    .last .kmv::before,
    .last .kmv::after {
      content: none;
    }
    .next {
      font-size: 15px;
    }
    .wear,
    .wear:empty {
      display: block;
      justify-self: stretch;
      width: auto;
    }
    .st {
      justify-self: start;
    }
    .extra {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>
