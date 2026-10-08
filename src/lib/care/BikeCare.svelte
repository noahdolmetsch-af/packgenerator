<script>
  /**
   * One bike in Velopflege. v0.31.0 (redesign, answers 8a and 10a, mockup v3-pflege): an accordion
   * item. Closed it is one row: name, km and "3 due" / "nothing due". Open it shows, in this order:
   * up to 3 rows "Due now" (my own jobs with a Done button, the bike shop's with a badge), the parts
   * in groups with the last work (what, when, km, CHF, me / bike shop), a state bar, what comes next
   * and a state badge; then folded: parts without data, the 1000 km check and the log. Beside
   * (desktop) or below (phone): the workshop order and the year on this bike.
   */
  import { Bike, Check, ChevronDown, ChevronRight, Store, UserRound, Cog, Disc, MoveVertical, CircleDot, Wrench, Info, ListChecks, BookOpen, TrendingDown } from '@lucide/svelte';
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
  const known = $derived(rows.filter((r) => r.last || r.st.state !== 'none'));
  const blind = $derived(rows.filter((r) => !r.last && r.st.state === 'none'));
  const fits = (r) =>
    filter === 'due' ? isDueState(r.st.state) : filter === 'self' ? r.last?.by === 'self' : filter === 'shop' ? r.last?.by === 'shop' : true;
  const groups = $derived(GROUPS.map((g) => ({ ...g, rows: known.filter((r) => r.group === g.key && fits(r)) })).filter((g) => g.rows.length));
  const BADGE = { ok: 'good|part', soon: 'soon|part', due: 'due|part', overdue: 'overdue|part', work: 'work needed|part' };
  const TONE = { ok: 'ok', soon: 'warn', due: 'warn', overdue: 'bad', work: 'bad' };
  const ICON = { drive: Cog, brakes: Disc, suspension: MoveVertical, wheels: CircleDot, other: Wrench };

  /* ---------- due now: up to 3, the rest on a tap ---------- */
  let allDue = $state(false);
  const due = $derived(c.care.rows);
  const dueShown = $derived(allDue ? due : due.slice(0, 3));
  const partOf = (key) => bike.parts.find((p) => p.key === key);
  /** Who does this job: the bike shop when it usually did this part; waxing, the check and repairs are mine. */
  const whoDoes = (r) => (r.kind === 'time' || r.kind === 'part') && r.part && usualBy(partOf(r.part)) === 'shop' ? 'shop' : 'self';

  /* ---------- folds ---------- */
  let kmOpen = $state(false);
  let blindOpen = $state(false);
  let checkOpen = $state(false);
  let logOpen = $state(false);
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
</script>

{#snippet who(by)}
  {#if by === 'shop'}<span class="who mech"><Store size={12} aria-hidden="true" />{t('bike shop|by')}</span>{:else if by === 'self'}<span class="who"><UserRound size={12} aria-hidden="true" />{t('me|by')}</span>{/if}
{/snippet}

<section class="acc" class:open id="care-{bike.id}" aria-labelledby="care-h-{bike.id}">
  <div class="ah">
    <span class="ibox" class:dark={open} aria-hidden="true"><Bike size={20} /></span>
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
      {#if c.care.status === 'due'}<span class="badge warn">{words.tag}</span>{:else if c.care.status === 'nodata'}<span class="badge nodata">{words.tag}</span>{:else}<span class="badge ok">{words.tag}</span>{/if}
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

      <div class="accgrid">
        <div class="main">
          {#if due.length}
            <h3 class="grp first">{t('Due now|care')}</h3>
            <ul class="due">
              {#each dueShown as r (r.key)}
                {@const by = whoDoes(r)}
                <li>
                  <span class="nm"><b>{r.name}</b><small>{r.detail}{#if r.task?.note} · {r.task.note}{/if}{#if r.task?.priority} · {t({ high: 'High', medium: 'Medium', low: 'Low' }[r.task.priority] ?? r.task.priority)}{/if}</small></span>
                  <span class="acts">
                    {#if r.kind === 'repair'}
                      <button type="button" class="btn sm" onclick={() => onrepair(r.task, 'done')}><Check size={16} aria-hidden="true" />{t('Done|task')}</button>
                      <MoreMenu label={r.task.task} actions={[{ name: t('Work needed'), run: () => onrepair(r.task, 'needed') }, { name: t('Not needed any more'), run: () => onrepair(r.task, 'gone') }]} />
                    {:else if r.kind === 'check'}
                      <button type="button" class="btn sm" onclick={showCheck}>{t('Look at the check')}</button>
                    {:else if by === 'shop'}
                      {@render who('shop')}
                      <button type="button" class="btn sm quiet-act" onclick={() => onpart(r.part)}>{t('Record')}</button>
                    {:else if r.kind === 'time' || r.kind === 'km'}
                      <button type="button" class="btn sm" onclick={() => ondone(r)}><Check size={16} aria-hidden="true" />{t('Done|task')}</button>
                    {:else}
                      <button type="button" class="btn sm" onclick={() => onpart(r.part)}>{t('Record')}</button>
                    {/if}
                  </span>
                </li>
              {/each}
            </ul>
            {#if due.length > 3}
              <button type="button" class="lnk more" aria-expanded={allDue} onclick={() => (allDue = !allDue)}>{allDue ? t('Show fewer') : t('Show all {n}', { n: due.length })}</button>
            {/if}
          {/if}

          <div class="th" aria-hidden="true"><span></span><span>{t('Part')}</span><span>{t('Last done')}</span><span>{t('State · next')}</span><span></span></div>
          {#each groups as g (g.key)}
            {@const Icon = ICON[g.key]}
            <h3 class="grp">{t(g.name)}</h3>
            <ul class="parts">
              {#each g.rows as r (r.part.key)}
                {@const line = lastLine(r.part.key, r.last)}
                {@const wish = wishable(r)}
                <li class="pt">
                  <span class="pi" aria-hidden="true"><Icon size={18} /></span>
                  <span class="pn"><button type="button" class="part-btn" onclick={() => onpart(r.part.key)}>{t(PART[r.part.key]?.name ?? r.part.key)}{#if r.part.model}<small>{r.part.model}</small>{/if}</button></span>
                  <span class="st">{#if r.st.state !== 'none'}<span class="badge {TONE[r.st.state]}">{t(BADGE[r.st.state])}</span>{/if}</span>
                  <span class="last">{#if line.length}<span>{line.join(' · ')}</span>{@render who(r.last.by)}{:else}<span class="m">–</span>{/if}</span>
                  <span class="wear">
                    {#if r.st.fill != null}<span class="bar {r.st.tone}" role="img" aria-label="{Math.round(r.st.fill * 100)} %"><i style="width:{Math.max(4, Math.round(r.st.fill * 100))}%"></i></span>{/if}
                    <span>{r.st.next || '–'}</span>
                  </span>
                  {#if r.part.key === 'tyres' || wish}
                    <span class="extra">
                      {#if r.part.key === 'tyres'}
                        {@render tyres()}
                      {/if}
                      {#if wish}
                        <button type="button" class="btn sm quiet-act" onclick={() => onwish(wish)}>{t('Put on the wishlist')}</button>
                        {#if wished[`${bike.id}.${wish.key}`]}<small role="status">{wished[`${bike.id}.${wish.key}`]}</small>{/if}
                      {/if}
                    </span>
                  {/if}
                </li>
              {/each}
            </ul>
          {:else}
            <p class="quiet">{t('No part fits this filter.')}</p>
          {/each}
          {#if groups.some((g) => g.rows.some((r) => r.st.fill != null))}
            <p class="legend"><i class="dot" aria-hidden="true"></i>{t('Bar: how much of the interval or the wear is used')}</p>
          {/if}

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
                        <span><b>{h.what}</b>: {h.action === 'repair' ? t('done') : h.action === 'replace' ? (h.unit ? t('replaced') : t('done')) : h.action === 'service' ? t('serviced') : h.result === 'needed' ? t('work needed') : t('checked, OK')}{h.value != null ? ` · ${h.value} ${h.unit}` : ''}{#each Object.keys(EXTRA).filter((k) => h[k] != null) as k (k)}{` · ${t(EXTRA[k].name.toLowerCase())} ${h[k]} ${EXTRA[k].unit}`}{/each}{h.note ? ` · ${h.note}` : ''}{typeof h.chf === 'number' && h.chf > 0 ? ` · CHF ${num(h.chf)}` : ''} {@render who(h.by)}</span>
                      </li>
                    {/each}
                  </ol>
                {:else}
                  <p class="hint">{t('Nothing recorded yet. The service photos will be the first entries.')}</p>
                {/if}
              {/if}
            </details>
          </div>
        </div>

        <div class="side">
          <section class="card" aria-labelledby="shop-h-{bike.id}">
            <h3 id="shop-h-{bike.id}" class="ch"><Store size={18} aria-hidden="true" />{t('For the bike shop')}{#if c.order?.rows.length}<span class="r">{tn(c.order.rows.length, '{n} job', '{n} jobs')}</span>{/if}</h3>
            {#if c.order?.rows.length}
              <p class="quiet">{c.order.rows.map((r) => r.name).join(' · ')}{#if c.order.total} · {t('about CHF {chf}', { chf: c.order.total })}{c.order.unknown ? ` + ${t('unknown')}` : ''}{/if}</p>
              <button type="button" class="btn" onclick={onorder}>{t('Send workshop order')}</button>
            {:else}
              <p class="quiet">{t('Nothing for the bike shop right now.')}</p>
            {/if}
          </section>
          <section class="card" aria-labelledby="year-h-{bike.id}">
            <h3 id="year-h-{bike.id}" class="ch"><TrendingDown size={18} aria-hidden="true" />{t('{year} on this bike', { year: year.year })}</h3>
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
        </div>
      </div>
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
  .acc {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 12px;
    margin-bottom: 10px;
  }
  .acc.open {
    border: 2px solid var(--ink);
  }
  .ah {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 64px;
    padding: 8px 16px;
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
  .lnk.more {
    margin: 0 0 8px;
    font-size: 14px;
    min-height: 44px;
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
  .ibox {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
    display: grid;
    place-items: center;
    flex: none;
  }
  .ibox.dark {
    background: var(--brand);
    color: var(--brand-ink);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .badge.ok {
    background: var(--ok-soft);
    color: var(--ok);
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
  .who {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 999px;
    white-space: nowrap;
    border: 1px solid var(--line);
    color: var(--ink-2);
    background: var(--paper);
  }
  .who.mech {
    background: #e8eef7;
    border-color: #c5d3e8;
    color: #2c4a75;
  }
  .in {
    padding: 0 16px 14px;
  }
  .km {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
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
    margin: 0 0 6px;
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
  /* Section headers: small caps-like label on a rule. */
  .grp {
    font-size: 12px;
    font-weight: 700;
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 16px 0 0;
    padding: 0 0 4px;
    border-bottom: 1px solid var(--line);
  }
  .grp.first {
    margin-top: 0;
    border: 0;
  }
  .due {
    list-style: none;
    margin: 4px 0 12px;
    padding: 4px 12px;
    background: var(--warn-soft);
    border-radius: 10px;
  }
  .due li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    min-height: 52px;
    padding: 6px 0;
    border-top: 1px solid #efdcb0;
  }
  .due li:first-child {
    border-top: 0;
  }
  .nm {
    flex: 1 1 12em;
    min-width: 0;
    font-size: 15px;
  }
  .nm small {
    display: block;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-left: auto;
  }
  .btn.sm {
    min-height: 44px;
    gap: 6px;
  }
  /* Row actions: quiet on a desktop until the row is hovered or focused; always clear on touch. */
  @media (hover: hover) and (pointer: fine) {
    .quiet-act {
      border-color: var(--line);
      color: var(--ink-3);
      background: transparent;
    }
    li:hover .quiet-act,
    li:focus-within .quiet-act,
    .quiet-act:focus-visible {
      border-color: var(--line-strong);
      color: var(--ink);
      background: var(--paper);
    }
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
  .pt {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    gap: 2px 10px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
    align-items: start;
  }
  .parts .pt:first-child {
    border-top: 0;
  }
  .pi {
    grid-row: 1 / span 3;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--paper-2);
    display: grid;
    place-items: center;
    color: var(--ink-3);
    margin-top: 2px;
  }
  .pn {
    grid-column: 2;
    min-width: 0;
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
    text-decoration-color: var(--line);
    text-underline-offset: 3px;
  }
  .part-btn:hover {
    text-decoration-color: var(--ink);
  }
  .part-btn small {
    font-weight: 400;
  }
  .st {
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
  }
  .last {
    grid-column: 2 / span 2;
    font-size: 14px;
    color: var(--ink-2);
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    align-items: center;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .m {
    color: var(--ink-3);
  }
  .wear {
    grid-column: 2 / span 2;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    font-size: 13px;
    color: var(--ink-3);
  }
  .wear > span:last-child {
    text-align: right;
  }
  .wear > span:only-child {
    grid-column: 1 / -1;
    text-align: left;
  }
  .bar {
    height: 6px;
    border-radius: 9px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 9px;
    background: var(--ok);
  }
  .bar.warn i {
    background: #c48a14;
  }
  .bar.bad i {
    background: var(--bad);
  }
  .extra {
    grid-column: 2 / span 2;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin-top: 4px;
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
    min-height: 40px;
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
  @media (pointer: coarse) {
    .seg button {
      min-height: 44px;
    }
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
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    flex: none;
    background: var(--ok);
    margin-right: 6px;
  }
  .legend span .dot {
    margin: 0;
  }
  .dot.me,
  .split .me {
    background: var(--ink);
  }
  .dot.mech,
  .split .mech {
    background: #7f9cc4;
  }
  .folds {
    margin-top: 14px;
  }
  .fold {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 12px;
    margin-bottom: 8px;
  }
  .fold > summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 6px 14px;
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
  .fold[open] > summary .r :global(svg:last-child) {
    transform: rotate(90deg);
  }
  .fl {
    min-width: 0;
  }
  .fold > :not(summary) {
    margin-left: 14px;
    margin-right: 14px;
  }
  .fold > .btn {
    margin-bottom: 4px;
  }
  .fold.small {
    border-radius: 8px;
    margin: 10px 0 0;
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
  .side .card {
    margin-top: 12px;
    padding: 14px;
    border-radius: 12px;
  }
  .ch {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 17px;
  }
  .ch :global(svg) {
    color: var(--ink-2);
    flex: none;
  }
  .ch .r {
    font-weight: 400;
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
  @media (min-width: 900px) {
    .accgrid {
      display: grid;
      grid-template-columns: minmax(0, 8fr) minmax(0, 4fr);
      gap: 20px;
      align-items: start;
    }
    .side .card:first-child {
      margin-top: 0;
    }
    .th {
      display: grid;
      grid-template-columns: 32px minmax(0, 2.2fr) minmax(0, 3fr) minmax(0, 2fr) 110px;
      gap: 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ink-3);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 8px 0 0;
    }
    .pt {
      grid-template-columns: 32px minmax(0, 2.2fr) minmax(0, 3fr) minmax(0, 2fr) 110px;
      gap: 4px 12px;
      align-items: center;
      padding: 8px 0;
    }
    .pi {
      grid-row: 1;
    }
    .last {
      grid-column: 3;
      grid-row: 1;
    }
    .wear {
      grid-column: 4;
      grid-row: 1;
      grid-template-columns: 1fr;
      gap: 3px;
    }
    .wear > span:last-child {
      text-align: left;
    }
    .st {
      grid-column: 5;
      grid-row: 1;
    }
    .extra {
      grid-column: 2 / -1;
      grid-row: 2;
    }
  }
</style>
