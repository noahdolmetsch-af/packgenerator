<script>
  /**
   * Paket D «Leihregal für Freunde» (UC-008, UC-020, UC-193, UC-281): things you want to lend, swap or
   * give to friends, chosen one by one (nothing is on the shelf unless you put it there). Things that
   * never came along on a trip are suggested. The shelf goes out as a link; a friend asks for things,
   * and you decide step by step on the Ask friends tab.
   * «Gemeinsam oder geliehen» (UC-184): main gear you own together, borrowed, rented or lent, with
   * from–until, so you see whether it is free on a day.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { isInventory } from '../gear.js';
  import { SHELF_KEY, GEAR_KEY, SHELF_HOW, GEAR_HOW, shelfOf, emptyShelf, onShelf, toggleShelf, setShelfHow, shelfIdeas, shelfEnvelope, gearOf, availableOn, newId } from './freunde.js';
  import { changeKey, putKey } from './store.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import SendBox from './SendBox.svelte';
  import { Plus, Search, Trash2, Share2, Pencil } from '@lucide/svelte';

  let { me = '' } = $props();
  const today = localDay();
  const itemsQ = liveQuery(() => db.items.toArray());
  const shelfQ = liveQuery(() => db.settings.get(SHELF_KEY));
  const gearQ = liveQuery(() => db.settings.get(GEAR_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const items = $derived(($itemsQ ?? []).filter((i) => isInventory(i) && i.ownership !== 'gone'));
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const shelf = $derived(shelfOf($shelfQ?.value));
  const gear = $derived(gearOf($gearQ?.value));
  const used = $derived(new Set(($tripsQ ?? []).flatMap((tr) => (tr.entries ?? []).map((e) => e.itemId))));
  const ideas = $derived(shelfIdeas(items, used, shelf, 8));
  let q = $state('');
  const found = $derived(q.trim() ? items.filter((i) => nameOf(i).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 30) : []);
  let problem = $state('');
  let sending = $state(null);
  let note = $state('');
  $effect(() => {
    note = shelf.note;
  });

  async function saveShelf(fn) {
    problem = '';
    try {
      await changeKey(SHELF_KEY, emptyShelf(), (v) => fn(shelfOf(v)));
    } catch (err) {
      problem = saveFailed(err);
    }
  }
  const flip = (id) => saveShelf((s) => toggleShelf(s, id));
  const how = (id, h) => saveShelf((s) => setShelfHow(s, id, h));
  const saveNote = () => note !== shelf.note && saveShelf((s) => ({ ...s, note }));
  function send() {
    sending = shelfEnvelope(shelf, byId, nameOf, (i) => i?.category ?? '', me, today);
  }

  /* shared, borrowed, rented, lent */
  let form = $state(null); // { id, itemId, name, how, who, from, until, note }
  const startGear = (g = null) => (form = g ? { ...g, itemId: g.itemId ?? '' } : { id: newId('g'), itemId: '', name: '', how: 'shared', who: '', from: '', until: '', note: '' });
  async function saveGear(e) {
    e.preventDefault();
    problem = '';
    if (!form.itemId && !form.name.trim()) return (problem = t('Please choose a thing or type its name.'));
    if (!form.who.trim()) return (problem = t('Please write with whom.'));
    const entry = gearOf([{ ...$state.snapshot(form), itemId: form.itemId || null }])[0];
    try {
      await changeKey(GEAR_KEY, [], (list) => (list.some((x) => x.id === entry.id) ? list.map((x) => (x.id === entry.id ? entry : x)) : [...list, entry]));
      form = null;
    } catch (err) {
      problem = saveFailed(err);
    }
  }
  async function delGear(g) {
    const n = gName(g);
    if ((await askDelete({ title: t('Delete «{name}»?', { name: n }), text: t('Only this note goes; the thing stays in your gear.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => changeKey(GEAR_KEY, [], (list) => list.filter((x) => x.id !== g.id)), undo: (before) => putKey(GEAR_KEY, before), text: t('«{name}» deleted.', { name: n }), name: n });
  }
  const gName = (g) => (g.itemId ? nameOf(byId[g.itemId]) : '') || g.name || t('(deleted item)');
  const dayText = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '');
  const FREE = { yes: 'free for you today', no: 'not with you today', ask: 'ask before you plan it' };
  const howText = (k) => t(GEAR_HOW.find((h) => h.key === k)?.label ?? 'owned together with');
</script>

{#if problem}<p class="fr-err" role="alert">{problem}</p>{/if}

<section class="fr-card" aria-labelledby="fr-sh-h" data-fr-shelf>
  <h3 id="fr-sh-h" class="title">{tn(shelf.items.length, '{n} thing on your shelf', '{n} things on your shelf')}</h3>
  <p class="fr-fine">{t('Only what you put here goes to friends: the name and how it goes, nothing else. A friend asks, you say yes on your own, and the handover is noted in Gear › Lent out.')}</p>
  {#if shelf.items.length}
    <ul class="fr-list">
      {#each shelf.items as x (x.itemId)}
        <li class="fr-line" data-fr-shelf-row>
          <span class="fr-tx">{nameOf(byId[x.itemId]) || t('(deleted item)')}</span>
          <select value={x.how} onchange={(e) => how(x.itemId, e.currentTarget.value)} aria-label={t('How it goes')}>
            {#each SHELF_HOW as h (h.key)}<option value={h.key}>{t(h.label)}</option>{/each}
          </select>
          <button type="button" class="btn btn-link" aria-label={t('Take «{name}» off the shelf', { name: nameOf(byId[x.itemId]) })} onclick={() => flip(x.itemId)}><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
  <label class="fr-search"><Search size={16} aria-hidden="true" /><input type="search" bind:value={q} placeholder={t('Search in your gear')} aria-label={t('Search in your gear')} data-fr-shelf-q /></label>
  {#if found.length}
    <ul class="fr-list">{#each found as i (i.id)}<li><label class="fr-check"><input type="checkbox" checked={!!onShelf(shelf, i.id)} onchange={() => flip(i.id)} /> {nameOf(i)}</label></li>{/each}</ul>
  {:else if ideas.length && !q.trim()}
    <p class="fr-fine">{t('Never on a trip so far – maybe good for the shelf:')}</p>
    <ul class="fr-chips">{#each ideas as i (i.id)}<li><button type="button" class="btn sm" onclick={() => flip(i.id)}><Plus size={14} aria-hidden="true" />{nameOf(i)}</button></li>{/each}</ul>
  {/if}
  <label class="fr-f"><span>{t('A line for your friends')} <small>{t('optional')}</small></span><input bind:value={note} onblur={saveNote} placeholder={t('e.g. {x}', { x: t('Ask a week before, please') })} /></label>
  {#if sending}
    <SendBox env={sending} text={t('My shelf: what you can borrow from me')} ondone={() => (sending = null)} />
  {:else}
    <div class="fr-row"><button type="button" class="btn hi" onclick={send} disabled={!shelf.items.length} data-fr-sendshelf><Share2 size={16} aria-hidden="true" />{t('Send the shelf')}</button></div>
  {/if}
</section>

<section class="fr-card" aria-labelledby="fr-g-h" data-fr-gear>
  <h3 id="fr-g-h" class="title">{t('Shared and borrowed gear')}</h3>
  <p class="fr-fine">{t('A tent you own with a friend, a borrowed bike bag, a rented e-bike: who has it when, so you can plan with it.')}</p>
  {#if gear.length}
    <ul class="fr-list">
      {#each gear as g (g.id)}
        {@const free = availableOn(g, today)}
        <li class="fr-line" data-fr-gear-row>
          <span class="fr-tx"><b>{gName(g)}</b> · {howText(g.how)} {g.who}{#if g.from || g.until}{' '}<small>· {[dayText(g.from), dayText(g.until)].filter(Boolean).join(' – ')}</small>{/if} <small class="fr-free {free}">· {t(FREE[free])}</small>{#if g.note}<br /><small>{g.note}</small>{/if}</span>
          <button type="button" class="btn btn-link" aria-label={t('Change «{name}»', { name: gName(g) })} onclick={() => startGear(g)}><Pencil size={16} aria-hidden="true" /></button>
          <button type="button" class="btn btn-link" aria-label={t('Delete «{name}»?', { name: gName(g) })} onclick={() => delGear(g)}><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
  {#if form}
    <form class="fr-form" onsubmit={saveGear}>
      <label class="fr-f"><span>{t('Thing')}</span>
        <select bind:value={form.itemId}>
          <option value="">{t('Not in my gear (type the name)')}</option>
          {#each items as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
        </select>
      </label>
      {#if !form.itemId}<label class="fr-f"><span>{t('Name')}</span><input bind:value={form.name} placeholder={t('e.g. {x}', { x: t('e-bike from the shop') })} /></label>{/if}
      <div class="fr-two">
        <label class="fr-f"><span>{t('How')}</span><select bind:value={form.how}>{#each GEAR_HOW as h (h.key)}<option value={h.key}>{t(h.label)}</option>{/each}</select></label>
        <label class="fr-f"><span>{t('Who')}</span><input bind:value={form.who} placeholder={t('a name')} data-fr-gear-who /></label>
      </div>
      <div class="fr-two">
        <label class="fr-f"><span>{t('From|day')} <small>{t('optional')}</small></span><input type="date" bind:value={form.from} /></label>
        <label class="fr-f"><span>{t('Until')} <small>{t('optional')}</small></span><input type="date" bind:value={form.until} /></label>
      </div>
      <label class="fr-f"><span>{t('Note')} <small>{t('optional')}</small></span><input bind:value={form.note} /></label>
      <div class="fr-row"><button type="submit" class="btn hi">{t('Save')}</button><button type="button" class="btn btn-link" onclick={() => (form = null)}>{t('Cancel')}</button></div>
    </form>
  {:else}
    <div class="fr-row"><button type="button" class="btn" onclick={() => startGear()} data-fr-addgear><Plus size={16} aria-hidden="true" />{t('Add shared gear')}</button></div>
  {/if}
</section>
