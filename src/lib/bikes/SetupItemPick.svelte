<script>
  /**
   * Taschen-Setups TS2 «+ Material dazu»: tick things from Gear for one bag of a setup. Things already
   * in another bag of the setup move here. Only your own things; the bags themselves are left out.
   * items: Gear; taken: { itemId: place } of the setup; place: the bag's place; onsave(ids).
   */
  import { backClose } from '../ui/backclose.js';
  import { X } from '@lucide/svelte';
  import './velo-dlg.css';
  import { formatWeight, isInventory } from '../gear.js';
  import { t, nameOf, bagName } from '../i18n.svelte.js';

  let { items = [], containers = [], taken = {}, bag = '', onsave, onclose } = $props();

  let q = $state('');
  let ticked = $state([]);
  let dialog;
  $effect(() => {
    dialog.showModal();
  });
  const bagItems = $derived(new Set(containers.map((c) => c.itemId).filter(Boolean)));
  const shown = $derived(
    items
      .filter((i) => isInventory(i) && !bagItems.has(i.id))
      .filter((i) => !q.trim() || nameOf(i).toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
      .slice(0, 80),
  );
  function save(event) {
    event.preventDefault();
    onsave?.([...ticked]);
    dialog.close();
  }
</script>

<dialog class="sheet vdlg pdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="sp-h">
  <form onsubmit={save}>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="sp-h">{t('Gear into «{bag}»', { bag: bagName(bag) })}</h2>
        <p class="vd-sub meta">{t('Tick what goes in this bag. Things from another bag move here.')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
    </div>
    <label class="srch"><span class="lbl">{t('Search')}</span><input class="inp" type="search" bind:value={q} /></label>
    <ul class="pl">
      {#each shown as i (i.id)}
        <li>
          <label class="pr">
            <input type="checkbox" value={i.id} bind:group={ticked} />
            <span class="pn">{nameOf(i)}{#if taken[i.id]}<small>{t('now in «{bag}»', { bag: taken[i.id] })}</small>{/if}</span>
            <span class="num pg">{i.weightG == null ? '' : formatWeight(i.weightG)}</span>
          </label>
        </li>
      {:else}
        <li class="none">{t('Nothing found.')}</li>
      {/each}
    </ul>
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" disabled={!ticked.length}>{ticked.length ? t('Add {n}', { n: ticked.length }) : t('Add')}</button>
    </div>
  </form>
</dialog>

<style>
  .pdlg {
    width: min(520px, calc(100vw - 24px));
  }
  .srch {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0 0 8px;
  }
  .pl {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: min(52vh, 420px);
    overflow-y: auto;
  }
  .pl li + li {
    border-top: 1px solid var(--line);
  }
  .pr {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    cursor: pointer;
  }
  .pr input {
    width: 20px;
    height: 20px;
  }
  .pn {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .pn small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pg {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .none {
    padding: 12px 0;
    color: var(--ink-3);
  }
</style>
