<script>
  /**
   * «Aktiv neu» (Noah 22.10.2026, spec «Sportseite», part «Verlauf»): every tick of this sport with its date,
   * duration and place, newest first; how often this month and this year. Each entry can be changed (day,
   * minutes, place) and deleted (askDelete, then «Undo»). act: the activity; log: the whole flowLog.
   */
  import { Pencil } from '@lucide/svelte';
  import { db } from '../db.js';
  import { putEntry, removeEntry } from '../flowdb.js';
  import { goalName } from '../flow/ui.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { act, log = [], today } = $props();
  const STEP = 10;
  let shown = $state(STEP);
  let edit = $state(null);
  const list = $derived(log.filter((e) => e.actId === act.id).sort((a, b) => b.day.localeCompare(a.day) || (b.at ?? '').localeCompare(a.at ?? '')));
  const month = $derived(list.filter((e) => e.day.slice(0, 7) === today.slice(0, 7)).length);
  const year = $derived(list.filter((e) => e.day.slice(0, 4) === today.slice(0, 4)).length);
  const places = $derived((act.goals ?? []).filter((g) => goalName(g)));
  const placeOf = (e) => (e.sub ? goalName((act.goals ?? []).find((g) => g.id === e.sub)) : '');
  const dateOf = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: d.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric', timeZone: 'UTC' });
  const lineOf = (e) => [act.perTap > 1 || e.n > 1 ? `${e.n}×` : '', e.min ? t('{n} min', { n: e.min }) : '', placeOf(e), e.via === 'commute' ? t('commute') : ''].filter(Boolean).join(' · ');

  function open(e) {
    edit = { id: e.id, day: e.day, min: e.min ?? '', sub: e.sub ?? '', n: e.n ?? 1 };
  }
  async function save() {
    const e = list.find((x) => x.id === edit.id);
    if (!e || !edit.day) return;
    const next = { ...e, day: edit.day, n: Math.max(1, Math.round(Number(edit.n) || 1)) };
    const m = Math.round(Number(edit.min) || 0);
    if (m > 0) next.min = m;
    else delete next.min;
    if (edit.sub) next.sub = edit.sub;
    else delete next.sub;
    await putEntry(db, $state.snapshot(next));
    edit = null;
  }
  async function del(e) {
    const name = `${act.name} · ${dateOf(e.day)}`;
    const ok = await askDelete({ title: t('Delete the entry of {date}?', { date: dateOf(e.day) }), text: t('Only this entry goes. The sport and its other entries stay.') });
    if (!ok || ok === 'archive') return;
    edit = null;
    await deleteWithUndo({ run: async () => (await removeEntry(db, e.id), e), undo: (saved) => putEntry(db, saved), text: t('"{name}" deleted.', { name }), name });
  }
</script>

<div class="ah" data-act-history>
  <p class="cnt num" data-history-counts>
    <span><b>{month}</b> {t('this month')}</span>
    <span><b>{year}</b> {t('this year')}</span>
    <span><b>{list.length}</b> {t('in all')}</span>
  </p>
  {#if list.length}
    <ul class="hl">
      {#each list.slice(0, shown) as e (e.id)}
        <li data-entry={e.id}>
          {#if edit?.id === e.id}
            <form class="ed" onsubmit={(ev) => (ev.preventDefault(), save())}>
              <label class="fld"><span class="lbl">{t('Day')}</span><input class="inp" type="date" max={today} bind:value={edit.day} required /></label>
              <label class="fld"><span class="lbl">{t('Minutes')}</span><input class="inp" type="number" inputmode="numeric" min="0" bind:value={edit.min} placeholder="–" /></label>
              {#if act.perTap > 1}<label class="fld"><span class="lbl">{t('How many')}</span><input class="inp" type="number" inputmode="numeric" min="1" bind:value={edit.n} /></label>{/if}
              {#if places.length > 1}
                <label class="fld"><span class="lbl">{t('Where')}</span>
                  <select class="inp" bind:value={edit.sub}>
                    <option value="">–</option>
                    {#each places as g (g.id)}<option value={g.id}>{goalName(g)}</option>{/each}
                  </select>
                </label>
              {/if}
              <span class="bt">
                <button type="submit" class="btn hi" data-entry-save>{t('Save')}</button>
                <button type="button" class="btn" onclick={() => (edit = null)}>{t('Cancel')}</button>
                <button type="button" class="btn danger" onclick={() => del(e)} data-entry-delete>{t('Delete')}</button>
              </span>
            </form>
          {:else}
            <span class="d">{dateOf(e.day)}</span>
            <small class="m">{lineOf(e)}</small>
            <button type="button" class="ib" aria-label={t('Change the entry of {date}', { date: dateOf(e.day) })} onclick={() => open(e)} data-entry-edit><Pencil size={16} aria-hidden="true" /></button>
          {/if}
        </li>
      {/each}
    </ul>
    {#if list.length > shown}<button type="button" class="lnk" onclick={() => (shown += STEP * 3)} data-history-more>{tn(list.length - shown, 'Show {n} more entry', 'Show {n} more entries')}</button>{/if}
  {:else}
    <p class="none">{t('Nothing ticked yet. «Tick now» above adds the first entry.')}</p>
  {/if}
</div>

<style>
  .ah {
    display: grid;
    gap: var(--sp-3);
  }
  .cnt {
    display: flex;
    flex-wrap: wrap;
    gap: 4px var(--sp-4);
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .cnt b {
    color: var(--ink);
    font-size: var(--fs-body);
  }
  .hl {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .hl li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px var(--sp-3);
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .d {
    flex: 0 0 auto;
    font-weight: 500;
  }
  .m {
    flex: 1 1 120px;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ib {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ed {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--sp-2) var(--sp-3);
    width: 100%;
    padding: var(--sp-2) 0;
  }
  .fld {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .fld .inp {
    width: 10em;
    max-width: 100%;
  }
  .bt {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .none {
    margin: 0;
    color: var(--ink-3);
  }
</style>
