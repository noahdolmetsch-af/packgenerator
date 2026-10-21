<script>
  /**
   * v0.134.0 «Listen und Typen» (mockups LI1–LI4, Noah «LI1–LI4 freigegeben» 14.10.2026; «a»: the
   * categories first, the other lists follow one by one as their own small releases).
   * #/me/lists: the overview (LI1), every list that can be changed, «Standard» or «Angepasst».
   * #/me/lists?categories: one list (LI2): arrows up and down (answer 2b), the eye hides, the pen opens
   * the entry (LI3, ListEntrySheet), «+ Eigene Kategorie», «Auf Standard zurücksetzen».
   * «Gruppen überall» (Noah 18.10.2026, «gruppen umbenennen und löschen soll grundsätzlich überall auf
   * der app möglich sein»): the same page for the note topics (?noteTopics) and the groups of the bike
   * values (?valueGroups): rename, own ones, order, delete. Deleting a group that holds things asks
   * where they go (GroupDeleteSheet; first choice «Ohne …»), then Undo for a few seconds.
   * Everything is a suggestion of the app: the Standard stays, the person's changes are kept apart
   * (standard.js, lists.js) and travel in the backup.
   */
  import { liveQuery } from 'dexie';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import { db } from '../lib/db.js';
  import { OVERRIDES_KEY, STANDARD_LIST, listFor, isChanged, overrideOf, resetList } from '../lib/standard.js';
  import { saveList, resetToStandard, move, moveTo, toggleHidden, edit, addOwn, remove, applyLists } from '../lib/lists.js';
  import { catIcon, stdIconName } from '../lib/gear/caticon.js';
  import { domainName } from '../lib/domains.js';
  import { noteTopic, isKept } from '../lib/notebook.js';
  import { FIELDS_KEY, groupCounts, moveGroupFields } from '../lib/valuefields.js';
  import { moveItems, moveNotes, targetsOf, writeGroupChange, undoGroupChange } from '../lib/groups.js';
  import ListEntrySheet from '../lib/ich/ListEntrySheet.svelte';
  import GroupDeleteSheet from '../lib/ui/GroupDeleteSheet.svelte';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import UndoToast from '../lib/review/UndoToast.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, tn } from '../lib/i18n.svelte.js';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { ChevronRight, ChevronUp, ChevronDown, Eye, EyeOff, Pencil, Plus, Undo2, Lightbulb, Tag, ListChecks, Info, NotebookPen, SlidersHorizontal, Mountain, Briefcase, Wrench, MapPin, Bike, Palmtree, Feather, Smile, Flower2 } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const overQ = liveQuery(() => db.settings.get(OVERRIDES_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const notesQ = liveQuery(() => db.notes.toArray());
  const fieldsQ = liveQuery(() => db.settings.get(FIELDS_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const checksQ = liveQuery(() => db.settings.where('key').startsWithAnyOf(['eveStandard', 'afterStandard']).toArray());

  // One config per list of groups: the words, how many things each group holds, and where they go
  // when it is deleted (the records that change). full: symbol, «Gilt für» and the eye (categories).
  const KINDS = {
    categories: {
      full: true,
      icon: Tag,
      place: 'Gear|place',
      sub: 'Applies to gear, the packing list and the search. Drag or use the arrows to change the order.',
      ownWord: 'Own category',
      none: 'Without category',
      noneHint: 'The items stay in Gear, without a category. «Back to Standard» brings a Standard category back with them.',
      what: (n) => tn(n, '{n} item', '{n} items'),
      deleteTitle: (name) => t('Delete category «{name}»?', { name }),
    },
    noteTopics: {
      full: false,
      icon: NotebookPen,
      place: 'Notes',
      sub: 'The topics of the notes. Drag or use the arrows to change the order.',
      ownWord: 'Own topic',
      none: 'No topic',
      noneHint: 'The notes show under «No topic» until you give them a topic.',
      what: (n) => tn(n, '{n} note', '{n} notes'),
      deleteTitle: (name) => t('Delete topic «{name}»?', { name }),
      words: (count) => ({ edit: t('Edit topic'), own: t('Own topic'), empty: t('Give the topic a name.'), warn: count ? tn(count, 'Delete: {n} note has this topic. The app then asks where it goes.', 'Delete: {n} notes have this topic. The app then asks where they go.') : t('Delete: no note has this topic.') }),
    },
    valueGroups: {
      full: false,
      icon: SlidersHorizontal,
      place: 'Bikes|place',
      sub: 'The groups on «Enter values», for all bikes. Drag or use the arrows to change the order.',
      ownWord: 'Own group',
      none: 'No group',
      noneHint: 'The fields show under «No group» on «Enter values».',
      what: (n) => tn(n, '{n} field', '{n} fields'),
      deleteTitle: (name) => t('Delete group «{name}»?', { name }),
      words: (count) => ({ edit: t('Edit group'), own: t('Own group'), empty: t('Give the group a name.'), warn: count ? tn(count, 'Delete: {n} field is in this group. The app then asks where it goes.', 'Delete: {n} fields are in this group. The app then asks where they go.') : t('Delete: no field is in this group.') }),
    },
    // «Alles selbst bearbeiten» (Noah 19.10.2026): sports (rename, own, hide, order, delete), the places on
    // the bike and the care parts (rename only: the drawing and the care rules need each of them)
    domains: {
      full: false,
      hideable: true,
      icon: Mountain,
      place: 'Trips|place',
      sub: 'The kinds of trip you choose for a new trip. Drag or use the arrows to change the order.',
      ownWord: 'Own sport',
      none: 'Bikepacking',
      noneHint: 'The trips then count as Bikepacking.',
      what: (n) => tn(n, '{n} trip', '{n} trips'),
      deleteTitle: (name) => t('Delete sport «{name}»?', { name }),
      words: (count) => ({ edit: t('Edit sport'), own: t('Own sport'), empty: t('Give the sport a name.'), warn: count ? tn(count, 'Delete: {n} trip has this sport. Hidden and deleted sports are no longer offered for a new trip.', 'Delete: {n} trips have this sport. Hidden and deleted sports are no longer offered for a new trip.') : t('Delete: no trip has this sport.') }),
    },
    bikeSlots: {
      full: false,
      renameOnly: true,
      icon: Briefcase,
      place: 'Bikes|place',
      sub: 'The places for bags on every bike. Only the name changes; the bags stay where they are.',
      ownWord: '',
      what: (n) => tn(n, '{n} bag', '{n} bags'),
      words: () => ({ edit: t('Rename place'), own: '', empty: t('Give the place a name.'), warn: '' }),
    },
    careParts: {
      full: false,
      renameOnly: true,
      icon: Wrench,
      place: 'Bikes|place',
      sub: 'The parts in bike care. Only the name changes; intervals and history stay.',
      ownWord: '',
      what: () => '',
      words: () => ({ edit: t('Rename part'), own: '', empty: t('Give the part a name.'), warn: '' }),
    },
    // «Alle Daten anpassbar» (Noah 21.10.2026 «4a»): six more lists. simple: nothing moves when an entry
    // goes (the records keep their kind; a deleted Standard entry comes back with «Back to Standard»).
    pointKinds: simpleKind(MapPin, 'Trips|place', 'The kinds of your own points on the maps. Points keep their kind when you delete one.', 'Own kind'),
    bikeKinds: simpleKind(Bike, 'Bikes|place', 'The kinds of bike in Care. An own kind starts like Gravel: its part template and 20 km/h; change the template in Care › Part template.', 'Own kind'),
    awayTypes: simpleKind(Palmtree, 'Week|place', 'The kinds of holidays and trips in «Plan the week». Entries keep their kind when you delete one.', 'Own kind'),
    journalQuestions: simpleKind(Feather, 'Diary', 'The questions of the day in the diary, one a day in this order. Hidden and deleted ones are skipped; your answers keep their question.', 'Own question'),
    journalMoods: {
      full: false,
      renameOnly: true,
      icon: Smile,
      place: 'Diary',
      sub: 'The five moods of a diary entry. Only the name changes: the mood curve needs its five steps.',
      ownWord: '',
      what: () => '',
      words: () => ({ edit: t('Rename mood'), own: '', empty: t('Give the mood a name.'), warn: '' }),
    },
    medMoods: simpleKind(Flower2, 'Active|place', 'The moods you can tick after meditating. Your notes keep the moods they have.', 'Own mood'),
  };
  function simpleKind(icon, place, sub, ownWord) {
    return {
      full: false,
      hideable: true,
      simple: true,
      icon,
      place,
      sub,
      ownWord,
      what: () => '',
      words: () => ({ edit: t('Edit entry'), own: t(ownWord), empty: t('Give the entry a name.'), warn: t('Delete: what has it keeps it.') }),
    };
  }
  const q = location.hash.split('?')[1] ?? '';
  const KEY = Object.hasOwn(KINDS, q) ? q : 'categories';
  const open = Object.hasOwn(KINDS, q);
  const K = KINDS[KEY];

  const all = $derived($overQ?.value ?? {});
  const value = $derived(all[KEY]);
  const list = $derived(listFor(KEY, all));
  const countsOf = (key) => {
    if (key === 'categories') return ($itemsQ ?? []).reduce((m, i) => ((m[i.category] = (m[i.category] ?? 0) + 1), m), {});
    if (key === 'domains') return ($tripsQ ?? []).reduce((m, x) => ((m[x.domain ?? 'bikepacking'] = (m[x.domain ?? 'bikepacking'] ?? 0) + 1), m), {});
    if (key === 'bikeSlots' || key === 'careParts' || KINDS[key]?.simple || key === 'journalMoods') return {};
    if (key === 'noteTopics') return ($notesQ ?? []).filter(isKept).reduce((m, n) => ((m[noteTopic(n)] = (m[noteTopic(n)] ?? 0) + 1), m), {});
    return groupCounts($fieldsQ?.value);
  };
  const count = $derived(countsOf(KEY));
  const changed = $derived(isChanged(value));
  const lineOf = (key) => {
    const l = listFor(key, all);
    const ownN = l.filter((e) => e.own).length;
    const hiddenN = l.filter((e) => e.hidden).length;
    return [tn(l.length, '{n} entry', '{n} entries'), ownN ? tn(ownN, '{n} own', '{n} own') : null, hiddenN ? tn(hiddenN, '{n} hidden', '{n} hidden') : null].filter(Boolean).join(' · ');
  };
  const checksOwn = $derived(($checksQ ?? []).length > 0);

  // the window of one entry: { entry } (entry null: a new own one); then the delete question: { entry }
  let sheet = $state(null);
  let deleting = $state(null);
  let undo = $state.raw(null); // { text, snap } (raw: IndexedDB cannot store a reactive proxy)
  let timer;
  $effect(() => () => clearTimeout(timer));

  const save = (next) => saveList(db, KEY, next);
  // a name the person typed is shown as it is, never through t() (it could hit another text: «Travel» → «Federweg»)
  const shown = (e) => (e.own || e.renamed ? e.name : t(e.name));
  // LI3 «Gilt für»: a category for some trip areas only says which, on a line of its own
  const only = (e) => (e.areas?.length ? t('Only {areas}', { areas: e.areas.map((k) => t(domainName(k))).join(', ') }) : '');
  const sub = (e) => {
    if (K.renameOnly) return e.renamed ? t('Standard name: {name}', { name: t(e.std) }) : t('Standard');
    const n = K.what(count[e.id] ?? 0);
    const join = (a) => [a, n].filter(Boolean).join(' · ');
    if (e.hidden) return join(t('Hidden'));
    if (e.own) return join(t(K.ownWord));
    if (e.renamed) return join(t('Standard name: {name}', { name: t(e.std) }));
    return join(t('Standard'));
  };
  const adapted = (e) => !e.own && (e.renamed || overrideOf(value).icons[e.id] || e.areas);
  // «Alle Daten anpassbar» (21.10.2026): the app's own window instead of the browser's, then Undo
  async function reset() {
    const text = KEY === 'categories' ? t('Back to the Standard categories? Your names, own categories, hidden and deleted ones and the order are undone.') : t('Back to the Standard? Your names, own entries, deleted ones and the order are undone.');
    if ((await askDelete({ title: t('Back to Standard?|list'), text, label: t('Back to Standard|list') })) !== 'delete') return;
    const before = value;
    const name = t(STANDARD_LIST[KEY].name);
    await deleteWithUndo({ run: () => resetToStandard(db, KEY), undo: () => save(before ?? {}), text: t('«{name}» is the Standard again.', { name }), name });
  }

  // «Gruppen überall»: delete a group and move its things (to: a group id, or null for «Ohne …»)
  async function deleteGroup(e, to) {
    const rec = await db.settings.get(OVERRIDES_KEY);
    const now = rec?.value ?? {};
    const nextVal = remove(now[KEY], e);
    const nextAll = isChanged(nextVal) ? { ...now, [KEY]: nextVal } : resetList(now, KEY);
    const settings = [{ key: OVERRIDES_KEY, value: nextAll }];
    let items = [];
    let notes = [];
    let trips = [];
    if (KEY === 'categories') items = moveItems(await db.items.toArray(), e.id, to);
    else if (KEY === 'noteTopics') notes = moveNotes(await db.notes.toArray(), e.id, to);
    else if (KEY === 'domains' && e.own) {
      // an own sport goes for good: its trips and items move to the chosen sport (none: Bikepacking)
      const dest = to ?? 'bikepacking';
      trips = (await db.trips.toArray()).filter((x) => x.domain === e.id).map((x) => ({ ...x, domain: dest }));
      items = (await db.items.toArray()).filter((i) => i.domains?.includes(e.id)).map((i) => ({ ...i, domains: [...new Set(i.domains.map((d) => (d === e.id ? dest : d)))] }));
    }
    else if (to) settings.push({ key: FIELDS_KEY, value: moveGroupFields((await db.settings.get(FIELDS_KEY))?.value, e.id, to) });
    const snap = await writeGroupChange(db, { settings, items, notes });
    // trips (own sports only): written after, with their own snapshot inside the same Undo
    if (trips.length) {
      snap.trips = (await db.trips.bulkGet(trips.map((x) => x.id))).filter(Boolean);
      await db.trips.bulkPut(trips);
    }
    applyLists(nextAll);
    clearTimeout(timer);
    undo = { text: t('«{name}» deleted.', { name: shown(e) }), snap };
    timer = setTimeout(() => (undo = null), 8000);
  }
  // «Alle Daten anpassbar»: an entry of a simple list goes; what has it keeps it (ask, then Undo)
  async function deleteSimple(e) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: shown(e) }), text: e.own ? t('Things that have it keep it; it is no longer offered.') : t('Things that have it keep it; it is no longer offered. «Back to Standard» brings it back.') })) !== 'delete') return;
    const before = value;
    await deleteWithUndo({ run: () => save(remove(value, e)), undo: () => save(before ?? {}), text: t('«{name}» deleted.', { name: shown(e) }), name: shown(e) });
  }
  // a Standard sport: its trips and items keep it, it is only no longer offered; ask, then Undo
  async function deleteStdDomain(e) {
    if ((await askDelete({ title: t('Delete sport «{name}»?', { name: shown(e) }), text: t('Trips and items keep it; it is no longer offered for a new trip. «Back to Standard» brings it back.') })) !== 'delete') return;
    const before = value;
    await deleteWithUndo({ run: () => save(remove(value, e)), undo: () => save(before ?? {}), text: t('«{name}» deleted.', { name: shown(e) }), name: shown(e) });
  }
  async function doUndo() {
    const snap = undo?.snap;
    clearTimeout(timer);
    undo = null;
    await undoGroupChange(db, snap);
    if (snap?.trips?.length) await db.trips.bulkPut(snap.trips);
  }
</script>

<div class="lists ich-page" class:one={open}>
  {#if !open}
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Lists and types')} sub={t('The choice lists of the app. You can rename, add your own, hide and change the order.')} />
    <p class="info card"><Lightbulb size={18} aria-hidden="true" /><span>{t('Standard = how the app comes. Adapted = you changed something. Every list can go back to Standard.')}</span></p>
    <AreaIntro place="lists" />

    <div class="grid">
      {#each [['gear', 'Gear|place', ['categories']], ['bikes', 'Bikes|place', ['valueGroups', 'bikeSlots', 'careParts', 'bikeKinds']], ['notes', 'Notes', ['noteTopics']], ['diary', 'Diary', ['journalQuestions', 'journalMoods']], ['active', 'Active|place', ['medMoods']], ['map', 'Maps and week', ['pointKinds', 'awayTypes']]] as [area, head, keys] (area)}
        <section class="ich-sec card box" aria-labelledby="ls-{area}-h">
          <h2 id="ls-{area}-h">{t(head)}</h2>
          <ul class="ich-list">
            {#each keys as key (key)}
              {@const I = KINDS[key].icon}
              {@const mine = isChanged(all[key])}
              <li>
                <a class="ich-row" href="#/me/lists?{key}">
                  <span class="ich-ib"><I size={18} aria-hidden="true" /></span>
                  <span class="ich-m"><b>{t(STANDARD_LIST[key].name)}</b><small>{lineOf(key)}</small></span>
                  <span class="badge" class:mine>{mine ? t('Adapted') : t('Standard')}</span>
                  <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
      <section class="ich-sec card box" aria-labelledby="ls-trips-h">
        <h2 id="ls-trips-h">{t('Trips|place')}</h2>
        <ul class="ich-list">
          <li>
            <a class="ich-row" href="#/me/lists?domains">
              <span class="ich-ib"><Mountain size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t(STANDARD_LIST.domains.name)}</b><small>{lineOf('domains')}</small></span>
              <span class="badge" class:mine={isChanged(all.domains)}>{isChanged(all.domains) ? t('Adapted') : t('Standard')}</span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="ich-row" href="#/me/checks">
              <span class="ich-ib"><ListChecks size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Checks per trip type')}</b><small>{t('The evening before and after the trip')}</small></span>
              <span class="badge" class:mine={checksOwn}>{checksOwn ? t('Adapted') : t('Standard')}</span>
              <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>
    </div>
    <p class="ich-fine"><Info size={15} aria-hidden="true" /><span>{t('The questions of «Your questions» and of the daily check are changed on their own pages.')}</span></p>
  {:else}
    <VeloHead crumbs={[{ label: t('Lists and types'), href: '#/me/lists' }]} title={t(STANDARD_LIST[KEY].name)} sub={t(K.sub)} />
    <div class="card box">
      <ul class="ich-list rows" aria-label={t(STANDARD_LIST[KEY].name)} use:sortable={{ onmove: (from, to) => save(moveTo(value, list, list[from].id, to)) }}>
        {#each list as e, i (e.id)}
          {@const I = KEY === 'categories' ? catIcon(e.id) : K.icon}
          <li class="ich-row" class:off={e.hidden} data-id={e.id} data-sort-id={e.id}>
            <SortGrip name={shown(e)} onstep={(dir) => save(move(value, list, e.id, dir))} />
            <span class="arrows">
              <button type="button" class="ar" aria-label={t('Up: {name}', { name: shown(e) })} disabled={i === 0} onclick={() => save(move(value, list, e.id, -1))}><ChevronUp size={16} aria-hidden="true" /></button>
              <button type="button" class="ar" aria-label={t('Down: {name}', { name: shown(e) })} disabled={i === list.length - 1} onclick={() => save(move(value, list, e.id, 1))}><ChevronDown size={16} aria-hidden="true" /></button>
            </span>
            <span class="ich-ib" aria-hidden="true"><I size={18} /></span>
            <!-- v0.163.x: name, mark and pen are one button (the window of the entry); on the phone the name keeps its room next to the handle and the arrows -->
            <button type="button" class="edit" aria-haspopup="dialog" aria-label={t('Edit: {name}', { name: shown(e) })} onclick={() => (sheet = { entry: e })}>
              <span class="ich-m"><b>{shown(e)}</b><small>{sub(e)}</small>{#if only(e)}<small>{only(e)}</small>{/if}</span>
              {#if e.own}<span class="badge own">{t('Own|entry')}</span>{:else if adapted(e)}<span class="badge mine">{t('Adapted')}</span>{/if}
              <span class="pen" aria-hidden="true"><Pencil size={18} /></span>
            </button>
            {#if K.full || K.hideable}
              <button type="button" class="ib eye" aria-pressed={e.hidden} aria-label={e.hidden ? t('Show again: {name}', { name: shown(e) }) : t('Hide: {name}', { name: shown(e) })} onclick={() => save(toggleHidden(value, e.id))}>
                {#if e.hidden}<EyeOff size={18} aria-hidden="true" />{:else}<Eye size={18} aria-hidden="true" />{/if}
              </button>
            {/if}
          </li>
        {/each}
      </ul>
      {#if !K.renameOnly}<button type="button" class="add" aria-haspopup="dialog" onclick={() => (sheet = { entry: null })}><Plus size={18} aria-hidden="true" />{t(K.ownWord)}</button>{/if}
    </div>
    {#if changed}<button type="button" class="btn reset" onclick={reset}><Undo2 size={16} aria-hidden="true" />{t('Back to Standard|list')}</button>{/if}
    <p class="ich-fine"><Info size={15} aria-hidden="true" /><span>{K.renameOnly ? t('Tap an entry to rename it. «Back to Standard» brings the Standard names back.') : K.full ? t('Hidden: the items keep their category. Hide and delete are in the window of the entry (pen), for Standard entries too.') : t('Rename and delete are in the window of the entry (pen), for Standard entries too.')}</span></p>
  {/if}

  {#if sheet}
    {@const e = sheet.entry}
    {@const n = e ? (count[e.id] ?? 0) : 0}
    <ListEntrySheet
      entry={e}
      count={n}
      full={K.full}
      hideable={!!K.hideable}
      words={K.words ? K.words(n) : null}
      stdIcon={e && K.full ? stdIconName(e.id) : 'Tag'}
      onsave={(v) => save(e ? edit(value, e, K.full ? { ...v, stdIcon: stdIconName(e.id) } : v) : addOwn(value, v).value)}
      onhide={() => save(toggleHidden(value, e.id))}
      onremove={K.renameOnly ? null : () => (K.simple ? deleteSimple(e) : KEY === 'domains' && !e.own ? deleteStdDomain(e) : (deleting = { entry: e }))}
      onclose={() => (sheet = null)}
    />
  {/if}
  {#if deleting}
    {@const e = deleting.entry}
    <GroupDeleteSheet
      title={K.deleteTitle(shown(e))}
      count={count[e.id] ?? 0}
      what={K.what}
      none={t(K.none)}
      noneHint={t(K.noneHint)}
      targets={targetsOf(list, e.id, (x) => shown(x))}
      onconfirm={(to) => deleteGroup(e, to)}
      onclose={() => (deleting = null)}
    />
  {/if}
  {#if undo}<UndoToast text={undo.text} onundo={doUndo} />{/if}
</div>

<style>
  .lists {
    max-width: 1100px;
  }
  .lists.one {
    max-width: 760px;
  }
  .info {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0 0 20px;
    padding: 12px 16px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .info :global(svg) {
    flex: none;
    margin-top: 1px;
  }
  .grid {
    display: grid;
    gap: 0 20px;
  }
  @media (min-width: 900px) {
    .grid {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }
  .box {
    padding: 14px 4px 6px;
  }
  .box h2 {
    margin: 0 16px 4px;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .badge {
    flex: none;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .badge.mine {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .badge.own {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .rows .ich-row {
    gap: 10px;
  }
  .arrows {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .ar:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ib:hover {
    background: var(--paper-2);
  }
  .edit {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .pen {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    color: var(--ink-2);
  }
  @media (hover: hover) {
    .edit:hover .pen {
      border-radius: var(--r-ctl);
      background: var(--paper-2);
    }
  }
  .off .ich-m b {
    text-decoration: line-through;
    color: var(--ink-3);
  }
  .add {
    display: flex;
    align-items: center;
    gap: 8px;
    width: calc(100% - 32px);
    min-height: 48px;
    margin: 8px 16px 12px;
    padding: 0 16px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .reset {
    margin: 16px 0 0;
  }
  /* phone: the arrows side by side, each a full 44 px tap area */
  @media (max-width: 719px) {
    .rows .ich-ib {
      display: none;
    }
    .rows .ich-row {
      gap: 2px;
    }
    /* the eye is in the window of the entry too (Ausblenden); the name keeps its room */
    .rows .eye {
      display: none;
    }
    /* v0.163.x: the mark goes under the name, the pen is a small sign (the whole name opens the window) */
    .edit {
      grid-template-columns: minmax(0, 1fr) 20px;
      gap: 0 2px;
    }
    .edit .ich-m {
      grid-row: 1;
    }
    .edit .badge {
      grid-row: 2;
      justify-self: start;
    }
    .edit .pen {
      grid-column: 2;
      grid-row: 1 / span 2;
      width: 20px;
    }
    .rows {
      padding: 4px 8px;
    }
    .arrows {
      flex-direction: row;
      gap: 0;
    }
    .ar {
      width: 44px;
      height: 44px;
      border: 0;
      background: none;
    }
    .ar:disabled {
      opacity: 0.2;
    }
  }
</style>
