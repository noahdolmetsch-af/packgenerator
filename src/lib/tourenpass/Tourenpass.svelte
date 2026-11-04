<script>
  /**
   * «Tourenpass mit Stempel» (Noah 03.11.2026 «E und F», Paket E, Idee 18): Touren › Rückblick › Tourenpass.
   * Every trip with a saved Rückblick can get a stamp (place, day, km); the stamps are a collection. «Not stamped»
   * sends a trip away (it can come back). Own stamps can be added, and every stamp can be changed or removed with
   * Undo. Nothing is stamped by itself.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { localDay } from '../localday.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { PASS_KEY, stateOf, openTrips, stamp, stampAll, addOwn, change, remove, decline, resetDeclined, newestFirst, summary } from './pass.js';
  import Stempel from './Stempel.svelte';
  import Empty from '../ui/Empty.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { Plus, Check, X, Pencil, Trash2, Stamp, ChevronRight } from '@lucide/svelte';

  const dataQ = liveQuery(async () => {
    const [set, trips, debriefs] = await Promise.all([db.settings.get(PASS_KEY), db.trips.toArray(), db.debriefs.toArray()]);
    return { state: stateOf(set?.value), trips, debriefs };
  });
  const data = $derived($dataQ ?? null);
  const st = $derived(data?.state ?? stateOf(null));

  const rows = $derived(data ? openTrips(data.trips, data.debriefs, st) : []);
  const offers = $derived(rows.filter((r) => !r.declined));
  const away = $derived(rows.filter((r) => r.declined));
  const list = $derived(newestFirst(st.stamps));
  const sum = $derived(summary(st.stamps));

  const save = (next) => putSetting(db, PASS_KEY, next);
  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : '');

  // the stamp that was just pressed comes down once
  let fresh = $state([]);
  async function take(r) {
    const next = stamp(st, r.trip);
    fresh = [...fresh, `s-${r.trip.id}`];
    await save(next);
    offerDone(t('«{name}» is stamped.', { name: r.place }));
  }
  async function takeAll() {
    fresh = [...fresh, ...offers.map((r) => `s-${r.trip.id}`)];
    await save(stampAll(st, offers));
    offerDone(tn(offers.length, '{n} stamp is in your pass.', '{n} stamps are in your pass.'));
  }
  async function notStamped(r) {
    const before = st;
    await save(decline(st, r.trip.id));
    offerDone(t('«{name}» stays without a stamp.', { name: r.place }), () => save(before));
  }

  // the form: a new own stamp (id null) or the change of a stamp
  let form = $state(null); // { id, place, date, km }
  const open = (s = null) => (form = s ? { id: s.id, place: s.place, date: s.date, km: s.km ?? '' } : { id: null, place: '', date: localDay(), km: '' });
  async function submit(e) {
    e.preventDefault();
    if (!form.place.trim()) return;
    const isNew = !form.id;
    const next = form.id ? change(st, form.id, { place: form.place, date: form.date, km: form.km }) : addOwn(st, form);
    if (isNew) fresh = [...fresh, next.stamps[next.stamps.length - 1]?.id];
    await save(next);
    form = null;
  }
  async function drop(s) {
    if ((await askDelete({ title: t('Remove the stamp «{name}»?', { name: s.place }), text: t('The stamp leaves your pass. The trip itself stays; you can stamp it again.') })) !== 'delete') return;
    const before = st;
    await deleteWithUndo({ run: () => save(remove(st, s.id)), undo: () => save(before), text: t('Stamp «{name}» removed.', { name: s.place }), name: s.place });
    form = null;
  }
</script>

<div class="tpass" data-tourenpass>
  <p class="lead">{t('After the look back of a trip you can press a stamp with the place, the day and the km into your tour pass. Over time it becomes a collection; you decide what goes in.')}</p>

  {#if !data}
    <p class="quiet">{t('Loading …')}</p>
  {:else}
    {#if offers.length}
      <section class="card sug" aria-labelledby="tp-sug" data-stamp-offers>
        <div class="sh">
          <h2 id="tp-sug">{tn(offers.length, '{n} trip without a stamp', '{n} trips without a stamp')}</h2>
          {#if offers.length > 1}<button type="button" class="btn" onclick={takeAll} data-stamp-all><Check size={16} aria-hidden="true" />{t('Stamp all')}</button>{/if}
        </div>
        <ul class="srows">
          {#each offers as r (r.trip.id)}
            <li data-offer={r.trip.id}>
              <div class="sm"><b>{r.place}</b><small>{[dayText(r.date), r.km ? t('{km} km', { km: num(r.km) }) : ''].filter(Boolean).join(' · ')}</small></div>
              <div class="sa">
                <button type="button" class="btn hi" onclick={() => take(r)} aria-label={t('Stamp «{name}»', { name: r.place })} data-stamp-take><Stamp size={16} aria-hidden="true" />{t('Stamp')}</button>
                <button type="button" class="btn" onclick={() => notStamped(r)} aria-label={t('No stamp for «{name}»', { name: r.place })} data-stamp-skip><X size={16} aria-hidden="true" />{t('No stamp')}</button>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section aria-labelledby="tp-col" data-stamp-collection>
      <div class="sh">
        <h2 id="tp-col">{t('Your tour pass')}{#if list.length}<span class="cnt num">{list.length}</span>{/if}</h2>
        <button type="button" class="btn" onclick={() => open()} data-stamp-new><Plus size={16} aria-hidden="true" />{t('Add a stamp')}</button>
      </div>
      {#if list.length}
        {#if sum.km}<p class="quiet">{t('{n} stamps · {km} km', { n: num(sum.n), km: num(sum.km) })}</p>{/if}
        <ul class="stamps">
          {#each list as s (s.id)}
            <li data-stamp-row={s.id}>
              <Stempel id={s.id} place={s.place} date={dayText(s.date)} km={s.km} press={fresh.includes(s.id)} />
              <div class="pa">
                <button type="button" class="btn" onclick={() => open(s)} aria-label={t('Change «{name}»', { name: s.place })} data-stamp-edit><Pencil size={15} aria-hidden="true" />{t('Change')}</button>
                <button type="button" class="btn" onclick={() => drop(s)} aria-label={t('Remove «{name}»', { name: s.place })} data-stamp-drop><Trash2 size={15} aria-hidden="true" /></button>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <Empty icon={Stamp} title={t('No stamp yet')} text={offers.length ? t('Trips with a saved look back are listed above. Stamp the ones you want.') : t('Your tour pass is empty. After you save the look back of a trip, it offers a stamp; you can also add one yourself.')} action={{ label: t('Add a stamp'), onclick: () => open(), explain: t('Place, day and km of a tour you rode') }} />
      {/if}
    </section>

    {#if form}
      <form class="card form" onsubmit={submit} data-stamp-form aria-label={form.id ? t('Change the stamp') : t('Add a stamp')}>
        <label for="tp-place">{t('Place or tour')}</label>
        <input id="tp-place" bind:value={form.place} placeholder={t('e.g. Test Pass Loop')} maxlength="60" required />
        <label for="tp-date">{t('Day of the tour')}</label>
        <input id="tp-date" type="date" bind:value={form.date} />
        <label for="tp-km">{t('Distance in km')}</label>
        <input id="tp-km" type="number" inputmode="numeric" min="0" max="5000" bind:value={form.km} />
        <div class="fa">
          <button type="submit" class="btn hi">{t('Save')}</button>
          <button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button>
        </div>
      </form>
    {/if}

    {#if away.length}
      <p class="quiet"><button type="button" class="btn btn-link" onclick={() => save(resetDeclined(st))} data-stamp-reset>{tn(away.length, '{n} trip marked «no stamp»: offer it again', '{n} trips marked «no stamp»: offer them again')}</button></p>
    {/if}

    <p class="next" data-stamp-next>{t('Next up:')} <a href="#/trips">{t('Plan the next trip')}<ChevronRight size={14} aria-hidden="true" /></a></p>
  {/if}
</div>

<style>
  .tpass {
    display: grid;
    gap: var(--sp-4);
    max-width: 720px;
  }
  .lead,
  .quiet {
    margin: 0;
    color: var(--ink-2);
  }
  .quiet {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .sh {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    margin-bottom: 10px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.05rem) / 1.2 var(--font-body);
  }
  .cnt {
    margin-left: 8px;
    color: var(--ink-3);
    font-weight: 500;
  }
  .sug {
    padding: 14px 16px;
  }
  .srows,
  .stamps {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .srows li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
  }
  .sm {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .sm small {
    color: var(--ink-3);
  }
  .sa,
  .pa,
  .fa {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .stamps {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 170px), 1fr));
    gap: 16px 12px;
  }
  .stamps li {
    display: grid;
    gap: 8px;
    justify-items: center;
    align-content: start;
  }
  .form {
    display: grid;
    gap: 6px;
    padding: 14px 16px;
  }
  .form label {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .form input {
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--card-line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .fa {
    margin-top: 6px;
  }
  .next {
    margin: 0;
    color: var(--ink-3);
  }
  .next a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
</style>
