<script>
  /**
   * «How hard will it be?» (Noah 04.11.2026 «1a», Persönliches Lernen Idee 1): in the plan step of a bike tour a
   * guess from 1 to 10, the same scale as «How hard was your ride?» afterwards. A second tap on the chosen number
   * takes the guess away (with Undo). After the ride the tour page puts the guess next to how it felt
   * (src/lib/touren/tour/ExpectCard.svelte). A tour already ridden shows the guess to read only. Never required.
   */
  import { Gauge } from '@lucide/svelte';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { expectOf, expectChange, wordOf, EXPECT_FIELD } from '../erwartung.js';

  let { trip, fixed = false } = $props();
  const now = $derived(expectOf(trip));

  async function pick(n) {
    const before = expectOf(trip);
    await db.trips.update(trip.id, touched(expectChange(trip, n)));
    if (before === n) offerDone(t('Your guess was removed.'), () => db.trips.update(trip.id, touched({ [EXPECT_FIELD]: before })));
  }
</script>

{#if !fixed || now}
  <section class="ex card pad" aria-labelledby="ex-h" data-expect>
    <h2 id="ex-h"><Gauge size={18} aria-hidden="true" />{t('How hard will it be?')}</h2>
    {#if fixed}
      <p class="exs">{t('You guessed {n} of 10 before the ride.', { n: now })}</p>
    {:else}
      <p class="exs">{t('Guess before you go. After the ride the tour page shows how it really felt.')}</p>
      <div class="fp" role="group" aria-labelledby="ex-h">
        {#each Array.from({ length: 10 }, (_, i) => i + 1) as n (n)}
          <button type="button" class="fb num" aria-pressed={now === n} onclick={() => pick(n)} data-expect-n={n}>{n}</button>
        {/each}
      </div>
      <p class="exs">{now ? t('{n} of 10: {word}', { n: now, word: t(wordOf(now)) }) : t('1 = very easy, 10 = all out. A second tap on your number takes it away.')}</p>
    {/if}
  </section>
{/if}

<style>
  .ex { container: expect / inline-size; display: grid; gap: 8px; min-width: 0; margin: 16px 0 8px; }
  h2 { display: flex; align-items: center; gap: 8px; margin: 0; font: 600 var(--fs-sub) / 1.3 var(--font-body); }
  .exs { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .fp { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  @container expect (min-width: 540px) { .fp { grid-template-columns: repeat(10, minmax(0, 1fr)); } }
  .fb { min-height: 44px; padding: 0; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font-weight: 600; cursor: pointer; }
  .fb[aria-pressed='true'] { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
</style>
