<script>
  /**
   * «Wochenplan» (Noah 09.11.2026, Thread «Prüfen: Trainingsplan Woche packbar», Auftrag «bau los»), part 2: the page.
   *   #/flow/wochenplan   the hours per week, the units with plus and minus, the week with times, what does not fit.
   * The planner is pure (lib/training/wochenplan.js, part 1); the goals live in the setting training.weekplan (backup
   * included, no api/). Rules, not AI: the same goals always give the same week. The «Meine Wochenziele» on Aktiv stay
   * separate: this plan neither fills nor replaces them. Part 3 (Noah 09.11.2026): ticking off by hand, progress, the
   * line «Up today» on Heute, past weeks frozen after Sunday, and a Strava suggestion that only suggests
   * (lib/training/wochenlog.js, setting training.weeklog). Part 4 (Noah 09.11.2026): fixed days and their wish time per
   * goal, moving a unit to another day or time (kept in training.weeklog for that week only), «Why here?» from the
   * planner's reason codes, and a conflict that offers two ways: the fix, or leave it.
   * Everything is a suggestion: each unit count can be changed, the whole plan can go back to the basic plan, and the last
   * change can be taken back.
   */
  import { liveQuery } from 'dexie';
  import { CalendarRange, Minus, Plus, Undo2, ChevronRight } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import { db } from '../../lib/db.js';
  import { mondayOf, shiftDay } from '../../lib/training.js';
  import { WEEKPLAN_KEY, GOAL_TYPES, FIXABLE, MAX_COUNT, MIN_HOURS, MAX_HOURS, TYPES, planOf, isSummer, defaultsFor, setHours, stepCount, toggleFix, setFixTime, followsHours, planWeek, plannedMins, countsMins } from '../../lib/training/wochenplan.js';
  import { WEEKLOG_KEY, QUIET, logOf, weekLog, withSnapshot, setDone, dismiss, setPins, movePin, clearPin, progress, suggest, pastWeeks } from '../../lib/training/wochenlog.js';
  import { UNIT_NAME, UNIT_HINT, LOAD_WORD, NOTE_TEXT, WARN_TEXT, whyOf, timeChoices, lengthOf, hoursOf, reachedPct, EXAMPLE_MONDAY } from '../../lib/training/wochenplan-text.js';
  import { t, tn, num, locale } from '../../lib/i18n.svelte.js';
  import { localDay } from '../../lib/localday.js';

  const today = localDay();
  const realMonday = mondayOf(today);
  const setQ = liveQuery(async () => (await db.settings.get(WEEKPLAN_KEY))?.value ?? null);
  // undefined while the setting is read, null when nothing was saved yet
  const stored = $derived($setQ);
  const loaded = $derived(stored !== undefined);
  const plan = $derived(planOf(stored));
  // part 3: the ticks and the frozen weeks (undefined while read), and this week's Strava activities
  const logQ = liveQuery(async () => (await db.settings.get(WEEKLOG_KEY))?.value ?? null);
  const log = $derived($logQ === undefined ? null : logOf($logQ));
  const actsQ = liveQuery(() => db.activities.where('day').between(realMonday, shiftDay(realMonday, 6), true, true).toArray().catch(() => []));

  let seasonPick = $state(isSummer(today) ? 'summer' : 'winter');
  let weekPick = $state(0); // 0 this week, 1 next week (only in the season of today)
  let msg = $state('');
  let history = $state.raw([]); // what Undo takes back, newest last: { plan: earlier stored value (null = nothing was saved) } or { pins, monday }; raw: IndexedDB cannot store a proxy
  let openMove = $state(null); // unit id whose «Move» is open
  let openWhy = $state(null); // unit id whose «Why here?» is open
  let kept = $state.raw([]); // conflicts the person chose to leave as they are (this visit only)

  const summer = $derived(seasonPick === 'summer');
  const cfg = $derived(summer ? plan.summer : plan.winter);
  const isNow = $derived(isSummer(realMonday) === summer);
  const monday = $derived(isNow ? shiftDay(realMonday, 7 * weekPick) : EXAMPLE_MONDAY[seasonPick]);
  // the units moved by hand in the week shown (this week and next week; the example week has none)
  const pinsShown = $derived(isNow ? weekLog(log ?? logOf(null), monday).pins : {});
  const week = $derived(planWeek(cfg, { monday, pins: pinsShown }));
  const mins = $derived(plannedMins(week.units));
  const pct = $derived(reachedPct(mins, cfg.hours));
  const byHand = $derived(!followsHours(cfg, summer));
  const nothing = $derived(GOAL_TYPES.every((k) => !cfg.counts[k]));
  const seasonOptions = $derived([
    { key: 'winter', name: t('Winter') },
    { key: 'summer', name: t('Summer') },
  ]);
  const weekOptions = $derived([
    { key: '0', name: t('This week') },
    { key: '1', name: t('Next week') },
  ]);

  const dayName = (d, style = 'long') => new Date(`${shiftDay(monday, d)}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: style });
  const nameOf = (type) => t(UNIT_NAME[type]);
  const lengthText = (m) => {
    const l = lengthOf(m);
    return t(l.text, { ...l.vars, h: num(l.vars.h) });
  };
  const hoursText = (m) => num(hoursOf(m));
  const unitById = (id) => week.units.find((u) => u.id === id);

  // ---- part 3: ticks, progress, frozen weeks, Strava ----
  const live = $derived(isNow && weekPick === 0); // only this week can be ticked; next week and the example can not
  const nowCfg = $derived(isSummer(realMonday) ? plan.summer : plan.winter);
  const nowWeek = $derived(planWeek(nowCfg, { monday: realMonday, pins: weekLog(log ?? logOf(null), realMonday).pins }));
  const done = $derived(weekLog(log ?? logOf(null), realMonday).done);
  const prog = $derived(progress(nowWeek.units, done));
  const star = $derived(prog.total > 0 && prog.done === prog.total);
  const sugg = $derived(live && log ? suggest(nowWeek.units, $actsQ ?? [], realMonday, done, weekLog(log, realMonday).no) : {});
  const past = $derived(log ? pastWeeks(log, today) : []);
  // the week is stored as it was last seen; after Sunday it stays as it is (freezing)
  $effect(() => {
    if (!loaded || stored === null || !log) return;
    const next = withSnapshot(log, realMonday, nowWeek.units, nowCfg.hours, today);
    if (next !== log) untrack(() => db.settings.put({ key: WEEKLOG_KEY, value: next }));
  });
  async function writeLog(change) {
    const cur = logOf((await db.settings.get(WEEKLOG_KEY))?.value);
    const next = change(cur);
    if (next !== cur) await db.settings.put({ key: WEEKLOG_KEY, value: next });
  }
  async function tick(u, on) {
    await writeLog((cur) => setDone(cur, realMonday, u.id, on, today, nowWeek.units, nowCfg.hours));
    msg = on ? t('Ticked off: {what}.', { what: nameOf(u.type) }) : t('Tick removed: {what}.', { what: nameOf(u.type) });
  }
  async function stravaYes(u) {
    await tick(u, true);
  }
  async function stravaNo(a) {
    await writeLog((cur) => dismiss(cur, realMonday, a.id, today));
    msg = t('All right, nothing ticked.');
  }
  const stravaLine = (a) => t('Strava: {what}, {len}. Does this fit the unit?', { what: a.name || t('Activity'), len: lengthText(Math.round((a.movingS || 0) / 60)) });
  const rangeText = (m) => {
    const f = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short' });
    return t('{from} to {to}', { from: f(m), to: f(shiftDay(m, 6)) });
  };
  const pastDay = (m, d) => new Date(`${shiftDay(m, d)}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short' });

  async function write(value, text) {
    history = [...history.slice(-19), { plan: stored ?? null }];
    if (value === null) await db.settings.delete(WEEKPLAN_KEY);
    else await db.settings.put({ key: WEEKPLAN_KEY, value });
    msg = text;
  }
  const commit = (nextCfg, text) => write({ ...planOf(stored), [seasonPick]: nextCfg }, text);

  const start = () => commit(cfg, t('Your weekly plan is saved. Change the hours or a unit any time.'));
  const hoursStep = (delta) => {
    const next = setHours(cfg, cfg.hours + delta, summer);
    return commit(next, t('Units suggested for {n} hours.', { n: next.hours }));
  };
  const suggestAgain = () => commit(setHours(cfg, cfg.hours, summer), t('Units suggested again from {n} hours.', { n: cfg.hours }));
  const step = (type, delta) => {
    const next = stepCount(cfg, type, delta, summer);
    return commit(next, t('{what}: {n} per week.', { what: nameOf(type), n: next.counts[type] }));
  };
  const reset = () => commit(defaultsFor(summer), t('Back to the basic plan.'));
  async function undo() {
    if (!history.length) return;
    const last = history[history.length - 1];
    history = history.slice(0, -1);
    if (last.pins) await writeLog((cur) => setPins(cur, last.monday, last.pins, today));
    else if (last.plan === null) await db.settings.delete(WEEKPLAN_KEY);
    else await db.settings.put({ key: WEEKPLAN_KEY, value: last.plan });
    msg = t('Taken back.');
  }

  // ---- part 4: fixed days, wish time, moving, why, conflicts ----
  const fixOn = (type, d) => (cfg.fixes[type] || []).some((f) => f.d === d);
  const fixedFull = (type) => (cfg.fixes[type] || []).length >= MAX_COUNT[type];
  function toggleDay(type, d) {
    const on = fixOn(type, d);
    return commit(toggleFix(cfg, type, d, summer), on ? t('{what} on {day} is no longer fixed.', { what: nameOf(type), day: dayName(d) }) : t('{what} on {day} is now fixed.', { what: nameOf(type), day: dayName(d) }));
  }
  const wishTime = (type, d, time) => commit(setFixTime(cfg, type, d, time), t('{what} on {day} now starts at {time}.', { what: nameOf(type), day: dayName(d), time }));
  async function changePins(change, text) {
    const cur = logOf((await db.settings.get(WEEKLOG_KEY))?.value);
    const before = weekLog(cur, monday).pins;
    const next = change(cur);
    if (next === cur) return;
    history = [...history.slice(-19), { pins: before, monday }];
    await db.settings.put({ key: WEEKLOG_KEY, value: next });
    msg = text;
  }
  // moves queue up one after the other, and a part left out (null) is taken from what is stored now, so two quick changes (day, then time) never undo each other
  let queue = Promise.resolve();
  const moveUnit = (u, d, time) => {
    const at = monday;
    queue = queue.then(async () => {
      const cur = logOf((await db.settings.get(WEEKLOG_KEY))?.value);
      const pin = weekLog(cur, at).pins[u.id];
      const nd = d ?? pin?.d ?? u.d;
      const nt = time ?? pin?.t ?? u.t;
      await changePins((c) => movePin(c, at, u.id, nd, nt, today), t('Moved: {what} is now on {day} at {time}. The rest of the week planned itself anew.', { what: nameOf(u.type), day: dayName(nd), time: nt }));
    });
    return queue;
  };
  const unmoveUnit = (u) => changePins((cur) => clearPin(cur, monday, u.id, today), t('{what} is back on the suggestion.', { what: nameOf(u.type) }));
  const whyText = (u) => {
    const w = whyOf(u.why);
    return t(w.text, { day: dayName(u.d), a: w.a ? t(w.a) : '', b: w.b ? t(w.b) : '' });
  };
  const warnKey = (w) => `${monday}|${w.key}|${w.d ?? ''}|${w.a ?? ''}|${w.b ?? ''}|${w.type ?? ''}`;
  // the way out a conflict offers: one less of a goal, or a moved unit back on the suggestion
  function wayOut(w) {
    if (w.fix?.unpin && unitById(w.fix.unpin)) return { label: t('Back to the suggestion: «{what}»', { what: nameOf(unitById(w.fix.unpin).type) }), run: () => unmoveUnit(unitById(w.fix.unpin)) };
    if (w.fix?.type && (cfg.counts[w.fix.type] || 0) > 0) return { label: t('One less: {what}', { what: nameOf(w.fix.type) }), run: () => step(w.fix.type, -1) };
    return null;
  }
  const leave = (w) => {
    kept = [...kept, warnKey(w)];
    msg = t('All right, it stays as it is.');
  };

  function goalMeta(type) {
    const bits = [];
    if (UNIT_HINT[type]) bits.push(t(UNIT_HINT[type]));
    else bits.push(t('{len} each', { len: lengthText(TYPES[type].mins) }));
    if (type === 'bikeOut' && summer && cfg.bikeHours) bits.push(t('{h} h together', { h: num(cfg.bikeHours) }));
    const fixed = Math.min((cfg.fixes[type] || []).length, cfg.counts[type] || 0);
    if (fixed) bits.push(t('{fixed} fixed, {free} free', { fixed, free: Math.max(0, (cfg.counts[type] || 0) - fixed) }));
    return bits.join(' · ');
  }
  const noteText = (n) => (NOTE_TEXT[n.key] ? t(NOTE_TEXT[n.key], { day: n.d == null ? '' : dayName(n.d), h: num(n.hours ?? 0) }) : '');
  const warnText = (w) =>
    t(WARN_TEXT[w.key] ?? WARN_TEXT['no-room'], {
      day: w.d == null ? '' : dayName(w.d),
      n: w.n ?? 0,
      type: w.type ? nameOf(w.type) : '',
      a: unitById(w.a) ? nameOf(unitById(w.a).type) : '',
      b: unitById(w.b) ? nameOf(unitById(w.b).type) : '',
    });
  const notes = $derived(week.notes.map(noteText).filter(Boolean));
  const hoursLine = $derived(
    cfg.hours >= 21
      ? t('Above about 20 hours it only fits with overload, so only what still fits is suggested.')
      : byHand
        ? t('You changed units by hand. The plan now has {h} hours.', { h: hoursText(mins) })
        : t('These units fit {n} hours. Change a unit with plus or minus if you want it more exact.', { n: cfg.hours }),
  );
  const rows = (d) => week.units.filter((u) => u.d === d);
  const quiet = (u) => u.type === 'med' || u.type === 'stretch';
</script>

<div class="wp" data-wochenplan>
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('Weekly plan')} />
    <PageHead title={t('Weekly plan')} text={t('Set your hours per week. The app suggests units and places them in the week. Everything can be changed.')} />
  </header>

  {#if !loaded}
    <p class="hint" role="status">{t('Loading…')}</p>
  {:else if stored === null}
    <!-- nothing saved yet: say why the page is empty and offer the next step -->
    <Empty icon={CalendarRange} title={t('No weekly plan yet')} text={t('A weekly plan turns your hours per week into units with times. Start with the basic plan and change it as it suits you.')} action={{ label: t('Start my weekly plan'), onclick: start }}>
      <a class="link" href="#/flow/plans">{t('Or look at the training plans')}</a>
    </Empty>
  {:else}
    <div class="ctl">
      <Seg options={seasonOptions} value={seasonPick} onchange={(k) => { seasonPick = k; weekPick = 0; }} label={t('Season')} chips />
      {#if isNow}<Seg options={weekOptions} value={String(weekPick)} onchange={(k) => (weekPick = Number(k))} label={t('Week')} chips />{/if}
      <button type="button" class="btn sm" onclick={undo} disabled={!history.length} data-wp-undo><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button>
    </div>
    <p class="msg" role="status" aria-live="polite" data-wp-msg>{msg}</p>
    {#if !isNow}<p class="hint">{t('This is the plan for the {season} season, shown with an example week.', { season: summer ? t('summer') : t('winter') })}</p>{/if}

    <div class="lay">
      <div class="col">
        <section class="card pc hrs" aria-labelledby="wp-hours" data-wp-hours>
          <h2 id="wp-hours">{t('Goal per week')}</h2>
          <div class="stepper">
            <button type="button" class="btn sm" onclick={() => hoursStep(-1)} disabled={cfg.hours <= MIN_HOURS} aria-label={t('One hour less')} data-wp-hdec><Minus size={18} aria-hidden="true" /></button>
            <output class="big num" data-wp-hvalue>{t('{n} h|plan', { n: cfg.hours })}</output>
            <button type="button" class="btn sm" onclick={() => hoursStep(1)} disabled={cfg.hours >= MAX_HOURS} aria-label={t('One hour more')} data-wp-hinc><Plus size={18} aria-hidden="true" /></button>
          </div>
          <p class="sub">{t('with meditation and stretching, without the rest block')}</p>
          <p class="plan num"><b data-wp-plan>{t('Plan: {a} h of {b} h', { a: hoursText(mins), b: cfg.hours })}</b></p>
          <span class="bar" role="img" aria-label={t('{n} percent of the goal', { n: pct })}><i style="width:{pct}%"></i></span>
          <p class="hint" data-wp-hint>{hoursLine}</p>
          {#if byHand}<button type="button" class="btn sm" onclick={suggestAgain} data-wp-again>{t('Suggest the units from the hours again')}</button>{/if}
        </section>

        {#if live && prog.total > 0}
          <section class="card pc prog" aria-labelledby="wp-prog" data-wp-progress>
            <h2 id="wp-prog">{t('This week so far')}</h2>
            <p class="big2 num"><b data-wp-done>{t('{a} of {b} units', { a: prog.done, b: prog.total })}</b></p>
            <span class="bar" role="img" aria-label={t('{a} of {b} units', { a: prog.done, b: prog.total })}><i style="width:{Math.round((prog.done / prog.total) * 100)}%"></i></span>
            <p class="sub" data-wp-quiet>{t('Meditation and stretching: {a} of {b}.', { a: prog.quietDone, b: prog.quietTotal })}</p>
            <p class="hint">{star ? t('Every unit of this week is ticked off.') : t('Tick a unit when you did it. Only you tick: Strava only suggests.')}</p>
          </section>
        {/if}

        <section class="card pc goals" aria-labelledby="wp-goals" data-wp-goals>
          <h2 id="wp-goals">{t('Units per week')}</h2>
          <ul class="glist">
            {#each GOAL_TYPES as type (type)}
              <li class="goal" data-goal={type}>
                <span class="gn"><b>{nameOf(type)}</b><small>{goalMeta(type)}</small></span>
                <span class="stepper sm">
                  <button type="button" class="btn sm" onclick={() => step(type, -1)} disabled={!cfg.counts[type]} aria-label={t('One less: {what}', { what: nameOf(type) })} data-wp-dec={type}><Minus size={16} aria-hidden="true" /></button>
                  <output class="num" aria-live="polite" data-wp-count={type}>{cfg.counts[type] || 0}</output>
                  <button type="button" class="btn sm" onclick={() => step(type, 1)} disabled={(cfg.counts[type] || 0) >= MAX_COUNT[type]} aria-label={t('One more: {what}', { what: nameOf(type) })} data-wp-inc={type}><Plus size={16} aria-hidden="true" /></button>
                </span>
                {#if FIXABLE.includes(type)}
                  <div class="fixrow" role="group" aria-label={t('Fixed days of {what}', { what: nameOf(type) })} data-wp-fixdays={type}>
                    <span class="lbl">{t('Fixed days')}</span>
                    {#each [0, 1, 2, 3, 4, 5, 6] as d (d)}
                      <button type="button" class="chip" aria-pressed={fixOn(type, d)} disabled={!fixOn(type, d) && fixedFull(type)} aria-label={t('{what} on {day}', { what: nameOf(type), day: dayName(d) })} onclick={() => toggleDay(type, d)} data-wp-fix={`${type}:${d}`}>{dayName(d, 'short')}</button>
                    {/each}
                  </div>
                  {#each cfg.fixes[type] || [] as f (f.d)}
                    <label class="wish">
                      <span>{dayName(f.d)}, {t('start time')}</span>
                      <select class="inp" value={f.t} onchange={(e) => wishTime(type, f.d, e.currentTarget.value)} aria-label={t('{what} on {day}: start time', { what: nameOf(type), day: dayName(f.d) })} data-wp-wish={`${type}:${f.d}`}>
                        {#each timeChoices(f.t) as c (c)}<option value={c}>{c}</option>{/each}
                      </select>
                    </label>
                  {/each}
                {/if}
              </li>
            {/each}
          </ul>
          <p class="hint">{t('Meditation every second day and stretching in between come on their own.')}</p>
          <button type="button" class="btn sm" onclick={reset} data-wp-reset>{t('Back to the basic plan')}</button>
        </section>
      </div>

      <div class="col">
        {#if week.warnings.length}
          <section class="card pc warn" aria-labelledby="wp-warn" data-wp-warn>
            <h2 id="wp-warn">{t('What does not fit')}</h2>
            <ul class="conflicts">
              {#each week.warnings as w, i (`${w.key}${i}`)}
                {@const way = wayOut(w)}
                {@const left = kept.includes(warnKey(w))}
                <li class="conf" data-wp-warning={w.key}>
                  <span>{warnText(w)}{#if left}<span class="tag">{t('left as is')}</span>{:else if way}{' '}{t('You have the choice:')}{/if}</span>
                  {#if !left}
                    <span class="sb">
                      {#if way}<button type="button" class="btn sm hi" onclick={way.run} data-wp-way>{way.label}</button>{/if}
                      <button type="button" class="btn sm" onclick={() => leave(w)} data-wp-leave>{t('Leave it|plan')}</button>
                    </span>
                  {/if}
                </li>
              {/each}
            </ul>
            <p class="hint">{t('Change a unit with plus or minus until it fits. The plan stays as it is until you do.')}</p>
          </section>
        {:else if !nothing}
          <p class="card pc good" data-wp-good><b>{t('It fits.')}</b> {tn(week.freeHalves, '{n} half day stays free', '{n} half days stay free', {})}, {t('at most {n} units a day, never more than two hard days in a row.', { n: Math.max(...week.perDay) })}</p>
        {/if}
        {#if notes.length}
          <details class="card pc fold" data-wp-notes>
            <summary>{t('What the plan changed on its own ({n})', { n: notes.length })}</summary>
            <ul>{#each notes as n (n)}<li>{n}</li>{/each}</ul>
          </details>
        {/if}

        {#if nothing}
          <Empty icon={CalendarRange} title={t('No units chosen')} text={t('With no unit the week stays empty. Let the app suggest units from your hours, or add one with plus.')} action={{ label: t('Suggest from {n} hours', { n: cfg.hours }), onclick: suggestAgain }} />
        {:else}
          <section class="card pc wk" aria-labelledby="wp-days" data-wp-week>
            <h2 id="wp-days" class="vh">{t('The days of the week')}</h2>
            {#each [0, 1, 2, 3, 4, 5, 6] as d (d)}
              {@const list = rows(d)}
              <div class="day" data-day={d}>
                <div class="dn">
                  <b>{dayName(d, 'short')}{#if isNow}{' '}{new Date(`${shiftDay(monday, d)}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric' })}.{/if}</b>
                  <span class="lpill {list.length ? week.dayLoad[d] : 'F'}">{t(LOAD_WORD[list.length ? week.dayLoad[d] : 'F'])}</span>
                </div>
                <div class="evs">
                  {#each list as u (u.id)}
                    <div class="u k-{TYPES[u.type].kind}" class:quiet={quiet(u)} class:withtick={live} class:ticked={live && done[u.id]} data-unit={u.id}>
                      {#if live}<label class="tk"><input type="checkbox" class="tick" checked={!!done[u.id]} onchange={(e) => tick(u, e.currentTarget.checked)} aria-label={t('Done: {what} on {day}', { what: nameOf(u.type), day: dayName(d) })} data-wp-tick={u.id} /></label>{/if}
                      <time>{u.t}</time>
                      <span class="t">{nameOf(u.type)}</span>
                      <span class="m num">{lengthText(u.mins)}{#if u.pinned}<span class="tag">{t('moved')}</span>{:else if u.fixed}<span class="tag">{t('fixed')}</span>{/if}{#if u.variant === 'intervals'}<span class="tag">{t('intervals')}</span>{/if}</span>
                      {#if !quiet(u)}
                        <div class="ux">
                          <span class="sb">
                            <button type="button" class="ab" aria-expanded={openWhy === u.id} onclick={() => { openWhy = openWhy === u.id ? null : u.id; openMove = null; }} data-wp-why-btn={u.id}>{t('Why here?')}</button>
                            {#if isNow}<button type="button" class="ab" aria-expanded={openMove === u.id} onclick={() => { openMove = openMove === u.id ? null : u.id; openWhy = null; }} data-wp-move-btn={u.id}>{t('Move')}</button>{/if}
                          </span>
                          {#if openWhy === u.id}
                            <p class="whybox" data-wp-why={u.id}>{whyText(u)}{#if u.pinned}{' '}<button type="button" class="ab" onclick={() => unmoveUnit(u)} data-wp-unmove={u.id}>{t('Back to the suggestion|plan')}</button>{/if}</p>
                          {/if}
                          {#if openMove === u.id && isNow}
                            <div class="whybox mv" data-wp-move={u.id}>
                              <label class="pick">{t('Day')}
                                <select class="inp" value={u.d} onchange={(e) => moveUnit(u, Number(e.currentTarget.value), null)} data-wp-move-day={u.id}>
                                  {#each [0, 1, 2, 3, 4, 5, 6] as dd (dd)}<option value={dd}>{dayName(dd)}</option>{/each}
                                </select>
                              </label>
                              <label class="pick">{t('Time')}
                                <select class="inp" value={u.t} onchange={(e) => moveUnit(u, null, e.currentTarget.value)} data-wp-move-time={u.id}>
                                  {#each timeChoices(u.t) as c (c)}<option value={c}>{c}</option>{/each}
                                </select>
                              </label>
                              <small class="muted">{t('The rest of the week plans itself anew.')}</small>
                              {#if u.pinned}<button type="button" class="ab" onclick={() => unmoveUnit(u)}>{t('Back to the suggestion|plan')}</button>{/if}
                            </div>
                          {/if}
                        </div>
                      {/if}
                      {#if sugg[u.id]}
                        <div class="strava" data-wp-strava={u.id}>
                          <span>{stravaLine(sugg[u.id])}</span>
                          <span class="sb">
                            <button type="button" class="btn sm" onclick={() => stravaYes(u)} data-wp-strava-yes={u.id}>{t('Yes, tick it')}</button>
                            <button type="button" class="btn sm" onclick={() => stravaNo(sugg[u.id])} data-wp-strava-no={u.id}>{t('No')}</button>
                          </span>
                        </div>
                      {/if}
                    </div>
                  {:else}
                    <p class="free">{t('Free.')}</p>
                  {/each}
                </div>
              </div>
            {/each}
          </section>
        {/if}

        <section class="card pc pastw" aria-labelledby="wp-past" data-wp-past>
          <h2 id="wp-past">{t('Past weeks')}</h2>
          {#each past as w (w.monday)}
            <details class="pw" data-past-week={w.monday}>
              <summary><span>{rangeText(w.monday)}</span><b class="num">{t('{a} of {b} units', { a: w.ticked, b: w.total })}</b></summary>
              <ul>
                {#each w.units.filter((x) => !QUIET.includes(x.type)) as x (x.id)}
                  <li class:miss={!w.done[x.id]}><span aria-hidden="true">{w.done[x.id] ? '✓' : '○'}</span> {pastDay(w.monday, x.d)} {x.t} · {nameOf(x.type)}<span class="vh">, {w.done[x.id] ? t('done') : t('not ticked')}</span></li>
                {/each}
              </ul>
            </details>
          {:else}
            <p class="hint" data-wp-past-empty>{t('A week shows up here when it is over.')}</p>
          {/each}
          <p class="hint">{t('A week is frozen after Sunday: later changes to the plan do not touch it.')}</p>
        </section>
      </div>
    </div>

    <!-- next step: what usually comes after the plan -->
    <nav class="next" aria-label={t('As next')} data-wp-next>
      <span class="nl">{t('As next')}</span>
      <a class="btn btn-link sm" href="#/flow" data-wp-to-goals>{t('Your week goals on Active')}<ChevronRight size={16} aria-hidden="true" /></a>
      <a class="btn btn-link sm" href="#/week" data-wp-to-week>{t('Plan the week with the weather')}<ChevronRight size={16} aria-hidden="true" /></a>
    </nav>
  {/if}
</div>

<style>
  .wp {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .wp :global(.pagehead) {
    margin: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }
  .ctl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-3);
  }
  .msg {
    margin: 0;
    min-height: 1.2em;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    min-width: 0;
  }
  .pc {
    padding: var(--sp-4);
    min-width: 0;
  }
  h2 {
    margin: 0 0 var(--sp-2);
    font: 600 var(--fs-body) var(--font-body);
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .sub,
  .hint {
    margin: var(--sp-2) 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .plan {
    margin: var(--sp-3) 0 var(--sp-2);
  }
  .stepper {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
  }
  .stepper .big {
    min-width: 5ch;
    text-align: center;
    font: 700 var(--fs-num) var(--font-body);
  }
  .stepper.sm {
    gap: var(--sp-2);
    flex-shrink: 0;
  }
  .stepper.sm output {
    min-width: 2ch;
    text-align: center;
    font-weight: 600;
  }
  .bar {
    display: block;
    height: 8px;
    border-radius: 999px;
    background: var(--line);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--accent, var(--ink));
    border-radius: 999px;
  }
  .glist {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .goal {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .goal:first-child {
    border-top: 0;
  }
  .gn {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .gn small {
    color: var(--ink-2);
  }
  .warn ul,
  .fold ul {
    margin: var(--sp-2) 0;
    padding-left: 1.2em;
  }
  .good {
    margin: 0;
  }
  .fold summary {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  .day {
    display: grid;
    grid-template-columns: 84px minmax(0, 1fr);
    gap: var(--sp-3);
    align-items: start;
    padding: 12px 0;
    border-top: 1px solid var(--line);
  }
  .day:first-of-type {
    border-top: 0;
  }
  .dn {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
  .lpill {
    padding: 1px 8px;
    border-radius: 999px;
    font-size: var(--fs-small);
    border: 1px solid var(--line);
  }
  .lpill.H {
    background: var(--warn-soft);
  }
  .lpill.M {
    background: var(--paper-2);
  }
  .evs {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .u {
    display: grid;
    grid-template-columns: 3.4em minmax(0, 1fr) auto;
    gap: var(--sp-2);
    margin: 0;
    align-items: baseline;
  }
  .u .t {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .u.quiet {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .u.withtick {
    grid-template-columns: 44px 3.4em minmax(0, 1fr) auto;
    column-gap: 0;
    align-items: center;
  }
  .u.withtick time,
  .u.withtick .t {
    padding-left: var(--sp-1);
  }
  .tk {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin: -8px 0;
    cursor: pointer;
  }
  .tick {
    width: 24px;
    height: 24px;
    margin: 0;
    accent-color: var(--accent, var(--ink));
    cursor: pointer;
  }
  .u.ticked .t {
    text-decoration: line-through;
    opacity: 0.7;
  }
  .fixrow {
    flex-basis: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .fixrow .lbl {
    font-size: var(--fs-small);
    color: var(--ink-2);
    margin-right: 4px;
  }
  .chip {
    min-width: 40px;
    min-height: 36px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }
  .chip:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .wish {
    flex-basis: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    font-size: var(--fs-small);
  }
  .ux {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .u.withtick .ux {
    margin-left: 44px;
  }
  .ab {
    min-height: 32px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .ab[aria-expanded='true'] {
    background: var(--paper-2);
  }
  .whybox {
    margin: 0;
    padding: 8px 10px;
    font-size: var(--fs-small);
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper-2);
  }
  .whybox.mv {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-3);
  }
  .pick {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .conflicts {
    margin: var(--sp-2) 0;
    padding: 0;
    list-style: none;
  }
  .conf {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .conf:first-child {
    border-top: 0;
  }
  .strava {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 4px 0 4px 44px;
    padding: 8px 10px;
    font-size: var(--fs-small);
    border: 1px dashed var(--accent, var(--ink-2));
    border-radius: 8px;
  }
  .sb {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .big2 {
    margin: 0 0 var(--sp-2);
    font: 700 var(--fs-num) var(--font-body);
  }
  .pw {
    border-top: 1px solid var(--line);
  }
  .pw:first-of-type {
    border-top: 0;
  }
  .pw summary {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
  }
  .pw ul {
    margin: 0 0 var(--sp-2);
    padding: 0;
    list-style: none;
  }
  .pw li {
    padding: 2px 0;
    font-size: var(--fs-small);
  }
  .pw li.miss {
    color: var(--ink-2);
  }
  @media (max-width: 640px) {
    .u {
      grid-template-columns: 3.4em minmax(0, 1fr);
    }
    .u .m {
      grid-column: 2;
      white-space: normal;
    }
    .u.withtick {
      grid-template-columns: 44px 3.4em minmax(0, 1fr);
    }
    .u.withtick .m {
      grid-column: 3;
    }
  }
  .u .m {
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .tag {
    margin-left: 6px;
    padding: 0 6px;
    border-radius: 999px;
    border: 1px solid var(--line);
  }
  .free {
    margin: 0;
    color: var(--ink-2);
  }
  .next {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
  }
  .nl {
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .link {
    color: var(--ink);
    text-decoration: underline;
  }
</style>
