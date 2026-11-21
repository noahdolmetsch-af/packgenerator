<script>
  /**
   * «Neuland» › one place › «Ways here» (Entdecken und Sammeln, Noah 04.11.2026 «3a 4b»): the days your line
   * passed this place, from which side you came and with which sport, and, for a pass, the sides you have not
   * tried yet. Only shown. Nothing is counted or stored: the side is worked out from the line each time.
   * item: the place; reachKm: its zone; tracks: the lines (tracksOf); passes: also name the sides not tried yet.
   */
  import { Route, Compass, Mountain, RefreshCw } from '@lucide/svelte';
  import { db } from '../db.js';
  import { waysOf, sidesOf, sportsOf } from './wege.js';
  import { readGround, lookupGround, sharesOf, KINDS, MAX_DAYS } from './untergrund.js';
  import { dayLong } from '../review/fmt.js';
  import { t } from '../i18n.svelte.js';

  let { item, reachKm = 0.5, tracks = [], passes = false } = $props();

  const isPlace = $derived(Number.isFinite(item?.lat) && Number.isFinite(item?.lon) && !item?.rings);
  const ways = $derived(isPlace ? waysOf(item, reachKm, tracks) : []);
  const sides = $derived(sidesOf(ways));
  const sports = $derived(sportsOf(ways));
  const FROM = { N: 'From the north', E: 'From the east', S: 'From the south', W: 'From the west' };
  const WORD = { N: 'the north', E: 'the east', S: 'the south', W: 'the west' };
  const KIND = { paved: 'Ground: paved', gravel: 'Ground: gravel', ground: 'Ground: natural', unknown: 'Ground: unknown' };
  const WHY = { net: 'No connection. The ground is looked up when you are online.', busy: 'The map server is busy. Try again in a few minutes.', failed: 'The lookup did not work this time.' };

  // the ground of the run-up (OpenStreetMap): only after a tap; what came back stays on this device
  let ground = $state(null);
  let busy = $state(false);
  let why = $state(null);
  $effect(() => {
    const id = item?.id;
    ground = null;
    why = null;
    if (!id || !isPlace) return;
    readGround(db, id).then((g) => {
      if (item?.id === id) ground = g;
    });
  });
  const askable = $derived(ways.filter((w) => w.run?.length > 1));
  const missing = $derived(askable.filter((w) => !ground?.days?.[w.day]).length);
  const known = $derived(askable.filter((w) => ground?.days?.[w.day]).map((w) => ({ w, s: sharesOf(ground.days[w.day]) })).filter((x) => x.s));
  async function look(force = false) {
    if (busy || !item?.id) return;
    busy = true;
    why = null;
    try {
      const r = await lookupGround(db, item.id, $state.snapshot(ways), { force });
      ground = r.rec;
      why = r.failed;
    } finally {
      busy = false;
    }
  }
  const times = (n) => (n === 1 ? t('Once') : t('{n} times', { n }));
</script>

{#if ways.length}
  <section class="nl-ways" data-nl-ways aria-labelledby="nlw-h">
    <h3 id="nlw-h"><Route size={16} aria-hidden="true" />{t('Ways here')}</h3>
    <p class="q">{t('Your line passed here on {n} days. The side is worked out from the line: where you came from, 3 km before the place.', { n: ways.length })}</p>
    {#if sides.rows.length}
      <ul class="rows">
        {#each sides.rows as r (r.side)}
          <li data-way-side={r.side}><b>{t(FROM[r.side])}</b><span>{times(r.n)} · {t('last {day}', { day: dayLong(r.last) })}</span></li>
        {/each}
      </ul>
    {/if}
    {#if sides.unknown}<p class="q" data-way-unknown>{t('{n} times the side is not clear (a short line, a start here or a loop).', { n: sides.unknown })}</p>{/if}
    {#if sports.length}
      <p class="sp" data-way-sports>{t('With: {sports}', { sports: sports.map((s) => `${t(s.key)} ${s.n}×`).join(' · ') })}</p>
    {/if}
    {#if askable.length}
      <div class="gr" data-way-ground>
        <h4><Mountain size={15} aria-hidden="true" />{t('Ground of the run-up')}</h4>
        {#if known.length}
          <ul class="rows">
            {#each known as { w, s } (w.day)}
              <li data-ground-day={w.day}><b>{dayLong(w.day)}{w.side ? ` · ${t(FROM[w.side])}` : ''}</b><span>{KINDS.filter((k) => s[k]).map((k) => `${t(KIND[k])} ${s[k]} %`).join(' · ')}</span></li>
            {/each}
          </ul>
        {/if}
        {#if missing}
          <button type="button" class="btn" onclick={() => look(false)} disabled={busy} data-ground-look>{busy ? t('Looking it up…') : known.length ? t('Look up the other days') : t('Look up the ground')}</button>
        {:else if known.length}
          <button type="button" class="btn" onclick={() => look(true)} disabled={busy} data-ground-again><RefreshCw size={15} aria-hidden="true" />{t('Look up again')}</button>
        {/if}
        {#if why}<p class="q" data-ground-why>{t(WHY[why] ?? WHY.failed)}</p>{/if}
        <p class="q">{t('From OpenStreetMap, roughly: many paths have no surface entry and show as unknown. Only the 3 km before the place leave your device, and only after you tap.')}</p>
      </div>
    {/if}
    {#if passes && sides.missing.length}
      <p class="next" data-way-missing><Compass size={16} aria-hidden="true" />{t('Not yet from: {sides}. Another side makes the same pass a new ride.', { sides: sides.missing.map((s) => t(WORD[s])).join(', ') })}</p>
    {/if}
  </section>
{/if}

<style>
  .nl-ways {
    margin-top: 14px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font-size: var(--fs-body);
    font-weight: 650;
  }
  p {
    margin: 0 0 6px;
  }
  .q {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rows {
    margin: 6px 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }
  .rows li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 2px 12px;
    padding: 8px 10px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .rows span {
    color: var(--ink-2);
  }
  .gr {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  h4 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font-size: var(--fs-body);
    font-weight: 600;
  }
  .gr .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
  }
  .sp {
    color: var(--ink-2);
  }
  .next {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 8px 0 0;
    color: var(--accent);
  }
  .next :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
