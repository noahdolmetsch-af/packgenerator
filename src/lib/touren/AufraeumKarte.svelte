<script>
  /**
   * «Touren-Seite klarer» (Noah 25.11.2026 «1-5a», Frage 1a): the one card above the list that says what to tidy,
   * instead of a grey line one overlooks. Two things, each with its own button, both reversible:
   *   - doubled trips: «Join them» joins every group the way the sheet suggests (the one with a Rückblick and the most
   *     packed things stays); «Look first» opens the sheet. The extras are hidden, not deleted, «Take doubles apart» and
   *     the Undo of 8 s bring them back (aufraeumen.js, aufraeumendb.js).
   *   - trips named like a test: «Mark as test» sets the «Test trip» switch (they count nowhere, as on Today); Undo.
   * Nothing happens by itself. The card is not there when there is nothing to tidy.
   */
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { extraCount } from './aufraeumen.js';
  import { joinDoubles, splitDoubles, markTests, unmarkTests } from './aufraeumendb.js';
  import { Sparkles } from '@lucide/svelte';

  let { doubles = [], tests = [], onlook } = $props();
  let busy = $state(false);
  const nDoubled = $derived(extraCount(doubles));
  const first = $derived(doubles.slice().sort((a, b) => b.members.length - a.members.length)[0]);

  async function join() {
    busy = true;
    try {
      const ids = await joinDoubles(db, doubles.map((g) => ({ group: $state.snapshot(g), keepId: g.keep })));
      offerDone(tn(ids.length, '{n} trip joined.', '{n} trips joined.'), () => splitDoubles(db, ids));
    } finally {
      busy = false;
    }
  }
  async function mark() {
    busy = true;
    try {
      const ids = tests.map((x) => x.id);
      const n = await markTests(db, ids);
      offerDone(tn(n, '{n} trip marked as test.', '{n} trips marked as test.'), () => unmarkTests(db, ids));
    } finally {
      busy = false;
    }
  }
</script>

{#if nDoubled || tests.length}
  <section class="tk card" aria-label={t('Tidy up')} data-tidy-card>
    <h3><Sparkles size={16} aria-hidden="true" />{t('Tidy up')}</h3>
    {#if nDoubled}
      <div class="row" data-tidy-doubles>
        <p>{tn(nDoubled, '{n} trip looks doubled', '{n} trips look doubled')} · {t('For example «{name}», {n} times.', { name: first.title, n: first.members.length })}</p>
        <div class="acts">
          <button type="button" class="btn hi sm" disabled={busy} onclick={join} data-tidy-join>{t('Join them')}</button>
          <button type="button" class="btn sm" onclick={() => onlook?.()} data-doubles-open>{t('Look first')}</button>
        </div>
      </div>
    {/if}
    {#if tests.length}
      <div class="row" data-tidy-tests>
        <p>{tn(tests.length, '{n} trip is named like a test: «{name}».', '{n} trips are named like a test: «{name}» and more.', { name: tests[0].title })}</p>
        <div class="acts"><button type="button" class="btn hi sm" disabled={busy} onclick={mark} data-tidy-test>{t('Mark as test')}</button></div>
      </div>
    {/if}
    <small>{t('Nothing is deleted. Undo brings it back.')}</small>
  </section>
{/if}

<style>
  .tk {
    display: grid;
    gap: var(--sp-2);
    margin: var(--sp-3) 0;
    padding: var(--sp-3) var(--sp-4);
    border: 1px solid var(--line);
    background: var(--paper);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2) var(--sp-3);
  }
  p {
    flex: 1 1 18rem;
    margin: 0;
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  small {
    color: var(--ink-3);
  }
</style>
