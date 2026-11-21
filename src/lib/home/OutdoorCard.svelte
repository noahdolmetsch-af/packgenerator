<script>
  /**
   * «Draussen» (Noah 21.11.2026, Thread «Challenges in den Vordergrund stellen»): the card for a challenge with a daily
   * goal in minutes («90 minutes outdoors every day until 31.12.2026»), on top of Heute under the habits. Shows today's
   * minutes against the goal, adds minutes by hand (+15, +30, +60 or your own, Undo), counts Strava outdoor activities
   * by itself, and shows every day of the challenge as a dot. From 16:00 an open day gets a stronger frame and, with a
   * home place, the sunset and the latest start that still fits. Without a challenge one quiet line offers it
   * («Not now» asks again after 30 days). Everything is changeable: goal, days, name, end and delete (with Undo).
   * The record is the setting `outdoor` (src/lib/outdoor.js).
   */
  import { liveQuery } from 'dexie';
  import { TreePine, Pencil, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { putSetting } from '../flowdb.js';
  import { toast } from '../flow/ui.svelte.js';
  import MinInput from '../flow/MinInput.svelte';
  import DateInput from '../ui/DateInput.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { keepTyped } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { OUTDOOR_KEY, CHIPS, DEFAULT_GOAL_MIN, MAX_GOAL_MIN, outdoorOf, startOutdoor, standing, addMin, undoMin, allMin, lightLine, offerOpen, hm } from '../outdoor.js';
  import { addDays } from '../flow.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { today } = $props();

  const q = $derived(
    liveQuery(async () => {
      const [set, place] = await Promise.all([db.settings.get(OUTDOOR_KEY), db.settings.get(HOME_PLACE)]);
      const rec = outdoorOf(set?.value);
      const from = rec?.from ?? today;
      const acts = rec?.from ? await db.activities.where('day').between(from, rec.until, true, true).toArray() : [];
      return { rec, acts, place: place?.value ?? null };
    }),
  );
  const d = $derived($q);
  const rec = $derived(d?.rec ?? null);
  const live = $derived(rec?.from && !rec.closed && !rec.stopped ? rec : null);
  const st = $derived(live ? standing(live, d.acts, today) : null);
  const offer = $derived(!!d && !live && offerOpen(rec, today));
  const name = $derived(!live ? '' : live.name === 'Outdoors' ? t('Outdoors') : live.name);
  const over = $derived(st?.phase === 'over');
  const late = $derived(st?.phase === 'running' && !st.today.done && new Date().getHours() >= 16);
  const light = $derived(st?.phase === 'running' && d.place ? lightLine(d.place, today, st.today.left) : null);
  const totalMin = $derived(live && over ? allMin(live, d.acts, today) : 0);

  const save = (v) => putSetting(db, OUTDOOR_KEY, v);
  let kick = $state(0);
  async function add(n) {
    kick++;
    const next = addMin(live, today, n);
    if (next === live) return;
    await save(next);
    toast(t('+{n} min added for today.', { n }), () => save(undoMin(next, today)));
  }
  const notNow = () => save({ ...(rec ?? {}), no: today });
  const close = () => save({ ...live, closed: true, no: today });

  /* the window: start and change */
  let dialog = $state();
  let open = $state(false);
  let goal = $state(DEFAULT_GOAL_MIN);
  let from = $state('');
  let until = $state('');
  let nm = $state('');
  let bad = $state('');
  function openSheet() {
    goal = live?.goalMin ?? DEFAULT_GOAL_MIN;
    from = live?.from ?? today;
    until = live?.until ?? `${today.slice(0, 4)}-12-31`;
    nm = live ? (live.name === 'Outdoors' ? '' : live.name) : '';
    bad = '';
    open = true;
  }
  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  });
  async function submit(e) {
    e.preventDefault();
    const g = Math.round(Number(goal));
    if (!(g >= 1 && g <= MAX_GOAL_MIN)) return (bad = t('Whole minutes from 1 to {n}.', { n: MAX_GOAL_MIN }));
    if (!from || !until || until < from) return (bad = t('The last day comes after the first day.'));
    const base = live ? { ...live } : startOutdoor({ today, from, until, goalMin: g });
    await save(outdoorOf({ ...base, name: nm.trim() || 'Outdoors', goalMin: g, from, until, stopped: false, closed: false }));
    open = false;
  }
  async function stop() {
    const before = rec;
    await save({ ...live, stopped: true, no: today });
    open = false;
    toast(t('Challenge ended. The days stay saved.'), () => save(before));
  }
  async function remove() {
    const before = rec;
    const a = await askDelete({ title: t('Delete the challenge «{name}»?', { name }), text: t('All minutes you added by hand are deleted with it. Strava stays as it is.'), label: t('Delete') });
    if (a !== 'delete') return;
    open = false;
    await deleteWithUndo({ run: async () => (await save({ no: today }), before), undo: (b) => save(b), text: t('Challenge «{name}» deleted.', { name }), name });
  }
  const dayWord = (x) => new Date(`${x}T12:00:00Z`).getUTCDate() + '.';
  const hmText = (min) => {
    const { h, m } = hm(min);
    return h && m ? t('{h} h {m} min', { h, m }) : h ? t('{h} h|duration', { h }) : t('{m} min', { m });
  };
</script>

{#if live && st}
  <section class="oc" class:late class:done={st.today.done} aria-labelledby="oc-h" data-outdoor-card>
    <span class="mi" aria-hidden="true"><TreePine size={20} /></span>
    <span class="mt">
      <span id="oc-h" class="hd">
        {name}
        {#if st.phase === 'running'}<span class="no">· {t('Day {n} of {total}', { n: st.dayNo, total: st.total })}</span>
        {:else if st.phase === 'soon'}<span class="no">· {t('starts on {day}', { day: new Date(`${live.from}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', timeZone: 'UTC' }) })}</span>
        {:else}<span class="no">· {t('over')}</span>{/if}
      </span>
      {#if st.phase === 'running'}
        <span class="now" data-outdoor-now>
          {#if st.today.done}<Check size={16} strokeWidth={3} aria-hidden="true" /> {t('Done today: {min} of {goal} min', { min: st.today.total, goal: live.goalMin })}
          {:else}<b>{t('{min} of {goal} min today', { min: st.today.total, goal: live.goalMin })}</b> · {t('{n} min to go', { n: st.today.left })}{/if}
        </span>
        {#if st.today.strava > 0}<small data-outdoor-strava>{t('of that {n} min from Strava', { n: st.today.strava })}{#if st.today.hand > 0}, {t('{n} min from you', { n: st.today.hand })}{/if}</small>{/if}
      {:else if over}
        <span class="now" data-outdoor-over>{t('{n} of {total} days reached', { n: st.doneN, total: st.total })} · {hmText(totalMin)}</span>
      {/if}
    </span>
    <button type="button" class="pen" aria-label={t('Change the challenge')} title={t('Change the challenge')} onclick={openSheet} data-outdoor-change><Pencil size={16} aria-hidden="true" /></button>

    {#if st.phase === 'running'}
      <span class="bar" role="img" aria-label={t('{min} of {goal} min today', { min: st.today.total, goal: live.goalMin })}><i style:width="{Math.min(100, Math.round((st.today.total / live.goalMin) * 100))}%"></i></span>
      <span class="adds">
        {#each CHIPS as n (n)}<button type="button" class="btn sm" onclick={() => add(n)} data-outdoor-add={n}>{t('+{n} min', { n })}</button>{/each}
      </span>
      {#key kick}<MinInput value={null} chips={CHIPS} onset={add} id="outdoor-min" />{/key}
      {#if light}
        <small class="lt" data-outdoor-light>{#if light.latest}{t('The sun sets at {set}. Start by {latest} and the light is enough for the rest.', { set: light.set, latest: light.latest })}{:else}{t('The sun sets at {set}.', { set: light.set })}{/if}</small>
      {/if}
    {/if}

    <span class="dots" role="img" aria-label={t('{ok} days reached, {miss} missed', { ok: st.doneN, miss: st.missed })}>
      {#each st.days as g (g.day)}<i class={g.state} title={g.state === 'todo' ? dayWord(g.day) : `${dayWord(g.day)} · ${t('{n} min', { n: g.min ?? 0 })}`}></i>{/each}
    </span>
    <small class="sum">
      {tn(st.doneN, '{n} day reached', '{n} days reached')} · {t('{n} missed', { n: st.missed })}{#if st.streak > 1}{' · '}{tn(st.streak, '{n} day in a row', '{n} days in a row')}{/if} · {t('until {day}', { day: new Date(`${live.until}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) })}
    </small>
    {#if over}
      <span class="adds"><button type="button" class="btn sm" onclick={close} data-outdoor-close>{t('Close')}</button><button type="button" class="btn sm" onclick={openSheet}>{t('Start a new one')}</button></span>
    {/if}
  </section>
{:else if offer}
  <section class="none" data-outdoor-offer>
    <p>{t('Start a challenge with a daily goal? For example 90 minutes outdoors every day, counted by Strava and by you.')}</p>
    <span class="adds">
      <button type="button" class="btn hi sm" onclick={openSheet} data-outdoor-start><TreePine size={16} aria-hidden="true" />{t('Start')}</button>
      <button type="button" class="btn sm" onclick={notNow}>{t('Not now')}</button>
    </span>
  </section>
{/if}

<dialog use:keepTyped={'outdoor'} class="sheet oc-sheet" bind:this={dialog} use:backClose onclose={() => (open = false)} aria-labelledby="oc-sh">
  <form onsubmit={submit}>
    <h2 id="oc-sh" class="title">{live ? t('Your challenge') : t('Start a challenge')}</h2>
    <p class="muted">{t('Every day with enough minutes outdoors counts. Voluntary, changeable any time.')}</p>
    <label><span class="lbl">{t('Name')}</span><input class="inp" type="text" maxlength="40" placeholder={t('Outdoors')} bind:value={nm} /></label>
    <label><span class="lbl">{t('Minutes per day|challenge')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={goal} /></label>
    <div class="two">
      <label><span class="lbl">{t('First day')}</span><DateInput bind:value={from} /></label>
      <label><span class="lbl">{t('Last day')}</span><DateInput bind:value={until} min={from} /></label>
    </div>
    <p class="how">{t('Counts by itself: walking, hiking, running, a ride that is not on the trainer, skiing from Strava. Everything else you add with +15, +30, +60 or your own minutes.')}</p>
    {#if bad}<p class="bad" role="alert">{bad}</p>{/if}
    <div class="acts">
      <button type="submit" class="btn hi">{live ? t('Save') : t('Start')}</button>
      {#if live}<button type="button" class="btn" onclick={stop}>{t('End the challenge')}</button><button type="button" class="btn" onclick={remove}>{t('Delete')}</button>{/if}
      <button type="button" class="btn btn-link" onclick={() => (open = false)}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  .oc {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    padding: 12px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink);
    min-width: 0;
  }
  .oc.late {
    border-color: var(--hi);
    box-shadow: 0 0 0 2px var(--hi-soft);
  }
  .oc.done {
    border-color: var(--accent);
  }
  .mi {
    flex: none;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--accent);
    color: var(--paper);
  }
  .mt {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .hd {
    font: 650 var(--fs-body)/1.25 var(--font-body);
  }
  .no {
    color: var(--ink-3);
    font-weight: 500;
  }
  .now {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-body);
  }
  .mt small,
  .lt,
  .sum {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pen {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px -6px 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .bar {
    flex: 1 1 100%;
    height: 12px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .adds {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lt,
  .sum {
    flex: 1 1 100%;
  }
  .dots {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .dots i {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--paper-2);
    border: 1px solid var(--line);
  }
  .dots i.ok {
    background: var(--accent);
    border-color: var(--accent);
  }
  .dots i.miss {
    background: var(--bad-soft);
    border-color: var(--bad);
  }
  .dots i.today {
    border: 2px solid var(--hi);
    background: var(--paper);
  }
  .none {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    padding: 12px 16px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-card);
    color: var(--ink-2);
  }
  .none p {
    flex: 1 1 16rem;
    margin: 0;
    font-size: var(--fs-small);
  }
  form {
    display: grid;
    gap: 12px;
  }
  h2,
  p {
    margin: 0;
  }
  label {
    display: grid;
    gap: 4px;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .how {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bad {
    color: var(--bad);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
