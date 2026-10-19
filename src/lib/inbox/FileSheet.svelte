<script>
  import { backClose } from '../ui/backclose.js'; // Regeln der App (14.10.2026): back closes this window first
  /**
   * v0.48.0 «Ablegen als …» (Noah 6a, 7a): one sheet per entry. First the 7 targets (the app's
   * suggestion on top, marked), then one short form for the chosen target with ONE main button named
   * by where the entry lands. A receipt asks for bike, shop, date and amount (the work is optional)
   * and becomes a workshop visit with the photo. «Anderes Ziel wählen» goes back to the list.
   * Impeccable (18.10.2026): `direct` opens straight on the suggested target's form (the row's button named
   * it); the 7 tiles are folded behind «Anderes Ziel wählen». Without `direct` (••• › «Woanders ablegen …») as before.
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import DateInput from '../ui/DateInput.svelte';
  import { TARGETS, TARGET, LANDS, guessTarget, shopsOf, receiptName, TOPICS, guessTopic, VISIT_JOBS } from '../inbox.js';
  import { fileTo } from '../inboxdb.js';
  import { guessBike } from '../notes.js';
  import { parseChf } from '../hubs.js';
  import { choosable, parseGrams } from '../gear.js';
  import { localDay } from '../localday.js';
  import { t, locale } from '../i18n.svelte.js';
  import { ICONS } from './icons.js';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import { shrinkImage } from '../photo.js';
  import { ReceiptText, Check, X, Plus, Paperclip } from '@lucide/svelte';
  import { tipOf, amountOf, ibanOf, eventFrom, dayOfNote } from '../mailin.js';
  import { db } from '../db.js';
  import { loadLists } from '../listsdb.js';
  import { saveList } from '../lists.js';
  import { OVERRIDES_KEY, overrideOf } from '../standard.js';
  import '../bikes/velo-dlg.css';

  let { note, direct = false, bikes = [], trips = [], visits = [], rules = null, start = null, onclose, onfiled } = $props();

  /** The main button of each form, named by where the entry lands (U1). */
  const SAVE = { receipt: 'File as workshop visit', problem: 'Into bike care', material: 'Into Gear', wish: 'Onto the wishlist', idea: 'Save as idea', tour: 'Into the debrief', newtrip: 'Make the trip', bill: 'Into «To pay»', event: 'Into the calendar', task: 'Into the tasks', doc: 'Into Documents', list: 'Onto the list', keep: 'Keep as note' };
  /** Jobs a receipt often lists (optional); since v0.125.0 shared with the workshop visit window (inbox.js). */
  const JOBS = VISIT_JOBS;

  let dialog;
  // svelte-ignore state_referenced_locally
  const suggest = guessTarget(note, { trips, rules });
  // «Mail in die App» 3a: the tip under the title (a booking, a deadline, a bill); it only fills the form
  // svelte-ignore state_referenced_locally
  const tip = tipOf(note, { trips, rules });
  // Design-Refresh P9 (I4): the suggestion is chosen from the start; one tap on another tile changes it.
  // svelte-ignore state_referenced_locally
  let kind = $state(start && TARGET[start] ? start : suggest);
  // svelte-ignore state_referenced_locally
  let tiles = $state(!direct);
  // svelte-ignore state_referenced_locally
  let bike = $state(guessBike(note.text ?? '', bikes, note.bikeId ?? null) ?? bikes[0]?.id ?? null);
  const today = localDay();
  let shop = $state('');
  let newShop = $state(false);
  let date = $state(today);
  let chf = $state('');
  let jobs = $state([]);
  // svelte-ignore state_referenced_locally
  let name = $state(note.text ?? '');
  let category = $state('tools');
  let grams = $state('');
  // svelte-ignore state_referenced_locally
  let trip = $state(note.tripId ?? tip?.trip?.id ?? null);
  // svelte-ignore state_referenced_locally
  let topic = $state(guessTopic(note.text ?? ''));
  let msg = $state('');
  let busy = $state(false);
  // «Mail in die App»: the fields of the six new targets, filled once from the entry
  // svelte-ignore state_referenced_locally
  const first = note;
  const head = (first.mail?.subject || (first.text ?? '').split('\n')[0] || '').trim().slice(0, 120);
  const ev = eventFrom(first, today);
  const docable = (first.files ?? []).filter((f) => ['pdf', 'photo', 'pkpass'].includes(f.kind) && !f.done);
  let docName = $state(head);
  let docFiles = $state(docable.map((f) => f.id));
  let docText = $state(!docable.length);
  let billTo = $state(first.mail?.fromName || '');
  let billAmount = $state(amountOf(first.text) != null ? String(amountOf(first.text)) : '');
  let billDue = $state(tip?.deadline?.day ?? '');
  let billIban = $state(ibanOf(first.text));
  let billPdf = $state((first.files ?? []).some((f) => f.kind === 'pdf' && !f.done));
  let evTitle = $state(ev.title);
  let evDay = $state(tip?.booking?.day ?? ev.day);
  let evFrom = $state(ev.from);
  let taskTitle = $state(head);
  let taskDue = $state(tip?.deadline?.day ?? first.due ?? '');
  let lists = $state([]);
  let listId = $state('');
  let newListName = $state('');
  loadLists(db).then((l) => ((lists = l), (listId = l[0]?.id ?? '')));
  let tripTitle = $state(first.plan?.title ?? head);
  let tripStart = $state(dayOfNote(first, today));
  let tripDays = $state(String(first.plan?.days ?? 1));
  // «oder neue Ablage erstellen» (Noah 19.10.2026): an own place for notes, made here (a note topic, so it can be
  // renamed and deleted under «Listen und Typen» like every group)
  let newTopic = $state(false);
  let topicName = $state('');
  // Kamera-Knopf (Noah, 14.10.2026 «bei Belegen immer»): a receipt note without a photo gets one here
  let photo = $state(null);
  let reading = $state(false);
  async function addPhoto(file) {
    reading = true;
    msg = '';
    try {
      photo = await shrinkImage(file, 1200, 0.8);
    } catch (err) {
      msg = err.message || t('This photo could not be read.');
    } finally {
      reading = false;
    }
  }

  const shops = $derived(shopsOf(visits));
  const tripList = $derived([...trips].filter((x) => !x.skipped).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')).slice(0, 8));
  $effect(() => {
    if (!trip && tripList[0]) trip = tripList[0].id;
  });
  $effect(() => {
    if (!shop && shops[0]) shop = shops[0].shop;
  });
  const order = [TARGET[suggest], ...TARGETS.filter((x) => x.key !== suggest)];

  $effect(() => {
    dialog.showModal();
  });

  const toggleJob = (j) => (jobs = jobs.some((x) => x.part === j.part) ? jobs.filter((x) => x.part !== j.part) : [...jobs, j]);

  async function save() {
    msg = '';
    const b = bikes.find((x) => x.id === bike) ?? null;
    let opts = {};
    if (kind === 'receipt') {
      if (!b) return (msg = t('Choose a bike.'));
      if (!shop.trim()) return (msg = t('Name the bike shop.'));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return (msg = t('Choose the date of the visit.'));
      const c = parseChf(chf);
      if (Number.isNaN(c)) return (msg = t('Type the cost in CHF, e.g. 120.50.'));
      opts = { bike: b, shop: shop.trim(), date, chf: c, jobs: jobs.map((j) => ({ part: j.part, action: j.action })) };
    } else if (kind === 'problem' || kind === 'idea') {
      if (!b) return (msg = t('Choose a bike.'));
      opts = { bike: b };
    } else if (kind === 'material' || kind === 'wish') {
      if (!name.trim()) return (msg = t('Give it a name.'));
      const g = grams.trim() ? parseGrams(grams) : null;
      if (grams.trim() && g == null) return (msg = t('Grams: a whole number, e.g. 250.'));
      opts = { name: name.trim(), category, grams: g };
    } else if (kind === 'tour') {
      const tr = trips.find((x) => x.id === trip);
      if (!tr) return (msg = t('There is no trip to put this note on.'));
      opts = { trip: tr };
    } else if (kind === 'doc') {
      if (!docFiles.length && !docText) return (msg = t('Choose at least one file or the text.'));
      opts = { name: docName.trim(), files: docFiles, text: docText };
    } else if (kind === 'bill') {
      const a = billAmount.trim() ? parseChf(billAmount) : null;
      if (Number.isNaN(a)) return (msg = t('Type the cost in CHF, e.g. 120.50.'));
      opts = { to: billTo.trim(), amount: a, due: billDue, iban: billIban.trim(), purpose: head, keepPdf: billPdf };
    } else if (kind === 'event') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(evDay)) return (msg = t('Choose the day.'));
      opts = { title: evTitle.trim(), day: evDay, from: evFrom };
    } else if (kind === 'task') {
      opts = { title: taskTitle.trim(), due: taskDue };
    } else if (kind === 'list') {
      if (!listId && !newListName.trim()) return (msg = t('Give the list a name.'));
      opts = listId ? { listId } : { newName: newListName.trim() };
    } else if (kind === 'newtrip') {
      if (!b) return (msg = t('Choose a bike.'));
      opts = { title: tripTitle.trim(), startDate: tripStart, days: Math.max(1, Math.min(60, Number(tripDays) || 1)), bike: b, trips };
    } else {
      let tp = topic;
      if (newTopic) {
        if (!topicName.trim()) return (msg = t('Give the new place a name.'));
        const all = (await db.settings.get(OVERRIDES_KEY))?.value ?? {};
        const o = overrideOf(all.noteTopics);
        tp = `own-${Date.now().toString(36)}`;
        await saveList(db, 'noteTopics', { ...o, own: [...o.own, { id: tp, name: topicName.trim() }] });
      }
      opts = { topic: tp };
    }
    busy = true;
    try {
      const stored = await fileTo({ ...$state.snapshot(note), ...(photo ? { photo } : {}) }, kind, opts);
      onfiled?.(stored);
      dialog.close();
    } catch (err) {
      msg = t(err.message) || t('This note could not be sorted.');
    } finally {
      busy = false;
    }
  }
  const short = (s) => (s.length > 70 ? `${s.slice(0, 69)}…` : s);
  const when = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
</script>

<!-- Design-Refresh P9 (I4, Noah 12.10.2026 «Runde 19 freigegeben»): the window look of the new style: the
     entry under the title, the 7 targets as tiles (the suggestion first, marked and chosen), the fields of
     the chosen target right below, the main button bottom right, named by where the entry lands. -->
<dialog use:backClose use:keepTyped={'file:' + (note?.id ?? '')} class="sheet fsheet vdlg" bind:this={dialog} onclose={onclose} aria-labelledby="file-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="file-h" class="title">{t('File as …')}</h2>
      <p class="vd-sub">{short(note.text ?? '')}{#if note.at}{' · '}{when(note.at)}{/if}</p>
    </div>
    {#if note.photo}<img class="ph" src={note.photo} alt={t('Photo of the entry')} />{/if}
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if !tiles}
    {@const Icon = ICONS[kind]}
    <p class="chosen"><Icon size={18} aria-hidden="true" /><b>{t(TARGET[kind].name)}</b><span class="q">· {t('Suggestion')}</span><button type="button" class="btn btn-link other" onclick={() => (tiles = true)}>{t('Choose another target')}</button></p>
  {:else}
  <ul class="targets" aria-label={t('Targets')}>
    {#each order as x (x.key)}
      {@const Icon = ICONS[x.key]}
      <li class:sug={x.key === suggest}>
        <button type="button" class="tile" data-target={x.key} aria-pressed={kind === x.key} onclick={() => ((kind = x.key), (msg = ''))}>
          <Icon size={18} aria-hidden="true" />
          <b>{t(x.name)}</b>
          {#if x.key === suggest}<small>{t('Suggestion')}</small>{/if}
        </button>
      </li>
    {/each}
  </ul>
  {/if}

  {#if kind}
    <p class="lands">{t(LANDS[kind])}</p>
    {#if tip && ['booking', 'deadline', 'bill', 'sender'].includes(tip.kind)}
      <p class="tip">{tip.kind === 'booking' ? t('Looks like a booking') + (tip.booking.day ? ` · ${tip.booking.day.split('-').reverse().join('.')}` : '') + (tip.booking.code ? ` · ${tip.booking.code}` : '') + (tip.trip ? ` · ${t('for the trip «{name}»', { name: tip.trip.title })}` : '') : tip.kind === 'sender' ? t('You filed this sender like this twice.') : tip.kind === 'bill' ? t('Looks like a bill') + (tip.deadline?.day ? ` · ${t('due {day}', { day: tip.deadline.day.split('-').reverse().join('.') })}` : '') : t('Deadline: {day}', { day: tip.deadline.day.split('-').reverse().join('.') })}</p>
    {/if}
    {#if ['receipt', 'problem', 'idea', 'newtrip'].includes(kind)}
      <p class="lbl">{t('Bike')}</p>
      <div class="vd-chips chips" role="group" aria-label={t('Bike')}>
        {#each bikes as b (b.id)}<button type="button" class="vd-chip" aria-pressed={bike === b.id} onclick={() => (bike = b.id)}>{b.name}</button>{/each}
      </div>
    {/if}

    {#if kind === 'receipt'}
      <p class="lbl">{t('Bike shop')}{#if shops.length}<span class="q"> · {t('from earlier visits')}</span>{/if}</p>
      <div class="vd-chips chips" role="group" aria-label={t('Bike shop')}>
        {#each shops as s (s.shop)}<button type="button" class="vd-chip" aria-pressed={!newShop && shop === s.shop} onclick={() => ((shop = s.shop), (newShop = false))}>{s.shop}<small class="n">{s.n}×</small></button>{/each}
        <button type="button" class="vd-chip" aria-pressed={newShop || !shops.length} onclick={() => ((newShop = true), (shop = ''))}>+ {t('New shop')}</button>
      </div>
      {#if newShop || !shops.length}<label class="fld"><span class="sr">{t('Bike shop')}</span><input class="inp" type="text" bind:value={shop} placeholder={t('Name of the shop')} autocomplete="off" /></label>{/if}
      <div class="two">
        <label class="fld"><span class="lbl">{t('Date')}</span><DateInput bind:value={date} max={today} /></label>
        <label class="fld"><span class="lbl">{t('Amount CHF')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={chf} placeholder={t('not known')} /></label>
      </div>
      <p class="lbl">{t('What was done?')} <span class="q">{t('optional')}</span></p>
      <div class="vd-chips chips" role="group" aria-label={t('What was done?')}>
        {#each JOBS as j (j.part)}{@const on = jobs.some((x) => x.part === j.part)}<button type="button" class="vd-chip" aria-pressed={on} onclick={() => toggleJob(j)}>{t(j.name)}</button>{/each}
      </div>
      {#if !note.photo}
        <p class="lbl">{t('Photo of the receipt')}</p>
        <div class="pick"><PhotoPick onfile={addPhoto} busy={reading} has={!!photo} camera="Photograph the receipt" big />{#if photo}<img class="th" src={photo} alt={t('Photo of the receipt')} /><button type="button" class="link" onclick={() => (photo = null)}>{t('Remove photo')}</button>{/if}</div>
      {/if}
      <p class="name"><ReceiptText size={16} aria-hidden="true" /><span>{t('Name')}: {t('Receipt|target')} {receiptName(shop, date)}</span></p>
    {:else if kind === 'material' || kind === 'wish'}
      <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" type="text" bind:value={name} autocomplete="off" /></label>
      <div class="two">
        {#if kind === 'material'}
          <label class="fld"><span class="lbl">{t('Category')}</span><select class="sel" bind:value={category}>{#each choosable() as c (c.key)}<option value={c.key}>{t(c.name)}</option>{/each}</select></label>
        {/if}
        <label class="fld"><span class="lbl">{t('Weight g')} <span class="q">{t('optional')}</span></span><input class="inp num" type="text" inputmode="numeric" bind:value={grams} /></label>
      </div>
    {:else if kind === 'tour'}
      {#if tripList.length}
        <label class="fld"><span class="lbl">{t('Trip')}</span><select class="sel" bind:value={trip}>{#each tripList as tr (tr.id)}<option value={tr.id}>{tr.title}</option>{/each}</select></label>
      {:else}
        <p class="q">{t('There is no trip to put this note on.')}</p>
      {/if}
    {:else if kind === 'keep'}
      <p class="lbl">{t('Topic')}</p>
      <div class="vd-chips chips" role="group" aria-label={t('Topic')}>
        {#each TOPICS as x (x.key)}<button type="button" class="vd-chip" aria-pressed={!newTopic && topic === x.key} onclick={() => ((topic = x.key), (newTopic = false))}>{x.raw ? x.name : t(x.name)}</button>{/each}
        <button type="button" class="vd-chip" aria-pressed={newTopic} onclick={() => (newTopic = true)}><Plus size={14} aria-hidden="true" />{t('New place')}</button>
      </div>
      {#if newTopic}<label class="fld"><span class="lbl">{t('Name of the new place')}</span><input class="inp" type="text" bind:value={topicName} maxlength="40" autocomplete="off" placeholder={t('e.g. Flat, Club, Holidays')} /></label><p class="q small">{t('You can rename or delete it later under Me › Lists and types › Note topics.')}</p>{/if}
    {:else if kind === 'doc'}
      <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" type="text" bind:value={docName} maxlength="80" autocomplete="off" /></label>
      {#if docable.length}
        <p class="lbl">{t('Files')}</p>
        <div class="vd-chips chips" role="group" aria-label={t('Files')}>
          {#each docable as f (f.id)}{@const on = docFiles.includes(f.id)}<button type="button" class="vd-chip" aria-pressed={on} onclick={() => (docFiles = on ? docFiles.filter((x) => x !== f.id) : [...docFiles, f.id])}><Paperclip size={14} aria-hidden="true" />{f.name}</button>{/each}
        </div>
      {/if}
      <label class="check"><input type="checkbox" bind:checked={docText} /> {t('The text as a PDF too')}</label>
    {:else if kind === 'bill'}
      <label class="fld"><span class="lbl">{t('To whom')}</span><input class="inp" type="text" bind:value={billTo} maxlength="120" autocomplete="off" /></label>
      <div class="two">
        <label class="fld"><span class="lbl">{t('Amount CHF')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={billAmount} placeholder={t('not known')} /></label>
        <label class="fld"><span class="lbl">{t('Due on')}</span><DateInput bind:value={billDue} /></label>
      </div>
      <label class="fld"><span class="lbl">{t('IBAN')} <span class="q">{t('optional')}</span></span><input class="inp" type="text" bind:value={billIban} autocomplete="off" /></label>
      {#if (note.files ?? []).some((f) => f.kind === 'pdf')}<label class="check"><input type="checkbox" bind:checked={billPdf} /> {t('Keep the PDF in Documents too')}</label>{/if}
    {:else if kind === 'event'}
      <label class="fld"><span class="lbl">{t('Title')}</span><input class="inp" type="text" bind:value={evTitle} maxlength="120" autocomplete="off" /></label>
      <div class="two">
        <label class="fld"><span class="lbl">{t('Day')}</span><DateInput bind:value={evDay} /></label>
        <label class="fld"><span class="lbl">{t('Time')} <span class="q">{t('optional')}</span></span><input class="inp num" type="time" bind:value={evFrom} /></label>
      </div>
    {:else if kind === 'task'}
      <label class="fld"><span class="lbl">{t('Title')}</span><input class="inp" type="text" bind:value={taskTitle} maxlength="200" autocomplete="off" /></label>
      <label class="fld"><span class="lbl">{t('Reminder on')} <span class="q">{t('optional')}</span></span><DateInput bind:value={taskDue} /></label>
    {:else if kind === 'list'}
      <p class="lbl">{t('List')}</p>
      <div class="vd-chips chips" role="group" aria-label={t('List')}>
        {#each lists as l (l.id)}<button type="button" class="vd-chip" aria-pressed={listId === l.id} onclick={() => (listId = l.id)}>{l.name}</button>{/each}
        <button type="button" class="vd-chip" aria-pressed={!listId} onclick={() => (listId = '')}><Plus size={14} aria-hidden="true" />{t('New list')}</button>
      </div>
      {#if !listId}<label class="fld"><span class="lbl">{t('Name of the new list')}</span><input class="inp" type="text" bind:value={newListName} maxlength="60" autocomplete="off" /></label>{/if}
    {:else if kind === 'newtrip'}
      <label class="fld"><span class="lbl">{t('Title')}</span><input class="inp" type="text" bind:value={tripTitle} maxlength="80" autocomplete="off" /></label>
      <div class="two">
        <label class="fld"><span class="lbl">{t('Start')}</span><DateInput bind:value={tripStart} /></label>
        <label class="fld"><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="60" bind:value={tripDays} /></label>
      </div>
    {/if}

    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="button" class="btn hi" disabled={busy} onclick={save}><Check size={16} aria-hidden="true" />{t(SAVE[kind])}</button>
    </div>
  {/if}
</dialog>

<style>
  .pick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .pick .th {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 6px;
  }
  .chosen {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 0 0 10px;
  }
  .chosen :global(svg) {
    color: var(--ink-2);
  }
  .chosen .other {
    margin-left: auto;
    min-height: 44px;
  }
  .pick .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-size: var(--fs-small);
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .ph {
    flex: none;
    width: 44px;
    height: 56px;
    object-fit: cover;
    border-radius: var(--radius);
    border: 1px solid var(--line);
  }
  .targets {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
    gap: 8px;
    margin: 0 0 14px;
    padding: 0;
  }
  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    min-height: 76px;
    padding: 10px 6px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: center;
    cursor: pointer;
  }
  .tile b {
    font: 600 var(--fs-small) / 1.25 var(--font-body);
    overflow-wrap: break-word;
    max-width: 100%;
  }
  .tile small {
    color: var(--ok);
    font-size: var(--fs-tiny);
    font-weight: 500;
  }
  .tile :global(svg) {
    color: var(--ink-2);
  }
  .tile:hover {
    background: var(--paper-2);
  }
  .tile[aria-pressed='true'] {
    border: 2px solid var(--accent);
    background: var(--accent-soft);
  }
  .lands {
    margin: 0 0 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .q {
    font-weight: 400;
    color: var(--ink-3);
  }
  .chips {
    margin: 0 0 12px;
  }
  .n {
    margin-left: 6px;
    opacity: 0.75;
    font-size: var(--fs-tiny);
  }
  .fld {
    display: block;
    margin: 0 0 10px;
    min-width: 0;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 4px;
    padding: 8px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .name span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .tip {
    margin: 0 0 12px;
    padding: 8px 12px;
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
    color: var(--ok);
    font-size: var(--fs-small);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    margin: 0 0 6px;
  }
  .small {
    margin: -4px 0 10px;
    font-size: var(--fs-small);
  }
  .err {
    margin: 8px 0 0;
    color: var(--bad);
  }
</style>
