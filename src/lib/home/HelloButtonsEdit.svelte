<script>
  /**
   * Gruss B «Knöpfe anpassen» (Noah 05.11.2026): the editor of the greeting's buttons, in the window itself and
   * on «Deine Abfragen». App rules «Alles selbst ändern», «Gruppen überall», «Pfeile und Ziehen»: every button can be
   * added (feelings with an emoji, plans), renamed, hidden, deleted (ask, then Undo) and sorted (arrows and drag);
   * the groups of the feelings can be added, renamed, sorted and deleted (where do the buttons go: «Ohne Gruppe» first).
   * cfg: the record (hallobuttons.js cfgOf); onsave(cfg): saves it.
   */
  import { Pencil, Trash2, Eye, EyeOff } from '@lucide/svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import ButtonSheet from './ButtonSheet.svelte';
  import ButtonAdd from './ButtonAdd.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, tn } from '../i18n.svelte.js';
  import { shown, addItem, editItem, setHidden, dropItem, moveItem, addGroup, renameGroup, moveGroup, dropGroup, groupName } from './hallobuttons.js';
  import { HELLO_MOOD, HELLO_PLAN } from './hallo.js';

  let { cfg, onsave } = $props();
  let editing = $state(null); // { where, item }
  let renamingGroup = $state(null);
  let deletingGroup = $state(null);
  const gname = (g) => groupName(g, t);

  function add(where, name, emoji) {
    const next = addItem(cfg, where, name, emoji);
    if (next !== cfg) onsave(next);
  }
  async function remove(where, x) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: x.label }), text: t('The button is gone from the window. Answers you gave with it keep their words.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const before = cfg;
        await onsave(dropItem(cfg, where, x.key));
        return before;
      },
      undo: (before) => onsave(before),
      text: t('«{name}» deleted.', { name: x.label }),
      name: x.label,
    });
  }
  function saveItem({ label, emoji }) {
    const { where, item } = editing;
    onsave(editItem(cfg, where, item.key, { label, emoji }));
    offerDone(t('Renamed to «{name}».', { name: label.trim() || item.label }));
  }
  function renameG(name) {
    onsave(renameGroup(cfg, renamingGroup.id, name));
    offerDone(t('Renamed to «{name}».', { name: name.trim() }));
  }
  async function confirmDeleteGroup(to) {
    const g = deletingGroup;
    const before = cfg;
    await onsave(dropGroup(cfg, g.id, to));
    offerDone(t('«{name}» deleted.', { name: gname(g) }), () => onsave(before));
  }
  function addG(name) {
    const next = addGroup(cfg, name);
    if (next !== cfg) onsave(next);
  }
  const count = (g) => g.items.filter((x) => !x.gone).length;
</script>

{#snippet list(where, name, withEmoji, canAdd)}
  {@const items = shown(cfg, where)}
  <ul class="hb-list" use:sortable={{ onmove: (from, to) => onsave(moveItem(cfg, where, from, to)) }} data-hb-list={where} aria-label={name}>
    {#each items as x, i (x.key)}
      <li data-sort-id={x.key} class:off={x.hidden} data-hb={x.key}>
        <SortGrip name={x.label} onstep={(d) => onsave(moveItem(cfg, where, i, i + d))} />
        <span class="hb-grow">{#if x.emoji}<span class="em" aria-hidden="true">{x.emoji}</span>{/if}{x.label}{#if x.hidden}<small>{t('hidden')}</small>{/if}</span>
        <SortArrows name={x.label} {i} n={items.length} onstep={(d) => onsave(moveItem(cfg, where, i, i + d))} />
        <button type="button" class="hb-x" aria-label={x.hidden ? t('Show «{name}»', { name: x.label }) : t('Hide «{name}»', { name: x.label })} aria-pressed={!x.hidden} onclick={() => onsave(setHidden(cfg, where, x.key, !x.hidden))} data-hb-hide>{#if x.hidden}<EyeOff size={16} />{:else}<Eye size={16} />{/if}</button>
        <button type="button" class="hb-x" aria-label={t('Rename «{name}»', { name: x.label })} onclick={() => (editing = { where, item: x })} data-hb-edit><Pencil size={16} /></button>
        <button type="button" class="hb-x" aria-label={t('Delete «{name}»', { name: x.label })} onclick={() => remove(where, x)} data-hb-del><Trash2 size={16} /></button>
      </li>
    {/each}
  </ul>
  {#if canAdd}<ButtonAdd placeholder={t('New button')} {withEmoji} key={where} onadd={(n, e) => add(where, n, e)} />{/if}
{/snippet}

<div class="hb" data-hello-edit>
  <p class="hint">{t('Your buttons, your words. Everything can be renamed, hidden, deleted (with Undo) and sorted.')}</p>

  <h3>{HELLO_MOOD}</h3>
  <p class="sub">{t('The five faces: rename, hide or delete.')}</p>
  {@render list('faces', HELLO_MOOD, false, false)}

  {#each cfg.groups as g, gi (g.id)}
    <div class="hb-g" data-hb-group={g.id}>
      <div class="hb-gh">
        <h3>{gname(g)}</h3>
        <SortArrows name={gname(g)} i={gi} n={cfg.groups.length} onstep={(d) => onsave(moveGroup(cfg, gi, gi + d))} />
        <button type="button" class="hb-x" aria-label={t('Rename «{name}»', { name: gname(g) })} onclick={() => (renamingGroup = g)} data-hb-gedit><Pencil size={16} /></button>
        <button type="button" class="hb-x" aria-label={t('Delete «{name}»', { name: gname(g) })} onclick={() => (deletingGroup = g)} data-hb-gdel><Trash2 size={16} /></button>
      </div>
      {@render list(g.id, gname(g), true, true)}
    </div>
  {/each}
  <ButtonAdd placeholder={t('New group of buttons')} button={t('Add group|hello')} key="group" max={40} onadd={(n) => addG(n)} />

  <h3>{HELLO_PLAN}</h3>
  {@render list('plans', HELLO_PLAN, false, true)}
</div>

{#if editing}
  <ButtonSheet title={t('Rename «{name}»', { name: editing.item.label })} label={editing.item.label} emoji={editing.item.emoji ?? ''} withEmoji={editing.item.emoji !== undefined} onsave={saveItem} onclose={() => (editing = null)} />
{/if}
{#if renamingGroup}
  <RenameSheet title={t('Rename «{name}»', { name: gname(renamingGroup) })} value={gname(renamingGroup)} max={40} onsave={renameG} onclose={() => (renamingGroup = null)} />
{/if}
{#if deletingGroup}
  <GroupDeleteSheet
    title={t('Delete «{name}»?', { name: gname(deletingGroup) })}
    count={count(deletingGroup)}
    what={(n) => tn(n, '{n} button', '{n} buttons')}
    none={t('No group|hello')}
    noneHint={t('The buttons stay, in a group without a name.')}
    targets={cfg.groups.filter((g) => g.id !== deletingGroup.id).map((g) => ({ id: g.id, name: gname(g) }))}
    onconfirm={confirmDeleteGroup}
    onclose={() => (deletingGroup = null)}
  />
{/if}

<style>
  .hb h3 {
    margin: 14px 0 6px;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .hint,
  .sub {
    margin: 0 0 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hb-gh {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .hb-gh h3 {
    flex: 1;
    min-width: 0;
  }
  .hb-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .hb-list > li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .hb-list > li.off {
    opacity: 0.6;
  }
  .hb-grow {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .em {
    margin-right: 0.4em;
  }
  @media (max-width: 719px) {
    .hb-list > li {
      flex-wrap: wrap;
    }
    .hb-grow {
      flex: 1 1 calc(100% - 72px);
    }
  }
  .hb-grow small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .hb-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .hb-x:hover {
    background: var(--paper-2);
  }
</style>
