<script>
  /**
   * v0.26.0 (Noah 2a, AP11): assign one or many items: into a building block (or a new one), out
   * of a building block, a default bag, into a template, onto a trip. Opened from "Select" in Gear
   * (kind given) or from "Assign…" in the item dialog (item given: the kind is chosen here, and
   * the line "In: …" shows where the item is now, AP11 "show the existing assignment").
   *
   * Every choice writes in one transaction (gear/assign.js) and gives { text, snap } for Undo.
   * ondone({ text, snap }): the page shows the text with Undo and the dialog closes. Without
   * ondone (the item dialog) the text and Undo show here and the dialog stays open.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { BAGS, BAG } from '../gear.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { SETS_KEY, allSets, setName } from '../sets.js';
  import { assignSet, assignBag, assignTemplate, assignTrip, assignmentOf, currentTrip, upcomingTrips } from './assign.js';
  import { undoBulk } from './bulk.js';
  import { localDay } from '../localday.js';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';

  let { ids, kind: kind0 = null, item = null, ondone = null, onclose } = $props();

  // Always an object once loaded, so the first choice waits for the own building blocks.
  const setsQ = liveQuery(async () => (await db.settings.get(SETS_KEY)) ?? { value: [] });
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.bulkGet($state.snapshot(ids)));
  const sets = $derived(allSets($setsQ?.value));
  const templates = $derived([...($tplQ?.value ?? [])].sort((a, b) => a.name.localeCompare(b.name)));
  const today = localDay();
  const chosenTrip = (() => {
    try {
      return localStorage.getItem('pack.currentTrip');
    } catch {
      return null;
    }
  })();
  // Noah 7a: the next planned trip, with a choice when there are several.
  const trips = $derived(upcomingTrips($tripsQ ?? [], today));
  const current = $derived(currentTrip($tripsQ ?? [], chosenTrip, today));
  const picked = $derived(($itemsQ ?? []).filter(Boolean));
  // svelte-ignore state_referenced_locally
  let kind = $state(kind0 ?? 'into');
  let target = $state('');
  let newName = $state('');
  let error = $state('');
  let done = $state.raw(null); // { text, snap } when the dialog stays open
  let busy = $state(false);
  let dialog;

  const KINDS = [
    { key: 'into', label: 'Into a building block' },
    { key: 'out', label: 'Out of a building block' },
    { key: 'bag', label: 'Default bag' },
    { key: 'template', label: 'Into a template' },
    { key: 'trip', label: 'Onto a trip' },
  ];
  const title = $derived(item ? t('Assign "{name}"', { name: nameOf(item) }) : t(KINDS.find((k) => k.key === kind)?.label ?? ''));
  // Out of a building block: only the blocks one of the items is in.
  const inSets = $derived(sets.filter((s) => picked.some((i) => i.sets?.includes(s.key))));
  const options = $derived(
    kind === 'into' ? sets.map((s) => ({ key: s.key, name: s.name }))
    : kind === 'out' ? inSets.map((s) => ({ key: s.key, name: s.name }))
    : kind === 'bag' ? BAGS.map((b) => ({ key: b.key, name: t(b.name) }))
    : kind === 'template' ? templates.map((x) => ({ key: x.id, name: x.name }))
    : trips.map((x) => ({ key: x.id, name: tripLabel(x) })),
  );
  function tripLabel(trip) {
    const date = trip.startDate ? new Date(`${trip.startDate}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : t('No date set');
    return `${trip.title} · ${date}`;
  }
  // A sensible first choice: the current trip, the item's own bag, the newest own building block
  // (none yet: a new one), else the first option.
  $effect(() => {
    void kind;
    if (!$setsQ || !$tripsQ) return;
    if (options.some((o) => o.key === target) || target === '__new') return;
    target = kind === 'trip' && options.some((o) => o.key === current?.id) ? current.id : kind === 'bag' && item?.defaultBag ? item.defaultBag : kind === 'into' ? (sets.filter((x) => !x.builtIn).at(-1)?.key ?? '__new') : (options[0]?.key ?? '');
  });

  // AP11 (Noah 9a): where the item is now.
  const now = $derived.by(() => {
    if (!item) return '';
    const live = picked[0] ?? item;
    const a = assignmentOf(live, templates, current);
    const parts = [
      ...a.sets.map((k) => setName(sets, k)),
      ...a.templates.map((n) => t('Template "{name}"', { name: n })),
      ...(a.trip ? [t('Trip "{name}"', { name: current.title })] : []),
    ];
    return parts.length ? parts.join(' · ') : t('nothing yet');
  });

  $effect(() => {
    dialog.showModal();
  });

  const optionName = (key) => options.find((o) => o.key === key)?.name ?? key;
  async function apply(event) {
    event.preventDefault();
    if (busy) return;
    error = '';
    const list = $state.snapshot(ids);
    let res;
    let name;
    busy = true;
    try {
      if (kind === 'into' && target === '__new') {
        res = await assignSet(db, list, null, { newName });
        if (res.error) return (error = res.error === 'empty' ? t('Give the building block a name.') : t('There is already a building block "{name}".', { name: newName.trim() }));
        name = newName.trim();
      } else if (!target) {
        return (error = t('Choose where the items go.'));
      } else if (kind === 'into' || kind === 'out') {
        res = await assignSet(db, list, target, { out: kind === 'out' });
        name = optionName(target);
      } else if (kind === 'bag') {
        res = await assignBag(db, list, target);
        name = t(BAG[target] ?? target);
      } else if (kind === 'template') {
        res = await assignTemplate(db, list, target);
        name = optionName(target);
      } else {
        res = await assignTrip(db, list, target);
        name = (trips.find((x) => x.id === target) ?? {}).title ?? '';
      }
    } finally {
      busy = false;
    }
    const target2 = kind === 'out' ? t('out of {name}', { name }) : name;
    const text = res.n ? tn(res.n, 'Done: {n} item → {target}', 'Done: {n} items → {target}', { target: target2 }) : t('Nothing to change: already like that ({target}).', { target: target2 });
    newName = '';
    // A new building block is a change even when its items were all in it already.
    const snap = res.n || 'sets' in (res.snap ?? {}) ? res.snap : null;
    if (ondone) {
      ondone({ text, snap });
      dialog.close();
    } else done = { text, snap };
  }
  async function undo() {
    const snap = done?.snap;
    done = null;
    if (snap) await undoBulk(db, snap);
  }
</script>

<dialog class="sheet assign" bind:this={dialog} onclose={onclose} aria-labelledby="assign-h">
  <form onsubmit={apply} novalidate>
    <h2 id="assign-h" class="title">{title}</h2>
    {#if item}
      <p class="now"><span class="lbl">{t('In:')}</span> {now}</p>
      <fieldset class="kinds">
        <legend class="lbl">{t('Assign to')}</legend>
        {#each KINDS as k (k.key)}
          <label class="cb"><input type="radio" name="assign-kind" value={k.key} bind:group={kind} /> {t(k.label)}</label>
        {/each}
      </fieldset>
    {:else}
      <p class="sub">{tn(ids.length, '{n} item selected', '{n} items selected')}</p>
    {/if}

    {#if kind === 'trip' && !options.length}
      <p class="empty">{t('No planned trip. Make one in Pack first.')}</p>
    {:else if kind === 'out' && !options.length}
      <p class="empty">{t('None of these items is in a building block.')}</p>
    {:else if kind === 'template' && !options.length}
      <p class="empty">{t('No templates yet. Save a trip as a template in Pack.')}</p>
    {:else}
      <div class="pick">
        <label class="lbl" for="assign-target">{kind === 'bag' ? t('Default bag') : kind === 'template' ? t('Template') : kind === 'trip' ? t('Trip') : t('Building block')}</label>
        <select id="assign-target" class="sel" bind:value={target}>
          {#each options as o (o.key)}<option value={o.key}>{o.name}</option>{/each}
          {#if kind === 'into'}<option value="__new">{t('New building block …')}</option>{/if}
        </select>
      </div>
      {#if kind === 'into' && target === '__new'}
        <div class="pick"><label class="lbl" for="assign-new">{t('Name of the new building block')}</label><input id="assign-new" class="inp" bind:value={newName} placeholder={t('e.g. Rain')} /></div>
      {/if}
      <p class="what">
        {#if kind === 'bag'}{t('Where the item goes on new trips. On a trip you can still move it.')}
        {:else if kind === 'template'}{t('Missing items go in, each in its usual bag. Nothing is added twice.')}
        {:else if kind === 'trip'}{t('Missing items go onto the trip in their usual bag. What is packed stays packed.')}
        {:else if kind === 'out'}{t('Only the building block changes; trips stay as they are.')}
        {:else}{t('Add the building block in Pack with one tap (Add material). Nothing is added twice.')}{/if}
      </p>
    {/if}
    <p class="err" role="alert">{error}</p>
    {#if done}
      <p class="ok" role="status"><span>{done.text}</span>{#if done.snap}<button type="button" class="btn sm" onclick={undo}>{t('Undo')}</button>{/if}</p>
    {/if}
    <div class="foot">
      <button type="submit" class="btn hi" disabled={busy || !options.length && !(kind === 'into')}>{t('Assign')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{done ? t('Close') : t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  h2 {
    font-size: var(--fs-section);
    margin: 0 0 8px;
    overflow-wrap: anywhere;
  }
  .sub,
  .what,
  .empty {
    color: var(--ink-3);
    font-size: 14px;
    margin: 4px 0 10px;
  }
  .now {
    margin: 0 0 12px;
    padding: 6px 10px;
    border-left: 3px solid var(--hi);
    background: var(--paper-2);
    overflow-wrap: anywhere;
  }
  .kinds {
    border: 0;
    padding: 0;
    margin: 0 0 12px;
    display: grid;
    gap: 2px;
  }
  .cb {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
  }
  .cb input {
    width: 20px;
    height: 20px;
    accent-color: var(--ink);
  }
  .pick {
    display: grid;
    gap: 4px;
    margin-bottom: 8px;
  }
  .pick .sel,
  .pick .inp {
    width: 100%;
    min-width: 0;
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    font-size: 14px;
    margin: 0;
  }
  .ok {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0 0 10px;
    overflow-wrap: anywhere;
  }
  .ok span {
    flex: 1 1 160px;
  }
  .foot {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
</style>
