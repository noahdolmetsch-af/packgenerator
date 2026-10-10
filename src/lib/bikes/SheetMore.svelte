<script>
  /**
   * v0.70.0 «Velo-Blätter Teil 2» (Noah W1–W7 a; mockups einfahr-plan, repair-kit, garantie-belege,
   * diebstahl): the four more sheets of a bike's folder, as a page of paper inside SheetView (which
   * holds the bar: back, «Change values», «Copy text», «Share as PDF»). The logic is in sheets2.js.
   * - Break-in plan: ticks stored with day and km; «Take the ticked into care» (care entries «by me»,
   *   with Undo); a due step reminds on Today (W3 a, can be switched off here).
   * - Repair kit: per kind of ride, «packed» ticks, «add» a missing item to the gear list (Undo),
   *   «On the packing list …» adds the chosen items to the next trip on this bike (each can be taken off).
   * - Warranty & receipts and Theft sheet: the values typed on the sheet («Change values» or «enter»
   *   opens the form); the photos of the Theft sheet go into the bike's photos (photo.js).
   * Everything is a suggestion: every tick, value and reminder can be changed or taken back.
   */
  import { tick as settle } from 'svelte';
  import { db } from '../db.js';
  import { bikesHash } from '../bikes.js';
  import { shrinkImage } from '../photo.js';
  import { PART } from '../care.js';
  import { sheetsOf, bikeLine, isShown, NEW_KM } from '../sheets.js';
  import { BREAKIN_MARKS, RIDE_TYPES, WARRANTY_PARTS, THEFT_FIELDS, THEFT_STEPS, tickBreakin, breakinEntries, tickKit, kitItem, kitToTrip, warrantyIcs, chf, dayMonth } from '../sheets2.js';
  import Seg from '../ui/Seg.svelte';
  import DateInput from '../ui/DateInput.svelte';
  import { t, tn, num, dateOf, isDe } from '../i18n.svelte.js';
  import { Camera, ReceiptText, Download } from '@lucide/svelte';

  let { kind, bike, data, more, items = [], today, kmNow = null, visits = [], editing = $bindable(false) } = $props();

  const s = $derived(sheetsOf(bike));
  const STAND = () => t('As of {date}', { date: dateOf(today) });
  const kmLine = $derived(typeof data.view.km === 'number' ? `${num(data.view.km)} km` : t('km not set'));

  /* ---------- storing on the bike (plain data: Dexie cannot store a state proxy) ---------- */
  async function store(changes) {
    const stored = await db.bikes.get(bike.id);
    if (!stored) return;
    await db.bikes.update(bike.id, { sheets: { ...sheetsOf(stored), ...$state.snapshot(changes) } });
  }

  /* ---------- the note at the bottom: «✓ … · Undo» ---------- */
  let notice = $state(null); // { text, undo }
  let noticeTimer;
  function say(text, undo = null) {
    clearTimeout(noticeTimer);
    notice = { text, undo };
    noticeTimer = setTimeout(() => (notice = null), 8000);
  }
  $effect(() => () => clearTimeout(noticeTimer));
  async function undo() {
    const u = notice?.undo;
    clearTimeout(noticeTimer);
    notice = null;
    if (u) await u();
  }

  /* ---------- Break-in plan (W2 a) ---------- */
  const plan = $derived(more.breakin);
  const tickB = (id, on) => store({ breakin: tickBreakin($state.snapshot(s.breakin ?? {}), id, on, { today, km: kmNow }) });
  async function breakinIntoCare() {
    const stored = await db.bikes.get(bike.id);
    if (!stored) return;
    const st = sheetsOf(stored);
    const { parts, logged, rows, breakin } = breakinEntries(stored, $state.snapshot(st.breakin ?? {}), { today });
    if (!rows.length) return;
    const prev = { parts: stored.parts ?? null, sheets: stored.sheets ?? null };
    await db.bikes.update(bike.id, { parts, sheets: { ...st, breakin } });
    const names = logged.map((k) => (PART[k] ? t(PART[k].name) : k));
    say(`${tn(rows.length, '{n} tick taken into care', '{n} ticks taken into care')}${names.length ? `: ${names.join(', ')}` : ''}.`, () => db.bikes.update(bike.id, { parts: prev.parts ?? undefined, sheets: prev.sheets ?? undefined }));
  }
  const remindBreakin = (on) => store({ breakin: { ...$state.snapshot(s.breakin ?? {}), remind: !!on } });
  const pos = (km) => `${Math.round((Math.max(0, Math.min(NEW_KM, km)) / NEW_KM) * 1000) / 10}%`;

  /* ---------- Repair kit (W4 a, W5 a) ---------- */
  const kit = $derived(more.kit);
  const setType = (type) => store({ kit: { ...$state.snapshot(s.kit ?? {}), type } });
  const tickK = (key, on) => store({ kit: tickKit($state.snapshot(s.kit ?? {}), kit.type, key, on) });
  async function addItem(row) {
    const all = await db.items.toArray();
    const item = kitItem(row.key, data.view, all, { de: isDe() });
    await db.items.put(item);
    say(t('Added to the gear list: {name} (still to weigh).', { name: isDe() ? item.nameDe : item.name }), () => db.items.delete(item.id));
  }
  let choosing = $state(null); // { [itemId]: true } while «On the packing list …» is open
  const openChoose = () => (choosing = Object.fromEntries(kit.toTrip.map((i) => [i.id, true])));
  const picked = $derived(choosing ? kit.toTrip.filter((i) => choosing[i.id]) : []);
  async function toTrip() {
    const trip = await db.trips.get(data.trip.id);
    if (!trip) return;
    const ids = picked.map((i) => i.id);
    const { entries, added } = kitToTrip(trip, ids, items);
    const prev = trip.entries ?? [];
    await db.trips.update(trip.id, { entries, updatedAt: new Date().toISOString() });
    choosing = null;
    say(tn(added.length, '{n} item put on the packing list of «{trip}».', '{n} items put on the packing list of «{trip}».', { trip: trip.title }), () => db.trips.update(trip.id, { entries: prev }));
  }

  /* ---------- Warranty & receipts and Theft sheet: the values typed on the sheet ---------- */
  const w = $derived(more.warranty);
  const th = $derived(more.theft);
  let draft = $state(null);
  $effect(() => {
    if (editing && !draft) draft = startDraft();
    if (!editing) draft = null;
  });
  function startDraft() {
    const ws = s.warranty ?? {};
    const ts = s.theft ?? {};
    return {
      bought: bike.bought ?? '',
      shop: ws.shop ?? '',
      price: ws.price ?? '',
      years: Object.fromEntries(WARRANTY_PARTS.map((p) => [p.key, ws.years?.[p.key] ?? p.years])),
      ...Object.fromEntries(THEFT_FIELDS.map((f) => [f.key, ts[f.key] ?? ''])),
    };
  }
  const numOrNull = (v) => {
    const n = Number(String(v ?? '').replace(/['’\s]/g, '').replace(',', '.'));
    return String(v ?? '').trim() === '' || !Number.isFinite(n) ? null : n;
  };
  async function saveDraft(e) {
    e?.preventDefault();
    const d = $state.snapshot(draft);
    const stored = await db.bikes.get(bike.id);
    if (!stored) return;
    const st = sheetsOf(stored);
    if (kind === 'warranty') {
      const years = Object.fromEntries(WARRANTY_PARTS.map((p) => [p.key, Math.max(0, Math.min(30, Math.round(numOrNull(d.years[p.key]) ?? p.years)))]));
      await db.bikes.update(bike.id, { bought: d.bought || null, sheets: { ...st, warranty: { ...(st.warranty ?? {}), shop: d.shop.trim(), price: numOrNull(d.price), years } } });
    } else {
      const theft = Object.fromEntries(THEFT_FIELDS.map((f) => [f.key, f.chf ? numOrNull(d[f.key]) : String(d[f.key] ?? '').trim()]));
      await db.bikes.update(bike.id, { sheets: { ...st, theft: { ...(st.theft ?? {}), ...theft } } });
    }
    editing = false;
    say(t('Saved.'));
  }
  async function enterField(key) {
    editing = true;
    await settle();
    document.getElementById(`sf-${key}`)?.focus();
  }
  const setW = (field, on) => store({ warranty: { ...$state.snapshot(s.warranty ?? {}), [field]: !!on } });
  function downloadIcs() {
    const text = warrantyIcs(bike, [...w.rows, ...w.replaced]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
    a.download = `garantie-${bike.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const breakinShown = $derived(isShown(bike, 'breakin', { today, visits }));

  /* ---------- Theft sheet: a photo per tile (into the bike's photos) ---------- */
  let photoMsg = $state('');
  async function addPhoto(tile, event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    photoMsg = '';
    try {
      const data = await shrinkImage(file);
      const id = `photo-${Date.now().toString(36)}-${tile.key}`;
      const mine = await db.photos.where('bikeId').equals(bike.id).count();
      await db.photos.put({ id, bikeId: bike.id, name: tile.label, tripId: null, main: !mine && !bike.photo, data, theft: tile.key, addedAt: new Date().toISOString() });
      say(t('Photo saved: {name}. It is also in the photos of the bike.', { name: tile.label }), () => db.photos.delete(id));
    } catch (err) {
      photoMsg = err.message || t('This photo could not be read.');
    }
  }
</script>

{#snippet head(title, sub, facts)}
  <div class="phead">
    <div class="pt">
      <h2>{title}</h2>
      <p class="psub">{sub}</p>
    </div>
    <p class="facts">{#each facts as f, n (n)}<span>{f}</span>{/each}</p>
  </div>
{/snippet}

{#snippet enter(href)}
  <a class="enter" {href}>{t('enter|value')}</a>
{/snippet}

{#snippet enterHere(key)}
  <button type="button" class="enter eb" onclick={() => enterField(key)}>{t('enter|value')}</button>
{/snippet}

{#snippet badge(b)}
  <span class="bdg {b.tone}">{b.text}</span>
{/snippet}

{#snippet vals(rows)}
  <dl class="vals">
    {#each rows as r (r.id)}
      <div class="vr">
        <dt>{r.label}</dt>
        <dd>
          {#if r.value != null}{r.value}{#if r.href} · <a class="inl" href={r.href.href}>{r.href.label}</a>{/if}
          {:else if r.field}{@render enterHere(r.field)}
          {:else}{@render enter(r.edit)}{/if}
        </dd>
      </div>
    {/each}
  </dl>
{/snippet}

{#snippet breakin()}
  {@render head(t('Break-in plan'), [bikeLine(data.view), plan.bought ? t('new since {date}', { date: dateOf(plan.bought) }) : '', t('Suggestions, everything can be deselected')].filter(Boolean).join(' · '), [STAND(), kmLine, t('{n} of {all} done', { n: plan.ticked, all: plan.total })])}
  <div class="kmbar" role="img" aria-label={t('{km} of {all} km until the first service', { km: num(plan.km ?? 0), all: num(NEW_KM) })}>
    <span class="track"></span>
    <span class="fill" style:width={pos(plan.km ?? 0)}></span>
    {#each BREAKIN_MARKS as m (m.km)}
      <span class="mk" class:on={(plan.km ?? 0) >= m.km} style:left={pos(m.km)}><i></i><small>{t(m.label)}</small></span>
    {/each}
    {#if plan.km != null}<span class="now" style:left={pos(plan.km)}><small>{t('today {km} km', { km: num(plan.km) })}</small><i></i></span>{/if}
  </div>
  {#each plan.steps as st (st.key)}
    <section class="psec" aria-labelledby="bi-{st.key}">
      <h3 id="bi-{st.key}">{st.n} · {st.name} {@render badge(st.badge)}</h3>
      <ul class="checks">
        {#each st.rows as r (r.id)}
          <li>
            <label class="ck"><input type="checkbox" checked={!!r.tick} onchange={(e) => tickB(r.id, e.currentTarget.checked)} /><span class="cl"><b>{r.label}</b>{#if r.hint}<small>{r.hint}</small>{/if}{#if r.applied}<small class="ok">{t('in care since {date}', { date: dayMonth(r.applied) })}</small>{/if}</span></label>
            <span class="cv">{#if r.link}<a class="inl" href={r.link.href}>{r.link.label}</a>{:else if r.value == null}{@render enter(r.edit)}{:else}{r.value}{/if}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
  <div class="apply noprint">
    <button type="button" class="btn ink" disabled={!plan.toApply} onclick={breakinIntoCare}>{t('Take the ticked into care')}</button>
    <small>{t('Each tick becomes a care entry «by me», with the day and the km from the ride ledger. What is due later reminds you on Today.')}</small>
  </div>
  <label class="opt noprint"><input type="checkbox" checked={plan.remind} onchange={(e) => remindBreakin(e.currentTarget.checked)} /><span>{t('Remind me on Today when a step is due')}</span></label>
  <p class="pfoot"><span>{t('Pack Generator · due is what comes first: km or date')}</span><span>{t('After the first service the sheet goes away')}</span></p>
{/snippet}

{#snippet kitS()}
  {@render head(t('Repair kit'), `${data.view.name} · ${t(RIDE_TYPES.find((r) => r.key === kit.type).name)} · ${t('matching the parts of this bike, all suggestions')}`, [STAND(), t('{n} of {all} packed', { n: kit.packed, all: kit.total }), `${num(kit.g)} g`])}
  <div class="seg noprint"><Seg full={false} label={t('Kind of ride')} value={kit.type} onchange={setType} options={RIDE_TYPES.map((r) => ({ key: r.key, name: t(r.name) }))} /></div>
  {#each kit.sections as sec (sec.key)}
    <section class="psec" aria-labelledby="kit-{sec.key}">
      <h3 id="kit-{sec.key}">{sec.name}</h3>
      <ul class="checks">
        {#each sec.rows as r (r.key)}
          <li data-row={r.key}>
            <label class="ck"><input type="checkbox" checked={r.packed} disabled={r.missing} aria-label={t('{item}: packed', { item: r.label })} onchange={(e) => tickK(r.key, e.currentTarget.checked)} /><span class="cl"><b>{r.label}</b><small>{[r.hint, r.missing ? (r.wish ? t('on the wish list: {item}', { item: r.wish }) : t('missing in the gear list')) : t('from the gear list: {items}', { items: r.items.map((i) => i.name).join(', ') })].filter(Boolean).join(' · ')}</small></span></label>
            <span class="cv">{#if r.missing}{#if !r.wish}<button type="button" class="inl lb noprint" onclick={() => addItem(r)}>{t('add|item')}</button>{/if}{:else if r.g != null}{num(r.g)} g{:else}<small class="q">{t('not weighed')}</small>{/if}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
  <p class="total"><span>{t('Total packed')}</span><b>{num(kit.g)} g</b></p>
  <div class="apply noprint">
    {#if data.trip}
      <button type="button" class="btn ink" aria-expanded={!!choosing} onclick={() => (choosing ? (choosing = null) : openChoose())}>{t('On the packing list «{trip}» …', { trip: data.trip.title })}</button>
      <small>{t('Puts the items that are not on it yet on the packing list of the next trip with this bike. You can take each one off again.')}</small>
    {:else}
      <button type="button" class="btn" disabled>{t('On the packing list …')}</button>
      <small>{t('No trip planned with this bike yet. Plan one, then the kit can go on its packing list.')}</small>
    {/if}
  </div>
  {#if choosing}
    <fieldset class="choose noprint">
      <legend>{t('On the packing list of «{trip}»', { trip: data.trip.title })}</legend>
      {#if kit.toTrip.length}
        {#each kit.toTrip as i (i.id)}
          <label class="pk"><input type="checkbox" checked={!!choosing[i.id]} onchange={(e) => (choosing[i.id] = e.currentTarget.checked)} />{i.name}</label>
        {/each}
        <div class="row2">
          <button type="button" class="btn ink" disabled={!picked.length} onclick={toTrip}>{tn(picked.length, 'Put {n} item on the packing list', 'Put {n} items on the packing list')}</button>
          <button type="button" class="btn" onclick={() => (choosing = null)}>{t('Cancel')}</button>
        </div>
      {:else}
        <p class="quiet">{t('Everything of the kit is already on this packing list.')}</p>
      {/if}
    </fieldset>
  {/if}
  <p class="pfoot"><span>{t('Pack Generator · sizes from the Bike pass and the parts')}</span><span>{t('Ticks are saved per kind of ride')}</span></p>
{/snippet}

{#snippet warrantyS()}
  {@render head(t('Warranty & receipts'), [data.view.name, w.bought ? t('bought on {date}', { date: dateOf(w.bought) }) : '', w.shop ? t('at {shop}', { shop: w.shop }) : ''].filter(Boolean).join(' · '), [STAND(), w.price != null ? t('Purchase price {chf}', { chf: chf(w.price) }) : ''].filter(Boolean))}
  {#if editing && draft}
    <form class="edit noprint" onsubmit={saveDraft}>
      <label class="fld"><span class="lbl">{t('Purchase date')}</span><DateInput id="sf-bought" bind:value={draft.bought} max={today} /></label>
      <label class="fld"><span class="lbl">{t('Bought at')}</span><input id="sf-shop" class="inp" bind:value={draft.shop} /></label>
      <label class="fld"><span class="lbl">{t('Purchase price in CHF')}</span><input id="sf-price" class="inp" inputmode="decimal" bind:value={draft.price} /></label>
      {#each WARRANTY_PARTS as p (p.key)}
        <label class="fld"><span class="lbl">{t('Warranty {part} in years', { part: t(p.name) })}</span><input id="sf-y-{p.key}" class="inp" type="number" min="0" max="30" bind:value={draft.years[p.key]} /></label>
      {/each}
      <div class="row2"><button type="submit" class="btn ink">{t('Save')}</button><button type="button" class="btn" onclick={() => (editing = false)}>{t('Cancel')}</button></div>
    </form>
  {/if}
  <section class="psec" aria-labelledby="w-parts">
    <h3 id="w-parts">{t('Warranty per part')}</h3>
    {#if w.rows.length || w.replaced.length}
      <table class="wtab">
        <thead><tr><th scope="col">{t('Part')}</th><th scope="col">{t('Warranty')}</th><th scope="col">{t('Until')}</th></tr></thead>
        <tbody>
          {#each [...w.rows, ...w.replaced] as r (r.key)}
            <tr>
              <th scope="row">{r.label}</th>
              <td data-l={t('Warranty')}>{r.yearsText}</td>
              <td data-l={t('Until')}>
                <span class="until">{dateOf(r.end)}{#if r.badge} {@render badge({ text: r.badge, tone: r.tone })}{/if}</span>
                <span class="pbar {r.tone}" role="img" aria-label={t('{n} % of the warranty left', { n: Math.round(r.fill * 100) })}><i style:width="{Math.max(3, Math.round(r.fill * 100))}%"></i></span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="quiet">{t('Without a purchase date the app cannot count the warranty.')} {@render enterHere('bought')}</p>
    {/if}
  </section>
  {#if breakinShown && !more.breakin.done}
    <p class="cond"><b>{t('Condition:')}</b> {t('Many makers want a first inspection between 300 and 500 km, else the frame warranty can lapse. It is step 4 of the Break-in plan.')}</p>
  {/if}
  <section class="psec noprint" aria-labelledby="w-rem">
    <h3 id="w-rem">{t('Remind')}</h3>
    <ul class="checks">
      <li><label class="ck"><input type="checkbox" checked={w.remind} onchange={(e) => setW('remind', e.currentTarget.checked)} /><span class="cl"><b>{t('30 days before a warranty ends')}</b><small>{t('on Today, with a link to this sheet')}</small></span></label></li>
      {#if breakinShown}<li><label class="ck"><input type="checkbox" checked={more.breakin.remind} onchange={(e) => remindBreakin(e.currentTarget.checked)} /><span class="cl"><b>{t('First inspection at 300 km')}</b><small>{t('counts with the ride ledger')}</small></span></label></li>{/if}
      <li>
        <label class="ck"><input type="checkbox" checked={w.calendar} onchange={(e) => setW('calendar', e.currentTarget.checked)} /><span class="cl"><b>{t('Also in the calendar')}</b><small>{t('as a date in your calendar')}</small></span></label>
        {#if w.calendar}<span class="cv"><button type="button" class="inl lb" disabled={!w.rows.length && !w.replaced.length} onclick={downloadIcs}><Download size={16} aria-hidden="true" />{t('Calendar file')}</button></span>{/if}
      </li>
    </ul>
  </section>
  <section class="psec" aria-labelledby="w-rec">
    <h3 id="w-rec">{t('Receipts')} <span class="bdg n">{t('from Workshop & receipts')}</span></h3>
    {#if w.receipts.length}
      <ul class="recs">
        {#each w.receipts as r (r.id)}
          <li>
            <ReceiptText size={18} aria-hidden="true" />
            <span class="cl"><b>{r.label}</b><small>{[dateOf(r.date), r.shop, r.photo ? t('with photo') : t('no photo yet')].filter(Boolean).join(' · ')}</small></span>
            <span class="cv">{#if !r.photo}<a class="inl noprint" href={r.href}>{t('Photo')}</a>{:else if r.chf != null}{chf(r.chf)}{/if}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="quiet">{t('No receipt for this bike yet.')}</p>
    {/if}
    <p class="noprint"><a class="lnk" href={bikesHash({ tab: 'shop', bike: bike.id })}>{t('All receipts in Workshop & receipts')}</a></p>
  </section>
  <p class="pfoot"><span>{t('Pack Generator · the years per part are suggestions and can be changed')}</span><span>{t('{n} of {all} receipts with a photo', { n: w.withPhoto, all: w.receipts.length })}</span></p>
{/snippet}

{#snippet theftS()}
  {@render head(t('Theft sheet'), `${data.view.name} · ${t('for the police and the insurance')}`, [STAND(), t('Frame number only on this device')])}
  {#if editing && draft}
    <form class="edit noprint" onsubmit={saveDraft}>
      {#each THEFT_FIELDS as f (f.key)}
        <label class="fld"><span class="lbl">{t(f.label)}{f.chf ? ' (CHF)' : ''}</span><input id="sf-{f.key}" class="inp" inputmode={f.chf ? 'decimal' : undefined} bind:value={draft[f.key]} /></label>
      {/each}
      <div class="row2"><button type="submit" class="btn ink">{t('Save')}</button><button type="button" class="btn" onclick={() => (editing = false)}>{t('Cancel')}</button></div>
    </form>
  {/if}
  <div class="cols2">
    <section class="psec" aria-labelledby="th-id"><h3 id="th-id">{t('How to know it')}</h3>{@render vals(th.id)}</section>
    <section class="psec" aria-labelledby="th-mk"><h3 id="th-mk">{t('Special marks')}</h3>{@render vals(th.marks)}</section>
  </div>
  <section class="psec" aria-labelledby="th-ph">
    <h3 id="th-ph">{t('Photos')} {#if th.photosMissing}{@render badge({ text: tn(th.photosMissing, '{n} missing', '{n} missing'), tone: 'warn' })}{/if}</h3>
    <ul class="tiles">
      {#each th.photos as p (p.key)}
        <li class:empty={!p.src}>
          {#if p.src}
            <img src={p.src} alt={p.label} />
            <span class="cap">{p.label}</span>
          {:else}
            <label class="addph"><Camera size={20} aria-hidden="true" /><span>{p.label}</span><small class="noprint">{t('Add photo')}</small><input type="file" accept="image/*" onchange={(e) => addPhoto(p, e)} hidden /></label>
          {/if}
        </li>
      {/each}
    </ul>
    {#if photoMsg}<p class="err" role="alert">{photoMsg}</p>{/if}
  </section>
  <section class="psec" aria-labelledby="th-ins"><h3 id="th-ins">{t('Insurance')}</h3>{@render vals(th.insurance)}</section>
  <section class="psec" aria-labelledby="th-st">
    <h3 id="th-st">{t('When it is stolen')}</h3>
    <ol class="steps">
      {#each THEFT_STEPS as x, i (x.key)}
        <li><span class="nr" aria-hidden="true">{i + 1}</span><span class="cl"><span><b>{t(x.title)}:</b> {t(x.text)}</span>{#if x.hint}<small>{t(x.hint)}</small>{/if}</span></li>
      {/each}
    </ol>
  </section>
  <p class="pfoot"><span>{t('Pack Generator · only you see this sheet until you share it')}</span></p>
{/snippet}

{#if kind === 'breakin'}{@render breakin()}{:else if kind === 'kit'}{@render kitS()}{:else if kind === 'warranty'}{@render warrantyS()}{:else}{@render theftS()}{/if}

{#if notice}
  <p class="notice noprint" role="status"><span>✓ {notice.text}</span>{#if notice.undo}<button type="button" class="undo" onclick={undo}>{t('Undo')}</button>{/if}</p>
{/if}

<style>
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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    margin: 0 0 6px;
    color: var(--accent);
    font: 700 var(--fs-tiny) / 1.4 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .bdg {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
    letter-spacing: 0;
    text-transform: none;
  }
  .bdg.ok {
    background: var(--accent-soft);
    color: var(--ok);
  }
  .bdg.warn {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .vals {
    margin: 0;
  }
  .vr {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 4px 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .vr dt {
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .vr dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .enter,
  .inl {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    margin: -12px 0;
    color: var(--accent);
    font-weight: 500;
  }
  .eb,
  .lb {
    padding: 0;
    border: 0;
    background: none;
    font: 500 var(--fs-body) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .lb:disabled {
    color: var(--ink-3);
    cursor: default;
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
  .ck input,
  .opt input,
  .pk input {
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
  }
  .cl b {
    font-weight: 500;
  }
  .cl small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .cl small.ok {
    color: var(--ok);
  }
  .cv {
    flex: none;
    max-width: 45%;
    padding: 8px 0;
    font-weight: 600;
    text-align: right;
    overflow-wrap: break-word;
  }
  .q {
    color: var(--ink-3);
    font-weight: 400;
  }
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .kmbar {
    position: relative;
    height: 74px;
    margin: 18px 14px 4px;
  }
  .track,
  .fill {
    position: absolute;
    top: 34px;
    left: 0;
    height: 6px;
    border-radius: 3px;
  }
  .track {
    right: 0;
    background: var(--paper-2);
  }
  .fill {
    background: var(--accent);
  }
  .mk,
  .now {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateX(-50%);
  }
  .mk {
    top: 26px;
  }
  .mk i {
    width: 18px;
    height: 18px;
    box-sizing: border-box;
    border: 2px solid var(--ink-3);
    border-radius: 50%;
    background: var(--paper);
  }
  .mk.on i {
    border-color: var(--accent);
    background: var(--accent);
  }
  .mk small {
    margin-top: 4px;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    white-space: nowrap;
  }
  .now {
    top: 0;
  }
  .now small {
    color: var(--ink);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    white-space: nowrap;
  }
  .now i {
    width: 18px;
    height: 18px;
    margin-top: 10px;
    border: 2px solid var(--paper);
    border-radius: 50%;
    background: var(--warn);
  }
  .apply {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    margin-top: 20px;
  }
  .apply .btn,
  .row2 .btn {
    min-height: 44px;
  }
  .apply small {
    flex: 1 1 260px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .opt,
  .pk {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    margin-top: 6px;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .seg {
    margin-top: 16px;
  }
  .total {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 14px 0 0;
    font-weight: 600;
  }
  .choose {
    display: grid;
    gap: 2px;
    margin: 12px 0 0;
    padding: 8px 14px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  .choose legend {
    padding: 0 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .row2 {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .edit {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 16px;
    margin-top: 16px;
    padding: 14px;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .edit .row2 {
    grid-column: 1 / -1;
  }
  .fld {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .wtab {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .wtab th,
  .wtab td {
    padding: 8px 8px 8px 0;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
  }
  .wtab thead th {
    color: var(--ink-2);
    font-weight: 600;
  }
  .until {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
  }
  .pbar {
    display: block;
    width: 140px;
    max-width: 100%;
    height: 6px;
    margin-top: 6px;
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
  .pbar.n i {
    background: var(--ink-3);
  }
  .cond {
    margin: 16px 0 0;
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--warn-soft);
    font-size: var(--fs-small);
  }
  .recs {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .recs li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .recs li :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-2);
  }
  .recs .cl {
    flex: 1;
  }
  .recs .cv {
    padding: 0;
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--accent);
    font-weight: 600;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .tiles li {
    position: relative;
    aspect-ratio: 4 / 3;
    border-radius: 6px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .tiles li.empty {
    border: 1px dashed var(--line-strong);
    background: var(--paper);
  }
  .tiles img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cap {
    position: absolute;
    left: 6px;
    bottom: 6px;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .addph {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    height: 100%;
    padding: 6px;
    box-sizing: border-box;
    color: var(--accent);
    font-size: var(--fs-small);
    font-weight: 600;
    text-align: center;
    cursor: pointer;
  }
  .addph small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 500;
    text-decoration: underline;
  }
  .err {
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .steps li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .steps b {
    font-weight: 700;
  }
  .nr {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--ink);
    color: var(--paper);
    font: 700 var(--fs-tiny) / 1 var(--font-body);
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
    .cols2,
    .edit {
      grid-template-columns: minmax(0, 1fr);
    }
    .facts {
      align-items: flex-start;
    }
    .tiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .kmbar {
      margin: 18px 10px 4px;
    }
    .mk small {
      display: none;
    }
    .wtab thead {
      display: none;
    }
    .wtab,
    .wtab tbody,
    .wtab tr,
    .wtab th,
    .wtab td {
      display: block;
    }
    .wtab tr {
      padding: 8px 0;
      border-bottom: 1px solid var(--line);
    }
    .wtab th,
    .wtab td {
      padding: 2px 0;
      border: 0;
    }
    .wtab td::before {
      content: attr(data-l) ': ';
      color: var(--ink-3);
    }
  }
  /* «Share as PDF»: only the paper prints; an empty value is a line to write on. */
  @media print {
    .noprint,
    .notice {
      display: none !important;
    }
    .enter {
      display: inline-block;
      width: 120px;
      min-height: 0;
      margin: 0;
      border: 0;
      border-bottom: 1px solid var(--ink-2);
      color: transparent;
      text-decoration: none;
    }
    .tiles li.empty {
      border-style: solid;
    }
  }
</style>
