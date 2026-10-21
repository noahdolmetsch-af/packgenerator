<script>
  /**
   * «Mehr selbst einstellen» (Noah 15.10.2026 «bauen», ideas IS 254–256 and 258): Ich › Eigene Werte
   * (#/me/werte). The numbers that were fixed in the code, in five sections Packen, Velo, Heute, Daten,
   * Vorschläge: each with a short reason, its standard («Standard: 14 Tage») and «Auf Standard zurück».
   * One settings record (ownvalues.js OWN_KEY), on this device and in the backup; App.svelte makes it
   * live for every page (ownlive.svelte.js). Everything is a suggestion: nothing must be set.
   * Velo: the care per part and per bike is already its own card (v0.144.0 «Pflege für …»), so the page
   * links there. Vorschläge: the switches that exist (tips on all pages, knowledge and fun), the rest
   * as links to where it is switched.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { putSetting } from '../lib/flowdb.js';
  import { OWN_KEY, MINE, normOwn, setOwn, clampOwn, timeText, fieldsIn, mineOf, ownName, renameOwn, removeOwn, restoreOwn, goneFields, moveOwn, moveOwnTo, addMine, updateMine, deleteMine } from '../lib/ownvalues.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { sortable } from '../lib/ui/sortable.js';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import Fold from '../lib/ui/Fold.svelte';
  import OwnValueSheet from '../lib/ich/OwnValueSheet.svelte';
  import { sortBikes } from '../lib/bikes.js';
  import { localDay } from '../lib/localday.js';
  import { pageInfo } from '../lib/pageinfo/store.svelte.js';
  import { setTipsOn, setKnowOn } from '../lib/pageinfo.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, tn, num } from '../lib/i18n.svelte.js';
  import { Minus, Plus, Undo2, ChevronRight, Package, Bike, Database, Lightbulb, Wrench, Info, Activity, Pencil, BellRing, RotateCcw } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const q = liveQuery(() => db.settings.get(OWN_KEY));
  const raw = $derived($q?.value ?? null);
  const vals = $derived(normOwn(raw));
  const pi = pageInfo();

  const SECTIONS = [
    { key: 'pack', name: 'Pack|stage', icon: Package },
    { key: 'bike', name: 'Bike', icon: Bike },
    { key: 'data', name: 'Data', icon: Database },
  ];
  const fieldsOf = (area) => fieldsIn(raw, area);
  const nameOf = (f) => ownName(raw, f, t); // a typed name never through t()
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bikeName = (id) => bikes.find((b) => b.id === id)?.name ?? t('a deleted bike');
  const mine = $derived(mineOf(raw));
  const gone = $derived(goneFields(raw));
  const put = (next) => putSetting(db, OWN_KEY, Object.keys(next).length ? next : null);

  // «Eigene Werte anpassbar» (Noah 21.10.2026): the window of a value (field) or a reminder (mine)
  let sheet = $state(null); // { field } | { mine } | { mine: null } (new)
  function saveSheet(patch) {
    const s = sheet;
    if (s.field) {
      const before = nameOf(s.field);
      put(renameOwn(raw, s.field.key, patch.name));
      if (patch.name && patch.name !== before) offerDone(t('Renamed to «{name}».', { name: patch.name }));
    } else if (s.mine) put(updateMine(raw, s.mine.id, patch));
    else {
      const { record } = addMine(raw, patch, $bikesQ ?? [], localDay());
      put(record);
      offerDone(t('«{name}» added. It shows in Bikes › Care.', { name: patch.name }));
    }
  }
  async function removeField(f) {
    const name = nameOf(f);
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('The app then counts with the Standard again. «Deleted values» at the end of the page brings it back.') })) !== 'delete') return;
    const old = raw;
    await deleteWithUndo({ run: () => put(removeOwn(raw, f.key)), undo: () => put(old ?? {}), text: t('"{name}" deleted.', { name }), name });
  }
  async function removeMine(x) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: x.name }), text: t('The reminder goes from every bike.') })) !== 'delete') return;
    const old = raw;
    await deleteWithUndo({ run: () => put(deleteMine(raw, x.id)), undo: () => put(old ?? {}), text: t('"{name}" deleted.', { name: x.name }), name: x.name });
  }
  const mineSay = (x) => (x.unit === 'km' ? t('every {km} km', { km: num(x.every) }) : tn(x.every, 'every day', 'every {n} days'));

  // the value in words: «2 Tage», «1000 km», «10 °C»
  const say = (f, v) => (f.unit === 'time' ? t('{time}|clock', { time: timeText(v) }) : f.unit === 'days' ? tn(v, '{n} day', '{n} days') : f.unit === 'km' ? t('{km} km', { km: num(v) }) : t('{n} °C', { n: v }));

  // what is typed but not yet saved, per field (saved on change, Enter or leaving the field)
  let typed = $state({});
  const save = (key, value) => putSetting(db, OWN_KEY, ((next) => (Object.keys(next).length ? next : null))(setOwn(raw, key, value)));
  function commit(f) {
    const text = typed[f.key];
    delete typed[f.key];
    if (text == null) return;
    const v = clampOwn(f.key, text);
    if (v != null && v !== vals[f.key]) save(f.key, v);
  }
  const step = (f, dir) => save(f.key, Math.min(f.max, Math.max(f.min, vals[f.key] + dir * f.step)));
</script>

<div class="ew ich-page">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Own values')} sub={t('The numbers the app works with. Change them as you like; each one can go back to the Standard.')} />

  <div class="ew-grid">
    {#each SECTIONS as s (s.key)}
      {@const I = s.icon}
      {@const fs = fieldsOf(s.key)}
      <section class="ich-sec card ew-box" aria-labelledby="ew-{s.key}-h" data-own-sec={s.key}>
        <h2 id="ew-{s.key}-h"><I size={18} aria-hidden="true" />{t(s.name)}</h2>
        <ul class="ich-list" use:sortable={{ row: 'li[data-sort-id]', onmove: (from, to) => put(moveOwnTo(raw, s.key, fs[from].key, to)) }}>
          {#each fs as f, i (f.key)}
            {@const v = vals[f.key]}
            <li class="ew-row" data-own={f.key} data-sort-id={f.key}>
              <div class="ew-top">
                <span class="ew-sort"><SortGrip name={nameOf(f)} onstep={(dir) => put(moveOwn(raw, s.key, f.key, dir))} /><SortArrows name={nameOf(f)} {i} n={fs.length} onstep={(dir) => put(moveOwn(raw, s.key, f.key, dir))} /></span>
                <span class="ich-m"><b id="ew-{f.key}">{nameOf(f)}</b><small>{t(f.why)}</small></span>
                <button type="button" class="ew-pen" aria-haspopup="dialog" aria-label={t('Edit: {name}', { name: nameOf(f) })} data-own-edit={f.key} onclick={() => (sheet = { field: f })}><Pencil size={18} aria-hidden="true" /></button>
                <span class="ew-ctl" role="group" aria-labelledby="ew-{f.key}">
                  <button type="button" class="ew-step" aria-label={t('Less: {name}', { name: nameOf(f) })} disabled={v <= f.min} onclick={() => step(f, -1)}><Minus size={18} aria-hidden="true" /></button>
                  <input
                    class="inp num ew-in"
                    type="text"
                    inputmode={f.unit === 'time' ? 'text' : 'numeric'}
                    aria-label={nameOf(f)}
                    value={typed[f.key] ?? (f.unit === 'time' ? timeText(v) : String(v))}
                    oninput={(e) => (typed[f.key] = e.currentTarget.value)}
                    onchange={() => commit(f)}
                    onkeydown={(e) => e.key === 'Enter' && commit(f)}
                  />
                  <span class="ew-unit">{f.unit === 'days' ? tn(v, 'day', 'days') : f.unit === 'time' ? t('o’clock') : f.unit}</span>
                  <button type="button" class="ew-step" aria-label={t('More: {name}', { name: nameOf(f) })} disabled={v >= f.max} onclick={() => step(f, 1)}><Plus size={18} aria-hidden="true" /></button>
                </span>
              </div>
              <p class="ew-std">
                <span>{t('Standard: {value}', { value: say(f, f.std) })}</span>
                {#if v !== f.std}<span class="ew-mine">{t('Adapted')}</span><button type="button" class="ew-reset" data-own-reset={f.key} onclick={() => save(f.key, null)}><Undo2 size={15} aria-hidden="true" />{t('Back to Standard|value')}</button>{/if}
              </p>
            </li>
          {/each}
          {#if s.key === 'bike'}
            <li>
              <!-- IS 256: the care per part and per bike is already its own card (v0.144.0 RE) -->
              <a class="ich-row" href="#/bikes?tab=care">
                <span class="ich-ib"><Wrench size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{t('Care per bike')}</b><small>{t('One bike needs other numbers? Bikes › Care › «Care for …»: they win over these')}</small></span>
                <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
              </a>
            </li>
          {/if}
        </ul>
      </section>
    {/each}

    <section class="ich-sec card ew-box" aria-labelledby="ew-mine-h" data-own-sec="mine">
      <h2 id="ew-mine-h"><BellRing size={18} aria-hidden="true" />{t('Own reminders')}</h2>
      <p class="ew-intro">{t('Your own numbers: «every N km» or «every N days», for all bikes or one. They show in Bikes › Care with «Done».')}</p>
      {#if mine.length}
        <ul class="ich-list" use:sortable={{ row: 'li[data-sort-id]', onmove: (from, to) => put(moveOwnTo(raw, MINE, mine[from].id, to)) }}>
          {#each mine as x, i (x.id)}
            <li class="ew-row" data-mine={x.id} data-sort-id={x.id}>
              <div class="ew-top">
                <span class="ew-sort"><SortGrip name={x.name} onstep={(dir) => put(moveOwn(raw, MINE, x.id, dir))} /><SortArrows name={x.name} {i} n={mine.length} onstep={(dir) => put(moveOwn(raw, MINE, x.id, dir))} /></span>
                <button type="button" class="ew-edit" aria-haspopup="dialog" aria-label={t('Edit: {name}', { name: x.name })} onclick={() => (sheet = { mine: x })}>
                  <span class="ich-m"><b>{x.name}</b><small>{mineSay(x)} · {x.bike ? bikeName(x.bike) : t('all bikes')}</small></span>
                  <Pencil size={18} aria-hidden="true" />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
      <button type="button" class="ew-add" aria-haspopup="dialog" data-mine-add onclick={() => (sheet = { mine: null })}><Plus size={18} aria-hidden="true" />{t('Own reminder')}</button>
    </section>
    <section class="ich-sec card ew-box" aria-labelledby="ew-sugg-h" data-own-sec="suggest">
      <h2 id="ew-sugg-h"><Lightbulb size={18} aria-hidden="true" />{t('Suggestions')}</h2>
      <ul class="ich-list">
        <li class="ew-row">
          <div class="ew-top">
            <span class="ich-m"><b id="ew-tips">{t('Tips on all pages')}</b><small>{t('One tip a day under the page title. Off: no tip line any more.')}</small></span>
            <label class="ew-sw"><input type="checkbox" role="switch" data-own-tips aria-labelledby="ew-tips" checked={pi.info.tipsOn} onchange={(e) => ((on) => pi.save((v) => setTipsOn(v, on)))(e.currentTarget.checked)} /></label>
          </div>
        </li>
        <li class="ew-row">
          <div class="ew-top">
            <span class="ich-m"><b id="ew-know">{t('Also knowledge and fun')}</b><small>{t('Off: only useful tips, no «Did you know».')}</small></span>
            <label class="ew-sw"><input type="checkbox" role="switch" data-own-know aria-labelledby="ew-know" checked={pi.info.knowOn} onchange={(e) => ((on) => pi.save((v) => setKnowOn(v, on)))(e.currentTarget.checked)} /></label>
          </div>
        </li>
        <li>
          <a class="ich-row" href="#/flow/activity">
            <span class="ich-ib"><Activity size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{t('Ideas for activities')}</b><small>{t('Hide single ideas under Aktiv › Activity')}</small></span>
            <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
          </a>
        </li>
      </ul>
    </section>
  </div>
  {#if gone.length}
    <div class="ew-gone" data-own-gone><Fold label={t('Deleted values')} summary={tn(gone.length, '{n} value', '{n} values')}>
      <ul class="ich-list">
        {#each gone as f (f.key)}
          <li class="ew-row"><div class="ew-top"><span class="ich-m"><b>{nameOf(f)}</b><small>{t('Standard: {value}', { value: say(f, f.std) })}</small></span><button type="button" class="btn sm" data-own-restore={f.key} onclick={() => put(restoreOwn(raw, f.key))}><RotateCcw size={15} aria-hidden="true" />{t('Bring back')}</button></div></li>
        {/each}
      </ul>
    </Fold></div>
  {/if}
  <p class="ich-fine"><Info size={15} aria-hidden="true" /><span>{t('Only on this device and in the backup. Nothing here is mandatory. The pen renames or deletes a value; the handle and the arrows change the order.')}</span></p>
</div>

{#if sheet}
  <OwnValueSheet
    field={sheet.field ?? null}
    mine={sheet.mine ?? null}
    name={sheet.field ? (ownName(raw, sheet.field) === sheet.field.name ? '' : nameOf(sheet.field)) : ''}
    {bikes}
    onsave={saveSheet}
    onremove={sheet.field ? () => removeField(sheet.field) : sheet.mine ? () => removeMine(sheet.mine) : null}
    onclose={() => (sheet = null)}
  />
{/if}

<style>
  .ew {
    max-width: 1100px;
  }
  .ew-grid {
    display: grid;
    gap: 0 20px;
  }
  @media (min-width: 900px) {
    .ew-grid {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }
  .ew-box {
    padding: 14px 4px 6px;
  }
  .ew-box h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 16px 4px;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .ew-row {
    padding: 12px 0;
  }
  .ew-sort {
    flex: none;
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .ew-top > .ich-m {
    flex: 1 1 12em;
    min-width: 0;
  }
  .ew-pen,
  .ew-edit {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 44px;
    min-height: 44px;
    padding: 0 8px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ew-edit {
    flex: 1 1 12em;
    justify-content: space-between;
    text-align: left;
    color: var(--ink);
    font: inherit;
  }
  .ew-intro {
    margin: 0 16px 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ew-add {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    margin: 4px 12px 8px;
    padding: 0 8px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .ew-gone {
    margin-top: 12px;
  }
  .ew-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .ew-ctl {
    flex: none;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ew-step {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .ew-step:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .ew-in {
    width: 4.5em;
    min-height: 44px;
    text-align: center;
  }
  .ew-unit {
    min-width: 2.6em;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ew-std {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ew-mine {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .ew-reset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .ew-sw {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-left: auto;
  }
  .ew-sw input {
    width: 22px;
    height: 22px;
    margin: 0;
    accent-color: var(--hi);
  }
</style>
