<script>
  /**
   * v0.88.0 «Aufräumen und Ausprobieren» (Noah 0.88 3a, mockup G): Ich › «Ausprobieren». A playground
   * with a made-up trip (or empty), and the day to play («Tag spielen»). It starts as a demo
   * (demo.js keeps your data aside; play.js makes the file); the bar on top ends it, and then
   * everything is exactly as before. Backups are off meanwhile. Back closes only this sheet.
   */
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { startDemo, setClock } from '../demo.js';
  import { tidyData } from '../tidy.js';
  import { settling } from '../settled.js';
  import { playFile, playDay, KINDS, DAYS } from '../play.js';
  import { localDay } from '../localday.js';
  import { openTrip } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import { ArrowRight } from '@lucide/svelte';

  let { running = false, onclose } = $props();
  let dialog = $state();
  let kind = $state('weekend');
  let day = $state('today');
  let busy = $state(false);
  let msg = $state('');
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const KIND_NAMES = { weekend: 'Weekend trip', day: 'Day ride', empty: 'Empty|playground' };
  const DAY_NAMES = { today: 'Today|play', pack: 'Packing day', ride: 'On the way', after: 'After the trip' };
  async function start() {
    busy = true;
    try {
      const today = localDay();
      await settling(async () => {
        await startDemo(db, playFile(kind, today));
        await tidyData(db);
      });
      setClock(playDay(kind, day, today));
      if (kind !== 'empty') openTrip('play-trip');
      location.hash = kind === 'empty' || day === 'today' ? '#/' : day === 'after' ? '#/debrief/play-trip' : day === 'ride' ? '#/ride' : '#/pack';
      location.reload();
    } catch (err) {
      msg = `${t('The playground did not start, nothing was changed.')} ${err.message ?? ''}`;
      busy = false;
    }
  }
</script>

<dialog class="sheet playsheet" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="play-h">
  <div class="head">
    <h2 id="play-h">{t('Try it out')}</h2>
    <button type="button" class="tp-link" onclick={() => dialog.close()}>{t('Close')}</button>
  </div>
  <p class="lead">{t('A playground with a made-up trip and gear. Try everything, debriefs too. When you end it, everything is exactly as before.')}</p>
  {#if running}
    <p class="msg">{t('The playground is running. «End» in the bar on top puts your data back.')}</p>
  {:else}
    <p class="plbl" id="play-kind">{t('Start with|play')}</p>
    <Seg labelledby="play-kind" value={kind} onchange={(k) => (kind = k)} options={KINDS.map((k) => ({ key: k, name: t(KIND_NAMES[k]) }))} />
    {#if kind !== 'empty'}
      <p class="plbl" id="play-day">{t('Play the day')}</p>
      <Seg labelledby="play-day" value={day} onchange={(k) => (day = k)} options={DAYS.map((k) => ({ key: k, name: t(DAY_NAMES[k]) }))} />
    {:else}
      <p class="small">{t('Empty: play with your own data; afterwards it is exactly as before.')}</p>
    {/if}
    <button type="button" class="btn hi big" disabled={busy} onclick={start}>{t('Start the playground')}<ArrowRight size={18} aria-hidden="true" /></button>
    <p class="small">{t('Backups are off meanwhile, so nothing made up gets into them.')}</p>
    {#if msg}<p class="msg" role="alert">{msg}</p>{/if}
  {/if}
</dialog>

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font: 700 var(--fs-section)/1.2 var(--font-body);
  }
  .lead {
    margin: 6px 0 14px;
    color: var(--ink-2);
  }
  .plbl {
    margin: 14px 0 6px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .big {
    width: 100%;
    min-height: 52px;
    margin-top: 18px;
    justify-content: center;
  }
  .small {
    margin: 10px 0 0;
    text-align: center;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .msg {
    margin: 10px 0 0;
    color: var(--ink-2);
  }
</style>
