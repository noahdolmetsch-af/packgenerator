<script>
  /**
   * 0.155.0 «Tageskarte» on Heute (mockup HN3a, in HN4 «Heute neu geordnet», Noah 14.10.2026 21:16 «1a 2b»,
   * 21:51 «HN4 freigegeben»): one fixed card under the meditation card. Its place never changes, only its
   * content follows the part of the day (the one day clock, src/lib/dayclock.js: Morgen 6–11, Tag 11–18,
   * Abend 18–22, Nacht 22–6). The small day clock in the head shows the part; a tap on another part shows
   * that one (nothing changes by itself, the card comes back to now on the next visit).
   *
   * - Morgen: «Wi gaht's?» (the round, the only one on Heute), the weather with the hours, what to wear, Aktiv
   *   (sleep, last activity, next fixed date) and what you set out to do today (Im Flow).
   * - Tag: «Idee für heute» (Schnellstart, Tour planen, Anderes Velo) and «Velos bereit?».
   * - Abend: the evening round, the debrief, log km, bike care.
   * - Nacht: calm; the trip of tomorrow, if there is one.
   * The tiles it took over left the wall (tiles.js REMOVED_0155); everything stays a suggestion: the card
   * can be taken away like any tile, then Im Flow shows the round again.
   */
  import { Sunrise, Sun, Sunset, Moon, Zap, Backpack, Bike, Gauge, Wrench, ChartColumn, CloudSun, Target, Check, ChevronRight, Shirt } from '@lucide/svelte';
  import RoundTile from './RoundTile.svelte';
  import WearToday from './WearToday.svelte';
  import AktivTile from './AktivTile.svelte';
  import { flowQuery } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import { actName } from '../flow/ui.svelte.js';
  import { readyLight, quickHints, LIGHT_WORD } from '../quickcare.js';
  import { bikesHash } from '../bikes.js';
  import { weatherLine } from './heute.js';
  import { wetPct } from '../rainlimit.svelte.js';
  import { dayCardPart, PART_HOURS, addDay } from './heuteneu.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let {
    today,
    now = new Date(),
    fc = null,
    items = [],
    trips = [],
    bikes = [],
    tasks = [],
    visits = [],
    rides = [],
    idea = null, // { text } the suggestion of the day (dry) or null
    onquick,
    onplan,
    onother = null,
    onkm,
    debrief = null, // a trip with its debrief still open, or null
    care = [], // the bike-care rows of «Important today» (text)
    careN = 0,
    tomorrowTrip = null, // { title, href, packed: { packed, of } | null }
  } = $props();

  const NAME = { morning: 'Morning|part', day: 'Day|part', evening: 'Evening|part', night: 'Night|part' };
  const ICON = { morning: Sunrise, day: Sun, evening: Sunset, night: Moon };
  const nowPart = $derived(dayCardPart(now.getHours()));
  let pick = $state(null);
  const part = $derived(pick ?? nowPart);
  const hours = $derived(PART_HOURS.find((p) => p.part === part));
  const hourText = $derived(part === 'morning' ? t('until {h}:00', { h: hours.to }) : t('{a}–{b}:00', { a: hours.from, b: hours.to }));
  const hm = $derived(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  const PartIcon = $derived(ICON[part]);

  // the weather of today: the line of the greeting (from the home forecast) and the hours 7–22
  const day = $derived((fc?.days ?? []).find((d) => d.date === today) ?? null);
  const wx = $derived(fc ? weatherLine(fc, new Date(`${today}T${part === 'morning' ? '08' : '13'}:00:00`)) : null);
  const bars = $derived.by(() => {
    const T = day?.hourly?.t;
    const P = day?.hourly?.p;
    if (!T || T.length !== 24) return [];
    const lo = Math.min(...T.slice(7, 23)) - 2;
    const hi = Math.max(...T.slice(7, 23)) + 1;
    return T.slice(7, 23).map((v, i) => ({ h: 7 + i, t: Math.round(v), pct: Math.round(((v - lo) / Math.max(1, hi - lo)) * 100), wet: P ? wetPct(P[7 + i]) : false }));
  });
  const nextDay = $derived((fc?.days ?? []).find((d) => d.date === addDay(today, 1)) ?? null);

  // «Heute vorgenommen»: the daily goals of Im Flow, done or open
  const fq = $derived(flowQuery(today));
  const goals = $derived($fq ? flowStates($fq.acts, $fq.log, today, $fq.tripDays).filter((s) => !s.resting && s.daily).slice(0, 4) : []);

  // «Velos bereit?»: the light of each bike, as the bike row says it
  const ready = $derived(
    bikes.slice(0, 4).map((b) => {
      const light = readyLight(b, { tasks, visits, today });
      const h = quickHints(b, { visits, today });
      const km = typeof b.km === 'number' ? `${num(b.km)} km` : null;
      let line;
      if (light.tone === 'due') line = [km, tn(light.n, '{n} due', '{n} due')].filter(Boolean).join(' · ');
      else if (light.tone === 'soon') line = h.chain && h.chain.left > 0 && h.chain.left <= 150 ? t('Chain in {km} km', { km: num(h.chain.left) }) : [km, t(LIGHT_WORD.soon)].filter(Boolean).join(' · ');
      else if (light.tone === 'ok') line = [km, t('ready')].filter(Boolean).join(' · ');
      else line = km ?? t('+ log km');
      return { id: b.id, name: b.name, tone: light.tone, line, href: bikesHash({ tab: 'care', bike: b.id, open: true }) };
    }),
  );
</script>

<section class="dk surf" aria-labelledby="dk-h" data-daycard data-part={part}>
  <div class="th">
    <span class="pi" aria-hidden="true"><PartIcon size={18} /></span>
    <h2 id="dk-h">{t('Day card · {part}', { part: t(NAME[part]) })}</h2>
    <span class="hr num">{hourText}</span>
    <span class="sp"></span>
    <div class="clk" role="group" aria-label={t('Day clock')}>
      {#each PART_HOURS as p (p.part)}
        <button type="button" class:on={p.part === part} class:now={p.part === nowPart} aria-pressed={p.part === part} data-clock={p.part} onclick={() => (pick = p.part === nowPart ? null : p.part)}>{t(NAME[p.part])}</button>
      {/each}
    </div>
  </div>

  {#if part === 'morning'}
    <div class="grid g3">
      <div class="c round" data-cell="round"><RoundTile {today} size="w" /></div>
      <div class="c" data-cell="weather">
        <div class="ch"><CloudSun size={16} aria-hidden="true" />{t('Weather')}</div>
        {#if wx}
          <p class="big num">{wx.text}</p>
          {#if bars.length}
            <div class="hrs" aria-hidden="true">{#each bars as b (b.h)}<i class:wet={b.wet} style:height="{Math.max(10, b.pct)}%" title="{b.h}:00 {b.t}°"></i>{/each}</div>
            <div class="hrl num" aria-hidden="true"><span>7</span><span>11</span><span>15</span><span>19</span><span>22</span></div>
          {/if}
          {#if nextDay}<p class="tx num">{t('Tomorrow {min}–{max}°', { min: Math.round(nextDay.min), max: Math.round(nextDay.max) })}</p>{/if}
        {:else}
          <p class="tx">{t('Set your home place: then the weather shows here.')}</p>
        {/if}
      </div>
      <div class="c wear" data-cell="wear">
        <div class="ch wfb"><Shirt size={16} aria-hidden="true" />{t('What to wear')}</div>
        <p class="tx wfb">{t('Nothing in the wardrobe yet: add clothes, then a suggestion shows here.')}</p>
        <WearToday {items} {trips} />
        <div class="acts"><a class="l" href="#/wardrobe"><Shirt size={14} aria-hidden="true" />{t('Wardrobe')}<ChevronRight size={14} aria-hidden="true" /></a></div>
      </div>
      <div class="c s2" data-cell="aktiv"><AktivTile {today} {rides} compact {hm} /></div>
      <div class="c" data-cell="goals">
        <div class="ch"><Target size={16} aria-hidden="true" />{t('Set out for today')}</div>
        {#if goals.length}
          <ul class="tk">
            {#each goals as g (g.act.id)}
              <li class:d={g.todayDone && !g.open}><span class="o" aria-hidden="true">{#if g.todayDone && !g.open}<Check size={12} strokeWidth={3} />{/if}</span>{actName(g.act)}<small>{g.todayDone && !g.open ? t('done|goal') : t('open|goal')}</small></li>
            {/each}
          </ul>
        {:else}
          <p class="tx">{t('No daily goal yet.')}</p>
        {/if}
        <div class="acts"><a class="l" href="#/flow">{t('In the flow')}<ChevronRight size={14} aria-hidden="true" /></a></div>
      </div>
    </div>
  {:else if part === 'day'}
    <div class="grid gt">
      <div class="c" data-cell="idea">
        <div class="ch"><Zap size={16} aria-hidden="true" />{t('Idea for today|card')}{#if wx}<small>{wx.text}</small>{/if}</div>
        <p class="tx">{#if idea}<b>{idea.text}</b> {t('One click: standard items, weather from the forecast, all planned')}{:else}{t('A ride today: one click plans it with the standard items.')}{/if}</p>
        <div class="acts">
          <button type="button" class="btn hi" onclick={onquick} data-daycard-quick><Zap size={16} aria-hidden="true" />{t('Quick start')}</button>
          <button type="button" class="btn" onclick={onplan}><Backpack size={16} aria-hidden="true" />{t('Plan a trip')}</button>
          {#if onother && bikes.length > 1}<button type="button" class="l" onclick={onother}>{t('Other bike')}</button>{/if}
        </div>
      </div>
      <div class="c" data-cell="bikes">
        <div class="ch"><Bike size={16} aria-hidden="true" />{t('Bikes ready?')}</div>
        {#if ready.length}
          <ul class="rd">
            {#each ready as r (r.id)}
              <li class={r.tone}><a href={r.href}><b><i aria-hidden="true"></i>{r.name}</b><span class="num">{r.line}</span></a></li>
            {/each}
          </ul>
        {:else}
          <p class="tx">{t('No bikes yet.')}</p>
        {/if}
      </div>
    </div>
  {:else if part === 'evening'}
    <div class="grid g4">
      <div class="c round" data-cell="round"><RoundTile {today} size="w" /></div>
      <div class="c" data-cell="debrief">
        <div class="ch"><ChartColumn size={16} aria-hidden="true" />{t('Debrief')}</div>
        {#if debrief}
          <p class="tx"><b>{debrief.title}</b>: {t('fill in the debrief · 2 min.')}</p>
          <div class="acts"><a class="btn hi" href="#/debrief/{encodeURIComponent(debrief.id)}">{t('Debrief')}</a></div>
        {:else}
          <p class="tx">{t('No debrief open.')}</p>
        {/if}
        <div class="acts"><a class="l" href="#/pack/past">{t('All debriefs')}<ChevronRight size={14} aria-hidden="true" /></a></div>
      </div>
      <div class="c" data-cell="km">
        <div class="ch"><Gauge size={16} aria-hidden="true" />{t('Log km')}<small>{t('ridden today?')}</small></div>
        <p class="tx">{t('Read the counter and type it: then Bike care knows what is due.')}</p>
        <div class="acts"><button type="button" class="btn" onclick={onkm}>{t('Log km')}</button><a class="l" href="#/debrief/ride">{t('Upload ride')}<ChevronRight size={14} aria-hidden="true" /></a></div>
      </div>
      <div class="c" data-cell="care">
        <div class="ch"><Wrench size={16} aria-hidden="true" />{t('Bike care')}{#if careN}<small>{tn(careN, '{n} due', '{n} due')}</small>{/if}</div>
        {#if care.length}
          <ul class="tk">{#each care.slice(0, 2) as r (r.key)}<li><span class="o" aria-hidden="true"></span>{r.text}</li>{/each}</ul>
        {:else}
          <p class="tx">{t('Nothing due.')}</p>
        {/if}
        <div class="acts"><a class="l" href="#/bikes?tab=care">{t('Bike care')}<ChevronRight size={14} aria-hidden="true" /></a></div>
      </div>
    </div>
  {:else}
    <div class="c night" data-cell="night">
      {#if tomorrowTrip}
        <div class="ch"><Backpack size={16} aria-hidden="true" />{t('Tomorrow: {trip}', { trip: tomorrowTrip.title })}</div>
        <p class="tx">{t('Quiet until 6:00.')}{#if tomorrowTrip.packed} <b>{t('{n} of {m} packed', { n: tomorrowTrip.packed.packed, m: tomorrowTrip.packed.of })}</b>{/if}</p>
        <div class="acts"><a class="l" href={tomorrowTrip.href}>{t('Open the trip')}<ChevronRight size={14} aria-hidden="true" /></a></div>
      {:else}
        <p class="tx">{t('Quiet until 6:00. Good night.')}</p>
      {/if}
    </div>
  {/if}
</section>

<style>
  .dk {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px 20px 20px;
    color: var(--ink);
  }
  .th {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
  }
  .pi {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  h2 {
    margin: 0;
    font: 650 var(--fs-section) / 1.2 var(--font-body);
  }
  .hr {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sp {
    flex: 1;
  }
  .clk {
    display: flex;
    gap: 3px;
    padding: 3px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .clk button {
    min-height: 32px;
    padding: 3px 10px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-3);
    font: 500 var(--fs-tiny) / 1.2 var(--font-body);
    white-space: nowrap;
    cursor: pointer;
  }
  .clk button.now {
    color: var(--ink-2);
    font-weight: 600;
  }
  .clk button.on {
    background: var(--paper);
    color: var(--accent);
    font-weight: 650;
    box-shadow: 0 0 0 1.5px var(--accent) inset;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .grid.gt {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }
  .grid.g4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .c {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: 14px;
    background: var(--paper);
  }
  .c.s2 {
    grid-column: span 2;
  }
  .c.round :global(.rt) {
    padding: 0;
    border: 0;
    background: none;
    box-shadow: none;
  }
  .c.wear:has(:global(.wear)) .wfb {
    display: none;
  }
  .c.wear :global(.wear) {
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    box-shadow: none;
  }
  .ch {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    font-weight: 600;
  }
  .ch :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .ch small {
    margin-left: auto;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 500;
  }
  .big {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .tx {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .tx b {
    color: var(--ink);
  }
  .hrs {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 44px;
  }
  .hrs i {
    flex: 1;
    border-radius: 2px 2px 0 0;
    background: color-mix(in srgb, var(--accent) 45%, var(--paper));
  }
  .hrs i.wet {
    background: color-mix(in srgb, var(--l3) 70%, var(--paper));
  }
  .hrl {
    display: flex;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-top: auto;
  }
  .l {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .tk {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .tk li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .tk small {
    margin-left: auto;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .o {
    display: grid;
    flex: none;
    place-items: center;
    width: 18px;
    height: 18px;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
    color: var(--paper);
  }
  .tk li.d .o {
    border-color: var(--accent);
    background: var(--accent);
  }
  .rd {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rd a {
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
    min-height: 44px;
    padding: 10px 12px;
    box-sizing: border-box;
    border: 1px solid var(--card-line);
    border-radius: 12px;
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .rd b {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-wrap: break-word;
  }
  .rd i {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid var(--ink-3);
  }
  .rd .ok i {
    border-color: var(--ok);
    background: var(--ok);
  }
  .rd .soon i {
    border-color: var(--warn);
    background: var(--warn);
  }
  .rd .due i {
    border-color: var(--bad);
    background: var(--bad);
  }
  .rd .due a {
    border-color: color-mix(in srgb, var(--bad) 45%, var(--paper));
  }
  .rd span {
    color: var(--ink-3);
  }
  .night {
    border: 0;
    padding: 0;
  }
  @media (max-width: 1100px) {
    .grid.g4,
    .rd {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 719px) {
    .dk {
      padding: 14px 12px;
    }
    h2 {
      font-size: var(--fs-sub);
    }
    .clk {
      width: 100%;
    }
    .clk button {
      flex: 1;
      min-height: 44px;
      padding: 4px 2px;
    }
    .grid,
    .grid.gt,
    .grid.g4 {
      grid-template-columns: minmax(0, 1fr);
    }
    .c.s2 {
      grid-column: auto;
    }
  }
</style>
