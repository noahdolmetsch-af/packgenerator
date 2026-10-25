<script>
  /**
   * Paket C: edit the kinds of a page (meaning tags, own bingo fields, kinds of special days). App rules
   * «Gruppen überall» and «alles selbst ändern»: add, rename (RenameSheet), sort (arrows and drag) and
   * delete (GroupDeleteSheet: where do its entries go, «Ohne …» first, then Undo). Logic: kinds.js.
   * kinds: [{ id, std?, name? }]; count(id): entries in a kind; what(n): «3 trips»; none / noneHint: the
   * «without» choice; onsave(kinds); ondelete(id, toId | null) does the delete and returns the undo snapshot;
   * onundo(snapshot).
   */
  import { Pencil, Trash2, Plus } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';
  import { kindName, addKind, renameKind, moveKind } from './kinds.js';

  let { kinds, count = () => 0, what = (n) => String(n), none = '', noneHint = '', onsave, ondelete, onundo, label = '' } = $props();
  const nm = (k) => kindName(k, t);
  let renaming = $state(null);
  let deleting = $state(null);
  let fresh = $state('');
  function add(e) {
    e.preventDefault();
    const next = addKind(kinds, fresh);
    if (next !== kinds) onsave(next);
    fresh = '';
  }
  async function rename(name) {
    const old = nm(renaming);
    onsave(renameKind(kinds, renaming.id, name));
    offerDone(t('Renamed to «{name}».', { name: name.trim() || old }));
  }
  async function confirmDelete(to) {
    const k = deleting;
    const snap = await ondelete(k.id, to);
    offerDone(t('«{name}» deleted.', { name: nm(k) }), () => onundo?.(snap));
  }
</script>

<ul class="rh-list" use:sortable={{ onmove: (from, to) => onsave(moveKind(kinds, from, to)) }} data-kinds>
  {#each kinds as k, i (k.id)}
    <li data-sort-id={k.id}>
      <SortGrip name={nm(k)} onstep={(d) => onsave(moveKind(kinds, i, i + d))} />
      <span class="rh-grow">{nm(k)}<small>{what(count(k.id))}</small></span>
      <SortArrows name={nm(k)} {i} n={kinds.length} onstep={(d) => onsave(moveKind(kinds, i, i + d))} />
      <button type="button" class="rh-x" aria-label={t('Rename «{name}»', { name: nm(k) })} onclick={() => (renaming = k)}><Pencil size={16} /></button>
      <button type="button" class="rh-x" aria-label={t('Delete «{name}»', { name: nm(k) })} onclick={() => (deleting = k)}><Trash2 size={16} /></button>
    </li>
  {/each}
</ul>
<form class="rh-row" onsubmit={add}>
  <input class="inp" bind:value={fresh} maxlength="40" placeholder={label || t('New kind')} aria-label={label || t('New kind')} data-kind-new />
  <button type="submit" class="btn sm" disabled={!fresh.trim()}><Plus size={14} aria-hidden="true" />{t('Add')}</button>
</form>

{#if renaming}
  <RenameSheet title={t('Rename «{name}»', { name: nm(renaming) })} value={nm(renaming)} max={40} onsave={rename} onclose={() => (renaming = null)} />
{/if}
{#if deleting}
  <GroupDeleteSheet
    title={t('Delete «{name}»?', { name: nm(deleting) })}
    count={count(deleting.id)}
    {what}
    {none}
    {noneHint}
    targets={kinds.filter((k) => k.id !== deleting.id).map((k) => ({ id: k.id, name: nm(k) }))}
    onconfirm={confirmDelete}
    onclose={() => (deleting = null)}
  />
{/if}
