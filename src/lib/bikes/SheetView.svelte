<script>
  /**
   * v0.69.0 «Velo-Blätter» (Noah V3 a, V4 a, V5 a; mockups doc-velo-pass, doc-service-plan,
   * doc-abhol-check): one sheet of a bike's folder as a page of paper, or the whole folder (sheet
   * 'all'). Above it: back to where it was opened, «Change values» (where the values live), «Copy
   * text» and «Share as PDF» (the print dialog of the device: print or save as PDF; only the paper
   * prints). A missing value is an empty line «enter» that links to where it is edited.
   * Workshop order: every job can be taken off, wishes typed in. Pick-up check: every tick is stored
   * at once; «Take into care» records the ticked work (a replaced part gets its start point).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { bikesHash } from '../bikes.js';
  import { kmOn } from '../kmbook.js';
  import { PART } from '../care.js';
  import { SHEET, sheetsOf, shownSheets, sheetData, keepValues, orderSheetText, sheetText, bikeLine, tickPickup, pickupEntries } from '../sheets.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { ChevronLeft, Copy, Printer, Pencil } from '@lucide/svelte';

  let { bikeId, sheet = 'pass', from = null } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const today = localDay();

  const bike = $derived(($bikesQ ?? []).find((b) => b.id === bikeId) ?? null);
  const data = $derived(bike ? sheetData(bike, { visits: $visitsQ ?? [], tasks: $tasksQ ?? [], trips: $tripsQ ?? [], today }) : null);
  const kinds = $derived(sheet === 'all' ? (bike ? shownSheets(bike).map((s) => s.key) : []) : [sheet]);
  const km = $derived(typeof data?.view.km === 'number' ? data.view.km : null);
  const kmLine = $derived(km != null ? `${num(km)} km` : t('km not set'));
  const s = $derived(bike ? sheetsOf(bike) : null);

  /* ---------- where «back» and «Change values» go ---------- */
  const back = $derived(
    from === 'care'
      ? { href: bikesHash({ tab: 'care', bike: bikeId, open: true }), label: t('Care: {bike}', { bike: bike?.name ?? '' }) }
      : from === 'shop'
        ? { href: bikesHash({ tab: 'shop', bike: bikeId }), label: t('Workshop & receipts') }
        : { href: bikesHash({ tab: 'setup', bike: bikeId }), label: t('Folder {bike}', { bike: bike?.name ?? '' }) },
  );
  const EDIT = { pass: 'setup', plan: 'care', order: 'care', pickup: 'setup' };
  const editHref = $derived(sheet === 'all' ? null : EDIT[sheet] === 'setup' ? bikesHash({ tab: 'setup', bike: bikeId }) : bikesHash({ tab: 'care', bike: bikeId, open: true }));

  /* ---------- storing on the bike (plain data: Dexie cannot store a state proxy) ---------- */
  async function store(changes) {
    const stored = await db.bikes.get(bikeId);
    if (!stored) return;
    await db.bikes.update(bikeId, { sheets: { ...sheetsOf(stored), ...$state.snapshot(changes) } });
  }
  const toggleJob = (key, on) => store({ orderOff: on ? s.orderOff.filter((k) => k !== key) : [...new Set([...s.orderOff, key])] });
  let wishes = $state(null); // the text while typing; null: as stored
  const saveWishes = () => wishes != null && store({ wishes: wishes.trim() });
  const tick = (id, on) => store({ pickup: tickPickup($state.snapshot(data.pickup.pickup), id, on) });

  /* ---------- the text of a sheet (V3 a) ---------- */
  const STAND = () => t('As of {date}', { date: dateOf(today) });
  function textOf(kind) {
    if (kind === 'pass') return sheetText({ title: t('Bike pass'), sub: bikeLine(data.view), facts: [STAND(), kmLine], sections: data.pass.sections, foot: t('Pack Generator · all values are suggestions and can be changed') });
    if (kind === 'plan')
      return sheetText({
        title: t('Service plan'),
        sub: bikeLine(data.view),
        facts: [STAND(), kmLine],
        sections: [{ name: t('Parts'), rows: data.plan.rows.map((r) => ({ id: r.key, label: r.name, value: r.next || '–', hint: [r.interval, r.last && t('last {when}', { when: r.last }), r.since && t('since then {since}', { since: r.since })].filter(Boolean).join(' · ') })) }],
        foot: 'Pack Generator',
      });
    if (kind === 'order') return orderSheetText(data.picked, { bike: data.view, trip: data.trip, wishes: s.wishes ?? '', keep: keepValues(data.view) });
    return sheetText({ title: t('Pick-up check'), sub: `${data.view.name} · ${t('at the bike shop')}`, facts: [kmLine, t('{n} of {all} done', { n: data.pickup.ticked, all: data.pickup.total })], sections: data.pickup.sections, ticks: data.pickup.pickup.ticks, foot: t('Pack Generator · the ticks stay saved in the app') });
  }
  let said = $state('');
  let saidTimer;
  async function copy() {
    const text = kinds.map(textOf).join('\n\n----------\n\n');
    try {
      await navigator.clipboard.writeText(text);
      say(t('Copied. Paste it into an email or a message.'));
    } catch {
      say(t('Could not copy. Select the text of the sheet and copy it.'));
    }
  }
  function say(text) {
    clearTimeout(saidTimer);
    said = text;
    saidTimer = setTimeout(() => (said = ''), 6000);
  }
  $effect(() => () => clearTimeout(saidTimer));
  const pdf = () => window.print();

  /* ---------- the pick-up check: take the ticked work into care (V4 a), with Undo ---------- */
  let notice = $state(null); // { text, undo }
  const jobsTicked = $derived(data ? data.pickup.sections[0].rows.filter((r) => data.pickup.pickup.ticks?.[r.id]).length : 0);
  async function takeIntoCare() {
    const stored = await db.bikes.get(bikeId);
    if (!stored) return;
    const pickup = $state.snapshot(data.pickup.pickup);
    const kmNow = typeof stored.km === 'number' ? stored.km : kmOn($kmQ ?? [], bikeId, today);
    const { parts, logged, replaced, taskIds } = pickupEntries(stored, pickup, { today, km: kmNow, note: t('Pick-up check') });
    const prev = { parts: stored.parts ?? null, sheets: stored.sheets ?? null };
    const prevTasks = [];
    await db.transaction('rw', db.bikes, db.maintenance, async () => {
      await db.bikes.update(bikeId, { parts, sheets: { ...sheetsOf(stored), pickup: { ...pickup, applied: today } } });
      for (const id of taskIds) {
        const task = await db.maintenance.get(id);
        if (!task) continue;
        prevTasks.push({ id, status: task.status, statusDate: task.statusDate ?? null, by: task.by ?? null });
        await db.maintenance.update(id, { status: 'done', statusDate: today, by: 'shop' });
      }
    });
    const names = logged.map((k) => (PART[k] ? t(PART[k].name) : k));
    if (prevTasks.length) names.push(tn(prevTasks.length, '{n} repair', '{n} repairs'));
    let text = names.length ? t('Taken into care: {parts}.', { parts: names.join(', ') }) : t('Nothing ticked to take into care.');
    if (replaced.length) text += ` ${kmNow != null ? tn(replaced.length, 'Start point set for {n} part at {km} km.', 'Start points set for {n} parts at {km} km.', { km: num(kmNow) }) : t('Without km no start point yet: set it in Care.')}`;
    notice = { text, undo: { prev, prevTasks } };
  }
  async function undo() {
    const u = $state.snapshot(notice?.undo);
    notice = null;
    if (!u) return;
    await db.transaction('rw', db.bikes, db.maintenance, async () => {
      await db.bikes.update(bikeId, { parts: u.prev.parts ?? undefined, sheets: u.prev.sheets ?? undefined });
      for (const x of u.prevTasks) await db.maintenance.update(x.id, { status: x.status, statusDate: x.statusDate, by: x.by });
    });
  }
  const newPickup = () => store({ pickup: null });
  const keep = $derived(data ? keepValues(data.view) : []);
  const applied = $derived(s?.pickup?.applied ?? null);
</script>

{#snippet enter(href)}
  <a class="enter" {href}>{t('enter|value')}</a>
{/snippet}

{#snippet bar(r)}
  {#if r.fill != null}<span class="pbar {r.tone}" role="img" aria-label="{Math.round(r.fill * 100)} %"><i style:width="{Math.max(4, Math.round(r.fill * 100))}%"></i></span>{/if}
{/snippet}

{#snippet head(title, sub, facts)}
  <div class="phead">
    <div class="pt">
      <h2>{title}</h2>
      <p class="psub">{sub}</p>
    </div>
    <p class="facts">{#each facts as f, n (n)}<span>{f}</span>{/each}</p>
  </div>
{/snippet}

{#snippet pass()}
  {@render head(t('Bike pass'), bikeLine(data.view), [STAND(), kmLine])}
  <div class="cols2">
    {#each data.pass.sections as sec (sec.key)}
      <section class="psec" aria-label={sec.name}>
        <h3>{sec.name}</h3>
        <dl class="vals">
          {#each sec.rows as r (r.id)}
            <div class="vr"><dt>{r.label}</dt><dd>{#if r.value != null}{r.value}{:else}{@render enter(r.edit)}{/if}</dd></div>
          {/each}
        </dl>
      </section>
    {/each}
  </div>
  <p class="pfoot"><span>{t('Pack Generator · all values are suggestions and can be changed')}</span><span>{t('{n} of {all} values', { n: data.pass.filled, all: data.pass.total })}</span></p>
{/snippet}

{#snippet plan()}
  {@render head(t('Service plan'), `${bikeLine(data.view)} · ${t('Intervals are suggestions')}`, [STAND(), kmLine])}
  <table class="ptab">
    <thead><tr><th scope="col">{t('Part')}</th><th scope="col">{t('Interval')}</th><th scope="col">{t('Last work')}</th><th scope="col">{t('Since then')}</th><th scope="col">{t('Next time')}</th></tr></thead>
    <tbody>
      {#each data.plan.rows as r (r.key)}
        <tr class={r.state}>
          <th scope="row">{r.name}</th>
          <td data-l={t('Interval')}>{r.interval}</td>
          <td data-l={t('Last work')}>{#if r.last}{r.last}{:else}{@render enter(bikesHash({ tab: 'care', bike: bikeId, open: true }))}{/if}</td>
          <td data-l={t('Since then')}><span class="since"><b>{r.since || '–'}</b>{@render bar(r)}</span></td>
          <td data-l={t('Next time')} class:late={r.state === 'due' || r.state === 'overdue' || r.state === 'work'}>{r.next || '–'}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="note">{t('Orange = soon, red = now. The bars count from the start point of each part (Q1 «Gapless km»).')}</p>
  <p class="pfoot"><span>Pack Generator</span><span>{tn(data.plan.due, '{n} due', '{n} due')}</span></p>
{/snippet}

{#snippet order()}
  {@render head(t('Workshop order|sheet'), [data.view.name, data.trip ? t('before {trip}, {date}', { trip: data.trip.title, date: dateOf(data.trip.startDate) }) : '', data.order.shop].filter(Boolean).join(' · '), [STAND(), kmLine])}
  <section class="psec" aria-labelledby="ord-jobs">
    <h3 id="ord-jobs">{t('Please do')}</h3>
    {#if data.order.rows.length}
      <ul class="checks">
        {#each data.order.rows as r (r.key)}
          {@const on = !s.orderOff.includes(r.key)}
          <li class:off={!on}>
            <label class="ck"><input type="checkbox" checked={on} onchange={(e) => toggleJob(r.key, e.currentTarget.checked)} /><span class="cl"><b>{r.name}</b><small>{r.detail}</small></span></label>
            <span class="cv">{r.chf == null ? '–' : `CHF ${Math.round(r.chf)}`}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="quiet">{t('Nothing for the bike shop right now.')}</p>
    {/if}
  </section>
  <section class="psec" aria-labelledby="ord-wish">
    <h3 id="ord-wish">{t('Wishes')}</h3>
    <textarea class="inp wish" aria-labelledby="ord-wish" rows="2" placeholder={t('e.g. call before replacing anything over CHF 100')} value={wishes ?? s.wishes ?? ''} oninput={(e) => (wishes = e.currentTarget.value)} onblur={saveWishes}></textarea>
  </section>
  {#if keep.length}
    <section class="psec" aria-labelledby="ord-keep">
      <h3 id="ord-keep">{t('Please leave as it is')}</h3>
      <dl class="vals">{#each keep as r (r.key)}<div class="vr"><dt>{r.label}</dt><dd>{r.value}</dd></div>{/each}</dl>
    </section>
  {/if}
  <p class="pfoot"><span>{t('Estimate from my receipts')}: CHF {data.picked.reduce((a, r) => a + Math.round(r.chf ?? 0), 0)}</span><span>{tn(data.picked.length, '{n} job', '{n} jobs')}</span></p>
  <p class="next noprint"><a class="lnk" href={bikesHash({ tab: 'setup', bike: bikeId, sheet: 'pickup', from })}>{t('At the pick-up: Pick-up check')}</a></p>
{/snippet}

{#snippet pickup()}
  {@render head(t('Pick-up check'), `${data.view.name} · ${t('at the bike shop')}${data.pickup.pickup.date ? ` · ${t('order of {date}', { date: dateOf(data.pickup.pickup.date) })}` : ''}`, [kmLine, t('{n} of {all} done', { n: data.pickup.ticked, all: data.pickup.total })])}
  {#if applied}
    <div class="done noprint" role="status">
      <p>{t('Taken into care on {date}. The ticks of this check stay saved.', { date: dateOf(applied) })}</p>
      <button type="button" class="btn" onclick={newPickup}>{t('Start a new pick-up check')}</button>
    </div>
  {/if}
  {#each data.pickup.sections as sec (sec.key)}
    <section class="psec" aria-label={sec.name}>
      <h3>{sec.name}</h3>
      {#if !sec.rows.length}<p class="quiet">{t('No job on the order.')}</p>{/if}
      <ul class="checks">
        {#each sec.rows as r (r.id)}
          <li>
            <label class="ck"><input type="checkbox" checked={!!data.pickup.pickup.ticks?.[r.id]} disabled={!!applied} onchange={(e) => tick(r.id, e.currentTarget.checked)} /><span class="cl"><b>{r.label}</b>{#if r.hint}<small>{r.hint}</small>{/if}</span></label>
            <span class="cv">{#if r.value == null}{@render enter(r.edit)}{:else}{r.value}{/if}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
  <div class="sign"><span>{t('Date, picked up')}</span><span>{t('Remarks')}</span></div>
  {#if !applied}
    <div class="apply noprint">
      <button type="button" class="btn ink" disabled={!jobsTicked} onclick={takeIntoCare}>{t('Take the ticked work into care')}</button>
      <small>{t('Each ticked job becomes a care entry by the bike shop, today at {km}. A replaced part gets its start point.', { km: kmLine })}</small>
    </div>
  {/if}
  <p class="pfoot"><span>{t('Pack Generator · the ticks stay saved in the app')}</span></p>
{/snippet}

<div class="sheetview">
  {#if !$bikesQ}
    <p class="quiet">…</p>
  {:else if !bike || !data}
    <p class="card">{t('This bike is not here any more.')} <a href={bikesHash({ tab: 'setup' })}>{t('Bikes')}</a></p>
  {:else}
    <div class="bar noprint">
      <a class="backl" href={back.href}><ChevronLeft size={18} aria-hidden="true" />{back.label}</a>
      <span class="grow"></span>
      {#if editHref}<a class="btn" href={editHref}><Pencil size={16} aria-hidden="true" />{t('Change values')}</a>{/if}
      <button type="button" class="btn" onclick={copy}><Copy size={16} aria-hidden="true" />{t('Copy text')}</button>
      <button type="button" class="btn ink" onclick={pdf}><Printer size={16} aria-hidden="true" />{t('Share as PDF')}</button>
    </div>
    {#if said}<p class="said noprint" role="status">{said}</p>{/if}
    {#if !kinds.length}<p class="card">{t('All sheets are hidden. «Choose sheets» in the folder shows them again.')}</p>{/if}
    <div class="papers">
      {#each kinds as kind (kind)}
        <article class="paper" data-sheet={kind} aria-label={t(SHEET[kind].name)}>
          {#if kind === 'pass'}{@render pass()}{:else if kind === 'plan'}{@render plan()}{:else if kind === 'order'}{@render order()}{:else}{@render pickup()}{/if}
        </article>
      {/each}
    </div>
  {/if}
</div>

{#if notice}
  <p class="notice noprint" role="status"><span>{notice.text}</span>{#if notice.undo}<button type="button" class="undo" onclick={undo}>{t('Undo')}</button>{/if}</p>
{/if}

<style>
  .sheetview {
    max-width: 820px;
    margin: 0 auto;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
  }
  .bar .btn {
    min-height: 44px;
    text-decoration: none;
  }
  .grow {
    flex: 1;
  }
  .backl {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--accent);
    font: 600 var(--fs-body) var(--font-body);
  }
  .said {
    margin: 0 0 10px;
    color: var(--ok);
    font-size: var(--fs-small);
  }
  .papers {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .paper {
    padding: 40px 44px 28px;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .phead {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px 16px;
    padding-bottom: 14px;
    border-bottom: 3px solid var(--ink);
  }
  .pt {
    min-width: 0;
  }
  .phead h2 {
    margin: 0;
    font-size: var(--fs-title);
    line-height: 1.2;
  }
  .psub {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .facts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-variant-numeric: tabular-nums;
  }
  .cols2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 32px;
  }
  .psec {
    margin-top: 22px;
    break-inside: avoid;
  }
  .psec h3 {
    margin: 0 0 6px;
    color: var(--accent);
    font: 700 var(--fs-tiny) / 1.4 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .vals {
    margin: 0;
  }
  .vr {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 4px 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .vr dt {
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  /* v0.69.1 G001: on a small phone (320 px) «Sattelüberhöhung» does not fit half the sheet: label above value */
  @media (max-width: 359px) {
    .vr {
      grid-template-columns: minmax(0, 1fr);
      gap: 2px;
    }
  }
  .vr dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .enter {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin: -12px 0;
    color: var(--accent);
    font-weight: 500;
  }
  .ptab {
    width: 100%;
    margin-top: 16px;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .ptab th,
  .ptab td {
    padding: 8px 8px 8px 0;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
  }
  .ptab thead th {
    color: var(--ink-2);
    font-weight: 600;
  }
  .ptab tbody th {
    font-weight: 600;
  }
  .ptab td.late {
    color: var(--bad);
    font-weight: 600;
  }
  .since {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pbar {
    display: block;
    width: 90px;
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .pbar i {
    display: block;
    height: 100%;
    background: var(--ok);
  }
  .pbar.warn i {
    background: var(--warn);
  }
  .pbar.bad i {
    background: var(--bad);
  }
  .note {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .checks {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .checks li {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 4px 12px;
    border-bottom: 1px solid var(--line);
  }
  .checks li.off .cl {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .ck {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-height: 44px;
    padding: 8px 0;
    flex: 1;
    min-width: 0;
    cursor: pointer;
  }
  .ck input {
    flex: none;
    width: 20px;
    height: 20px;
    margin: 2px 0 0;
    accent-color: var(--accent);
  }
  .cl {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: break-word;
    hyphens: auto; /* long part names («Bremsbeläge») break by syllable on a 320 px phone, not mid-word */
  }
  .cl b {
    font-weight: 500;
  }
  .cl small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .cv {
    flex: none;
    max-width: 45%;
    padding: 8px 0;
    font-weight: 600;
    text-align: right;
    overflow-wrap: break-word;
  }
  .wish {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
  }
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sign {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    margin-top: 32px;
  }
  .sign span {
    padding-top: 8px;
    border-top: 1px solid var(--ink-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .apply {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    margin-top: 20px;
  }
  .apply .btn {
    min-height: 44px;
  }
  .apply small {
    flex: 1 1 260px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .done {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    margin-top: 14px;
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--accent-soft);
  }
  .done p {
    flex: 1 1 260px;
    margin: 0;
  }
  .done .btn {
    min-height: 44px;
  }
  .next {
    margin: 14px 0 0;
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--accent);
    font-weight: 600;
  }
  .pfoot {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 16px;
    margin: 24px 0 0;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .notice {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(16px + env(safe-area-inset-bottom));
    z-index: 30;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    width: max-content;
    max-width: min(560px, calc(100vw - 32px));
    margin: 0;
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
    box-shadow: 0 4px 16px var(--shadow);
  }
  .undo {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--paper);
    border-radius: 6px;
    background: none;
    color: var(--paper);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  @media (max-width: 719px) {
    .notice {
      bottom: calc(84px + env(safe-area-inset-bottom));
    }
    .paper {
      padding: 20px 16px 16px;
    }
    .cols2 {
      grid-template-columns: minmax(0, 1fr);
    }
    .bar .btn {
      flex: 1 1 auto;
    }
    .facts {
      align-items: flex-start;
    }
    /* the plan table as one block per part on a phone */
    .ptab thead {
      display: none;
    }
    .ptab,
    .ptab tbody,
    .ptab tr,
    .ptab th,
    .ptab td {
      display: block;
    }
    .ptab tr {
      padding: 8px 0;
      border-bottom: 1px solid var(--line);
    }
    .ptab th,
    .ptab td {
      padding: 2px 0;
      border: 0;
    }
    .ptab td::before {
      content: attr(data-l) ': ';
      color: var(--ink-3);
    }
  }
  /* «Share as PDF»: only the paper prints (the bars of the app never print, App.svelte). */
  @media print {
    :global(.bikes > .head),
    .noprint,
    .notice {
      display: none !important;
    }
    .sheetview {
      max-width: none;
    }
    .paper {
      padding: 0;
      border: 0;
      box-shadow: none;
      break-after: page;
    }
    .paper:last-child {
      break-after: auto;
    }
    .checks li.off {
      display: none;
    }
    .enter {
      display: inline-block;
      width: 120px;
      min-height: 0;
      margin: 0;
      border-bottom: 1px solid var(--ink-2);
      color: transparent;
    }
    .wish {
      border: 0;
      padding: 0;
      resize: none;
    }
  }
</style>
