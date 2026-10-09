<script>
  /**
   * v0.51.0 «Im Flow»: the countdown as a sheet from below (Noah 7: a countdown to the target time,
   * then it ends). A ring that empties, the time, Pause and «Fertig · abhaken». The singing bowl
   * (Noah 8): at the start and the end, plus optional bowls in between, chosen for this session or
   * kept as the default: regularly every N minutes, at chosen minute marks, or at random times.
   * The arrow down makes it small: it floats bottom right and keeps running on every page.
   */
  import { ChevronDown, Pause, Play, Bell, BellOff, Timer } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { db } from '../db.js';
  import { ui, clockState, startClock, togglePause, finishClock, stopClock, actName } from './ui.svelte.js';
  import { elapsedSec, remainingSec, isDone, clock, DURATIONS } from '../flowtimer.js';
  import { BOWL_KEY, BOWL_MODES, bowlOf, bowlTimes, nextBowl, parseMarks } from '../flowbowl.js';
  import { t } from '../i18n.svelte.js';

  let { states = [], bowl: bowlDefault } = $props();
  let dlg = $state();
  let all = $state(false);
  let pick = $state(null);
  let minutes = $state(10);
  let bowl = $state(bowlOf(null));
  let marksText = $state('');
  let saved = $state(false);

  const tm = $derived(clockState.tm);
  const now = $derived(clockState.now);
  const running = $derived(!!tm);
  const done = $derived(running && isDone(tm, now));
  const live = $derived(states.filter((s) => !s.resting));
  // the first three with a minimum duration (Meditation, Yoga, Stretching), «all» shows every one
  const shortList = $derived.by(() => {
    const timed = live.filter((s) => s.act.minMin > 0);
    return (timed.length ? timed : live).slice(0, 3);
  });
  const choices = $derived(all ? live : shortList.some((s) => s.act.id === pick) || !pick ? shortList : [...shortList, live.find((s) => s.act.id === pick)].filter(Boolean));
  const chosen = $derived(live.find((s) => s.act.id === (tm?.actId ?? pick)) ?? null);

  $effect(() => {
    if (ui.timerOpen && dlg && !dlg.open) {
      if (!clockState.tm) {
        pick = clockState.pick ?? shortList[0]?.act.id ?? null;
        clockState.pick = null;
        minutes = live.find((s) => s.act.id === pick)?.act.minMin || 10;
        bowl = bowlOf(bowlDefault);
        marksText = bowl.marks.join(', ');
        saved = false;
      }
      dlg.showModal();
    }
    if (!ui.timerOpen && dlg?.open) dlg.close();
  });
  function choose(id) {
    pick = id;
    minutes = live.find((s) => s.act.id === id)?.act.minMin || minutes;
  }
  const small = () => (ui.timerOpen = false);
  function start() {
    if (!pick) return;
    startClock(pick, minutes, { ...bowl, marks: parseMarks(marksText) }, clockState.sub);
    clockState.sub = null;
  }
  async function keepDefault() {
    await db.settings.put({ key: BOWL_KEY, value: { ...bowl, marks: parseMarks(marksText) } });
    saved = true;
  }
  function cancel() {
    stopClock();
    ui.timerOpen = false;
  }
  const plan = $derived(running ? tm.bowls : bowlTimes(minutes * 60, { ...bowl, marks: parseMarks(marksText) }, 1));
  const el = $derived(running ? elapsedSec(tm, now) : 0);
  const left = $derived(running ? remainingSec(tm, now) : minutes * 60);
  const nb = $derived(running ? nextBowl(tm.bowls, el) : null);
  const MODE_NAME = { none: 'none|bowl', every: 'regularly|bowl', marks: 'chosen|bowl', random: 'random|bowl' };
  const R = 96;
  const C = 2 * Math.PI * R;
  const frac = $derived(running ? left / tm.targetSec : 1);
  const bowlLine = $derived.by(() => {
    if (!plan.length) return t('No singing bowl');
    const shown = plan.slice(0, 5).map((s) => clock(s)).join(' · ');
    return t('Singing bowl at {times}', { times: shown + (plan.length > 5 ? ' …' : '') });
  });
</script>

<dialog class="sheet from-below tsheet" bind:this={dlg} onclose={() => (ui.timerOpen = false)} onclick={(e) => e.target === dlg && small()} aria-labelledby="timer-h">
  {#if ui.timerOpen}
    <div class="grab" aria-hidden="true"></div>
    <div class="hd">
      <h2 id="timer-h" class="title">{t('Stopwatch')}</h2>
      <button type="button" class="round" onclick={small} aria-label={running ? t('Make small, it keeps running') : t('Close')}><ChevronDown size={22} aria-hidden="true" /></button>
    </div>

    {#if !running}
      <div class="pick">
        <Seg full={false} small label={t('Activity')} value={pick} onchange={choose} options={choices.map((s) => ({ key: s.act.id, name: actName(s.act) }))} />
        {#if live.length > shortList.length}<button type="button" class="lk" aria-expanded={all} onclick={() => (all = !all)}>{all ? t('fewer') : t('+ all')}</button>{/if}
      </div>
    {:else}
      <p class="who">{actName(chosen?.act)}</p>
    {/if}

    <div class="dial" class:done>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle cx="110" cy="110" r={R} class="track" />
        <circle cx="110" cy="110" r={R} class="arc" stroke-dasharray="{Math.max(0.01, frac * C)} {C}" transform="rotate(-90 110 110)" />
      </svg>
      <div class="mid">
        <span class="time num" role="timer" aria-live="off" data-left={Math.ceil(left)}>{clock(left)}</span>
        <span class="sub">
          {#if done}{t('Time is up ✓')}
          {:else}{t('Goal {n} min', { n: running ? Math.round(tm.targetSec / 60) : minutes })}{#if running && nb != null}{" · "}{t('bowl in {t}', { t: clock(nb - el) })}{/if}{/if}
        </span>
      </div>
    </div>
    {#if running}<p class="bl"><Bell size={15} aria-hidden="true" /> {bowlLine}</p>{/if}

    {#if !running}
      <p class="lbl" id="t-min">{t('Target time')}</p>
      <Seg full={false} small labelledby="t-min" value={minutes} onchange={(m) => (minutes = m)} options={DURATIONS.map((m) => ({ key: m, name: `${m}` }))} />
      <div class="acts">
        <button type="button" class="btn hi big" onclick={start} disabled={!pick}><Timer size={18} aria-hidden="true" />{t('Start')}</button>
      </div>
      <details class="bowl">
        <summary>{t('Singing bowl')} <span class="quiet">{bowlLine}</span></summary>
        <label class="sw-row">
          <span class="ico"><Bell size={18} aria-hidden="true" /></span>
          <span class="tx"><b>{t('Singing bowl at the start and the end')}</b><small>{t('a soft bowl, generated in the app')}</small></span>
          <input type="checkbox" class="switch" bind:checked={bowl.ends} />
        </label>
        <p class="lbl" id="t-mode">{t('Bowls in between')}</p>
        <Seg full={false} small labelledby="t-mode" value={bowl.mode} onchange={(m) => (bowl.mode = m)} options={BOWL_MODES.map((m) => ({ key: m, name: t(MODE_NAME[m]) }))} />
        {#if bowl.mode === 'every'}
          <label class="inl">{t('every')} <input class="inp n" type="number" min="1" max="60" inputmode="numeric" bind:value={bowl.every} /> {t('minutes')}</label>
        {:else if bowl.mode === 'marks'}
          <label class="inl">{t('at minute')} <input class="inp m" type="text" inputmode="decimal" placeholder="3, 7, 12" bind:value={marksText} /></label>
        {:else if bowl.mode === 'random'}
          <label class="inl"><input class="inp n" type="number" min="1" max="10" inputmode="numeric" bind:value={bowl.count} /> {t('bowls at random times')}</label>
        {/if}
        <button type="button" class="lk" onclick={keepDefault} disabled={saved}>{saved ? t('Kept as default ✓') : t('Keep as default')}</button>
      </details>
    {:else}
      <div class="acts">
        {#if !done}
          <button type="button" class="btn big" onclick={togglePause}>{#if tm.pausedAt}<Play size={18} aria-hidden="true" />{t('Continue')}{:else}<Pause size={18} aria-hidden="true" />{t('Pause')}{/if}</button>
        {/if}
        <button type="button" class="btn hi big grow" onclick={() => finishClock(states)}>{t('Done · tick off')}</button>
      </div>
      <button type="button" class="lk stop" onclick={cancel}><BellOff size={16} aria-hidden="true" />{t('Stop without ticking')}</button>
    {/if}
  {/if}
</dialog>

<style>
  .tsheet {
    width: min(560px, calc(100vw - 24px));
  }
  .grab {
    width: 44px;
    height: 5px;
    margin: -6px auto 8px;
    border-radius: 3px;
    background: var(--line);
  }
  .hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .hd .title {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-page);
  }
  .round {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .pick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin-top: 12px;
  }
  .who {
    margin: 8px 0 0;
    color: var(--ink-2);
    font-weight: 500;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .lk:disabled {
    color: var(--ink-3);
    cursor: default;
  }
  .dial {
    position: relative;
    width: min(240px, 66vw);
    margin: 14px auto 4px;
    aspect-ratio: 1;
  }
  .dial svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .track {
    fill: none;
    stroke: var(--accent-soft);
    stroke-width: 12;
  }
  .arc {
    fill: none;
    stroke: var(--accent);
    stroke-width: 12;
    stroke-linecap: round;
    transition: stroke-dasharray 0.25s linear;
  }
  .mid {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .time {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-display);
    line-height: 1;
  }
  .sub {
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: center;
    padding: 0 24px;
  }
  .done .sub {
    color: var(--ok);
    font-weight: 600;
  }
  .bl {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin: 4px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: center;
  }
  dialog .lbl {
    margin: 12px 0 6px;
  }
  .bowl {
    margin-top: 14px;
    border-top: 1px solid var(--line);
  }
  .bowl summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
    min-height: 48px;
    padding-top: 12px;
    font-weight: 500;
    cursor: pointer;
  }
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .sw-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    cursor: pointer;
  }
  .ico {
    flex: none;
    color: var(--ink-2);
  }
  .sw-row .tx {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .sw-row b {
    display: block;
    font-weight: 500;
  }
  .sw-row small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .switch {
    flex: none;
    appearance: none;
    width: 52px;
    height: 30px;
    margin: 0;
    border-radius: 15px;
    background: var(--line-strong);
    position: relative;
    cursor: pointer;
    transition: background 0.15s;
  }
  .switch::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--paper);
    transition: transform 0.15s;
  }
  .switch:checked {
    background: var(--accent);
  }
  .switch:checked::after {
    transform: translateX(22px);
  }
  .inl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    color: var(--ink-2);
  }
  .inl .n {
    width: 80px;
  }
  .inl .m {
    width: 160px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
  }
  .big {
    min-height: 52px;
    flex: 1 1 120px;
    border-radius: 12px;
    font-size: var(--fs-body);
  }
  .big.grow {
    flex: 2 1 180px;
  }
  .stop {
    margin-top: 6px;
    color: var(--ink-2);
  }
</style>
