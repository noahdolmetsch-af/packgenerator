<script>
  /**
   * Paket P4 «Aktiv», mockup E4: the kept good days in Ich › Was mir gut tut, as recipes. «Am Samstag
   * wiederholen» plans one again (the morning check of that day shows it), «Kurze Version» shows only the
   * first part, change and delete (with Undo). Rules: lib/gutertag.js.
   */
  import { liveQuery } from 'dexie';
  import { CalendarCheck, Pencil, Trash2, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { GOOD_DAYS_KEY, goodDaysOf, renameGoodDay, dropGoodDay, planAgain, nextSaturday, shortVersion } from '../gutertag.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { dayShort, wd } from '../flow/words.js';
  import { t } from '../i18n.svelte.js';

  let { today } = $props();

  const q = liveQuery(() => db.settings.get(GOOD_DAYS_KEY));
  const list = $derived(goodDaysOf($q?.value));
  const sat = $derived(nextSaturday(today));
  const save = (value) => db.settings.put({ key: GOOD_DAYS_KEY, value: JSON.parse(JSON.stringify(value)) });
  let edit = $state(null); // { id, text }
  let short = $state({}); // id → shown short

  async function plan(d) {
    const before = $q?.value ?? [];
    const on = !!d.again && d.again >= today;
    try {
      await save(planAgain(before, d.id, on ? null : sat));
      if (!on) offerDone(t('Planned for {day}. The morning check reminds you.', { day: `${wd(sat)} ${dayShort(sat)}` }), () => save(before));
    } catch (err) {
      saveFailed(err);
    }
  }
  async function saveEdit(e) {
    e.preventDefault();
    try {
      await save(renameGoodDay($q?.value ?? [], edit.id, edit.text));
      edit = null;
    } catch (err) {
      saveFailed(err);
    }
  }
  async function del(d) {
    const name = d.text;
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only this recipe goes.') })) !== 'delete') return;
    const before = $q?.value ?? [];
    await deleteWithUndo({ run: () => save(dropGoodDay(before, d.id)), undo: () => save(before), text: t('"{name}" deleted.', { name }), name });
  }
</script>

<div class="gl" data-good-days>
  <p class="gl-sub">{t('Kept good days')}</p>
  {#each list.slice(0, 6) as d (d.id)}
    {@const sv = shortVersion(d.text)}
    <div class="gl-row" data-good-day-row={d.id}>
      {#if edit?.id === d.id}
        <form class="gl-form" onsubmit={saveEdit}>
          <input class="inp" maxlength="200" bind:value={edit.text} aria-label={t('Recipe')} data-good-day-edit />
          <button type="submit" class="btn hi sm" disabled={!edit.text.trim()}>{t('Save')}</button>
          <button type="button" class="gl-ib" aria-label={t('Cancel')} onclick={() => (edit = null)}><X size={16} aria-hidden="true" /></button>
        </form>
      {:else}
        <p class="gl-k">{t('Recipe for good days, kept on {day}', { day: dayShort(d.day) })}</p>
        <p class="gl-t"><b>{short[d.id] && sv ? sv : d.text}</b></p>
        {#if d.again}<p class="gl-k" data-good-day-again>{d.again < today ? t('was planned for {day}', { day: `${wd(d.again)} ${dayShort(d.again)}` }) : t('planned for {day}', { day: `${wd(d.again)} ${dayShort(d.again)}` })}</p>{/if}
        <span class="gl-acts">
          <button type="button" class="btn sm" aria-pressed={!!d.again && d.again >= today} onclick={() => plan(d)} data-good-day-plan><CalendarCheck size={16} aria-hidden="true" />{d.again && d.again >= today ? t('Not planned') : t('Repeat on Saturday')}</button>
          {#if sv}<button type="button" class="btn sm" aria-pressed={!!short[d.id]} onclick={() => (short = { ...short, [d.id]: !short[d.id] })} data-good-day-short>{short[d.id] ? t('Whole recipe') : t('Short version')}</button>{/if}
          <button type="button" class="gl-ib" aria-label={t('Change «{name}»', { name: d.text })} onclick={() => (edit = { id: d.id, text: d.text })}><Pencil size={16} aria-hidden="true" /></button>
          <button type="button" class="gl-ib" aria-label={t('Delete «{name}»', { name: d.text })} onclick={() => del(d)} data-good-day-del><Trash2 size={16} aria-hidden="true" /></button>
        </span>
      {/if}
    </div>
  {:else}
    <p class="gl-k">{t('None yet. At the end of the evening review, «Keep this day» saves a good day here.')}</p>
  {/each}
</div>

<style>
  .gl {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .gl-sub {
    margin: 0 0 6px;
    font-weight: 600;
  }
  .gl-row {
    padding: 8px 0;
    border-top: 1px solid var(--line);
    overflow-wrap: break-word;
  }
  .gl-row:first-of-type {
    border-top: 0;
  }
  .gl-k {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .gl-t {
    margin: 2px 0 6px;
  }
  .gl-acts,
  .gl-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .gl-form .inp {
    flex: 1 1 12em;
    min-width: 0;
    min-height: 44px;
  }
  .gl-acts .btn,
  .gl-form .btn {
    min-height: 44px;
  }
  .gl-ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
