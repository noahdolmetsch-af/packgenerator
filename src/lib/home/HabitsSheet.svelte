<script>
  /**
   * «Which habits on top?» (Noah 27.10.2026 «1a 2a und b 3b»): the window behind the pencil on the habit
   * card and behind «Choose habits on top» under «Customise the start page» (1a). Up to three (3b), from
   * the activities of Aktiv (2a) and the items of «Das tut mir gut» (2b). The chosen ones in their order,
   * moved with the arrows or drag, «✕» takes one away. Every change is saved at once; closing offers
   * Undo for the whole change. New activities and items are made on their pages (links at the end).
   */
  import { X, Plus, Heart } from '@lucide/svelte';
  import { db } from '../db.js';
  import { backClose } from '../ui/backclose.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import ActIcon from '../flow/ActIcon.svelte';
  import { flowQuery } from '../flow/data.svelte.js';
  import { actName } from '../flow/ui.svelte.js';
  import { isMedAct } from '../flow/hobby/medstart.js';
  import { routineQuery } from '../routine-data.js';
  import { itemName } from '../routine-words.js';
  import { HABITS_KEY, MAX_HABITS, refKey, habitsOf, addHabit, removeHabit, moveHabit } from './habits.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { today, cfg = null, onclose } = $props();

  const fq = $derived(flowQuery(today));
  const rq = $derived(routineQuery(today));
  const acts = $derived(($fq?.acts ?? []).filter((a) => !a.paused));
  const items = $derived($rq?.routine.items ?? []);
  const chosen = $derived(habitsOf(cfg, acts, items, isMedAct));
  const keys = $derived(new Set(chosen.map(refKey)));
  const full = $derived(chosen.length >= MAX_HABITS);
  const nameOf = (r) => (r.kind === 'act' ? actName(acts.find((a) => a.id === r.id)) : itemName(items.find((x) => x.id === r.id)));
  const actOf = (r) => acts.find((a) => a.id === r.id);

  // svelte-ignore state_referenced_locally
  const before = cfg;
  let changed = false;
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  const save = (value) => db.settings.put({ key: HABITS_KEY, value: $state.snapshot(value) });
  function set(next) {
    changed = true;
    return save(next);
  }
  const add = (r) => !full && set(addHabit(chosen, r));
  const remove = (r) => set(removeHabit(chosen, r));
  const move = (from, to) => set(moveHabit(chosen, from, to));

  function closed() {
    if (changed) offerDone(t('Habits on top changed.'), () => db.settings.put({ key: HABITS_KEY, value: before }));
    onclose?.();
  }
</script>

<dialog class="sheet vdlg hbs" bind:this={dialog} use:backClose onclose={closed} aria-labelledby="hbs-h" data-habits-sheet>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="hbs-h">{t('Which habits on top of Today?')}</h2>
      <p class="vd-sub">{t('Up to three. Each shows your last 7 days and ticks with one tap. You can change them any time.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <h3>{t('On top, in this order')}</h3>
  {#if chosen.length}
    <ul class="rows" use:sortable={{ onmove: move }} data-habits-chosen>
      {#each chosen as r, i (refKey(r))}
        <li data-sort-id={refKey(r)} data-habit-row={refKey(r)}>
          <SortGrip name={nameOf(r)} onstep={(dir) => move(i, i + dir)} />
          <span class="nm">{nameOf(r)}</span>
          <SortArrows name={nameOf(r)} {i} n={chosen.length} onstep={(dir) => move(i, i + dir)} />
          <button type="button" class="ib" aria-label={t('Take {name} off the top', { name: nameOf(r) })} onclick={() => remove(r)} data-habit-remove><X size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="hint">{t('None chosen: the top of Today shows a short hint until you choose one.')}</p>
  {/if}
  {#if full}<p class="hint" data-habits-full>{t('Three are chosen. Take one away to choose another.')}</p>{/if}

  <h3>{t('From Aktiv')}</h3>
  <div class="opts">
    {#each acts.filter((a) => !keys.has(`act:${a.id}`)) as a (a.id)}
      <button type="button" class="opt" disabled={full} onclick={() => add({ kind: 'act', id: a.id })} data-habit-add="act:{a.id}">
        <ActIcon icon={a.icon} ring={a.ring} box={false} size={16} /><span>{actName(a)}</span><Plus size={16} aria-hidden="true" />
      </button>
    {:else}
      <p class="hint">{t('All activities are chosen or there are none yet.')}</p>
    {/each}
  </div>
  <h3>{t('From «What does me good»')}</h3>
  <div class="opts">
    {#each items.filter((x) => !keys.has(`routine:${x.id}`)) as x (x.id)}
      <button type="button" class="opt" disabled={full} onclick={() => add({ kind: 'routine', id: x.id })} data-habit-add="routine:{x.id}">
        <Heart size={16} aria-hidden="true" /><span>{itemName(x)}</span><Plus size={16} aria-hidden="true" />
      </button>
    {:else}
      <p class="hint">{t('All items are chosen or the list is empty.')}</p>
    {/each}
  </div>
  <p class="hint">{t('Something missing?')} <a href="#/flow" onclick={() => dialog.close()}>{t('New activity in Aktiv')}</a> · <a href="#/routine" onclick={() => dialog.close()}>{t('Change «What does me good»')}</a></p>

  <div class="vd-foot">
    <button type="button" class="btn hi" onclick={() => dialog.close()} data-habits-done>{t('Done|customise')}</button>
  </div>
</dialog>

<style>
  h3 {
    margin: 14px 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .nm {
    flex: 1 1 4rem;
    min-width: 0;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .ib {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .opts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .opt {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    max-width: 100%;
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .opt span {
    min-width: 0;
    overflow-wrap: break-word;
    text-align: left;
  }
  .opt:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .hint {
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
