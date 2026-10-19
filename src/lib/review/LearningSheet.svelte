<script>
  /**
   * «Alles selbst bearbeiten» (Noah 19.10.2026: «alle daten können vom nutzer selber hinzugefügt, umbenannt
   * oder gelöscht werden»): one learning, new or changed. A tap on a learning in Rückblick › Gelernt opens
   * it (app rule C b: a tap opens for editing); «+ Learning» opens it empty.
   * The rule is needed; «what to do», the topic and «important» are optional. Delete asks, then 4 s Undo.
   *
   * learning: the record, or null for a new one; topics: the topics there are (stored keys);
   * topicName(key): as shown; onclose.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import Btn from '../ui/Btn.svelte';
  import { askDelete, deleteWithUndo, saveFailed, once } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import '../bikes/velo-dlg.css';
  import '../ui/daumen.css';

  let { learning = null, topics = [], topicName = (x) => x, onclose } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !learning;
  // svelte-ignore state_referenced_locally
  let draft = $state({ rule: learning?.rule ?? '', action: learning?.action ?? '', topic: learning?.topic ? topicName(learning.topic) : '', high: learning?.priority === 'high' });
  let error = $state('');
  let dialog;
  $effect(() => {
    dialog.showModal();
  });

  /** A typed topic that reads like an existing one keeps that one's stored key (e.g. «Debrief»). */
  const topicKey = (typed) => {
    const s = typed.trim();
    if (!s) return '';
    return topics.find((k) => k === s || topicName(k).toLowerCase() === s.toLowerCase()) ?? s;
  };

  const save = once(async () => {
    error = '';
    const rule = draft.rule.trim();
    if (!rule) return (error = t('Write what you learned.'));
    const fields = { rule, action: draft.action.trim(), topic: topicKey(draft.topic), priority: draft.high ? 'high' : learning?.priority === 'high' ? 'medium' : (learning?.priority ?? 'medium') };
    try {
      if (isNew) {
        const all = await db.learnings.toArray();
        const id = Math.max(0, ...all.map((l) => (typeof l.id === 'number' ? l.id : 0))) + 1;
        await db.learnings.put({ id, ...fields, itemIds: [], source: t('Written by you'), appliesTo: ['all'], confirmed: 0, createdAt: new Date().toISOString() });
        offerDone(t('"{name}" saved.', { name: rule }), () => db.learnings.delete(id));
      } else {
        const before = await db.learnings.get(learning.id);
        await db.learnings.update(learning.id, fields);
        offerDone(t('Changes to "{name}" saved.', { name: rule }), () => before && db.learnings.put(before));
      }
    } catch (err) {
      return (error = saveFailed(err));
    }
    dialog.close();
  });

  const remove = once(async () => {
    const name = learning.rule;
    if ((await askDelete({ title: t('Delete the learning "{name}"?', { name }), text: t('It is gone from Learned and from the packing hints. You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const ok = await deleteWithUndo({
      run: async () => {
        const rec = await db.learnings.get(learning.id);
        await db.learnings.delete(learning.id);
        return rec;
      },
      undo: (rec) => rec && db.learnings.put(rec),
      text: t('"{name}" deleted.', { name }),
      name,
    });
    if (ok) dialog.close();
  });
</script>

<dialog class="sheet vdlg from-below" bind:this={dialog} use:backClose {onclose} aria-labelledby="learn-dlg-h" data-testid="learning-sheet">
  <form onsubmit={save} novalidate>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="learn-dlg-h">{isNew ? t('New learning') : t('Edit learning')}</h2>
        <p class="vd-sub">{t('Shown in Learned and as a hint when you pack.')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
    </div>
    <label class="vd-field"><span class="lbl">{t('What you learned')}</span><textarea class="inp" rows="2" bind:value={draft.rule} placeholder={t('e.g. Take a second pair of gloves')}></textarea></label>
    <label class="vd-field"><span class="lbl">{t('What to do (optional)')}</span><input class="inp" bind:value={draft.action} /></label>
    <label class="vd-field"><span class="lbl">{t('Topic (optional)')}</span><input class="inp" list="learn-topics" bind:value={draft.topic} placeholder={t('No topic')} /></label>
    <datalist id="learn-topics">{#each topics.filter(Boolean) as k (k)}<option value={topicName(k)}></option>{/each}</datalist>
    <label class="hi-row"><input type="checkbox" bind:checked={draft.high} /> {t('Important')}</label>
    <p class="err" role="alert">{error}</p>
    <div class="vd-foot daumen-foot">
      {#if !isNew}<button type="button" class="btn del" onclick={remove}>{t('Delete')}</button>{/if}
      <Btn kind="quiet" label={t('Discard')} onclick={() => dialog.close()} />
      <Btn kind="hi" type="submit" label={t('Save')} />
    </div>
  </form>
</dialog>

<style>
  .hi-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  textarea.inp {
    resize: vertical;
  }
  .err {
    color: var(--bad);
    margin: 8px 0 0;
    font-size: var(--fs-small);
  }
  .err:empty {
    display: none;
  }
  .del {
    color: var(--bad);
  }
</style>
