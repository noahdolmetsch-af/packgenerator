<script>
  /**
   * Paket V «Alltag» › Lange nicht gesehen (#/me/alltag/menschen, liste.json 1115, Noah «5a»): people the
   * user enters, each with a wish interval («every 2 months») and the day they last met. When it is time
   * again, a quiet to-do shows in Kalender › Merken (no alarm, nothing on Heute). One switch turns all of it
   * off, one per person. «Seen today» starts the interval again. Add, change, sort (arrows and drag),
   * delete (asks, then Undo). Only on this device and in the backup.
   */
  import { Plus, Pencil, Check } from '@lucide/svelte';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from '../frei/FreiSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { alltagQuery, change, restore, KEYS } from '../alltagdb.js';
  import { newPerson, dueOf, isDue, seenToday, daysUntil, EVERY_UNITS, uid, ALLTAG_HASH } from '../alltag.js';
  import { localDay } from '../localday.js';
  import { phone } from '../media.svelte.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  const today = localDay();
  const q = alltagQuery();
  const list = $derived($q?.people ?? []);
  const on = $derived($q?.prefs?.peopleOn !== false);
  const dueN = $derived(list.filter((p) => !p.off && isDue(p, today)).length);
  const fmtDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  const save = (fn) => change(KEYS.people, [], fn);
  const everyLabel = (p) => (p.unit === 'week' ? tn(p.n, 'Every week', 'Every {n} weeks') : tn(p.n, 'Every month', 'Every {n} months'));

  function line(p) {
    const parts = [everyLabel(p)];
    parts.push(p.seen ? t('last seen {day}', { day: fmtDay(p.seen) }) : t('not seen yet'));
    if (p.off) parts.push(t('no reminder'));
    else if (isDue(p, today)) parts.push(t('time to get in touch'));
    else parts.push(tn(daysUntil(dueOf(p, today), today), 'again in {n} day', 'again in {n} days'));
    return parts.join(' · ');
  }

  const setOn = (v) => change(KEYS.prefs, {}, (pr) => ({ ...pr, peopleOn: v }));
  async function seen(p) {
    const before = await save((all) => all.map((x) => (x.id === p.id ? seenToday(x, today) : x)));
    offerDone(t('Nice. {name}: next reminder {day}.', { name: p.name, day: fmtDay(dueOf(seenToday(p, today), today)) }), () => restore(KEYS.people, before));
  }

  let edit = $state(null);
  const openNew = () => (edit = { id: null, name: '', n: 2, unit: 'month', seen: '', off: false, note: '' });
  const openEdit = (p) => (edit = { ...p, seen: p.seen ?? '' });
  async function saveEdit() {
    const rec = newPerson(edit, edit.id ?? uid('pe'));
    if (!rec) return t('Please give it a name.');
    try {
      await save((all) => (all.some((x) => x.id === rec.id) ? all.map((x) => (x.id === rec.id ? rec : x)) : [...all, rec]));
    } catch (err) {
      return saveFailed(err);
    }
    offerDone(t('Saved.'));
  }
  async function removeEdit() {
    const p = edit;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: p.name }), text: t('The name and its reminder go. You can undo this for a few seconds.') });
    if (answer !== 'delete') return false;
    await deleteWithUndo({ run: () => save((all) => all.filter((x) => x.id !== p.id)), undo: (before) => restore(KEYS.people, before), text: t('"{name}" deleted.', { name: p.name }), name: p.name });
  }
  function reorder(id, to) {
    return save((all) => {
      const next = [...all];
      const [x] = next.splice(next.findIndex((p) => p.id === id), 1);
      next.splice(to, 0, x);
      return next;
    });
  }
  const step = (id, dir) => {
    const i = list.findIndex((p) => p.id === id);
    const to = Math.min(Math.max(i + dir, 0), list.length - 1);
    return to === i ? null : reorder(id, to);
  };
</script>

<div class="fz" data-page="menschen">
  <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: ALLTAG_HASH, label: t('Everyday life') }]} here={t('Not seen for a while')} />
  <h1 class="fz-h1" tabindex="-1" data-page-title>{t('Not seen for a while')}</h1>
  <p class="fz-intro">{t('People you want to see now and then. When it is time again, a quiet to-do shows in Calendar › Remember: no alarm, nothing on Today.')}</p>

  <label class="fz-box al-switch">
    <input type="checkbox" checked={on} onchange={(e) => setOn(e.currentTarget.checked)} data-people-switch />
    <span><b>{t('Remind me quietly')}</b><small class="fz-note">{on ? (dueN ? tn(dueN, '{n} person is due now.', '{n} people are due now.') : t('Nobody is due right now.')) : t('Off: the list stays, no to-dos.')}</small></span>
  </label>

  <div class="fz-acts"><button type="button" class="btn hi" onclick={openNew} data-people-new><Plus size={16} aria-hidden="true" />{t('Add a person')}</button></div>

  {#if !list.length}
    <p class="fz-empty">{t('Nobody here yet. Add someone you would like to see more often, for example a friend from school.')}</p>
  {:else}
    <ul class="fz-box fz-list" use:sortable={{ onmove: (from, to) => reorder(list[from].id, to) }} aria-label={t('Not seen for a while')}>
      {#each list as p, n (p.id)}
        <li class="fz-row" data-sort-id={p.id} data-person={p.name} data-due={!p.off && isDue(p, today) ? '1' : null}>
          <SortGrip name={p.name} onstep={(dir) => step(p.id, dir)} />
          <span class="fz-row-main"><b>{p.name}</b><small class:al-due={!p.off && isDue(p, today)}>{line(p)}</small>{#if p.note}<small>{p.note}</small>{/if}</span>
          <button type="button" class="btn sm" onclick={() => seen(p)} data-person-seen><Check size={16} aria-hidden="true" />{t('Seen today')}</button>
          {#if !phone.matches}<SortArrows name={p.name} i={n} n={list.length} onstep={(dir) => step(p.id, dir)} />{/if}
          <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: p.name })} onclick={() => openEdit(p)} data-person-edit><Pencil size={18} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#if edit}
  <FreiSheet title={edit.id ? t('Change person') : t('Add a person')} sub={t('Not seen for a while')} onsave={saveEdit} ondelete={edit.id ? removeEdit : null} onclose={() => (edit = null)}>
    <label class="fz-lab">{t('Name')}<input class="inp" maxlength="60" bind:value={edit.name} data-field="name" /></label>
    <div class="al-two">
      <label class="fz-lab">{t('Every')}<input class="inp" type="number" min="1" max="52" bind:value={edit.n} data-field="n" /></label>
      <label class="fz-lab">&nbsp;
        <select class="inp" bind:value={edit.unit} aria-label={t('Weeks or months')} data-field="unit">{#each EVERY_UNITS as u (u)}<option value={u}>{u === 'week' ? t('weeks') : t('months')}</option>{/each}</select>
      </label>
    </div>
    <label class="fz-lab">{t('Last seen')}<input class="inp" type="date" max={today} bind:value={edit.seen} data-field="seen" /></label>
    <label class="al-check"><input type="checkbox" bind:checked={edit.off} data-field="off" /><span>{t('No reminder for this person')}</span></label>
    <label class="fz-lab">{t('Note')}<input class="inp" maxlength="300" bind:value={edit.note} placeholder={t('e.g. likes coffee at the lake')} /></label>
  </FreiSheet>
{/if}

<style>
  .al-due {
    color: var(--accent);
    font-weight: 600;
  }
  .al-switch {
    flex-direction: row;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
  }
  .al-switch input,
  .al-check input {
    width: 22px;
    height: 22px;
    margin-top: 2px;
    accent-color: var(--accent);
  }
  .al-switch span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .al-two {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .al-two > * {
    flex: 1 1 120px;
  }
  .al-check {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
  }
</style>
