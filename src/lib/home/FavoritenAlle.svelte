<script>
  /**
   * «Alle Favoriten» (Noah 27.11.2026 «1-5a», 3a «Alle N ›», step 2): one window with every favourite, by group. Each group can be renamed and
   * deleted (the pins go where you say, with Undo; app rule «Gruppen überall»), a favourite goes with its star (with Undo) and is ordered with
   * the arrows, «New group» adds one. Head and foot stay put, «Done» lives in the foot. The tile (PinsTile.svelte) owns the record and the
   * saving: this window only asks it to change (`change(next, text)`), so the tile, this window and the page «Favoriten» stay one record.
   */
  import { X, Star, Plus } from '@lucide/svelte';
  import GroupActions from '../ui/GroupActions.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { backClose } from '../ui/backclose.js';
  import { pinLabel, pinsIn, shownGroups, groupLabel, removePin, movePin, addGroup, renameGroup, deleteGroup } from '../quick/quicklinks.js';
  import { t, tn } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { s, change, go, onclose } = $props();

  let dialog = $state();
  let deleting = $state(null);
  let newOpen = $state(false);
  let groupText = $state('');
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  const groups = $derived(shownGroups(s));
  const gName = (g) => groupLabel(g, t);
  const unpin = (p) => change(removePin(s, p.id), t('«{name}» unpinned.', { name: pinLabel(p, t) }));
  const move = (gid, a, b) => change(movePin(s, gid, a, b));
  const rename = (g, v) => change(renameGroup(s, g.id, v), v.trim() ? t('Group renamed to «{name}».', { name: v.trim() }) : null);
  const removeGroup = (g, to) => change(deleteGroup(s, g.id, to ?? ''), t('Group «{name}» deleted. The pins are still there.', { name: gName(g) }));
  function newGroup(e) {
    e.preventDefault();
    if (!groupText.trim()) return;
    change(addGroup(s, groupText));
    groupText = '';
    newOpen = false;
  }
  function open(p) {
    dialog.close();
    go(p);
  }
</script>

<dialog class="sheet vdlg from-below fav-all" bind:this={dialog} use:backClose {onclose} aria-labelledby="fav-all-h" data-fav-all>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="fav-all-h">{t('Favourites|quick')}</h2>
      <p class="vd-sub">{t('A tap on the star takes a favourite out, the arrows put them in order.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#each groups as g (g?.id ?? '')}
    {@const gid = g?.id ?? ''}
    {@const ps = pinsIn(s, gid)}
    <section class="fa-sec" data-fav-group={gid || 'none'} aria-labelledby={`fa-h-${gid || 'none'}`}>
      {#if g}
        <GroupActions name={gName(g)} count={ps.length} headClass="fa-gh" renameExplain={t('only the name changes')} deleteExplain={t('the pins stay')} deleteAsk="" allowEmpty={!!g.std} onrename={(v) => rename(g, v)} ondelete={() => (deleting = g)}>
          <h3 id={`fa-h-${gid}`}>{gName(g)}</h3>
        </GroupActions>
      {:else}
        <div class="fa-gh"><h3 id="fa-h-none">{gName(g)}</h3></div>
      {/if}
      {#if ps.length}
        <ul class="fa-list">
          {#each ps as p, i (p.id)}
            <li class="fa-row" data-fav-row={p.feature || p.href}>
              <button type="button" class="fa-star" aria-label={t('Unpin «{name}»', { name: pinLabel(p, t) })} onclick={() => unpin(p)}><Star size={20} fill="currentColor" aria-hidden="true" /></button>
              <button type="button" class="fa-go" onclick={() => open(p)}>
                <b>{pinLabel(p, t)}</b>{#if p.note}<small>{p.note}</small>{/if}
              </button>
              <SortArrows name={pinLabel(p, t)} {i} n={ps.length} onstep={(d) => move(gid, i, i + d)} />
            </li>
          {/each}
        </ul>
      {:else}
        <p class="fa-none">{t('No pins in this group yet.')}</p>
      {/if}
    </section>
  {/each}

  <div class="vd-foot fa-foot">
    {#if newOpen}
      <form class="fa-new" onsubmit={newGroup}>
        <input class="fa-input" bind:value={groupText} placeholder={t('Name of the new group')} aria-label={t('Name of the new group')} autocomplete="off" maxlength="60" />
        <button type="submit" class="btn hi" disabled={!groupText.trim()}>{t('Add')}</button>
        <button type="button" class="btn" onclick={() => (newOpen = false)}>{t('Cancel')}</button>
      </form>
    {:else}
      <button type="button" class="btn" data-fav-newgroup onclick={() => (newOpen = true)}><Plus size={16} aria-hidden="true" />{t('New group')}</button>
      <button type="button" class="btn hi" data-fav-done onclick={() => dialog.close()}>{t('Done')}</button>
    {/if}
  </div>
</dialog>

{#if deleting}
  {@const g = deleting}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?', { name: gName(g) })}
    count={pinsIn(s, g.id).length}
    what={(n) => tn(n, '{n} pin', '{n} pins')}
    none={t('Without a group|quick')}
    noneHint={t('The pins stay and show under «Without a group». No pin is deleted.')}
    targets={s.groups.filter((x) => x.id !== g.id).map((x) => ({ id: x.id, name: gName(x) }))}
    onconfirm={(to) => removeGroup(g, to)}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .fa-sec {
    display: grid;
    gap: 2px;
    margin-top: var(--sp-3);
  }
  :global(.fa-gh) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  .fa-sec h3 {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--ink-2);
  }
  .fa-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .fa-row {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 52px;
    border-bottom: 1px solid var(--line);
  }
  .fa-star {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--hi);
    cursor: pointer;
  }
  .fa-go {
    flex: 1 1 0;
    min-width: 0;
    display: grid;
    gap: 2px;
    padding: 6px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .fa-go small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fa-none {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fa-foot {
    gap: var(--sp-2);
  }
  .fa-new {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    width: 100%;
  }
  .fa-input {
    flex: 1 1 140px;
    min-width: 0;
    min-height: 44px;
    padding: 0 var(--sp-2);
    border: 1px solid var(--line);
    border-radius: 8px;
    font: inherit;
  }
</style>
