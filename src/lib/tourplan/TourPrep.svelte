<script module>
  // which folds are open, per trip: kept outside the card, because Planen draws the card anew after each save
  const folds = $state({});
</script>

<script>
  /**
   * Touren-Ideen 45, 47, 49 (Noah 26.10.2026 «1a 2b 3a 4b 5b»): the card «Tour vorbereiten» on Planen.
   * Three folds, each a suggestion and each can stay empty (rules: tourplan/prep.js):
   *   - Sportart pro Tag (45, only for trips of 2+ days): one packing list; «Beim Wechsel» where the kind changes
   *   - Unklare Stellen (47): a list with km of what you still want to find out, «Geklärt» ticks it off
   *   - Grenzübertritt (49): per country your own points for documents, phone network and insurance, with a source
   */
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { ClipboardList, Shuffle, CircleHelp, Flag, ChevronRight, Check, Trash2, Pencil, Plus, ArrowUp, ArrowDown, Repeat } from '@lucide/svelte';
  import {
    daySportsOf, setDaySport, daySportsOffered, daySportName, sportChanges,
    unclearOf, unclearAdd, unclearEdit, unclearToggle, unclearRemove, unclearOpen,
    BORDER_AREAS, borderOf, borderAddCountry, borderRenameCountry, borderRemoveCountry, borderAddPoint, borderEditPoint, borderTogglePoint, borderRemovePoint, borderMovePoint, borderOpen, isStale,
  } from './prep.js';

  let { trip } = $props();
  const save = (fields) => db.trips.update(trip.id, touched(fields));
  const isOpen = (k, dflt = false) => folds[`${trip.id}:${k}`] ?? dflt;
  const toggle = (k) => (e) => (folds[`${trip.id}:${k}`] = e.currentTarget.open);
  const dayDate = (n) => (trip.startDate ? new Date(`${trip.startDate}T12:00:00`).getTime() + n * 864e5 : null);
  const dayLabel = (n) => {
    const d = dayDate(n);
    return d ? `${t('Day {n}', { n: n + 1 })} · ${new Date(d).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' })}` : t('Day {n}', { n: n + 1 });
  };
  const when = (iso) => (iso ? new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'numeric', year: 'numeric' }) : '');

  /* 45 Sportart pro Tag */
  const multi = $derived((Number(trip.days) || 1) > 1);
  const sports = $derived(daySportsOf(trip));
  const kinds = $derived(daySportsOffered());
  const changes = $derived(sportChanges(trip));
  const setSport = (n, kind) => save({ daySports: setDaySport(trip, n, kind) });
  const sportsSet = $derived(sports.filter(Boolean).length);

  /* 47 Unklare Stellen */
  const unclear = $derived(unclearOf(trip));
  const openN = $derived(unclearOpen(trip));
  let uKm = $state('');
  let uText = $state('');
  function addUnclear(e) {
    e.preventDefault();
    if (!uText.trim()) return;
    save({ unclear: unclearAdd(trip, { km: uKm, text: uText }) });
    uKm = '';
    uText = '';
  }
  async function dropUnclear(x) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: x.text }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = $state.snapshot(trip.unclear) ?? [];
    await deleteWithUndo({ run: () => save({ unclear: unclearRemove(trip, x.id) }), undo: () => save({ unclear: before }), text: t('"{name}" deleted.', { name: x.text }), name: x.text });
  }

  /* 49 Grenzübertritt */
  const border = $derived(borderOf(trip));
  const borderN = $derived(borderOpen(trip));
  let country = $state('');
  let pick = $state(null); // the country shown
  const shown = $derived(border.find((c) => c.id === pick) ?? border[0] ?? null);
  const draft = $state({}); // { [area]: { text, source } }
  function addCountry(e) {
    e.preventDefault();
    if (!country.trim()) return;
    const id = `c${Date.now().toString(36)}`;
    save({ border: borderAddCountry(trip, country, id) });
    pick = id;
    country = '';
  }
  function addPoint(e, area) {
    e.preventDefault();
    const d = draft[area] ?? {};
    if (!shown || !d.text?.trim()) return;
    save({ border: borderAddPoint(trip, shown.id, { area, text: d.text, source: d.source ?? '' }) });
    draft[area] = { text: '', source: '' };
  }
  async function dropCountry(c) {
    const lines = c.points.length ? [tn(c.points.length, '{n} point goes with it.', '{n} points go with it.')] : [];
    if ((await askDelete({ title: t('Delete «{name}»?', { name: c.country }), text: t('You can bring it back for 4 seconds afterwards.'), lines })) !== 'delete') return;
    const before = $state.snapshot(trip.border) ?? [];
    await deleteWithUndo({ run: () => save({ border: borderRemoveCountry(trip, c.id) }), undo: () => save({ border: before }), text: t('"{name}" deleted.', { name: c.country }), name: c.country });
  }
  async function dropPoint(c, p) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: p.text }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = $state.snapshot(trip.border) ?? [];
    await deleteWithUndo({ run: () => save({ border: borderRemovePoint(trip, c.id, p.id) }), undo: () => save({ border: before }), text: t('"{name}" deleted.', { name: p.text }), name: p.text });
  }

  /* one rename sheet for all three */
  let renaming = $state(null); // { kicker, title, value, onsave }
</script>

<section class="card prep" aria-labelledby="prep-h" data-tourprep>
  <h3 id="prep-h"><ClipboardList size={16} aria-hidden="true" />{t('Prepare the tour')}</h3>
  <p class="tp-small tp-muted sub">{t('Kinds of days, open questions on the route and the border: all optional.')}</p>

  {#if multi}
    <details class="fold" data-prep-sports open={isOpen('sports')} ontoggle={toggle('sports')}>
      <summary><Shuffle size={18} aria-hidden="true" /><span class="lab">{t('Sport per day')}</span><span class="r tp-small tp-muted">{sportsSet ? tn(sportsSet, '{n} day set', '{n} days set') : t('not set')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
      <div class="body">
        <p class="tp-small tp-muted">{t('Bike, hiking or a rest day: the packing list stays one list. Where the kind changes, the app shows what to think of.')}</p>
        <ul class="days">
          {#each sports as k, n (n)}
            <li data-prep-day={n}>
              <span class="dl tp-small">{dayLabel(n)}</span>
              <span class="kinds" role="group" aria-label={dayLabel(n)}>
                {#each kinds as x (x.id)}<button type="button" class="kc" aria-pressed={k === x.id} onclick={() => setSport(n, k === x.id ? null : x.id)}>{daySportName(x.id, t)}</button>{/each}
              </span>
            </li>
          {/each}
        </ul>
        {#each changes as c (c.day)}
          <div class="chg" data-prep-change={c.day}>
            <p class="tp-small"><Repeat size={14} aria-hidden="true" /> <b>{t('When it changes: day {a} → {b}', { a: c.day, b: c.day + 1 })}</b> · {daySportName(c.from, t)} → {daySportName(c.to, t)}</p>
            <ul>{#each c.tips as tip (tip)}<li class="tp-small">{t(tip)}</li>{/each}</ul>
          </div>
        {/each}
        <a class="tp-small more" href="#/me/lists">{t('Rename or add kinds of days: Me › Lists and types')}</a>
      </div>
    </details>
  {/if}

  <details class="fold" data-prep-unclear open={isOpen('unclear')} ontoggle={toggle('unclear')}>
    <summary><CircleHelp size={18} aria-hidden="true" /><span class="lab">{t('Unclear spots')}</span><span class="r tp-small" class:warn={openN > 0}>{unclear.length ? tn(openN, '{n} open', '{n} open') : t('none')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
    <div class="body">
      <p class="tp-small tp-muted">{t('What do you still want to find out on the route? Note it with the km; «Clarified» ticks it off.')}</p>
      {#if unclear.length}
        <ul class="rows">
          {#each unclear as x (x.id)}
            <li class:done={x.done} data-unclear={x.id}>
              <button type="button" class="tick" class:y={x.done} aria-pressed={x.done} aria-label={x.done ? t('Open again: {name}', { name: x.text }) : t('Clarified: {name}', { name: x.text })} onclick={() => save({ unclear: unclearToggle(trip, x.id) })}>{#if x.done}<Check size={14} aria-hidden="true" />{/if}</button>
              <span class="t"><b>{x.km != null ? `km ${num(x.km)} · ` : ''}{x.text}</b>{#if x.done && x.doneAt}<small>{t('clarified on {date}', { date: when(x.doneAt) })}</small>{/if}</span>
              <button type="button" class="ib" aria-label={t('Rename «{name}»', { name: x.text })} onclick={() => (renaming = { kicker: t('Unclear spot'), title: t('Change the question'), value: x.text, onsave: (v) => save({ unclear: unclearEdit(trip, x.id, { text: v }) }) })}><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="ib" aria-label={t('Delete «{name}»', { name: x.text })} onclick={() => dropUnclear(x)}><Trash2 size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {/if}
      <form class="add" onsubmit={addUnclear}>
        <input class="inp km" type="number" inputmode="decimal" min="0" step="0.1" bind:value={uKm} placeholder="km" aria-label={t('At km')} />
        <input class="inp" bind:value={uText} placeholder={t('e.g. Is the bridge open?')} aria-label={t('What is unclear')} data-unclear-text />
        <button type="submit" class="btn sm" disabled={!uText.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
      </form>
    </div>
  </details>

  <details class="fold" data-prep-border open={isOpen('border')} ontoggle={toggle('border')}>
    <summary><Flag size={18} aria-hidden="true" /><span class="lab">{t('Crossing a border')}</span><span class="r tp-small tp-muted">{border.length ? tn(borderN, '{n} open', '{n} open') : t('no country')}</span><ChevronRight class="chev" size={16} aria-hidden="true" /></summary>
    <div class="body">
      <p class="tp-small tp-muted">{t('Per country your own points on documents, phone network and insurance. Note where you read it; the date is set when you tick it.')}</p>
      <div class="chips" role="group" aria-label={t('Countries')}>
        {#each border as c (c.id)}<button type="button" class="kc" aria-pressed={shown?.id === c.id} onclick={() => (pick = c.id)} data-border-country={c.country}>{c.country}</button>{/each}
      </div>
      <form class="add" onsubmit={addCountry}>
        <input class="inp" bind:value={country} placeholder={t('Country, e.g. France')} aria-label={t('Country')} data-border-new />
        <button type="submit" class="btn sm" disabled={!country.trim()}><Plus size={16} aria-hidden="true" />{t('Add country')}</button>
      </form>
      {#if shown}
        <div class="ctry" data-border-shown={shown.country}>
          <p class="ch"><b>{shown.country}</b>
            <button type="button" class="ib" aria-label={t('Rename «{name}»', { name: shown.country })} onclick={() => (renaming = { kicker: t('Country'), title: t('Rename country'), value: shown.country, onsave: (v) => save({ border: borderRenameCountry(trip, shown.id, v) }) })}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="ib" aria-label={t('Delete «{name}»', { name: shown.country })} onclick={() => dropCountry(shown)}><Trash2 size={16} aria-hidden="true" /></button>
          </p>
          {#each BORDER_AREAS as a (a.key)}
            {@const pts = shown.points.filter((p) => p.area === a.key)}
            <div class="area" data-border-area={a.key}>
              <p class="ah tp-small"><b>{t(a.name)}</b>{#if pts.length}{' · '}{t('{n} of {m} done', { n: pts.filter((p) => p.done).length, m: pts.length })}{/if}</p>
              {#if pts.length}
                <ul class="rows">
                  {#each pts as p, i (p.id)}
                    <li class:done={p.done} data-border-point={p.id}>
                      <button type="button" class="tick" class:y={p.done} aria-pressed={p.done} aria-label={p.done ? t('Open again: {name}', { name: p.text }) : t('Done: {name}', { name: p.text })} onclick={() => save({ border: borderTogglePoint(trip, shown.id, p.id) })}>{#if p.done}<Check size={14} aria-hidden="true" />{/if}</button>
                      <span class="t"><b>{p.text}</b><small>{p.source ? t('Source: {src}', { src: p.source }) : t('no source')}{#if p.checkedAt}{' · '}{t('checked {date}', { date: when(p.checkedAt) })}{/if}{#if isStale(p)}{' · '}<span class="warn">{t('check again')}</span>{/if}</small></span>
                      <span class="arrows">
                        <button type="button" class="ib" disabled={i === 0} aria-label={t('Move up: {name}', { name: p.text })} onclick={() => save({ border: borderMovePoint(trip, shown.id, p.id, -1) })}><ArrowUp size={16} aria-hidden="true" /></button>
                        <button type="button" class="ib" disabled={i === pts.length - 1} aria-label={t('Move down: {name}', { name: p.text })} onclick={() => save({ border: borderMovePoint(trip, shown.id, p.id, 1) })}><ArrowDown size={16} aria-hidden="true" /></button>
                      </span>
                      <button type="button" class="ib" aria-label={t('Rename «{name}»', { name: p.text })} onclick={() => (renaming = { kicker: t(a.name), title: t('Change the point'), value: p.text, onsave: (v) => save({ border: borderEditPoint(trip, shown.id, p.id, { text: v }) }) })}><Pencil size={16} aria-hidden="true" /></button>
                      <button type="button" class="ib" aria-label={t('Delete «{name}»', { name: p.text })} onclick={() => dropPoint(shown, p)}><Trash2 size={16} aria-hidden="true" /></button>
                    </li>
                  {/each}
                </ul>
              {/if}
              <form class="add pt" onsubmit={(e) => addPoint(e, a.key)}>
                <input class="inp" value={draft[a.key]?.text ?? ''} oninput={(e) => (draft[a.key] = { ...(draft[a.key] ?? {}), text: e.currentTarget.value })} placeholder={t('New point')} aria-label={t('New point: {area}', { area: t(a.name) })} data-border-text={a.key} />
                <input class="inp" value={draft[a.key]?.source ?? ''} oninput={(e) => (draft[a.key] = { ...(draft[a.key] ?? {}), source: e.currentTarget.value })} placeholder={t('Source, e.g. a website')} aria-label={t('Source: {area}', { area: t(a.name) })} />
                <button type="submit" class="btn sm" disabled={!draft[a.key]?.text?.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
              </form>
            </div>
          {/each}
          <p class="tp-small tp-muted">{t('Rules change. A point ticked more than half a year ago says «check again».')}</p>
        </div>
      {/if}
    </div>
  </details>
</section>

{#if renaming}
  <RenameSheet kicker={renaming.kicker} title={renaming.title} value={renaming.value} onsave={async (v) => (v.trim() ? (await renaming.onsave(v), true) : t('Please type a name.'))} onclose={() => (renaming = null)} />
{/if}

<style>
  .prep {
    padding: 12px 16px;
    margin: 12px 0;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 6px;
  }
  .fold {
    border-top: 1px solid var(--line);
  }
  .fold summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    cursor: pointer;
    list-style: none;
  }
  .fold summary::-webkit-details-marker {
    display: none;
  }
  .fold .lab {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .fold .r {
    text-align: right;
  }
  .fold[open] :global(.chev) {
    transform: rotate(90deg);
  }
  .warn {
    color: var(--warn);
    font-weight: 600;
  }
  .body {
    display: grid;
    gap: 8px;
    padding: 0 0 12px;
    min-width: 0;
  }
  .body p {
    margin: 0;
  }
  .days,
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .days li {
    display: grid;
    gap: 4px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .kinds,
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .kc {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .kc[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .chg {
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .chg ul {
    margin: 4px 0 0;
    padding-left: 20px;
  }
  .more {
    color: var(--ink-2);
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
  }
  .rows li.done .t b {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .t {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .t b {
    font-weight: 500;
  }
  .t small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .tick {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    cursor: pointer;
    color: var(--paper);
    position: relative;
  }
  .tick::before {
    content: '';
    position: absolute;
    inset: 11px;
    border: 1.5px solid var(--line-strong, var(--ink-3));
    border-radius: 50%;
  }
  .tick.y::before {
    background: var(--ok);
    border-color: var(--ok);
  }
  .tick :global(svg) {
    position: relative;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ib:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .arrows {
    display: flex;
    flex: none;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .add .inp {
    flex: 1 1 10em;
    min-width: 0;
  }
  .add .km {
    flex: 0 0 5.5em;
  }
  .ctry {
    display: grid;
    gap: 10px;
    padding: 8px 0 0;
  }
  .ch {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .ch b {
    flex: 1;
  }
  .area {
    display: grid;
    gap: 4px;
  }
  .ah {
    color: var(--ink-2);
  }
</style>
