<script>
  /**
   * Paket M #88: «Als To-do» on one note on the way. It goes to the place chosen in TodoPlace.svelte;
   * afterwards the button says where it went (a second tap is not needed).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { agenda, saveTask } from '../agenda/client.svelte.js';
  import { TODO_KEY, todoConfig, todoTargets, pickTarget, sendTodo } from './notiztodo.js';
  import { ListPlus, Check } from '@lucide/svelte';

  let { note, trip } = $props();
  const cfgQ = liveQuery(() => db.settings.get(TODO_KEY).then((r) => r ?? null));
  const cfg = $derived(todoConfig($cfgQ?.value));
  const sent = $derived(cfg.sent[note.key] ?? null);
  let busy = $state(false);
  let failed = $state(false);

  async function go() {
    if (busy) return;
    busy = true;
    failed = false;
    try {
      const notes = await db.notes.where('status').equals('kept').toArray();
      const target = pickTarget(todoTargets({ notes, prefs: agenda.prefs, tripId: trip.id }), cfg.target);
      const ok = await sendTodo(target, note.text, { db, saveTask, tripId: trip.id, title: t('To-dos after «{trip}»', { trip: trip.title || t('the trip') }) });
      if (!ok) failed = true;
      else {
        const fresh = todoConfig((await db.settings.get(TODO_KEY))?.value);
        await db.settings.put({ key: TODO_KEY, value: { ...fresh, sent: { ...fresh.sent, [note.key]: { target, at: new Date().toISOString() } } } });
      }
    } catch {
      failed = true;
    } finally {
      busy = false;
    }
  }
</script>

{#if sent}
  <span class="tdb done" data-todo-sent><Check size={15} aria-hidden="true" />{t('To-do')}</span>
{:else}
  <button type="button" class="btn k tdb" disabled={busy} onclick={go} aria-label={t('«{text}» as a to-do', { text: note.text })} data-todo-btn><ListPlus size={16} aria-hidden="true" /><span class="kl">{failed ? t('Try again') : t('As to-do')}</span></button>
{/if}

<style>
  .tdb {
    flex: none;
  }
  .tdb.done {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small, 0.9rem);
  }
</style>
