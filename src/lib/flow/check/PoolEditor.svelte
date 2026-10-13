<script>
  /**
   * v0.124.0 «Tages-Check» 1: the rotating questions (question 4) edited on the morning page; before
   * they were edited in the daily-check window (v0.51.0), which the page replaces. Each one is a
   * suggestion: change the words, remove one, add your own. At least one stays.
   */
  import { untrack } from 'svelte';
  import { Plus, Trash2 } from '@lucide/svelte';
  import { db } from '../../db.js';
  import { qText } from '../ui.svelte.js';
  import { saveQuestions } from '../../flowdb.js';
  import { t } from '../../i18n.svelte.js';

  let { pool = [], onclose } = $props();
  let draft = $state(untrack(() => pool.map((p) => ({ ...p, text: qText(p) }))));

  async function save() {
    const clean = draft
      .map((p) => {
        const orig = pool.find((o) => o.id === p.id);
        if (orig && p.text === qText(orig)) return orig;
        const { textDe, ...rest } = p;
        void textDe;
        return { ...rest, text: p.text.trim() };
      })
      .filter((p) => p.text.trim());
    if (clean.length) await saveQuestions(db, clean);
    onclose();
  }
</script>

<section class="pool" aria-labelledby="pool-h" data-pool>
  <h3 id="pool-h">{t('Rotating questions')} <span class="n num">{draft.length}</span></h3>
  <p class="hint">{t('Question 4 takes one of these each day, in turn.')}</p>
  <ol class="ed">
    {#each draft as p, i (p.id)}
      <li>
        <input class="inp qi" type="text" bind:value={p.text} aria-label={t('Question {n}', { n: i + 1 })} />
        <button type="button" class="ic" onclick={() => (draft = draft.filter((x) => x.id !== p.id))} aria-label={t('Remove question {n}', { n: i + 1 })} disabled={draft.length < 2}><Trash2 size={18} aria-hidden="true" /></button>
      </li>
    {/each}
  </ol>
  <button type="button" class="lk" onclick={() => (draft = [...draft, { id: `q-${Date.now().toString(36)}`, text: '', lo: '', hi: '' }])}><Plus size={16} aria-hidden="true" />{t('Question')}</button>
  <div class="acts">
    <button type="button" class="btn" onclick={onclose}>{t('Cancel')}</button>
    <button type="button" class="btn" onclick={save} data-pool-save>{t('Save')}</button>
  </div>
</section>

<style>
  .pool {
    padding: var(--sp-3) var(--sp-4);
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  h3 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .n {
    color: var(--ink-3);
    font-weight: 400;
  }
  .hint {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ed {
    margin: var(--sp-1) 0 0;
    padding: 0;
    list-style: none;
  }
  .ed li {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
  }
  .qi {
    flex: 1;
    min-width: 0;
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .ic:disabled {
    opacity: 0.4;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sp-2);
  }
</style>
