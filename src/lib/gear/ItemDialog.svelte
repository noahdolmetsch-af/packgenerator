<script>
  import { powerRole } from '../power.js'; // Strombudget (Noah 19.10.2026 «2a»)
  import SpeakButton from '../ui/SpeakButton.svelte'; // «Diktat» (Noah 19.10.2026 «5a»)
  import { appendSpoken } from '../speak.js';
  import CameraButton from '../ui/CameraButton.svelte'; // P3b Teil 3: the camera wherever a photo is added
  import { closeKeep } from '../ui/keeptyped.js';
  import { tick } from 'svelte';
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { RIDES, RAIN_ITEM } from '../layers.js';
  import { choosable, CATEGORY, BAGS, BAG, OWNERSHIP, formatWeight, itemWeight, itemDraft, itemRecord, parseGrams } from '../gear.js';
  import { liveQuery } from 'dexie';
  import { SETS_KEY, allSets } from '../sets.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { assignmentOf, currentTrip } from './assign.js';
  import { localDay } from '../localday.js';
  import { autoKeep, leaveWindow } from '../drafts.js';
  import AssignDialog from './AssignDialog.svelte';
  import Seg from '../ui/Seg.svelte';
  import MergeSheet from './MergeSheet.svelte';
  import { undoBulk, deleteItems, deletePlan, archiveItems } from './bulk.js';
  import { askDelete, deleteWithUndo, saveFailed, once } from '../ui/ask.js'; // «Rückmeldungen» 19.10.2026
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { FIELD_HELP, weiter } from '../daumen.js'; // FE14, FE16
  import { DOMAINS, itemDomains, domainName, EVERYWHERE } from '../domains.js';
  import { isSupply, expiryState, daysUntil } from '../supplies.js'; // Paket H: supplies with an expiry date (answer 2b)
  import { CHARGE_CATEGORIES } from '../gear.js';
  import { suggestValues, applySuggestion, adds } from './suggestvalues.js'; // Paket H #348: values while typing a new name
  import { SKI_GROUPS, SKI_GROUP, skiGroupOf } from '../ski.js';
  import { comesOf, setStandard, setPlace, clearOptional, blockKind } from './comes.js';
  import { inStandard, isWorn } from '../blocks2026.js';
  import { alsoBagOf, setAlsoBag } from '../backpacks.js';
  import { Warehouse } from '@lucide/svelte';
  import { Check, Plus, UserRound, Briefcase, Info, Layers, Route, FileText, ChevronRight, MapPin, Package, CalendarClock, Scale, Sparkles, ArrowLeftRight, X, Undo2, Pencil, Ellipsis } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { offerRename, offerDone } from '../ui/rename.svelte.js';
  import { isClothing } from '../wardrobe.js';
  import { shrinkImage } from '../photo.js';
  import ItemLife from './ItemLife.svelte';
  import { materialStats, tripLog, usageOf, lighterAlts, ALT_DISMISSED_KEY, dismissValue, linkPatch, suggestWhy } from './material.js';
  import { inSmallAid, AID_KEY } from '../firstaid.js';
  import { summaryLine, blockNames, ruleNames, placeName, weightState, lifeLine, lastFold, keepFold, nextFold, blockLabel } from './detail.js';

  /**
   * item: the item to show, or null for "Add item".
   * readOnly: on the phone the inventory is for looking things up and weighing only,
   * so there the dialog shows the details plus a weight field (and, v0.45.1, "Merge with …").
   */
  // onkept (v0.35.0): called with the new item when the window closes without "Save" after it was
  // saved while typing (Pack puts it on the trip, a template takes it, like after "Save").
  import Woanders from '../sk/Woanders.svelte'; // SK X1, X7, X13
  import { slotOf, ifixitUrl } from '../sk/links.js';
  import { own } from '../ownlive.svelte.js';
  import '../ui/daumen.css'; // FE1: Save stays at the bottom edge of the window on a phone
  import Field from '../ui/Field.svelte'; // Einheitliche Formulare (Noah 19.10.2026 «teil bearbeiten jetzt»)
  import { checkAll } from '../ui/formchecks.js';
  let { item, items: allItems, readOnly = false, preset = {}, onsaved = null, onkept = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !item;
  /*
   * v0.35.0 (AP29, Noah 4b + 5a): nothing typed is lost. A new item is saved as soon as it has a
   * name (autoId) and every further field updates it; closing keeps it. "Discard" takes it back
   * (it was made in this window, nothing points to it yet). Until the window closes its ID follows
   * the category (the next free number of that category), as "Save" would give it.
   */
  let autoId = $state(null);
  let ended = false;
  const items = $derived(allItems.filter((i) => i.id !== autoId));
  // An existing item: a copy to edit; nothing is saved until "Save".
  // svelte-ignore state_referenced_locally
  let draft = $state(itemDraft(item, preset));
  // Paket H #348: a new item gets suggested values from your own similar gear or a typical device
  let sugOff = $state('');
  const sug = $derived(isNew && !readOnly ? suggestValues(draft.name, items, draft.id) : null);
  const sugShown = $derived(sug && sugOff !== draft.name.trim() && adds($state.snapshot(draft), sug.values) ? sug : null);
  function useSug() {
    Object.assign(draft, applySuggestion($state.snapshot(draft), sug.values));
    sugOff = draft.name.trim();
  }
  let error = $state('');
  let dialog;
  // v0.23.0 (AP08): a new item asks only for name, category, status and weight; everything else
  // waits behind "More details". v0.32.0: an existing item shows where it goes and its building
  // blocks; the rest folds away row by row.
  let more = $state(false);
  // v0.23.0 (AP09): the category can change; the ID never does, so every link to the item stays.
  const moved = $derived(!isNew && draft.category !== item.category);
  // A new item is never "Gone"; an existing one keeps every status.
  const statuses = $derived(Object.entries(OWNERSHIP).filter(([k]) => !isNew || k !== 'gone'));
  // v0.40.0: the three usual ones as a segment, the rest under "Other status".
  const MAIN_STATUS = ['owned', 'wishlist', 'gone'];
  const statusSeg = $derived(statuses.filter(([k]) => MAIN_STATUS.includes(k)).map(([k, v]) => ({ key: k, name: t(v) })));
  const statusMore = $derived(statuses.map(([k]) => k).filter((k) => !MAIN_STATUS.includes(k)));

  $effect(() => {
    dialog.showModal();
  });

  // v0.26.0 (Noah 2a, 9a): every building block (built-in and own); templates and the current trip
  // fold away under "In templates" (v0.32.0), where "Assign …" changes them.
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const liveQ = liveQuery(() => (item ? db.items.get(item.id) : null));
  // v0.47.2 «Material-Ansichten»: what the trips and their debriefs say about this item (ItemLife).
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const today = localDay();
  const life = $derived(item && $tripsQ && $debriefsQ ? { stats: materialStats([item], $tripsQ, $debriefsQ, today), log: tripLog($tripsQ, $debriefsQ) } : null);
  // v0.32.0 (finding 5): the blocks you add by hand first (Light, your own), then the ones of the night.
  const blocks = $derived(allSets($setsQ?.value).sort((a, b) => (blockKind(a.key) === 'night') - (blockKind(b.key) === 'night')));
  const chosenTrip = (() => {
    try {
      return localStorage.getItem('pack.currentTrip');
    } catch {
      return null;
    }
  })();
  // v0.32.0 (finding 5, stage 1): where the item is besides its building blocks: templates and the trip.
  const where = $derived.by(() => {
    if (!item) return { templates: [], trip: null };
    const trip = currentTrip($tripsQ ?? [], chosenTrip, localDay());
    const a = assignmentOf($liveQ ?? item, $tplQ?.value ?? [], trip);
    return { templates: a.templates, trip: a.trip ? trip : null };
  });
  // v0.32.0 (finding 5, stage 1): "Where it goes" and "Comes along · Building blocks". v0.33.0: the
  // buttons write the new fields (sets 'standard', leaveHome) and the old ones in step (comes.js).
  const comes = $derived(comesOf(draft));
  const inBlock = (key) => !!draft.sets?.includes(key);
  const toggleBlock = (key) => (draft.sets = inBlock(key) ? draft.sets.filter((x) => x !== key) : [...(draft.sets ?? []), key]);
  const bagChoices = $derived(BAGS.filter((b) => b.key !== 'body' || draft.defaultBag === 'body'));
  const layerCount = $derived(['ride', 'coldBelow', 'rain', 'perHours', 'maxQty', 'replaces', 'altFor', 'waterL'].filter((k) => String(draft[k] ?? '').trim() !== '').length);
  // Paket H: «Zu Hause und Vorrat»: where it is (#372), expiry and stock (answer 2b), battery (#346)
  const charges = $derived(CHARGE_CATEGORIES.includes(draft.category));
  const storeLine = $derived.by(() => {
    const parts = [];
    if (String(draft.homeSpot ?? '').trim()) parts.push(String(draft.homeSpot).trim());
    const ex = /^\d{4}-\d{2}-\d{2}$/.test(draft.expires ?? '') ? draft.expires : null;
    if (ex) {
      const st = expiryState({ expires: ex });
      const d = daysUntil(ex);
      parts.push(st === 'expired' ? t('expired') : st === 'soon' ? tn(d, 'expires in {n} day', 'expires in {n} days') : t('until {date}', { date: ex }));
    }
    if (String(draft.stock ?? '').trim() !== '') parts.push(t('{n} at home', { n: draft.stock }));
    if (String(draft.runH ?? '').trim() !== '') parts.push(t('lasts {n} h', { n: draft.runH }));
    return parts.join(' · ') || (isSupply(draft) ? t('supply, nothing set') : t('not set'));
  });
  const detailLine = $derived([draft.brand, draft.model].filter((x) => String(x ?? '').trim()).join(' · '));

  /*
   * v0.63.0 «Material-Detail ruhig» (Noah 1a): at the top only the name, the weight with its status
   * and one line on how it comes along; every other part folds away as a row with a short summary,
   * one row open at a time. The row opened last stays open for the session (detail.js). Building
   * blocks start folded like the rest. Every field is still here, only one tap further.
   */
  let openFold = $state(lastFold('item'));
  function onFold(key, open) {
    const next = nextFold(openFold, key, open);
    if (next === openFold) return;
    openFold = next;
    keepFold('item', next);
  }
  const gramsNow = $derived(String(draft.grams ?? '').trim());
  // The weight as typed (an unreadable entry keeps the saved one), for the line and the suggestions.
  const gramsG = $derived(gramsNow === '' ? null : (parseGrams(gramsNow) ?? item?.weightG ?? null));
  const wState = $derived(gramsNow === '' ? t('not weighed') : item && parseGrams(gramsNow) === item.weightG ? weightState(item) : t('weighed'));
  const ruleLine = $derived(ruleNames(draft).join(' · ') || (layerCount ? tn(layerCount, '{n} rule', '{n} rules') : t('not set')));
  const dismissedQ = liveQuery(() => db.settings.get(ALT_DISMISSED_KEY));
  /*
   * v0.72.0 «Feinschliff» (Noah 1a): ONE line under the name: weight, how it comes along, the place
   * and (after a reviewed trip) how often it was along and used. The weight field moved into the
   * first row «Weight».
   */
  const usage = $derived(life && item ? usageOf(life.stats, item.id) : null);
  const summary = $derived(isNew ? '' : summaryLine({ ...draft, weightG: gramsG }, blocks, usage));
  const lifeSum = $derived(usage ? lifeLine(usage) : '');

  /*
   * v0.72.0 (Noah 2a): the lighter alternative right in the row «Weight»: bars (the suggestion
   * against this item), a card per suggestion with one sentence why, «Remember as alternative»
   * (links them, material.js linkPatch) and «Doesn't fit» (hidden for this item, with Undo). The app
   * chooses nothing. ItemLife leaves its weight part out in this window, so nothing shows twice.
   */
  const wItem = $derived(item ? { ...($liveQ ?? item), weightG: gramsG } : null);
  const lighter = $derived(wItem ? lighterAlts(wItem, allItems, $dismissedQ?.value?.[item.id] ?? []) : []);
  const suggested = $derived(lighter.filter((a) => a.auto));
  const linkedLight = $derived(lighter.find((a) => a.manual) ?? null);
  const wBars = $derived.by(() => {
    if (!wItem || wItem.weightG == null || !lighter.length) return [];
    const mine = wItem.weightG * (Number(wItem.qty) || 1);
    const rows = [...lighter.map((a) => ({ item: a.item, g: a.g, me: false, auto: !!a.auto })), { item: wItem, g: mine, me: true }].sort((a, b) => a.g - b.g);
    const max = Math.max(...rows.map((r) => r.g), 1);
    return rows.map((r) => ({ ...r, pct: Math.max(4, Math.round((r.g / max) * 100)) }));
  });
  let altNote = $state(null); // { text, undo } after «Doesn't fit» or «Remember as alternative»
  async function dismissAlt(a) {
    const rec = await db.settings.get(ALT_DISMISSED_KEY);
    await db.settings.put({ key: ALT_DISMISSED_KEY, value: dismissValue(rec?.value, item.id, a.item.id, true) });
    altNote = {
      text: t('"{name}" hidden', { name: nameOf(a.item) }),
      undo: async () => {
        const now = await db.settings.get(ALT_DISMISSED_KEY);
        await db.settings.put({ key: ALT_DISMISSED_KEY, value: dismissValue(now?.value, item.id, a.item.id, false) });
      },
    };
  }
  async function linkAlt(a) {
    const patch = linkPatch($liveQ ?? item, a.item);
    if (!patch) return;
    const before = patch.id === item.id ? (draft.altFor ?? '') : (a.item.altFor ?? '');
    const write = async (altFor) => {
      if (patch.id === item.id) draft.altFor = altFor;
      await db.items.update(patch.id, { altFor: altFor || null, updatedAt: new Date().toISOString() });
    };
    await write(patch.altFor);
    altNote = { text: t('"{name}" remembered as an alternative', { name: nameOf(a.item) }), undo: () => write(before) };
  }
  async function undoAlt() {
    const n = altNote;
    altNote = null;
    await n?.undo?.();
  }
  const whyText = () => (suggestWhy(wItem) === 'zone' ? t('Same category and same layer ({zone}), already weighed. The app chooses nothing.', { zone: [wItem.zone, wItem.layer].filter(Boolean).join(', ') }) : t('Same category, already weighed. The app chooses nothing.'));
  const weightSum = $derived(gramsG == null ? t('not weighed') : `${formatWeight(gramsG)} · ${wState}`);

  /* v0.72.0 (Noah 5a): a first aid item is part of the small set (day trips) or only of the full one. */
  const isAid = $derived(!!draft.sets?.includes(AID_KEY));
  const aidSmall = $derived(inSmallAid(draft));
  // v0.37.0 (Noah 4a): clothing that is also a worn bag (a vest with pockets). The switch makes a bag
  // record on Back (backpacks.js); the item stays here as clothing. Saved with "Save".
  const bagsQ = liveQuery(() => db.containers.toArray());
  const alsoBag = $derived(item && $bagsQ ? alsoBagOf(item.id, $bagsQ) : null);
  let alsoTouched = $state(false);
  let alsoOn = $state(false);
  let alsoL = $state('');
  $effect(() => {
    if (alsoTouched || !$bagsQ) return;
    alsoOn = !!alsoBag;
    alsoL = alsoBag?.volumeL ?? '';
  });
  const canBeBag = $derived(!isNew && !readOnly && draft.category !== 'bags');
  let assigning = $state(false);
  // What "Assign …" wrote (building blocks, default bag) comes into the open form, so "Save" keeps it.
  async function assigned() {
    assigning = false;
    const live = await db.items.get(item.id);
    if (live) Object.assign(draft, { sets: [...(live.sets ?? [])], defaultBag: live.defaultBag });
  }

  /*
   * Einheitliche Formulare (Noah 19.10.2026 «2a 3a 4b»): every field is checked at once when «Save» is
   * pressed; each message stands at its field, a line above the buttons counts them, a folded row with a
   * wrong field opens and the cursor goes to the first one. From then on a message leaves once it is right.
   */
  let errors = $state({});
  let tried = $state(false);
  const checkItem = () =>
    checkAll(
      {
        name: [draft.name, { field: t('a name|field'), example: t('Rain jacket'), required: true }],
        ...(!CATEGORY[draft.category] && (isNew || draft.category !== item?.category) ? { category: [null, { field: t('a category|field'), example: t('On-bike clothing'), kind: 'choice', required: true }] } : {}),
        grams: [draft.grams, { field: t('Weight'), example: '320', kind: 'int', min: 1, max: 30000 }],
        qty: [draft.qty, { field: t('Quantity'), example: '2', kind: 'int', min: 1, max: 999, required: true }],
        coldBelow: [draft.coldBelow, { field: t('Colder than'), example: '10', kind: 'number', min: -40, max: 40 }],
        perHours: [draft.perHours, { field: t('Riding hours'), example: '3', kind: 'number', min: 0.5, max: 48 }],
        maxQty: [draft.maxQty, { field: t('At most'), example: '2', kind: 'int', min: 1, max: 99 }],
        waterL: [draft.waterL, { field: t('Water'), example: '0.75', kind: 'number', min: 0.1, max: 20 }],
        stock: [draft.stock, { field: t('At home now'), example: '4', kind: 'int', min: 0, max: 9999 }],
        minStock: [draft.minStock, { field: t('Buy again below'), example: '2', kind: 'int', min: 0, max: 9999 }],
        runH: [draft.runH, { field: t('Battery lasts (h)'), example: '12', kind: 'number', min: 0.1, max: 2000 }],
        chargeH: [draft.chargeH, { field: t('Charging takes (h)'), example: '3', kind: 'number', min: 0.1, max: 200 }],
        mah: [draft.mah, { field: t('Battery (mAh)'), example: '10000', kind: 'int', min: 10, max: 100000 }],
        ports: [draft.ports, { field: t('Sockets'), example: '3', kind: 'int', min: 1, max: 12 }],
        ...(alsoTouched && alsoOn ? { litres: [alsoL, { field: t('Litres'), example: '12', kind: 'number', min: 0.1, max: 100 }] } : {}),
      },
      t,
    );
  $effect(() => {
    if (tried) errors = checkItem();
  });
  const errorCount = $derived(Object.keys(errors).length);
  async function showErrors() {
    await tick();
    const el = dialog?.querySelector('[aria-invalid="true"]');
    if (!el) return;
    // open the folded rows around it (the row «More details» of a new item, the row of the field)
    for (let d = el.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
    await tick();
    el.focus();
    el.scrollIntoView?.({ block: 'center' });
  }

  /*
   * «Rückmeldungen» (Noah 19.10.2026 «2a»): every way out says what happened. «Save», ✕, back and Escape
   * after a change: «Changes to "…" saved.»; a new item: «"…" saved, under {cat}.». A second tap while
   * it saves does nothing (once); a failed save keeps the window and what was typed, with one line why.
   */
  const catName = (c) => t(CATEGORY[c]?.name ?? '') || c;
  const save = once(async (event) => {
    event.preventDefault();
    error = '';
    tried = true;
    errors = checkItem();
    if (Object.keys(errors).length) return showErrors();
    let weightG = null;
    if (String(draft.grams).trim() !== '') weightG = parseGrams(draft.grams);
    // v0.23.0 (AP09): the record is built in gear.js (itemRecord), tested there; the ID never changes.
    const record = itemRecord($state.snapshot(draft), { item, items, weightG });
    let litres = null;
    if (alsoTouched && alsoOn && String(alsoL).trim() !== '') litres = Number(String(alsoL).replace(',', '.'));
    const changed = isNew || JSON.stringify($state.snapshot(draft)) !== (shownAs ?? startText) || alsoTouched;
    clearTimeout(autoTimer);
    await autoBusy;
    try {
      if (autoId && autoId !== record.id) await db.items.delete(autoId);
      await db.items.put(record);
      if (alsoTouched && canBeBag && (alsoOn || alsoBag)) await setAlsoBag(db, record, alsoOn, litres);
    } catch (err) {
      return (error = saveFailed(err));
    }
    ended = true;
    await onsaved?.(record);
    if (isNew && !onsaved) offerDone(t('"{name}" saved, under {cat}.', { name: nameOf(record), cat: catName(record.category) }));
    else if (!isNew && changed) offerDone(t('Changes to "{name}" saved.', { name: nameOf(record) }));
    dialog.close();
  });

  /* ---------- v0.35.0 (AP29): a new item is saved while it is typed ---------- */
  let autoTimer;
  let autoBusy = Promise.resolve();
  let kept = null; // the last record saved this way
  function autoSave() {
    autoBusy = autoBusy.then(async () => {
      if (readOnly || !autoKeep({ isNew, ended, name: draft.name })) return;
      const grams = String(draft.grams ?? '').trim();
      const record = itemRecord($state.snapshot(draft), { item: null, items, weightG: grams ? parseGrams(grams) : null });
      if (autoId && autoId !== record.id) await db.items.delete(autoId);
      await db.items.put(record);
      autoId = record.id;
      kept = record;
    });
    return autoBusy;
  }
  // svelte-ignore state_referenced_locally
  const startText = JSON.stringify(draft); // as the window opened (a name from the search counts only once changed)
  $effect(() => {
    if (!isNew || readOnly) return;
    const now = JSON.stringify(draft); // every field of the new item
    if (!autoKeep({ isNew, name: draft.name, changed: now !== startText || !!autoId })) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(autoSave, 300);
    return () => clearTimeout(autoTimer);
  });
  async function closed() {
    const typed = autoKeep({ isNew, ended, name: draft.name, changed: JSON.stringify($state.snapshot(draft)) !== startText });
    if (!readOnly && !ended && leaveWindow('close', { made: !!autoId, typed }) === 'keep') {
      clearTimeout(autoTimer);
      await autoSave();
      ended = true;
      if (kept) await onkept?.(kept);
      if (kept && !onkept) offerDone(t('"{name}" is saved. You find it under {cat}.', { name: nameOf(kept), cat: catName(kept.category) }));
    }
    onclose?.();
  }
  /* ---------- v0.72.0 «Feinschliff» (Umbenennen 1a + 3a): the pencil opens the one rename sheet ---------- */
  // Also on the phone (the read-only card): a name is tidying up, like merging. Saved at once with Undo;
  // a built-in German name (nameDe) gives way to the new one.
  let renaming = $state(false);
  // svelte-ignore state_referenced_locally
  let shownName = $state(nameOf(item));
  async function rename(name) {
    const live = await db.items.get(item.id);
    if (!live) return;
    const old = { name: live.name, nameDe: live.nameDe };
    await db.items.update(item.id, { name, nameDe: undefined, updatedAt: new Date().toISOString() });
    draft.name = name;
    delete draft.nameDe;
    shownName = name;
    offerRename(name, async () => {
      await db.items.update(item.id, { name: old.name, nameDe: old.nameDe });
      if (dialog?.open) {
        draft.name = old.name;
        if (old.nameDe) draft.nameDe = old.nameDe;
        shownName = nameOf({ ...old });
      }
    });
  }
  // v0.72.0 (Umbenennen 2a): Android back and Escape keep what was changed in an existing item, like «Save»
  // (a new item keeps itself already while it is typed, see closed()).
  // Compared with the form as it stands after the first render: bound fields fill in their defaults
  // then (a checkbox writes favorite: false), which is not a change by the person.
  let shownAs = null;
  $effect(() => {
    tick().then(() => (shownAs ??= JSON.stringify($state.snapshot(draft))));
  });
  const keepOnBack = () => (isNew || mergedInto || !draft.name.trim() || JSON.stringify($state.snapshot(draft)) === (shownAs ?? startText) ? dialog.close() : save({ preventDefault() {} }));

  // «Discard» (Noah 19.10.2026 «3a»): goes at once, with 4 s «Undo»: a new item made here comes back,
  // the changes of an existing item are put back on it.
  async function discard() {
    ended = true;
    clearTimeout(autoTimer);
    await autoBusy;
    if (autoId) {
      const made = kept ?? (await db.items.get(autoId));
      await db.items.delete(autoId);
      if (made) offerDone(t('"{name}" discarded.', { name: nameOf(made) }), async () => {
        await db.items.put(made);
        await onkept?.(made);
      });
    } else if (!isNew && JSON.stringify($state.snapshot(draft)) !== (shownAs ?? startText) && draft.name.trim()) {
      const grams = String(draft.grams ?? '').trim();
      const weightG = grams ? parseGrams(grams) : null;
      const changedRec = grams && weightG == null ? null : itemRecord($state.snapshot(draft), { item, items, weightG });
      offerDone(t('Changes to "{name}" discarded.', { name: nameOf(item) }), changedRec ? () => db.items.put(changedRec) : null);
    }
    dialog.close();
  }

  /* ---------- v0.37.1 "Zusammenlegen mit …": a double goes into its counterpart ---------- */
  let mergeOpen = $state(false);
  let mergedInto = $state.raw(null); // { snap, names } after a merge: the form gives way to "Merged · Undo"
  // v0.45.1 (G014a): on the phone too (read-only card): merging a double is tidying up, not editing.
  const canMerge = $derived(!isNew && item?.ownership !== 'gone');
  const mergedDone = (snap, targets) => (mergedInto = { snap, names: targets.map((x) => nameOf(x)).join(', ') });
  async function unmerge() {
    if (!mergedInto) return;
    await undoBulk(db, mergedInto.snap);
    mergedInto = null;
    dialog.close();
  }

  /* ---------- v0.45.0 (Noah, decision 6): an optional photo of a piece of clothing ---------- */
  // Shrunk on the device (photo.js: JPEG, longest side 1400 px) and kept on the item (item.photo,
  // like bike.photo); saved with "Save", removable. Shown small in the wardrobe.
  const clothing = $derived(isClothing(draft));
  let reading = $state(false);
  let photoErr = $state('');
  async function pickPhoto(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    reading = true;
    photoErr = '';
    try {
      draft.photo = await shrinkImage(file);
    } catch (err) {
      photoErr = err.message;
    } finally {
      reading = false;
    }
  }

  /*
   * «Rückmeldungen» (Noah 19.10.2026 «1a»): the app's own question, then 4 s «Undo». An item still on
   * trips or in templates offers «Archive» first; «Delete» takes it off them too (deleteItems, like
   * the list), so no trip keeps an empty line.
   */
  const remove = once(async () => {
    const name = nameOf(item);
    const plan = await deletePlan(db, [item.id]);
    const trips = ($tripsQ ?? []).filter((x) => (x.entries ?? []).some((e) => e.itemId === item.id)).length;
    const tpls = where.templates.length;
    const used = plan.used.length > 0 || trips > 0;
    const answer = await askDelete({
      title: t('Delete "{name}"?', { name }),
      text: used
        ? t('It is {where} and goes from there too. To keep it but not use it any more: Archive. Then it stays in the look back.', { where: [trips ? tn(trips, 'on {n} trip', 'on {n} trips') : '', tpls ? tn(tpls, 'in {n} template', 'in {n} templates') : ''].filter(Boolean).join(t(' and ')) || t('in use') })
        : t('It is on no trip and in no template. You can bring it back for 4 seconds afterwards.'),
      archive: used && item.ownership !== 'gone' ? t('Archive') : '',
    });
    if (answer === 'archive') {
      try {
        const { snap } = await archiveItems(db, [item.id]);
        offerDone(t('"{name}" archived. It stays in the look back.', { name }), () => undoBulk(db, snap));
      } catch (err) {
        return (error = saveFailed(err));
      }
      ended = true;
      return dialog.close();
    }
    if (answer !== 'delete') return;
    const ok = await deleteWithUndo({ run: () => deleteItems(db, [item.id]), undo: (snap) => undoBulk(db, snap), text: t('"{name}" deleted.', { name }), name });
    if (!ok) return;
    ended = true;
    dialog.close();
  });
</script>

{#snippet photoRow()}
  {#if clothing}
    <div class="wide iphoto">
      {#if draft.photo}<img src={draft.photo} alt={t('Photo of {name}', { name: draft.name })} />{/if}
      <span class="pacts">
        <CameraButton onchange={pickPhoto} disabled={reading} />
        <label class="btn sm">{reading ? t('Reading…') : draft.photo ? t('Other photo') : t('Add photo')}<input type="file" accept="image/*" onchange={pickPhoto} hidden /></label>
        {#if draft.photo}<button type="button" class="btn sm" onclick={() => (draft.photo = null)}>{t('Remove photo')}</button>{/if}
      </span>
      {#if photoErr}<p class="err" role="alert">{photoErr}</p>{/if}
    </div>
  {/if}
{/snippet}

{#snippet movedNote()}
  <p class="wide moved" role="status">{t('New category: {cat}. The ID {id} stays the same, so trips, templates, bags and favourites keep this item.', { cat: t(CATEGORY[draft.category]?.name ?? draft.category), id: draft.id })}</p>
{/snippet}

<!-- v0.63.0 (Noah 1a): one row that folds away; only one is open at a time (onFold). -->
{#snippet fold(key, Icon, title, value, body, badge = '')}
  <details class="fold" data-fold={key} open={openFold === key} ontoggle={(e) => onFold(key, e.currentTarget.open)}>
    <!-- v0.102.0 Design-Refresh P3 (M2): flat rows, a title and its short value, the icon gives way -->
    <summary><span class="ft">{title}</span>{#if badge}<span class="fbadge">{badge}</span>{/if}<span class="fv">{value}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
    <div class="fbody">{@render body()}</div>
  </details>
{/snippet}

<!-- v0.72.0 (Noah 1a, 2a): the row «Weight»: the field, then the lighter alternatives. -->
{#snippet weightBody()}
  <Field id="it-grams" label={t('Weight of one piece (g)')} optional example={t('whole grams, e.g. 320')} error={errors.grams}>
    {#snippet children(f)}<span class="wfield"><input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={draft.grams} placeholder={t('not weighed')} /><span class="wst">{wState}{#if item.ownership !== 'owned'}{' · '}<b>{t(OWNERSHIP[item.ownership] ?? '')}</b>{/if}</span></span>{/snippet}
  </Field>
  {#if wBars.length}
    <ul class="bars" aria-label={t('Weight compared')}>
      {#each wBars as b (b.item.id)}
        <li class:me={b.me}><span class="bn">{nameOf(b.item)}<small>{b.me ? t('this one') : b.auto ? t('Suggestion') : t('linked by you')}</small></span><span class="track"><i style:width="{b.pct}%"></i></span><span class="num bg">{formatWeight(b.g)}</span></li>
      {/each}
    </ul>
  {/if}
  {#if linkedLight}<p class="altl"><ArrowLeftRight size={16} aria-hidden="true" /><span>{t('Lightest alternative: {name}, {g} g less', { name: nameOf(linkedLight.item), g: -linkedLight.diffG })} <small>· {t('linked by you')}</small></span></p>{/if}
  {#each suggested as a (a.item.id)}
    <div class="scard" role="group" aria-label={t('Suggestion: {name}', { name: nameOf(a.item) })}>
      <p class="shead"><Sparkles size={16} aria-hidden="true" /><span class="stag">{t('Suggestion')}</span><b class="sname">{nameOf(a.item)}</b><span class="sless num">{t('{g} g lighter', { g: -a.diffG })}</span></p>
      <p class="swhy">{whyText()}</p>
      <div class="sacts">
        <button type="button" class="btn sm" onclick={() => linkAlt(a)} data-explain={t('Remember as alternative')}><ArrowLeftRight size={16} aria-hidden="true" />{t('As alternative')}</button>
        <button type="button" class="btn sm plain" aria-label={t("Doesn't fit: {name}", { name: nameOf(a.item) })} onclick={() => dismissAlt(a)}><X size={16} aria-hidden="true" />{t("Doesn't fit")}</button>
      </div>
    </div>
  {/each}
  {#if !suggested.length && !linkedLight && gramsG != null}<p class="quiet">{t('No lighter alternative in your gear.')}</p>{/if}
  {#if altNote}
    <p class="altnote" role="status"><Undo2 size={16} aria-hidden="true" /><span>{altNote.text}</span><button type="button" class="btn sm" onclick={undoAlt}>{t('Undo')}</button></p>
  {/if}
{/snippet}

<!-- v0.32.0 (finding 5, stage 1): one question, "Does it come along?", in two words: the place
     "On me" and building blocks. v0.63.0: each its own row that folds away. -->
{#snippet whereBody()}
  <div class="seg" role="group" aria-label={t('Where it goes')}>
    <button type="button" class="segb" aria-pressed={comes.body} onclick={() => Object.assign(draft, setPlace(draft, 'body'))}><UserRound size={18} aria-hidden="true" /> {t('On me')}</button>
    <button type="button" class="segb" aria-pressed={!comes.body} onclick={() => Object.assign(draft, setPlace(draft, 'bag'))}><Briefcase size={18} aria-hidden="true" /> {t('In a bag')}</button>
  </div>
  {#if !comes.body && !readOnly}
    <label class="bagsel"><span class="lbl">{t('Usual bag')}</span>
      <select class="sel" bind:value={draft.defaultBag}>
        {#each bagChoices as b (b.key)}<option value={b.key}>{t(b.name)}</option>{/each}
      </select>
    </label>
  {:else if !comes.body && BAG[draft.defaultBag]}
    <p class="quiet">{t('Usual bag')}: {t(BAG[draft.defaultBag])}</p>
  {/if}
  {#if canBeBag}
    <div class="alsobag">
      <label class="cb"><input type="checkbox" checked={alsoOn} onchange={(e) => { alsoTouched = true; alsoOn = e.currentTarget.checked; }} /> {t('Also a bag on my back (e.g. a vest with pockets)')}</label>
      {#if alsoOn}<Field id="it-litres" class="alsol" label={t('Litres')} optional example={t('e.g. {x}', { x: '12' })} error={errors.litres}>{#snippet children(f)}<input class="inp num" type="text" inputmode="decimal" {...f.attrs} value={alsoL} oninput={(e) => { alsoTouched = true; alsoL = e.currentTarget.value; }} placeholder={t('unknown')} />{/snippet}</Field>
        <p class="quiet">{t('It stays in your clothing and can be chosen as the bag on Back.')}</p>{/if}
    </div>
  {/if}
{/snippet}

<!-- The chips read every block from allSets() as before, so new blocks show up here by themselves. -->
{#snippet blocksBody()}
  <div class="chips" role="group" aria-label={`${t('Comes along')} · ${t('Building blocks')}`}>
    <button type="button" class="chip" aria-pressed={comes.standard} onclick={() => Object.assign(draft, setStandard(draft, !comes.standard))}>
      {#if comes.standard}<Check size={16} aria-hidden="true" />{:else}<Plus size={16} aria-hidden="true" />{/if}
      {t('Standard|block')} <small>{t('every trip')}</small>
    </button>
    {#each blocks.filter((b) => blockKind(b.key) !== 'night') as b (b.key)}{@render blockChip(b)}{/each}
  </div>
  <!-- v0.40.0 (design check R2): "with a night" once as a light subheading, not on every chip. -->
  {#if blocks.some((b) => blockKind(b.key) === 'night')}
    <h4 class="subh" id="night-h">{t('Come with the overnight stay')}</h4>
    <div class="chips" role="group" aria-labelledby="night-h">
      {#each blocks.filter((b) => blockKind(b.key) === 'night') as b (b.key)}{@render blockChip(b)}{/each}
    </div>
  {/if}
  {#if isAid}
    <label class="cb aid"><input type="checkbox" checked={aidSmall} onchange={(e) => (draft.aidSmall = e.currentTarget.checked)} /> {t('Part of the small first aid set (day trips)')}</label>
    <p class="quiet">{t('Day trips bring only the small set, trips with a night the full one. Changeable per trip.')}</p>
  {/if}
  {#if comes.optional}
    <p class="mark"><span class="badge">{t('Stays at home')}</span> <span class="quiet">{t('Marked in a debrief.')}</span> <button type="button" class="btn sm" onclick={() => Object.assign(draft, clearOptional(draft))}>{t('Take it along again')}</button></p>
  {/if}
  <!-- v0.40.0 (design check R1): the explanation folded as "What is a building block? ›". -->
  <details class="whatis">
    <summary><Info size={16} aria-hidden="true" /><span>{t('What is a building block?')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
    <p class="info">{t('A building block is a group of items that comes along together. Standard is on every new trip. The blocks "with a night" come by themselves when the trip has a night; the others you add with one tap when you make a trip.')}</p>
  </details>
{/snippet}

{#snippet blockChip(b)}
  <button type="button" class="chip" aria-pressed={inBlock(b.key)} onclick={() => toggleBlock(b.key)}>
    {#if inBlock(b.key)}<Check size={16} aria-hidden="true" />{:else}<Plus size={16} aria-hidden="true" />{/if}
    {blockLabel(b)}
  </button>
{/snippet}

{#snippet templatesBody()}
  {#if where.templates.length || where.trip}
    <ul class="wl">
      {#each where.templates as n (n)}<li>{t('Template "{name}"', { name: n })}</li>{/each}
      {#if where.trip}<li>{t('Trip "{name}"', { name: where.trip.title })}</li>{/if}
    </ul>
  {:else}<p class="quiet">{t('In no template and not on the current trip.')}</p>{/if}
  <button type="button" class="btn sm" onclick={() => (assigning = true)}>{t('Assign …')}</button>
{/snippet}

{#snippet rulesBody()}
  {#if readOnly}
    <dl class="facts">
      {#if item.ride}<div><dt>{t('Layer')}</dt><dd>{t(RIDES.find((r) => r.key === item.ride)?.name ?? '')}</dd></div>{/if}
      {#if item.coldBelow != null}<div><dt>{t('Add when colder than')}</dt><dd>{item.coldBelow} °C</dd></div>{/if}
      {#if item.rain}<div><dt>{t('Rain')}</dt><dd>{t(RAIN_ITEM[item.rain] ?? '')}</dd></div>{/if}
      {#if item.perHours}<div><dt>{t('Amount')}</dt><dd>{t('1 per {n} h', { n: item.perHours })}{item.maxQty ? `, ${t('at most {n}', { n: item.maxQty })}` : ''}</dd></div>{/if}
      {#if item.replaces}<div><dt>{t('On me, instead of')}</dt><dd>{nameOf(items.find((i) => i.id === item.replaces)) || item.replaces}</dd></div>{/if}
    </dl>
    {#if !item.ride && item.coldBelow == null && !item.rain && !item.perHours && !item.replaces}<p class="quiet">{t('not set')}</p>{/if}
  {:else}
    <div class="layers">
      <Field id="it-ride" label={t('From this ride on')} optional>
        {#snippet children(f)}<select class="sel" {...f.attrs} bind:value={draft.ride}>
          <option value="">–</option>
          {#each RIDES.filter((r) => r.key !== 'every') as r (r.key)}<option value={r.key}>{t(r.name)}</option>{/each}
        </select>{/snippet}
      </Field>
      <Field id="it-cold" label={t('Add when colder than (°C)')} optional example={t('e.g. {x}', { x: String(own.v.coldC) })} error={errors.coldBelow}>
        {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={draft.coldBelow} />{/snippet}
      </Field>
      <Field id="it-rain" label={t('When it rains')} optional>
        {#snippet children(f)}<select class="sel" {...f.attrs} bind:value={draft.rain}>
          <option value="">–</option>
          {#each Object.entries(RAIN_ITEM) as [k, v] (k)}<option value={k}>{v === 'Rain' ? t('Always take it') : t('Offer it')}</option>{/each}
        </select>{/snippet}
      </Field>
      <Field id="it-perh" label={t('1 piece per … riding hours')} optional example={t('e.g. {x}', { x: '3' })} error={errors.perHours}>
        {#snippet children(f)}<input class="inp num" type="text" inputmode="decimal" {...f.attrs} bind:value={draft.perHours} />{/snippet}
      </Field>
      <Field id="it-maxq" label={t('At most … pieces')} optional example={t('e.g. {x}', { x: '2' })} error={errors.maxQty}>
        {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={draft.maxQty} />{/snippet}
      </Field>
      <Field id="it-repl" label={t('On me, instead of')} optional>
        {#snippet children(f)}<select class="sel" {...f.attrs} bind:value={draft.replaces}>
          <option value="">–</option>
          {#each items.filter((i) => (isWorn(i) || inStandard(i)) && i.id !== draft.id) as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
        </select>{/snippet}
      </Field>
      <Field id="it-altfor" label={t('Can be taken instead of')} optional>
        {#snippet children(f)}<select class="sel" {...f.attrs} bind:value={draft.altFor}>
          <option value="">–</option>
          {#each items.filter((i) => i.ride && i.id !== draft.id) as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
        </select>{/snippet}
      </Field>
      <Field id="it-water" label={t('Water in it (L)')} optional example={t('e.g. {x}', { x: '0.75' })} error={errors.waterL}>
        {#snippet children(f)}<input class="inp num" type="text" inputmode="decimal" {...f.attrs} bind:value={draft.waterL} />{/snippet}
      </Field>
    </div>
  {/if}
{/snippet}

<!-- Paket H «Packen leichter»: where it is at home (#372), the supply (answer 2b) and the battery (#346). -->
{#snippet storeBody()}
  <p class="note">{t('All optional. With an expiry date the app reminds you 2 weeks before. With a stock it puts the item on the shopping list when it runs low.')}</p>
  <div class="grid pair">
    <Field id="it-spot" class="wide" label={t('Where it is at home')} optional example={t('e.g. {x}', { x: t('Cellar, blue box') })}>
      {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={draft.homeSpot} />{/snippet}
    </Field>
    <Field id="it-exp" label={t('Best before')} optional>
      {#snippet children(f)}<input class="inp" type="date" {...f.attrs} bind:value={draft.expires} />{/snippet}
    </Field>
    <Field id="it-stock" label={t('At home now')} optional example={t('e.g. {x}', { x: '4' })} error={errors.stock}>
      {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={draft.stock} />{/snippet}
    </Field>
    <Field id="it-min" label={t('Buy again below')} optional example={t('e.g. {x}', { x: '2' })} error={errors.minStock}>
      {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={draft.minStock} />{/snippet}
    </Field>
    {#if charges}
      <Field id="it-run" label={t('Battery lasts (h)')} optional example={t('e.g. {x}', { x: '12' })} error={errors.runH}>
        {#snippet children(f)}<input class="inp num" type="text" inputmode="decimal" {...f.attrs} bind:value={draft.runH} />{/snippet}
      </Field>
      <Field id="it-chg" label={t('Charging takes (h)')} optional example={t('e.g. {x}', { x: '3' })} error={errors.chargeH}>
        {#snippet children(f)}<input class="inp num" type="text" inputmode="decimal" {...f.attrs} bind:value={draft.chargeH} />{/snippet}
      </Field>
      <!-- Strombudget (Noah 19.10.2026 «2a»): the battery size and the sockets, for Material › Strom -->
      <Field id="it-mah" label={t('Battery (mAh)')} optional example={t('e.g. {x}', { x: '10000' })} error={errors.mah}>
        {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={draft.mah} />{/snippet}
      </Field>
      {#if ['bank', 'charger'].includes(powerRole(draft))}
        <Field id="it-ports" label={t('Sockets')} optional example={t('e.g. {x}', { x: '3' })} error={errors.ports}>
          {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={draft.ports} />{/snippet}
        </Field>
      {/if}
    {/if}
  </div>
  <p class="note"><a href="#/gear/supplies">{t('All supplies and the shopping list ›')}</a></p>
  {#if charges}<p class="note"><a href="#/gear/power">{t('Does the power last? Power budget ›')}</a></p>{/if}
{/snippet}

<!-- v0.63.0: name, category and status of an existing item sit here with brand, model, note and areas. -->
{#snippet detailsBody()}
  {#if readOnly}
    <!-- v0.23.1 (Noah 5b): on the phone too the category can change; the ID stays. -->
    <div class="grid pair">
      <label class="wide">
        <span class="lbl">{t('Category')}</span>
        <select class="sel" bind:value={draft.category}>
          {#if !CATEGORY[draft.category]}<option value={draft.category} disabled>{draft.category ? draft.category : t('Choose a category')}</option>{/if}
          {#each choosable(item?.category) as c (c.key)}<option value={c.key}>{t(c.name)}</option>{/each}
        </select>
      </label>
      {@render photoRow()}
      {#if moved}{@render movedNote()}{/if}
    </div>
    <dl class="facts">
      {#if item.brand}<div><dt>{t('Brand')}</dt><dd>{item.brand}</dd></div>{/if}
      {#if item.model}<div><dt>{t('Model')}</dt><dd>{item.model}</dd></div>{/if}
      <div><dt>{t('Status')}</dt><dd>{t(OWNERSHIP[item.ownership] ?? '')}</dd></div>
      {#if item.favorite}<div><dt>{t('Favourite')}</dt><dd>★ {item.favNote || t('Tested, one of my best items')}</dd></div>{/if}
      <div><dt>{t('Areas')}</dt><dd>{itemDomains(item).map((d) => t(domainName(d))).join(', ')}</dd></div>
      <!-- v0.36.0: the fields of the reviewed gear list (gear import), read only. -->
      {#if item.zone || item.layer}<div><dt>{t('Body zone')}</dt><dd>{[item.zone, item.layer].filter(Boolean).join(' · ')}</dd></div>{/if}
      {#if item.tempMin != null || item.tempMax != null || item.tempClass}<div><dt>{t('Temperature')}</dt><dd>{[item.tempMin != null || item.tempMax != null ? `${item.tempMin ?? '…'} – ${item.tempMax ?? '…'} °C` : '', item.tempClass].filter(Boolean).join(' · ')}</dd></div>{/if}
      {#if item.rule}<div><dt>{t('Rule')}</dt><dd>{item.rule}</dd></div>{/if}
      {#if item.sourceId}<div><dt>{t('Source ID')}</dt><dd>{item.sourceId}</dd></div>{/if}
      {#if item.qty > 1}<div><dt>{t('Quantity')}</dt><dd>{item.qty} × {formatWeight(item.weightG)} = {formatWeight(itemWeight(item))}</dd></div>{/if}
    </dl>
    {#if item.learning}<p class="note"><b>{t('Learning:')}</b> {item.learning}</p>{/if}
    {#if item.note}<p class="note">{item.note}</p>{/if}
  {:else}
    <div class="grid">
      {#if !isNew}
        {@render nameField()}
        {@render categoryField()}
        {@render statusField()}
        {@render photoRow()}
        {#if moved}{@render movedNote()}{/if}
      {/if}
      <Field id="it-brand" label={t('Brand')} optional example={t('e.g. {x}', { x: 'Garmin' })}>
        {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={draft.brand} />{/snippet}
      </Field>
      <Field id="it-model" label={t('Model / colour')} optional example={t('e.g. {x}', { x: 'Edge 1040 Solar' })}>
        {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={draft.model} />{/snippet}
      </Field>
      <Field id="it-qty" label={t('Quantity')} example={t('pieces you own, e.g. 2')} error={errors.qty}>
        {#snippet children(f)}<input class="inp num" type="number" inputmode="numeric" min="1" {...f.attrs} bind:value={draft.qty} />{/snippet}
      </Field>
      <label class="cb wide"><input type="checkbox" bind:checked={draft.favorite} /> ★ {t('Favourite (tested, one of my best items)')}</label>
      {#if draft.favorite}
        <Field id="it-favnote" class="wide" label={t('Why it is a favourite')} optional example={t('e.g. Warm, packs small, never let me down')}>
          {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={draft.favNote} />{/snippet}
        </Field>
      {/if}
      <!-- v0.21.0 (package 5): one inventory, an item can belong to several areas. -->
      <fieldset class="wide sets">
        <legend class="lbl">{t('Areas (new trips of an area suggest its items)')}</legend>
        <!-- Paket H (#55): «Everywhere»: head torch, power bank and the like belong to every area -->
        <label class="cb"><input type="checkbox" checked={draft.domains?.includes(EVERYWHERE)} onchange={(e) => (draft.domains = e.currentTarget.checked ? [EVERYWHERE] : ['bikepacking'])} /> <b>{t('Everywhere|areas')}</b></label>
        {#if !draft.domains?.includes(EVERYWHERE)}
        {#each DOMAINS as d (d.key)}
          {@const on = draft.domains?.includes(d.key)}
          <label class="cb"><input type="checkbox" checked={on} disabled={on && draft.domains.length === 1} onchange={(e) => (draft.domains = e.currentTarget.checked ? [...(draft.domains ?? []), d.key] : (draft.domains ?? []).filter((x) => x !== d.key))} /> {t(d.name)}</label>
        {/each}
        {/if}
      </fieldset>
      <!-- v0.97.0 «Skitouren»: the group in the ski backpack check (only for items of the area ski) -->
      {#if draft.domains?.includes('ski')}
        <label class="wide"><span class="lbl">{t('Ski tour group')}</span>
          <select class="sel" bind:value={draft.skiGroup}>
            <option value="">{t('automatic: {group}', { group: t(SKI_GROUP[skiGroupOf({ ...draft, skiGroup: '' })].name) })}</option>
            {#each SKI_GROUPS as g (g.key)}<option value={g.key}>{t(g.name)}</option>{/each}
          </select>
        </label>
      {/if}
      <Field id="it-note" class="wide" label={t('Note')} optional>
        {#snippet children(f)}<textarea class="inp" rows="2" {...f.attrs} bind:value={draft.note}></textarea><SpeakButton wrap onsaid={(w) => (draft.note = appendSpoken(draft.note ?? '', w))} />{/snippet}
      </Field>
      <!-- v0.36.0: from the reviewed gear list (gear import); kept as they are when saving. -->
      {#if draft.sourceId || draft.rule || draft.zone || draft.layer || draft.tempClass}
        <p class="note wide">{[draft.sourceId && `${t('Source ID')}: ${draft.sourceId}`, (draft.zone || draft.layer) && `${t('Body zone')}: ${[draft.zone, draft.layer].filter(Boolean).join(' · ')}`, draft.tempClass && `${t('Temperature')}: ${draft.tempClass}`, draft.rule && `${t('Rule')}: ${draft.rule}`].filter(Boolean).join(' · ')}</p>
      {/if}
      {#if item?.learning}<p class="note wide"><b>{t('Learning:')}</b> {item.learning}</p>{/if}
    </div>
  {/if}
{/snippet}

{#snippet nameField()}
  <Field id="it-name" class="wide" label={t('Name')} example={t('e.g. {x}', { x: t('Rain jacket') })} error={errors.name}>
    {#snippet children(f)}<input class="inp" {...f.attrs} bind:value={draft.name} enterkeyhint="done" />{/snippet}
  </Field>
  {#if sugShown}
    {@const v = sugShown.values}
    <div class="wide sugv" role="status">
      <p>{sugShown.from === 'own' ? t('Like «{name}»:', { name: nameOf(sugShown.like) }) : t('Usual values:')} {[v.category && t(CATEGORY[v.category]?.name ?? v.category), v.grams != null && formatWeight(v.grams), v.defaultBag && t(BAG[v.defaultBag] ?? v.defaultBag), v.brand, v.runH != null && t('runs {h} h', { h: v.runH }), v.chargeH != null && t('charges {h} h', { h: v.chargeH })].filter(Boolean).join(' · ')}</p>
      <span><button type="button" class="btn sm" onclick={useSug}>{t('Use|values')}</button><button type="button" class="text-button" onclick={() => (sugOff = draft.name.trim())}>{t('No, thanks')}</button></span>
    </div>
  {/if}
{/snippet}

{#snippet categoryField()}
  <Field id="it-cat" label={t('Category')} error={errors.category}>
    {#snippet children(f)}<select class="sel" {...f.attrs} bind:value={draft.category}>
      {#if !CATEGORY[draft.category]}<option value={draft.category} disabled>{draft.category ? draft.category : t('Choose a category')}</option>{/if}
      {#each choosable(item?.category) as c (c.key)}<option value={c.key}>{t(c.name)}</option>{/each}
    </select>{/snippet}
  </Field>
{/snippet}

<!-- v0.40.0 (design check R4): the status as a segment "Owned · Wishlist · Gone"; the two rarer
     ones (Unclear, To buy) one tap further, never lost. -->
{#snippet statusField()}
  <div class="wide status">
    <span class="lbl" id="status-h">{t('Status')}</span>
    <Seg labelledby="status-h" options={statusSeg} value={draft.ownership} onchange={(k) => (draft.ownership = k)} />
    {#if statusMore.length}
      <details class="moreStat" open={statusMore.some((k) => k === draft.ownership)}>
        <summary>{t('Other status')}</summary>
        <Seg label={t('Other status')} full={false} options={statusMore.map((k) => ({ key: k, name: t(OWNERSHIP[k]) }))} value={draft.ownership} onchange={(k) => (draft.ownership = k)} />
      </details>
    {/if}
  </div>
{/snippet}

{#snippet lifeBody()}
  <ItemLife item={$liveQ ?? item} items={allItems} stats={life.stats} log={life.log} {today} weight={false} />
{/snippet}

<!-- v0.72.0 (Noah 1a): the rows in Noah's order: weight, where, blocks, weather, its history, name …, templates. -->
<!-- v0.102.0 Design-Refresh P3 (M2): the rarer actions in one last row «More» (rename, merge, delete) -->
{#snippet moreBody()}
  <div class="moreacts">
    <button type="button" class="btn" onclick={() => (renaming = true)}><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>
    {#if canMerge}<button type="button" class="btn" onclick={() => (mergeOpen = true)}>{t('Merge with …')}</button>{/if}
    {#if !readOnly}<button type="button" class="btn del" onclick={remove}>{t('Delete')}</button>{/if}
  </div>
{/snippet}

{#snippet rows()}
  {#if !isNew}{@render fold('weight', Scale, t('Weight'), weightSum, weightBody, suggested.length ? tn(suggested.length, '{n} suggestion', '{n} suggestions') : '')}{/if}
  {@render fold('where', MapPin, t('Where it goes'), placeName(draft), whereBody)}
  {@render fold('blocks', Package, t('Building blocks'), blockNames(draft, blocks).join(' · ') || t('no block'), blocksBody)}
  {@render fold('rules', Route, t('For weather and riding time'), ruleLine, rulesBody)}
  {#if !isNew && life}{@render fold('life', CalendarClock, t('History|item'), lifeSum, lifeBody)}{/if}
  {@render fold('store', Warehouse, t('At home and supply'), storeLine, storeBody)}
  {@render fold('details', FileText, isNew ? t('Brand, model, note') : t('Name, brand, note'), detailLine || t(CATEGORY[draft.category]?.name ?? ''), detailsBody)}
  {#if !isNew}
    <!-- SK X1 + X13 (SKX1): the maker's instructions (your link) and iFixit; X7 for a wish: the shop (your link) -->
    {#if draft.ownership === 'wishlist' || draft.ownership === 'to-buy'}
      <Woanders context={nameOf(item)} links={[{ kind: 'x7', slot: slotOf('x7', item.id), icon: 'shop', sub: '' }]} />
    {:else}
      <Woanders context={nameOf(item)} links={[{ kind: 'x1', slot: slotOf('x1', item.id), icon: 'book', sub: t('Care and washing') }, { kind: 'x13', href: ifixitUrl(item), icon: 'hammer', sub: t('Guide at iFixit') }]} />
    {/if}
  {/if}
  {#if !isNew && draft.ownership !== 'wishlist' && draft.ownership !== 'to-buy'}
    <!-- AU1 «Ausrüstung» (Noah 15.10.2026 «3a»): an item of Material becomes main equipment of a sport -->
    <a class="btn mainq" href="#/equipment?add={encodeURIComponent(item.id)}" onclick={() => dialog.close()} data-main-gear>{($liveQ ?? item)?.main ? t('Main equipment: counter and care') : t('Make it main equipment')}</a>
  {/if}
  {#if !isNew}{@render fold('templates', Layers, t('In templates'), `${where.templates.length}${where.trip ? ` · ${t('on the current trip')}` : ''}`, templatesBody)}{/if}
  {#if !isNew}{@render fold('more', Ellipsis, t('More|item'), [t('Rename'), canMerge ? t('Merge with …') : '', readOnly ? '' : t('Delete')].filter(Boolean).join(', '), moreBody)}{/if}
{/snippet}

<dialog class="sheet" bind:this={dialog} use:backClose={keepOnBack} onclose={closed} aria-labelledby="item-h">
  {#if mergedInto}
    <p class="meta">{t('Merge|items')}</p>
    <h2 id="item-h" class="title">{nameOf(item)}</h2>
    <p class="merged" role="status">{t('Merged into {names}. The item is now under Gone; past trips keep it.', { names: mergedInto.names })}</p>
    <div class="foot">
      <button type="button" class="btn" onclick={unmerge}>{t('Undo')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button>
    </div>
  {:else}
  <form onsubmit={save} novalidate use:weiter>
    <p class="meta">
      <span class="sw" style:background={CATEGORY[draft.category]?.color}></span>
      {t(CATEGORY[draft.category]?.name ?? '')}{draft.id ? ` · ${draft.id}` : ''}
    </p>
    <h2 id="item-h" class="title">{#if isNew}{t('Add item')}{:else}<span>{shownName}</span><button type="button" class="pen" aria-label={t('Rename {name}', { name: shownName })} title={t('Rename')} onclick={() => (renaming = true)}><Pencil size={18} aria-hidden="true" /></button>{/if}</h2>
    <!-- v0.102.0 Design-Refresh P3 (M2): close at the top right (after the title, so the focus starts at the name) -->
    <button type="button" class="x" aria-label={t('Close')} onclick={() => closeKeep(dialog)}><X size={20} aria-hidden="true" /></button>

    {#if isNew}
      <!-- v0.23.0 (AP08): the four main fields first; the rest folds away under "More details". -->
      <div class="grid">
        {@render nameField()}
        {@render categoryField()}
        {@render statusField()}
        <!-- FE14: the «?» sits next to the label, outside it, so the field keeps its name -->
        <Field id="it-grams" class="wide" label={t('Weight of one piece (g)')} optional help={t(FIELD_HELP.grams)} example={t('whole grams, e.g. 320')} error={errors.grams}>
          {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={draft.grams} placeholder={t('not weighed')} />{/snippet}
        </Field>
        {@render photoRow()}
        {#if moved}{@render movedNote()}{/if}
      </div>
      <details class="more" bind:open={more}>
        <summary>{t('More details')} <small>{t('where it goes, building blocks, weather, brand, note')}</small></summary>
        {@render rows()}
      </details>
    {:else}
      <!-- v0.72.0 (Noah 1a): one summary line, then the rows (the weight field is in the row «Weight»). -->
      <div class="top">
        <p class="sumline" data-testid="comes-line">{summary}</p>
      </div>
      <div class="rows">{@render rows()}</div>
    {/if}

    {#if tried && errorCount}<p class="fsum" role="alert">{tn(errorCount, '{n} entry is missing or wrong. It is marked in red.', '{n} entries are missing or wrong. They are marked in red.')}</p>{/if}
    <p class="err" role="alert">{error}</p>
    <!-- v0.102.0 Design-Refresh P3 (M2): «Cancel» and «Save» at the bottom right; merge and delete are in «More» -->
    <div class="foot daumen-foot">
      {#if isNew && autoId}<span class="kept" role="status"><Check size={14} aria-hidden="true" />{t('Saved')}</span><button type="button" class="btn" onclick={discard}>{t('Discard')}</button>
      {:else}<button type="button" class="btn" onclick={discard}>{t('Discard')}</button>{/if}
      <button type="submit" class="btn hi">{t('Save')}</button>
    </div>
  </form>
  {/if}
</dialog>

{#if mergeOpen}<MergeSheet {item} items={allItems} onmerged={mergedDone} onclose={() => (mergeOpen = false)} />{/if}

{#if renaming}
  <RenameSheet kicker={t('Gear item')} title={t('Rename item')} value={shownName} hint={t('Counts everywhere: gear, packing lists, templates.')} onsave={rename} onclose={() => (renaming = false)} />
{/if}

{#if assigning}<AssignDialog ids={[item.id]} {item} onclose={assigned} />{/if}

<style>
  /* v0.45.0 (decision 6): the photo of a piece of clothing, small, with its two buttons. */
  .iphoto {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .iphoto img {
    width: 88px;
    height: 88px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid var(--line);
  }
  .iphoto .pacts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .iphoto .btn {
    min-height: 44px;
  }
  .alsobag {
    margin-top: 8px;
  }
  .alsobag .cb {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  :global(.fld-u.alsol) {
    max-width: 200px;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  h2 {
    font-size: var(--fs-section);
    margin: 4px 0 14px;
  }
  h2 .pen {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -8px 0 -8px 4px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    vertical-align: middle;
    cursor: pointer;
  }
  h2 .pen:hover {
    background: var(--paper-2);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .wide,
  .grid > :global(.fld-u.wide) {
    grid-column: 1 / -1;
  }
  /* Einheitliche Formulare: the grids keep their own gaps */
  .grid > :global(.fld-u),
  .layers > :global(.fld-u),
  .wrow :global(.fld-u) {
    margin: 0;
  }
  .fsum {
    margin: 8px 0 0;
    color: var(--bad);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  @media (max-width: 480px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  /* v0.23.1 (Noah 5b): category and weight side by side, also on a phone; stacked when very narrow */
  .grid.pair {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .pair label {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-width: 0;
  }
  .pair .sel {
    width: 100%;
    min-width: 0;
  }
  @media (max-width: 359px) {
    .grid.pair {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .sets {
    border: 0;
    min-width: 0;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
  }
  .layers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px 12px;
  }
  .sets legend {
    margin-bottom: 4px;
  }
  /* v0.63.0 (Noah 1a): the top: the weight with its status and one summary line, then the rows. */
  .top {
    display: grid;
    gap: 8px;
    margin-bottom: 14px;
  }
  .wrow {
    display: grid;
    gap: 4px;
  }
  .wfield {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }
  .wfield .inp {
    width: 9ch;
    min-width: 0;
  }
  .wst {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wst b {
    color: var(--ink-2);
    font-weight: 600;
  }
  .sumline {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .fbadge {
    flex: none;
    font-size: var(--fs-small);
    font-weight: 600;
    border-radius: 99px;
    padding: 1px 8px;
    background: var(--warn-soft);
    color: var(--warn);
    white-space: nowrap;
  }
  /* v0.72.0 (Noah 2a): bars and the suggestion card in the row «Weight». */
  .bars {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .bars li {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(48px, 1fr) auto;
    align-items: center;
    gap: 10px;
    font-size: var(--fs-small);
  }
  .bn {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .bn small {
    display: block;
    color: var(--ink-3);
  }
  .track {
    height: 8px;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .track i {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--ok);
  }
  .bars .me .track i {
    background: var(--ink-3);
  }
  .bg {
    font-weight: 600;
    white-space: nowrap;
  }
  .altl {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .altl :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .altl small {
    color: var(--ink-3);
  }
  .scard {
    margin: 12px 0 0;
    padding: 12px;
    border: 1.5px solid var(--ok);
    border-radius: var(--radius);
    background: var(--ok-soft);
  }
  .shead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 0;
  }
  .shead :global(svg) {
    flex: none;
  }
  .stag {
    font-size: var(--fs-small);
    font-weight: 600;
    border-radius: 99px;
    padding: 1px 8px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .sname {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .sless {
    margin-left: auto;
    font-weight: 700;
    color: var(--ok);
    white-space: nowrap;
  }
  .swhy {
    margin: 6px 0 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .sacts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .sacts .btn,
  .altnote .btn {
    min-height: 44px;
  }
  .sacts .plain {
    border-color: transparent;
    background: none;
    color: var(--ink-2);
  }
  .altnote {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 10px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .altnote span {
    flex: 1 1 10em;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .aid {
    min-height: 44px;
    margin-top: 10px;
  }
  .rows {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    border-top: 1px solid var(--line);
  }
  .rows .fold {
    margin-top: 0;
    min-width: 0;
  }
  .fbody .grid.pair {
    margin-bottom: 10px;
  }
  /* v0.32.0 (finding 5, stage 1): a segmented toggle for the place, chips for the blocks. */
  .seg {
    display: inline-flex;
    max-width: 100%;
    border: 1.5px solid var(--line-strong);
    border-radius: 999px;
    padding: 2px;
    background: var(--paper);
  }
  .segb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 16px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font: 600 var(--fs-body) var(--font-body);
    cursor: pointer;
    min-width: 0;
  }
  .segb[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .bagsel {
    display: grid;
    margin-top: 8px;
    max-width: 320px;
  }
  .quiet {
    font-size: var(--fs-small);
    color: var(--ink-3);
    margin: 6px 0 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 14px 4px 10px;
    border: 1.5px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body) var(--font-body);
    cursor: pointer;
    max-width: 100%;
    text-align: left;
  }
  .chip:hover {
    border-color: var(--line-strong);
  }
  .chip small {
    font-weight: 500;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .chip[aria-pressed='true'] {
    background: var(--ok-soft);
    border-color: var(--ok);
  }
  .chip[aria-pressed='true'] small {
    color: var(--ok);
  }
  .mark {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin: 10px 0 0;
  }
  .mark .quiet {
    margin: 0;
  }
  .badge {
    font-size: var(--fs-small);
    font-weight: 600;
    border-radius: 99px;
    padding: 2px 10px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .info {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .info :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .whatis {
    margin-top: 8px;
  }
  .whatis > summary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .whatis > summary::-webkit-details-marker {
    display: none;
  }
  .whatis[open] > summary :global(.chev) {
    transform: rotate(90deg);
  }
  .whatis .info {
    margin-top: 0;
  }
  .subh {
    margin: 12px 0 6px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-3);
  }
  .status .lbl {
    display: block;
  }
  .moreStat > summary {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    cursor: pointer;
  }
  /* Gesamttest 20.10.2026 Design 4: no native triangle, the app's one arrow › */
  .moreStat > summary {
    gap: 6px;
    list-style: none;
  }
  .moreStat > summary::-webkit-details-marker {
    display: none;
  }
  .moreStat > summary::after {
    content: '›' / '';
    display: inline-block;
    transition: transform 0.15s;
  }
  .moreStat[open] > summary::after {
    transform: rotate(90deg);
  }
  /* v0.102.0 Design-Refresh P3 (M2): flat rows with a line between, the title bold and its value beside it */
  .fold {
    margin-top: 0;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .fold summary {
    list-style: none;
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 2px 10px;
    min-height: 48px;
    padding: 12px 28px 12px 0;
    position: relative;
    cursor: pointer;
  }
  .fold summary::-webkit-details-marker {
    display: none;
  }
  .ft {
    font-weight: 600;
    flex: none;
    white-space: nowrap;
  }
  .fv {
    flex: 1 1 12em;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fold summary :global(.chev) {
    position: absolute;
    right: 2px;
    top: 15px;
  }
  .fold :global(.chev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .fold[open] :global(.chev) {
    transform: rotate(90deg);
  }
  .fbody {
    padding: 0 0 14px;
  }
  .moreacts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .moreacts .del {
    margin-left: 0;
  }
  /* the close button top right */
  form {
    position: relative;
  }
  .x {
    position: absolute;
    top: 0;
    right: 0;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .x:hover {
    background: var(--line);
  }
  .meta,
  form > h2 {
    padding-right: 52px;
  }
  .wl {
    margin: 0 0 8px;
    padding-left: 18px;
    font-size: var(--fs-body);
  }
  .wl li {
    overflow-wrap: break-word;
  }
  .moved {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
    border-left: 3px solid var(--hi);
    padding-left: 8px;
  }
  .more {
    margin-top: 14px;
    border-top: 1px solid var(--line);
    padding-top: 8px;
  }
  .more summary {
    list-style: none;
    cursor: pointer;
    font-weight: 600;
    min-height: 40px;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    padding-top: 8px;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more summary::before {
    content: '›' / ''; /* Gesamttest 20.10.2026 Design 4: the app's one arrow; screen readers skip it */
    display: inline-block;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .more[open] summary::before {
    transform: rotate(90deg);
  }
  .more summary small {
    font-weight: 400;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .more .grid {
    margin-top: 10px;
  }
  .cb {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .facts {
    display: grid;
    gap: 6px;
    margin: 0 0 12px;
  }
  .facts div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 4px;
  }
  dt {
    color: var(--ink-3);
  }
  dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }
  .note {
    font-size: var(--fs-small);
    color: var(--ink-2);
    margin: 10px 0;
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    font-size: var(--fs-small);
  }
  .foot {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
  }
  .kept {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .quiet {
    border-color: transparent;
    background: none;
    color: var(--ink-2);
  }
  .quiet:hover,
  .quiet:focus-visible {
    border-color: var(--line-strong);
    color: var(--ink);
  }
  .merged {
    margin: 8px 0 14px;
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
  .mainq {
    justify-self: start;
  }
  /* Paket H #348: the suggested values under the name of a new item */
  .sugv { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; margin: -4px 0 4px; padding: 8px 12px; border-radius: 8px; background: var(--paper-2); }
  .sugv p { flex: 1 1 220px; margin: 0; color: var(--ink-2); font-size: var(--fs-small); overflow-wrap: break-word; }
  .sugv span { display: flex; align-items: center; gap: 8px; }
</style>
