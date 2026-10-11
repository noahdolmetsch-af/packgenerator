<script>
  /**
   * Hobby pages 2 «Kissenzeit»: a session runs (mockup B7, Noah 10.10.2026, H26a, H27a). The whole screen
   * for the clock: the arc that ran, the marks, the next one in orange, the time left large; only three
   * buttons (sound quieter · pause · end). On a phone the navigation steps back and only «Beenden» stays
   * on top (H26a); on a computer the sidebar folds into a narrow strip («Leiste öffnen» makes the session
   * small: the mini clock floats on every page). «Beenden» saves what ran, without asking; when the time is
   * up the session is saved by itself (flowLog + flowSessions). The end gong comes as a notification on a
   * locked phone, only where the browser can and allowed it (H27a); else a quiet hint.
   * v0.86.0 «Meditation einfach» (mockup D, Noah «1-5 a»): calm. The time left once and large, «noch»
   * above, «nächster Gong in m:ss» below; no «0:01 von 20:00», no legend, no «Beenden» on top; one
   * control row (leiser · Pause · Beenden); the settings fold behind «Einstellungen ›»; on a computer
   * «Leiste öffnen ›» top right makes the session small.
   * v0.93.0 «Meditation Wünsche» (mockups G, H, Noah «1-5 a» 11.10.2026): four clocks, one switch on top
   * «Ring · Sanduhr · Mond · Zahl», remembered (db.settings flow.medClock). Ring = the dial; Sanduhr = the
   * sand runs from the top into the bottom with the time left, a thin stream while it runs, and the time
   * can be hidden («Zeit ausblenden»); Mond = a circle filling from below like water; Zahl = only the
   * digits. All keep «nächster Klang in …», the controls and what they do. No moving stream with reduced
   * motion.
   * acts: for the activity's symbol.
   */
  import { Pause, Play, Square, Volume1, Volume2, Smartphone, Lock, BellRing, ChevronRight, ChevronDown, Check } from '@lucide/svelte';
  import Dial from './Dial.svelte';
  import ActIcon from '../ActIcon.svelte';
  import { ui, clockState, togglePause, endSession, stopClock, sessionVolume, screen, askNotify, notifyState, notifyWanted, actName } from '../ui.svelte.js';
  import { elapsedSec, remainingSec, isDone, clock } from '../../flowtimer.js';
  import { soundAt, SOUNDS, canVibrate } from '../../flowsounds.js';
  import { bowlWords, CLOCK_KEY, CLOCK_VIEWS, clockPrefOf } from '../../flowmed.js';
  import { db } from '../../db.js';
  import { putSetting } from '../../flowdb.js';
  import { t } from '../../i18n.svelte.js';
  import { wide } from '../../media.svelte.js';

  let { acts = [] } = $props();
  let dlg = $state();
  const tm = $derived(clockState.tm);
  const now = $derived(clockState.now);
  const act = $derived(tm ? acts.find((a) => a.id === tm.actId) : null);
  const done = $derived(!!tm && isDone(tm, now));
  const el = $derived(tm ? elapsedSec(tm, now) : 0);
  const left = $derived(tm ? remainingSec(tm, now) : 0);
  const between = $derived(tm ? tm.bowls.filter((s) => s > 0 && s < tm.targetSec) : []);
  const marks = $derived(between.map((sec) => ({ sec, sound: (tm.marks ?? []).find((m) => m.sec === sec)?.sound })));
  const nextSec = $derived(tm ? (tm.bowls.find((s) => s > el) ?? null) : null);
  const nextMark = $derived(nextSec != null && nextSec < tm.targetSec ? nextSec : null);
  const soundName = (id) => t(SOUNDS.find((s) => s.id === id)?.name ?? '');
  const title = $derived(tm?.session?.artLabel || (act ? actName(act) : t('Meditation')));
  const subLine = $derived.by(() => {
    if (!tm) return '';
    const parts = [];
    if (tm.session?.name) parts.push(`«${tm.session.name}»`);
    parts.push(t('{n} min', { n: Math.round(tm.targetSec / 60) }));
    if (tm.session?.placeLabel) parts.push(tm.session.placeLabel);
    return parts.join(' · ');
  });
  const modeLine = $derived.by(() => {
    if (!tm?.bowl) return '';
    const w = bowlWords(tm.bowl);
    return t(w.key, w.vars);
  });
  const vol = $derived(tm?.vol ?? 0.8);
  const quiet = $derived(vol < 0.5);
  // v0.86.0 «Meditation einfach» (mockup D): the settings fold behind «Einstellungen ›» under the controls
  let setOpen = $state(false);
  let notify = $state(notifyWanted());
  let perm = $state(notifyState());
  async function toggleNotify() {
    notify = !notify;
    perm = await askNotify(notify);
  }

  /* v0.93.0: the four clocks, remembered */
  const VIEW_NAMES = { ring: 'Ring|clock', glass: 'Hourglass', moon: 'Moon|clock', digits: 'Number|clock' };
  let pref = $state(clockPrefOf(null));
  $effect(() => {
    db.settings
      .get(CLOCK_KEY)
      .then((r) => (pref = clockPrefOf(r?.value)))
      .catch(() => {});
  });
  function setPref(patch) {
    pref = clockPrefOf({ ...pref, ...patch });
    putSetting(db, CLOCK_KEY, pref);
  }
  const frac = $derived(tm && tm.targetSec > 0 ? Math.min(1, Math.max(0, el / tm.targetSec)) : 0);
  const flowing = $derived(!!tm && !tm.pausedAt && !done);
  // the hourglass (viewBox 0 0 124 200): the top sand sinks to the neck, the bottom grows from the floor
  const topY = $derived(14 + frac * 84);
  const botY = $derived(186 - frac * 70);
  // the moon (viewBox 0 0 200 200, radius 92): the water rises from below
  const waterY = $derived(192 - frac * 184);
  const timeShown = $derived(pref.view !== 'glass' || !pref.hideTime);

  $effect(() => {
    const open = ui.sessionOpen && !!tm?.session;
    if (open && dlg && !dlg.open) dlg.showModal();
    if (!open && dlg?.open) dlg.close();
  });
  const small = () => (ui.sessionOpen = false);
  async function end() {
    await endSession();
  }
  function close() {
    stopClock();
  }
</script>

<dialog class="sess" class:wide={wide.matches} bind:this={dlg} onclose={() => (ui.sessionOpen = false)} oncancel={(e) => (e.preventDefault(), small())} aria-labelledby="sess-h">
  {#if ui.sessionOpen && tm?.session}
    <div class="body">
      <header class="top">
        {#if act}<ActIcon icon={act.icon} ring={act.ring} size={22} />{/if}
        <div class="tt">
          <h2 id="sess-h" class="h">{title}</h2>
          <p class="sub">{subLine}</p>
        </div>
        {#if wide.matches}<button type="button" class="lk side" onclick={small}>{t('Open the sidebar')}<ChevronRight size={16} aria-hidden="true" /></button>{/if}
      </header>

      <div class="views" role="group" aria-label={t('Clock')}>
        {#each CLOCK_VIEWS as v (v)}<button type="button" class="vb" class:on={pref.view === v} aria-pressed={pref.view === v} onclick={() => setPref({ view: v })} data-clock-view={v}>{t(VIEW_NAMES[v])}</button>{/each}
      </div>

      <section class="clock" data-clock={pref.view}>
        {#snippet mid(withK = true)}
          {#if done}
            {#if withK}<span class="k">{t('done|session')}</span>{/if}
            <b class="time num" data-left="0"><Check size={40} aria-hidden="true" /></b>
            <span class="of num">{tm.savedMin ? t('{n} min saved', { n: tm.savedMin }) : t('Time is up ✓')}</span>
          {:else}
            {#if withK}<span class="k">{tm.pausedAt ? t('paused') : t('left|time')}</span>{/if}
            <b class="time num" role="timer" aria-live="off" data-left={Math.ceil(left)} hidden={!timeShown}>{clock(left)}</b>
            {#if nextMark != null}<span class="next num" title={`${soundName(soundAt(tm, nextSec))}${modeLine ? ` · ${modeLine}` : ''}`}>{t('next gong in {t}', { t: clock(nextSec - el) })}</span>{/if}
          {/if}
        {/snippet}
        {#if pref.view === 'glass'}
          <div class="glass">
            <svg viewBox="0 0 124 200" role="img" aria-label={t('Hourglass: {n} % of the time has run', { n: Math.round(frac * 100) })}>
              <defs>
                <clipPath id="sess-glass"><path d="M16 12 C16 60 56 84 58 100 C56 116 16 140 16 188 L108 188 C108 140 68 116 66 100 C68 84 108 60 108 12 Z" /></clipPath>
              </defs>
              <path class="gin" d="M16 12 C16 60 56 84 58 100 C56 116 16 140 16 188 L108 188 C108 140 68 116 66 100 C68 84 108 60 108 12 Z" />
              <g clip-path="url(#sess-glass)">
                {#if frac < 1}<rect class="sand" x="0" y={topY} width="124" height={Math.max(0, 100 - topY)} />{/if}
                {#if frac > 0}<path class="sand" d="M0 200 L0 {botY + 10} Q62 {botY - 14} 124 {botY + 10} L124 200 Z" />{/if}
              </g>
              {#if flowing}<line class="stream" x1="62" y1="98" x2="62" y2={botY} />{/if}
              <path class="gout" d="M16 12 C16 60 56 84 58 100 C56 116 16 140 16 188 L108 188 C108 140 68 116 66 100 C68 84 108 60 108 12 Z" />
              <rect class="cap" x="6" y="2" width="112" height="10" rx="5" />
              <rect class="cap" x="6" y="188" width="112" height="10" rx="5" />
            </svg>
            <div class="gmid">{@render mid(false)}</div>
            {#if !done}<button type="button" class="lk" aria-pressed={!pref.hideTime} onclick={() => setPref({ hideTime: !pref.hideTime })} data-hide-time>{pref.hideTime ? t('Show the time') : t('Hide the time')}</button>{/if}
          </div>
        {:else if pref.view === 'moon'}
          <div class="moon">
            <svg viewBox="0 0 200 200" role="img" aria-label={t('Moon: {n} % of the time has run', { n: Math.round(frac * 100) })}>
              <defs><clipPath id="sess-moon"><circle cx="100" cy="100" r="92" /></clipPath></defs>
              <circle class="mface" cx="100" cy="100" r="92" />
              {#if frac > 0}
                <g clip-path="url(#sess-moon)"><path class="water" d="M0 200 L0 {waterY} Q50 {waterY - 8} 100 {waterY} T200 {waterY} L200 200 Z" /></g>
              {/if}
              <circle class="mrim" cx="100" cy="100" r="92" />
            </svg>
            <div class="mmid">{@render mid()}</div>
          </div>
        {:else if pref.view === 'digits'}
          <div class="digits">{@render mid()}</div>
        {:else}
          <Dial total={tm.targetSec} {marks} elapsed={el} next={nextMark}>
            {@render mid()}
          </Dial>
        {/if}
        {#if done}
          <div class="acts">
            <button type="button" class="btn hi big" onclick={close} data-close-session>{t('Close')}</button>
          </div>
        {:else}
          <div class="acts three">
            <button type="button" class="rb" aria-pressed={quiet} onclick={() => sessionVolume(quiet ? 0.8 : 0.3)}><span class="rc">{#if quiet}<Volume2 size={22} aria-hidden="true" />{:else}<Volume1 size={22} aria-hidden="true" />{/if}</span>{quiet ? t('louder|sound') : t('quieter|sound')}</button>
            <button type="button" class="rb main" onclick={togglePause}><span class="rc">{#if tm.pausedAt}<Play size={30} aria-hidden="true" />{:else}<Pause size={30} aria-hidden="true" />{/if}</span>{tm.pausedAt ? t('Continue') : t('Pause')}</button>
            <button type="button" class="rb stop" onclick={end} data-end-session><span class="rc"><Square size={20} aria-hidden="true" /></span>{t('End|session')}</button>
          </div>
        {/if}
        <p class="foot">{t('Locking the screen is fine')}{' · '}<button type="button" class="lk" aria-expanded={setOpen} onclick={() => (setOpen = !setOpen)} data-session-settings>{t('Settings')}{#if setOpen}<ChevronDown size={16} aria-hidden="true" />{:else}<ChevronRight size={16} aria-hidden="true" />{/if}</button></p>
      </section>

      {#if setOpen}
        <section class="surf during">
          <h3 class="zlabel">{t('During the session')}</h3>
          <div class="row"><Smartphone size={18} aria-hidden="true" /><span><b>{screen.held ? t('The screen stays on') : t('The screen may go dark')}</b><small>{screen.held ? t('until the end or a pause') : t('this browser cannot keep it on; the time stays right')}</small></span></div>
          <div class="row"><Lock size={18} aria-hidden="true" /><span><b>{t('Locking the screen is fine')}</b><small>{t('Android: the gongs come anyway. iPhone: sounds in between only with the screen open; the end gong comes when you unlock.')}</small></span></div>
          <div class="row vol"><Volume2 size={18} aria-hidden="true" /><label><b>{t('Gong volume')}</b><span class="vr"><small>{t('soft')}</small><input type="range" min="0" max="1" step="0.05" value={vol} oninput={(e) => sessionVolume(Number(e.currentTarget.value))} /><small>{t('loud')}</small></span></label></div>
          {#if perm === 'none'}
            <div class="row"><BellRing size={18} aria-hidden="true" /><span><b>{t('End gong as a notification')}</b><small>{t('This browser cannot show notifications. Keep the screen open for the end gong.')}</small></span></div>
          {:else}
            <label class="row swr"><BellRing size={18} aria-hidden="true" /><span><b>{t('End gong as a notification')}</b><small>{perm === 'denied' ? t('Notifications are blocked in this browser.') : t('if the sound cannot play on a locked phone')}</small></span><input type="checkbox" class="switch" checked={notify && perm !== 'denied'} disabled={perm === 'denied'} onchange={toggleNotify} /></label>
          {/if}
          {#if tm.marks?.some((m) => m.sound === 'vibrate') && !canVibrate()}<p class="hint">{t('Vibration only works on Android; an iPhone cannot vibrate from a web page.')}</p>{/if}
          <p class="hint">{t('Pause stops the clock. End saves what ran, without asking.')}</p>
          {#if !wide.matches && !done}<button type="button" class="lk" onclick={small}><ChevronDown size={16} aria-hidden="true" />{t('Make small, it keeps running')}</button>{/if}
        </section>
      {/if}
    </div>
  {/if}
</dialog>

<style>
  .sess {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--ground);
    color: var(--ink);
  }
  .sess[open] {
    display: flex;
  }
  .sess::backdrop {
    background: var(--ground);
  }
  .body {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 16px var(--gut) calc(24px + env(safe-area-inset-bottom));
  }
  .wide .body {
    padding: 24px 48px 40px;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 1280px;
    margin: 0 auto 24px;
  }
  .tt {
    flex: 1;
    min-width: 0;
  }
  .h {
    margin: 0;
    font: 800 var(--fs-title)/1.1 var(--font-brand);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .clock {
    max-width: 520px;
    margin: 0 auto;
    padding: 8px 0 0;
  }
  .wide .clock :global(.dial) {
    width: min(100%, 470px);
  }
  .views {
    display: flex;
    width: fit-content;
    max-width: 100%;
    gap: 4px;
    margin: 0 auto 8px;
    padding: 4px;
    border-radius: 999px;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
  }
  .vb {
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-2);
    font: 600 var(--fs-small)/1 var(--font-body);
    cursor: pointer;
  }
  .vb.on {
    background: var(--accent);
    color: var(--paper);
  }
  .glass,
  .digits {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
  }
  .glass svg {
    display: block;
    width: auto;
    height: min(42dvh, 300px);
    margin: 12px 0 8px;
  }
  .wide .glass svg {
    height: min(52dvh, 420px);
  }
  .gin {
    fill: var(--paper);
  }
  .gout {
    fill: none;
    stroke: var(--accent);
    stroke-width: 3;
  }
  .sand {
    fill: var(--l2);
  }
  .stream {
    stroke: var(--l2);
    stroke-width: 3;
    stroke-dasharray: 4 3;
    animation: sand-run 0.6s linear infinite;
  }
  @keyframes sand-run {
    to {
      stroke-dashoffset: -7;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .stream {
      animation: none;
      stroke-dasharray: none;
    }
  }
  .cap {
    fill: var(--ink);
  }
  .gmid {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .moon {
    position: relative;
    width: min(100%, 380px);
    margin: 0 auto;
    aspect-ratio: 1;
  }
  .wide .moon {
    width: min(100%, 470px);
  }
  .moon svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .mface {
    fill: var(--paper);
  }
  .water {
    fill: var(--accent);
    fill-opacity: 0.3;
  }
  .mrim {
    fill: none;
    stroke: var(--accent);
    stroke-width: 3;
  }
  .mmid {
    position: absolute;
    inset: 22%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    text-align: center;
  }
  .digits {
    --fs-huge: calc(var(--fs-display) * 1.8);
    justify-content: center;
    min-height: min(46dvh, 380px);
  }
  .digits .time {
    font-size: var(--fs-huge);
  }
  .digits .next {
    margin-top: 10px;
  }
  .next {
    color: var(--hi);
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0 4px;
    margin: 18px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .side {
    flex: none;
  }
  .during {
    max-width: 520px;
    margin: 20px auto 0;
    padding: 14px 18px;
  }
  .during .zlabel {
    margin-top: 0;
  }
  .k {
    color: var(--ink-2);
    font-size: var(--fs-body);
  }
  .time {
    font: 800 var(--fs-display)/1 var(--font-brand);
    color: var(--ink);
  }
  .of {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 20px;
  }
  .acts.three {
    justify-content: center;
    gap: 24px;
    align-items: flex-start;
  }
  .big {
    min-height: 52px;
    min-width: 200px;
    border-radius: 12px;
  }
  .rb {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 88px;
    padding: 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 600 var(--fs-small)/1.2 var(--font-body);
    cursor: pointer;
  }
  .rc {
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    border: 1.5px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
  }
  .main .rc {
    width: 78px;
    height: 78px;
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .stop .rc {
    border-color: var(--bad);
    color: var(--bad);
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
    line-height: 1.35;
  }
  .row > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-2);
  }
  .row > span,
  .row > label {
    flex: 1;
    min-width: 0;
  }
  .row b {
    display: block;
    font-weight: 600;
  }
  .row small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .vr {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .vr input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    accent-color: var(--accent);
  }
  .swr {
    align-items: center;
    cursor: pointer;
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
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
</style>
