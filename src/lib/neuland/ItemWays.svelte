<script>
  /**
   * «Neuland» › one place › «Ways here» (Entdecken und Sammeln, Noah 04.11.2026 «3a 4b»): the days your line
   * passed this place, from which side you came and with which sport, and, for a pass, the sides you have not
   * tried yet. Only shown. Nothing is counted or stored: the side is worked out from the line each time.
   * item: the place; reachKm: its zone; tracks: the lines (tracksOf); passes: also name the sides not tried yet.
   */
  import { Route, Compass } from '@lucide/svelte';
  import { waysOf, sidesOf, sportsOf } from './wege.js';
  import { dayLong } from '../review/fmt.js';
  import { t } from '../i18n.svelte.js';

  let { item, reachKm = 0.5, tracks = [], passes = false } = $props();

  const isPlace = $derived(Number.isFinite(item?.lat) && Number.isFinite(item?.lon) && !item?.rings);
  const ways = $derived(isPlace ? waysOf(item, reachKm, tracks) : []);
  const sides = $derived(sidesOf(ways));
  const sports = $derived(sportsOf(ways));
  const FROM = { N: 'From the north', E: 'From the east', S: 'From the south', W: 'From the west' };
  const WORD = { N: 'the north', E: 'the east', S: 'the south', W: 'the west' };
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
