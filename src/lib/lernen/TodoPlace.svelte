<script>
  /**
   * Paket M #88: where «Als To-do» puts a note on the way: a new checklist of this trip in Notizen, one of
   * your notes, or a Google Tasks list. The choice is remembered (settings 'notizTodo').
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { agenda } from '../agenda/client.svelte.js';
  import { TODO_KEY, todoConfig, todoTargets, pickTarget } from './notiztodo.js';

  let { tripId } = $props();
  const cfgQ = liveQuery(() => db.settings.get(TODO_KEY).then((r) => r ?? null));
  const notesQ = liveQuery(() => db.notes.where('status').equals('kept').toArray());
  const cfg = $derived(todoConfig($cfgQ?.value));
  const targets = $derived(todoTargets({ notes: $notesQ ?? [], prefs: agenda.prefs, tripId }));
  const cur = $derived(pickTarget(targets, cfg.target));
  const set = (key) => db.settings.put({ key: TODO_KEY, value: { ...cfg, target: key } });
</script>

<label class="tdp" data-todo-place>
  <span>{t('To-dos go to')}</span>
  <select class="inp" value={cur} onchange={(e) => set(e.currentTarget.value)}>
    {#each targets as x (x.key)}
      <option value={x.key}>{x.own ? (x.group === 'gtask' ? `Google Tasks · ${x.name}` : `${t('Note|place')} · ${x.name}`) : t(x.name)}</option>
    {/each}
  </select>
</label>

<style>
  .tdp {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 10px 0 0;
    font-size: var(--fs-small, 0.9rem);
  }
  .tdp select {
    flex: 1;
    min-width: 12rem;
  }
</style>
