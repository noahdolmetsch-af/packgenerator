<script>
  /**
   * Paket VG 1135 «Ketten-Rotation» (Noah 20.10.2026 «8»): several chains for one bike, the km of each,
   * «Kette B ist dran» after X km (suggestion 500), switchable. Chains: add, rename, delete with Undo.
   * bike: the bike AS STORED (bike.chains is written back).
   */
  import { Link2, Plus, Pencil, Trash2, Repeat } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { rotationOf, addChain, renameChain, removeChain, swapChain, rotationSet, ROTATE_STD } from '../griff.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';

  let { bike } = $props();
  const today = localDay();
  const rot = $derived(rotationOf(bike));
  const on = $derived(bike.chains?.on !== false);
  let name = $state('');
  let editing = $state(null);
  let editText = $state('');
  let msg = $state('');

  async function store(patch, text) {
    if (!patch) return;
    const before = bike.chains ? JSON.parse(JSON.stringify(bike.chains)) : null;
    await db.bikes.update(bike.id, patch);
    if (text) offerDone(text, () => db.bikes.update(bike.id, { chains: before ?? {} }));
  }
  async function add(e) {
    e.preventDefault();
    const n = name.trim() || t('Chain {letter}', { letter: String.fromCharCode(65 + rot.list.length) });
    await store(addChain(bike, n, `ch-${Date.now().toString(36)}`), t('"{name}" added.', { name: n }));
    name = '';
  }
  async function rename(e, c) {
    e.preventDefault();
    if (!editText.trim()) return (msg = t('Type a name.'));
    await store(renameChain(bike, c.id, editText));
    editing = null;
    msg = '';
  }
  async function remove(c) {
    if ((await askDelete({ title: t('Delete "{name}"?', { name: c.name }), text: t('Its km on this page go too. The bike’s km stay.') })) !== 'delete') return;
    await deleteWithUndo({
      name: c.name,
      text: t('"{name}" deleted.', { name: c.name }),
      run: async () => {
        const before = JSON.parse(JSON.stringify(bike.chains ?? {}));
        await db.bikes.update(bike.id, removeChain(bike, c.id));
        return before;
      },
      undo: (before) => db.bikes.update(bike.id, { chains: before }),
    });
  }
  const swap = (c) => store(swapChain(bike, c.id, today), t('{name} is on the bike now.', { name: c.name }));
  const setOn = (v) => store(rotationSet(bike, { on: v }));
  const setEvery = (v) => {
    const n = Math.round(Number(v));
    return store(rotationSet(bike, { every: n >= 50 && n <= 20000 ? n : ROTATE_STD }));
  };
</script>

<section class="gcard" aria-labelledby="rot-h-{bike.id}" data-rotation>
  <h2 id="rot-h-{bike.id}"><Link2 size={18} aria-hidden="true" />{t('Chain rotation')}</h2>
  <p class="quiet">{t('Several chains on one bike, in turn: each wears less, and the cassette lasts longer. The app counts the km of each chain.')}</p>
  {#if rot.due}<p class="warn" data-rotation-due>{t('{name} is next: {km} km on the current chain.', { name: rot.next.name, km: num(rot.since) })}</p>{/if}
  {#if rot.list.length}
    <ul class="list">
      {#each rot.list as c (c.id)}
        <li data-chain={c.id}>
          {#if editing === c.id}
            <form class="row grow" onsubmit={(e) => rename(e, c)}>
              <input class="inp grow" type="text" maxlength="40" bind:value={editText} aria-label={t('Name')} />
              <button type="submit" class="btn sm">{t('Save')}</button>
              <button type="button" class="btn sm" onclick={() => (editing = null)}>{t('Cancel')}</button>
            </form>
          {:else}
            <span class="grow"><b>{c.name}</b> <span class="quiet num">{t('{km} km', { km: num(c.km) })}{#if c.current}{' · '}{t('on the bike')}{/if}</span></span>
            {#if !c.current}<button type="button" class="btn sm" onclick={() => swap(c)} data-chain-swap><Repeat size={14} aria-hidden="true" />{t('Put on')}</button>{/if}
            <button type="button" class="ib" aria-label={t('Edit {name}', { name: c.name })} onclick={() => ((editing = c.id), (editText = c.name))}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="ib" aria-label={t('Delete {name}', { name: c.name })} onclick={() => remove(c)}><Trash2 size={16} aria-hidden="true" /></button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  <form class="row" onsubmit={add}>
    <input class="inp grow" type="text" maxlength="40" placeholder={t('Chain {letter}', { letter: String.fromCharCode(65 + rot.list.length) })} aria-label={t('Name of the chain')} bind:value={name} data-chain-name />
    <button type="submit" class="btn sm" data-chain-add><Plus size={16} aria-hidden="true" />{t('Add a chain')}</button>
  </form>
  {#if rot.list.length > 1}
    <div class="row">
      <label class="quiet"><input type="checkbox" checked={on} onchange={(e) => setOn(e.currentTarget.checked)} data-rotation-on /> {t('Remind me to swap')}</label>
      {#if on}<label class="quiet">{t('every')} <input class="inp ev" type="number" min="50" max="20000" step="50" value={rot.every} onchange={(e) => setEvery(e.currentTarget.value)} data-rotation-every /> km</label>{/if}
    </div>
  {/if}
  {#if rot.current == null && rot.list.length}<p class="quiet">{t('Tap «Put on» on the chain that is on the bike now.')}</p>{/if}
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  {#if bike.chains?.swaps?.length}<p class="quiet">{t('Last swap: {date}', { date: dateOf(bike.chains.swaps.at(-1).day) })}</p>{/if}
</section>

<style>
  .ev {
    width: 6rem;
    min-height: 40px;
  }
</style>
