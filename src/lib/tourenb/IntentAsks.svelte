<script>
  /**
   * Idee 52 «Tour aus einer Absicht» (Touren b): the questions of the intent come back in the Rückblick.
   * Answers stay on the trip (trip.intent.after); a question can be taken out (with Undo).
   */
  import { MessageCircleQuestion, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { saveFailed } from '../ui/ask.js';
  import SkToast from '../sk/SkToast.svelte';
  import { intentOf, answerAfter, dropAsk } from './absicht.js';
  import { t } from '../i18n.svelte.js';

  let { trip } = $props();
  const it = $derived(trip?.intent ?? null);
  const asks = $derived(it?.asks ?? []);
  const askText = (a) => (a.own ? t('How did «{name}» go?', { name: a.own }) : t(a.text));
  let undo = $state(null);

  async function put(next) {
    try {
      await db.trips.update(trip.id, touched({ intent: next }));
    } catch (err) {
      saveFailed(err);
    }
  }
  let timer;
  function write(i, text) {
    clearTimeout(timer);
    const next = answerAfter($state.snapshot(it), i, text);
    timer = setTimeout(() => put(next), 400);
  }
  function drop(i) {
    const before = $state.snapshot(it);
    put(dropAsk(before, i));
    undo = { text: t('«{name}» deleted', { name: askText(asks[i]) }), undo: () => put(before) };
  }
</script>

{#if asks.length}
  <section class="tp-card ika" aria-labelledby="ika-h" data-intent-asks>
    <h2 id="ika-h"><MessageCircleQuestion size={18} aria-hidden="true" /> {t('Your intent: {name}', { name: t(intentOf(it.key)?.name ?? 'Tour') })}</h2>
    <p class="ika-sub">{t('You asked these questions when you planned the tour. Answer what you like.')}</p>
    {#each asks as a, i (i + askText(a))}
      <div class="ika-q">
        <label><span>{askText(a)}</span><textarea class="inp" rows="2" value={it.after?.[i] ?? ''} oninput={(e) => write(i, e.currentTarget.value)}></textarea></label>
        <button type="button" class="tp-icon-btn" aria-label={t('Delete «{name}»', { name: askText(a) })} onclick={() => drop(i)}><X size={16} aria-hidden="true" /></button>
      </div>
    {/each}
  </section>
{/if}
<SkToast bind:note={undo} />

<style>
  .ika {
    margin: 0 0 var(--sp-4);
  }
  .ika h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .ika-sub {
    margin: 0 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ika-q {
    display: flex;
    gap: 6px;
    align-items: flex-end;
    margin: 0 0 8px;
  }
  .ika-q label {
    flex: 1;
    display: grid;
    gap: 4px;
  }
</style>
