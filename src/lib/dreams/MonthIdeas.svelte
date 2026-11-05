<script>
  /**
   * «Passt jetzt: Ideen pro Monat» (Träume und Neuland N8, Noah 27.10.2026 «1-5 a»), on Touren › Träume under
   * «Your year»: what goes well in the month (this month, or the one tapped in the band), with your own ideas.
   * «As a dream» makes a dream from an idea (its months come along). Built-in ideas can be hidden and shown
   * again; own ones added, renamed (with their months) and deleted, each with Undo. Rules in monatsideen.js.
   * month: 1–12; current: whether it is this month; onmakedream({ title, months }).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { IDEAS_KEY, ideasCfg, ideasFor, hiddenFor, addOwn, renameOwn, toggleOwnMonth, deleteOwn, hideStd } from './monatsideen.js';
  import { MONTHS } from '../dreams.js';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { deleteWithUndo } from '../ui/ask.js';
  import { offerDone, offerRename } from '../ui/rename.svelte.js';
  import { t, locale } from '../i18n.svelte.js';
  import { Lightbulb, Sparkles, Pencil, Trash2, EyeOff, Eye, Plus } from '@lucide/svelte';

  let { month, current = false, onmakedream } = $props();
  const q = liveQuery(async () => (await db.settings.get(IDEAS_KEY))?.value ?? null);
  const cfg = $derived(ideasCfg($q));
  const ideas = $derived(ideasFor(cfg, month));
  const hidden = $derived(hiddenFor(cfg, month));
  const mName = $derived(new Date(Date.UTC(2026, month - 1, 15)).toLocaleDateString(locale(), { month: 'long', timeZone: 'UTC' }));
  const save = (next) => db.settings.put({ key: IDEAS_KEY, value: JSON.parse(JSON.stringify(next)) });
  const shown = (x) => (x.own ? x.text : t(x.text)); // own words never go through t()

  let text = $state('');
  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const before = cfg;
    await save(addOwn(cfg, text, [month], `mi-${Date.now().toString(36)}`));
    offerDone(t('Idea added to {month}.', { month: mName }), () => save(before));
    text = '';
  }
  async function hide(x) {
    const before = cfg;
    await save(hideStd(cfg, x.id));
    offerDone(t('Idea hidden. «Show hidden ideas» brings it back.'), () => save(before));
  }
  async function remove(x) {
    const before = cfg;
    await deleteWithUndo({ run: () => save(deleteOwn(cfg, x.id)), undo: () => save(before), text: t('"{name}" deleted.', { name: x.text }), name: x.text });
  }
  let edit = $state(null); // the own idea being renamed
  const editing = $derived(edit ? cfg.own.find((x) => x.id === edit) : null);
  async function rename(name) {
    const before = cfg;
    await save(renameOwn(cfg, edit, name));
    offerRename(name, () => save(before));
  }
  let showHidden = $state(false);
</script>

<section class="ich-sec" aria-labelledby="mi-h" data-month-ideas={month}>
  <div class="ich-h">
    <div>
      <h2 id="mi-h">{current ? t('Fits now: ideas for {month}', { month: mName }) : t('Ideas for {month}', { month: mName })}</h2>
      <p class="ich-hs">{t('What usually goes well in this month. Add your own; everything is a suggestion.')}</p>
    </div>
  </div>
  <div class="card ich-body mi">
    <ul class="mi-list">
      {#each ideas as x (x.id)}
        <li class="mi-row" data-idea={x.id}>
          <span class="ich-ib"><Lightbulb size={18} aria-hidden="true" /></span>
          <span class="mi-t">{shown(x)}</span>
          <span class="mi-acts">
            <button type="button" class="btn sm" onclick={() => onmakedream?.({ title: shown(x), months: x.months })} data-idea-dream><Sparkles size={16} aria-hidden="true" />{t('As a dream')}</button>
            {#if x.own}
              <button type="button" class="btn icon sm" aria-label={t('Rename «{name}»', { name: x.text })} onclick={() => (edit = x.id)} data-idea-edit><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="btn icon sm" aria-label={t('Delete «{name}»', { name: x.text })} onclick={() => remove(x)} data-idea-del><Trash2 size={16} aria-hidden="true" /></button>
            {:else}
              <button type="button" class="btn icon sm" aria-label={t('Hide «{name}»', { name: shown(x) })} onclick={() => hide(x)} data-idea-hide><EyeOff size={16} aria-hidden="true" /></button>
            {/if}
          </span>
        </li>
      {/each}
    </ul>
    {#if hidden.length}
      <button type="button" class="btn btn-link" onclick={() => (showHidden = !showHidden)} data-idea-hidden>{showHidden ? t('Close') : t('Show hidden ideas ({n})', { n: hidden.length })}</button>
      {#if showHidden}
        <ul class="mi-list">
          {#each hidden as x (x.id)}
            <li class="mi-row off"><span class="mi-t">{t(x.text)}</span><button type="button" class="btn sm" onclick={() => save(hideStd(cfg, x.id, false))} data-idea-show><Eye size={16} aria-hidden="true" />{t('Show again')}</button></li>
          {/each}
        </ul>
      {/if}
    {/if}
    <form class="mi-add" onsubmit={add}>
      <label><span class="sr">{t('Own idea for {month}', { month: mName })}</span><input class="inp" type="text" maxlength="120" bind:value={text} placeholder={t('Own idea')} data-idea-new /></label>
      <button type="submit" class="btn" disabled={!text.trim()} data-idea-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
  </div>
</section>

{#if editing}
  <RenameSheet kicker={t('Idea')} title={t('Rename idea')} value={editing.text} max={120} hint={t('The months it fits:')} onsave={rename} onclose={() => (edit = null)} extra={months} />
{/if}
{#snippet months()}
  <div class="mi-months" role="group" aria-label={t('The months it fits:')}>
    {#each MONTHS as m, i (m)}
      <button type="button" class="mo" aria-pressed={editing.months.includes(i + 1)} onclick={() => save(toggleOwnMonth(cfg, editing.id, i + 1))}>{t(m)}</button>
    {/each}
  </div>
{/snippet}

<style>
  .mi {
    display: grid;
    gap: var(--sp-3);
  }
  .mi-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .mi-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
  }
  .mi-row.off {
    color: var(--ink-3);
  }
  .mi-t {
    flex: 1;
    min-width: 10em;
    overflow-wrap: break-word;
  }
  .mi-acts {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .mi-acts .btn,
  .mi-row .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .mi-add {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }
  .mi-add label {
    flex: 1;
    min-width: 0;
  }
  .mi-add .inp {
    width: 100%;
  }
  .mi-months {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .mo {
    min-width: 44px;
    min-height: 36px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
  }
  .mo[aria-pressed='true'] {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--paper);
  }
</style>
