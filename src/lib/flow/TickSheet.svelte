<script>
  import { backClose } from '../ui/backclose.js'; // Regeln der App (14.10.2026): back closes this window first
  /**
   * v0.51.0 «Im Flow»: the sheet of a long press on an activity, only when needed: where (Yoga
   * Studio / Zuhause), how many (Liegestütze +10 / +20 / own number), how long (optional), a commute,
   * or straight into the countdown.
   * Noah 20.10.2026 «4a»: «Hide tile» pauses the activity (it leaves «Heute abhaken», the history stays),
   * with «Undo»; it comes back under Aktiv › Aktivitäten (tap it, «Pause or delete» › «Resume»).
   * «Gestern nachtragen» (Noah 21.11.2026 «bitte hiermit fortfahren»): «When» above the rest: today, yesterday, the day before
   * or any earlier day (date field, up to a year back), and an optional time. The entry counts on that day.
   */
  import { untrack } from 'svelte';
  import Seg from '../ui/Seg.svelte';
  import MinInput from './MinInput.svelte';
  import { Timer, Bike, X, Check, EyeOff } from '@lucide/svelte';
  import { db } from '../db.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { ui, tickWith, openTimer, actName, goalName, clockState, dayWord } from './ui.svelte.js';
  import { t, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { quickDays, pickedDay, momentOf, BACK_MAX } from './nachtragen.js';
  import { addDays } from '../flow.js';

  const MIN_BUTTONS = [15, 30, 45, 60];
  let { st = null } = $props();
  let dlg = $state();
  let sub = $state(null);
  let amount = $state(null);
  let own = $state('');
  let min = $state(null);
  let today = $state(localDay());
  let whenKey = $state(localDay()); // a quick day (YYYY-MM-DD) or 'other'
  let otherDay = $state('');
  let time = $state('');

  const a = $derived(st?.act ?? null);
  $effect(() => {
    if (st && dlg && !dlg.open) {
      sub = st.goals.length > 1 ? st.openSub : null;
      amount = st.act.perTap;
      own = '';
      min = null;
      today = localDay();
      // «Gestern nichts abgehakt? Nachtragen» opens the window with the day already chosen
      const pre = untrack(() => ui.tickDay);
      ui.tickDay = null;
      whenKey = pre && quickDays(today).includes(pre) ? pre : today;
      otherDay = '';
      time = '';
      dlg.showModal();
    }
    if (!st && dlg?.open) dlg.close();
  });
  const close = () => (ui.tick = null);
  const n = $derived(amount === 'own' ? Math.max(1, Math.round(Number(own) || 0)) : amount);
  // the day the entry counts on: a quick choice, or the date field (null while it is empty or no day)
  const day = $derived(whenKey === 'other' ? pickedDay(otherDay, today) : whenKey);
  const quick = $derived(quickDays(today).map((d, i) => ({ key: d, name: i === 0 ? t('Today|day') : i === 1 ? t('Yesterday|day') : dayWord(d, today) })));
  const longDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
  const when = $derived(day && day !== today ? { day: day, at: momentOf(day, time, today) } : { day: undefined, at: momentOf(today, time, today) });
  async function go() {
    if (!a || !day) return;
    await tickWith(a, { sub: sub ?? undefined, n: a.perTap > 1 ? n : undefined, min: min ?? undefined, ...when });
    close();
  }
  async function commute() {
    if (!day) return;
    await tickWith(a, { via: 'commute', n: 1, ...when });
    close();
  }
  async function hide() {
    const id = a.id;
    const nm = actName(a);
    close();
    await db.flowActs.update(id, { paused: true });
    offerDone(t('«{name}» hidden. Show it again under Aktiv › Activities.', { name: nm }), () => db.flowActs.update(id, { paused: false }));
  }
  function clock() {
    const id = a.id;
    close();
    if (!clockState.tm) clockState.sub = sub;
    openTimer(id);
  }
</script>

<dialog use:backClose class="sheet from-below aksheet" bind:this={dlg} onclose={close} onclick={(e) => e.target === dlg && close()} aria-labelledby="tick-h" data-backdrop="own">
  {#if a}
    <div class="hd">
      <div class="ht"><h2 id="tick-h">{t('Tick {name}', { name: actName(a) })}</h2><p class="muted">{t('long press · only when needed')}</p></div>
      <button type="button" class="xb" aria-label={t('Close')} onclick={close}><X size={18} aria-hidden="true" /></button>
    </div>
    <p class="lbl" id="tick-when">{t('When')}</p>
    <Seg chips full={false} labelledby="tick-when" value={whenKey} onchange={(k) => (whenKey = k)} options={[...quick, { key: 'other', name: t('Other day') }]} />
    {#if whenKey === 'other'}
      <input class="inp when" type="date" data-when-day bind:value={otherDay} min={addDays(today, -BACK_MAX)} max={today} aria-label={t('Day')} />
      {#if otherDay && !day}<p class="hint bad" role="alert">{t('Pick a day from the last year, up to today.')}</p>{/if}
    {/if}
    <label class="tm"><span>{t('Time (optional)')}</span><input class="inp when" type="time" data-when-time bind:value={time} /></label>
    {#if day && day !== today}<p class="hint" data-when-note>{t('You tick off for {day}. It counts on that day in the weekly goals and in Analysis.', { day: longDay(day) })}</p>{/if}
    {#if st.goals.length > 1}
      <p class="lbl" id="tick-where">{t('Where')}</p>
      <Seg chips full={false} labelledby="tick-where" value={sub} onchange={(k) => (sub = k)} options={st.goals.map((r) => ({ key: r.goal.id, name: goalName(r.goal) }))} />
    {/if}
    <p class="lbl" id="tick-min">{t('Duration (optional)')}</p>
    <Seg chips full={false} labelledby="tick-min" value={min} onchange={(k) => (min = k)} options={[...MIN_BUTTONS].map((m) => ({ key: m, name: m === 60 ? '60 min' : String(m) }))} />
    <MinInput value={min} chips={MIN_BUTTONS} onset={(m) => (min = m)} id="tick-own-min" />
    {#if a.perTap > 1}
      <p class="lbl" id="tick-n">{t('How many')}</p>
      <Seg chips full={false} labelledby="tick-n" value={amount} onchange={(k) => (amount = k)} options={[{ key: a.perTap, name: `+${a.perTap}` }, { key: a.perTap * 2, name: `+${a.perTap * 2}` }, { key: 'own', name: t('own number') }]} />
      {#if amount === 'own'}<input class="inp own" type="number" inputmode="numeric" min="1" bind:value={own} aria-label={t('How many')} />{/if}
    {/if}
    <div class="rw">
      <span class="ib" aria-hidden="true"><Timer size={18} /></span>
      <span class="rt"><b>{t('Stopwatch')}</b><small>{t('runs until you are done, then ticks off')}</small></span>
      <button type="button" class="btn" onclick={clock}>{t('Start|check')}</button>
    </div>
    <div class="rw">
      <span class="ib" aria-hidden="true"><EyeOff size={18} /></span>
      <span class="rt"><b>{t('Hide tile')}</b><small>{t('the history stays; back under Aktiv › Activities')}</small></span>
      <button type="button" class="btn" onclick={hide} data-tick-hide>{t('Hide')}</button>
    </div>
    <div class="acts">
      {#if a.counts.includes('commute')}<button type="button" class="btn cm" onclick={commute}><Bike size={18} aria-hidden="true" />{t('Commute')}</button>{/if}
      <button type="button" class="btn" onclick={close}>{t('Cancel')}</button>
      <button type="button" class="btn hi" onclick={go} disabled={!day}><Check size={16} aria-hidden="true" />{t('Tick off')}</button>
    </div>
  {/if}
</dialog>

<style>
  /* v0.105.0 Design-Refresh P8 «Aktiv» (A2): the light window: the title with the close button, the
     choices as chips, the stopwatch as a row, «Abbrechen» and «Abhaken» at the bottom right */
  dialog.aksheet {
    width: min(640px, calc(100vw - 24px));
    padding: var(--sp-5);
    border-color: var(--card-line);
    border-radius: var(--radius-card);
  }
  .hd {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    margin-bottom: var(--sp-2);
  }
  .ht {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .muted {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .xb {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  dialog .lbl {
    margin: var(--sp-4) 0 6px;
  }
  .own {
    margin-top: 8px;
    max-width: 140px;
  }
  .when {
    margin-top: 8px;
    max-width: 180px;
  }
  .tm {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin-top: var(--sp-3);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tm .when {
    margin-top: 0;
  }
  .hint {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .hint.bad {
    color: var(--bad);
  }
  .rw {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin-top: var(--sp-4);
    padding-top: var(--sp-3);
    border-top: 1px solid var(--line);
  }
  .cm {
    margin-right: auto;
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .rt {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .rt b {
    display: block;
    font-weight: 500;
  }
  .rt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sp-2);
    margin-top: var(--sp-5);
  }
</style>
