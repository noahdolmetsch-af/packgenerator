<script>
  /**
   * v0.88.0 «Aufräumen und Ausprobieren» (Noah 0.88 3a, mockup G): Ich › «Ausprobieren». A playground
   * with a made-up trip (or empty), and the day to play («Tag spielen»). It starts as a demo
   * (demo.js keeps your data aside; play.js makes the file); the bar on top ends it, and then
   * everything is exactly as before. Backups are off meanwhile. Back closes only this sheet.
   */
  import { backClose } from '../ui/backclose.js';
  import { plainError } from '../clear/errors.js'; // Paket Q #127: plain words instead of technical text
  import { db } from '../db.js';
  import { startDemo, setClock } from '../demo.js';
  import { tidyData } from '../tidy.js';
  import { settling } from '../settled.js';
  import { playFile, playDay, KINDS, DAYS } from '../play.js';
  import { localDay } from '../localday.js';
  import { openTrip } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';
  import { ArrowRight } from '@lucide/svelte';

  // v0.96.0 «F1 Alles finden»: «Try it» on «What the app can do» opens the sheet on a day (pack, ride, after).
  let { running = false, onclose, kind: kind0 = 'weekend', day: day0 = 'today' } = $props();
  let dialog = $state();
  // svelte-ignore state_referenced_locally
  let kind = $state(kind0); // the start only: the sheet's own choice wins afterwards
  // svelte-ignore state_referenced_locally
  let day = $state(day0);
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
      msg = `${t('The playground did not start, nothing was changed.')} ${t(plainError(err))}`;
      busy = false;
    }
  }
</script>


<!-- Design-Refresh P9 (I13, Noah 12.10.2026 «Runde 20 freigegeben»): the window look of the new style:
     «Start with» and «Play the day» as chips (the chosen one dark), below how the bar on top looks while
     it runs (a picture, not the bar itself), the buttons bottom right. The same playground as before. -->
<dialog class="sheet playsheet vdlg" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="play-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="play-h">{t('Try it out')}</h2>
      <p class="vd-sub">{t('Playground with a made-up trip and made-up gear')}</p>
    </div>
  </div>
  <p class="lead">{t('A playground with a made-up trip and gear. Try everything, debriefs too. When you end it, everything is exactly as before.')}</p>
  {#if running}
    <p class="msg">{t('The playground is running. «End» in the bar on top puts your data back.')}</p>
  {:else}
    <p class="lbl pl" id="play-kind">{t('Start with|play')}</p>
    <div class="vd-chips" role="group" aria-labelledby="play-kind">
      {#each KINDS as k (k)}<button type="button" class="vd-chip" aria-pressed={kind === k} onclick={() => (kind = k)}>{t(KIND_NAMES[k])}</button>{/each}
    </div>
    {#if kind !== 'empty'}
      <p class="lbl pl" id="play-day">{t('Play the day')}</p>
      <div class="vd-chips" role="group" aria-labelledby="play-day">
        {#each DAYS as k (k)}<button type="button" class="vd-chip" aria-pressed={day === k} onclick={() => (day = k)}>{t(DAY_NAMES[k])}</button>{/each}
      </div>
    {:else}
      <p class="small">{t('Empty: play with your own data; afterwards it is exactly as before.')}</p>
    {/if}
    <p class="lh">{t('This is how it looks while it runs')}</p>
    <div class="preview" aria-hidden="true">
      <span><b>{t('Playground')}</b> · {t('your data is safe · nothing counts')}</span>
      <span class="pv-btn">{t('End|playground')}</span>
    </div>
    <p class="small">{t('Backups are off meanwhile, so nothing made up gets into them.')}</p>
    {#if msg}<p class="msg" role="alert">{msg}</p>{/if}
  {/if}
  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button>
    {#if !running}<button type="button" class="btn hi" disabled={busy} onclick={start}>{t('Start the playground')}<ArrowRight size={18} aria-hidden="true" /></button>{/if}
  </div>
</dialog>

<style>
  .lead {
    margin: 0 0 6px;
    color: var(--ink);
  }
  .pl {
    margin: 14px 0 6px;
  }
  /* 44px to tap */
  .vd-chip {
    min-height: 44px;
  }
  .lh {
    margin: 16px 0 6px;
    color: var(--ink);
  }
  /* a picture of the yellow bar on top (DemoBar), not the bar itself */
  .preview {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--warn-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .preview b {
    color: var(--warn);
  }
  .pv-btn {
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .small {
    margin: 8px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .msg {
    margin: 10px 0 0;
    color: var(--ink-2);
  }
</style>
