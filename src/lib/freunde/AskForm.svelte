<script>
  /**
   * Paket D «Mit Freunden»: make one ask for friends (a topic of freunde.js TOPICS). It takes what the
   * app already knows (the trip, its things, the costs, the flat-sitter list, the summit book) and lets
   * you change every line. «Make the link» keeps the ask (without its photo) and opens the send box.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, nameOf, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { topicOf, cleanAsk, askEnvelope, storedAsk, putAsk, newId, ASKS_KEY } from './freunde.js';
  import { changeKey } from './store.js';
  import { KEEPER_KEY, keeperOf, keeperLabel } from '../unterwegs/hueter.js';
  import { GB_KEY } from '../gipfelbuch.js';
  import { costsKey, cleanCosts, balances, settle, ME } from '../tools/costs.js';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import PhotoMarks from './PhotoMarks.svelte';
  import SendBox from './SendBox.svelte';
  import { Plus, X, ArrowUp, ArrowDown } from '@lucide/svelte';

  let { topic, me = '', onclose } = $props();
  const T = $derived(topicOf(topic));
  const today = localDay();

  const tripsQ = liveQuery(() => db.trips.toArray());
  const trips = $derived(($tripsQ ?? []).filter((x) => !x.archived).sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? ''))));
  const gbQ = liveQuery(() => db.settings.get(GB_KEY));
  const places = $derived(Array.isArray($gbQ?.value?.places) ? $gbQ.value.places : []);

  let tripId = $state('');
  let summitId = $state('');
  let title = $state('');
  let text = $state('');
  let date = $state('');
  let place = $state('');
  let lines = $state([]); // [{ id, text, who?, m?, q? }]
  let newLine = $state('');
  let newQ = $state('');
  let photo = $state('');
  let marks = $state([]);
  let busy = $state(false);
  let problem = $state('');
  let sent = $state(null);

  const dayText = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const tripLabel = (tr) => [tr.title, dayText(tr.startDate)].filter(Boolean).join(' · ');
  const chf = (n) => `CHF ${Number(n).toFixed(2)}`;

  /** What the app already knows about the chosen trip, as lines for this topic. */
  async function fillFromTrip(id) {
    const tr = trips.find((x) => x.id === id);
    if (!tr) return;
    title = tripLabel(tr);
    if (T.key === 'duties' || T.key === 'pair') {
      const items = await db.items.bulkGet((tr.entries ?? []).map((e) => e.itemId));
      const seen = new Set();
      lines = items.filter((i) => i && !seen.has(i.id) && seen.add(i.id)).slice(0, 60).map((i) => ({ id: i.id, text: nameOf(i), ...(T.key === 'pair' ? { m: '' } : {}) }));
    }
    if (T.key === 'costs') {
      const c = cleanCosts((await db.settings.get(costsKey(id)))?.value);
      const who = (pid) => (pid === ME ? me || t('me') : c.people.find((p) => p.id === pid)?.name || '?');
      lines = c.items.map((x) => ({ id: x.id, text: `${x.what || t('Expense')} · ${chf(x.chf)} · ${t('paid by {name}', { name: who(x.paidBy) })}` }));
      const pay = settle(balances(c.people, c.items));
      text = pay.length ? pay.map((p) => t('{from} pays {to} {amount}', { from: who(p.from), to: who(p.to), amount: chf(p.cents / 100) })).join('\n') : c.items.length ? t('Everything is even.') : '';
      if (!c.items.length) problem = t('This trip has no costs yet. Add them in Toolbox › Trip costs, or type the lines here.');
    }
  }
  $effect(() => {
    if (tripId) {
      problem = '';
      fillFromTrip(tripId);
    }
  });
  $effect(() => {
    const p = places.find((x) => x.id === summitId);
    if (p) title = [p.name, p.ele ? `${p.ele} m` : ''].filter(Boolean).join(' · ');
  });
  // the flat-sitter list is ready at once
  $effect(() => {
    if (T?.key !== 'handover' || lines.length) return;
    db.settings.get(KEEPER_KEY).then((row) => {
      const k = keeperOf(row?.value);
      lines = k.items.map((x) => ({ id: x.id, text: keeperLabel(x, t) }));
      if (k.note && !text) text = k.note;
      if (!title) title = t('Looking after the flat');
    });
  });

  function addLine(e, q = false) {
    e?.preventDefault?.();
    const v = (q ? newQ : newLine).trim();
    if (!v) return;
    lines = [...lines, { id: newId('l'), text: v, ...(q ? { q: true } : {}), ...(T.key === 'pair' ? { m: '' } : {}) }];
    if (q) newQ = '';
    else newLine = '';
  }
  const dropLine = (id) => (lines = lines.filter((l) => l.id !== id));
  function moveLine(i, d) {
    const j = i + d;
    if (j < 0 || j >= lines.length) return;
    const next = [...lines];
    [next[i], next[j]] = [next[j], next[i]];
    lines = next;
  }
  const setLine = (id, patch) => (lines = lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  async function pickPhoto(file) {
    busy = true;
    problem = '';
    try {
      const { shrinkImage } = await import('../photo.js');
      photo = await shrinkImage(file, 900, 0.72);
      marks = [];
    } catch (err) {
      problem = err?.message || t('This photo could not be read. Please choose a JPG or PNG.');
    } finally {
      busy = false;
    }
  }
  const addMark = (x, y) => (marks = [...marks, { id: newId('m'), x, y, text: '' }].slice(0, 12));

  async function make(e) {
    e.preventDefault();
    problem = '';
    if (T.subject === 'trip' && !tripId && !title.trim()) return (problem = t('Please choose a trip.'));
    if (T.subject === 'summit' && !title.trim()) return (problem = t('Please choose a place or type its name.'));
    if (T.subject === 'photo' && !photo) return (problem = t('Please choose a photo.'));
    if (!title.trim()) return (problem = t('Please give it a name.'));
    if (T.lines && !lines.length && T.key !== 'workshop') return (problem = t('Please add at least one line.'));
    const ask = cleanAsk({ id: newId('a'), topic, title, text, lines: $state.snapshot(lines), date, place, photo, marks: $state.snapshot(marks) });
    try {
      await changeKey(ASKS_KEY, [], (list) => putAsk(list, storedAsk(ask, today)));
    } catch {
      /* the link still works; only your list of asks misses it */
    }
    sent = askEnvelope(ask, me, today);
  }
</script>

<form class="fr-card fr-form" onsubmit={make} data-fr-ask={topic} aria-labelledby="fr-ask-h">
  <h3 id="fr-ask-h" class="title">{t(T.title)}</h3>
  <p class="fr-fine">{t(T.hint)}</p>
  {#if sent}
    <SendBox env={sent} text={t('{name} asks you: {what}', { name: me || t('A friend'), what: `${t(T.title)} – ${sent.ask.title}` })} ondone={onclose} />
  {:else}
    {#if T.subject === 'trip'}
      <label class="fr-f"><span>{t('Trip')}</span>
        <select bind:value={tripId} data-fr-trip>
          <option value="">{t('Choose a trip')}</option>
          {#each trips as tr (tr.id)}<option value={tr.id}>{tripLabel(tr)}</option>{/each}
        </select>
      </label>
    {:else if T.subject === 'summit'}
      {#if places.length}
        <label class="fr-f"><span>{t('Place from your summit book')}</span>
          <select bind:value={summitId}>
            <option value="">{t('Choose a place')}</option>
            {#each places as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
          </select>
        </label>
      {/if}
    {:else if T.subject === 'photo'}
      <PhotoPick onfile={pickPhoto} {busy} has={!!photo} camera="Take photo" />
      {#if photo}
        <p class="fr-fine">{t('Tap the photo where you want to ask something. Up to 12 points.')}</p>
        <PhotoMarks {photo} {marks} onadd={addMark} />
        {#each marks as m, i (m.id)}
          <div class="fr-line">
            <b class="fr-num">{i + 1}</b>
            <input class="fr-in" bind:value={m.text} placeholder={t('What do you want to know here?')} aria-label={t('Point {n}', { n: i + 1 })} />
            <button type="button" class="btn btn-link" aria-label={t('Remove point {n}', { n: i + 1 })} onclick={() => (marks = marks.filter((x) => x.id !== m.id))}><X size={16} /></button>
          </div>
        {/each}
      {/if}
    {/if}
    <label class="fr-f"><span>{T.subject === 'trip' ? t('Name shown to friends') : t('Name')}</span><input bind:value={title} placeholder={T.key === 'place' ? t('e.g. {x}', { x: t('Hut by the lake') }) : T.key === 'workshop' ? t('e.g. {x}', { x: t('Spring service together') }) : ''} data-fr-title /></label>
    {#if T.day}
      <div class="fr-two">
        {#if T.key === 'workshop'}<label class="fr-f"><span>{t('Date')}</span><input type="date" bind:value={date} /></label>{/if}
        <label class="fr-f"><span>{T.key === 'workshop' ? t('Where') : t('Where it is')}</span><input bind:value={place} placeholder={T.key === 'workshop' ? t('e.g. {x}', { x: t('my garage') }) : t('e.g. {x}', { x: t('above the village') })} /></label>
      </div>
    {/if}
    <label class="fr-f"><span>{T.key === 'story' ? t('Your entry (it stays as it is)') : T.key === 'level' ? t('The difficulty, as you see it') : T.key === 'costs' ? t('Who pays whom') : t('A line for your friends')} <small>{t('optional')}</small></span>
      <textarea rows="3" bind:value={text} placeholder={T.key === 'level' ? t('e.g. {x}', { x: t('T3, 1200 m up, two hours on gravel') }) : ''} data-fr-text></textarea>
    </label>

    {#if T.lines}
      <fieldset class="fr-lines">
        <legend>{T.key === 'workshop' ? t('Tasks') : T.key === 'costs' ? t('Expenses') : T.key === 'handover' ? t('Tasks for the sitter') : t('Things')}</legend>
        {#if T.key === 'pair'}<p class="fr-fine">{t('Mark what you would like to have along and what you could do without. Your friend does the same.')}</p>{/if}
        {#if T.key === 'duties'}<p class="fr-fine">{t('Keep only the things your friend takes care of.')}</p>{/if}
        {#each lines.filter((l) => !l.q) as l, i (l.id)}
          <div class="fr-line" data-fr-line>
            <span class="fr-tx">{l.text}</span>
            {#if T.key === 'pair'}
              <span class="fr-seg" role="group" aria-label={l.text}>
                <button type="button" class:on={l.m === 'want'} aria-pressed={l.m === 'want'} onclick={() => setLine(l.id, { m: l.m === 'want' ? '' : 'want' })}>{t('I would like it')}</button>
                <button type="button" class:on={l.m === 'skip'} aria-pressed={l.m === 'skip'} onclick={() => setLine(l.id, { m: l.m === 'skip' ? '' : 'skip' })}>{t('I could do without')}</button>
              </span>
            {/if}
            {#if T.key === 'workshop'}<input class="fr-in sm" value={l.who ?? ''} oninput={(e) => setLine(l.id, { who: e.currentTarget.value })} placeholder={t('for whom? optional')} aria-label={t('For whom')} />{/if}
            <button type="button" class="btn btn-link" aria-label={t('Up')} onclick={() => moveLine(lines.indexOf(l), -1)} disabled={i === 0}><ArrowUp size={16} /></button>
            <button type="button" class="btn btn-link" aria-label={t('Down')} onclick={() => moveLine(lines.indexOf(l), 1)}><ArrowDown size={16} /></button>
            <button type="button" class="btn btn-link" aria-label={t('Remove «{name}»', { name: l.text })} onclick={() => dropLine(l.id)}><X size={16} /></button>
          </div>
        {/each}
        <div class="fr-line">
          <input class="fr-in" bind:value={newLine} placeholder={T.key === 'workshop' ? t('e.g. {x}', { x: t('change the chain') }) : t('Add a line')} aria-label={t('Add a line')} onkeydown={(e) => e.key === 'Enter' && addLine(e)} data-fr-newline />
          <button type="button" class="btn" onclick={addLine} disabled={!newLine.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
        </div>
      </fieldset>
      {#if T.key === 'workshop'}
        <fieldset class="fr-lines">
          <legend>{t('Questions to the group')}</legend>
          {#each lines.filter((l) => l.q) as l (l.id)}
            <div class="fr-line"><span class="fr-tx">{l.text}</span><button type="button" class="btn btn-link" aria-label={t('Remove «{name}»', { name: l.text })} onclick={() => dropLine(l.id)}><X size={16} /></button></div>
          {/each}
          <div class="fr-line">
            <input class="fr-in" bind:value={newQ} placeholder={t('e.g. {x}', { x: t('Who brings a chain checker?') })} aria-label={t('Add a question')} onkeydown={(e) => e.key === 'Enter' && addLine(e, true)} />
            <button type="button" class="btn" onclick={(e) => addLine(e, true)} disabled={!newQ.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
          </div>
        </fieldset>
      {/if}
    {/if}
    {#if problem}<p class="fr-err" role="alert">{problem}</p>{/if}
    <div class="fr-row">
      <button type="submit" class="btn hi" data-fr-make>{t('Make the link')}</button>
      <button type="button" class="btn btn-link" onclick={onclose}>{t('Cancel')}</button>
    </div>
  {/if}
</form>
