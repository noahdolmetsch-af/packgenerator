<script>
  /**
   * «Rennen aus dem Rennatlas» (Noah 24.11.2026 «a»): on the list of races, a closed box. You choose the
   * file your own race list made (JSON), tick the races and they become races of the app, each with its
   * date, days and the small facts of the list. The file is only read here and never sent anywhere.
   */
  import { Upload } from '@lucide/svelte';
  import { db } from '../db.js';
  import { newTrip } from '../trips.js';
  import { saveRace, putRace } from './store.js';
  import { raceHref } from './parts.js';
  import { parseAtlas, isKnown, preselected, atlasOf, keyOf, MAX_FILE } from './atlas.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, tn, locale, num } from '../i18n.svelte.js';

  let { trips = [], bikes = [] } = $props();
  let open = $state(false);
  let rows = $state([]);
  let picked = $state({});
  let error = $state('');
  let fileName = $state('');
  let busy = $state(false);

  const known = (r) => isKnown(r, trips);
  const chosen = $derived(rows.filter((r) => picked[keyOf(r)] && !known(r)));
  const fresh = $derived(rows.filter((r) => !known(r)).length);
  const dateOf = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : t('no date yet'));
  // «12 Jun 2027 · 6–10 days · 1,100 km · 21,000 m · Schweiz»: only what the row knows
  function metaOf(r) {
    const days = /^\d+$/.test(r.daysText) ? tn(Number(r.daysText), '{n} day', '{n} days') : /^[\d–-]+$/.test(r.daysText) ? t('{n} days', { n: r.daysText }) : r.daysText;
    return [dateOf(r.date), days, r.km ? `${num(r.km)} km` : '', r.hm ? `${num(r.hm)} m` : '', r.land].filter(Boolean).join(' · ');
  }
  const ERRORS = {
    unreadable: 'This file could not be read. Is it the JSON file of your race list?',
    format: 'This file has no list of races.',
    empty: 'There is no race in this file.',
    big: 'This file is too big.',
  };

  async function readFile(e) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    fileName = file.name;
    if (file.size > MAX_FILE) {
      error = 'big';
      rows = [];
      return;
    }
    const got = parseAtlas(await file.text());
    error = got.error;
    rows = got.rows;
    picked = Object.fromEntries(got.rows.filter((r) => !known(r) && preselected(r)).map((r) => [keyOf(r), true]));
  }

  async function create() {
    if (!chosen.length || busy) return;
    busy = true;
    try {
      let all = await db.trips.toArray();
      const items = await db.items.toArray();
      const bike = bikes[0] ?? { id: '', name: '', setup: {} };
      const ids = [];
      const base = Date.now();
      for (const r of chosen) {
        const trip = newTrip({ title: r.name, startDate: r.date || null, days: r.days, bike }, all, items, base + ids.length);
        await db.trips.add(trip);
        await saveRace(trip.id, { createdAt: new Date().toISOString(), atlas: atlasOf(r) });
        all = [...all, trip];
        ids.push(trip.id);
      }
      open = false;
      rows = [];
      picked = {};
      offerDone(tn(ids.length, '{n} race created.', '{n} races created.'), async () => {
        await db.trips.bulkDelete(ids);
        for (const id of ids) await putRace(id, null);
      });
      if (ids.length === 1) location.hash = raceHref(ids[0]);
    } finally {
      busy = false;
    }
  }
</script>

<section class="rc-box" data-race-atlas aria-labelledby="rc-atlas-h">
  <h2 id="rc-atlas-h" class="rc-h2"><button type="button" class="rc-atl-head" aria-expanded={open} onclick={() => (open = !open)} data-race-atlas-open>{t('Take races from your race list')}</button></h2>
  {#if open}
    <p class="rc-note">{t('Your own race list can save the races you picked as a JSON file. Choose it here: each race becomes a race of the app with its day and length. The file stays on this device.')}</p>
    <label class="btn" data-race-atlas-file><Upload size={16} aria-hidden="true" />{t('Choose the file')}<input class="rc-atl-file" type="file" accept=".json,application/json" onchange={readFile} data-race-atlas-input /></label>
    {#if error}<p class="rc-note" role="alert" data-race-atlas-error>{t(ERRORS[error] ?? ERRORS.unreadable)}</p>{/if}
    {#if rows.length}
      <p class="rc-note" data-race-atlas-sum>{tn(rows.length, '{n} race in «{file}», {fresh} not yet here.', '{n} races in «{file}», {fresh} not yet here.', { file: fileName, fresh })}</p>
      <ul class="rowlist rc-atl" data-race-atlas-list>
        {#each rows as r (keyOf(r))}
          {@const k = known(r)}
          <li>
            <label class="rc-atl-row" class:rc-atl-known={k}>
              <input type="checkbox" checked={!!picked[keyOf(r)] && !k} disabled={k} onchange={(e) => (picked = { ...picked, [keyOf(r)]: e.currentTarget.checked })} data-race-atlas-pick={keyOf(r)} />
              <span class="m">
                <span class="t">{r.name}</span>
                <span class="s">{metaOf(r)}</span>
              </span>
              {#if k}<span class="rc-atl-tag">{t('already here|race')}</span>{:else if r.registered}<span class="rc-atl-tag">{t('registered|race')}</span>{:else if r.fav}<span class="rc-atl-tag">{t('favourite|race')}</span>{/if}
            </label>
          </li>
        {/each}
      </ul>
      <div class="rc-acts">
        <button type="button" class="btn" disabled={!chosen.length || busy} onclick={create} data-race-atlas-make>{tn(chosen.length, 'Create {n} race', 'Create {n} races')}</button>
      </div>
      <p class="rc-note">{t('A race plans for its longest time (for example 10 days for «6–10 days») and gets your first bike. You can change both afterwards.')}</p>
    {/if}
  {/if}
</section>

<style>
  .rc-atl-head {
    all: unset;
    cursor: pointer;
    font: inherit;
    color: inherit;
  }
  .rc-atl-head::after {
    content: ' ›';
  }
  .rc-atl-head[aria-expanded='true']::after {
    content: ' ⌄';
  }
  .rc-atl-file {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    opacity: 0;
  }
  .rc-atl-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.6rem 0;
    cursor: pointer;
  }
  .rc-atl-row .m {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .rc-atl-row .s {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rc-atl-known {
    opacity: 0.55;
  }
  .rc-atl-tag {
    font-size: var(--fs-small);
    white-space: nowrap;
    color: var(--ink-3);
  }
</style>
