<script>
  /**
   * «Seitentitel im Browser-Tab» (Noah 23.11.2026 «2a»): sets `document.title` from the page the app shows (the
   * words of the path line, tabtitle.js) and, while a timer, a countdown, a meditation or a ride runs, the time in
   * front: «▶ 12:34 · Meditation». Draws nothing but one hidden line for screen readers that says the new page
   * after a change of page (never the running time, so no noise every second).
   */
  import { t } from '../i18n.svelte.js';
  import { ALL_PLACES, PLACE_TABS, tabOf } from '../nav.js';
  import { placeLabel, tabLabel } from '../anpassen.svelte.js';
  import { timer } from '../timer/run.svelte.js';
  import { position, modeOf } from '../timer.js';
  import { clockState, actName } from '../flow/ui.svelte.js';
  import { flowQuery } from '../flow/data.svelte.js';
  import { remainingSec, isDone, isPaused, clock } from '../flowtimer.js';
  import { localDay } from '../localday.js';
  import { tabTitle, pageTitle, runClock, ridingMs } from './tabtitle.js';

  let { hash, page, place } = $props();

  // the page's own big title (the pages load later: watch until it is drawn), like the path line
  let h1 = $state('');
  $effect(() => {
    void hash;
    h1 = '';
    const main = document.querySelector('main');
    if (!main) return;
    const read = () => {
      h1 = main.querySelector('[data-page-title], h1')?.textContent?.trim() ?? '';
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(main, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  });

  // a ride's recording: its module loads only on the pages that can start one (the time stays in the title on every page after)
  let rec = $state(null);
  $effect(() => {
    if (rec || !['live', 'ride', 'abfahrt', 'spur', 'trips', 'pack'].includes(page)) return;
    import('../spur/recorder.svelte.js').then((m) => (rec = m.rec)).catch(() => {});
  });

  // one tick a second, only while something runs
  let now = $state(Date.now());
  const tm = $derived(clockState.tm);
  const live = $derived(!!timer.run || (!!tm && !isDone(tm, clockState.now)) || !!rec?.on);
  $effect(() => {
    if (!live) return;
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  const flowQ = $derived(tm ? flowQuery(localDay()) : null);
  const flowData = $derived(flowQ ? $flowQ : null);

  const running = $derived.by(() => {
    void now;
    const run = timer.run;
    if (run) {
      const pos = position(run, timer.now);
      if (pos) return { time: runClock(Math.round(pos.show)), name: run.why || run.label || t(modeOf(run.setup.mode).label), paused: !!run.pausedAt };
    }
    if (tm && !isDone(tm, clockState.now)) {
      const a = flowData?.acts.find((x) => x.id === tm.actId);
      return { time: clock(remainingSec(tm, clockState.now)), name: a ? actName(a) : t('Stopwatch'), paused: isPaused(tm) };
    }
    if (rec?.on) return { time: runClock(ridingMs(rec.startAt, rec.breaks, now) / 1000), name: t('Ride|page'), paused: !!rec.paused };
    return null;
  });

  const parts = $derived.by(() => {
    const p = ALL_PLACES.find((x) => x.key === place);
    const tabEntry = p ? (PLACE_TABS[place] ?? []).find((x) => x.key === tabOf(place, hash)) : null;
    return { app: t('Pack Generator'), home: page === 'home', place: p ? placeLabel(p) : '', tab: p && tabEntry ? tabLabel(place, tabEntry) : '', h1 };
  });
  const words = $derived(pageTitle(parts));

  $effect(() => {
    document.title = tabTitle({ ...parts, running });
  });

  // screen readers: the new page once after a change of page, never the running time
  let said = $state('');
  let first = true;
  $effect(() => {
    void hash;
    const w = words;
    if (first) {
      first = false;
      return;
    }
    const id = setTimeout(() => (said = w), 400);
    return () => clearTimeout(id);
  });
</script>

<p class="sr" aria-live="polite" data-tab-title-live>{said}</p>
