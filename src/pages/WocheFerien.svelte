<script>
  /**
   * «Woche planen» WP3 (Noah 15.10.2026 «4a»): #/week/away, holidays and other times away. Enter them
   * once and the week follows: the app suggests the follow-ups as switches, all on by default and each
   * deselectable: pause the training plan, plan the bike service before, prepare the packing list (a
   * to-do the day before), move the to-dos of those days, a short meditation reminder on the way is not
   * built (no reminders yet). Holidays show as a bar in the week. Rules: lib/woche.js (cleanAway, applyAway).
   */
  import { Palmtree, ChevronRight, Plus } from '@lucide/svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { weekQuery, putWeek } from '../lib/woche/load.js';
  import { shortDate } from '../lib/woche/words.js';
  import { AWAY_KEY, ITEMS_KEY, AWAY_TYPES, AWAY_NAMES, cleanAway, applyAway, awayDays } from '../lib/woche.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn } from '../lib/i18n.svelte.js';

  const today = localDay();
  const q = weekQuery(today);
  const src = $derived($q);
  const coming = $derived((src?.away ?? []).filter((a) => a.to >= today));
  const past = $derived((src?.away ?? []).filter((a) => a.to < today));

  let form = $state(null);
  const blank = () => cleanAway({ id: '', from: today, to: today, title: '', type: 'bike' });
  const startNew = () => (form = { ...blank(), id: '' });
  const edit = (a) => (form = { ...a });
  // a new type sets the follow-ups it suggests (bike trip: service and packing list; no bike: neither)
  const setType = (type) => (form = { ...form, type, service: type === 'bike', pack: type !== 'off' });
  const SWITCHES = [
    { key: 'pause', name: 'Pause the training plan', hint: 'No sessions on these days; the trip counts as riding' },
    { key: 'service', name: 'Bike service before', hint: 'What is due at the bike is suggested before the holidays' },
    { key: 'pack', name: 'Prepare the packing list', hint: 'A to-do the day before' },
    { key: 'shift', name: 'Move the to-dos', hint: 'To-dos dated on these days move to the day after' },
  ];

  async function save(ev) {
    ev.preventDefault();
    const a = cleanAway({ ...form, id: form.id || '' });
    if (!a) return;
    const list = (src?.away ?? []).filter((x) => x.id !== a.id);
    await putWeek(AWAY_KEY, [...list, a]);
    const { items } = applyAway(a, src?.rawItems ?? [], (k, title) => t(k, { title: title || t('Holidays|away') }));
    await putWeek(ITEMS_KEY, items);
    form = null;
  }
  async function remove() {
    await putWeek(AWAY_KEY, (src?.away ?? []).filter((x) => x.id !== form.id));
    await putWeek(ITEMS_KEY, (src?.rawItems ?? []).filter((x) => x.ref !== `pack:${form.id}`));
    form = null;
  }
  const line = (a) => `${shortDate(a.from)}${a.to !== a.from ? `–${shortDate(a.to)}` : ''} · ${tn(awayDays(a), '{n} day', '{n} days')} · ${t(AWAY_NAMES[a.type])}`;
</script>

<div class="wfe">
  <PageHead title={t('Holidays and time away')} text={t('Enter them once, the week follows.')} />

  <div class="lay">
    <section class="card wc" aria-labelledby="fe-form-h">
      {#if form}
        <h2 id="fe-form-h">{form.id ? t('Change holidays') : t('Enter holidays')}</h2>
        <form onsubmit={save} data-away-form>
          <div class="two">
            <label>{t('From|away')}<input type="date" bind:value={form.from} required /></label>
            <label>{t('To|away')}<input type="date" bind:value={form.to} min={form.from} required /></label>
          </div>
          <label>{t('Name')}<input type="text" bind:value={form.title} maxlength="80" placeholder={t('e.g. Jura weekend')} /></label>
          <Seg label={t('Kind')} full={false} options={AWAY_TYPES.map((k) => ({ key: k, name: t(AWAY_NAMES[k]) }))} value={form.type} onchange={setType} />
          <h3>{t('The app suggests')}</h3>
          <ul class="sws">
            {#each SWITCHES as s (s.key)}
              <li>
                <label class="tg"><span><b>{t(s.name)}</b><small>{t(s.hint)}</small></span><input type="checkbox" role="switch" bind:checked={form[s.key]} data-switch={s.key} /></label>
              </li>
            {/each}
          </ul>
          <div class="fb">
            <button type="submit" class="btn hi">{t('Save')}</button>
            {#if form.id}<button type="button" class="btn" onclick={remove}>{t('Delete')}</button>{/if}
            <button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button>
          </div>
        </form>
      {:else}
        <h2 id="fe-form-h">{t('Coming up')}</h2>
        <ul class="list">
          {#each coming as a (a.id)}
            <li><button type="button" class="ar" data-away={a.id} onclick={() => edit(a)}><Palmtree size={20} aria-hidden="true" /><span><b>{a.title || t('Holidays|away')}</b><small>{line(a)}</small></span><ChevronRight size={18} aria-hidden="true" /></button></li>
          {:else}
            <li class="none">{t('No holidays entered. A long weekend away? Enter it once and the week plans around it.')}</li>
          {/each}
        </ul>
        <button type="button" class="btn hi" onclick={startNew} data-add-away><Plus size={18} aria-hidden="true" />{t('Enter holidays')}</button>
        {#if past.length}
          <h3>{t('Past')}</h3>
          <ul class="list">
            {#each past.slice(-5).reverse() as a (a.id)}<li><button type="button" class="ar" onclick={() => edit(a)}><Palmtree size={20} aria-hidden="true" /><span><b>{a.title || t('Holidays|away')}</b><small>{line(a)}</small></span><ChevronRight size={18} aria-hidden="true" /></button></li>{/each}
          </ul>
        {/if}
      {/if}
    </section>
    <p class="why">{t('Holidays show as a bar in the week and pause the training plan if you want. Trips from Touren show there too.')}</p>
  </div>
</div>

<style>
  .wfe {
    max-width: 720px;
  }
  .wc {
    padding: 18px 20px;
  }
  h2 {
    margin: 0 0 12px;
    font-size: var(--fs-section);
  }
  h3 {
    margin: 16px 0 6px;
    font-size: var(--fs-body);
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  input[type='date'],
  input[type='text'] {
    min-height: 44px;
    font: inherit;
    font-weight: 400;
  }
  .sws,
  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sws li,
  .list li {
    border-top: 1px solid var(--line);
  }
  .tg {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 0;
    font-weight: 400;
    cursor: pointer;
  }
  .tg span {
    flex: 1;
  }
  .tg b {
    display: block;
    font-weight: 500;
  }
  .tg small {
    display: block;
    color: var(--ink-2);
  }
  .tg input {
    width: 44px;
    height: 26px;
    accent-color: var(--hi);
  }
  .ar {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 8px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .ar span {
    flex: 1;
  }
  .ar b {
    display: block;
    font-weight: 600;
  }
  .ar small {
    display: block;
    color: var(--ink-2);
  }
  .ar :global(svg:first-child) {
    color: var(--wk-away);
  }
  .none {
    padding: 12px 0;
    color: var(--ink-2);
  }
  .wc > .btn.hi {
    margin-top: 12px;
  }
  .fb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .why {
    margin: 12px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
