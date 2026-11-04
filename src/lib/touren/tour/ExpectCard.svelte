<script>
  /**
   * «Guessed and felt» (Noah 04.11.2026 «1a», Persönliches Lernen Idee 1): on the tour page of a bike tour
   * with a guess made while planning (src/lib/pack/ExpectPick.svelte) and a ride. Without an answer to
   * «How hard was your ride?» the card asks it (the same ten buttons as in Aktiv › Training); with one it puts the
   * guess next to it in one calm sentence and, from three tours on, says whether your guesses lean one way.
   * Observation only: it never says why. No guess made, no card. d: the tour (tourdata.js loadTour).
   */
  import { liveQuery } from 'dexie';
  import { Gauge, ChevronRight } from '@lucide/svelte';
  import { db } from '../../db.js';
  import { t, num } from '../../i18n.svelte.js';
  import { loadActs } from '../../review/actdata.js';
  import { activitiesForTrip } from '../../training.js';
  import FeelPick from '../../training/plans/FeelPick.svelte';
  import { touched } from '../../trips.js';
  import { expectOf, feltOf, feltChange, compare, habit, unanswered, wordOf, MIN_TOURS } from '../../erwartung.js';

  let { d } = $props();
  const guess = $derived(d?.kind === 't' ? expectOf(d.trip) : null);
  const acts = $derived(d?.acts ?? []);
  const rides = $derived(d?.rides ?? []);
  const felt = $derived(feltOf(acts, d?.trip));
  const cmp = $derived(compare(guess, felt?.value ?? null));
  const open = $derived(unanswered(acts));
  let change = $state(false);

  // the other tours with a guess: only read when at least MIN_TOURS of them exist
  const histQ = liveQuery(async () => {
    const trips = (await db.trips.toArray()).filter((x) => expectOf(x) != null);
    if (trips.length < MIN_TOURS) return [];
    const [all, kmBook] = await Promise.all([loadActs(db), db.kmBook.toArray()]);
    return trips.map((x) => ({ guess: expectOf(x), felt: feltOf(activitiesForTrip(x, all, kmBook), x)?.value ?? null }));
  });
  const pattern = $derived(habit($histQ ?? []));

  // a tour with a ride but no activity (an uploaded ride): the answer sits on the trip itself
  const own = $derived(acts.length === 0);
  const ownNow = $derived(own ? (felt?.value ?? null) : null);
  const pickOwn = (n) => db.trips.update(d.trip.id, touched(feltChange(d.trip, n)));

  const gap = $derived(cmp ? num(cmp.size) : '');
  const sentence = $derived(
    !cmp ? '' : cmp.kind === 'same' ? t('About as hard as you guessed.') : cmp.kind === 'harder' ? t('{n} points harder than you guessed.', { n: gap }) : t('{n} points easier than you guessed.', { n: gap }),
  );
  const habitLine = $derived(
    !pattern ? '' : pattern.kind === 'same' ? t('Over {n} tours your guesses and how it felt were close on average.', { n: pattern.n }) : pattern.kind === 'harder' ? t('Over {n} tours it felt {x} points harder than you guessed, on average.', { n: pattern.n, x: num(pattern.size) }) : t('Over {n} tours it felt {x} points easier than you guessed, on average.', { n: pattern.n, x: num(pattern.size) }),
  );
</script>

{#snippet ownPick()}
  <div class="fp" role="group" aria-label={t('Felt effort from 1 to 10')} data-felt-own>
    {#each Array.from({ length: 10 }, (_, i) => i + 1) as n (n)}
      <button type="button" class="fb num" aria-pressed={ownNow === n} onclick={() => pickOwn(n)} data-feel={n}>{n}</button>
    {/each}
  </div>
{/snippet}

{#if guess != null && (acts.length || rides.length)}
  <section class="ex" aria-labelledby="exc-h" data-tour-expect>
    <p class="k"><Gauge size={16} aria-hidden="true" />{t('Guessed and felt')}</p>
    {#if felt}
      <h2 id="exc-h">{sentence}</h2>
      <div class="two" aria-label={t('Guessed {a}, felt {b}', { a: num(guess), b: num(felt.value) })}>
        <div class="box"><span class="v num">{num(guess)}</span><span class="l">{t('Guessed')}</span></div>
        <div class="box"><span class="v num">{num(felt.value)}</span><span class="l">{t('Felt')}</span></div>
      </div>
      <p class="s">{t('Felt {n} of 10: {word}', { n: num(felt.value), word: t(wordOf(Math.round(felt.value))) })}</p>
      {#if habitLine}<p class="s" data-expect-habit>{habitLine}</p>{/if}
      <p class="s">{t('This only describes what you wrote down. A few tours say little, and weather, sleep and route differ every time.')}</p>
      <div class="row">
        <button type="button" class="btn btn-link" aria-expanded={change} onclick={() => (change = !change)} data-expect-change>{t('Change my answer')}</button>
        {#if d.state !== 'rated'}<a class="btn btn-link" href="#/debrief/{encodeURIComponent(d.id)}" data-expect-next>{t('Next: the debrief')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
      </div>
      {#if change}{#if own}{@render ownPick()}{:else}{#each acts as a (a.id)}<FeelPick act={a} />{/each}{/if}{/if}
    {:else}
      <h2 id="exc-h">{t('How hard was it really?')}</h2>
      <p class="s">{t('You guessed {n} of 10. Say how it felt, and the page puts the two side by side.', { n: num(guess) })}</p>
      {#if open}<FeelPick act={open} />{:else if own}{@render ownPick()}{/if}
    {/if}
  </section>
{/if}

<style>
  .ex { display: grid; gap: 8px; padding: 16px; border-radius: var(--radius-card); background: var(--warm-soft); min-width: 0; }
  .k { display: flex; align-items: center; gap: 6px; margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  h2 { margin: 0; font: 600 var(--fs-sub) / 1.3 var(--font-body); }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .box { display: grid; gap: 2px; justify-items: center; padding: 10px; border-radius: var(--r-ctl); background: var(--paper); }
  .v { font: 700 var(--fs-num) / 1.1 var(--font-body); }
  .l { color: var(--ink-2); font-size: var(--fs-small); }
  .s { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .fp { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 4px; }
  .fb { min-height: 44px; padding: 0; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font-weight: 600; cursor: pointer; }
  .fb[aria-pressed='true'] { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
  .row { display: flex; flex-wrap: wrap; gap: 4px 16px; }
  .row :global(.btn) { min-height: 44px; }
</style>
