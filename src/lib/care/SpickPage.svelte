<script>
  /**
   * «Velo im Griff» #327 (Noah 19.10.2026): «Werkstatt-Spick» (#/bikes?tab=care&view=spick), a cheat
   * sheet that works offline (it is in the app, no internet needed):
   * (a) the torque table of typical values, with the clear line that the value printed on the part always
   *     wins, plus own rows (add, rename, change the value, move with arrows and drag, delete with Undo);
   * (b) «Pannenhilfe»: short steps for the common breakdowns, one fold each.
   * Loaded only when opened (Bikes.svelte), so the start of the app stays small.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2, TriangleAlert } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { bikesHash } from '../bikes.js';
  import { TORQUE, BREAKDOWNS, TORQUE_OWN, normRows, readNm, addRow, changeRow, removeRow, restoreRow, moveRow } from '../spick.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone, offerRename } from '../ui/rename.svelte.js';

  let { bikeId = null } = $props();

  const ownQ = liveQuery(() => db.settings.get(TORQUE_OWN));
  const rows = $derived(normRows($ownQ?.value));
  const save = (list) => db.settings.put({ key: TORQUE_OWN, value: $state.snapshot(list) });
  const read = async () => normRows((await db.settings.get(TORQUE_OWN))?.value);

  let newName = $state('');
  let newNm = $state('');
  let msg = $state('');
  let renaming = $state(null);
  let valueMsg = $state(null); // { id, text }

  async function add(e) {
    e?.preventDefault();
    const nm = readNm(newNm);
    if (!newName.trim()) return (msg = t('Give it a name.'));
    if (nm == null) return (msg = t('Type the value in Nm, e.g. 5 or 5–6.'));
    await save(addRow(await read(), newName, nm));
    offerDone(t('"{name}" added.', { name: newName.trim() }));
    newName = '';
    newNm = '';
    msg = '';
  }
  async function setValue(r, text) {
    const nm = readNm(text);
    if (nm == null) {
      valueMsg = { id: r.id, text: t('Type the value in Nm, e.g. 5 or 5–6.') };
      return;
    }
    valueMsg = null;
    if (nm !== r.nm) await save(changeRow(await read(), r.id, { nm }));
  }
  async function rename(r, name) {
    const old = r.name;
    await save(changeRow(await read(), r.id, { name }));
    offerRename(name.trim(), async () => save(changeRow(await read(), r.id, { name: old })));
  }
  async function remove(r) {
    const answer = await askDelete({ title: t('Delete "{name}"?', { name: r.name }), text: t('Only your own row goes. The typical values stay.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      name: r.name,
      text: t('"{name}" deleted.', { name: r.name }),
      run: async () => {
        const res = removeRow(await read(), r.id);
        await save(res.rows);
        return res;
      },
      undo: async (res) => save(restoreRow(await read(), res.row, res.at)),
    });
  }
  const move = async (from, to) => save(moveRow(await read(), from, to));
</script>

<div class="spick">
  <VeloHead
    crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bikeId }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care', bike: bikeId, open: !!bikeId }) }]}
    title={t('Workshop cheat sheet')}
    sub={t('Torque values and breakdown help · works offline')}
  />

  <section class="spcard" aria-labelledby="sp-tq">
    <h2 id="sp-tq">{t('Torque values')}</h2>
    <p class="warn" data-spick-note><TriangleAlert size={16} aria-hidden="true" /><span>{t('Typical values only. The value printed on the part always wins.')}</span></p>
    <table class="tq">
      <thead><tr><th scope="col">{t('Bolt')}</th><th scope="col" class="r">Nm</th></tr></thead>
      <tbody>
        {#each TORQUE as r (r.key)}
          <tr data-torque={r.key}>
            <th scope="row">{t(r.name)}{#if r.note}<small>{t(r.note)}</small>{/if}</th>
            <td class="r num">{r.nm || '–'}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <h3>{t('Your own values')}</h3>
    {#if rows.length}
      <ul class="own" use:sortable={{ onmove: move }}>
        {#each rows as r, i (r.id)}
          <li data-sort-id={r.id} data-torque-own={r.id}>
            <SortGrip name={r.name} onstep={(dir) => move(i, i + dir)} />
            <span class="nm">{r.name}</span>
            <label class="nmv"><input class="inp num" type="text" inputmode="decimal" aria-label={t('Nm for {name}', { name: r.name })} value={r.nm} onchange={(e) => setValue(r, e.currentTarget.value)} data-torque-value /><span>Nm</span></label>
            <SortArrows name={r.name} {i} n={rows.length} onstep={(dir) => move(i, i + dir)} />
            <button type="button" class="ib" aria-label={t('Rename {name}', { name: r.name })} onclick={() => (renaming = r)} data-torque-rename><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="ib" aria-label={t('Delete {name}', { name: r.name })} onclick={() => remove(r)} data-torque-delete><Trash2 size={16} aria-hidden="true" /></button>
            {#if valueMsg?.id === r.id}<p class="err" role="alert">{valueMsg.text}</p>{/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="quiet">{t('Add the values of your own parts, e.g. from the print on your stem.')}</p>
    {/if}
    <form class="addrow" onsubmit={add}>
      <input class="inp" type="text" maxlength="60" aria-label={t('Name of the bolt')} placeholder={t('e.g. Stem, my bike')} bind:value={newName} oninput={() => (msg = '')} data-torque-new />
      <input class="inp num nmin" type="text" inputmode="decimal" aria-label={t('Value in Nm')} placeholder="Nm" bind:value={newNm} oninput={() => (msg = '')} data-torque-newnm />
      <button type="submit" class="btn" data-torque-add><Plus size={16} aria-hidden="true" />{t('Add|row')}</button>
    </form>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  </section>

  <section class="spcard" aria-labelledby="sp-help">
    <h2 id="sp-help">{t('Breakdown help')}</h2>
    <p class="quiet">{t('Short steps for the road. Open the breakdown you have.')}</p>
    {#each BREAKDOWNS as b (b.key)}
      <details class="fold" data-breakdown={b.key}>
        <summary>{t(b.name)}</summary>
        <ol>
          {#each b.steps as s, n (n)}<li>{t(s)}</li>{/each}
        </ol>
      </details>
    {/each}
  </section>
</div>

{#if renaming}
  <RenameSheet kicker={t('Torque values')} title={t('Rename row')} value={renaming.name} max={60} onsave={(v) => rename(renaming, v)} onclose={() => (renaming = null)} />
{/if}

<style>
  .spick {
    min-width: 0;
  }
  .spcard {
    margin: 0 0 14px;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
  }
  h2 {
    margin: 0 0 6px;
    font-size: var(--fs-body);
  }
  h3 {
    margin: 16px 0 4px;
    font-size: var(--fs-body);
  }
  .warn {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0 0 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--paper-2);
    font-weight: 500;
  }
  .warn :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .quiet {
    margin: 0 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tq {
    width: 100%;
    border-collapse: collapse;
  }
  .tq th,
  .tq td {
    padding: 8px 0;
    border-top: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
    font-weight: 400;
  }
  .tq thead th {
    border-top: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tq th[scope='row'] {
    display: grid;
    overflow-wrap: break-word;
  }
  .tq .r {
    padding-left: 12px;
    text-align: right;
    white-space: nowrap;
  }
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .own {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .own li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    border-top: 1px solid var(--line);
  }
  .nm {
    flex: 1 1 8rem;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nmv {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .nmv input,
  .nmin {
    width: 5.5rem;
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
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .addrow input:first-child {
    flex: 1 1 12rem;
    min-width: 0;
  }
  .addrow .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .err {
    flex-basis: 100%;
    margin: 4px 0;
    color: var(--bad);
  }
  .fold {
    border-top: 1px solid var(--line);
  }
  .fold summary {
    display: flex;
    align-items: center;
    min-height: 48px;
    cursor: pointer;
    font-weight: 500;
  }
  .fold ol {
    margin: 0 0 12px;
    padding-left: 1.4rem;
  }
  .fold li {
    margin: 0 0 6px;
    overflow-wrap: break-word;
  }
</style>
