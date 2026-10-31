<script>
  /**
   * Mini-Tools «Wann muss ich losfahren?» (Noah 28.10.2026, idea 10): #/me/mini/abfahrt lists the meetings,
   * #/me/mini/abfahrt/<id> is one. A meeting point and a time; each person's start place and speed; the app
   * says when each one has to leave so all arrive together (straight line × 1.3, no paid route service).
   * Everything stays on this device (db.settings «mini-abfahrt», lib/mini/abfahrt.js).
   * Meetings and people can be added, renamed and deleted (with Undo) and moved with arrows and drag.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { HOME_PLACE } from '../know.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerRename } from '../ui/rename.svelte.js';
  import PlacePick from './PlacePick.svelte';
  import { freshId } from './los.js';
  import { ABFAHRT_KEY, SPEEDS, PEOPLE_MAX, BUFFER_DEFAULT, SPEED_DEFAULT, listOf, newMeet, cleanPerson, plan, planText, durText } from './abfahrt.js';
  import { Clock, Plus, ChevronRight, Pencil, Trash2, MessageCircle, Copy, UserPlus, MapPin } from '@lucide/svelte';

  /** id: the open meeting, or '' for the list. */
  let { id = '' } = $props();

  const q = liveQuery(async () => (await db.settings.get(ABFAHRT_KEY)) ?? null);
  const homeQ = liveQuery(async () => (await db.settings.get(HOME_PLACE))?.value ?? null);
  const meets = $derived(listOf($q?.value));
  const loaded = $derived($q !== undefined);
  const meet = $derived(id ? (meets.find((x) => x.id === id) ?? null) : null);
  const home = $derived($homeQ && Number.isFinite($homeQ.lat) ? $homeQ : null);

  const save = (list) => db.settings.put({ key: ABFAHRT_KEY, value: list });
  async function change(fn) {
    const list = listOf((await db.settings.get(ABFAHRT_KEY))?.value);
    await save(list.map((x) => (x.id === id ? fn(structuredClone(x)) : x)));
  }
  function moveIn(list, from, to) {
    if (to < 0 || to >= list.length || from === to) return null;
    const next = [...list];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    return next;
  }

  // ---- list
  async function start() {
    const last = meets[0];
    const m = newMeet({ title: t('Meeting'), place: last?.place ?? null, day: localDay(), time: last?.time ?? '09:00', people: last ? last.people : [] }, freshId('ab', meets.map((x) => x.id)));
    await save([m, ...meets]);
    location.hash = `#/me/mini/abfahrt/${encodeURIComponent(m.id)}`;
  }
  async function moveMeet(from, to) {
    const next = moveIn(meets, from, to);
    if (next) await save(next);
  }

  // ---- one meeting
  let newName = $state('');
  let addErr = $state('');
  let renaming = $state(null); // null | { what: 'meet' } | { what: 'person', p }
  let said = $state('');
  const rows = $derived(meet ? plan(meet) : []);
  const ready = $derived(rows.filter((r) => r.leave));
  const text = $derived(meet ? planText(meet, rows, t) : '');
  const wa = $derived(`https://wa.me/?text=${encodeURIComponent(text)}`);
  const dayFmt = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }) : '');
  const speedLabel = (kmh) => SPEEDS.find((s) => s.kmh === kmh)?.label;

  const setMeet = (patch) => change((x) => ({ ...x, ...patch }));
  const setPerson = (pid, patch) => change((x) => ({ ...x, people: x.people.map((y) => (y.id === pid ? cleanPerson({ ...y, ...patch }) : y)) }));

  async function addPerson(e) {
    e?.preventDefault?.();
    addErr = '';
    const name = newName.replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!name) return (addErr = t('Write a name first.'));
    if (meet.people.length >= PEOPLE_MAX) return (addErr = t('At most {n} people.', { n: PEOPLE_MAX }));
    const p = cleanPerson({ name, speed: SPEED_DEFAULT, buffer: BUFFER_DEFAULT }, freshId('p', meet.people.map((x) => x.id)));
    await change((x) => ({ ...x, people: [...x.people, p] }));
    newName = '';
  }
  async function removePerson(p) {
    const a = await askDelete({ title: t('Remove «{name}»?', { name: p.name }), text: t('Only from this meeting. You can undo it right after.'), label: t('Remove') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      name: p.name,
      text: t('«{name}» removed.', { name: p.name }),
      run: async () => {
        const at = meet.people.findIndex((x) => x.id === p.id);
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
    const next = moveIn(meet.people, from, to);
    if (next) await change((x) => ({ ...x, people: next }));
  }
  async function rename(name) {
    const clean = String(name ?? '').replace(/\s+/g, ' ').trim();
    if (!clean) return t('Write a name first.');
    const r = renaming;
    if (r.what === 'meet') {
      const old = meet.title;
      await setMeet({ title: clean.slice(0, 60) });
      offerRename(clean, () => change((x) => ({ ...x, title: old })));
    } else {
      const old = r.p.name;
      await setPerson(r.p.id, { name: clean.slice(0, 40) });
      offerRename(clean, () => setPerson(r.p.id, { name: old }));
    }
    renaming = null;
  }
  async function removeMeet() {
    const a = await askDelete({ title: t('Delete «{name}»?', { name: meet.title }), text: t('The meeting point and the people of this meeting go. You can undo it right after.') });
    if (a !== 'delete') return;
    const ok = await deleteWithUndo({
      name: meet.title,
      text: t('«{name}» deleted.', { name: meet.title }),
      run: async () => {
        const list = listOf((await db.settings.get(ABFAHRT_KEY))?.value);
        const at = list.findIndex((x) => x.id === meet.id);
        const old = list[at];
        await save(list.filter((x) => x.id !== meet.id));
        return { old, at };
      },
      undo: async ({ old, at }) => {
        const list = listOf((await db.settings.get(ABFAHRT_KEY))?.value).filter((x) => x.id !== old.id);
        list.splice(Math.min(at, list.length), 0, old);
        await save(list);
        location.hash = `#/me/mini/abfahrt/${encodeURIComponent(old.id)}`;
      },
    });
    if (ok) location.hash = '#/me/mini/abfahrt';
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      said = t('Plan copied.');
    } catch {
      said = t('Copying did not work. Select the plan and copy it by hand.');
    }
  }
</script>

{#if !id}
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }]} title={t('When do I leave?')} sub={t('Everybody starts somewhere else; the app says when each one leaves so you all arrive together')} />
  <div class="ich-main ab-main" data-ab>
    <div><button type="button" class="btn hi" onclick={start} data-ab-new><Plus size={18} aria-hidden="true" />{t('New meeting')}</button></div>
    <p class="ab-help">{t('A new meeting takes the meeting point and the people of your last one; you can change them right after.')}</p>
    <section class="ich-sec" aria-labelledby="ab-mine-h">
      <div class="ich-h"><div><h2 id="ab-mine-h">{t('Your meetings')}</h2></div></div>
      {#if loaded && !meets.length}
        <p class="ab-help" data-ab-empty>{t('None yet. Tap «New meeting».')}</p>
      {:else}
        <ul class="ich-list card ab-list" use:sortable={{ onmove: moveMeet }} data-ab-list>
          {#each meets as x, i (x.id)}
            <li class="ab-lrow">
              <SortGrip name={x.title} onstep={(dir) => moveMeet(i, i + dir)} />
              <a class="ich-row" href={`#/me/mini/abfahrt/${encodeURIComponent(x.id)}`} data-ab-item={x.id}>
                <span class="ich-ib"><Clock size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{x.title}</b><small>{[x.place?.name, x.time, t('{n} people', { n: x.people.length })].filter(Boolean).join(' · ')}</small></span>
                <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
              </a>
              <SortArrows name={x.title} {i} n={meets.length} onstep={(dir) => moveMeet(i, i + dir)} />
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
{:else if !loaded}
  <p class="ab-help">…</p>
{:else if !meet}
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }, { label: t('When do I leave?'), href: '#/me/mini/abfahrt' }]} title={t('When do I leave?')} />
  <p class="ab-help" data-ab-gone>{t('This meeting is no longer here.')} <a href="#/me/mini/abfahrt">{t('To the meetings')}</a></p>
{:else}
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }, { label: t('When do I leave?'), href: '#/me/mini/abfahrt' }]} title={meet.title} sub={[dayFmt(meet.day), meet.time, meet.place?.name].filter(Boolean).join(' · ')} />
  <div class="ich-main ab-main" data-ab-meet>
    <section class="card ab-box" aria-labelledby="ab-where-h">
      <h2 id="ab-where-h"><MapPin size={18} aria-hidden="true" /> {t('Meeting point and time')}</h2>
      <PlacePick value={meet.place} {home} label={t('Meeting point')} onpick={(p) => setMeet({ place: p })} testid="meet" />
      <div class="ab-two">
        <label class="ab-fld"><span>{t('Day (optional)')}</span><input type="date" value={meet.day} onchange={(e) => setMeet({ day: e.currentTarget.value })} data-ab-day /></label>
        <label class="ab-fld"><span>{t('Time at the meeting point')}</span><input type="time" value={meet.time} onchange={(e) => e.currentTarget.value && setMeet({ time: e.currentTarget.value })} data-ab-time /></label>
      </div>
    </section>

    <section class="card ab-box ab-plan" aria-labelledby="ab-plan-h" data-ab-plan>
      <h2 id="ab-plan-h"><Clock size={18} aria-hidden="true" /> {t('When who leaves')}</h2>
      {#if !meet.place}
        <p class="ab-help" data-ab-noplace>{t('Pick the meeting point first.')}</p>
      {:else if !meet.people.length}
        <p class="ab-help">{t('Add the people below, each with their start place.')}</p>
      {:else}
        <ol class="ab-rows" data-ab-rows>
          {#each rows as r (r.id)}
            <li data-ab-row={r.name}>
              {#if r.leave}
                <b class="ab-at" data-ab-at>{r.leave.at}</b>
                <span class="ab-who"><b>{r.name}</b><small>{r.from.name} · {r.km.toFixed(0)} km · {durText(r.ride)}{r.buffer ? ` + ${r.buffer} min` : ''}{r.leave.prev ? ` · ${t('the day before')}` : ''}</small></span>
              {:else}
                <b class="ab-at ab-none">–</b>
                <span class="ab-who"><b>{r.name}</b><small>{t('Start place missing')}</small></span>
              {/if}
            </li>
          {/each}
        </ol>
        {#if ready.length}
          <div class="ab-acts">
            <button type="button" class="btn" onclick={copy} data-ab-copy><Copy size={16} aria-hidden="true" />{t('Copy')}</button>
            <a class="btn" href={wa} target="_blank" rel="noopener" data-ab-wa><MessageCircle size={16} aria-hidden="true" />{t('Send to the group')}</a>
          </div>
        {/if}
        {#if said}<p class="ab-help" role="status">{said}</p>{/if}
      {/if}
      <p class="ab-help">{t('A guess: straight line × 1.3 for roads and paths, at each person’s speed, plus their buffer. Hills and traffic are not in it.')}</p>
    </section>

    <section class="card ab-box" aria-labelledby="ab-ppl-h">
      <h2 id="ab-ppl-h">{t('Who comes from where')}</h2>
      {#if meet.people.length}
        <ul class="ab-people" use:sortable={{ onmove: movePerson }} data-ab-people>
          {#each meet.people as p, i (p.id)}
            <li class="ab-p" data-ab-person={p.name}>
              <div class="ab-ph">
                <SortGrip name={p.name} onstep={(dir) => movePerson(i, i + dir)} />
                <button type="button" class="ab-name" aria-label={t('Rename {name}', { name: p.name })} onclick={() => (renaming = { what: 'person', p })}>{p.name}</button>
                <button type="button" class="ab-ic" aria-label={t('Remove {name}', { name: p.name })} onclick={() => removePerson(p)} data-ab-remove><Trash2 size={16} aria-hidden="true" /></button>
                <SortArrows name={p.name} {i} n={meet.people.length} onstep={(dir) => movePerson(i, i + dir)} />
              </div>
              <PlacePick value={p.from} {home} label={t('Start place of {name}', { name: p.name })} onpick={(f) => setPerson(p.id, { from: f })} testid={`from-${i}`} />
              <div class="ab-chips" role="radiogroup" aria-label={t('Speed of {name}', { name: p.name })}>
                {#each SPEEDS as s (s.kmh)}<button type="button" role="radio" class="ab-chip" class:on={p.speed === s.kmh} aria-checked={p.speed === s.kmh} onclick={() => setPerson(p.id, { speed: s.kmh })} data-ab-speed={s.kmh}>{t(s.label)} <small>{String(s.kmh).replace('.', locale().startsWith('de') ? ',' : '.')} km/h</small></button>{/each}
              </div>
              <label class="ab-fld ab-buf"><span>{t('Buffer')}</span>
                <select value={p.buffer} onchange={(e) => setPerson(p.id, { buffer: Number(e.currentTarget.value) })} data-ab-buffer>
                  {#each [0, 5, 10, 15, 20, 30] as b (b)}<option value={b}>{b} min</option>{/each}
                </select>
              </label>
              {#if !speedLabel(p.speed)}<small class="ab-help">{p.speed} km/h</small>{/if}
            </li>
          {/each}
        </ul>
        <p class="ab-help">{t('Tap a name to change it. The buffer is time for the start, a coffee or a red light.')}</p>
      {/if}
      <form class="ab-add" onsubmit={addPerson}>
        <input type="text" bind:value={newName} maxlength="40" placeholder={t('Name')} aria-label={t('Name')} data-ab-name />
        <button type="submit" class="btn" data-ab-add><UserPlus size={16} aria-hidden="true" />{t('Add')}</button>
      </form>
      {#if addErr}<p class="ab-err" role="alert">{addErr}</p>{/if}
    </section>

    <div class="ab-acts">
      <button type="button" class="btn sm" onclick={() => (renaming = { what: 'meet' })} data-ab-rename><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>
      <button type="button" class="btn sm" onclick={removeMeet} data-ab-delete><Trash2 size={16} aria-hidden="true" />{t('Delete meeting')}</button>
    </div>
  </div>
  {#if renaming}
    <RenameSheet kicker={renaming.what === 'meet' ? t('When do I leave?') : t('Person')} title={t('Rename')} value={renaming.what === 'meet' ? meet.title : renaming.p.name} max={renaming.what === 'meet' ? 60 : 40} onsave={rename} onclose={() => (renaming = null)} />
  {/if}
{/if}

<style>
  .ab-main {
    display: grid;
    gap: var(--sp-3);
  }
  .ab-box {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-3);
    min-width: 0;
  }
  .ab-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .ab-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ab-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .ab-list {
    list-style: none;
    padding: 0;
  }
  .ab-lrow {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
    padding-inline: var(--sp-1);
  }
  .ab-lrow .ich-row {
    flex: 1;
    min-width: 0;
  }
  .ab-two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--sp-3);
  }
  .ab-fld {
    display: grid;
    gap: var(--sp-1);
  }
  .ab-fld > span {
    font-weight: 600;
  }
  .ab-fld input,
  .ab-fld select {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .ab-buf {
    max-width: 200px;
  }
  .ab-rows,
  .ab-people {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-2);
  }
  .ab-rows li {
    display: flex;
    align-items: baseline;
    gap: var(--sp-3);
    padding-bottom: var(--sp-2);
    border-bottom: 1px solid var(--line);
  }
  .ab-at {
    flex: none;
    min-width: 3.2em;
    font-size: var(--fs-section);
    font-variant-numeric: tabular-nums;
  }
  .ab-none {
    color: var(--ink-3);
  }
  .ab-who {
    flex: 1;
    min-width: 0;
    display: grid;
    overflow-wrap: break-word;
  }
  .ab-who small {
    color: var(--ink-3);
  }
  .ab-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .ab-p {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-2);
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .ab-ph {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
  }
  .ab-name {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 700;
    text-align: left;
    overflow-wrap: break-word;
    cursor: pointer;
  }
  .ab-ic {
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
  .ab-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .ab-chip {
    min-height: 44px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .ab-chip small {
    color: inherit;
    opacity: 0.75;
  }
  .ab-chip.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .ab-add {
    display: flex;
    gap: var(--sp-2);
  }
  .ab-add .btn {
    flex: none;
  }
  .ab-add input {
    flex: 1;
    width: auto;
    min-width: 0;
    min-height: 44px;
  }
</style>
