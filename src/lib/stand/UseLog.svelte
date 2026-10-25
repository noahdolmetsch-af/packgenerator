<script>
  /**
   * Paket A part 4, UC-259-I1 «Abo mit tatsächlichem Nutzen»: in the contract window, now and then a line on
   * what the contract was used for. Over the last year the cost per use shows, so the cost meets the use and
   * not only the monthly sum. edit is the window's contract (bindable); a line goes after asking, with Undo.
   */
  import { X } from '@lucide/svelte';
  import { t, tn, dateOf, locale } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { usesOf, addUse, removeUse, useYear } from './stand.js';

  let { edit = $bindable(), today } = $props();
  let what = $state('');
  const uses = $derived(usesOf(edit.uses));
  const year = $derived(useYear(edit, today));
  const money = (x) => `CHF ${new Intl.NumberFormat(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x || 0)}`;
  function add() {
    edit = addUse(edit, what, today);
    what = '';
  }
  async function drop(i, u) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: u.what }), text: t('Only this line goes. You can undo this for a few seconds.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      run: () => {
        const before = edit;
        edit = removeUse(edit, i);
        return before;
      },
      undo: (before) => (edit = before),
      text: t('"{name}" deleted.', { name: u.what }),
      name: u.what,
    });
  }
</script>

<fieldset class="ul" data-use-log>
  <legend class="fz-lab">{t('Used for')}</legend>
  <p class="hint">{year.n ? (year.perUse ? tn(year.n, 'Used {n} time in the last year: {sum} per use.', 'Used {n} times in the last year: {sum} per use.', { sum: money(year.perUse) }) : tn(year.n, 'Used {n} time in the last year.', 'Used {n} times in the last year.')) : t('Note now and then what you used it for. Then you see the cost next to the use.')}</p>
  <div class="row">
    <input class="inp" maxlength="80" bind:value={what} placeholder={t('e.g. Film on Sunday')} aria-label={t('What you used it for')} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} data-use-what />
    <button type="button" class="btn" onclick={add} disabled={!what.trim()} data-use-add>{t('Add')}</button>
  </div>
  {#if uses.length}
    <ul class="list">
      {#each uses.slice(0, 5) as u, i (u.day + u.what + i)}
        <li data-use={u.what}><span><small>{dateOf(u.day)}</small> {u.what}</span><button type="button" class="x" aria-label={t('Delete «{name}»', { name: u.what })} onclick={() => drop(i, u)}><X size={16} aria-hidden="true" /></button></li>
      {/each}
    </ul>
  {/if}
</fieldset>

<style>
  .ul {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  .row .inp {
    flex: 1 1 auto;
    min-width: 0;
  }
  .list {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
    overflow-wrap: break-word;
  }
  .list small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .hint {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
