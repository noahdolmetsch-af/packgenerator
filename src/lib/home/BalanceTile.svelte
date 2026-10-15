<script>
  /**
   * v0.127.0 «Tages-Check» 2 (mockup T3, Noah 13.10.2026 «T1–T4 freigegeben»): «Deine Balance» on Heute. A
   * ring of the 9 categories for the last 7 days (balance.js): each segment as deep as its value 0–100, a
   * light one where nothing is known yet. Nothing is invented: an empty category shows «–».
   * WG: the answers of «Wi gaht's?» count too (balance.js answerSignals).
   *
   * 0.155.0 HN4b-1 «Balance kompakt» (Noah 14.10.2026 22:11 «1a», 22:12 «2 a und b, 3a», 22:13 «HN4b
   * freigegeben»): beside Im Flow, smaller and richer. A small ring (92 px) with the 9 values in 3 columns
   * and «Am wenigsten», then four pieces (2 × 2; a phone: one under the other): the running challenge, an
   * inspiration (the gentle tip of the weakest area, CATS[].tip; the link «Mehr Ideen» waits for the own
   * ideas of 0.158.0 and stays hidden), the next milestone and the body (resting pulse from «Wi gaht's?»,
   * active zone minutes with Fitbit). Without any value (release analysis D8): no empty ring, one quiet line.
   */
  import { liveQuery } from 'dexie';
  import { Activity, ChevronRight, Trophy, Lightbulb, Star, HeartPulse } from '@lucide/svelte';
  import { db } from '../db.js';
  import { balanceQuery } from '../flow/data.svelte.js';
  import { abQuery } from '../abdb.js';
  import { balance, ringPaths, CATS, CAT } from '../balance.js';
  import { CHALLENGES_KEY, suggestKey } from '../challenge.js';
  import { nextMilestone } from './bausteine.js';
  import { challengeNow, bodyNow } from './heuteneu.js';
  import { phone } from '../media.svelte.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { today, size = 'l', isnew = false, bikes = [], tripsDone = 0 } = $props();
  const q = $derived(balanceQuery(today));
  const data = $derived($q);
  const b = $derived(data ? balance({ ...data, today }) : null);
  const R = $derived(phone.matches ? 80 : 92);
  const paths = $derived(b ? ringPaths(b.cats, R, { inner: 0.3 }) : []);
  /** The colour of each category: tokens only, so every colour world and dark mode keeps them apart. */
  const COLOR = {
    fun: 'var(--l2)',
    rest: 'var(--l3)',
    sport: 'color-mix(in srgb, var(--l2) 50%, var(--bad))',
    mind: 'var(--l4)',
    friends: 'color-mix(in srgb, var(--bad) 55%, var(--paper))',
    nature: 'var(--l1)',
    vision: 'color-mix(in srgb, var(--l2) 55%, var(--l1))',
    goals: 'color-mix(in srgb, var(--l3) 55%, var(--l1))',
    done: 'color-mix(in srgb, var(--l2) 40%, var(--ink-3))',
  };
  const val = (v) => (v == null ? '–' : String(v));
  const said = $derived(b ? b.cats.map((c) => `${t(CAT[c.key].label)} ${val(c.value)}`).join(', ') : '');
  const empty = $derived(!!b && b.mean == null);

  // the challenge: the records of lib/challenge.js (set and ticked on «Heute baden oder Sauna?»)
  const chQ = liveQuery(async () => {
    const c = await db.settings.get(CHALLENGES_KEY);
    const list = Array.isArray(c?.value) ? c.value : [];
    const areas = [...new Set(list.map((x) => x?.area).filter(Boolean))];
    const rows = await db.settings.bulkGet(areas.map(suggestKey));
    return { list, suggests: Object.fromEntries(areas.map((a, i) => [a, rows[i]?.value ?? null])) };
  });
  const ch = $derived($chQ ? challengeNow($chQ.list, $chQ.suggests, today) : null);
  const untilWord = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'UTC' });
  const ms = $derived(nextMilestone({ bikes, tripsDone }));
  const abq = $derived(abQuery(today));
  const body = $derived(bodyNow($abq?.answers ?? [], today));
  const tip = $derived(b?.least ? CAT[b.least] : null);
  /** 7 values as a quiet line without axes (the resting pulse). */
  function spark(vals, w = 64, h = 20) {
    if (vals.length < 2) return '';
    const lo = Math.min(...vals) - 1;
    const hi = Math.max(...vals) + 1;
    return vals.map((v, i) => `${Math.round((i / (vals.length - 1)) * (w - 4)) + 2},${Math.round(h - 3 - ((v - lo) / (hi - lo)) * (h - 6))}`).join(' ');
  }
  const line = $derived(spark(body.days));
</script>

<section class="bl surf {size}" aria-labelledby="bl-h" data-section="balance" data-empty={empty || undefined}>
  <div class="hd">
    <span class="ico" aria-hidden="true"><Activity size={16} /></span>
    <h2 id="bl-h">{t('Your balance')}</h2>
    <span class="sd">{t('last 7 days')}</span>
    {#if isnew}<span class="nw">{t('new|tile')}</span>{/if}
    <a class="go" href="#/flow" aria-hidden="true" tabindex="-1" title={t('Open')}><ChevronRight size={16} strokeWidth={2.4} /></a>
  </div>
  {#if b && !empty}
    <div class="top">
      <svg class="ring" viewBox="0 0 {R} {R}" width={R} height={R} role="img" aria-label={t('Balance of the last 7 days: {list}', { list: said })}>
        {#each paths as p (p.key)}
          <path d={p.bg} style:fill="color-mix(in srgb, {COLOR[p.key]} 16%, var(--paper))" />
          {#if p.fg}<path d={p.fg} style:fill={COLOR[p.key]} data-seg={p.key} />{/if}
        {/each}
        <text x={R / 2} y={R / 2 + 6} class="mn num" text-anchor="middle">{val(b.mean)}</text>
      </svg>
      <div class="tl">
        <ul class="lg">
          {#each CATS as c (c.key)}
            {@const v = b.cats.find((x) => x.key === c.key)?.value ?? null}
            <li data-cat={c.key} class:lo={b.least === c.key}><i style:background={COLOR[c.key]} aria-hidden="true"></i><span>{t(c.label)}</span><em class="num">{val(v)}</em></li>
          {/each}
        </ul>
        {#if b.least}<p class="least" data-least={b.least}>{t('Least:')} <b>{t(CAT[b.least].label)}</b></p>{/if}
      </div>
    </div>
  {:else if b}
    <!-- release analysis D8: no big empty ring with «–»; one quiet line instead -->
    <p class="calm" data-balance-empty>{t('Your balance fills by itself as soon as you answer «Wi gaht\'s?» or tick something in Aktiv.')}</p>
  {/if}
  <ul class="pcs">
    <li class="pc" data-pc="challenge">
      <span class="k"><Trophy size={14} aria-hidden="true" />{t('Challenge')}</span>
      {#if ch}
        <b class="v">{t(ch.what)} <span class="n num">{ch.n}/{ch.times}</span></b>
        <span class="br" aria-hidden="true"><i style:width="{Math.round((ch.n / ch.times) * 100)}%"></i></span>
        <span class="su">{t('until {day}', { day: untilWord(ch.until) })}</span>
      {:else}
        <span class="su q">{t('None running. Set one on «Swim or sauna?».')}</span>
      {/if}
    </li>
    <li class="pc" data-pc="inspiration">
      <span class="k"><Lightbulb size={14} aria-hidden="true" />{t('Inspiration')}</span>
      {#if tip}
        <b class="v t">{t(tip.tip)}</b>
        <span class="su">{t('{area} has the least', { area: t(tip.label) })}</span>
      {:else}
        <span class="su q">{t('An idea comes once three areas have a value.')}</span>
      {/if}
      <!-- «Mehr Ideen ›» (HN4b 2b) waits for the own ideas list of 0.158.0 -->
    </li>
    <li class="pc" data-pc="milestone">
      <span class="k"><Star size={14} aria-hidden="true" />{t('Milestone')}</span>
      {#if ms}
        <b class="v num">{#if ms.kind === 'bike'}{num(ms.left)} km <span class="n">{t('to {at}', { at: num(ms.at) })}</span>{:else}{tn(ms.left, 'One more trip', '{n} more trips')}{/if}</b>
        <span class="br" aria-hidden="true"><i style:width="{Math.round(ms.share * 100)}%"></i></span>
        <span class="su">{ms.kind === 'bike' ? ms.bike : t('to your {at}th trip', { at: num(ms.at) })}</span>
      {:else}
        <span class="su q">{t('Your first ride or trip starts the count.')}</span>
      {/if}
    </li>
    <li class="pc" data-pc="body">
      <span class="k"><HeartPulse size={14} aria-hidden="true" />{t('Body')}</span>
      <span class="kr"><span class="kl">{t('Resting pulse')}</span><b class="v num">{body.pulse ?? '–'}{#if body.pulse}<span class="n"> /min</span>{/if}</b>{#if line}<svg class="sp" width="64" height="20" viewBox="0 0 64 20" aria-hidden="true"><polyline points={line} /></svg>{/if}</span>
      {#if body.lo != null && body.hi !== body.lo}<span class="su num">{t('7 days: {lo}–{hi}', { lo: body.lo, hi: body.hi })}</span>{/if}
      <span class="kr"><span class="kl">{t('Active zone min.')}</span><b class="v num">–<span class="n"> / 150</span></b></span>
      <span class="su q">{t('comes with Fitbit; the pulse you can type in «Wi gaht\'s?»')}</span>
    </li>
  </ul>
</section>

<style>
  .bl {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    padding: 14px 18px 16px;
    box-sizing: border-box;
    color: var(--ink);
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ico {
    display: grid;
    flex: none;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .sd {
    flex: 1;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nw {
    padding: 0 8px;
    border-radius: 10px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .go {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: var(--ink-2);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }
  .ring {
    flex: none;
  }
  .mn {
    fill: var(--ink);
    font: 700 var(--fs-sub) / 1 var(--font-body);
  }
  .tl {
    flex: 1;
    min-width: 0;
  }
  .lg {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 3px 12px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-tiny);
  }
  .lg li {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
  }
  .lg li.lo span {
    font-weight: 650;
  }
  .lg i {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
  .lg span {
    min-width: 0;
    overflow: hidden;
    color: var(--ink-2);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lg em {
    margin-left: auto;
    color: var(--ink-3);
    font-style: normal;
  }
  .least {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .least b {
    color: var(--ink);
    font-weight: 600;
  }
  .calm {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pcs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pc {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .k {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
    line-height: 1.25;
  }
  .k :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .v {
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
    overflow-wrap: break-word;
  }
  .v.t {
    font-size: var(--fs-small);
    line-height: 1.3;
  }
  .v .n {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 500;
  }
  .su {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .br {
    display: block;
    height: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--line);
  }
  .br i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--accent);
  }
  .kr {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0 6px;
  }
  .kl {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .kr .v {
    font-size: var(--fs-body);
  }
  .sp {
    align-self: center;
  }
  .sp polyline {
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 1.6;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  @media (max-width: 719px) {
    .bl {
      padding: 14px;
      gap: 10px;
    }
    .go {
      width: 44px;
      height: 44px;
      margin: -8px -8px -8px 0;
    }
    .least {
      display: none;
    }
    .pcs {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
