<script>
  /**
   * «Eigenes Diagramm» D6 «Ein Tag, alle Werte»: a tapped day with every value it has, as boxes (name,
   * value, where it comes from); the ticked activities of Aktiv together in one box. Day before and next
   * day. A tap on a box opens the page of that value (M6).
   * day; groups: analyseGroups(); tripName: the trip on that day or ''; today; onday(day); onclose().
   * On top the «Tagesbild» (idea «Tagesbild»): the 24 hours with sleep, steps and pulse per hour, rides and
   * ticks; rowOf(day): the day of the table; log, acts: Aktiv (for the ticks and their names).
   */
  import { X, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { backClose } from '../../lib/ui/backclose.js';
  import { valueText, unitText } from '../../lib/analyse/format.js';
  import { detailHref } from '../../lib/analyse/catalog.js';
  import { addDays } from '../../lib/analyse.js';
  import { dayPicture } from '../../lib/analyse/daypicture.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';
  import { niceScale, tickText } from '../../lib/charts/axis.js';
  import GridLines from '../../lib/charts/GridLines.svelte';
  import YTicks from '../../lib/charts/YTicks.svelte';

  let { day, groups = [], tripName = '', today, onday, onclose, rowOf = null, log = [], acts = [] } = $props();
  let dialog;
  $effect(() => {
    dialog.showModal();
  });

  const SRC = { fitbit: 'Fitbit', strava: 'Strava', body: 'Body|group', check: "Wi gaht's?|analyse", aktiv: 'Aktiv' };
  const items = $derived(
    groups
      .flatMap((g) => g.items)
      .filter((x) => !x.later && x.get && !x.tick)
      .map((x) => ({ ...x, value: x.get(day) }))
      .filter((x) => x.value != null && Number.isFinite(x.value)),
  );
  const ticked = $derived(
    groups
      .flatMap((g) => g.items)
      .filter((x) => x.tick && x.get && x.get(day))
      .map((x) => x.name),
  );
  const pic = $derived(
    rowOf
      ? dayPicture(
          rowOf(day),
          log.filter((e) => e.day === day),
          (id) => {
            const a = acts.find((x) => x.id === id);
            return a ? actName(a) : '';
          },
        )
      : { any: false },
  );
  const PW = 480;
  const PH = 150;
  const TOP = 10; // the value area: from TOP down to the base line at PH - 18
  const BOT = PH - 18;
  const px = (h) => (h / 24) * PW;
  // round, labelled steps (Noah «genaue Werte»): pulse on the left, steps on the right
  const ssc = $derived(niceScale(pic.steps ?? [], { zero: true, count: 3 }));
  const hsc = $derived(niceScale(pic.hr ?? [], { count: 3 }));
  const stY = (v) => BOT - ((v - ssc.lo) / (ssc.hi - ssc.lo || 1)) * (BOT - TOP);
  const hrY = (v) => BOT - ((v - hsc.lo) / (hsc.hi - hsc.lo || 1)) * (BOT - TOP);
  let hour = $state(null); // a tapped hour
  function tapHour(e) {
    const r = e.currentTarget.getBoundingClientRect();
    hour = Math.max(0, Math.min(23, Math.floor(((e.clientX - r.left) / r.width) * 24)));
  }
  const hrPath = $derived.by(() => {
    if (!pic.hr) return '';
    let d = '';
    let pen = false;
    pic.hr.forEach((v, i) => {
      if (v == null) return (pen = false);
      d += `${pen ? 'L' : 'M'}${px(i + 0.5).toFixed(1)} ${hrY(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  });
  const clock = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;
  const title = $derived(new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }));
</script>

<dialog class="sheet from-below ds" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="ds-h" data-day-sheet={day}>
  <div class="head">
    <h2 id="ds-h">{t('One day, all values|diagram')}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="sub">{title}{#if tripName}&nbsp;· {t('Trip|analyse')}: {tripName}{/if}</p>
  {#if pic.any}
    <section class="pic" aria-labelledby="ds-pic" data-day-picture>
      <h3 id="ds-pic">{t('Picture of the day|daypic')}</h3>
      {#if hour != null}<p class="hv" data-pic-hour aria-live="polite"><b>{clock(hour)}–{clock(hour + 1)}</b>{#if pic.steps}&nbsp;· {num(pic.steps[hour] ?? 0)} {t('steps|daypic')}{/if}{#if pic.hr?.[hour] != null}&nbsp;· {t('pulse|daypic')} {num(Math.round(pic.hr[hour]))} bpm{/if}{#if pic.sleep.some((sl) => sl.from < hour + 1 && sl.to > hour)}&nbsp;· {t('Sleep|flow')}{/if}</p>{/if}
      <div class="pp">
      {#if pic.hr}<YTicks ticks={hsc.ticks} y={hrY} h={PH} text={(v) => tickText(v, hsc.step, num)} unit="bpm" color="var(--pz6)" width={56} />{/if}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
      <svg viewBox="0 0 {PW} {PH}" role="img" aria-label={t('The 24 hours of the day|daypic')} onclick={tapHour}>
        {#if pic.steps}<GridLines ticks={ssc.ticks} y={stY} x1={0} x2={PW} />{:else if pic.hr}<GridLines ticks={hsc.ticks} y={hrY} x1={0} x2={PW} />{/if}
        {#each pic.sleep as sl, i (i)}<rect class="sl" x={px(sl.from)} width={Math.max(1, px(sl.to) - px(sl.from))} y="0" height={PH - 18} data-pic-sleep><title>{t('Sleep|flow')} {clock(sl.from)}–{clock(sl.to)}</title></rect>{/each}
        {#if pic.steps}{#each pic.steps as v, i (i)}{#if v}<rect class="st" x={px(i) + 2} width={PW / 24 - 4} y={stY(v)} height={BOT - stY(v)} data-pic-steps><title>{clock(i)}: {num(v)} {t('steps|daypic')}</title></rect>{/if}{/each}{/if}
        {#each pic.rides as r, i (i)}<rect class="rd" x={px(r.from)} width={Math.max(3, px(r.to) - px(r.from))} y={PH - 30} height="8" rx="3" data-pic-ride><title>{clock(r.from)} {r.name}</title></rect>{/each}
        {#if hrPath}<path class="hr" d={hrPath} data-pic-hr />{/if}
        {#each pic.ticks as k, i (i)}<circle class="tk" cx={px(k.h)} cy={PH - 12} r="4" data-pic-tick><title>{clock(k.h)} {k.name}</title></circle>{/each}
        <line class="base" x1="0" x2={PW} y1={BOT} y2={BOT} />
        {#if hour != null}<rect class="hh" x={px(hour)} width={PW / 24} y="0" height={BOT} />{/if}
      </svg>
      {#if pic.steps}<YTicks ticks={ssc.ticks} y={stY} h={PH} text={(v) => tickText(v, ssc.step, num)} side="right" width={56} />{/if}
      </div>
      <div class="hx" aria-hidden="true" style="margin-inline:{pic.hr ? 62 : 0}px {pic.steps ? 62 : 0}px"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div>
      <ul class="legend">
        {#if pic.sleep.length}<li><i class="lg sl"></i>{t('Sleep|flow')}</li>{/if}
        {#if pic.steps}<li><i class="lg st"></i>{t('steps per hour|daypic')}</li>{/if}
        {#if pic.hr}<li><i class="lg hr"></i>{t('pulse per hour|daypic')}</li>{/if}
        {#if pic.rides.length}<li><i class="lg rd"></i>{t('rides|daypic')}</li>{/if}
        {#if pic.ticks.length}<li><i class="lg tk"></i>{t('ticks|daypic')}: {pic.ticks.map((k) => `${clock(k.h)} ${k.name}`).join(', ')}</li>{/if}
      </ul>
      <p class="hint">{t('Tap an hour for its exact values.|daypic')}</p>
    </section>
  {/if}
  {#if items.length || ticked.length}
    <ul class="boxes">
      {#each items as x (x.key)}
        <li>
          <a class="box" href={detailHref(x.key)} onclick={() => dialog.close()}>
            <span class="nm">{x.name}</span>
            <b class="num">{valueText(x, x.value, num)}{#if unitText(x)}<small>{unitText(x)}</small>{/if}</b>
            <span class="src">{x.own ? t('own calculation|own') : t(SRC[x.src] ?? SRC.body)}</span>
          </a>
        </li>
      {/each}
      {#if ticked.length}
        <li>
          <div class="box" data-ticked>
            <span class="nm">{t('Ticked|diagram')}</span>
            <b>{ticked.join(', ')}</b>
            <span class="src">Aktiv</span>
          </div>
        </li>
      {/if}
    </ul>
  {:else}
    <p class="hint">{t('No values on this day.|analyse')}</p>
  {/if}
  <div class="foot">
    <button type="button" class="btn" data-prev onclick={() => onday?.(addDays(day, -1))}><ChevronLeft size={16} aria-hidden="true" />{t('Day before|analyse')}</button>
    <button type="button" class="btn" data-next disabled={day >= today} onclick={() => onday?.(addDays(day, 1))}>{t('Next day|analyse')}<ChevronRight size={16} aria-hidden="true" /></button>
  </div>
</dialog>

<style>
  .pic {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }
  .pic h3 {
    margin: 0;
    font-size: var(--fs-body);
  }
  .pp {
    display: flex;
    gap: 6px;
    min-width: 0;
  }
  .pic svg {
    flex: 1;
    min-width: 0;
    width: 100%;
    height: auto;
    cursor: crosshair;
  }
  .hh {
    fill: var(--ink);
    fill-opacity: 0.06;
  }
  .hv {
    margin: 0;
    font-size: var(--fs-small);
  }
  .pic .base {
    stroke: var(--line);
  }
  rect.sl,
  .lg.sl {
    fill: color-mix(in srgb, var(--l3) 18%, transparent);
    background: color-mix(in srgb, var(--l3) 25%, var(--paper));
  }
  rect.st,
  .lg.st {
    fill: color-mix(in srgb, var(--l1) 45%, var(--paper));
    background: color-mix(in srgb, var(--l1) 45%, var(--paper));
  }
  rect.rd,
  .lg.rd {
    fill: var(--pz5);
    background: var(--pz5);
  }
  .hr {
    fill: none;
    stroke: var(--pz6);
    stroke-width: 2;
  }
  .lg.hr {
    height: 2px;
    background: var(--pz6);
  }
  circle.tk,
  .lg.tk {
    fill: var(--pz3);
    background: var(--pz3);
  }
  .lg.tk {
    border-radius: 50%;
  }
  .hx {
    display: flex;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lg {
    display: inline-block;
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  .ds {
    width: min(560px, calc(100vw - 24px));
  }
  .head,
  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .foot {
    margin-top: 14px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .sub {
    margin: 0 0 10px;
    color: var(--ink-2);
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .boxes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    max-height: min(56vh, 520px);
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .box {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
    color: var(--ink);
    text-decoration: none;
  }
  a.box:hover {
    outline: 1px solid var(--line);
  }
  .box b {
    font-size: var(--fs-sub);
    overflow-wrap: break-word;
  }
  .box b small {
    margin-left: 3px;
    font-weight: 400;
    font-size: var(--fs-small);
  }
  .nm,
  .src {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint {
    color: var(--ink-3);
  }
</style>
