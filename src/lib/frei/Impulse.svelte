<script>
  /**
   * Paket T «Freie Zeit» › Impulse (Noah 19.10.2026: his 30 ideas, «humorvoll»; «1a und b»: a tab of Aktiv
   * and a page under Ich). On top the impulse of the day (or the one an address names, ?i=…) with
   * «Try it», «Another idea» and «Done»; below all impulses by area. The ten areas are groups: rename,
   * sort (arrows and drag), delete (asks where the impulses go, «Without an area» first) and add own ones.
   * Every impulse can be changed, hidden (built-in) or deleted (own), and own ones added. Some impulses
   * have a small helper right in the card (take-along list, silly ideas, invitation, sunrise).
   */
  import { Sparkles, Shuffle, Check, Pencil, EyeOff, Eye, Plus, Settings2, Share2, Sunrise, ChevronRight, ChevronDown, X } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from './FreiSheet.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { cfgQuery, changeCfg, restoreCfg, putRow } from '../freidb.js';
  import { areasOf, areaName, impulsesOf, inArea, impulseOfDay, nextOf, moveImpulses, collsOf, impulseHref, queryOf, uid, TAKE_ALONG, SUNRISE_LIST, SILLY, TOGETHER, TOGETHER_TIMES, inviteText } from '../frei.js';
  import { sunTimes } from '../blockplan.js';
  import { localDay } from '../localday.js';
  import { phone } from '../media.svelte.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { hash = '', fromActive = false } = $props();
  const today = localDay();
  const q = cfgQuery();
  const cfg = $derived($q ?? {});
  const homeQ = liveQuery(() => db.settings.get('homePlace'));
  const home = $derived($homeQ?.value ?? null);

  const areas = $derived(areasOf(cfg));
  const shownAreas = $derived(areas.filter((a) => !a.hidden));
  const all = $derived(impulsesOf(cfg));
  const visible = $derived(all.filter((i) => !i.hidden));
  const colls = $derived(collsOf(cfg));
  let area = $state('all'); // 'all', an area id, or '' (without an area)
  let showHidden = $state(false);
  const orphans = $derived(inArea(visible, '', areas));
  const listed = $derived((area === 'all' ? all : inArea(all, area, areas)).filter((i) => showHidden || !i.hidden));
  const hiddenCount = $derived((area === 'all' ? all : inArea(all, area, areas)).filter((i) => i.hidden).length);

  // the big card on top: the one the address names, else the one of the day; «Another idea» goes on
  // svelte-ignore state_referenced_locally
  let pick = $state(queryOf(hash, 'i') || null);
  const top = $derived((pick && visible.find((i) => i.id === pick)) || impulseOfDay(visible, today));
  const anotherTop = () => (pick = nextOf(visible, top?.id)?.id ?? null);

  const nameOfArea = (id) => areaName(areas.find((a) => a.id === id), t);
  const title = (i) => (i.own || i.edited ? i.title : t(i.title));
  const text = (i) => (i.own || i.edited ? i.text : t(i.text));
  const goLabel = (i) => (i.go?.page ? t('Open the page') : i.go?.coll ? t('Keep it in a collection') : t('Try it'));

  /* ---------- done, hide, delete ---------- */
  async function done(i) {
    await putRow({ kind: 'log', what: i.id, day: today, ok: true });
    offerDone(t('Nice. «{name}» is in your log.', { name: title(i) }));
  }
  async function hide(i) {
    const before = await changeCfg((c) => ({ ...c, hidden: [...new Set([...(c.hidden ?? []), i.id])] }));
    if (pick === i.id) pick = null;
    offerDone(t('«{name}» hidden. Bring it back with «Show hidden».', { name: title(i) }), () => restoreCfg(before));
  }
  const unhide = (i) => changeCfg((c) => ({ ...c, hidden: (c.hidden ?? []).filter((x) => x !== i.id) }));
  async function remove(i) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: title(i) }), text: t('Your own impulse goes. Your log keeps the days you did it.') });
    if (answer !== 'delete') return false;
    let before;
    await deleteWithUndo({
      run: async () => (before = await changeCfg((c) => ({ ...c, own: (c.own ?? []).filter((x) => x.id !== i.id) }))),
      undo: () => restoreCfg(before),
      text: t('"{name}" deleted.', { name: title(i) }),
      name: title(i),
    });
  }

  /* ---------- add or change an impulse ---------- */
  let edit = $state(null); // { id?, std, title, text, area }
  const openNew = () => (edit = { id: null, std: false, title: '', text: '', area: area !== 'all' && area !== '' ? area : shownAreas[0]?.id ?? '' });
  const openEdit = (i) => (edit = { id: i.id, std: !i.own, title: title(i), text: text(i), area: i.area });
  async function saveEdit() {
    const name = edit.title.trim();
    if (!name) return t('Please give it a name.');
    const e = { title: name, text: edit.text.trim(), area: edit.area };
    if (!edit.id) await changeCfg((c) => ({ ...c, own: [...(c.own ?? []), { id: uid('imp'), ...e }] }));
    else if (edit.std)
      await changeCfg((c) => {
        const moved = { ...(c.moved ?? {}) };
        delete moved[edit.id];
        return { ...c, edits: { ...(c.edits ?? {}), [edit.id]: e }, moved };
      });
    else await changeCfg((c) => ({ ...c, own: (c.own ?? []).map((x) => (x.id === edit.id ? { ...x, ...e } : x)), moved: Object.fromEntries(Object.entries(c.moved ?? {}).filter(([k]) => k !== edit.id)) }));
    offerDone(t('Saved.'));
  }
  async function resetEdit() {
    const id = edit.id;
    const before = await changeCfg((c) => {
      const edits = { ...(c.edits ?? {}) };
      delete edits[id];
      return { ...c, edits };
    });
    offerDone(t('Back to the original text.'), () => restoreCfg(before));
  }

  /* ---------- areas: rename, sort, delete, add ---------- */
  let manage = $state(false);
  let renaming = $state(null);
  let deleting = $state(null);
  let newArea = $state('');
  const saveAreas = (list) => changeCfg((c) => ({ ...c, areas: list.map((a) => ({ id: a.id, name: a.name, hidden: a.hidden, own: a.own })) }));
  async function renameArea(name) {
    const a = renaming;
    const next = String(name ?? '').trim();
    await saveAreas(areas.map((x) => (x.id === a.id ? { ...x, name: next && next !== t(a.std ?? '') ? next : a.own ? a.name : null } : x)));
  }
  async function deleteArea(to) {
    const a = deleting;
    const before = await changeCfg((c) => ({
      ...c,
      areas: areasOf(c).map((x) => ({ id: x.id, name: x.name, own: x.own, hidden: x.id === a.id ? true : x.hidden })),
      moved: moveImpulses(c, impulsesOf(c), a.id, to),
    }));
    if (area === a.id) area = 'all';
    offerDone(t('"{name}" deleted.', { name: areaName(a, t) }), () => restoreCfg(before));
  }
  async function addArea(e) {
    e.preventDefault();
    const name = newArea.trim();
    if (!name) return;
    await saveAreas([...areas, { id: uid('area'), name, own: true, hidden: false }]);
    newArea = '';
  }
  const ids = () => shownAreas.map((a) => a.id);
  function reorder(id, to) {
    const list = [...shownAreas];
    const from = list.findIndex((a) => a.id === id);
    const [a] = list.splice(from, 1);
    list.splice(to, 0, a);
    return saveAreas([...list, ...areas.filter((x) => x.hidden)]);
  }
  const onmove = (from, to) => reorder(ids()[from], to);
  const step = (id, dir) => {
    const i = ids().indexOf(id);
    const to = Math.min(Math.max(i + dir, 0), ids().length - 1);
    return to === i ? null : reorder(id, to);
  };

  /* ---------- the small helpers in a card ---------- */
  let silly = $state(SILLY[(new Date().getDate()) % SILLY.length]);
  const sillyList = $derived([...SILLY.map((s) => ({ id: s, text: t(s) })), ...(cfg.silly ?? []).map((s) => ({ id: s, text: s, own: true }))]);
  let ownSilly = $state('');
  const nextSilly = () => (silly = nextOf(sillyList, silly)?.id ?? silly);
  async function addSilly(e) {
    e.preventDefault();
    const s = ownSilly.trim();
    if (!s) return;
    await changeCfg((c) => ({ ...c, silly: [...(c.silly ?? []), s] }));
    silly = s;
    ownSilly = '';
  }
  async function removeSilly(s) {
    const before = await changeCfg((c) => ({ ...c, silly: (c.silly ?? []).filter((x) => x !== s) }));
    silly = SILLY[0];
    offerDone(t('"{name}" deleted.', { name: s }), () => restoreCfg(before));
  }
  let togetherTime = $state('30');
  let togetherIdea = $state('');
  let inviteWhen = $state('');
  const invite = $derived(togetherIdea ? inviteText(togetherIdea, inviteWhen.trim(), t) : '');
  async function share(text) {
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        offerDone(t('Copied. Paste it into a message.'));
      }
    } catch {
      /* the person closed the share window */
    }
  }
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 864e5).toISOString().slice(0, 10);
  const sunrise = $derived.by(() => {
    if (!home?.lat) return null;
    const s = sunTimes(tomorrow, home.lat, home.lon);
    return s ? new Date(s.rise).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : null;
  });
  let ticks = $state({});
  const tickKey = (list, x) => `${list}:${x}`;

  // Impeccable 20.10.2026 P3 (Noah «alles umsetzen»): the list is short rows; a tap opens the whole card under its row
  let openId = $state(null);
  const onToday = $derived(cfg.onToday !== false);
  const setOnToday = (v) => changeCfg((c) => ({ ...c, onToday: v }));
</script>

{#snippet helper(i)}
  {#if i.go?.inline === 'take' || i.go?.inline === 'sunrise'}
    {@const list = i.go.inline === 'take' ? TAKE_ALONG : SUNRISE_LIST}
    {#if i.go.inline === 'sunrise'}
      <p class="fz-note" data-sunrise>
        <Sunrise size={14} aria-hidden="true" />
        {#if sunrise}{t('Sunrise tomorrow at {place}: {time}', { place: home.name, time: sunrise })}{:else}{t('Set your home place under Me to see tomorrow’s sunrise here.')}{/if}
      </p>
    {/if}
    <ul class="fz-list fzi-check">
      {#each list as x (x)}
        <li><label class="fz-row"><input type="checkbox" checked={!!ticks[tickKey(i.id, x)]} onchange={() => (ticks = { ...ticks, [tickKey(i.id, x)]: !ticks[tickKey(i.id, x)] })} /><span>{t(x)}</span></label></li>
      {/each}
    </ul>
  {:else if i.go?.inline === 'silly'}
    {@const cur = sillyList.find((s) => s.id === silly) ?? sillyList[0]}
    <p class="fzi-silly" data-silly>{cur?.text}</p>
    <div class="fz-acts">
      <button type="button" class="btn sm" onclick={nextSilly} data-silly-next><Shuffle size={16} aria-hidden="true" />{t('Another silly idea')}</button>
      {#if cur?.own}<button type="button" class="btn sm" onclick={() => removeSilly(cur.id)}><X size={16} aria-hidden="true" />{t('Delete')}</button>{/if}
    </div>
    <form class="fz-inline" onsubmit={addSilly}>
      <input class="inp" maxlength="120" bind:value={ownSilly} aria-label={t('Your own silly idea')} placeholder={t('Your own silly idea')} />
      <button type="submit" class="btn sm">{t('Add')}</button>
    </form>
  {:else if i.go?.inline === 'together'}
    <div class="fz-chips" role="group" aria-label={t('How much time')}>
      {#each TOGETHER_TIMES as x (x.key)}<button type="button" class="fz-chip" aria-pressed={togetherTime === x.key} onclick={() => (togetherTime = x.key)}>{t(x.name)}</button>{/each}
    </div>
    <div class="fz-chips" role="group" aria-label={t('Ideas')}>
      {#each TOGETHER.filter((x) => x.time === togetherTime) as x (x.name)}<button type="button" class="fz-chip" aria-pressed={togetherIdea === t(x.name)} onclick={() => (togetherIdea = t(x.name))} data-together={x.name}>{t(x.name)}</button>{/each}
    </div>
    {#if togetherIdea}
      <label class="fz-lab">{t('When would you have time?')}<input class="inp" maxlength="60" bind:value={inviteWhen} placeholder={t('e.g. Saturday afternoon')} /></label>
      <p class="fz-text fzi-invite" data-invite>{invite}</p>
      <div class="fz-acts"><button type="button" class="btn sm hi" onclick={() => share(invite)}><Share2 size={16} aria-hidden="true" />{t('Send the invitation')}</button></div>
    {/if}
  {/if}
{/snippet}

{#snippet card(i, big = false)}
  <article class="fz-box fzi-card" class:fz-soft={big} class:fzi-off={i.hidden} data-impulse={i.id}>
    {#if big}<h3 class="fz-big">{title(i)}</h3><p class="fzi-area">{nameOfArea(i.area) || t('Without an area')}</p>{/if}
    {#if text(i)}<p class="fz-text">{text(i)}</p>{/if}
    {#if big || i.go?.inline}{@render helper(i)}{/if}
    <div class="fz-acts">
      {#if i.go && !i.go.inline}<a class="btn sm hi" href={impulseHref(i, colls)} data-go>{goLabel(i)}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
      <button type="button" class="btn sm" onclick={() => done(i)} data-done><Check size={16} aria-hidden="true" />{t('Done it')}</button>
      {#if big}<button type="button" class="btn sm" onclick={anotherTop} data-another><Shuffle size={16} aria-hidden="true" />{t('Another idea')}</button>{/if}
      <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: title(i) })} onclick={() => openEdit(i)} data-edit><Pencil size={18} aria-hidden="true" /></button>
      {#if i.own}
        <button type="button" class="fz-icon" aria-label={t('Delete {name}', { name: title(i) })} onclick={() => remove(i)} data-del><X size={18} aria-hidden="true" /></button>
      {:else if i.hidden}
        <button type="button" class="fz-icon" aria-label={t('Show {name} again', { name: title(i) })} onclick={() => unhide(i)} data-unhide><Eye size={18} aria-hidden="true" /></button>
      {:else}
        <button type="button" class="fz-icon" aria-label={t('Hide {name}', { name: title(i) })} onclick={() => hide(i)} data-hide><EyeOff size={18} aria-hidden="true" /></button>
      {/if}
    </div>
  </article>
{/snippet}

<div class="fz" data-page="impulse">
  {#if fromActive}
    <Crumb path={[{ href: '#/auswerten', label: t('Analysis|place') }]} here={t('Impulses')} />
  {:else}
    <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: '#/me/frei', label: t('Free time') }]} here={t('Impulses')} />
  {/if}
  <h1 class="fz-h1" tabindex="-1" data-page-title>{t('Impulses')}</h1>
  <p class="fz-intro">{t('Small ideas for free time, in ten areas. Tap one, try it, or hide what is not for you.')}</p>

  {#if top}
    <section aria-labelledby="fzi-top-h">
      <h2 id="fzi-top-h" class="fz-h2 fzi-toph"><Sparkles size={18} aria-hidden="true" />{t('Impulse for today')}</h2>
      {@render card(top, true)}
    </section>
  {/if}

  <section class="fz-form" aria-labelledby="fzi-all-h">
    <div class="fzi-head">
      <h2 id="fzi-all-h" class="fz-h2">{t('All impulses')}</h2>
      <button type="button" class="btn sm" aria-expanded={manage} onclick={() => (manage = !manage)} data-areas><Settings2 size={16} aria-hidden="true" />{t('Areas|frei')}</button>
    </div>
    <div class="fz-chips fzi-chips noswipe" role="group" aria-label={t('Areas|frei')}>
      <button type="button" class="fz-chip" aria-pressed={area === 'all'} onclick={() => (area = 'all')}>{t('All')}</button>
      {#each shownAreas as a (a.id)}<button type="button" class="fz-chip" aria-pressed={area === a.id} onclick={() => (area = a.id)} data-area={a.id}>{areaName(a, t)}</button>{/each}
      {#if orphans.length}<button type="button" class="fz-chip" aria-pressed={area === ''} onclick={() => (area = '')} data-area="">{t('Without an area')}</button>{/if}
    </div>

    {#if manage}
      <div class="fz-box" data-area-manage>
        <p class="fz-note">{t('Rename, sort (drag or arrows) or delete the areas. Deleting asks where its impulses go.')}</p>
        <ul class="fz-list" use:sortable={{ onmove }}>
          {#each shownAreas as a, n (a.id)}
            <li class="fz-row" data-sort-id={a.id}>
              <SortGrip name={areaName(a, t)} onstep={(dir) => step(a.id, dir)} />
              <span class="fz-row-main"><b>{areaName(a, t)}</b><small>{tn(inArea(visible, a.id, areas).length, '{n} impulse', '{n} impulses')}</small></span>
              {#if !phone.matches}<SortArrows name={areaName(a, t)} i={n} n={shownAreas.length} onstep={(dir) => step(a.id, dir)} />{/if}
              <button type="button" class="fz-icon" aria-label={t('Rename {name}', { name: areaName(a, t) })} onclick={() => (renaming = a)} data-area-rename><Pencil size={18} aria-hidden="true" /></button>
              <button type="button" class="fz-icon" aria-label={t('Delete {name}', { name: areaName(a, t) })} onclick={() => (deleting = a)} data-area-delete><X size={18} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
        <form class="fz-inline" onsubmit={addArea}>
          <input class="inp" maxlength="40" bind:value={newArea} aria-label={t('New area')} placeholder={t('New area')} />
          <button type="submit" class="btn sm"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
        </form>
        <label class="fz-row"><input type="checkbox" checked={onToday} onchange={(e) => setOnToday(e.currentTarget.checked)} data-ontoday /><span>{t('Show an impulse on Today when there is no ride idea')}</span></label>
      </div>
    {/if}

    {#if !listed.length}<p class="fz-empty">{t('Nothing here yet. Add your own impulse below.')}</p>{/if}
    <ul class="fzi-rows">
      {#each listed as i (i.id)}
        <li class="fzi-li" class:fzi-off={i.hidden} data-impulse-row={i.id}>
          <button type="button" class="fzi-rowbtn" aria-expanded={openId === i.id} onclick={() => (openId = openId === i.id ? null : i.id)}>
            <span class="fzi-rm"><b>{title(i)}</b><small>{nameOfArea(i.area) || t('Without an area')}{#if i.hidden}{' '}· {t('hidden')}{/if}</small></span>
            <ChevronDown class="fzi-chev" size={18} aria-hidden="true" />
          </button>
          {#if openId === i.id}{@render card(i)}{/if}
        </li>
      {/each}
    </ul>
    <div class="fz-acts">
      <button type="button" class="btn" onclick={openNew} data-new-impulse><Plus size={16} aria-hidden="true" />{t('Your own impulse')}</button>
      {#if hiddenCount || showHidden}<button type="button" class="btn" aria-pressed={showHidden} onclick={() => (showHidden = !showHidden)} data-show-hidden><Eye size={16} aria-hidden="true" />{showHidden ? t('Leave hidden ones out') : tn(hiddenCount, 'Show hidden ({n})', 'Show hidden ({n})')}</button>{/if}
    </div>
  </section>
</div>

{#if edit}
  <FreiSheet title={edit.id ? t('Change impulse') : t('Your own impulse')} onsave={saveEdit} onclose={() => (edit = null)}>
    <label class="fz-lab">{t('Name')}<input class="inp" maxlength="120" bind:value={edit.title} data-imp-title /></label>
    <label class="fz-lab">{t('Text (optional)')}<textarea class="inp" rows="4" maxlength="800" bind:value={edit.text} data-imp-text></textarea></label>
    <label class="fz-lab">{t('Area|frei')}
      <select class="inp" bind:value={edit.area}>
        <option value="">{t('Without an area')}</option>
        {#each shownAreas as a (a.id)}<option value={a.id}>{areaName(a, t)}</option>{/each}
      </select>
    </label>
    {#if edit.std && all.find((x) => x.id === edit.id)?.edited}<button type="button" class="btn sm" onclick={resetEdit}>{t('Back to the original text')}</button>{/if}
  </FreiSheet>
{/if}
{#if renaming}
  <RenameSheet kicker={t('Area|frei')} title={t('Rename area')} value={areaName(renaming, t)} hint={t('Empty brings back the original name.')} empty={renaming.own ? '' : t('original name')} onsave={renameArea} onclose={() => (renaming = null)} />
{/if}
{#if deleting}
  <GroupDeleteSheet
    title={t('Delete area «{name}»?', { name: areaName(deleting, t) })}
    count={inArea(visible, deleting.id, areas).length}
    what={(n) => tn(n, '{n} impulse', '{n} impulses')}
    none={t('Without an area')}
    noneHint={t('They stay and show under «Without an area».')}
    targets={shownAreas.filter((a) => a.id !== deleting.id).map((a) => ({ id: a.id, name: areaName(a, t) }))}
    onconfirm={deleteArea}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .fzi-toph {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .fzi-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .fzi-area {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fzi-rows {
    display: grid;
    gap: var(--sp-1);
    margin: var(--sp-2) 0;
    padding: 0;
    list-style: none;
  }
  .fzi-li {
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .fzi-li :global(.fzi-card) {
    margin: 0 var(--sp-2) var(--sp-2);
  }
  .fzi-rowbtn {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    width: 100%;
    min-height: 52px;
    padding: var(--sp-2) var(--sp-3);
    border: 0;
    background: none;
    color: var(--ink);
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  .fzi-rm {
    flex: 1;
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .fzi-rm b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .fzi-rm small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fzi-rowbtn[aria-expanded='true'] :global(.fzi-chev) {
    transform: rotate(180deg);
  }
  /* one row of area chips that scrolls sideways on a phone, instead of four rows */
  @media (max-width: 719px) {
    .fzi-chips {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      margin: 0 calc(-1 * var(--gut));
      padding: 0 var(--gut) var(--sp-1);
    }
    .fzi-chips :global(.fz-chip) {
      flex: none;
    }
  }
  .fzi-off {
    opacity: 0.6;
  }
  .fzi-silly {
    margin: 0;
    font: 600 var(--fs-body)/1.4 var(--font-body);
  }
  .fzi-invite {
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .fzi-check .fz-row {
    min-height: 44px;
    cursor: pointer;
  }
</style>
