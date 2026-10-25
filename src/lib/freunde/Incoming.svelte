<script>
  /**
   * Paket D «Mit Freunden»: a message that came from a link or a file. An ask: answer it. A friend's
   * answer or request: look at it first, then keep it (as their own contribution) or leave it. A
   * shelf: choose what you would like. A building block or a layout: see what it changes, then take it
   * over with Undo. Nothing is taken over without your tap.
   */
  import { untrack } from 'svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { NOTES_KEY, ASKS_KEY, ME_KEY, WANT, SHELF_HOW, topicOf, noteOf, addNote, hasNote, requestEnvelope, matchSet, layoutCount, applyLayout } from './freunde.js';
  import { changeKey, putKey } from './store.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { saveFailed } from '../ui/ask.js';
  import { SETS_KEY, addSet } from '../sets.js';
  import { change as changeLayout, restore as restoreLayout } from '../anpassen.svelte.js';
  import Answer from './Answer.svelte';
  import NoteView from './NoteView.svelte';
  import SendBox from './SendBox.svelte';
  import { Check, X } from '@lucide/svelte';

  let { env, me = '', ondone } = $props();
  const today = localDay();
  const notesQ = liveQuery(() => db.settings.get(NOTES_KEY));
  const asksQ = liveQuery(() => db.settings.get(ASKS_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const notes = $derived(Array.isArray($notesQ?.value) ? $notesQ.value : []);
  const asks = $derived(Array.isArray($asksQ?.value) ? $asksQ.value : []);
  const items = $derived(($itemsQ ?? []).filter((i) => i.ownership !== 'gone'));
  const kept = $derived(hasNote(notes, env.id));
  const myAsk = $derived(env.k === 'reply' ? (asks.find((a) => a.id === env.ask.id) ?? env.ask) : null);
  const dayText = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) : '');
  let problem = $state('');

  const saveName = (n) => n && n !== me && putKey(ME_KEY, n).catch(() => {});

  /* an answer or a request: keep it */
  async function keep() {
    problem = '';
    const note = noteOf(env);
    try {
      const before = await changeKey(NOTES_KEY, [], (list) => addNote(list, note));
      offerDone(t('Kept: the contribution of {name}.', { name: env.by || t('a friend') }), () => putKey(NOTES_KEY, before));
      ondone?.();
    } catch (err) {
      problem = saveFailed(err);
    }
  }

  /* a shelf: choose */
  let picks = $state({});
  let from = $state(today);
  let until = $state('');
  let reqNote = $state('');
  let name = $state(untrack(() => me));
  let req = $state(null);
  const pick = (id, w) => (picks = { ...picks, [id]: picks[id] === w ? '' : w });
  const picked = $derived(Object.values(picks).filter(Boolean).length);
  function ask(e) {
    e.preventDefault();
    problem = '';
    if (!name.trim()) return (problem = t('Please write your name, so {name} knows who asks.', { name: env.by || t('your friend') }));
    if (!picked) return (problem = t('Please choose at least one thing.'));
    saveName(name.trim());
    const p = Object.fromEntries(Object.entries(picks).filter(([, w]) => w));
    req = requestEnvelope(env, p, { from, until, note: reqNote }, name.trim(), today);
  }

  /* a building block: map each line to your own thing */
  let setName = $state(untrack(() => (env.k === 'set' ? env.name : '')));
  let map = $state({}); // line index → itemId | ''
  let mapped = $state(false);
  $effect(() => {
    if (env.k !== 'set' || mapped || !items.length) return;
    const m = matchSet(env.lines, items, nameOf);
    map = Object.fromEntries(m.map((l, i) => [i, l.itemId ?? '']));
    mapped = true;
  });
  const sortedItems = $derived([...items].sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'de')));
  async function takeSet() {
    problem = '';
    const sets = (await db.settings.get(SETS_KEY))?.value ?? [];
    const missing = env.lines.filter((_, i) => !map[i]).map((l) => (l.q > 1 ? `${l.n} × ${l.q}` : l.n));
    const note = [t('From {name}, {date}.', { name: env.by || t('a friend'), date: dayText(env.at) }), env.note, missing.length ? `${t('Not in your gear yet')}: ${missing.join(', ')}` : ''].filter(Boolean).join(' ');
    const r = addSet(sets, setName, note);
    if (r.error) return (problem = r.error === 'taken' ? t('A building block with this name exists already. Choose another name.') : t('Please give it a name.'));
    const ids = [...new Set(env.lines.map((_, i) => map[i]).filter(Boolean))];
    const before = await db.items.bulkGet(ids);
    const qty = {};
    env.lines.forEach((l, i) => map[i] && l.q > 1 && (qty[map[i]] = l.q));
    const value = r.value.map((s) => (s.key === r.key && Object.keys(qty).length ? { ...s, qty } : s));
    try {
      await db.transaction('rw', db.settings, db.items, async () => {
        await db.settings.put({ key: SETS_KEY, value });
        for (const it of before) if (it && !it.sets?.includes(r.key)) await db.items.update(it.id, { sets: [...(it.sets ?? []), r.key] });
      });
      offerDone(t('«{name}» is one of your building blocks now.', { name: setName }), async () => {
        await db.transaction('rw', db.settings, db.items, async () => {
          await db.settings.put({ key: SETS_KEY, value: sets });
          for (const it of before) if (it) await db.items.update(it.id, { sets: it.sets ?? [] });
        });
      });
      ondone?.();
    } catch (err) {
      problem = saveFailed(err);
    }
  }

  /* a layout */
  const lc = $derived(env.k === 'layout' ? layoutCount(env.cfg) : null);
  function takeLayout() {
    const before = changeLayout((mine) => applyLayout(mine, env.cfg));
    offerDone(t('The layout is on this device now.'), () => restoreLayout(before));
    ondone?.();
  }
  const howLabel = (k) => t(SHELF_HOW.find((h) => h.key === k)?.label ?? 'to borrow');
  const wantLabel = (k) => t(WANT.find((h) => h.key === k)?.label ?? 'borrow');
</script>

{#if env.k === 'ask'}
  <Answer {env} {me} onname={saveName} />
{:else if env.k === 'reply'}
  <section class="fr-card" data-fr-in="reply" aria-labelledby="fr-in-h">
    <h2 id="fr-in-h" class="title">{t('Answer from {name}', { name: env.by || t('a friend') })}</h2>
    <p class="fr-fine">{t(topicOf(env.ask.topic).title)}: {env.ask.title}</p>
    <NoteView note={noteOf(env)} ask={myAsk} />
    <p class="fr-fine">{t('It is kept as their own contribution, with name and date. Your own entry does not change.')}</p>
    {#if problem}<p class="fr-err" role="alert">{problem}</p>{/if}
    <div class="fr-row">
      {#if kept}<p class="fr-ok">{t('Already kept.')}</p>
      {:else}<button type="button" class="btn hi" onclick={keep} data-fr-keep><Check size={16} aria-hidden="true" />{t('Keep it')}</button>{/if}
      <button type="button" class="btn btn-link" onclick={ondone}><X size={16} aria-hidden="true" />{kept ? t('Close') : t('Leave it')}</button>
    </div>
  </section>
{:else if env.k === 'request'}
  <section class="fr-card" data-fr-in="request" aria-labelledby="fr-in-h">
    <h2 id="fr-in-h" class="title">{t('{name} would like something from your shelf', { name: env.by || t('A friend') })}</h2>
    <ul class="fr-list">{#each env.items as x (x.id)}<li>{x.n} · <b>{wantLabel(x.w)}</b></li>{/each}</ul>
    {#if env.from || env.until}<p class="fr-fine">{[dayText(env.from), dayText(env.until)].filter(Boolean).join(' – ')}</p>{/if}
    {#if env.note}<p class="fr-quote">{env.note}</p>{/if}
    <p class="fr-fine">{t('Keeping it is no promise yet: you say yes, hand the things over and get them back, each step on its own.')}</p>
    {#if problem}<p class="fr-err" role="alert">{problem}</p>{/if}
    <div class="fr-row">
      {#if kept}<p class="fr-ok">{t('Already kept.')}</p>
      {:else}<button type="button" class="btn hi" onclick={keep} data-fr-keep><Check size={16} aria-hidden="true" />{t('Keep the request')}</button>{/if}
      <button type="button" class="btn btn-link" onclick={ondone}><X size={16} aria-hidden="true" />{kept ? t('Close') : t('Leave it')}</button>
    </div>
  </section>
{:else if env.k === 'shelf'}
  <section class="fr-card" data-fr-in="shelf" aria-labelledby="fr-in-h">
    <p class="fr-from">{t('Shelf of {name}', { name: env.by || t('a friend') })}</p>
    <h2 id="fr-in-h" class="title">{t('What would you like?')}</h2>
    {#if env.note}<p class="fr-quote">{env.note}</p>{/if}
    {#if req}
      <p class="fr-ok" role="status">{t('Now send your request to {name}. They decide and say yes on their own.', { name: env.by || t('your friend') })}</p>
      <SendBox env={req} text={t('Could I have something from your shelf?')} />
    {:else}
      <form class="fr-form" onsubmit={ask}>
        {#each env.items as x (x.id)}
          <div class="fr-line" data-fr-shelf-item>
            <span class="fr-tx">{x.n} <small>· {howLabel(x.how)}</small></span>
            <span class="fr-seg" role="group" aria-label={x.n}>
              {#each WANT.filter((w) => (x.how === 'give' ? w.key === 'keep' : x.how === 'swap' ? w.key !== 'borrow' : w.key !== 'keep')) as w (w.key)}
                <button type="button" class:on={picks[x.id] === w.key} aria-pressed={picks[x.id] === w.key} onclick={() => pick(x.id, w.key)}>{t(w.label)}</button>
              {/each}
            </span>
          </div>
        {/each}
        <div class="fr-two">
          <label class="fr-f"><span>{t('From|day')}</span><input type="date" bind:value={from} /></label>
          <label class="fr-f"><span>{t('Until')} <small>{t('optional')}</small></span><input type="date" bind:value={until} min={from} /></label>
        </div>
        <label class="fr-f"><span>{t('A note')} <small>{t('optional')}</small></span><input bind:value={reqNote} /></label>
        <label class="fr-f"><span>{t('Your name')}</span><input bind:value={name} data-fr-name /></label>
        {#if problem}<p class="fr-err" role="alert">{problem}</p>{/if}
        <div class="fr-row"><button type="submit" class="btn hi" data-fr-request>{tn(picked, 'Ask for {n} thing', 'Ask for {n} things')}</button></div>
      </form>
    {/if}
  </section>
{:else if env.k === 'set'}
  <section class="fr-card" data-fr-in="set" aria-labelledby="fr-in-h">
    <p class="fr-from">{t('Building block of {name}', { name: env.by || t('a friend') })}</p>
    <h2 id="fr-in-h" class="title">{env.name}</h2>
    {#if env.note}<p class="fr-quote">{env.note}</p>{/if}
    <p class="fr-fine">{t('Choose your own thing for each line. Lines without one go into the note of the block, so you see what is missing.')}</p>
    <label class="fr-f"><span>{t('Name of your block')}</span><input bind:value={setName} /></label>
    {#each env.lines as l, i (i)}
      <label class="fr-f"><span>{l.n}{l.q > 1 ? ` × ${l.q}` : ''}</span>
        <select bind:value={map[i]} data-fr-map>
          <option value="">{t('Not in my gear')}</option>
          {#each sortedItems as it (it.id)}<option value={it.id}>{nameOf(it)}</option>{/each}
        </select>
      </label>
    {/each}
    {#if problem}<p class="fr-err" role="alert">{problem}</p>{/if}
    <div class="fr-row">
      <button type="button" class="btn hi" onclick={takeSet} data-fr-takeset>{t('Take it as my building block')}</button>
      <button type="button" class="btn btn-link" onclick={ondone}>{t('Leave it')}</button>
    </div>
  </section>
{:else if env.k === 'layout'}
  <section class="fr-card" data-fr-in="layout" aria-labelledby="fr-in-h">
    <p class="fr-from">{t('Layout of {name}', { name: env.by || t('a friend') })}</p>
    <h2 id="fr-in-h" class="title">{t('Take over the layout?')}</h2>
    <ul class="fr-list">
      <li>{tn(lc.pages, '{n} page in another order or with hidden parts', '{n} pages in another order or with hidden parts')}</li>
      <li>{lc.menu ? t('The menu changes') : t('The menu stays')}</li>
      <li>{tn(lc.tabs, '{n} place with other tabs', '{n} places with other tabs')}</li>
    </ul>
    <p class="fr-fine">{t('It holds no names and no data, only the order and what is hidden. Your own names stay. Undo puts your layout back.')}</p>
    <div class="fr-row">
      <button type="button" class="btn hi" onclick={takeLayout} data-fr-takelayout>{t('Take it over')}</button>
      <button type="button" class="btn btn-link" onclick={ondone}>{t('Leave it')}</button>
    </div>
  </section>
{/if}
