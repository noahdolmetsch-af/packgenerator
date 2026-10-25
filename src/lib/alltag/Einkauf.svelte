<script>
  /**
   * Paket V «Alltag» › Einkaufsliste (#/me/alltag/einkauf, liste.json 1113, Noah «3a oder b»): the everyday
   * shopping list. It is the own list «Shopping list» of Kalender › Merken, the same one the recipes of
   * Freie Zeit fill («Zutaten auf die Einkaufsliste»). Points: add, tick, change, delete (Undo), sort with
   * arrows and drag. Groups (Gruppen überall): add, rename, sort, delete (asks where the points go,
   * «Without a group» first). The switch «Together with the trip shopping» shows the next trip's food list
   * below (ticks go to the trip); off, it stays only at the trip.
   */
  import { Plus, Pencil, X, Share2, ShoppingCart, ChevronRight, Check, Trash2 } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from '../frei/FreiSheet.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { alltagQuery, change, KEYS, changeShop, restoreShop } from '../alltagdb.js';
  import { shopSections, shopGroups, addShopGroup, renameShopGroup, deleteShopGroup, moveShopGroup, moveShopItem, clearDone, shopListText, tripForShopping, SHOP_GROUP_IDEAS, uid, ALLTAG_HASH } from '../alltag.js';
  import { addPoint, togglePoint, editPoint, removePoint } from '../ownlists.js';
  import { shopList, toggleShop } from '../shop.js';
  import { touched } from '../trips.js';
  import { localDay } from '../localday.js';
  import { phone } from '../media.svelte.js';
  import { t, tn } from '../i18n.svelte.js';
  import { forOf, purposes, dropPurpose } from '../stand/stand.js'; // Paket A part 4, UC-258-I1: what a point is for

  const today = localDay();
  const q = alltagQuery();
  const d = $derived($q ?? { prefs: { together: true }, shop: null });
  const list = $derived(d.shop ?? { id: '', items: [], groups: [] });
  const groups = $derived(shopGroups(list));
  const sections = $derived(shopSections(list));
  const doneCount = $derived((list.items ?? []).filter((x) => x.done).length);
  const listName = () => t('Shopping list');

  const tripQ = liveQuery(async () => {
    const trip = tripForShopping(await db.trips.toArray(), today);
    if (!trip) return null;
    const ids = [...new Set((trip.entries ?? []).map((e) => e.itemId))];
    const items = (await db.items.bulkGet(ids)).filter(Boolean);
    return { trip, rows: shopList(trip, Object.fromEntries(items.map((i) => [i.id, i]))) };
  });
  const tripShop = $derived(d.prefs.together ? $tripQ : null);

  const write = async (fn, text = '') => {
    const before = await changeShop(fn, listName());
    if (text) offerDone(text, () => restoreShop(before));
    return before;
  };

  /* ---------- points ---------- */
  let text = $state('');
  let group = $state('');
  async function add(e) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    const id = uid('sh');
    await write((l) => {
      const next = addPoint(l, v, { id });
      return group ? editPoint(next, id, { group }) : next;
    });
    text = '';
  }
  const tick = (x) => write((l) => togglePoint(l, x.id));
  let edit = $state(null); // { id, text, group, for }
  const openEdit = (x) => (edit = { id: x.id, text: x.text, group: x.group ?? '', for: forOf(x) });
  async function saveEdit() {
    if (!edit.text.trim()) return t('Please give it a name.');
    await write((l) => editPoint(l, edit.id, { text: edit.text.trim(), group: edit.group || null, for: forOf(edit) || null }));
  }

  /* ---------- what the points are for (UC-258-I1): a plan that falls through takes its points along ---------- */
  const uses = $derived(purposes(list.items ?? []));
  async function planGone(p) {
    const answer = await askDelete({ title: t('The plan «{name}» is off?', { name: p.name }), text: tn(p.open, 'Its {n} open point goes from the list. Ticked ones stay. You can undo this for a few seconds.', 'Its {n} open points go from the list. Ticked ones stay. You can undo this for a few seconds.'), label: t('Remove') });
    if (answer !== 'delete') return;
    await deleteWithUndo({ run: () => changeShop((l) => dropPurpose(l, p.name), listName()), undo: (before) => restoreShop(before), text: t('"{name}" deleted.', { name: p.name }), name: p.name });
  }
  async function removeEdit() {
    const x = edit;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: x.text }), text: t('You can undo this for a few seconds.') });
    if (answer !== 'delete') return false;
    await deleteWithUndo({ run: () => changeShop((l) => removePoint(l, x.id), listName()), undo: (before) => restoreShop(before), text: t('"{name}" deleted.', { name: x.text }), name: x.text });
  }
  async function clearTicked() {
    const answer = await askDelete({ title: t('Remove the ticked points?'), text: tn(doneCount, '{n} point goes. You can undo this for a few seconds.', '{n} points go. You can undo this for a few seconds.'), label: t('Remove') });
    if (answer !== 'delete') return;
    await write(clearDone, tn(doneCount, '{n} point removed.', '{n} points removed.'));
  }
  const openIds = (sec) => sec.items.filter((x) => !x.done).map((x) => x.id);
  const stepItem = (sec, id, dir) => {
    const ids = openIds(sec);
    const i = ids.indexOf(id);
    const to = Math.min(Math.max(i + dir, 0), ids.length - 1);
    return to === i ? null : write((l) => moveShopItem(l, id, to));
  };

  /* ---------- groups ---------- */
  let newGroup = $state('');
  let renaming = $state(null);
  let deleting = $state(null);
  const addGroup = (name) => {
    const v = String(name ?? '').trim();
    if (!v || groups.some((g) => g.name.toLowerCase() === v.toLowerCase())) return;
    return write((l) => addShopGroup(l, v, uid('grp')));
  };
  async function addGroupForm(e) {
    e.preventDefault();
    await addGroup(newGroup);
    newGroup = '';
  }
  const countIn = (id) => (list.items ?? []).filter((x) => x.group === id).length;
  async function deleteGroup(to) {
    const g = deleting;
    await write((l) => deleteShopGroup(l, g.id, to ?? ''), t('"{name}" deleted.', { name: g.name }));
    if (group === g.id) group = '';
  }
  const stepGroup = (id, dir) => {
    const i = groups.findIndex((g) => g.id === id);
    const to = Math.min(Math.max(i + dir, 0), groups.length - 1);
    return to === i ? null : write((l) => moveShopGroup(l, id, to));
  };

  /* ---------- the trip, the switch, sharing ---------- */
  const setTogether = (on) => change(KEYS.prefs, {}, (p) => ({ ...p, together: on }));
  async function tickTrip(itemId) {
    const id = tripShop.trip.id;
    await db.transaction('rw', db.trips, async () => {
      const cur = await db.trips.get(id);
      if (cur) await db.trips.update(id, touched({ shop: toggleShop(cur.shop, itemId) }));
    });
  }
  async function share() {
    const body = shopListText(list, { title: listName(), without: t('Without a group'), trip: tripShop?.rows?.length ? { title: t('For the trip «{title}»', { title: tripShop.trip.title }), rows: tripShop.rows } : null });
    try {
      if (navigator.share && phone.matches) await navigator.share({ title: listName(), text: body });
      else {
        await navigator.clipboard.writeText(body);
        offerDone(t('Copied. Paste it into a message.'));
      }
    } catch {
      /* closed */
    }
  }
</script>

<div class="fz" data-page="einkauf">
  <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: ALLTAG_HASH, label: t('Everyday life') }]} here={t('Shopping list')} />
  <h1 class="fz-h1" tabindex="-1" data-page-title>{t('Shopping list')}</h1>
  <p class="fz-intro">{t('What you need for every day. Recipes from Free time add their ingredients here with one tap; the same list is in Calendar › Remember.')}</p>

  <form class="fz-inline al-add" onsubmit={add}>
    <input class="inp" maxlength="120" bind:value={text} aria-label={t('New point')} placeholder={t('e.g. Milk')} data-shop-new />
    {#if groups.length}
      <select class="inp al-sel" bind:value={group} aria-label={t('Group')} data-shop-group>
        <option value="">{t('Without a group')}</option>
        {#each groups as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
      </select>
    {/if}
    <button type="submit" class="btn hi"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
  </form>

  {#if !(list.items ?? []).length}
    <p class="fz-empty">{t('The list is empty. Type what you need, or add the ingredients of a recipe in Free time › My collections.')}</p>
  {/if}

  {#each sections as sec (sec.id || '-')}
    {#if sec.items.length}
      {@const open = sec.items.filter((x) => !x.done)}
      {@const done = sec.items.filter((x) => x.done)}
      <section class="fz-box" data-shop-sec={sec.id || '-'}>
        {#if groups.length}<h2 class="fz-h2">{sec.id ? sec.name : t('Without a group')} <small class="fz-note">{open.length}</small></h2>{/if}
        {#if open.length}
          <ul class="fz-list al-items" use:sortable={{ onmove: (from, to) => write((l) => moveShopItem(l, openIds(sec)[from], to)) }}>
            {#each open as x, n (x.id)}
              <li class="fz-row" data-sort-id={x.id} data-shop-item={x.text}>
                <SortGrip name={x.text} onstep={(dir) => stepItem(sec, x.id, dir)} />
                <button type="button" class="al-tick" aria-pressed="false" aria-label={t('Tick {name}', { name: x.text })} onclick={() => tick(x)} data-shop-tick></button>
                <span class="fz-row-main"><b>{x.text}</b>{#if forOf(x)}<small data-shop-for>{t('for {name}', { name: forOf(x) })}</small>{/if}</span>
                {#if !phone.matches}<SortArrows name={x.text} i={n} n={open.length} onstep={(dir) => stepItem(sec, x.id, dir)} />{/if}
                <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: x.text })} onclick={() => openEdit(x)} data-shop-edit><Pencil size={18} aria-hidden="true" /></button>
              </li>
            {/each}
          </ul>
        {/if}
        {#if done.length}
          <ul class="fz-list al-items al-done">
            {#each done as x (x.id)}
              <li class="fz-row" data-shop-item={x.text} data-done>
                <button type="button" class="al-tick" aria-pressed="true" aria-label={t('Untick {name}', { name: x.text })} onclick={() => tick(x)} data-shop-tick><Check size={16} aria-hidden="true" /></button>
                <span class="fz-row-main"><s>{x.text}</s></span>
                <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: x.text })} onclick={() => openEdit(x)}><Pencil size={18} aria-hidden="true" /></button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  {/each}

  {#if uses.some((p) => p.open)}
    <section class="fz-box" data-shop-uses>
      <h2 class="fz-h2">{t('What it is for')}</h2>
      <p class="fz-note">{t('When a plan is off, its points go with one tap. Give a point its purpose with the pencil.')}</p>
      <ul class="fz-list">
        {#each uses.filter((p) => p.open) as p (p.name)}
          <li class="fz-row" data-shop-use={p.name}>
            <span class="fz-row-main"><b>{p.name}</b><small>{tn(p.open, '{n} point', '{n} points')}</small></span>
            <button type="button" class="btn sm" onclick={() => planGone(p)} data-shop-use-off>{t('Plan is off')}</button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <div class="fz-acts">
    {#if (list.items ?? []).some((x) => !x.done) || tripShop?.rows?.length}<button type="button" class="btn" onclick={share} data-shop-share><Share2 size={16} aria-hidden="true" />{t('Share the list')}</button>{/if}
    {#if doneCount}<button type="button" class="btn" onclick={clearTicked} data-shop-clear><Trash2 size={16} aria-hidden="true" />{t('Remove ticked')}</button>{/if}
  </div>

  <section class="fz-box" data-shop-together>
    <label class="al-switch">
      <input type="checkbox" checked={d.prefs.together} onchange={(e) => setTogether(e.currentTarget.checked)} data-shop-together-switch />
      <span><b>{t('Together with the trip shopping')}</b><small class="fz-note">{t('On: the food of your next trip shows here too. Off: it stays only at the trip, under Plan › Shopping and charging.')}</small></span>
    </label>
    {#if tripShop}
      {#if tripShop.rows.length}
        <h2 class="fz-h2"><ShoppingCart size={18} aria-hidden="true" />{t('For the trip «{title}»', { title: tripShop.trip.title })}</h2>
        <ul class="fz-list al-items">
          {#each tripShop.rows as r (r.itemId)}
            <li class="fz-row" data-trip-item={r.name}>
              <button type="button" class="al-tick" aria-pressed={r.done} aria-label={r.done ? t('Untick {name}', { name: r.name }) : t('Tick {name}', { name: r.name })} onclick={() => tickTrip(r.itemId)} data-trip-tick>{#if r.done}<Check size={16} aria-hidden="true" />{/if}</button>
              <span class="fz-row-main">{#if r.done}<s>{r.qty > 1 ? `${r.qty} × ${r.name}` : r.name}</s>{:else}<b>{r.qty > 1 ? `${r.qty} × ${r.name}` : r.name}</b>{/if}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="fz-note">{t('Your next trip «{title}» has no food on its packing list yet.', { title: tripShop.trip.title })}</p>
      {/if}
      <a class="btn sm" href="#/pack">{t('Open the trip')}<ChevronRight size={16} aria-hidden="true" /></a>
    {:else if d.prefs.together}
      <p class="fz-note">{t('No trip planned. When you plan one, its food shows here.')}</p>
    {/if}
  </section>

  <details class="fz-box" data-shop-groups>
    <summary class="fz-h2">{t('Groups')} <small class="fz-note">{groups.length ? tn(groups.length, '{n} group', '{n} groups') : t('none yet')}</small></summary>
    <p class="fz-note">{t('Groups sort the list like the shop: rename, sort or delete them. A deleted group never deletes its points.')}</p>
    {#if groups.length}
      <ul class="fz-list" use:sortable={{ onmove: (from, to) => write((l) => moveShopGroup(l, groups[from].id, to)) }}>
        {#each groups as g, n (g.id)}
          <li class="fz-row" data-sort-id={g.id} data-shop-grp={g.name}>
            <SortGrip name={g.name} onstep={(dir) => stepGroup(g.id, dir)} />
            <span class="fz-row-main"><b>{g.name}</b><small>{tn(countIn(g.id), '{n} point', '{n} points')}</small></span>
            {#if !phone.matches}<SortArrows name={g.name} i={n} n={groups.length} onstep={(dir) => stepGroup(g.id, dir)} />{/if}
            <button type="button" class="fz-icon" aria-label={t('Rename {name}', { name: g.name })} onclick={() => (renaming = g)} data-grp-rename><Pencil size={18} aria-hidden="true" /></button>
            <button type="button" class="fz-icon" aria-label={t('Delete {name}', { name: g.name })} onclick={() => (deleting = g)} data-grp-delete><X size={18} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="fz-chips" role="group" aria-label={t('Suggestions')}>
        {#each SHOP_GROUP_IDEAS as idea (idea)}<button type="button" class="fz-chip" onclick={() => addGroup(t(idea))} data-grp-idea={idea}><Plus size={14} aria-hidden="true" />{t(idea)}</button>{/each}
      </div>
    {/if}
    <form class="fz-inline" onsubmit={addGroupForm}>
      <input class="inp" maxlength="40" bind:value={newGroup} aria-label={t('New group')} placeholder={t('New group, e.g. Bakery')} data-grp-new />
      <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
  </details>
</div>

{#if edit}
  <FreiSheet title={t('Change point')} sub={t('Shopping list')} onsave={saveEdit} ondelete={removeEdit} onclose={() => (edit = null)}>
    <label class="fz-lab">{t('What')}<input class="inp" maxlength="120" bind:value={edit.text} data-field="text" /></label>
    <label class="fz-lab">{t('Group')}
      <select class="inp" bind:value={edit.group}><option value="">{t('Without a group')}</option>{#each groups as g (g.id)}<option value={g.id}>{g.name}</option>{/each}</select>
    </label>
    <label class="fz-lab">{t('For what (optional)')}<input class="inp" maxlength="60" bind:value={edit.for} list="shop-for-list" placeholder={t('e.g. Risotto on Saturday')} data-field="for" /></label>
    <datalist id="shop-for-list">{#each uses as p (p.name)}<option value={p.name}></option>{/each}</datalist>
  </FreiSheet>
{/if}
{#if renaming}
  <RenameSheet kicker={t('Group')} title={t('Rename group')} value={renaming.name} onsave={(name) => write((l) => renameShopGroup(l, renaming.id, name))} onclose={() => (renaming = null)} />
{/if}
{#if deleting}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?', { name: deleting.name })}
    count={countIn(deleting.id)}
    what={(n) => tn(n, '{n} point', '{n} points')}
    none={t('Without a group')}
    noneHint={t('They stay and show under «Without a group».')}
    targets={groups.filter((g) => g.id !== deleting.id).map((g) => ({ id: g.id, name: g.name }))}
    onconfirm={deleteGroup}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .al-sel {
    max-width: 200px;
  }
  /* on a phone the point gets the whole first line; group and «Add» share the second */
  .al-add {
    flex-wrap: wrap;
  }
  .al-add > input {
    flex: 1 1 220px;
    min-width: 0;
  }
  .al-switch input,
  .al-tick {
    flex: none;
  }
  .al-items {
    gap: 2px;
  }
  .al-tick {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    color: var(--accent);
  }
  .al-tick::before {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    border: 2px solid var(--line-strong, var(--ink-3));
    border-radius: 6px;
  }
  .al-tick {
    position: relative;
  }
  .al-done s {
    color: var(--ink-3);
  }
  .al-switch {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
  }
  .al-switch input {
    width: 22px;
    height: 22px;
    margin-top: 2px;
    accent-color: var(--accent);
  }
  .al-switch span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  summary.fz-h2 {
    cursor: pointer;
    min-height: 44px;
  }
</style>
