<script>
  /**
   * Idee 51 «Teil mit kleiner Geschichte» (Touren b): the voice notes of the items on this trip, to listen to
   * while packing. Record one in Material › the item › «Sprachnotiz». × takes one out for this trip (Undo).
   */
  import { Mic, X, Undo2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { saveFailed } from '../ui/ask.js';
  import { packStories, storyOff } from './stories.js';
  import { t, nameOf, num } from '../i18n.svelte.js';

  // hint: with no voice notes on the list, one line says what would play here
  let { trip, itemsById = {}, hint = false } = $props();
  const list = $derived(packStories(trip, itemsById));
  let undo = $state(null); // { id, name }

  async function setOff(itemId, back = false) {
    try {
      const cur = await db.trips.get(trip.id);
      if (cur) await db.trips.update(trip.id, touched({ storiesOff: storyOff(cur, itemId, back) }));
    } catch (err) {
      saveFailed(err);
    }
  }
  async function hide(item) {
    await setOff(item.id);
    undo = { id: item.id, name: nameOf(item) };
  }
  async function back() {
    const u = undo;
    undo = null;
    if (u) await setOff(u.id, true);
  }
</script>

{#if list.length || undo}
  <section class="tp-card st" aria-labelledby="st-h" data-stories>
    <h2 id="st-h"><Mic size={18} aria-hidden="true" /> {t('Little stories')}</h2>
    <p class="st-sub">{t('Your voice notes on the things of this list: what for and the trick.')}</p>
    <ul class="st-list">
      {#each list as s (s.item.id)}
        <li data-story={nameOf(s.item)}>
          <b>{nameOf(s.item)}</b>
          {#each s.voices as a, i (a.id)}
            <span class="st-voice">
              <audio controls preload="none" src={a.src} aria-label={t('Voice note on {name}', { name: nameOf(s.item) })}></audio>
              <small class="num">{t('{n} s', { n: num(a.s) })}</small>
            </span>
            {#if a.text}<p class="st-said">«{a.text}»</p>{/if}
          {/each}
          <button type="button" class="st-x" aria-label={t('Not on this trip: {name}', { name: nameOf(s.item) })} onclick={() => hide(s.item)} data-story-hide><X size={17} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
    {#if undo}<p class="st-undo" role="status"><span>{t('«{name}» is no longer shown.', { name: undo.name })}</span><button type="button" class="tp-link" onclick={back}><Undo2 size={15} aria-hidden="true" />{t('Undo')}</button></p>{/if}
  </section>
{:else if hint}
  <p class="tp-small tp-muted st-hint" data-stories-hint><Mic size={15} aria-hidden="true" /> <b>{t('Little stories while packing')}</b>: {t('a voice note on an item plays here on the packing day.')}</p>
{/if}

<style>
  .st-hint {
    margin: 0 0 var(--sp-3);
  }
  .st {
    margin: 0 0 var(--sp-4);
  }
  .st h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .st-sub {
    margin: 0 0 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .st-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .st-list li {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    padding: 6px 44px 6px 0;
    border-top: 1px solid var(--line);
  }
  .st-voice {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
  }
  .st-voice audio {
    height: 36px;
    max-width: 240px;
  }
  .st-said {
    flex-basis: 100%;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .st-x {
    position: absolute;
    right: 0;
    top: 4px;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 0;
    color: var(--ink-2);
    cursor: pointer;
  }
  .st-undo {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin: 6px 0 0;
    font-size: var(--fs-small);
  }
</style>
