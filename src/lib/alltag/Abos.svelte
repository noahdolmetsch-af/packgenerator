<script>
  /**
   * Paket V «Alltag» › Verträge und Abos (#/me/alltag/abos, liste.json 1114, Noah «4a»: under Dokumente,
   * with the cancellation deadline and a reminder). Each contract: name, cost per month or year, end of
   * the term, how long it runs on by itself, notice period, reminder days before the last day to cancel,
   * phone and number, «travel insurance» (shows at trips abroad). The reminder is a to-do in Kalender ›
   * Merken (the app's one way to remind, also Ich › Erinnerungen); nothing on Heute. Add, change, sort
   * (arrows and drag), stop, delete (asks, then Undo).
   */
  import { Plus, Pencil, Bell, Phone, Plane } from '@lucide/svelte';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from '../frei/FreiSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { alltagQuery, change, restore, KEYS } from '../alltagdb.js';
  import { newContract, deadlineOf, remindDayOf, perMonth, totals, daysUntil, telOf, PERIODS, NOTICE, RENEW, REMIND_DAYS, DEFAULT_REMIND, uid } from '../alltag.js';
  import { localDay } from '../localday.js';
  import { phone } from '../media.svelte.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  const today = localDay();
  const q = alltagQuery();
  const list = $derived($q?.contracts ?? []);
  const sum = $derived(totals(list));
  const money = (x) => `CHF ${new Intl.NumberFormat(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x || 0)}`;
  const fmtDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  const save = (fn) => change(KEYS.contracts, [], fn);

  function dueLine(c) {
    if (c.stopped) return t('Stopped');
    const d = deadlineOf(c, today);
    if (!d) return t('No end date yet');
    const n = daysUntil(d, today);
    return n < 0 ? t('Last day to cancel was {day}', { day: fmtDay(d) }) : n === 0 ? t('Last day to cancel: today') : tn(n, 'Last day to cancel: {day} (in {n} day)', 'Last day to cancel: {day} (in {n} days)', { day: fmtDay(d) });
  }
  const soon = (c) => {
    const r = remindDayOf(c, today);
    return !!r && r <= today && deadlineOf(c, today) >= today;
  };

  let edit = $state(null);
  const blank = () => ({ id: null, name: '', cost: '', period: 'month', end: '', renew: 12, notice: 1, remind: DEFAULT_REMIND, phone: '', number: '', travel: false, stopped: false, note: '' });
  const openNew = () => (edit = blank());
  const openEdit = (c) => (edit = { ...blank(), ...c, cost: c.cost ? String(c.cost) : '', end: c.end ?? '' });
  async function saveEdit() {
    const rec = newContract(edit, edit.id ?? uid('ct'));
    if (!rec) return t('Please give it a name.');
    try {
      const before = await save((all) => (all.some((c) => c.id === rec.id) ? all.map((c) => (c.id === rec.id ? rec : c)) : [...all, rec]));
      offerDone(t('Saved.'), () => restore(KEYS.contracts, before));
    } catch (err) {
      return saveFailed(err);
    }
  }
  async function removeEdit() {
    const c = edit;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: c.name }), text: t('The contract and its reminder go. You can undo this for a few seconds.') });
    if (answer !== 'delete') return false;
    await deleteWithUndo({ run: () => save((all) => all.filter((x) => x.id !== c.id)), undo: (before) => restore(KEYS.contracts, before), text: t('"{name}" deleted.', { name: c.name }), name: c.name });
  }
  function reorder(id, to) {
    return save((all) => {
      const next = [...all];
      const [x] = next.splice(next.findIndex((c) => c.id === id), 1);
      next.splice(to, 0, x);
      return next;
    });
  }
  const step = (id, dir) => {
    const i = list.findIndex((c) => c.id === id);
    const to = Math.min(Math.max(i + dir, 0), list.length - 1);
    return to === i ? null : reorder(id, to);
  };
  const renewLabel = (m) => (m === 0 ? t('It just ends') : m === 1 ? t('Runs on month by month') : tn(m, 'Runs on {n} month', 'Runs on {n} months'));
  const noticeLabel = (m) => (m === 0 ? t('No notice period') : tn(m, '{n} month before the end', '{n} months before the end'));
  const remindLabel = (n) => (n === 0 ? t('No reminder') : tn(n, '{n} day before', '{n} days before'));
</script>

<div class="fz" data-page="abos">
  <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: '#/me/docs', label: t('Documents') }]} here={t('Contracts and subscriptions')} />
  <h1 class="fz-h1" tabindex="-1" data-page-title>{t('Contracts and subscriptions')}</h1>
  <p class="fz-intro">{t('What runs, what it costs and the last day to cancel. The app reminds you in Calendar › Remember before that day; nothing shows on Today.')}</p>

  {#if list.length}
    <section class="fz-box fz-soft" data-abo-sum>
      <b>{t('{sum} per month', { sum: money(sum.month) })}</b>
      <span class="fz-note">{t('{sum} per year, for everything that runs', { sum: money(sum.year) })}</span>
    </section>
  {/if}

  <div class="fz-acts"><button type="button" class="btn hi" onclick={openNew} data-abo-new><Plus size={16} aria-hidden="true" />{t('New contract')}</button></div>

  {#if !list.length}
    <p class="fz-empty">{t('Nothing here yet. Add your phone, insurance or streaming subscription with its notice period: the app reminds you in time.')}</p>
  {:else}
    <ul class="fz-box fz-list" use:sortable={{ onmove: (from, to) => reorder(list[from].id, to) }} aria-label={t('Contracts and subscriptions')}>
      {#each list as c, n (c.id)}
        <li class="fz-row" data-sort-id={c.id} data-abo={c.name}>
          <SortGrip name={c.name} onstep={(dir) => step(c.id, dir)} />
          <button type="button" class="fz-row-main al-open" onclick={() => openEdit(c)} data-abo-open>
            <b class:al-stopped={c.stopped}>{c.name}{#if c.travel}{' '}<Plane size={14} aria-label={t('Travel insurance')} />{/if}</b>
            <small>{c.cost ? `${money(c.cost)} ${c.period === 'year' ? t('per year') : t('per month')}` : t('No cost entered')}{c.period === 'year' && c.cost ? ` · ${t('{sum} per month', { sum: money(perMonth(c)) })}` : ''}</small>
            <small class:al-soon={soon(c)}>{#if soon(c)}<Bell size={13} aria-hidden="true" /> {/if}{dueLine(c)}</small>
          </button>
          {#if c.phone}<a class="fz-icon" href={telOf(c.phone)} aria-label={t('Call {name}', { name: c.name })}><Phone size={18} aria-hidden="true" /></a>{/if}
          {#if !phone.matches}<SortArrows name={c.name} i={n} n={list.length} onstep={(dir) => step(c.id, dir)} />{/if}
          <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: c.name })} onclick={() => openEdit(c)}><Pencil size={18} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
  <p class="fz-note">{t('All reminders: Me › Reminders. Papers like the policy itself: Me › Documents.')}</p>
</div>

{#if edit}
  <FreiSheet title={edit.id ? t('Change contract') : t('New contract')} sub={t('Contracts and subscriptions')} onsave={saveEdit} ondelete={edit.id ? removeEdit : null} onclose={() => (edit = null)}>
    <label class="fz-lab">{t('Name')}<input class="inp" maxlength="80" bind:value={edit.name} placeholder={t('e.g. Mobile phone')} data-field="name" /></label>
    <div class="al-two">
      <label class="fz-lab">{t('Cost')}<input class="inp" inputmode="decimal" maxlength="12" bind:value={edit.cost} placeholder="0.00" data-field="cost" /></label>
      <label class="fz-lab">{t('Paid')}
        <select class="inp" bind:value={edit.period} data-field="period">{#each PERIODS as p (p)}<option value={p}>{p === 'year' ? t('per year') : t('per month')}</option>{/each}</select>
      </label>
    </div>
    <label class="fz-lab">{t('The current term ends on')}<input class="inp" type="date" bind:value={edit.end} data-field="end" /></label>
    <label class="fz-lab">{t('After the end')}
      <select class="inp" bind:value={edit.renew} data-field="renew">{#each RENEW as m (m)}<option value={m}>{renewLabel(m)}</option>{/each}</select>
    </label>
    <label class="fz-lab">{t('Notice period')}
      <select class="inp" bind:value={edit.notice} data-field="notice">{#each NOTICE as m (m)}<option value={m}>{noticeLabel(m)}</option>{/each}</select>
    </label>
    <label class="fz-lab">{t('Remind me')}
      <select class="inp" bind:value={edit.remind} data-field="remind">{#each REMIND_DAYS as n (n)}<option value={n}>{remindLabel(n)}</option>{/each}</select>
    </label>
    <div class="al-two">
      <label class="fz-lab">{t('Phone')}<input class="inp" type="tel" maxlength="40" bind:value={edit.phone} data-field="phone" /></label>
      <label class="fz-lab">{t('Customer or policy number')}<input class="inp" maxlength="60" bind:value={edit.number} data-field="number" /></label>
    </div>
    <label class="al-check"><input type="checkbox" bind:checked={edit.travel} data-field="travel" /><span>{t('Travel insurance: show it at trips abroad')}</span></label>
    <label class="al-check"><input type="checkbox" bind:checked={edit.stopped} data-field="stopped" /><span>{t('Cancelled or stopped (no reminder, not in the sum)')}</span></label>
    <label class="fz-lab">{t('Note')}<textarea class="inp" rows="2" maxlength="600" bind:value={edit.note}></textarea></label>
  </FreiSheet>
{/if}

<style>
  .al-open {
    border: 0;
    background: none;
    padding: 0;
    text-align: left;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .al-soon {
    color: var(--warn, var(--accent));
    font-weight: 600;
  }
  .al-stopped {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .al-two {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .al-two > * {
    flex: 1 1 140px;
  }
  .al-check {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
  }
  .al-check input {
    width: 22px;
    height: 22px;
    accent-color: var(--accent);
  }
</style>
