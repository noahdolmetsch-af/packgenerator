<script>
  /**
   * v0.69.0 «Velo-Blätter» (Noah V3 a, V4 a, V5 a; mockups doc-velo-pass, doc-service-plan,
   * doc-abhol-check): one sheet of a bike's folder as a page of paper, or the whole folder (sheet
   * 'all'). Above it: back to where it was opened, «Change values» (where the values live), «Copy
   * text» and «Share as PDF» (the print dialog of the device: print or save as PDF; only the paper
   * prints). A missing value is an empty line «enter» that links to where it is edited.
   * Workshop order: every job can be taken off, wishes typed in. Pick-up check: every tick is stored
   * at once; «Take into care» records the ticked work (a replaced part gets its start point).
   * v0.70.0 «Velo-Blätter Teil 2»: the four more sheets (Break-in plan, Repair kit, Warranty &
   * receipts, Theft sheet) are drawn by SheetMore.svelte; their values typed on the sheet open with
   * «Change values» (Warranty, Theft).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { bikesHash, withBack } from '../bikes.js';
  import { kmOn } from '../kmbook.js';
  import { PART } from '../care.js';
  import { SHEET, sheetsOf, shownSheets, sheetData, keepValues, sheetText, bikeLine, tickPickup, pickupEntries } from '../sheets.js';
  import { moreData, breakinText, kitText, warrantyText, theftText } from '../sheets2.js';
  import { bikePhotos } from '../photo.js';
  import { markSeen } from './seen.js';
  import SheetMore from './SheetMore.svelte';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { Copy, Printer, Pencil, Share2, Check } from '@lucide/svelte';
  import VeloHead from './VeloHead.svelte';
  import SheetFolder from './SheetFolder.svelte';
  import ValueCard from './ValueCard.svelte';
  import { FIT_KEY, fitValue, setFit, readValue } from '../bikespecs.js';
  import { pickupChecked, againValues, lastReplacement } from '../abholwerte.js';
  import { pressures, chainState } from '../messen.js'; // «Werte messen» W4–W6
  import MessenDialog from './MessenDialog.svelte';
  import PressureHint from './PressureHint.svelte';
  import { signFor } from '../daumen.js'; // FE13: a sign next to the colour
  import '../ui/fe-seiten.css';
  // «Bausteine» (Noah 15.10.2026): the Bike pass and the Workshop order are made of blocks
  import { BLOCKS_KEY, globalOf, fullLayout, layoutFor, blockDef } from '../sheetblocks.js';
  import { blockView, ownView, orderMessage, keepRest, PASS_SECTION, pickupSuggestion } from '../sheetblockdata.js';
  import { saveOwnContent, saveBlockData, restore, lastSheet } from './blocks/blockstore.js';
  import { bikeProfile } from '../workshop.js';
  import { fieldsOf, FIELDS_KEY } from '../valuefields.js';
  import { tripStats } from '../trips.js';
  import BlockArrange from './blocks/BlockArrange.svelte';
  import BlocksPage from './blocks/BlocksPage.svelte';
  import { LayoutList, X as XIcon } from '@lucide/svelte';

  let { bikeId, sheet = 'pass', from = null } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const photosQ = liveQuery(() => db.photos.where('bikeId').equals(bikeId).toArray());
  const today = localDay();

  const bike = $derived(($bikesQ ?? []).find((b) => b.id === bikeId) ?? null);
  const data = $derived(bike ? sheetData(bike, { visits: $visitsQ ?? [], tasks: $tasksQ ?? [], trips: $tripsQ ?? [], today }) : null);
  const more = $derived(bike && data ? moreData(bike, data, { visits: $visitsQ ?? [], items: $itemsQ ?? [], photos: $photosQ ?? [], gallery: bikePhotos(bike, $photosQ ?? []), today }) : null);
  const kinds = $derived(sheet === 'blocks' ? [] : sheet === 'all' ? (bike ? shownSheets(bike, { today, visits: $visitsQ ?? [] }).map((s) => s.key) : []) : [sheet]);
  const MORE = ['breakin', 'kit', 'warranty', 'theft'];
  // the km of a tick in the Break-in plan: the counter, else the ride ledger on that day
  const kmNow = $derived(typeof bike?.km === 'number' ? bike.km : kmOn($kmQ ?? [], bikeId, today));
  let editing = $state(false); // Warranty and Theft sheet: the form of the values typed on the sheet
  $effect(() => {
    for (const k of kinds) markSeen(k);
  });
  const km = $derived(typeof data?.view.km === 'number' ? data.view.km : null);
  const kmLine = $derived(km != null ? `${num(km)} km` : t('km not set'));
  const s = $derived(bike ? sheetsOf(bike) : null);

  /* ---------- where «back» and «Change values» go ---------- */
  const back = $derived(
    from === 'care'
      ? { href: bikesHash({ tab: 'care', bike: bikeId, open: true }), label: t('Care: {bike}', { bike: bike?.name ?? '' }) }
      : from === 'shop'
        ? { href: bikesHash({ tab: 'shop', bike: bikeId }), label: t('Workshop & receipts') }
        : { href: bikesHash({ tab: 'setup', bike: bikeId, open: true }), label: t('Folder {bike}', { bike: bike?.name ?? '' }) },
  );
  // Design-Refresh P7 (V5): «‹ Velo › Gravel Blau › Mappe» (or Care / Workshop when opened there).
  const crumbs = $derived([
    { label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bikeId }) },
    from === 'care' ? { label: t('Care|tab'), href: back.href } : from === 'shop' ? { label: t('Workshop & receipts'), href: back.href } : { label: bike?.name ?? '', href: back.href },
    ...(sheet === 'all' ? [] : [{ label: t('Folder|sheets'), href: bikesHash({ tab: 'setup', bike: bikeId, sheet: 'all', from }) }]),
  ]);
  let choosing = $state(false);
  const EDIT = { pass: 'equipment', plan: 'care', order: 'care', pickup: 'equipment', breakin: 'setup', kit: 'gear', warranty: 'form', theft: 'form' };
  // Bugfix Dateneingabe: the values of the Bike pass and the Pick-up check are typed on «Enter values»
  // (D2, every value of the bike on one page), not on the top of the bike page far from them.
  const editHref = $derived(sheet === 'all' || EDIT[sheet] === 'form' ? null : EDIT[sheet] === 'gear' ? '#/gear' : EDIT[sheet] === 'equipment' ? bikesHash({ tab: 'compare', view: 'enter', bike: bikeId }) : EDIT[sheet] === 'setup' ? bikesHash({ tab: 'setup', bike: bikeId, open: true }) : bikesHash({ tab: 'care', bike: bikeId, open: true }));

  /* ---------- storing on the bike (plain data: Dexie cannot store a state proxy) ---------- */
  async function store(changes) {
    const stored = await db.bikes.get(bikeId);
    if (!stored) return;
    await db.bikes.update(bikeId, { sheets: { ...sheetsOf(stored), ...$state.snapshot(changes) } });
  }
  const toggleJob = (key, on) => store({ orderOff: on ? s.orderOff.filter((k) => k !== key) : [...new Set([...s.orderOff, key])] });
  let wishes = $state(null); // the text while typing; null: as stored
  const saveWishes = () => wishes != null && store({ wishes: wishes.trim() });
  // the stored check, read fresh: two quick ticks must not overwrite each other
  const tick = async (id, on) => {
    const stored = await db.bikes.get(bikeId);
    const base = sheetsOf(stored).pickup ?? $state.snapshot(data.pickup.pickup);
    await store({ pickup: tickPickup(base, id, on) });
  };

  /* ---------- «Bugfix Dateneingabe» D1a: the values of the Pick-up check typed right on the sheet ---------- */
  let openVal = $state(null); // the id of the open value card ('val:<fit key>')
  const valRow = (r) => {
    const k = r.id.slice(4);
    const f = FIT_KEY[k];
    return { id: r.id, label: f.name, unit: f.unit ?? '', num: !!f.num, value: bike ? fitValue(bike, k) : null };
  };
  const valRows = $derived(data ? data.pickup.sections.find((x) => x.key === 'values').rows.map(valRow) : []);
  // the value before the pick-up: kept on the check the first time a value is changed there
  const beforeOf = (r) => {
    const b = data?.pickup.pickup.before ?? {};
    return r.id in b ? b[r.id] : r.value;
  };
  const valDone = $derived(valRows.filter((r) => data.pickup.pickup.ticks?.[r.id]).length);
  function nextVal(id) {
    const n = valRows.findIndex((r) => r.id === id);
    openVal = valRows.slice(n + 1).find((r) => !data.pickup.pickup.ticks?.[r.id])?.id ?? null;
  }
  async function saveVal(r, input) {
    const stored = await db.bikes.get(bikeId);
    if (!stored) return;
    const k = r.id.slice(4);
    const v = input == null || input === '' ? null : typeof input === 'string' ? readValue(input, r.num) : input;
    const pickup = $state.snapshot(data.pickup.pickup);
    const before = { ...(pickup.before ?? {}) };
    if (!(r.id in before)) before[r.id] = fitValue(stored, k);
    const changes = String(v ?? '') === String(fitValue(stored, k) ?? '') ? {} : setFit(stored, k, v);
    await db.bikes.update(bikeId, { ...changes, sheets: { ...sheetsOf(stored), pickup: { ...tickPickup(pickup, r.id, true), before, checked: today } } });
    nextVal(r.id);
  }
  const skipVal = async (r) => {
    await tick(r.id, true);
    nextVal(r.id);
  };

  /* ---------- «Werte messen» W1–W3: what the Pick-up check and the replaced parts add ---------- */
  const checked = $derived(bike ? pickupChecked(bike) : { date: null, keys: [] });
  const again = $derived(bike ? againValues(bike) : []);
  /** The small line under a value of the Bike pass: «checked at the pick-up 14.10.» or «new since 14.10.». */
  function passNote(r) {
    const [part, field] = r.id.split(':');
    if (part === 'fit' && checked.date && checked.keys.includes(field) && r.value != null) return t('checked at the pick-up {date}', { date: dateOf(checked.date) });
    // W5: the pressure as last measured, under the target
    if (part === 'fit' && (field === 'pressureF' || field === 'pressureR') && data) {
      const p = [...pressures(data.view)].reverse().find((x) => x[field === 'pressureF' ? 'f' : 'r'] != null);
      return p ? t('last measured {value} bar, {date}', { value: num(p[field === 'pressureF' ? 'f' : 'r']), date: dateOf(p.date) }) : '';
    }
    if (part === 'fit' || !data) return '';
    const rep = lastReplacement(data.view, part);
    // W6: the chain's last wear
    const wear = part === 'chain' ? chainState(data.view) : null;
    const w = wear ? t('wear {value} %', { value: num(wear.value) }) : '';
    if (!rep) return w;
    return [rep.before != null ? t('new since {date} · the one before rode {km} km', { date: dateOf(rep.date), km: num(rep.before) }) : t('new since {date}', { date: dateOf(rep.date) }), w].filter(Boolean).join(' · ');
  }
  let messen = $state(null); // W5 / W6: 'pressure' | 'chain'
  const lastPress = $derived(data ? (pressures(data.view).at(-1) ?? null) : null);
  const chainNow = $derived(data ? chainState(data.view) : null);
  /** The Bike pass with the small lines; a part with several rows (model, size …) says «new since» once. */
  const passSections = $derived.by(() => {
    if (!data) return [];
    const said = new Set();
    return data.pass.sections.map((sec) => ({
      ...sec,
      rows: sec.rows.map((r) => {
        const part = r.id.split(':')[0];
        if (part !== 'fit' && said.has(part)) return { ...r, note: '' };
        const note = passNote(r);
        if (note && part !== 'fit') said.add(part);
        return { ...r, note, chk: part === 'fit' && !!checked.date && checked.keys.includes(r.id.slice(4)) && r.value != null };
      }),
    }));
  });

  /* ---------- «Bausteine»: the blocks of the Bike pass and the Workshop order ---------- */
  const blocksQ = liveQuery(() => db.settings.get(BLOCKS_KEY));
  const fieldsQ = liveQuery(() => db.settings.get(FIELDS_KEY));
  const bagsQ = liveQuery(() => db.containers.toArray());
  const glob = $derived(globalOf($blocksQ?.value, t));
  const profile = $derived(data ? bikeProfile(data.view, $visitsQ ?? [], data.tyres, today) : null);
  const luggageG = $derived.by(() => {
    if (!data?.trip || !bike) return null;
    const x = tripStats(data.trip, $itemsQ ?? [], $bagsQ ?? [], bike, null);
    return x.gearG + x.onMeG + x.bagsG || null;
  });
  const ctxOf = (sh) => ({ bike, view: data.view, sheet: sh, data, more, profile, tasks: $tasksQ ?? [], visits: $visitsQ ?? [], fields: fieldsOf($fieldsQ?.value), pass: passSections, again, keep, luggageG, today });
  /** What each block of a sheet shows on this bike: { [id]: { rows, empty, summary } }. */
  function viewsFor(sh) {
    if (!bike || !data) return {};
    const c = ctxOf(sh);
    const out = {};
    for (const x of fullLayout(bike, sh, glob)) {
      const d = blockDef(x.id, glob);
      if (d) out[x.id] = d.own ? ownView(d, bike) : blockView(x.id, c);
    }
    return out;
  }
  const passViews = $derived(viewsFor('pass'));
  const orderViews = $derived(viewsFor('order'));
  /** The blocks that are on, in their order, with what they show. */
  const shown = (sh, views) => (bike ? layoutFor(bike, sh, glob).filter((x) => x.on).map((x) => ({ id: x.id, def: blockDef(x.id, glob), v: views[x.id] ?? { rows: [], empty: true } })).filter((x) => x.def) : []);
  const passBlocks = $derived(shown('pass', passViews));
  const orderBlocks = $derived(shown('order', orderViews));
  const nameOf = (def) => (def.own ? def.title : t(def.name));
  let arranging = $state(false); // «Bausteine ordnen» right in the sheet (B3 b)
  // another sheet or bike: arranging ends
  $effect(() => {
    void sheet, bikeId;
    arranging = false;
  });
  let bnotice = $state(null); // { text, undo }
  let bTimer;
  function blockNotice(text, undo) {
    clearTimeout(bTimer);
    bnotice = { text, undo };
    bTimer = setTimeout(() => (bnotice = null), 8000);
  }
  $effect(() => () => clearTimeout(bTimer));
  async function undoBlocks() {
    const u = $state.snapshot(bnotice?.undo);
    bnotice = null;
    await restore(u);
  }
  // the text, the ticks and the values of an own block, and the values typed into a built block
  let drafts = $state({}); // own block id → text while typing
  const ownText = (def) => drafts[def.ownId] ?? ownView(def, bike).rows[0]?.label ?? '';
  async function saveOwnText(def) {
    if (drafts[def.ownId] == null) return;
    await saveOwnContent(bikeId, def.ownId, { text: drafts[def.ownId] });
    drafts = { ...drafts, [def.ownId]: undefined };
  }
  const ownC = (def) => bike?.sheetBlocks?.own?.[def.ownId] ?? {};
  const tickOwn = (def, id, on) => saveOwnContent(bikeId, def.ownId, { ticks: { ...(ownC(def).ticks ?? {}), [id]: on } });
  const valOwn = (def, id, v) => saveOwnContent(bikeId, def.ownId, { values: { ...(ownC(def).values ?? {}), [id]: v.trim() === '' ? null : readValue(v.trim(), false) } });
  const bdata = $derived(bike?.sheetBlocks?.data ?? {});
  const setLimit = (v) => saveBlockData(bikeId, 'budget', { limit: v === '' ? null : Math.max(0, Math.round(Number(v))) || null });
  const setWish = (patch) => saveBlockData(bikeId, 'pickupWish', { ...(bdata.pickupWish ?? {}), ...patch });
  let brought = $state('');
  const uid = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  async function bring(text) {
    const x = String(text ?? '').trim();
    if (!x) return;
    await saveBlockData(bikeId, 'partsBrought', [...(bdata.partsBrought ?? []), { id: uid(), text: x }]);
    brought = '';
  }
  const unbring = (id) => saveBlockData(bikeId, 'partsBrought', (bdata.partsBrought ?? []).filter((p) => p.id !== id));
  // suggestions: the parts the order replaces, not yet in the list
  const bringIdeas = $derived(data ? [...new Set(data.picked.filter((r) => r.action === 'replace' && r.part && PART[r.part]).map((r) => t(PART[r.part].name)))].filter((n) => !(bdata.partsBrought ?? []).some((p) => p.text.toLowerCase().includes(n.toLowerCase()))) : []);
  const wishIdea = $derived(data ? pickupSuggestion(data.trip) : null);
  const keepNow = $derived(keepRest(keep, again));
  const goBlocks = (sh) => (lastSheet.v = sh);

  /* ---------- the text of a sheet (V3 a) ---------- */
  const STAND = () => t('As of {date}', { date: dateOf(today) });
  function textOf(kind) {
    if (kind === 'pass') return sheetText({ title: t('Bike pass'), sub: bikeLine(data.view), facts: [STAND(), kmLine], sections: passBlocks.filter((b) => !b.v.empty).map(textSection), foot: t('Pack Generator · all values are suggestions and can be changed') });
    if (kind === 'plan')
      return sheetText({
        title: t('Service plan'),
        sub: bikeLine(data.view),
        facts: [STAND(), kmLine],
        sections: [{ name: t('Parts'), rows: data.plan.rows.map((r) => ({ id: r.key, label: r.name, value: r.next || '–', hint: [r.interval, r.last && t('last {when}', { when: r.last }), r.since && t('since then {since}', { since: r.since })].filter(Boolean).join(' · ') })) }],
        foot: 'Pack Generator',
      });
    if (kind === 'breakin') return breakinText(data.view, more.breakin, { today });
    if (kind === 'kit') return kitText(data.view, more.kit);
    if (kind === 'warranty') return warrantyText(data.view, more.warranty, { today });
    if (kind === 'theft') return theftText(data.view, more.theft, { today });
    if (kind === 'order') return orderMessage(ctxOf('order'), orderBlocks.map((b) => b.id), Object.fromEntries(orderBlocks.filter((b) => b.def.own).map((b) => [b.id, b.def])));
    return sheetText({ title: t('Pick-up check'), sub: `${data.view.name} · ${t('at the bike shop')}`, facts: [kmLine, t('{n} of {all} done', { n: data.pickup.ticked, all: data.pickup.total })], sections: data.pickup.sections, ticks: data.pickup.pickup.ticks, foot: t('Pack Generator · the ticks stay saved in the app') });
  }
  /** One block of the Bike pass as a section of the text (B4 a: only the blocks that are on and have something). */
  function textSection(b) {
    if (PASS_SECTION[b.id]) {
      const sec = passSections.find((x) => x.key === PASS_SECTION[b.id]);
      return { name: sec.name, rows: sec.rows.map((r) => ({ ...r, hint: r.note })) };
    }
    if (b.def.own && b.def.kind === 'check') return { name: b.def.title, rows: b.v.rows.map((r) => ({ label: `${r.ticked ? '[x]' : '[ ]'} ${r.label}`, value: '' })) };
    if (b.def.own && b.def.kind === 'text') return { name: b.def.title, rows: [{ label: b.v.rows[0].label, value: '' }] };
    return { name: nameOf(b.def), rows: b.v.rows.filter((r) => !b.def.own || r.value != null).map((r) => ({ label: r.label, value: r.value ?? '', hint: r.note })) };
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
  <!-- Bugfix Dateneingabe: opens that one value for typing; closing it comes back to this sheet -->
  <a class="enter" href={withBack(href, sheet, from)}>{t('enter|value')}</a>
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

{#snippet arrange(kind)}
  <!-- «Bausteine ordnen» (B3 b, mockup BS5): the blocks of this sheet to move, switch and add, right here -->
  <div class="arr noprint" role="status">
    <p>{t('Move with the arrows or drag. The switch hides a block in the PDF and the text too.')}</p>
    <button type="button" class="btn ink" onclick={() => (arranging = false)}><Check size={16} aria-hidden="true" />{t('Done|arrange')}</button>
  </div>
  <BlockArrange {bike} bikes={$bikesQ ?? []} {glob} sheet={kind} views={kind === 'pass' ? passViews : orderViews} part="both" variant="sheet" onnotice={blockNotice} />
  <p class="next noprint"><a class="lnk" href={bikesHash({ tab: 'setup', bike: bikeId, sheet: 'blocks', from })} onclick={() => goBlocks(kind)}>{t('All blocks')}</a></p>
{/snippet}

{#snippet rowsBlock(b)}
  <!-- a built block that shows values (Last measured, Geometry, Replaced parts …) -->
  <section class="psec" aria-label={nameOf(b.def)} data-block={b.id}>
    <h3>{nameOf(b.def)}</h3>
    <dl class="vals">
      {#each b.v.rows as r (r.id)}
        <div class="vr"><dt>{r.label}</dt><dd class:warnv={r.tone === 'warn'} class:badv={r.tone === 'bad'}>{#if r.value != null}{r.value}{:else if r.edit}{@render enter(r.edit)}{:else}–{/if}{#if r.note}<small class="vnote">{r.note}</small>{/if}</dd></div>
      {/each}
    </dl>
  </section>
{/snippet}

{#snippet ownBlock(b)}
  <!-- an own block: the text, the ticks or the values of this bike (B5 a); empty: not in the PDF -->
  <section class="psec" class:noprint={b.v.empty && b.def.kind !== 'check'} aria-label={b.def.title} data-block={b.id}>
    <h3>{b.def.title}</h3>
    {#if b.def.kind === 'text'}
      <textarea class="inp wish noprint" aria-label={b.def.title} rows="2" placeholder={t('Write something …')} value={ownText(b.def)} oninput={(e) => (drafts = { ...drafts, [b.def.ownId]: e.currentTarget.value })} onblur={() => saveOwnText(b.def)}></textarea>
      <p class="printonly">{ownText(b.def)}</p>
    {:else if b.def.kind === 'check'}
      {#if b.v.rows.length}
        <ul class="checks">
          {#each b.v.rows as r (r.id)}
            <li><label class="ck"><input type="checkbox" checked={r.ticked} onchange={(e) => tickOwn(b.def, r.id, e.currentTarget.checked)} /><span class="cl"><b>{r.label}</b></span></label></li>
          {/each}
        </ul>
      {:else}<p class="quiet">{t('No points yet. Add one.')}</p>{/if}
      {#if !b.def.toShop}<p class="quiet noprint">{t('Only for you · not in the text to the bike shop')}</p>{/if}
    {:else}
      <dl class="vals">
        {#each b.v.rows as r (r.id)}
          <div class="vr"><dt>{r.label}</dt><dd><input class="inp vin noprint" aria-label={r.label} value={ownC(b.def).values?.[r.id] ?? ''} onchange={(e) => valOwn(b.def, r.id, e.currentTarget.value)} /><span class="printonly">{r.value ?? ''}</span></dd></div>
        {/each}
      </dl>
    {/if}
  </section>
{/snippet}

{#snippet pass()}
  {@render head(t('Bike pass'), bikeLine(data.view), [STAND(), kmLine])}
  {#if arranging && sheet === 'pass'}{@render arrange('pass')}{:else}
  <div class="cols2">
    {#each passBlocks as b (b.id)}
      {#if PASS_SECTION[b.id]}
        {@const sec = passSections.find((x) => x.key === PASS_SECTION[b.id])}
        {#if sec}
          <section class="psec" aria-label={sec.name} data-block={b.id}>
            <h3>{sec.name}</h3>
            <dl class="vals">
              {#each sec.rows as r (r.id)}
                <div class="vr"><dt>{r.label}</dt><dd>{#if r.value != null}{r.value}{:else}{@render enter(r.edit)}{/if}{#if r.note}<small class="vnote" class:chk={r.chk}>{#if r.chk}<Check size={12} aria-hidden="true" />{/if}{r.note}</small>{/if}{#if r.id === 'fit:pressureR'}<span class="noprint"><PressureHint bikeId={bike.id} /></span>{/if}</dd></div>
              {/each}
            </dl>
          </section>
        {/if}
      {:else if b.def.own}{@render ownBlock(b)}
      {:else if !b.v.empty}{@render rowsBlock(b)}{/if}
    {/each}
  </div>
  {#if !passBlocks.length}<p class="quiet">{t('Every block of this sheet is switched off. Arrange blocks shows them again.')}</p>{/if}
  {/if}
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
          <td data-l={t('Next time')} class:late={r.state === 'due' || r.state === 'overdue' || r.state === 'work'} data-sign={r.state === 'due' || r.state === 'overdue' || r.state === 'work' ? signFor('warn') : null}>{r.next || '–'}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="note">{t('Orange = soon, red = now. The bars count from the start point of each part (Q1 «Gapless km»).')}</p>
  <p class="pfoot"><span>Pack Generator</span><span>{tn(data.plan.due, '{n} due', '{n} due')}</span></p>
{/snippet}

{#snippet order()}
  {@render head(t('Workshop order|sheet'), [data.view.name, data.trip ? t('before {trip}, {date}', { trip: data.trip.title, date: dateOf(data.trip.startDate) }) : '', data.order.shop].filter(Boolean).join(' · '), [STAND(), kmLine])}
  {#if arranging && sheet === 'order'}{@render arrange('order')}{:else}
  {#each orderBlocks as b (b.id)}
    {#if b.id === 'jobs'}
      <section class="psec" aria-labelledby="ord-jobs" data-block="jobs">
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
    {:else if b.id === 'wishes'}
      <section class="psec" class:noprint={b.v.empty} aria-labelledby="ord-wish" data-block="wishes">
        <h3 id="ord-wish">{t('Wishes')}</h3>
        <textarea class="inp wish" aria-labelledby="ord-wish" rows="2" placeholder={t('e.g. call before replacing anything over CHF 100')} value={wishes ?? s.wishes ?? ''} oninput={(e) => (wishes = e.currentTarget.value)} onblur={saveWishes}></textarea>
      </section>
    {:else if b.id === 'again'}
      {#if again.length}
        <!-- «Werte messen» W2: the values of the last Pick-up check, to set again after the work -->
        <section class="psec" aria-labelledby="ord-again" data-block="again">
          <h3 id="ord-again">{t('As it should be again')}</h3>
          <p class="quiet">{t('The values of the last pick-up on {date} · please set them like this again after the work', { date: dateOf(checked.date) })}</p>
          <dl class="vals">{#each again as r (r.key)}<div class="vr"><dt>{r.label}</dt><dd>{r.value}</dd></div>{/each}</dl>
        </section>
      {/if}
    {:else if b.id === 'keep'}
      {#if keepNow.length}
        <section class="psec" aria-labelledby="ord-keep" data-block="keep">
          <h3 id="ord-keep">{t('Please leave as it is')}</h3>
          <dl class="vals">{#each keepNow as r (r.key)}<div class="vr"><dt>{r.label}</dt><dd>{r.value}</dd></div>{/each}</dl>
        </section>
      {/if}
    {:else if b.id === 'budget'}
      <section class="psec" class:noprint={b.v.empty} aria-labelledby="ord-budget" data-block="budget">
        <h3 id="ord-budget">{t('Cost limit')}</h3>
        {#each b.v.rows as r (r.id)}<p class="bline" class:printonly={r.id === 'limit'}><span>{r.label}</span><b>{r.value}</b></p>{/each}
        <label class="inl noprint"><span>{t('Please call above CHF')}</span><input class="inp num" type="number" min="0" step="10" inputmode="numeric" value={bdata.budget?.limit ?? ''} onchange={(e) => setLimit(e.currentTarget.value)} /></label>
      </section>
    {:else if b.id === 'pickupWish'}
      <section class="psec" class:noprint={b.v.empty} aria-labelledby="ord-pw" data-block="pickupWish">
        <h3 id="ord-pw">{t('Pick-up wish')}</h3>
        {#if !b.v.empty}<p class="printonly">{b.v.rows[0].value}</p>{/if}
        <div class="inl2 noprint">
          <label class="inl"><span>{t('Back by')}</span><input class="inp" type="date" value={bdata.pickupWish?.date ?? ''} onchange={(e) => setWish({ date: e.currentTarget.value || null })} /></label>
          <label class="inl grow"><span>{t('Note|pickup')}</span><input class="inp" value={bdata.pickupWish?.text ?? ''} placeholder={t('e.g. after 5 pm')} onchange={(e) => setWish({ text: e.currentTarget.value })} /></label>
        </div>
        {#if wishIdea && !bdata.pickupWish?.date}<button type="button" class="lk noprint" onclick={() => setWish({ date: wishIdea.date })}>{t('Use {date} ({why})', { date: dateOf(wishIdea.date), why: wishIdea.text })}</button>{/if}
      </section>
    {:else if b.id === 'partsBrought'}
      <section class="psec" class:noprint={b.v.empty} aria-labelledby="ord-pb" data-block="partsBrought">
        <h3 id="ord-pb">{t('Parts I bring')}</h3>
        {#if b.v.rows.length}
          <ul class="brought">{#each b.v.rows as r (r.id)}<li><span>{r.label}</span><button type="button" class="xb noprint" aria-label={t('Remove {name}', { name: r.label })} onclick={() => unbring(r.id)}><XIcon size={16} aria-hidden="true" /></button></li>{/each}</ul>
        {:else}<p class="quiet noprint">{t('Bringing a part? Add it so the shop knows.')}</p>{/if}
        <div class="inl2 noprint">
          <input class="inp grow" aria-label={t('Parts I bring')} bind:value={brought} placeholder={t('e.g. chain, new in its box')} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), bring(brought))} />
          <button type="button" class="btn" onclick={() => bring(brought)}>{t('Add|block')}</button>
        </div>
        {#if bringIdeas.length}<p class="ideas noprint">{#each bringIdeas as n (n)}<button type="button" class="lk" onclick={() => bring(n)}>+ {n}</button>{/each}</p>{/if}
      </section>
    {:else if b.def.own}{@render ownBlock(b)}
    {:else if !b.v.empty}{@render rowsBlock(b)}{/if}
  {/each}
  {#if !orderBlocks.length}<p class="quiet">{t('Every block of this sheet is switched off. Arrange blocks shows them again.')}</p>{/if}
  {/if}
  <p class="pfoot"><span>Pack Generator</span><span>{tn(data.picked.length, '{n} job', '{n} jobs')}</span></p>
  <p class="next noprint"><a class="lnk" href={bikesHash({ tab: 'setup', bike: bikeId, sheet: 'pickup', from })}>{t('At the pick-up: Pick-up check')}</a></p>
{/snippet}

{#snippet pickup()}
  {@render head(t('Pick-up check'), `${data.view.name} · ${t('at the bike shop')}${data.pickup.pickup.date ? ` · ${t('order of {date}', { date: dateOf(data.pickup.pickup.date) })}` : ''}`, [kmLine, t('{n} of {all} done', { n: data.pickup.ticked, all: data.pickup.total })])}
  {#if applied}
    <div class="done noprint" role="status">
      <p>{t('Taken into care on {date}. The ticks of this check stay saved.', { date: dateOf(applied) })}</p>
      <button type="button" class="btn" onclick={newPickup} data-explain={t('Start a new pick-up check')}>{t('Start again|pickup')}</button>
    </div>
  {/if}
  {#each data.pickup.sections as sec (sec.key)}
    <section class="psec" aria-label={sec.name}>
      <h3>{sec.name}</h3>
      {#if !sec.rows.length}<p class="quiet">{t('No job on the order.')}</p>{/if}
      {#if sec.key === 'values' && sec.rows.length}
        <p class="vprog"><span>{t('{n} of {all} entered', { n: valDone, all: valRows.length })}</span><span class="vbar" aria-hidden="true"><i style:width="{Math.round((valDone / valRows.length) * 100)}%"></i></span></p>
        <ul class="vcards">
          {#each valRows as r (r.id)}
            <ValueCard row={r} before={beforeOf(r)} done={!!data.pickup.pickup.ticks?.[r.id]} open={openVal === r.id} disabled={!!applied} onopen={() => (openVal = r.id)} onsave={(v) => saveVal(r, v)} onskip={() => skipVal(r)} />
          {/each}
        </ul>
        <!-- «Werte messen» 2b: measure the pressure and the chain right here, with the suggestion (W4a) -->
        <div class="meas noprint" data-testid="pickup-measure">
          <button type="button" class="mcard" onclick={() => (messen = 'pressure')}><b>{t('Record the pressure')}</b><small>{lastPress ? t('last {pair}, {date}', { pair: `${lastPress.f == null ? '–' : num(lastPress.f)} / ${lastPress.r == null ? '–' : num(lastPress.r)} bar`, date: dateOf(lastPress.date) }) : t('front and rear, as measured')}</small></button>
          <button type="button" class="mcard" onclick={() => (messen = 'chain')}><b>{t('Measure the chain')}</b><small>{chainNow ? t('last {value} %', { value: num(chainNow.value) }) : t('with the chain checker')}</small></button>
        </div>
        <PressureHint bikeId={bike.id} />
      {:else}
      <ul class="checks">
        {#each sec.rows as r (r.id)}
          <li>
            <label class="ck"><input type="checkbox" checked={!!data.pickup.pickup.ticks?.[r.id]} disabled={!!applied} onchange={(e) => tick(r.id, e.currentTarget.checked)} /><span class="cl"><b>{r.label}</b>{#if r.hint}<small>{r.hint}</small>{/if}</span></label>
            <span class="cv">{#if r.value == null}{@render enter(r.edit)}{:else}{r.value}{/if}</span>
          </li>
        {/each}
      </ul>
      {/if}
    </section>
  {/each}
  <div class="sign"><span>{t('Date, picked up')}</span><span>{t('Remarks')}</span></div>
  {#if !applied}
    <div class="apply noprint">
      <button type="button" class="btn ink" disabled={!jobsTicked} onclick={takeIntoCare} data-explain={t('Take the ticked work into care')}>{t('Take over|care')}</button>
      <small>{t('Each ticked job becomes a care entry by the bike shop, today at {km}. A replaced part gets its start point.', { km: kmLine })}</small>
    </div>
  {/if}
  <p class="pfoot"><span>{t('Pack Generator · the ticks stay saved in the app')}</span></p>
{/snippet}

<div class="sheetview">
  {#if !$bikesQ}
    <p class="quiet">…</p>
  {:else if !bike || !data}
    <h1 class="title sr">{t('Folder|sheets')}</h1>
    <p class="card">{t('This bike is not here any more.')} <a href={bikesHash({ tab: 'setup' })}>{t('Bikes')}</a></p>
  {:else if sheet === 'blocks'}
    <!-- «Bausteine» (B3 a, mockups BS1, BS2): the page of the blocks of the Bike pass and the Workshop order -->
    <VeloHead {crumbs} here={t('Building blocks|sheets')} title={t('Building blocks|sheets')} />
    <BlocksPage {bike} bikes={$bikesQ ?? []} {glob} views={viewsFor} {from} onnotice={blockNotice} />
  {:else}
    <!-- Design-Refresh P7 (V5): the path back, «Folder Gravel Blau», the whole folder as PDF and «Choose sheets»
         on top; the sheet left with its buttons below it, the sheets of the folder right. -->
    <VeloHead crumbs={crumbs} here={sheet === 'all' ? t('Folder|sheets') : t(SHEET[sheet].name)} title={t('Folder {bike}', { bike: bike.name })} sub={t('The app fills every sheet from your data · view it, share it as a PDF or copy the text')}>
      {#if sheet === 'all'}<button type="button" class="btn hi" onclick={pdf} data-explain={t('Share as PDF')}><Printer size={16} aria-hidden="true" />{t('Share PDF')}</button>
      {:else}<a class="btn hi" href={bikesHash({ tab: 'setup', bike: bikeId, sheet: 'all', from })} data-explain={t('Whole folder as PDF')}><Printer size={16} aria-hidden="true" />{t('Whole folder')}</a>{/if}
      <button type="button" class="btn" aria-expanded={choosing} onclick={() => (choosing = !choosing)}>{t('Choose sheets')}</button>
    </VeloHead>
    {#if said}<p class="said noprint" role="status">{said}</p>{/if}
    <div class="svcols">
      <div class="svmain">
        {#if !kinds.length}<p class="card">{t('All sheets are hidden. «Choose sheets» in the folder shows them again.')}</p>{/if}
        <div class="papers">
          {#each kinds as kind (kind)}
            <article class="paper" data-sheet={kind} aria-label={t(SHEET[kind].name)}>
              {#if MORE.includes(kind)}<SheetMore {kind} {bike} {data} {more} items={$itemsQ ?? []} {today} {kmNow} visits={$visitsQ ?? []} back={sheet} {from} bind:editing />
              {:else if kind === 'pass'}{@render pass()}{:else if kind === 'plan'}{@render plan()}{:else if kind === 'order'}{@render order()}{:else}{@render pickup()}{/if}
            </article>
          {/each}
        </div>
        <div class="bar noprint">
          <button type="button" class="btn" onclick={copy}><Copy size={16} aria-hidden="true" />{t('Copy text')}</button>
          {#if sheet !== 'all'}<button type="button" class="btn" onclick={pdf} data-explain={t('Share as PDF')}><Share2 size={16} aria-hidden="true" />{t('Share PDF')}</button>{/if}
          {#if sheet === 'pass' || sheet === 'order'}<button type="button" class="btn" aria-pressed={arranging} onclick={() => (arranging = !arranging)} data-testid="arrange"><LayoutList size={16} aria-hidden="true" />{t('Arrange blocks')}</button>{/if}
          {#if editHref}<a class="btn" href={editHref}><Pencil size={16} aria-hidden="true" />{t('Change values')}</a>
          {:else if EDIT[sheet] === 'form'}<button type="button" class="btn" aria-pressed={editing} onclick={() => (editing = !editing)}><Pencil size={16} aria-hidden="true" />{t('Change values')}</button>{/if}
        </div>
      </div>
      <aside class="svside noprint">
        <SheetFolder {bike} {from} current={sheet} acts={false} bind:choosing />
        <p class="svnote"><Check size={16} aria-hidden="true" />{t('Pack Generator · all values are suggestions and can be changed')}</p>
      </aside>
    </div>
  {/if}
</div>

{#if notice}
  <p class="notice noprint" role="status"><span>{notice.text}</span>{#if notice.undo}<button type="button" class="undo" onclick={undo}>{t('Undo')}</button>{/if}</p>
{/if}

{#if bnotice}
  <p class="notice noprint" role="status" data-testid="block-notice"><span>{bnotice.text}</span>{#if bnotice.undo}<button type="button" class="undo" onclick={undoBlocks}>{t('Undo')}</button>{/if}</p>
{/if}

{#if messen && bike}<MessenDialog kind={messen} bikeId={bike.id} onclose={() => (messen = null)} />{/if}

<style>
  .sheetview {
    min-width: 0;
  }
  /* Design-Refresh P7 (V5): the sheet left, the folder's sheets right; one column on a phone. */
  .svcols,
  .svmain,
  .svside {
    min-width: 0;
  }
  @media (min-width: 1000px) {
    .svcols {
      display: grid;
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      gap: 24px;
      align-items: start;
    }
  }
  .svside {
    margin-top: 24px;
  }
  @media (min-width: 1000px) {
    .svside {
      margin-top: 0;
    }
  }
  .svnote {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 14px 2px 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 12px 0 0;
  }
  .bar .btn {
    min-height: 44px;
    text-decoration: none;
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
    padding: 28px 28px 20px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
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
  .vprog {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 2px 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .vbar {
    flex: 1;
    height: 6px;
    border-radius: 99px;
    background: var(--line);
    overflow: hidden;
  }
  .vbar i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--ok);
  }
  .vcards {
    margin: 0;
    padding: 0;
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
  .vnote {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
    font-size: var(--fs-small);
    font-weight: 400;
    color: var(--ink-2);
  }
  .vnote.chk {
    color: var(--ok);
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
    .svcols {
      display: block;
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
  /* «Bausteine» */
  .arr {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    margin: 16px 0 12px;
    padding: 10px 14px;
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
  }
  .arr p {
    flex: 1 1 240px;
    margin: 0;
    font-size: var(--fs-small);
  }
  .arr .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .warnv {
    color: var(--warn);
  }
  .badv {
    color: var(--bad);
  }
  .printonly,
  .bline.printonly {
    display: none;
    margin: 0;
    white-space: pre-line;
  }
  .bline {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 0;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .inl {
    display: grid;
    gap: 4px;
    margin-top: 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .inl .num {
    max-width: 140px;
  }
  .inl2 {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px 12px;
    margin-top: 8px;
  }
  .inl2 .grow {
    flex: 1 1 200px;
    min-width: 0;
  }
  .inl2 .btn {
    min-height: 44px;
  }
  .brought {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .brought li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
    border-bottom: 1px solid var(--line);
  }
  .xb {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ideas {
    display: flex;
    flex-wrap: wrap;
    gap: 0 16px;
    margin: 4px 0 0;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
    text-align: left;
  }
  .vin {
    width: 100%;
    box-sizing: border-box;
  }
  @media print {
    .printonly {
      display: block;
    }
    .bline.printonly {
      display: flex;
    }
    .vin {
      display: none;
    }
  }
  .meas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    margin: 12px 0 6px;
  }
  .mcard {
    display: grid;
    gap: 2px;
    min-height: 56px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .mcard small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
