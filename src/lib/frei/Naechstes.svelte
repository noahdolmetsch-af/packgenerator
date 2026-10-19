<script>
  /**
   * Paket T «Freie Zeit» › Fürs nächste Mal (ideas 28, 29). Reads every finished debrief and sorts your
   * gear into three piles: proven (packed again and again, always used), just came along (marked «not
   * used») and missing (named under «What was missing?»). One tap turns a thing into a note for the next
   * packing list, with a reason if you like; a note can become a to-do. Notes change and delete.
   */
  import { Repeat, Check, Pencil, ListTodo, ChevronRight } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from './FreiSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { addTodo } from '../merkendb.js';
  import { rowsQuery, putRow, deleteRow, restoreRow } from '../freidb.js';
  import { nextPiles, PILES, marksByKey, markLine } from '../frei.js';
  import { localDay } from '../localday.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const marksQ = rowsQuery('mark');
  const marks = $derived($marksQ ?? []);
  const byKey = $derived(marksByKey(marks));
  const loaded = $derived($tripsQ !== undefined && $debriefsQ !== undefined && $itemsQ !== undefined);
  const doneCount = $derived(($debriefsQ ?? []).filter((d) => d?.status === 'done').length);
  const piles = $derived.by(() => {
    const items = $itemsQ ?? [];
    const nameOfId = (id) => nameOf(items.find((i) => i.id === id)) || t('A deleted item');
    return nextPiles({ trips: $tripsQ ?? [], debriefs: $debriefsQ ?? [], nameOf: nameOfId });
  });
  const lineOf = (m) => t(markLine(m.pile), { name: m.name });

  let edit = $state(null); // { row?, key, name, pile, reason }
  const openMark = (pile, x) => (edit = byKey[x.key] ? { row: byKey[x.key], ...byKey[x.key], reason: byKey[x.key].reason ?? '' } : { row: null, key: x.key, name: x.name, pile, reason: '' });
  async function saveMark() {
    await putRow({ ...(edit.row ?? { kind: 'mark', day: localDay() }), key: edit.key, name: edit.name, pile: edit.pile, reason: edit.reason.trim() });
    if (!edit.row) offerDone(t('Noted for the next packing list.'));
  }
  async function removeMark() {
    const r = edit.row;
    const answer = await askDelete({ title: t('Delete this note?'), lines: [lineOf(r)] });
    if (answer !== 'delete') return false;
    await deleteWithUndo({ run: () => deleteRow(r.id), undo: (rec) => restoreRow(rec), text: t('Note deleted.'), name: r.name });
  }
  async function toTodo(m) {
    const r = await addTodo(db, { text: lineOf(m) });
    if (r) offerDone(t('Added to your to-dos.'), r.undo);
  }
</script>

<div class="fz" data-page="naechstes">
  <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: '#/me/frei', label: t('Free time') }]} here={t('For next time')} />
  <h1 class="fz-h1" tabindex="-1" data-page-title>{t('For next time')}</h1>
  <p class="fz-intro">{t('What your debriefs know about your packing. Your gear has been taking notes, and it has opinions.')}</p>

  {#if marks.length}
    <section class="fz-box fz-soft" aria-labelledby="fzx-marks-h" data-marks>
      <h2 id="fzx-marks-h" class="fz-h2"><Check size={18} aria-hidden="true" /> {t('For the next packing list')}</h2>
      <ul class="fz-list">
        {#each marks as m (m.id)}
          <li class="fz-row" data-mark={m.key}>
            <button type="button" class="fz-row-main" onclick={() => (edit = { row: m, ...m, reason: m.reason ?? '' })}><b>{lineOf(m)}</b>{#if m.reason}<small>{m.reason}</small>{/if}</button>
            <button type="button" class="fz-icon" aria-label={t('Add «{name}» to your to-dos', { name: lineOf(m) })} onclick={() => toTodo(m)} data-mark-todo><ListTodo size={18} aria-hidden="true" /></button>
            <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: m.name })} onclick={() => (edit = { row: m, ...m, reason: m.reason ?? '' })}><Pencil size={18} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if loaded}
    {#if doneCount < 2}
      <section class="fz-box" data-next-empty>
        <h2 class="fz-h2"><Repeat size={18} aria-hidden="true" /> {t('Still collecting')}</h2>
        <p class="fz-text">{tn(doneCount, 'You have finished {n} debrief so far. From two on, the piles get interesting.', 'You have finished {n} debriefs so far. From two on, the piles get interesting.')}</p>
        <a class="btn" href="#/trips">{t('To the trips')}<ChevronRight size={16} aria-hidden="true" /></a>
      </section>
    {/if}
    <div class="fz-grid three">
      {#each PILES as p (p.key)}
        {@const list = piles[p.key]}
        <section class="fz-box" aria-labelledby="fzx-{p.key}-h" data-pile={p.key}>
          <h2 id="fzx-{p.key}-h" class="fz-h2">{t(p.name)} <span class="fz-note">{list.length}</span></h2>
          <p class="fz-note">{t(p.hint)}</p>
          {#if !list.length}<p class="fz-empty">{t('Nothing here yet.')}</p>{/if}
          <ul class="fz-list">
            {#each list.slice(0, 30) as x (x.key)}
              <li class="fz-row">
                <span class="fz-row-main"><b>{x.name}</b><small>{p.key === 'proven' ? tn(x.n, 'on {n} trip', 'on {n} trips') : tn(x.n, '{n} time', '{n} times')}</small></span>
                {#if byKey[x.key]}
                  <button type="button" class="btn sm" onclick={() => openMark(p.key, x)}><Check size={16} aria-hidden="true" />{t('Noted')}</button>
                {:else}
                  <button type="button" class="btn sm" onclick={() => openMark(p.key, x)} data-mark-add={x.key}>{t('Note it')}</button>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</div>

{#if edit}
  <FreiSheet title={edit.row ? t('Change note') : t('A note for next time')} sub={t(markLine(edit.pile), { name: edit.name })} onsave={saveMark} ondelete={edit.row ? removeMark : null} onclose={() => (edit = null)}>
    <label class="fz-lab">{t('What I want')}
      <select class="inp" bind:value={edit.pile}>
        <option value="proven">{t('Keep {name} on the list', { name: edit.name })}</option>
        <option value="unused">{t('Leave {name} at home next time', { name: edit.name })}</option>
        <option value="missing">{t('Take {name} next time', { name: edit.name })}</option>
      </select>
    </label>
    <label class="fz-lab">{t('Why (optional)')}<input class="inp" maxlength="200" bind:value={edit.reason} placeholder={t('e.g. only needed it once in three trips')} data-mark-reason /></label>
  </FreiSheet>
{/if}
