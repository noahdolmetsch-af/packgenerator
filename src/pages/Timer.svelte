<script>
  /**
   * «Timer» (mockups Z2 and Z4, Noah 12.10.2026; answers 13.10.2026 «1-5a»; approved 13.10.2026
   * «ME1-ME3 und Z1-Z5 freigeben»). #/timer, a page of Heute.
   *   Left: the five kinds (Timer counts up, Countdown, Interval, Pomodoro, Until a time), the clock in
   *   the chosen face (Z3, «Zifferblatt: Digital ›»), Start/Pause, Reset and «Gross»; a time typed in
   *   words («7 min», «1h 20m», «bis 17:30») and the quick chips.
   *   Right: the building blocks (a tap starts at once; «Meditation» starts the meditation session),
   *   «Zuletzt benutzt» and today's log («Ganzes Log ›», Z5).
   *   Z4: while it runs, «Gross» shows it big and calm; at the end the log has the entry already and a
   *   note can be added («Ins Log», «Nochmal», «Ohne Notiz»).
   * Everything is optional; the timer runs on when the page changes (TimerFloat in App.svelte).
   */
  import { ArrowUp, ArrowDown, Repeat, Clock, Play, Pause, RotateCcw, Maximize2, Minimize2, Plus, Keyboard, Coffee, Dumbbell, Flower2, Moon, Droplet, Target, Check, ChevronRight, Square, Timer as TimerIcon, List } from '@lucide/svelte';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import Face from '../lib/timer/Face.svelte';
  import { timer, loadPrefs, savePrefs, start, togglePause, plusMinute, reset, finish, setNote, closeDone } from '../lib/timer/run.svelte.js';
  import { timerLogQuery, MED_ACT } from '../lib/timer/data.js';
  import { radioStep } from '../lib/timer/radios.js';
  import { MODES, MODE_IDS, DEFAULTS, CHIPS, BLOCKS, FACES, parseTime, setupOk, setupSec, position, setupWords, short, faceFor, dayStats, recentSetups, rowName, modeOf, hmOf, dur } from '../lib/timer.js';
  import { medQuery, seedMed } from '../lib/flow/data.svelte.js';
  import { beginMed, lastStart, medTemplates, tplStart } from '../lib/flow/hobby/medstart.js';
  import { artName } from '../lib/flow/hobby/words.js';
  import { localDay } from '../lib/localday.js';
  import { t } from '../lib/i18n.svelte.js';
  import { phone } from '../lib/media.svelte.js';
  import { flowQuery } from '../lib/flow/data.svelte.js';
  import { flowStates } from '../lib/flow.js';
  import { tickWith, actName } from '../lib/flow/ui.svelte.js';

  const today = localDay();
  const MODE_ICON = { up: ArrowUp, down: ArrowDown, interval: Repeat, pomodoro: TimerIcon, until: Clock };
  const BLOCK_ICON = { coffee: Coffee, dumbbell: Dumbbell, lotus: Flower2, nap: Moon, drop: Droplet, focus: Target, timer: TimerIcon };
  const w = (x) => (x?.key ? t(x.key, x.vars) : '');

  $effect(() => {
    loadPrefs().then((p) => {
      if (!timer.run) cur = setupOk(p.last) ?? DEFAULTS.down;
    });
  });
  const logQ = timerLogQuery();
  const rows = $derived($logQ ?? []);
  const medQ = medQuery(MED_ACT, today);
  const med = $derived($medQ);
  $effect(() => {
    if (med) seedMed(med, MED_ACT);
  });

  let cur = $state(DEFAULTS.down);
  let typed = $state('');
  let typedBad = $state(false);
  let note = $state('');
  let ownName = $state('');
  let ownOpen = $state(false);

  const run = $derived(timer.run);
  const pos = $derived(run ? position(run, timer.now) : null);
  const shownSetup = $derived(run ? run.setup : cur);
  const face = $derived(faceFor(timer.prefs, shownSetup));
  const faceName = $derived(t(FACES.find((f) => f.id === face)?.label ?? 'Digital'));
  const idleSec = $derived(cur.mode === 'up' ? 0 : cur.mode === 'interval' || cur.mode === 'pomodoro' ? cur.work : setupSec(cur));
  const sec = $derived(pos ? pos.show : idleSec);
  const frac = $derived(pos ? pos.frac : 0);
  const blocks = $derived([...BLOCKS, ...(timer.prefs.blocks ?? [])]);
  const recent = $derived(recentSetups(rows, 4));
  const todayRows = $derived(rows.filter((r) => r.day === today).slice(0, 4));
  const todayStats = $derived(dayStats(rows, today));

  // the pill above the clock: «Pomodoro 25 / 5 · Runde 1 von 4»
  const pill = $derived.by(() => {
    const s = shownSetup;
    const parts = [run?.label || t(modeOf(s.mode).label)];
    if (!run?.label && s.mode !== 'up') parts[0] += ` ${w(setupWords(s))}`;
    // Impeccable runde 2: a phone hides the kinds' second line; the chosen kind says it here when the setup does not
    if (!run && phone.matches && (s.mode === 'up' || s.mode === 'down')) parts.push(t(modeOf(s.mode).sub));
    if (pos && pos.rounds > 1) parts.push(t('round {n} of {m}', { n: pos.round, m: pos.rounds }));
    if (pos?.kind === 'rest') parts.push(t('Break'));
    return parts.join(' · ');
  });
  // the line under the clock: «Danach 5 min Pause · Ende ca. 15:10»
  const line = $derived.by(() => {
    if (pos?.paused) return t('Paused');
    if (run && run.setup.mode === 'up') return t('counts up · started {hm}', { hm: hmOf(run.startedAt) });
    const s = shownSetup;
    const parts = [];
    if ((s.mode === 'pomodoro' || s.mode === 'interval') && s.rest && (!pos || pos.kind === 'work')) parts.push(t('then {d} break', { d: w(short(s.rest)) }));
    const end = pos?.endAt ?? (s.mode === 'up' ? null : Date.now() + setupSec(s) * 1000);
    if (end) parts.push(t('ends about {hm}', { hm: hmOf(end) }));
    return parts.join(' · ');
  });

  // the kinds are one tab stop; the arrow keys choose (not while a timer runs)
  function modeKeys(e) {
    const id = run ? null : radioStep(e.key, MODE_IDS, cur.mode);
    if (!id) return;
    e.preventDefault();
    pickMode(id);
    e.currentTarget.parentElement.querySelector(`[data-mode="${id}"]`)?.focus();
  }
  function pickMode(id) {
    if (run) return;
    cur = DEFAULTS[id];
  }
  function chip(s) {
    if (run) return;
    if (cur.mode === 'interval' || cur.mode === 'pomodoro') cur = { ...cur, work: s };
    else cur = { mode: 'down', sec: s };
  }
  function go() {
    if (run) return togglePause();
    start(cur);
  }
  function startTyped(e) {
    e?.preventDefault();
    const s = parseTime(typed);
    typedBad = !s;
    if (!s) return;
    cur = s;
    typed = '';
    start(s);
  }
  function startBlock(b) {
    if (b.med) {
      if (!med) return;
      const ls = lastStart(med, MED_ACT);
      const tp = medTemplates(med)[0];
      const st = ls ? { ...ls.start } : tp ? tplStart(tp) : { minutes: 20 };
      st.minutes = Math.round(b.setup.sec / 60);
      beginMed(MED_ACT, med, st);
      return;
    }
    cur = { ...b.setup };
    start({ ...b.setup, blockId: b.id }, t(b.label));
  }
  async function saveOwn(e) {
    e?.preventDefault();
    const name = ownName.trim();
    if (!name) return;
    const id = `own-${Date.now().toString(36)}`;
    await savePrefs({ blocks: [...(timer.prefs.blocks ?? []), { id, label: name, setup: { ...cur } }] });
    ownName = '';
    ownOpen = false;
  }
  async function keepNote(close = true) {
    if (timer.done && note.trim()) await setNote(timer.done.id, note);
    note = '';
    if (close) closeDone();
  }
  function again() {
    const s = timer.done?.setup;
    const label = timer.done?.label ?? '';
    keepNote(true);
    if (s) start(s, label);
  }
  /* Impeccable runde 2 (Noah «alle Vorschläge angenommen»): a finished timer can tick an Aktiv activity
     too, never by itself: «Auch in Aktiv abhaken ›» lists today's activities (not resting), the one chosen
     last time first and chosen; one tap on «Abhaken» ticks it with the minutes of the timer. */
  const flowQ = flowQuery(today);
  const flowData = $derived($flowQ);
  const aktivActs = $derived(flowData ? flowStates(flowData.acts, flowData.log, today, flowData.tripDays).filter((s) => !s.resting).map((s) => s.act) : []);
  let aktivOpen = $state(false);
  let aktivPick = $state(null);
  let aktivDone = $state(null);
  const aktivChosen = $derived(aktivPick ?? (aktivActs.some((a) => a.id === timer.prefs.aktiv) ? timer.prefs.aktiv : (aktivActs[0]?.id ?? null)));
  $effect(() => {
    // a new finished timer starts closed
    void timer.done?.id;
    aktivOpen = false;
    aktivPick = null;
    aktivDone = null;
  });
  async function tickAktiv() {
    const a = aktivActs.find((x) => x.id === aktivChosen);
    const d = timer.done;
    if (!a || !d) return;
    await tickWith(a, { day: today, min: Math.max(1, Math.round(d.sec / 60)), via: 'timer' });
    aktivDone = a.id;
    await savePrefs({ aktiv: a.id });
  }
  const addWord = (x) => (note = note.trim() ? `${note.trim()}, ${x}` : x);
  const setNum = (k, v, mul = 1) => {
    const n = Math.round(Number(v) * mul);
    if (n > 0) cur = setupOk({ ...cur, [k]: n }) ?? cur;
  };
</script>

<div class="tmr">
  <Crumb path={[{ href: '#/', label: t('Today|place') }]} here={t('Timer')} />
  <h1 class="h1" tabindex="-1" data-page-title>{t('Timer')}</h1>
  <p class="sub">{t('Stopwatch, countdown, interval, Pomodoro or until a time. All optional.')}</p>
  <AreaIntro place="timer" />

  {#if timer.done}
    {@const d = timer.done}
    <section class="surf pad done" aria-label={t('Done')} data-done>
      <span class="ok" aria-hidden="true"><Check size={26} /></span>
      <h2 class="dh">{t('Done: {time} {name}', { time: dur(d.sec), name: d.label || t(modeOf(d.mode).label) })}</h2>
      <p class="dl">{t('{from} to {to} · {kind} · in the log', { from: hmOf(Date.parse(d.at)), to: hmOf(Date.parse(d.at) + d.sec * 1000), kind: t(modeOf(d.mode).label) })}</p>
      <label class="nl" for="tnote">{t('Note (optional)')}</label>
      <input id="tnote" class="inp" bind:value={note} maxlength="300" placeholder={t('e.g. calm, window open')} />
      <div class="chips">
        {#each ['calm', 'restless', 'tired'] as x (x)}<button type="button" class="ch" onclick={() => addWord(t(x))}>{t(x)}</button>{/each}
      </div>
      <div class="acts">
        <button type="button" class="btn hi" onclick={() => keepNote(true)} data-act="keep"><Check size={18} aria-hidden="true" />{t('Into the log')}</button>
        <button type="button" class="btn" onclick={again}><RotateCcw size={18} aria-hidden="true" />{t('Again')}</button>
        <button type="button" class="btn" onclick={() => ((note = ''), closeDone())} data-act="skip">{t('Without a note')}</button>
      </div>
      {#if aktivActs.length}
        <!-- Impeccable runde 2: «Auch in Aktiv abhaken ›», optional, never by itself -->
        {#if aktivDone}
          <p class="aktok" role="status" data-aktiv-done><Check size={16} aria-hidden="true" />{t('Ticked in Aktiv: {name}', { name: actName(aktivActs.find((a) => a.id === aktivDone)) })}</p>
        {:else}
          <button type="button" class="aktl" aria-expanded={aktivOpen} aria-controls="t-aktiv" onclick={() => (aktivOpen = !aktivOpen)} data-aktiv-open>{t('Also tick off in Aktiv')}<ChevronRight size={16} aria-hidden="true" /></button>
          {#if aktivOpen}
            <div class="aktw" id="t-aktiv">
              <div class="chips" role="radiogroup" aria-label={t('Which activity?')}>
                {#each aktivActs as a (a.id)}<button type="button" role="radio" class="ch" class:on={aktivChosen === a.id} aria-checked={aktivChosen === a.id} onclick={() => (aktivPick = a.id)} data-aktiv={a.id}>{actName(a)}</button>{/each}
              </div>
              <button type="button" class="btn hi sm" onclick={tickAktiv} disabled={!aktivChosen} data-aktiv-tick><Check size={16} aria-hidden="true" />{t('Tick off · {n} min', { n: Math.max(1, Math.round(d.sec / 60)) })}</button>
            </div>
          {/if}
        {/if}
      {/if}
    </section>
  {/if}

  <div class="cols">
    <div class="left">
      <div class="modes" role="radiogroup" aria-label={t('Kind of timer')}>
        {#each MODES as m (m.id)}
          {@const Icon = MODE_ICON[m.id]}
          <button type="button" role="radio" class="mode" class:on={shownSetup.mode === m.id} aria-checked={shownSetup.mode === m.id} disabled={!!run && shownSetup.mode !== m.id} tabindex={shownSetup.mode === m.id ? 0 : -1} onclick={() => pickMode(m.id)} onkeydown={modeKeys} data-mode={m.id}>
            <Icon size={18} aria-hidden="true" />
            <b>{t(m.label)}</b>
            <small>{t(m.sub)}</small>
          </button>
        {/each}
      </div>

      <section class="surf pad clock" aria-label={t('Timer')}>
        <div class="ctop">
          <span class="pill">{pill}</span>
          <a class="facel" href="#/timer/faces" data-to="faces"><Clock size={16} aria-hidden="true" />{t('Face: {name}', { name: faceName })}<ChevronRight size={16} aria-hidden="true" /></a>
        </div>
        <Face {face} {sec} {frac} fmt={timer.prefs.fmt} size="l" label={t('{time} on the timer', { time: dur(sec) })} />
        {#if line}<p class="line">{line}</p>{/if}
        <div class="acts">
          <button type="button" class="btn hi go" onclick={go} data-act="go">
            {#if run && !run.pausedAt}<Pause size={20} aria-hidden="true" />{t('Pause')}{:else}<Play size={20} aria-hidden="true" />{run ? t('Go on') : t('Start')}{/if}
          </button>
          {#if run}
            {#if run.setup.mode !== 'up'}<button type="button" class="btn" onclick={plusMinute} data-act="plus">{t('+1 min')}</button>{/if}
            <button type="button" class="btn" onclick={() => finish(true)} data-act="stop"><Square size={16} aria-hidden="true" />{t('Stop|timer')}</button>
          {/if}
          <button type="button" class="btn" onclick={reset} disabled={!run} data-act="reset"><RotateCcw size={18} aria-hidden="true" />{t('Reset')}</button>
          <button type="button" class="btn k" onclick={() => (timer.big = true)} aria-label={t('Show big')} title={t('Show big')} disabled={!run}><Maximize2 size={18} aria-hidden="true" /></button>
        </div>

        {#if !run}
          {#if cur.mode === 'interval' || cur.mode === 'pomodoro'}
            {@const m = cur.mode === 'pomodoro' ? 60 : 1}
            <div class="nums">
              <label>{cur.mode === 'pomodoro' ? t('Work (min)') : t('Work (s)')}<input class="inp" type="number" min="1" inputmode="numeric" value={cur.work / m} onchange={(e) => setNum('work', e.currentTarget.value, m)} /></label>
              <label>{cur.mode === 'pomodoro' ? t('Break (min)') : t('Break (s)')}<input class="inp" type="number" min="0" inputmode="numeric" value={cur.rest / m} onchange={(e) => setNum('rest', e.currentTarget.value, m)} /></label>
              <label>{t('Rounds')}<input class="inp" type="number" min="1" max="99" inputmode="numeric" value={cur.rounds} onchange={(e) => setNum('rounds', e.currentTarget.value)} /></label>
            </div>
            {#if cur.mode === 'pomodoro'}
              <div class="chips c">
                <button type="button" class="ch" class:on={cur.work === 1500 && cur.rest === 300} onclick={() => (cur = { mode: 'pomodoro', work: 1500, rest: 300, rounds: 4 })}>25 / 5</button>
                <button type="button" class="ch" class:on={cur.work === 3120 && cur.rest === 1020} onclick={() => (cur = { mode: 'pomodoro', work: 3120, rest: 1020, rounds: 1 })}>52 / 17</button>
              </div>
            {/if}
          {:else if cur.mode === 'until'}
            <div class="nums"><label>{t('Until')}<input class="inp" type="time" value={cur.until} onchange={(e) => (cur = setupOk({ mode: 'until', until: e.currentTarget.value }) ?? cur)} data-until /></label></div>
          {/if}
        {/if}

        <form class="typed" onsubmit={startTyped}>
          <Keyboard size={18} aria-hidden="true" />
          <input class="inp" bind:value={typed} oninput={() => (typedBad = false)} aria-label={t('Type a time')} placeholder={t('Type a time: «7 min», «1h 20m», «until 17:30»')} aria-invalid={typedBad} data-typed />
          <button type="submit" class="btn hi sm"><Play size={16} aria-hidden="true" />{t('Start')}</button>
        </form>
        {#if typedBad}<p class="bad" role="alert">{t('I could not read that time. Try «7 min» or «until 17:30».')}</p>{/if}
        {#if !run && cur.mode !== 'up' && cur.mode !== 'until'}
          <div class="chips c">
            {#each CHIPS as s (s)}<button type="button" class="ch" class:on={(cur.mode === 'down' ? cur.sec : cur.work) === s} onclick={() => chip(s)}>{w(short(s))}</button>{/each}
          </div>
        {/if}
      </section>
    </div>

    <aside class="side">
      <section aria-labelledby="t-blocks">
        <div class="sh"><h2 id="t-blocks" class="h2">{t('Quick starts')}</h2></div>
        <p class="sm">{t('A tap starts at once')}</p>
        <div class="surf pad blocks">
          {#each blocks as b (b.id)}
            {@const Icon = BLOCK_ICON[b.icon] ?? TimerIcon}
            <button type="button" class="blk" onclick={() => startBlock(b)} data-block={b.id} aria-label={t('Start {name}', { name: b.own ? b.label : t(b.label) })}>
              <span class="bi" aria-hidden="true"><Icon size={18} /></span>
              <span class="bt"><b>{b.own ? b.label : t(b.label)}</b><small>{w(setupWords(b.setup))} · {b.med ? t('Meditation') : t(modeOf(b.setup.mode).label)}</small></span>
              <Play size={16} aria-hidden="true" />
            </button>
          {/each}
          {#if ownOpen}
            <form class="own" onsubmit={saveOwn}>
              <input class="inp" bind:value={ownName} maxlength="40" placeholder={t('Name, e.g. Eggs')} aria-label={t('Name of the quick start')} />
              <button type="submit" class="btn sm hi">{t('Save')}</button>
              <p class="sm">{t('Keeps the timer set on the left: {what}', { what: `${t(modeOf(cur.mode).label)} ${w(setupWords(cur))}` })}</p>
            </form>
          {:else}
            <button type="button" class="blk new" onclick={() => (ownOpen = true)} data-block="new"><Plus size={18} aria-hidden="true" />{t('Own quick start')}</button>
          {/if}
        </div>
      </section>

      {#if recent.length}
        <section aria-labelledby="t-recent">
          <h2 id="t-recent" class="h2">{t('Recently used')}</h2>
          <div class="surf pad recent">
            {#each recent as r, i (i)}
              <button type="button" class="rc" onclick={() => start(r.setup, r.label)}><b>{w(setupWords(r.setup))}</b><small>{r.label || t(modeOf(r.mode).label)}</small></button>
            {/each}
          </div>
        </section>
      {/if}

      <section aria-labelledby="t-log">
        <div class="sh"><h2 id="t-log" class="h2">{t('Log')}</h2><a href="#/timer/log" data-to="log">{t('Whole log')}<ChevronRight size={16} aria-hidden="true" /></a></div>
        <p class="sm">{t('Today {n}× · {time}', { n: todayStats.n, time: w(short(todayStats.sec)) })}</p>
        <div class="surf pad">
          {#if todayRows.length}
            <ul class="rows">
              {#each todayRows as r (r.id)}
                <li><span class="tm">{r.at ? hmOf(Date.parse(r.at)) : ''}</span><span class="rt"><b>{r.med ? t('Meditation') : rowName(r) === r.label ? r.label : t(rowName(r))}</b><small>{[r.med ? artName(r.art) : t(modeOf(r.mode).label), r.note].filter(Boolean).join(' · ')}</small></span><b class="num">{dur(r.sec)}</b></li>
              {/each}
            </ul>
          {:else}
            <p class="sm"><List size={16} aria-hidden="true" /> {t('Nothing yet today. Every timer comes in here by itself.')}</p>
          {/if}
        </div>
      </section>
    </aside>
  </div>
</div>

{#if timer.big && run}
  <div class="bigv" role="dialog" aria-modal="true" aria-label={t('Timer')}>
    <div class="bt2"><span class="pill">{pill}</span><button type="button" class="btn k" onclick={() => (timer.big = false)} aria-label={t('Make small')} title={t('Make small')}><Minimize2 size={18} aria-hidden="true" /></button></div>
    <Face {face} {sec} {frac} fmt={timer.prefs.fmt} size="xl" sub={line} label={t('{time} on the timer', { time: dur(sec) })} />
    {#if face !== 'ring' && line}<p class="line">{line}</p>{/if}
    <div class="acts">
      <button type="button" class="btn hi go" onclick={togglePause}>{#if run.pausedAt}<Play size={20} aria-hidden="true" />{t('Go on')}{:else}<Pause size={20} aria-hidden="true" />{t('Pause')}{/if}</button>
      {#if run.setup.mode !== 'up'}<button type="button" class="btn" onclick={plusMinute}>{t('+1 min')}</button>{/if}
      <button type="button" class="btn" onclick={() => finish(true)}><Square size={16} aria-hidden="true" />{t('Stop|timer')}</button>
    </div>
    <p class="sm">{t('Make it small: the timer floats at the bottom right and keeps running on every page.')}</p>
  </div>
{/if}

<style>
  .tmr {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 1328px;
    margin: 0 auto;
    min-width: 0;
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-page)/1.1 var(--font-brand);
  }
  .sub {
    margin: -6px 0 0;
    color: var(--ink-2);
  }
  .h2 {
    margin: 0;
    font: 700 var(--fs-sub)/1.2 var(--font-brand);
  }
  .pad {
    padding: 16px 18px;
    min-width: 0;
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  @media (min-width: 1100px) {
    .cols {
      grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    }
  }
  .left,
  .side {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .modes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 8px;
  }
  .mode {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    min-height: 88px;
    padding: 12px;
    border: 1px solid var(--card-line);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  .mode b {
    font-weight: 600;
  }
  .mode small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .mode.on {
    border: 2px solid var(--hi);
    background: var(--hi-soft);
  }
  .mode:disabled {
    opacity: 0.45;
    cursor: default;
  }
  /* Impeccable runde 2 (layout): on a phone the five kinds are one wrapping row of small chips without
     their second line, so the clock, Start and the typed time are on the first screen */
  @media (max-width: 719px) {
    .modes {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .mode {
      flex-direction: row;
      align-items: center;
      gap: 6px;
      min-height: 44px;
      padding: 0 14px;
      border-radius: 999px;
    }
    .mode.on {
      padding: 0 13px;
    }
    .mode small {
      display: none;
    }
  }
  .clock {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  .ctop {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .facel {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .line {
    margin: 0;
    color: var(--ink-2);
    text-align: center;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .go {
    min-width: 120px;
  }
  .nums {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  .nums label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .nums .inp,
  .typed .inp,
  .own .inp,
  .done .inp {
    min-height: 44px;
  }
  .nums .inp {
    width: 110px;
  }
  .typed {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 4px 4px 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
  }
  .typed .inp {
    flex: 1;
    border: 0;
    padding-left: 0;
  }
  .typed :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  .bad {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chips.c {
    justify-content: center;
  }
  .ch {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body)/1.2 var(--font-body);
    cursor: pointer;
  }
  .ch.on {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .sh {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .sh a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    min-width: 44px;
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .sm {
    margin: 2px 0 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .blocks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
  }
  .blk {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 64px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  .blk > :global(svg) {
    flex: none;
    color: var(--accent);
  }
  .blk.new {
    justify-content: center;
    border-style: dashed;
    color: var(--ink-2);
  }
  .bi {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .bt {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .bt b {
    display: block;
    font-weight: 600;
  }
  .bt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .own {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .own .inp {
    flex: 1 1 160px;
  }
  .recent {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .rc {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 56px;
    padding: 8px 12px;
    border: 0;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .rc small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 6px 0;
  }
  .rows li + li {
    border-top: 1px solid var(--line);
  }
  .tm {
    flex: none;
    width: 46px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rt {
    flex: 1;
    min-width: 0;
  }
  .rt b {
    display: block;
    font-weight: 600;
  }
  .rt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .done {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }
  /* Impeccable runde 2: «Auch in Aktiv abhaken ›», a quiet link under the actions */
  .aktl {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .aktl[aria-expanded='true'] :global(svg) {
    transform: rotate(90deg);
  }
  .aktw {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .aktw .chips {
    justify-content: center;
  }
  .aktok {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ok);
    font-size: var(--fs-small);
  }
  .ok {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .dh {
    margin: 0;
    font: 700 var(--fs-sub)/1.2 var(--font-brand);
  }
  .dl {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nl {
    align-self: stretch;
    text-align: left;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .done .inp {
    align-self: stretch;
  }
  .bigv {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    padding: 24px 16px;
    background: var(--ground, var(--paper));
  }
  .bt2 {
    position: absolute;
    top: 12px;
    left: 16px;
    right: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
