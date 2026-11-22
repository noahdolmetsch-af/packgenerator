<script>
  /**
   * «Abenteuer-Würfel» (Träume und Neuland N19, Noah 27.10.2026 «1-5 a»), on Touren › Träume: «Roll» gives a small
   * game rule for the next ride; it stays until the next roll. Under «Rules» the built-in ones can be hidden and
   * shown again, your own ones added, renamed and deleted, each with Undo. Rules in wuerfel.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { DICE_KEY, diceCfg, rulesOf, hiddenRules, roll, lastRule, addRule, renameRule, deleteRule, hideRule } from './wuerfel.js';
  import { localDay } from '../localday.js';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { deleteWithUndo } from '../ui/ask.js';
  import { offerDone, offerRename } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';
  import { Dices, Pencil, Trash2, EyeOff, Eye, Plus } from '@lucide/svelte';

  const q = liveQuery(async () => (await db.settings.get(DICE_KEY))?.value ?? null);
  const cfg = $derived(diceCfg($q));
  const rules = $derived(rulesOf(cfg));
  const hidden = $derived(hiddenRules(cfg));
  const last = $derived(lastRule(cfg));
  const save = (next) => db.settings.put({ key: DICE_KEY, value: JSON.parse(JSON.stringify(next)) });
  const shown = (r) => (r.own ? r.text : t(r.text)); // own words never go through t()

  let open = $state(false);
  let text = $state('');
  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const before = cfg;
    await save(addRule(cfg, text, `dr-${Date.now().toString(36)}`));
    offerDone(t('Rule added.'), () => save(before));
    text = '';
  }
  async function hide(r) {
    const before = cfg;
    await save(hideRule(cfg, r.id));
    offerDone(t('Rule hidden. «Show hidden rules» brings it back.'), () => save(before));
  }
  async function remove(r) {
    const before = cfg;
    await deleteWithUndo({ run: () => save(deleteRule(cfg, r.id)), undo: () => save(before), text: t('"{name}" deleted.', { name: r.text }), name: r.text });
  }
  let edit = $state(null);
  const editing = $derived(edit ? cfg.own.find((r) => r.id === edit) : null);
  async function rename(name) {
    const before = cfg;
    await save(renameRule(cfg, edit, name));
    offerRename(name, () => save(before));
  }
  let showHidden = $state(false);
</script>

<section class="ich-sec" aria-labelledby="dc-h" data-dice>
  <div class="ich-h">
    <div>
      <h2 id="dc-h">{t('Adventure dice')}</h2>
      <p class="ich-hs">{t('A small game rule for your next ride. Only for fun.')}</p>
    </div>
  </div>
  <div class="card ich-body dc">
    <div class="dc-top">
      {#if last}
        <p class="dc-rule" data-dice-rule={last.id} aria-live="polite"><b>{shown(last)}</b></p>
      {:else}
        <p class="ich-help">{t('Roll for a rule.')}</p>
      {/if}
      <button type="button" class="btn hi" disabled={!rules.length} onclick={() => save(roll(cfg, localDay()))} data-dice-roll><Dices size={18} aria-hidden="true" />{last ? t('Roll again') : t('Roll')}</button>
    </div>

    <button type="button" class="btn btn-link" aria-expanded={open} onclick={() => (open = !open)} data-dice-rules>{open ? t('Close') : t('Rules ({n})', { n: rules.length })}</button>
    {#if open}
      <ul class="dc-list">
        {#each rules as r (r.id)}
          <li class="dc-row" data-dice-item={r.id}>
            <span class="dc-t">{shown(r)}</span>
            {#if r.own}
              <button type="button" class="btn icon sm" aria-label={t('Rename «{name}»', { name: r.text })} onclick={() => (edit = r.id)} data-dice-edit><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="btn icon sm" aria-label={t('Delete «{name}»', { name: r.text })} onclick={() => remove(r)} data-dice-del><Trash2 size={16} aria-hidden="true" /></button>
            {:else}
              <button type="button" class="btn icon sm" aria-label={t('Hide «{name}»', { name: shown(r) })} onclick={() => hide(r)} data-dice-hide><EyeOff size={16} aria-hidden="true" /></button>
            {/if}
          </li>
        {/each}
      </ul>
      {#if hidden.length}
        <button type="button" class="btn btn-link" onclick={() => (showHidden = !showHidden)} data-dice-hidden>{showHidden ? t('Close') : t('Show hidden rules ({n})', { n: hidden.length })}</button>
        {#if showHidden}
          <ul class="dc-list">
            {#each hidden as r (r.id)}
              <li class="dc-row off"><span class="dc-t">{t(r.text)}</span><button type="button" class="btn sm" onclick={() => save(hideRule(cfg, r.id, false))} data-dice-show><Eye size={16} aria-hidden="true" />{t('Show again')}</button></li>
            {/each}
          </ul>
        {/if}
      {/if}
      <form class="dc-add" onsubmit={add}>
        <label><span class="sr">{t('Own rule')}</span><input class="inp" type="text" maxlength="120" bind:value={text} placeholder={t('Own rule, e.g. «Only bridges»')} data-dice-new /></label>
        <button type="submit" class="btn" disabled={!text.trim()} data-dice-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
      </form>
    {/if}
  </div>
</section>

{#if editing}
  <RenameSheet kicker={t('Rule')} title={t('Rename rule')} value={editing.text} max={120} onsave={rename} onclose={() => (edit = null)} />
{/if}

<style>
  .dc {
    display: grid;
    gap: var(--sp-3);
  }
  .dc-top {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
    justify-content: space-between;
  }
  .dc-rule {
    flex: 1;
    min-width: 12em;
    margin: 0;
    font-size: var(--fs-sub);
    overflow-wrap: break-word;
  }
  .dc-top .btn,
  .dc-row .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .dc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .dc-row {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }
  .dc-row.off {
    color: var(--ink-3);
  }
  .dc-t {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .dc-add {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }
  .dc-add label {
    flex: 1;
    min-width: 0;
  }
  .dc-add .inp {
    width: 100%;
  }
</style>
