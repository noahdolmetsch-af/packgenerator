<script>
  /**
   * «Velo im Griff» #1009 (Noah 19.10.2026): «Teilevorlage», the part template per bike kind
   * (#/bikes?tab=care&view=templates). Per kind (road bike, gravel, mountain bike): every part of the
   * app's list with a switch, and own parts that can be added, renamed, moved (arrows and drag) and
   * deleted (with Undo). Kept in the settings table as a difference to the standard (bikekind.js).
   * A part with data always stays on its bike; only empty parts that are switched off are hidden.
   * Loaded only when opened (Bikes.svelte), so the start of the app stays small.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2, RotateCcw } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { bikesHash, sortBikes } from '../bikes.js';
  import { PARTS, AREAS, partName } from '../care.js';
  import { vig } from '../veloimgriff.svelte.js';
  import { PART_TEMPLATES, KINDS, KIND_NAME, kindOf, partOn, ownOf, changed, setPartOn, addOwn, renameOwn, areaOwn, removeOwn, restoreOwn, moveOwn, resetKind } from '../bikekind.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import Seg from '../ui/Seg.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone, offerRename } from '../ui/rename.svelte.js';

  let { bikeId = null } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []).filter((b) => !b.archived && !b.gone));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? null);
  let picked = $state(null);
  const kind = $derived(picked ?? (bike ? kindOf(bike) : 'gravel'));
  const tpl = $derived(vig.tpl);
  const own = $derived(ownOf(tpl, kind));
  const ofKind = $derived(bikes.filter((b) => kindOf(b) === kind));
  const groups = $derived(AREAS.map((a) => ({ ...a, parts: PARTS.filter((p) => !p.legacy && p.area === a.key) })).filter((g) => g.parts.length));

  const save = (value) => db.settings.put({ key: PART_TEMPLATES, value: $state.snapshot(value) });

  let newName = $state('');
  let newArea = $state('extras');
  let renaming = $state(null); // own part
  let msg = $state('');

  async function add(e) {
    e?.preventDefault();
    const res = addOwn(tpl, kind, newName, newArea);
    if (!res.key) {
      msg = t('Give it a name.');
      return;
    }
    await save(res.templates);
    offerDone(t('"{name}" added to the template.', { name: newName.trim() }));
    newName = '';
    msg = '';
  }
  async function rename(p, name) {
    const old = p.name;
    await save(renameOwn(tpl, kind, p.key, name));
    offerRename(name.trim(), () => save(renameOwn(vig.tpl, kind, p.key, old)));
  }
  async function remove(p) {
    const answer = await askDelete({ title: t('Delete "{name}"?', { name: p.name }), text: t('New bikes no longer get it. Bikes that have it keep it with everything recorded on it.') });
    if (answer !== 'delete') return;
    const k = kind;
    await deleteWithUndo({
      name: p.name,
      text: t('"{name}" deleted.', { name: p.name }),
      run: async () => {
        const res = removeOwn(vig.tpl, k, p.key);
        await save(res.templates);
        return res;
      },
      undo: (res) => save(restoreOwn(vig.tpl, k, res.part, res.at)),
    });
  }
  const move = (from, to) => save(moveOwn(tpl, kind, from, to));
  async function reset() {
    const before = $state.snapshot(tpl);
    await save(resetKind(tpl, kind));
    offerDone(t('{kind}: template back to the standard.', { kind: t(KIND_NAME[kind]) }), () => save(before));
  }
</script>

<div class="tplp">
  <VeloHead
    crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bikeId }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care', bike: bikeId, open: !!bikeId }) }]}
    title={t('Part template')}
    sub={t('Which parts a bike of each kind gets')}
  />
  <p class="lead">{t('Every bike starts with the parts of its kind. Switch parts on or off and add your own. A part with data always stays on its bike; only empty parts that are switched off are hidden.')}</p>

  <div class="kinds">
    <span class="k" id="tpl-kind">{t('Kind of bike')}</span>
    <Seg options={KINDS.map((k) => ({ key: k, name: t(KIND_NAME[k]) }))} value={kind} labelledby="tpl-kind" full={false} onchange={(k) => (picked = k)} />
  </div>
  <p class="quiet" data-tpl-bikes>{ofKind.length ? t('Your bikes of this kind: {names}', { names: ofKind.map((b) => b.name).join(', ') }) : t('No bike of this kind yet.')} {t('The kind is set on each bike in Care.')}</p>

  {#each groups as g (g.key)}
    <section class="grp" aria-labelledby="tpl-{g.key}">
      <h2 id="tpl-{g.key}">{t(g.name)}</h2>
      <ul class="rows">
        {#each g.parts as p (p.key)}
          {@const on = partOn(tpl, kind, p.key)}
          <li class:off={!on} data-tpl-part={p.key}>
            <span class="nm">{partName(p)}{#if p.suspension === 'full'}<small>{t('only on a full suspension')}</small>{/if}</span>
            <button type="button" class="switch" role="switch" aria-checked={on} aria-label={t('{part} in the template', { part: partName(p) })} onclick={() => save(setPartOn(tpl, kind, p.key, !on))}><span class="knob"></span></button>
          </li>
        {/each}
      </ul>
    </section>
  {/each}

  <section class="grp" aria-labelledby="tpl-own">
    <h2 id="tpl-own">{t('Own parts')}</h2>
    {#if own.length}
      <ul class="rows own" use:sortable={{ onmove: move }}>
        {#each own as p, i (p.key)}
          <li data-sort-id={p.key} data-tpl-own={p.key}>
            <SortGrip name={p.name} onstep={(dir) => move(i, i + dir)} />
            <span class="nm">{p.name}<small>{t(AREAS.find((a) => a.key === p.area)?.name ?? 'Accessories')}</small></span>
            <select class="inp tsel" aria-label={t('Area of {name}', { name: p.name })} value={p.area} onchange={(e) => save(areaOwn(tpl, kind, p.key, e.currentTarget.value))}>
              {#each AREAS as a (a.key)}<option value={a.key}>{t(a.name)}</option>{/each}
            </select>
            <SortArrows name={p.name} {i} n={own.length} onstep={(dir) => move(i, i + dir)} />
            <button type="button" class="ib" aria-label={t('Rename {name}', { name: p.name })} onclick={() => (renaming = p)}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="ib" aria-label={t('Delete {name}', { name: p.name })} onclick={() => remove(p)} data-tpl-delete><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="quiet">{t('No own parts yet, e.g. a bell, a light or a bag holder.')}</p>
    {/if}
    <form class="addrow" onsubmit={add}>
      <input class="inp" type="text" maxlength="60" aria-label={t('Name of the new part')} placeholder={t('New part, e.g. Bell')} bind:value={newName} oninput={() => (msg = '')} data-tpl-new />
      <select class="inp tsel" aria-label={t('Area of the new part')} bind:value={newArea}>
        {#each AREAS as a (a.key)}<option value={a.key}>{t(a.name)}</option>{/each}
      </select>
      <button type="submit" class="btn" data-tpl-add><Plus size={16} aria-hidden="true" />{t('Add|part')}</button>
    </form>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  </section>

  {#if changed(tpl, kind)}
    <p class="resetrow"><button type="button" class="btn" onclick={reset} data-tpl-reset><RotateCcw size={16} aria-hidden="true" />{t('Back to the standard for {kind}', { kind: t(KIND_NAME[kind]) })}</button></p>
  {/if}
</div>

{#if renaming}
  <RenameSheet kicker={t('Part template')} title={t('Rename part')} value={renaming.name} max={60} hint={t('Bikes that have the part keep their own name.')} onsave={(v) => rename(renaming, v)} onclose={() => (renaming = null)} />
{/if}

<style>
  .tplp {
    min-width: 0;
  }
  .lead,
  .quiet {
    margin: 0 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .lead {
    font-size: var(--fs-body);
  }
  .kinds {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 0 0 6px;
  }
  .k {
    color: var(--ink-2);
  }
  .grp {
    margin: 0 0 14px;
    padding: 12px 16px 6px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  h2 {
    margin: 0 0 4px;
    font-size: var(--fs-body);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    border-top: 1px solid var(--line);
  }
  .nm {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .off .nm {
    color: var(--ink-2);
  }
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tsel {
    max-width: 10rem;
  }
  .own li {
    flex-wrap: wrap;
    padding: 4px 0;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .addrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .addrow input {
    flex: 1 1 12rem;
    min-width: 0;
  }
  .addrow .btn,
  .resetrow .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .err {
    color: var(--bad);
  }
  .switch {
    position: relative;
    flex: none;
    width: 56px;
    height: 44px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .switch::before {
    content: '';
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    height: 28px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--line-strong);
    transition: background 0.15s;
  }
  .switch .knob {
    position: absolute;
    top: 50%;
    left: 8px;
    width: 20px;
    height: 20px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: left 0.15s;
  }
  .switch[aria-checked='true']::before {
    background: var(--accent);
  }
  .switch[aria-checked='true'] .knob {
    left: 28px;
  }
</style>
