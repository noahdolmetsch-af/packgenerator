<script>
  /**
   * Paket A (Noah 18.10.2026, app rule «every group can be renamed and deleted»): a group heading with
   * «…» › «Rename» and «Delete». Rename opens a small form under the heading; Delete asks once.
   * The page does the data change and shows its own «Undo» (ui/undo.js UNDO_MS); this piece only asks.
   *
   *   <GroupActions name={groupName(g)} count={g.rows.length} onrename={(v) => …} ondelete={() => …}>
   *     <h2 id="…">{groupName(g)}</h2><p class="ich-hs">…</p>
   *   </GroupActions>
   *
   * name           the group's shown name (the form starts with it)
   * count          how many things are in the group (for the default texts)
   * canRename      false hides «Rename»; canDelete false hides «Delete» (e.g. a default group)
   * renameExplain  one line in the menu under «Rename»; deleteExplain the same for «Delete»
   * renameHelp     the line under the rename form
   * deleteAsk      the question before a delete (confirm); '' deletes without asking
   * allowEmpty     true: saving an empty name calls onrename('') (e.g. a default group back to its own name)
   * onrename(v)    called with the new, trimmed name when it differs; ondelete() after the question
   * headClass      the heading row's class (default «ich-h»); children = the heading's own content
   */
  import { tick } from 'svelte';
  import { askDelete } from './ask.js';
  import { Pencil, Trash2 } from '@lucide/svelte';
  import MoreActions from './MoreActions.svelte';
  import { t, tn } from '../i18n.svelte.js';

  let {
    name = '',
    count = 0,
    canRename = true,
    canDelete = true,
    renameExplain = null,
    deleteExplain = null,
    renameHelp = null,
    deleteAsk = null,
    allowEmpty = false,
    onrename = null,
    ondelete = null,
    headClass = 'ich-h',
    children,
  } = $props();

  let value = $state(null); // null = form closed
  let input = $state(null);

  async function start() {
    value = name;
    await tick();
    input?.focus();
    input?.select();
  }
  function save() {
    const v = (value ?? '').trim();
    value = null;
    if (v !== name && (v || allowEmpty)) onrename?.(v);
  }
  async function remove() {
    const ask = deleteAsk ?? (count ? tn(count, 'Delete the group «{name}»? The {n} entry in it stays.', 'Delete the group «{name}»? The {n} entries in it stay.', { name }) : t('Delete the empty group «{name}»?', { name }));
    // «Alle Daten anpassbar» (21.10.2026): the app's own window instead of the browser's
    if (ask && (await askDelete({ title: ask })) !== 'delete') return;
    ondelete?.();
  }
  const actions = $derived([
    ...(canRename ? [{ name: t('Rename'), explain: renameExplain ?? t('every entry in it gets the new name'), icon: Pencil, run: start }] : []),
    ...(canDelete ? [{ name: t('Delete'), explain: deleteExplain ?? t('only the group goes; its entries stay'), icon: Trash2, run: remove }] : []),
  ]);
</script>

<div class="{headClass} ga-h">
  <div>{@render children?.()}</div>
  {#if actions.length}<MoreActions title={name} label={t('More for the group {name}', { name })} {actions} />{/if}
</div>
{#if value !== null}
  <form class="ga-rn" data-group-rename onsubmit={(e) => (e.preventDefault(), save())} onkeydown={(e) => e.key === 'Escape' && (e.preventDefault(), (value = null))}>
    <input class="inp" type="text" bind:this={input} bind:value maxlength="60" aria-label={t('New name of the group')} />
    <button type="submit" class="btn hi">{t('Save')}</button>
    <button type="button" class="btn" onclick={() => (value = null)}>{t('Discard')}</button>
  </form>
  <p class="ich-help ga-help">{renameHelp ?? tn(count, 'The {n} entry in it gets the new name.', 'The {n} entries in it get the new name.')}</p>
{/if}

<style>
  .ga-h {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .ga-h > div {
    min-width: 0;
  }
  .ga-rn {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 6px;
  }
  .ga-rn .inp {
    flex: 1 1 12em;
    min-width: 0;
  }
  .ga-rn .btn {
    min-height: 44px;
  }
</style>
