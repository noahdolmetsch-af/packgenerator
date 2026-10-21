<script>
  /**
   * Lernschleife (UI-Ziele #18 «I3», 0.174): one question card on the tour page after a tour with a ride.
   * «Hast du die Regenjacke gebraucht? Ja · Nein · Weiss nicht», the heaviest things first, at most 5 per
   * tour, at most one card a day. «Heute nicht» and «Nicht fragen für dieses Teil» always stand there.
   * «Nein» marks the thing «nicht gebraucht» (tourgear.js setMark): the next packing list shows it as ballast.
   * Every answer can be taken back with Undo. d: the tour (tourdata.js loadTour); key: its key.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../../db.js';
  import { t, nameOf } from '../../i18n.svelte.js';
  import { localDay } from '../../localday.js';
  import { offerDone } from '../../ui/rename.svelte.js';
  import { setMark } from '../tourgear.js';
  import { ASK_KEY, nextQuestion, shown, answer, skipToday, neverAsk } from '../lernfrage.js';
  import { Lightbulb } from '@lucide/svelte';

  let { d, key, over = true } = $props();
  const today = localDay();
  const stateQ = liveQuery(() => db.settings.get(ASK_KEY).then((r) => r ?? null)); // null: read, none yet
  const state = $derived($stateQ?.value ?? null);
  const ready = $derived($stateQ !== undefined);
  const q = $derived(ready && d?.trip ? nextQuestion({ trip: d.trip, debrief: d.debrief, items: d.items ?? [], ride: d.acts.length > 0 || (d.rides ?? []).length > 0, key, today, state, over }) : null);
  const save = (value) => db.settings.put({ key: ASK_KEY, value });

  // the first card of the day belongs to this tour (one card a day)
  $effect(() => {
    if (q && (state?.day !== today || state?.key !== key)) save(shown(state, key, today));
  });

  async function reply(value) {
    const before = state;
    const item = q.item;
    const markBefore = d.debrief?.items?.[item.id] ?? null;
    await save(answer(state, d.trip.id, item.id, value));
    if (value === 'no') await setMark(db, d.trip, item.id, 'unused');
    offerDone(value === 'no' ? t('«{name}» marked as not used.', { name: nameOf(item) }) : t('Thanks, noted.'), async () => {
      await save(before);
      if (value === 'no') await setMark(db, d.trip, item.id, markBefore ?? 'used');
    });
  }
  async function later() {
    const before = state;
    await save(skipToday(state, today));
    offerDone(t('No more questions today.'), () => save(before));
  }
  async function never() {
    const before = state;
    const item = q.item;
    await save(neverAsk(state, item.id));
    offerDone(t('«{name}» is not asked about any more.', { name: nameOf(item) }), () => save(before));
  }
</script>

{#if q}
  <section class="ask" aria-labelledby="ask-h" data-tour-ask data-ask-item={q.item.id}>
    <p class="k"><Lightbulb size={16} aria-hidden="true" />{t('Learn from this tour')}<span class="n num">{t('Question {n} of {m}', { n: q.n, m: q.of })}</span></p>
    <h2 id="ask-h">{t('Did you use «{name}»?', { name: nameOf(q.item) })}</h2>
    <div class="row" role="group" aria-labelledby="ask-h">
      <button type="button" class="btn" onclick={() => reply('yes')} data-ask="yes">{t('Yes|used')}</button>
      <button type="button" class="btn" onclick={() => reply('no')} data-ask="no">{t('No|used')}</button>
      <button type="button" class="btn" onclick={() => reply('unknown')} data-ask="unknown">{t('Don’t know')}</button>
    </div>
    <p class="s">{t('What you did not use shows as ballast the next time you pack.')}</p>
    <div class="row quiet">
      <button type="button" class="btn btn-link" onclick={later} data-ask-later>{t('Not today')}</button>
      <button type="button" class="btn btn-link" onclick={never} data-ask-never>{t('Never ask for this thing')}</button>
    </div>
  </section>
{/if}

<style>
  .ask {
    display: grid;
    gap: 8px;
    padding: 16px;
    border-radius: var(--radius-card);
    background: var(--warm-soft);
  }
  .k {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .n {
    margin-left: auto;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .row .btn {
    min-height: 44px;
  }
  .quiet {
    gap: 4px 16px;
  }
  .s {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
