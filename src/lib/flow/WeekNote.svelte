<script>
  /**
   * «Meine Notiz und mein Wochenziel» (Noah 01.11.2026 «5c»): a note of your own for the shown week and a goal you set
   * yourself, for this week or for the next one. Everything is a suggestion: free text, changeable, removable with
   * Undo. Stored in db.settings 'weeknotes' (in backups, on this device and synced like other settings).
   * Rules: lib/weekmore.js.
   */
  import { liveQuery } from 'dexie';
  import { Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { shiftDay, isoWeek } from '../training.js';
  import { NOTES_KEY, noteOf, putNote } from '../weekmore.js';
  import { deleteWithUndo } from '../ui/ask.js';
  import { t } from '../i18n.svelte.js';

  let { monday } = $props();
  const q = liveQuery(() => db.settings.get(NOTES_KEY));
  const rec = $derived($q?.value ?? null);
  const cur = $derived(noteOf(rec, monday));
  const nextMonday = $derived(shiftDay(monday, 7));
  const next = $derived(noteOf(rec, nextMonday));

  const write = (value) => db.settings.put({ key: NOTES_KEY, value });
  const save = (week, change) => write(putNote(rec, week, change));
  /** Remove a text and offer Undo: the whole record is put back as it was. */
  const remove = (week, change, text, name) => deleteWithUndo({ run: async () => { const before = rec; await write(putNote(rec, week, change)); return before; }, undo: (before) => (before ? write(before) : db.settings.delete(NOTES_KEY)), text, name });
  const val = (e) => e.currentTarget.value;
</script>

<section class="card wn" data-wr="note" aria-labelledby="wr-note">
  <h2 id="wr-note">{t('My note and my goal')}</h2>

  {#if cur.goal}
    <div class="goal" data-wn-goal>
      <label class="done"><input type="checkbox" checked={cur.goalDone} onchange={(e) => save(monday, { goalDone: e.currentTarget.checked })} data-wn-done /> <span>{t('Goal for this week')}: <b>{cur.goal}</b></span></label>
      <button type="button" class="tp-link" onclick={() => remove(monday, { goal: '' }, t('Goal removed.'), cur.goal)} data-wn-goal-del><Trash2 size={14} aria-hidden="true" />{t('Remove goal')}</button>
    </div>
  {/if}

  <label class="f">
    <span class="fl">{t('Note for this week')}</span>
    <textarea rows="3" maxlength="600" placeholder={t('What was, what you noticed…')} value={cur.note} onchange={(e) => save(monday, { note: val(e) })} data-wn-note></textarea>
  </label>
  {#if cur.note}<button type="button" class="tp-link del" onclick={() => remove(monday, { note: '' }, t('Note deleted.'), t('Note for this week'))} data-wn-note-del><Trash2 size={14} aria-hidden="true" />{t('Delete note')}</button>{/if}

  <label class="f">
    <span class="fl">{t('Goal for next week (week {kw})', { kw: isoWeek(nextMonday) })}</span>
    <input type="text" maxlength="600" placeholder={t('e.g. two rides, one of them long')} value={next.goal} onchange={(e) => save(nextMonday, { goal: val(e) })} data-wn-next />
  </label>
  {#if next.goal}<button type="button" class="tp-link del" onclick={() => remove(nextMonday, { goal: '' }, t('Goal removed.'), next.goal)} data-wn-next-del><Trash2 size={14} aria-hidden="true" />{t('Remove goal')}</button>{/if}

  <p class="cap">{t('Only for you: nothing is sent. You can change or remove both at any time.')}</p>
</section>

<style>
  .wn {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
    margin: 0;
    padding: var(--sp-4);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .f {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .fl,
  .cap {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .cap {
    margin: 0;
  }
  textarea,
  input[type='text'] {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .goal {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    padding: var(--sp-3);
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .done {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .done input {
    width: 22px;
    height: 22px;
  }
  .tp-link {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 4px;
    min-height: 44px;
    font-size: var(--fs-small);
  }
</style>
