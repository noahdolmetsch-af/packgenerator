<script>
  /**
   * Paket M «3 Beobachtungen pro Woche» (#294, #14, #247) on the week review (#/flow/review): three cards,
   * each a plain sentence and a small chart (bars or two groups side by side), worked out on the device from
   * your own data (lernen/beobachtungen.js). From Sunday on for the running week, then frozen (db.settings
   * 'beobachtungen'), so they stay the same. «Diese Art nicht mehr zeigen» hides a kind, «Ausschalten» all
   * three; «Ältere Wochen» folds the earlier weeks. Observation only: what was, never what is good.
   */
  import { liveQuery } from 'dexie';
  import { EyeOff, Eye } from '@lucide/svelte';
  import { db } from '../db.js';
  import Fold from '../ui/Fold.svelte';
  import { SLEEP_Q, MOOD_Q } from '../weekreview.js';
  import { normAct } from '../flow.js';
  import { loadDayData } from '../daydata.js';
  import { OBS_KEY, KIND_NAMES, obsOf, weekView, setKind, olderWeeks } from './beobachtungen.js';
  import { t } from '../i18n.svelte.js';
  import { sentence, label, value, chartText } from './obswords.js';
  import { shiftDay } from '../training.js';
  import '../trip/trip.css';

  let { monday, today } = $props();

  const q = liveQuery(async () => {
    const [acts, rides, trips, health, answers, checks, log, flowActs, rec] = await Promise.all([
      db.activities.toArray(),
      db.rides.toArray(),
      db.trips.toArray(),
      db.healthDays.toArray(),
      db.abAnswers.where('qid').anyOf([SLEEP_Q, MOOD_Q]).toArray(),
      db.flowChecks.toArray(),
      db.flowLog.toArray(),
      db.flowActs.toArray(),
      db.settings.get(OBS_KEY),
    ]);
    const { weather } = await loadDayData(db);
    return { data: { acts, rides, trips, health, answers, checks, log, flowActs: flowActs.map(normAct), weather }, value: rec?.value ?? null };
  });
  const view = $derived($q ? weekView($q.value, $q.data, monday, today) : null);
  const cfg = $derived(obsOf($q?.value));
  const older = $derived($q ? olderWeeks($q.value, monday) : []);
  // a week worked out for the first time is frozen right away, so it stays the same
  $effect(() => {
    if (view?.state === 'new' && view.store) db.settings.put({ key: OBS_KEY, value: $state.snapshot(view.store) });
  });
  const save = (value) => db.settings.put({ key: OBS_KEY, value: $state.snapshot(value) });

  /* the chart: bars (up to 7) or two groups */
  const W = 280;
  const H = 96;
  function bars(c) {
    const list = c.bars;
    const max = Math.max(1, ...list.map((x) => x.v ?? 0));
    const gap = 8;
    const bw = (W - gap * (list.length - 1)) / list.length;
    return list.map((x, i) => {
      const h = x.v ? Math.max(3, ((x.v ?? 0) / max) * (H - 34)) : 0;
      return { ...x, x: i * (bw + gap), w: bw, h, y: H - 18 - h, text: label(x.l) };
    });
  }
  const anyKinds = $derived(cfg.offKinds.length);
</script>

<section class="card obs" data-wr="obs" aria-labelledby="wr-obs">
  <div class="oh">
    <h2 id="wr-obs">{t('3 observations')}</h2>
    {#if cfg.on}<button type="button" class="tp-link quiet" onclick={() => save({ ...cfg, on: false })} data-obs-off>{t('Switch off|obs')}</button>{/if}
  </div>
  <p class="cap">{t('Worked out on this device from your data, every Sunday. Only what was, nothing is rated.')}</p>

  {#if !view}
    <p class="cap">…</p>
  {:else if view.state === 'off'}
    <p class="quiet" data-obs-state="off">{t('The 3 observations are switched off.')} <button type="button" class="tp-link" onclick={() => save({ ...cfg, on: true })} data-obs-on>{t('Switch on|obs')}</button></p>
  {:else if view.state === 'waiting'}
    <p class="quiet" data-obs-state="waiting">{t('On Sunday 3 observations about this week come here.')}</p>
  {:else if view.state === 'thin' || !view.list.length}
    <p class="quiet" data-obs-state="thin">{t('Still too little data for an observation. With Strava, Fitbit and «How are you?» more comes in over the weeks.')}</p>
  {:else}
    {#if view.state === 'live'}<p class="cap" data-obs-live>{t('Worked out from today\'s data; it stays fixed from Monday on.')}</p>{/if}
    <ul class="cards" data-obs-state={view.state}>
      {#each view.list as o (o.kind)}
        {@const c = o.chart}
        <li class="oc" data-obs={o.kind} data-obs-key={o.key}>
          <span class="kind">{t(KIND_NAMES[o.kind])}</span>
          <p class="say">{sentence(o)}</p>
          {#if c?.type === 'bars'}
            <svg class="ch" viewBox="0 0 {W} {H}" role="img" aria-label={chartText(c)}>
              {#each bars(c) as b, i (i)}
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" class:hi={b.hi} />
                {#if b.v != null && c.unit !== 'minutes'}<text x={b.x + b.w / 2} y={b.y - 4} text-anchor="middle" class="val">{value(b.v, c.unit)}</text>{/if}
                <text x={b.x + b.w / 2} y={H - 4} text-anchor="middle" class="lab">{b.text}</text>
              {/each}
            </svg>
            {#if c.upto}<p class="cap small" data-obs-upto>{t('Every week counted for its first {n} days, like this week so far.', { n: c.upto })}</p>{/if}
          {:else if c?.type === 'two'}
            {@const max = Math.max(1, c.a.v ?? 0, c.b.v ?? 0)}
            <div class="two" role="img" aria-label={chartText(c)}>
              {#each [c.a, c.b] as g, i (i)}
                <div class="tg" aria-hidden="true">
                  <span class="tl">{label(g.l)} <small class="num">· {t('{n} days', { n: g.n })}</small></span>
                  <span class="tb"><i class:hi={i === 0} style:width="{((g.v ?? 0) / max) * 100}%"></i></span>
                  <b class="num">{value(g.v, c.unit)}</b>
                </div>
              {/each}
            </div>
          {/if}
          <a class="tp-link detail" href="#/flow/review/obs?kind={o.kind}&w={monday}" data-obs-detail={o.kind}>{t('All numbers behind it')}</a>
          <button type="button" class="tp-link hide" onclick={() => save(setKind(cfg, o.kind, false))} data-obs-hide={o.kind}><EyeOff size={14} aria-hidden="true" />{t('Do not show this kind any more')}</button>
        </li>
      {/each}
    </ul>
    {#if view.list.length < 3 && view.few?.length}<p class="cap" data-obs-few>{t('For more, data is still missing: {kinds}.', { kinds: view.few.map((k) => t(KIND_NAMES[k])).join(', ') })}</p>{/if}
  {/if}

  {#if anyKinds && cfg.on}
    <p class="cap hidden">{t('Hidden:')} {#each cfg.offKinds as k (k)}<button type="button" class="tp-link" onclick={() => save(setKind(cfg, k, true))} data-obs-show={k}><Eye size={14} aria-hidden="true" />{t(KIND_NAMES[k])}</button>{' '}{/each}</p>
  {/if}

  {#if older.length && cfg.on}
    <Fold label={t('Older weeks')} summary={t('{n} weeks', { n: older.length })}>
      <ul class="older" data-obs-older>
        {#each older as w (w.key)}
          <li><b class="num">{t('Wk {n}', { n: Number(w.key.slice(6)) })} {w.key.slice(0, 4)}</b><ul>{#each w.list as o (o.kind)}<li>{sentence(o)}</li>{/each}</ul></li>
        {/each}
      </ul>
    </Fold>
  {/if}
</section>

<style>
  .obs {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
    margin: 0;
    padding: var(--sp-4);
  }
  .oh {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 12px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .cap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .quiet {
    margin: 0;
    color: var(--ink-2);
  }
  .cards {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 900px) {
    .cards {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .oc {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding: var(--sp-3);
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .kind {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .say {
    margin: 0;
    overflow-wrap: break-word;
  }
  .ch {
    display: block;
    width: 100%;
    height: 96px;
  }
  .ch rect {
    fill: var(--line);
  }
  .ch rect.hi {
    fill: var(--hi);
  }
  .ch text {
    font: 500 var(--fs-small) / 1 var(--font-body);
  }
  .ch .lab {
    fill: var(--ink-3);
  }
  .ch .val {
    fill: var(--ink);
  }
  .two {
    display: grid;
    gap: 8px;
  }
  .tg {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 10px;
    align-items: center;
  }
  .tl {
    grid-column: 1 / -1;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tl small {
    color: var(--ink-3);
  }
  .tb {
    display: block;
    height: 10px;
    border-radius: 99px;
    background: var(--paper);
    overflow: hidden;
  }
  .tb i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--ink-3);
  }
  .tb i.hi {
    background: var(--hi);
  }
  .tg b {
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .hide,
  .detail {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 4px;
    min-height: 44px;
    font-size: var(--fs-small);
  }
  .small {
    font-size: var(--fs-small);
  }
  .hidden .tp-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
  }
  .older {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0 0 8px;
    list-style: none;
  }
  .older ul {
    margin: 4px 0 0;
    padding-left: 18px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
