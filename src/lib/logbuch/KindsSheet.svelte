<script>
  /**
   * «Verbesserungs-Logbuch» L5 (Noah 22.11.2026 «1a 2a 3a 4a 5a»): the window «Arten und Gruppen». The groups and the kinds in them
   * can be renamed and deleted (the «⋯» menu) and ordered (arrows and drag), and «Back to standard» brings the first version back.
   * Deleting asks first where things go (GroupDeleteSheet, «Ohne …» preselected): the entries of a kind go to another kind or stay
   * without a kind, the kinds of a group go to another group or to «No group»; nothing is ever deleted but the name.
   * Every change can be undone (the line «Undo» inside the window). New kinds follow in the next step.
   * cfg: the list now (kinds.js); counts: { [artKey]: entries }; onsave(cfg) keeps it (the page writes the setting);
   * ondeletekind(key, toKey) and ondeletegroup(key, toKey) do the delete and return what onrestore(snapshot) needs for Undo.
   */
  import { X, Pencil, RotateCcw, Undo2, Trash2 } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import RowMenu from '../ui/RowMenu.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
    import { backClose } from '../ui/backclose.js';
  import { t, tn } from '../i18n.svelte.js';
  import { artLabel, groupLabel } from './words.js';
  import { DEFAULT_KINDS, NAME_MAX, NO_GROUP, renameArt, renameGroup, moveArt, moveGroup, isStandard } from './kinds.js';
  import '../bikes/velo-dlg.css';

  let { cfg, counts = {}, onsave, ondeletekind, ondeletegroup, onrestore, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  let renaming = $state(null); // { kind: 'art' | 'group', key }
  let deleting = $state(null); // { kind: 'art' | 'group', key } while the question «where do they go?» is open
  const std = $derived(isStandard(cfg));

  // the window is modal, so the Undo sits inside it (the message of the page would lie behind it)
  let undo = $state(null); // { text, restore } of the last change
  async function change(next, text) {
    const before = cfg;
    await onsave(next);
    undo = { text, restore: () => onsave(before) };
  }
  async function takeBack() {
    const u = undo;
    undo = null;
    if (u) await u.restore();
  }
  const kindsIn = (key) => cfg.groups.find((g) => g.key === key)?.arts.length ?? 0;
  const what = (n) => tn(n, '{n} entry', '{n} entries');
  const whatKinds = (n) => tn(n, '{n} kind', '{n} kinds');
  async function confirmDelete(to) {
    const d = deleting;
    const name = nameOf(d);
    const snap = d.kind === 'group' ? await ondeletegroup(d.key, to) : await ondeletekind(d.key, to);
    undo = { text: t('«{name}» deleted.', { name }), restore: () => onrestore(snap) };
  }
  const nameOf = (r) => (r.kind === 'group' ? groupLabel(r.key, cfg) : artLabel(r.key, cfg));
  async function rename(name) {
    const r = renaming;
    const old = nameOf(r);
    const next = r.kind === 'group' ? renameGroup(cfg, r.key, name) : renameArt(cfg, r.key, name);
    await change(next, t('Renamed to «{name}».', { name: name.trim() || old }));
  }
  const reorder = (next) => change(next, t('Order changed.'));
  const reset = () => change(DEFAULT_KINDS, t('Back to the standard kinds and groups.'));
</script>

<dialog class="sheet vdlg kdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="kd-h" data-kinds-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="kd-h">{t('Kinds and groups')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <p class="hint">{t('A kind is what you write down (error, idea …). A group holds kinds that belong together. Rename and order them as you like; entries you already wrote keep their kind.')}</p>

  <ul class="kd-groups" use:sortable={{ onmove: (from, to) => reorder(moveGroup(cfg, from, to)) }} data-kinds-groups>
    {#each cfg.groups as g, gi (g.key)}
      <li class="kd-g" data-sort-id={g.key} data-kd-group={g.key}>
        <div class="kd-row kd-head">
          <SortGrip name={groupLabel(g.key, cfg)} onstep={(d) => reorder(moveGroup(cfg, gi, gi + d))} />
          <b class="kd-name">{groupLabel(g.key, cfg)}</b>
          <SortArrows name={groupLabel(g.key, cfg)} i={gi} n={cfg.groups.length} onstep={(d) => reorder(moveGroup(cfg, gi, gi + d))} />
          <RowMenu name={groupLabel(g.key, cfg)} items={[
            { key: 'rename', label: t('Rename'), icon: Pencil, onclick: () => (renaming = { kind: 'group', key: g.key }) },
            // «No group» cannot send its kinds to itself: it can go once it is empty
            { key: 'delete', label: t('Delete'), icon: Trash2, danger: true, sep: true, disabled: g.key === NO_GROUP && g.arts.length > 0, onclick: () => (deleting = { kind: 'group', key: g.key }) },
          ]} />
        </div>
        <ul class="kd-arts" use:sortable={{ onmove: (from, to) => reorder(moveArt(cfg, g.key, from, to)) }}>
          {#each g.arts as a, ai (a.key)}
            <li class="kd-row" data-sort-id={a.key} data-kd-art={a.key}>
              <SortGrip name={artLabel(a.key, cfg)} onstep={(d) => reorder(moveArt(cfg, g.key, ai, ai + d))} />
              <span class="kd-name">{artLabel(a.key, cfg)}<small>{counts[a.key] ? tn(counts[a.key], '{n} entry', '{n} entries') : t('No entry')}</small></span>
              <SortArrows name={artLabel(a.key, cfg)} i={ai} n={g.arts.length} onstep={(d) => reorder(moveArt(cfg, g.key, ai, ai + d))} />
              <RowMenu name={artLabel(a.key, cfg)} items={[
                { key: 'rename', label: t('Rename'), icon: Pencil, onclick: () => (renaming = { kind: 'art', key: a.key }) },
                { key: 'delete', label: t('Delete'), icon: Trash2, danger: true, sep: true, onclick: () => (deleting = { kind: 'art', key: a.key }) },
              ]} />
            </li>
          {:else}
            <li class="kd-none">{t('No kind in this group yet.')}</li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>

  {#if undo}
    <p class="kd-undo" role="status" data-kinds-undo><span>{undo.text}</span><button type="button" class="btn sm" onclick={takeBack}><Undo2 size={14} aria-hidden="true" />{t('Undo')}</button></p>
  {/if}
  <div class="vd-foot">
    <button type="button" class="btn" data-kinds-reset disabled={std} onclick={reset}><RotateCcw size={16} aria-hidden="true" />{t('Back to standard')}</button>
  </div>
</dialog>

{#if deleting}
  {#if deleting.kind === 'group'}
    <GroupDeleteSheet
      title={t('Delete «{name}»?', { name: nameOf(deleting) })}
      count={kindsIn(deleting.key)}
      what={whatKinds}
      none={t('No group')}
      noneHint={t('The kinds go to the group «No group». Your entries keep their kind.')}
      targets={cfg.groups.filter((g) => g.key !== deleting.key).map((g) => ({ id: g.key, name: groupLabel(g.key, cfg) }))}
      empty={t('No kind in this group.')}
      onconfirm={confirmDelete}
      onclose={() => (deleting = null)}
    />
  {:else}
    <GroupDeleteSheet
      title={t('Delete «{name}»?', { name: nameOf(deleting) })}
      count={counts[deleting.key] ?? 0}
      {what}
      none={t('No kind')}
      noneHint={t('The entries stay, without a kind. You can give them one later.')}
      targets={cfg.groups.flatMap((g) => g.arts).filter((a) => a.key !== deleting.key).map((a) => ({ id: a.key, name: artLabel(a.key, cfg) }))}
      empty={t('No entry has this kind.')}
      onconfirm={confirmDelete}
      onclose={() => (deleting = null)}
    />
  {/if}
{/if}
{#if renaming}
  <RenameSheet
    kicker={renaming.kind === 'group' ? t('Group|logbuch') : t('Kind|logbuch')}
    title={t('Rename «{name}»', { name: nameOf(renaming) })}
    value={nameOf(renaming)}
    max={NAME_MAX}
    empty={t('An empty name brings the standard word back.')}
    onsave={rename}
    onclose={() => (renaming = null)}
  />
{/if}

<style>
  .hint {
    margin: 8px 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .kd-g {
    margin-bottom: 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .kd-arts {
    padding: 0 0 4px 22px;
  }
  .kd-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .kd-head {
    padding: 0 4px;
    border-bottom: 1px solid var(--line);
  }
  .kd-name {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
  }
  .kd-name small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .kd-undo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 8px 0 0;
    padding: 6px 6px 6px 12px;
    border-radius: 10px;
    background: var(--improve-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .kd-none {
    padding: 10px 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
