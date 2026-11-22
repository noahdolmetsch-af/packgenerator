<script>
  /**
   * «Ein Abenteuer im Monat» (Träume und Neuland N12, Noah 07.11.2026 «ok N12»), on Touren › Träume: this month's
   * small adventure (the kinds take turns: After-work bivouac, Train there bike home, Round through new ground, and
   * your own ideas), «Show me» scrolls to the card for it, «Not this month» closes it (also the line on Today) and
   * «Show again» undoes it. Under «Kinds»: hide and show the built-in ones, add, rename and delete your own
   * (each with Undo), switch the line on Today off. Rules in monatsabenteuer.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { ADV_KEY, advCfg, adventuresOf, hiddenAdventures, adventureFor, monthOf, skipMonth, unskip, setToday, hideAdventure, addAdventure, renameAdventure, deleteAdventure } from './monatsabenteuer.js';
  import { localDay } from '../localday.js';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { deleteWithUndo } from '../ui/ask.js';
  import { offerDone, offerRename } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';
  import { Tent, Pencil, Trash2, EyeOff, Eye, Plus, ArrowDown } from '@lucide/svelte';

  const SPOT = { biwak: '[data-biwak]', train: '[data-train-home]', round: '[data-white-spots]' };
  const q = liveQuery(async () => (await db.settings.get(ADV_KEY))?.value ?? null);
  const cfg = $derived(advCfg($q));
  const month = monthOf(localDay());
  const list = $derived(adventuresOf(cfg, month));
  const hidden = $derived(hiddenAdventures(cfg));
  const adv = $derived(adventureFor(cfg, month));
  const skipped = $derived(cfg.skip === month);
  const save = (next) => db.settings.put({ key: ADV_KEY, value: JSON.parse(JSON.stringify(next)) });
  const shown = (a) => (a.own ? a.text : t(a.text)); // own words never go through t()

  function showMe() {
    const el = adv && SPOT[adv.id] ? document.querySelector(SPOT[adv.id]) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  let open = $state(false);
  let text = $state('');
  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const before = cfg;
    await save(addAdventure(cfg, text, `ad-${Date.now().toString(36)}`));
    offerDone(t('Adventure added.'), () => save(before));
    text = '';
  }
  async function hide(a) {
    const before = cfg;
    await save(hideAdventure(cfg, a.id));
    offerDone(t('Adventure hidden. «Show hidden adventures» brings it back.'), () => save(before));
  }
  async function remove(a) {
    const before = cfg;
    await deleteWithUndo({ run: () => save(deleteAdventure(cfg, a.id)), undo: () => save(before), text: t('"{name}" deleted.', { name: a.text }), name: a.text });
  }
  let edit = $state(null);
  const editing = $derived(edit ? cfg.own.find((r) => r.id === edit) : null);
  async function rename(name) {
    const before = cfg;
    await save(renameAdventure(cfg, edit, name));
    offerRename(name, () => save(before));
  }
  let showHidden = $state(false);
</script>

<section class="ich-sec" aria-labelledby="ma-h" data-month-adv>
  <div class="ich-h">
    <div>
      <h2 id="ma-h">{t('One adventure a month')}</h2>
      <p class="ich-hs">{t('Once a month one small adventure, the kinds taking turns. Only a suggestion.')}</p>
    </div>
  </div>
  <div class="card ich-body ma">
    {#if adv && !skipped}
      <p class="ma-now" data-month-adv-now={adv.id}><span class="ich-ib"><Tent size={18} aria-hidden="true" /></span><span><b>{shown(adv)}</b>{#if adv.hint}<small>{t(adv.hint)}</small>{/if}</span></p>
      <div class="ma-btns">
        {#if SPOT[adv.id]}<button type="button" class="btn hi" onclick={showMe} data-month-adv-show><ArrowDown size={16} aria-hidden="true" />{t('Show me')}</button>{/if}
        <button type="button" class="btn" onclick={() => save(skipMonth(cfg, month))} data-month-adv-skip>{t('Not this month')}</button>
      </div>
    {:else if skipped}
      <p class="ich-help" data-month-adv-skipped>{t('No adventure this month. It is yours to bring back.')}</p>
      <button type="button" class="btn" onclick={() => save(unskip(cfg))} data-month-adv-back>{t('Show again')}</button>
    {:else}
      <p class="ich-help" data-month-adv-none>{t('No kind of adventure is in play. Show one again under «Kinds», or add your own.')}</p>
    {/if}

    <button type="button" class="btn btn-link" aria-expanded={open} onclick={() => (open = !open)} data-month-adv-kinds>{open ? t('Close') : t('Kinds ({n})', { n: list.length })}</button>
    {#if open}
      <ul class="ma-list">
        {#each list as a (a.id)}
          <li class="ma-row" data-month-adv-item={a.id}>
            <span class="ma-t">{shown(a)}</span>
            {#if a.own}
              <button type="button" class="btn icon sm" aria-label={t('Rename «{name}»', { name: a.text })} onclick={() => (edit = a.id)} data-month-adv-edit><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="btn icon sm" aria-label={t('Delete «{name}»', { name: a.text })} onclick={() => remove(a)} data-month-adv-del><Trash2 size={16} aria-hidden="true" /></button>
            {:else}
              <button type="button" class="btn icon sm" aria-label={t('Hide «{name}»', { name: shown(a) })} onclick={() => hide(a)} data-month-adv-hide><EyeOff size={16} aria-hidden="true" /></button>
            {/if}
          </li>
        {/each}
      </ul>
      {#if hidden.length}
        <button type="button" class="btn btn-link" onclick={() => (showHidden = !showHidden)} data-month-adv-hidden>{showHidden ? t('Close') : t('Show hidden adventures ({n})', { n: hidden.length })}</button>
        {#if showHidden}
          <ul class="ma-list">
            {#each hidden as a (a.id)}
              <li class="ma-row off"><span class="ma-t">{t(a.text)}</span><button type="button" class="btn sm" onclick={() => save(hideAdventure(cfg, a.id, false))} data-month-adv-unhide><Eye size={16} aria-hidden="true" />{t('Show again')}</button></li>
            {/each}
          </ul>
        {/if}
      {/if}
      <form class="ma-add" onsubmit={add}>
        <label><span class="sr">{t('Own adventure')}</span><input class="inp" type="text" maxlength="120" bind:value={text} placeholder={t('Own adventure, e.g. «Sleep at a lake»')} data-month-adv-new /></label>
        <button type="submit" class="btn" disabled={!text.trim()} data-month-adv-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
      </form>
      <label class="ma-today"><input type="checkbox" checked={cfg.today} onchange={(e) => save(setToday(cfg, e.currentTarget.checked))} data-month-adv-today /><span>{t('Show a line on Today')}</span></label>
    {/if}
  </div>
</section>

{#if editing}
  <RenameSheet kicker={t('Adventure')} title={t('Rename adventure')} value={editing.text} max={120} onsave={rename} onclose={() => (edit = null)} />
{/if}

<style>
  .ma {
    display: grid;
    gap: var(--sp-3);
  }
  .ma-now {
    display: flex;
    gap: var(--sp-3);
    align-items: flex-start;
    margin: 0;
    font-size: var(--fs-sub);
    overflow-wrap: break-word;
  }
  .ma-now span:last-child {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .ma-now small {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .ma-btns {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .ma-btns .btn,
  .ma-row .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .ma-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .ma-row {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }
  .ma-row.off {
    color: var(--ink-3);
  }
  .ma-t {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ma-add {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }
  .ma-add label {
    flex: 1;
    min-width: 0;
  }
  .ma-add .inp {
    width: 100%;
  }
  .ma-today {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    min-height: 44px;
  }
</style>
