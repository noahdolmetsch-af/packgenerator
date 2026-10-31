<script>
  /**
   * Mini-Tools «Fair auslosen» (Noah 28.10.2026, idea 9): #/me/mini/los lists the draws, #/me/mini/los/<id> is one.
   * Who cooks, who rides in front, who sleeps in which tent: fair, so whoever was drawn less often comes first.
   * Everything stays on this device (db.settings «mini-lose», lib/mini/los.js), no link and no server.
   * People, draws and results can be added, renamed and deleted (with Undo); people and draws move with arrows and drag.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerRename } from '../ui/rename.svelte.js';
  import { LOS_KEY, MODES, STARTS, PEOPLE_MAX, listOf, freshId, newDraw, countsOf, drawNow, withEntry, namesOf, resultText } from './los.js';
  import { Dices, Plus, ChevronRight, Pencil, Trash2, MessageCircle, Copy, UserPlus, History } from '@lucide/svelte';

  /** id: the open draw, or '' for the list. */
  let { id = '' } = $props();

  const q = liveQuery(async () => (await db.settings.get(LOS_KEY)) ?? null);
  const draws = $derived(listOf($q?.value));
  const loaded = $derived($q !== undefined);
  const draw = $derived(id ? (draws.find((x) => x.id === id) ?? null) : null);

  const save = (list) => db.settings.put({ key: LOS_KEY, value: list });
  async function change(fn) {
    const list = listOf((await db.settings.get(LOS_KEY))?.value);
    await save(list.map((x) => (x.id === id ? fn(structuredClone(x)) : x)));
  }
  function moveIn(list, from, to) {
    if (to < 0 || to >= list.length || from === to) return null;
    const next = [...list];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    return next;
  }

  // ---- list of draws
  async function start(s) {
    const last = draws[0];
    const d = newDraw({ title: s ? t(s.title) : t('New draw'), mode: s?.mode ?? 'one', size: s?.size ?? 2, people: last ? last.people.map((p) => ({ id: p.id, name: p.name })) : [] }, freshId('los', draws.map((x) => x.id)));
    await save([d, ...draws]);
    location.hash = `#/me/mini/los/${encodeURIComponent(d.id)}`;
  }
  async function moveDraw(from, to) {
    const next = moveIn(draws, from, to);
    if (next) await save(next);
  }

  // ---- one draw
  let away = $state({}); // people not taking part this time (id → true), only for this visit
  let newName = $state('');
  let addErr = $state('');
  let renaming = $state(null); // null | { what: 'draw' } | { what: 'person', p }
  let said = $state('');
  const taking = $derived(draw ? draw.people.filter((p) => !away[p.id]).map((p) => p.id) : []);
  const need = $derived(draw?.mode === 'groups' ? 2 : 1);
  const counts = $derived(draw ? countsOf(draw) : {});
  const history = $derived(draw ? [...(draw.history ?? [])].reverse() : []);
  const latest = $derived(history[0] ?? null);
  const text = $derived(draw && latest ? resultText(draw, latest, t) : '');
  const wa = $derived(`https://wa.me/?text=${encodeURIComponent(text)}`);
  const atFmt = (iso) => new Date(iso).toLocaleString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
  const modeOf = (k) => MODES.find((m) => m.key === k) ?? MODES[0];

  async function addPerson(e) {
    e?.preventDefault?.();
    addErr = '';
    const name = newName.replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!name) return (addErr = t('Write a name first.'));
    if (draw.people.length >= PEOPLE_MAX) return (addErr = t('At most {n} people.', { n: PEOPLE_MAX }));
    const pid = freshId('p', draw.people.map((p) => p.id));
    await change((x) => ({ ...x, people: [...x.people, { id: pid, name }] }));
    newName = '';
  }
  async function removePerson(p) {
    const a = await askDelete({ title: t('Remove «{name}»?', { name: p.name }), text: t('Earlier results keep the name. You can undo it right after.'), label: t('Remove') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      name: p.name,
      text: t('«{name}» removed.', { name: p.name }),
      run: async () => {
        const at = draw.people.findIndex((x) => x.id === p.id);
        await change((x) => ({ ...x, people: x.people.filter((y) => y.id !== p.id) }));
        return { p, at };
      },
      undo: async ({ p: old, at }) => {
        await change((x) => {
          const people = x.people.filter((y) => y.id !== old.id);
          people.splice(Math.min(at, people.length), 0, old);
          return { ...x, people };
        });
      },
    });
  }
  async function movePerson(from, to) {
    const next = moveIn(draw.people, from, to);
    if (next) await change((x) => ({ ...x, people: next }));
  }
  async function rename(name) {
    const clean = String(name ?? '').replace(/\s+/g, ' ').trim();
    if (!clean) return t('Write a name first.');
    const r = renaming;
    if (r.what === 'draw') {
      const old = draw.title;
      await change((x) => ({ ...x, title: clean.slice(0, 60) }));
      offerRename(clean, () => change((x) => ({ ...x, title: old })));
    } else {
      const old = r.p.name;
      await change((x) => ({ ...x, people: x.people.map((y) => (y.id === r.p.id ? { ...y, name: clean.slice(0, 40) } : y)) }));
      offerRename(clean, () => change((x) => ({ ...x, people: x.people.map((y) => (y.id === r.p.id ? { ...y, name: old } : y)) })));
    }
    renaming = null;
  }
  const setMode = (key) => change((x) => ({ ...x, mode: key }));
  const setSize = (n) => change((x) => ({ ...x, size: Math.min(10, Math.max(2, n)) }));

  async function drawIt() {
    said = '';
    if (taking.length < need) return (said = draw.mode === 'groups' ? t('Groups need at least two people.') : t('Add a person first.'));
    const h = drawNow(draw, taking);
    await change((x) => withEntry(x, h));
  }
  async function removeEntry(h) {
    const a = await askDelete({ title: t('Delete this result?'), text: t('It no longer counts for who is next. You can undo it right after.') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      name: draw.title,
      text: t('Result deleted.'),
      run: async () => {
        const at = (draw.history ?? []).findIndex((x) => x.id === h.id);
        await change((x) => ({ ...x, history: (x.history ?? []).filter((y) => y.id !== h.id) }));
        return { h, at };
      },
      undo: async ({ h: old, at }) => {
        await change((x) => {
          const list = (x.history ?? []).filter((y) => y.id !== old.id);
          list.splice(Math.min(at, list.length), 0, old);
          return { ...x, history: list };
        });
      },
    });
  }
  async function removeDraw() {
    const a = await askDelete({ title: t('Delete «{name}»?', { name: draw.title }), text: t('The people and all results of this draw go. You can undo it right after.') });
    if (a !== 'delete') return;
    const ok = await deleteWithUndo({
      name: draw.title,
      text: t('«{name}» deleted.', { name: draw.title }),
      run: async () => {
        const list = listOf((await db.settings.get(LOS_KEY))?.value);
        const at = list.findIndex((x) => x.id === draw.id);
        const old = list[at];
        await save(list.filter((x) => x.id !== draw.id));
        return { old, at };
      },
      undo: async ({ old, at }) => {
        const list = listOf((await db.settings.get(LOS_KEY))?.value).filter((x) => x.id !== old.id);
        list.splice(Math.min(at, list.length), 0, old);
        await save(list);
        location.hash = `#/me/mini/los/${encodeURIComponent(old.id)}`;
      },
    });
    if (ok) location.hash = '#/me/mini/los';
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      said = t('Result copied.');
    } catch {
      said = t('Copying did not work. Select the result and copy it by hand.');
    }
  }
  const lineOf = (h) => (h.pick ? namesOf(draw, h.pick)[0] : h.order ? namesOf(draw, h.order).join(' → ') : h.groups.map((g) => namesOf(draw, g).join(' + ')).join(' · '));
</script>

{#if !id}
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }]} title={t('Fair draw')} sub={t('Who cooks, who rides in front, who sleeps where: fair, and it stays on this device')} />
  <div class="ich-main lo-main" data-los>
    <section class="card lo-box" aria-labelledby="lo-start-h">
      <h2 id="lo-start-h">{t('New draw')}</h2>
      <div class="lo-chips">
        {#each STARTS as s (s.title)}<button type="button" class="lo-chip" onclick={() => start(s)} data-los-start={s.mode}>{t(s.title)}</button>{/each}
        <button type="button" class="lo-chip" onclick={() => start(null)} data-los-start="own"><Plus size={16} aria-hidden="true" />{t('Own draw')}</button>
      </div>
      <p class="lo-help">{t('A new draw takes the people of your last one; you can change them right after.')}</p>
    </section>
    <section class="ich-sec" aria-labelledby="lo-mine-h">
      <div class="ich-h"><div><h2 id="lo-mine-h">{t('Your draws')}</h2></div></div>
      {#if loaded && !draws.length}
        <p class="lo-help" data-los-empty>{t('None yet. Pick one above.')}</p>
      {:else}
        <ul class="ich-list card lo-draws" use:sortable={{ onmove: moveDraw }} data-los-list>
          {#each draws as x, i (x.id)}
            <li class="lo-drow">
              <SortGrip name={x.title} onstep={(dir) => moveDraw(i, i + dir)} />
              <a class="ich-row" href={`#/me/mini/los/${encodeURIComponent(x.id)}`} data-los-item={x.id}>
                <span class="ich-ib"><Dices size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{x.title}</b><small>{t(modeOf(x.mode).label)} · {t('{n} people', { n: x.people.length })}</small></span>
                <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
              </a>
              <SortArrows name={x.title} {i} n={draws.length} onstep={(dir) => moveDraw(i, i + dir)} />
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
{:else if !loaded}
  <p class="lo-help">…</p>
{:else if !draw}
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }, { label: t('Fair draw'), href: '#/me/mini/los' }]} title={t('Fair draw')} />
  <p class="lo-help" data-los-gone>{t('This draw is no longer here.')} <a href="#/me/mini/los">{t('To the draws')}</a></p>
{:else}
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }, { label: t('Fair draw'), href: '#/me/mini/los' }]} title={draw.title} sub={`${t(modeOf(draw.mode).label)} · ${t('{n} people', { n: draw.people.length })}`} />
  <div class="ich-main lo-main" data-los-draw>
    <section class="card lo-box lo-go" aria-labelledby="lo-res-h">
      <h2 id="lo-res-h" class="lo-vh">{t('Result')}</h2>
      {#if latest}
        <div class="lo-res" aria-live="polite" data-los-result>
          {#if latest.pick}
            <p class="lo-big">{namesOf(draw, latest.pick)[0]}</p>
          {:else if latest.order}
            <ol class="lo-order">{#each namesOf(draw, latest.order) as n, i (i)}<li>{n}</li>{/each}</ol>
          {:else}
            <ul class="lo-groups">{#each latest.groups as g, i (i)}<li><b>{t('Group {n}', { n: i + 1 })}</b> {namesOf(draw, g).join(', ')}</li>{/each}</ul>
          {/if}
          <small class="lo-help">{atFmt(latest.at)}</small>
        </div>
      {:else}
        <p class="lo-help">{t('Not drawn yet.')}</p>
      {/if}
      <div class="lo-acts">
        <button type="button" class="btn hi" onclick={drawIt} data-los-go><Dices size={18} aria-hidden="true" />{latest ? t('Draw again') : t('Draw now')}</button>
        {#if latest}
          <button type="button" class="btn" onclick={copy} data-los-copy><Copy size={16} aria-hidden="true" />{t('Copy')}</button>
          <a class="btn" href={wa} target="_blank" rel="noopener" data-los-wa><MessageCircle size={16} aria-hidden="true" />{t('Send to the group')}</a>
        {/if}
      </div>
      {#if said}<p class="lo-help" role="status" data-los-said>{said}</p>{/if}
      <p class="lo-help">{t('Fair: whoever was drawn less often comes first; among equals chance decides. Groups try not to repeat the pairs of last time.')}</p>
    </section>

    <section class="card lo-box" aria-labelledby="lo-how-h">
      <h2 id="lo-how-h">{t('What to draw')}</h2>
      <div class="lo-chips" role="radiogroup" aria-label={t('What to draw')}>
        {#each MODES as m (m.key)}<button type="button" role="radio" class="lo-chip" class:on={draw.mode === m.key} aria-checked={draw.mode === m.key} onclick={() => setMode(m.key)} data-los-mode={m.key}>{t(m.label)}</button>{/each}
      </div>
      {#if draw.mode === 'groups'}
        <div class="lo-size">
          <span>{t('People per group')}</span>
          <button type="button" class="btn sm" aria-label={t('Fewer')} disabled={draw.size <= 2} onclick={() => setSize(draw.size - 1)}>−</button>
          <b data-los-size>{draw.size}</b>
          <button type="button" class="btn sm" aria-label={t('More')} disabled={draw.size >= 10} onclick={() => setSize(draw.size + 1)}>+</button>
        </div>
      {/if}
    </section>

    <section class="card lo-box" aria-labelledby="lo-ppl-h">
      <h2 id="lo-ppl-h">{t('Who takes part')}</h2>
      {#if draw.people.length}
        <ul class="lo-people" use:sortable={{ onmove: movePerson }} data-los-people>
          {#each draw.people as p, i (p.id)}
            <li class="lo-p" data-los-person={p.name}>
              <SortGrip name={p.name} onstep={(dir) => movePerson(i, i + dir)} />
              <span class="lo-in">
                <input type="checkbox" checked={!away[p.id]} aria-label={t('{name} takes part', { name: p.name })} onchange={(e) => (away = { ...away, [p.id]: !e.currentTarget.checked })} />
                <button type="button" class="lo-name" aria-label={t('Rename {name}', { name: p.name })} onclick={() => (renaming = { what: 'person', p })} data-los-pname>{p.name}</button>
                {#if draw.mode !== 'groups'}<small class="lo-n" title={t('How often drawn')}>{counts[p.id] ?? 0}×</small>{/if}
              </span>
              <span class="lo-pa">
                <button type="button" class="lo-ic" aria-label={t('Remove {name}', { name: p.name })} onclick={() => removePerson(p)} data-los-remove><Trash2 size={16} aria-hidden="true" /></button>
                <SortArrows name={p.name} {i} n={draw.people.length} onstep={(dir) => movePerson(i, i + dir)} />
              </span>
            </li>
          {/each}
        </ul>
        <p class="lo-help">{t('Untick who is not there this time. Tap a name to change it.')}{draw.mode !== 'groups' ? ` ${t('The number says how often someone was drawn.')}` : ''}</p>
      {/if}
      <form class="lo-add" onsubmit={addPerson}>
        <input type="text" bind:value={newName} maxlength="40" placeholder={t('Name')} aria-label={t('Name')} data-los-name />
        <button type="submit" class="btn" data-los-add><UserPlus size={16} aria-hidden="true" />{t('Add')}</button>
      </form>
      {#if addErr}<p class="lo-err" role="alert">{addErr}</p>{/if}
    </section>

    {#if history.length}
      <section class="card lo-box" aria-labelledby="lo-hist-h">
        <h2 id="lo-hist-h"><History size={18} aria-hidden="true" /> {t('Earlier results')}</h2>
        <ul class="lo-hist" data-los-history>
          {#each history as h (h.id)}
            <li>
              <span class="lo-hm"><small>{atFmt(h.at)}</small><span>{lineOf(h)}</span></span>
              <button type="button" class="lo-ic" aria-label={t('Delete this result')} onclick={() => removeEntry(h)} data-los-hdel><Trash2 size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <div class="lo-acts">
      <button type="button" class="btn sm" onclick={() => (renaming = { what: 'draw' })} data-los-rename><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>
      <button type="button" class="btn sm" onclick={removeDraw} data-los-delete><Trash2 size={16} aria-hidden="true" />{t('Delete draw')}</button>
    </div>
  </div>
  {#if renaming}
    <RenameSheet kicker={renaming.what === 'draw' ? t('Fair draw') : t('Person')} title={t('Rename')} value={renaming.what === 'draw' ? draw.title : renaming.p.name} max={renaming.what === 'draw' ? 60 : 40} onsave={rename} onclose={() => (renaming = null)} />
  {/if}
{/if}

<style>
  .lo-main {
    display: grid;
    gap: var(--sp-3);
  }
  .lo-box {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-3);
    min-width: 0;
  }
  .lo-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .lo-vh {
    color: var(--ink-3);
  }
  .lo-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lo-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .lo-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .lo-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 16px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .lo-chip.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .lo-draws {
    list-style: none;
    padding: 0;
  }
  .lo-drow {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
    padding-inline: var(--sp-1);
  }
  .lo-drow .ich-row {
    flex: 1;
    min-width: 0;
  }
  .lo-res {
    display: grid;
    gap: var(--sp-1);
  }
  .lo-big {
    margin: 0;
    font-size: var(--fs-page);
    font-weight: 800;
    line-height: 1.2;
    overflow-wrap: break-word;
  }
  .lo-order,
  .lo-groups {
    margin: 0;
    padding-left: 1.4em;
    display: grid;
    gap: 4px;
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .lo-groups {
    list-style: none;
    padding: 0;
  }
  .lo-groups b {
    color: var(--ink-3);
    font-weight: 600;
    margin-right: 6px;
  }
  .lo-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .lo-size {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .lo-size span {
    font-weight: 600;
    margin-right: auto;
  }
  .lo-size b {
    min-width: 2ch;
    text-align: center;
  }
  .lo-people,
  .lo-hist {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
  .lo-pa {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
    margin-left: auto;
  }
  .lo-p,
  .lo-hist li {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
    min-height: 44px;
    border-bottom: 1px solid var(--line);
  }
  .lo-in {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
  }
  .lo-in input {
    width: 20px;
    height: 20px;
    flex: none;
  }
  .lo-name {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    overflow-wrap: break-word;
    cursor: pointer;
  }
  .lo-n {
    flex: none;
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }
  .lo-ic {
    flex: none;
    width: 44px;
    height: 44px;
    display: inline-grid;
    place-items: center;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
    border-radius: 8px;
  }
  .lo-add {
    display: flex;
    gap: var(--sp-2);
  }
  .lo-add .btn {
    flex: none;
  }
  .lo-add input {
    flex: 1;
    width: auto;
    min-width: 0;
    min-height: 44px;
  }
  .lo-hm {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .lo-hm small {
    color: var(--ink-3);
  }
</style>
