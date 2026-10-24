<script>
  /**
   * AU1 «Ausrüstung» (Noah 15.10.2026 «5b» own place; «1-5a» with «1b»), #/equipment: the main
   * equipment of each sport with its counter and its care. Bikes keep their own place (a chip leads
   * there; on a phone the switch on top changes between Velos and Ausrüstung).
   * On top the key line, then «Care due» with «Done», then the equipment grouped by sport (2a), the sports
   * without equipment in one line with «Add» (5a). A tap on a piece shows it beside the list (computer)
   * or under it (phone): its numbers, its care, «Log a use», «Change», «Open in Material», «Remove».
   * Items come from Material (3a): «Add equipment» picks one; Material's item window has «Main
   * equipment» too (#/equipment?add=<item id>). The care due shows on Heute as well (4a, Home.svelte).
   * Everything is a suggestion: counter, care and intervals can be changed and removed.
   */
  import { liveQuery } from 'dexie';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import { tick } from 'svelte';
  import { Mountain, Bike, ChevronRight, Plus, Check } from '@lucide/svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import CoreLine from '../lib/ui/CoreLine.svelte';
  import MainBar from '../lib/ui/MainBar.svelte';
  import MainSheet from '../lib/equipment/MainSheet.svelte';
  import { db } from '../lib/db.js';
  import { sportsOf, equipmentRows, groupsOf, dueCare, markOf, mainOf, careDone, addUse } from '../lib/maingear.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num, locale, nameOf, lang } from '../lib/i18n.svelte.js';

  const today = localDay();
  const q = liveQuery(async () => {
    const [items, trips, log, acts] = await Promise.all([db.items.toArray(), db.trips.toArray(), db.flowLog.toArray(), db.flowActs.toArray()]);
    return { items, trips, log, acts };
  });
  const data = $derived($q);
  const sports = $derived(sportsOf(data?.acts ?? []));
  const rows = $derived(data ? equipmentRows(data.items, { trips: data.trips, log: data.log, today }) : []);
  const due = $derived(dueCare(rows));
  const grouped = $derived(groupsOf(rows, sports));
  // Klick-Rundgang 22.10.2026 H18: the line names the sports (Touren areas), not every Aktiv habit («früh aufstehen»)
  const emptySports = $derived(grouped.empty.filter((s) => String(s.key).startsWith('dom:')));

  let sport = $state(null);
  let sel = $state(null);
  let sheet = $state(null); // { mode: 'add' | 'edit' | 'use', item?, sport? }
  let undo = $state(null); // { text, id, main }

  const shownGroups = $derived(sport ? grouped.groups.filter((g) => g.sport.key === sport) : grouped.groups);
  const picked = $derived(rows.find((r) => r.item.id === sel) ?? null);
  const seasonUses = $derived(rows.reduce((s, r) => s + r.seasonUses, 0));

  // #/equipment?add=<item id> (from Material) opens the sheet for that item; ?item=<id> picks one
  const params = () => new URLSearchParams((location.hash.split('?')[1] ?? '').replace(/^\?/, ''));
  let asked = false;
  $effect(() => {
    if (!data || asked) return;
    asked = true;
    const p = params();
    const add = p.get('add');
    const it = add ? data.items.find((i) => i.id === add) : null;
    if (it) sheet = mainOf(it) ? { mode: 'edit', item: it } : { mode: 'add', item: it };
    if (p.get('item')) sel = p.get('item');
  });
  // a wide screen shows the first piece beside the list from the start
  $effect(() => {
    if (!sel && grouped.groups[0]?.rows[0] && typeof matchMedia === 'function' && matchMedia('(min-width: 1000px)').matches) sel = grouped.groups[0].rows[0].item.id;
  });

  const sportName = (s) => (!s ? '' : s.key?.startsWith('act:') ? (lang.v === 'de' && s.nameDe ? s.nameDe : s.name) : t(s.name));
  const sportOfKey = (key) => sports.find((s) => s.key === key) ?? { key, name: 'Other|sport' };
  const unitText = (v, u) => (u === 'hours' ? t('{n} h', { n: num(v) }) : u === 'km' ? t('{n} km', { n: num(v) }) : u === 'days' ? tn(v, '{n} day', '{n} days', { n: num(v) }) : tn(v, '{n} use', '{n} uses', { n: num(v) }));
  const dayWord = (day) => (day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
  const dayLong = (day) => (day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '–');
  const careName = (c) => t(c.name);
  // Impeccable 20.10.2026: after «in» German wants the dative («in 8 Einsätzen», «in 364 Tagen»)
  const unitIn = (v, u) => (u === 'hours' ? t('{n} h', { n: num(v) }) : u === 'km' ? t('{n} km', { n: num(v) }) : u === 'days' ? tn(v, '{n} day|in', '{n} days|in', { n: num(v) }) : tn(v, '{n} use|in', '{n} uses|in', { n: num(v) }));
  const leftText = (c) => (c.state === 'due' ? t('now|care') : t('in {left}', { left: unitIn(c.left, c.care.unit) }));
  const firstCare = (r) => [...r.care].sort((a, b) => b.share - a.share)[0] ?? null;

  async function setMain(id, main) {
    await db.items.update(id, { main: main ? JSON.parse(JSON.stringify(main)) : null });
  }
  async function done(d) {
    const before = d.row.main;
    await setMain(d.row.item.id, careDone(before, d.care.id, today));
    undo = { text: t('{care} done: {name}', { care: careName(d.care), name: nameOf(d.row.item) }), id: d.row.item.id, main: before };
  }
  async function remove(r) {
    sel = null;
    undo = { text: t('«{name}» is no longer main equipment. It stays in Material.', { name: nameOf(r.item) }), id: r.item.id, main: r.main };
    await setMain(r.item.id, null);
  }
  async function undoNow() {
    if (!undo) return;
    await setMain(undo.id, undo.main);
    undo = null;
  }
  async function pick(id) {
    sel = id;
    await tick();
    if (typeof matchMedia === 'function' && !matchMedia('(min-width: 1000px)').matches) document.getElementById('mg-det')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function onsave(v) {
    const s = sheet;
    if (s.mode === 'use') {
      const r = rows.find((x) => x.item.id === s.item.id);
      await setMain(s.item.id, addUse(r.main, v));
      undo = null;
      return;
    }
    const it = data.items.find((i) => i.id === v.itemId);
    if (!it) return t('Choose an item from your gear.');
    await setMain(it.id, markOf(it.main ?? null, v));
    sel = it.id;
    undo = null;
  }
</script>

<div class="mg">
  <header class="ph">
    <PageHead title={t('Equipment|place')} text={t('Your main equipment per sport, with a counter and its care. Bikes have their own place.')} />
    {#if rows.length}<CoreLine parts={[{ v: rows.length, label: tn(rows.length, 'piece of equipment', 'pieces of equipment') }, { v: due.length, label: tn(due.length, 'care step due', 'care steps due') }, { v: seasonUses, label: t('uses this season') }]} />{/if}
  </header>
  <AreaIntro place="equipment" />

  {#if data}
    <nav class="chips" aria-label={t('Filter by sport')}>
      <button type="button" class="chip" aria-pressed={!sport} onclick={() => (sport = null)}>{t('All')} · {rows.length}</button>
      {#each grouped.groups as g (g.sport.key)}<button type="button" class="chip" aria-pressed={sport === g.sport.key} onclick={() => (sport = sport === g.sport.key ? null : g.sport.key)} data-mg-chip={g.sport.key}>{sportName(g.sport)} · {g.rows.length}</button>{/each}
      <a class="chip" href="#/bikes"><Bike size={16} aria-hidden="true" />{t('Bikes|place')} ›</a>
    </nav>

    {#if undo}<p class="undo" role="status">{undo.text} <button type="button" class="link" onclick={undoNow}>{t('Undo')}</button></p>{/if}

    {#if due.length}
      <section class="due" aria-labelledby="mg-due-h" data-mg-due>
        <h2 id="mg-due-h">{t('Care due')}</h2>
        <ul>
          {#each due as d (`${d.row.item.id}:${d.care.id}`)}
            <li>
              <span class="t"><b>{nameOf(d.row.item)}: {careName(d.care)}</b><small class="num">{t('every {every} · now {now}', { every: unitText(d.care.every, d.care.unit), now: unitText(d.used, d.care.unit) })} · {sportName(sportOfKey(d.row.main.sport))}</small></span>
              <button type="button" class="btn" onclick={() => done(d)} data-mg-done><Check size={16} aria-hidden="true" />{t('Done|care')}</button>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if !rows.length}
      <section data-mg-empty>
        <Empty icon={Mountain} level={2} title={t('No main equipment yet')} text={t('Pick your skis, a racket or your shoes from Material. The app counts their uses and reminds you of their care.')} action={{ label: t('Add equipment'), onclick: () => (sheet = { mode: 'add', sport }) }} />
      </section>
    {:else}
      <div class="lay">
        <div class="col">
          {#each shownGroups as g (g.sport.key)}
            <section class="mgc grp" aria-labelledby="mg-g-{g.sport.key}" data-mg-group={g.sport.key}>
              <h2 id="mg-g-{g.sport.key}">{sportName(g.sport)}<small>{tn(g.rows.length, '{n} piece', '{n} pieces')}</small></h2>
              <ul>
                {#each g.rows as r (r.item.id)}
                  {@const c = firstCare(r)}
                  <li>
                    <button type="button" class="row" class:on={sel === r.item.id} aria-pressed={sel === r.item.id} onclick={() => pick(r.item.id)} data-mg-row={nameOf(r.item)}>
                      <span class="ic" aria-hidden="true"><Mountain size={17} /></span>
                      <span class="t">
                        <b>{nameOf(r.item)}{#if r.due}<i class="mgp due">{t('due|care')}</i>{/if}</b>
                        <small class="num">{[unitText(r.total, r.main.unit), r.last ? t('last {day}', { day: dayWord(r.last) }) : t('not used yet')].join(' · ')}</small>
                        {#if c}<span class="meter" class:w={c.state !== 'ok'} aria-hidden="true"><i style:width="{Math.min(100, c.share * 100)}%"></i></span>{/if}
                      </span>
                      {#if c}<span class="h">{careName(c.care)} {leftText(c)}</span>{/if}
                    </button>
                  </li>
                {/each}
              </ul>
            </section>
          {/each}
          {#if !sport && emptySports.length}
            <p class="empty" data-mg-without>
              <span>{t('Without equipment so far')}: {emptySports.map(sportName).join(', ')}</span>
              <button type="button" class="link" onclick={() => (sheet = { mode: 'add', sport: emptySports[0].key })}>{t('Add equipment')}</button>
            </p>
          {/if}
        </div>
        {#if picked}
          <aside class="mgc det" id="mg-det" aria-labelledby="mg-det-h" data-mg-detail>
            <h2 id="mg-det-h">{nameOf(picked.item)}</h2>
            <p class="sub">{[sportName(sportOfKey(picked.main.sport)), picked.main.since ? t('since {day}', { day: dayLong(picked.main.since) }) : '', t('counts {unit}', { unit: t(picked.main.unit === 'hours' ? 'hours' : picked.main.unit === 'km' ? 'km' : picked.main.unit === 'days' ? 'days' : 'uses') })].filter(Boolean).join(' · ')}</p>
            <dl class="kv">
              <div><dt>{t('in total')}</dt><dd class="num">{unitText(picked.total, picked.main.unit)}</dd></div>
              <div><dt>{t('this season')}</dt><dd class="num">{unitText(picked.season, picked.main.unit)}</dd></div>
              <div><dt>{t('last used|date')}</dt><dd>{dayLong(picked.last)}</dd></div>
              {#if picked.main.unit !== 'uses'}<div><dt>{t('uses this season')}</dt><dd class="num">{num(picked.seasonUses)}</dd></div>{/if}
            </dl>
            <h3>{t('Care')}</h3>
            {#if picked.care.length}
              <ul class="care">
                {#each picked.care as c (c.care.id)}
                  <li>
                    <span class="t"><b>{careName(c.care)}</b><small class="num">{t('every {every}', { every: unitText(c.care.every, c.care.unit) })} · {leftText(c)}{c.doneDay ? ` · ${t('done {day}', { day: dayWord(c.doneDay) })}` : ''}</small><span class="meter" class:w={c.state !== 'ok'} aria-hidden="true"><i style:width="{Math.min(100, c.share * 100)}%"></i></span></span>
                    {#if c.state !== 'ok'}<button type="button" class="btn sm" onclick={() => done({ row: picked, ...c })}>{t('Done|care')}</button>{/if}
                  </li>
                {/each}
              </ul>
            {:else}<p class="sub">{t('No care step. «Change» adds one.')}</p>{/if}
            <p class="note">{t('Uses come by themselves from your trips and from Aktiv. Counter, care and intervals are suggestions, all changeable.')}</p>
            <div class="acts">
              <button type="button" class="btn hi" onclick={() => (sheet = { mode: 'use', item: picked.item })} data-mg-use><Plus size={16} aria-hidden="true" />{t('Log a use')}</button>
              <button type="button" class="btn" onclick={() => (sheet = { mode: 'edit', item: picked.item })} data-mg-edit>{t('Change')}</button>
              <a class="btn" href="#/gear?item={encodeURIComponent(picked.item.id)}">{t('In Material')}<ChevronRight size={16} aria-hidden="true" /></a>
              <button type="button" class="link" onclick={() => remove(picked)} data-mg-remove>{t('Remove|main')}</button>
            </div>
          </aside>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<MainBar main={{ label: t('Add equipment'), onclick: () => (sheet = { mode: 'add', sport }), arrow: false }} />

{#if sheet}
  {#key sheet}
    <MainSheet mode={sheet.mode} item={sheet.item ?? null} main={sheet.item ? mainOf(sheet.item) : null} items={data?.items ?? []} {sports} {sportName} sport={sheet.sport ?? null} {onsave} onclose={() => (sheet = null)} />
  {/key}
{/if}

<style>
  .mg {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .mg :global(.pagehead) {
    margin: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  h3 {
    margin: var(--sp-3) 0 var(--sp-1);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chips {
    display: flex;
    gap: var(--sp-2);
    overflow-x: auto;
    min-width: 0;
    padding-bottom: 2px;
  }
  .chip {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: none;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .undo {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .link {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .due {
    padding: var(--sp-3) var(--sp-4);
    border-radius: 12px;
    background: var(--warn-soft);
  }
  .due li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    padding: var(--sp-2) 0;
  }
  .due li + li {
    border-top: 1px solid var(--line);
  }
  .due .t {
    flex: 1 1 220px;
  }
  .due .btn,
  .det .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  @media (max-width: 719px) {
    .due .btn {
      flex: 1 1 100%;
      justify-content: center;
    }
  }
  .t {
    min-width: 0;
  }
  .t b {
    display: block;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .due .t b {
    font-weight: 600;
  }
  .t small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mgc {
    margin: 0;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .grp h2 {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-4);
  }
  .grp h2 small {
    margin-left: auto;
    color: var(--ink-3);
    font: 400 var(--fs-small) / 1.3 var(--font-body);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    }
    .det {
      position: sticky;
      top: calc(env(safe-area-inset-top, 0px) + 16px);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 64px;
    padding: var(--sp-2) var(--sp-4);
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row.on {
    background: var(--paper-2);
  }
  .row .t {
    flex: 1;
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .h {
    flex: 0 1 auto;
    max-width: 40%;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: right;
  }
  .mgp {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 99px;
    font: 500 var(--fs-label) / 1.5 var(--font-body);
    font-style: normal;
    white-space: nowrap;
    vertical-align: 1px;
  }
  .mgp.due {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .meter {
    display: block;
    max-width: 180px;
    height: 6px;
    margin-top: 4px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .meter i {
    display: block;
    height: 100%;
    background: var(--ok);
  }
  .meter.w i {
    background: var(--warn);
  }
  .empty {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-1) var(--sp-3);
    margin: 0;
    padding: var(--sp-2) var(--sp-4);
    border: 1px dashed var(--line-strong);
    border-radius: 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .det {
    padding: var(--sp-4);
  }
  .kv {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-2);
    margin: var(--sp-3) 0 0;
  }
  .kv div {
    padding: var(--sp-2) var(--sp-3);
    border-radius: 8px;
    background: var(--paper-2);
  }
  .kv dt {
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .kv dd {
    margin: 0;
    font-weight: 600;
  }
  .care li {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .care .t {
    flex: 1;
  }
  .note {
    margin: var(--sp-3) 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    align-items: center;
    margin-top: var(--sp-3);
  }
</style>
