<script>
  import PasstHier from '../lib/ui/PasstHier.svelte'; // Wegweiser 8: «Fits here»
  /**
   * «Woche planen» WP1 (mockup, Noah 15.10.2026 21:11 «1a 2a 3b 4a 5a»): #/week, the place «Woche».
   * Monday to Sunday with sport and the training plan, dates, to-dos, holidays and bike service, each
   * kind in its colour and deselectable (chips). Right: «Still to plan», the suggestions (take or skip),
   * the button «Plan the week» and a small form to add a date or a to-do. On a phone the days fold to
   * one line each (Noah «2a»), today open. Rules: lib/woche.js; data: lib/woche/load.js.
   */
  import { Plus, ChevronDown, ChevronUp, CalendarCheck, ChevronRight, Palmtree, Sun, CloudRain, CloudSun, Info, History } from '@lucide/svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Einstieg» for the place «Woche» (key weekplan)
  import FreeSlotCard from '../lib/freiezeit/FreeSlotCard.svelte'; // Idee A3: free time plus good weather
  import Seg from '../lib/ui/Seg.svelte';
  import Entry from '../lib/woche/Entry.svelte';
  import WeekPeople from '../lib/alltag/WeekPeople.svelte'; // «Alles finden»: people to see again this week
  import WeekDreams from '../lib/dreams/WeekDreams.svelte'; // Paket N idea 5: dreams and race deadlines of the week
  import { weekQuery, putWeek } from '../lib/woche/load.js';
  import { titleOf, subOf, dayName, shortDate, hours, holidayName, wxWords, reviewLine, hintText } from '../lib/woche/words.js';
  import { ITEMS_KEY, HIDE_KEY, NO_KEY, SG_OPEN_KEY, SG_OFF_KEY, SG_NEVER_KEY, SEASON_KEY, SUGG_SOURCES, TRAIN_NOTE, KINDS, KIND_NAMES, buildWeek, cleanItem, pruneItems, skipFor, planMonday, dotsOf, takeSuggestion } from '../lib/woche.js';
  import { homeForecast } from '../lib/home-weather.js';
  import { db } from '../lib/db.js';
  import { PLAN_KEY as TRAIN_KEY, mondayOf, shiftDay, isoWeek, prunePlan } from '../lib/training.js';
  import { actName } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';
  import { phone } from '../lib/media.svelte.js';
  import { PHONE_ROWS } from '../lib/touren/kurz.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';

  const today = localDay();
  const q = weekQuery(today);
  const src = $derived($q);
  let next = $state(false);
  const monday = $derived(shiftDay(mondayOf(today), next ? 7 : 0));
  const actOf = $derived(new Map((src?.flowActs ?? []).map((a) => [a.id, a])));
  // the home weather (Noah 18.10 «1a»): fetched at most every 3 hours, offline the saved one
  let forecast = $state(null);
  $effect(() => {
    homeForecast(db)
      .then((f) => (forecast = f))
      .catch(() => (forecast = null));
  });
  const week = $derived(src ? buildWeek({ ...src, forecast, monday, today, goalHours: src.goal?.hours ?? null, actName: (id) => actName(actOf.get(id)) || id }) : null);
  // «Planen als verbindende Mitte» 5a: «For 2.–8. Nov.» instead of a bare number range
  const rangeLong = $derived(`${new Date(`${monday}T12:00:00Z`).getUTCDate()}.–${new Date(`${shiftDay(monday, 6)}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short' })}`);
  const range = $derived(`${shortDate(monday)}–${shortDate(shiftDay(monday, 6))}`);
  const due = $derived(src && src.planned !== planMonday(today));

  async function saveItems(list) {
    await putWeek(ITEMS_KEY, pruneItems(list, today));
  }
  const items = () => src?.rawItems ?? [];
  const toggleDone = (e) => saveItems(items().map((x) => (x.id === e.id ? { ...x, done: !x.done } : x)));
  const remove = (e) => saveItems(items().filter((x) => x.id !== e.id));
  const toggleKind = (k) => putWeek(HIDE_KEY, src.hide.includes(k) ? src.hide.filter((x) => x !== k) : [...src.hide, k]);

  // Impeccable P5: every suggestion button says what it did and offers Undo
  async function take(s) {
    const before = { items: items(), sessions: src.sessions };
    const ch = takeSuggestion(s, { items: items(), sessions: src.sessions }, s.day, titleOf(s));
    if (ch.items) await saveItems(ch.items);
    if (ch.sessions) await putWeek(TRAIN_KEY, { sessions: prunePlan(ch.sessions, today) });
    offerDone(t('«{name}» planned for {day}.', { name: titleOf(s), day: dayName(s.day) }), async () => {
      if (ch.items) await saveItems(before.items);
      if (ch.sessions) await putWeek(TRAIN_KEY, { sessions: before.sessions });
    });
  }
  async function drop(s) {
    // a session paused by holidays: «leave it out» takes it out of the training plan
    const id = s.ref.slice('drop:'.length);
    const before = src.sessions;
    await putWeek(TRAIN_KEY, { sessions: prunePlan(src.sessions.filter((x) => x.id !== id), today) });
    offerDone(t('«{name}» left out of the training plan.', { name: titleOf(s) }), () => putWeek(TRAIN_KEY, { sessions: before }));
  }
  async function skip(s) {
    const before = src.no;
    await putWeek(NO_KEY, skipFor(src.no, s.ref, monday));
    offerDone(t('«{name}» waits until next week.', { name: titleOf(s) }), () => putWeek(NO_KEY, before));
  }

  /* add a date or a to-do */
  let form = $state(null);
  const startAdd = (kind) => (form = { kind, title: '', day: kind === 'date' ? (today >= monday ? today : monday) : '', time: '', mins: '' });
  // «Planen als verbindende Mitte» 3a (Noah 1.11.2026): «+ Einplanen» in every day opens the add form with that day
  const planDay = (day) => {
    form = { kind: 'todo', title: '', day, time: '', mins: '' };
    queueMicrotask(() => document.getElementById('wk-add')?.scrollIntoView({ block: 'center' }));
  };
  // «Planen als verbindende Mitte» 5a (Noah 1.11.2026): close the week - open to-dos of past days: move, drop or keep without a day
  let closeLater = $state(false);
  const openOld = $derived(
    next || closeLater ? [] : items().filter((x) => x.kind === 'todo' && !x.done && x.day && x.day < today && x.day >= shiftDay(today, -21)),
  );
  async function closeOne(x, how) {
    const before = items();
    const list = how === 'drop' ? before.filter((y) => y.id !== x.id) : before.map((y) => (y.id === x.id ? { ...y, day: how === 'move' ? today : null } : y));
    await saveItems(list);
    const msg = how === 'drop' ? t('«{name}» dropped.', { name: x.title }) : how === 'move' ? t('«{name}» moved to today.', { name: x.title }) : t('«{name}» kept without a day.', { name: x.title });
    offerDone(msg, () => saveItems(before));
  }
  const emptyWeek = $derived(!!week && week.days.every((d) => !d.entries.length));
  async function add(ev) {
    ev.preventDefault();
    const it = cleanItem(form);
    if (!it || (it.kind === 'date' && !it.day)) return;
    const extra = bufferItems(it, buf, (side, title, min) => t(side === 'before' ? 'Before: {title} ({n} min)' : 'After: {title} ({n} min)', { title, n: min })).map(cleanItem).filter(Boolean);
    await saveItems([...items(), it, ...extra]);
    form = null;
    buf = { before: 0, after: 0 };
  }
  // «Handy kürzer» (Noah 20.10.2026 «4b»): on a phone «Still to plan» shows PHONE_ROWS suggestions, then «Show n more»
  let sgAll = $state(false);
  const sgShown = $derived(week ? (phone.matches && !sgAll ? week.suggestions.slice(0, PHONE_ROWS) : week.suggestions) : []);
  const sgMore = $derived(week ? week.suggestions.length - sgShown.length : 0);
  const sgOpen = $derived(!!src?.sgOpen);
  // «Where do the suggestions come from?» (Noah 2.11.2026 «a»): each source on or off; Undo
  const SOURCE_NAMES = { todo: 'Own to-dos without a day', google: 'Google tasks', bike: 'Bike care', tour: 'Before a trip: packing list, weather, bike check', season: 'Season ideas', sport: 'Sport: rainy days and holidays' };
  async function toggleSource(k) {
    const before = src.sgOff;
    const on = before.includes(k);
    await putWeek(SG_OFF_KEY, on ? before.filter((x) => x !== k) : [...before, k]);
    offerDone(on ? t('«{name}» is suggested again.', { name: t(SOURCE_NAMES[k]) }) : t('«{name}» is no longer suggested.', { name: t(SOURCE_NAMES[k]) }), () => putWeek(SG_OFF_KEY, before));
  }
  // the source fold keeps its own state: a reload of the week data must not close what was opened
  let srcOpen = $state(false);
  let neverOpen = $state(false);
  // «Never suggest again» (Noah 2.11.2026 «b»): one suggestion away for good; the list «Put away» brings it back
  async function never(s) {
    const before = src.sgNever;
    const name = titleOf(s);
    await putWeek(SG_NEVER_KEY, [...before.filter((x) => x.ref !== s.ref), { ref: s.ref, title: name }]);
    offerDone(t('«{name}» is no longer suggested.', { name }), () => putWeek(SG_NEVER_KEY, before));
  }
  const showAgain = (n) => putWeek(SG_NEVER_KEY, src.sgNever.filter((x) => x.ref !== n.ref));
  const seasonSettings = $derived(seasonCfg(src?.seasons));
  const saveSeasons = (cfg) => putWeek(SEASON_KEY, cfg);
  let ideasOpen = $state(false);
  const toggleSg = () => putWeek(SG_OPEN_KEY, !sgOpen);
  const hidden = (k) => src?.hide.includes(k);
  import SeasonIdeas from '../lib/woche/SeasonIdeas.svelte'; // Noah 2.11.2026 «c»
  import { seasonCfg } from '../lib/woche/kalender.js';
  import BufferPick from '../lib/stand/BufferPick.svelte'; // Paket A part 3: buffer before and after a date
  import { bufferItems } from '../lib/stand/stand.js';
  import AllHere from '../lib/ui/AllHere.svelte'; // «Alles hier»: every Planen function one tap away (Noah 03.11.2026 «1a»)
  let buf = $state({ before: 0, after: 0 });
</script>

<div class="wkp">
  <PageHead title={next ? t('Next week') : t('This week')} text={t('For {range} · week {n}. Your dates and planned tasks. You accept new suggestions yourself.', { n: isoWeek(monday), range: rangeLong })} />
  <AreaIntro place="weekplan" />
  <AllHere area="plan" />
  <FreeSlotCard />

  {#if week}
    <div class="top">
      <Seg label={t('Which week')} full={false} options={[{ key: 'now', name: t('This week') }, { key: 'next', name: t('Next week') }]} value={next ? 'next' : 'now'} onchange={(k) => (next = k === 'next')} />
      <!-- Impeccable P5: the filter chips fold away, so the days come right under the title -->
      <details class="wfold" data-week-filters open={src.hide.length > 0}>
        <summary>{src.hide.length ? tn(src.hide.length, 'Filter · {n} hidden', 'Filter · {n} hidden|pl') : t('Filter|week')}</summary>
        <div class="chips" role="group" aria-label={t('Show in the week')}>
          {#each KINDS as k (k)}
            <button type="button" class="chip k-{k}" aria-pressed={!hidden(k)} data-filter={k} onclick={() => toggleKind(k)}><span class="dot" aria-hidden="true"></span>{t(KIND_NAMES[k])}</button>
          {/each}
        </div>
      </details>
    </div>

    <p class="sum" data-week-sum>
      <span>{tn(week.sums.sessions, '{n} session|week', '{n} sessions|week')}{#if week.sums.mins}{' · '}<b class="num">{hours(week.sums.mins)}</b>{/if}{#if week.sums.goalMins}{' '}{t('(plan: {h})', { h: hours(week.sums.goalMins) })}{/if}</span>
      <span>{tn(week.sums.dates, '{n} date', '{n} dates')}</span>
      <span>{tn(week.sums.todos, '{n} to-do', '{n} to-dos')}</span>
      {#if week.sums.away.length}<span><Palmtree size={14} aria-hidden="true" /> {week.sums.away.length === 1 ? dayName(week.sums.away[0]) : `${dayName(week.sums.away[0])}–${dayName(week.sums.away.at(-1))}`}</span>{/if}
      {#if week.sums.bike}<span>{tn(week.sums.bike, '{n} bike job open', '{n} bike jobs open')}</span>{/if}
    </p>
    {#if reviewLine(week.review) || week.hints.length}
      <div class="notes">
        {#if reviewLine(week.review)}<p class="why" data-review><History size={15} aria-hidden="true" /><span>{reviewLine(week.review)}</span></p>{/if}
        {#each week.hints as h (h.key + (h.day ?? ''))}<p class="why" data-load-hint={h.key}><Info size={15} aria-hidden="true" /><span>{hintText(h)}</span></p>{/each}
      </div>
    {/if}

    {#if openOld.length}
      <section class="wclose" data-week-close aria-label={t('Close the week')}>
        <h2>{t('Close the week')}</h2>
        <p class="why">{t('Still open from earlier days ({n}). You decide on each one.', { n: openOld.length })}</p>
        {#each openOld as x (x.id)}
          <div class="wc-row" data-close-row>
            <span class="wc-t">{x.title}<small>{dayName(x.day)}</small></span>
            <span class="wc-b">
              <button type="button" class="btn" data-close-move onclick={() => closeOne(x, 'move')}>{t('Move to today')}</button><button type="button" class="btn" data-close-drop onclick={() => closeOne(x, 'drop')}>{t('Drop|week')}</button><button type="button" class="btn" data-close-keep onclick={() => closeOne(x, 'keep')}>{t('Keep without a day')}</button>
            </span>
          </div>
        {/each}
        <button type="button" class="btn" data-close-later onclick={() => (closeLater = true)}>{t('Later')}</button>
      </section>
    {/if}
    {#if emptyWeek}
      <p class="emptytop" data-week-empty><a class="btn hi" href="#/week/plan" data-plan-week-top><CalendarCheck size={18} aria-hidden="true" />{due ? t('Plan the week (10 min)') : t('Plan the week again')}</a><span class="why">{t('Nothing planned yet. Plan the week or add a day yourself.')}</span></p>
    {/if}
    <div class="lay">
      <section class="days" class:slim={emptyWeek} aria-label={t('The days of the week')}>
        {#each week.days as d (d.day)}
          {#if phone.matches}
            <details class="dr" class:today={d.today} open={d.today || undefined} data-day={d.day}>
              <summary>
                <b>{dayName(d.day)}</b>
                {#if d.wx}{@render wxMark(d.wx)}{/if}
                <span class="dots" aria-hidden="true">{#each dotsOf(d) as k (k)}<i class="k-{k}"></i>{/each}</span>
                <span class="cnt">{d.holiday ? holidayName(d.holiday) : d.today ? t('today') : tn(d.entries.length, '{n} entry', '{n} entries')}</span>
                <ChevronRight size={18} aria-hidden="true" />
              </summary>
              <div class="ens">
                {#each d.entries as e (e.id)}<Entry {e} ondone={toggleDone} onremove={remove} />{:else}<p class="none">{t('Nothing planned')}</p>{/each}
                {#if !d.past}<button type="button" class="dayadd" onclick={() => planDay(d.day)} data-day-add={d.day}><Plus size={16} aria-hidden="true" />{t('Add to plan')}</button>{/if}
              </div>
            </details>
          {:else}
            <div class="dc" class:today={d.today} class:past={d.past} data-day={d.day}>
              <h3><span>{dayName(d.day).split(' ')[0]}</span> <b class="num">{dayName(d.day).split(' ').slice(1).join(' ')}</b></h3>
              {#if d.wx || d.holiday}<p class="dm">{#if d.wx}{@render wxMark(d.wx)}{/if}{#if d.holiday}<span class="hol" data-holiday={d.holiday}>{holidayName(d.holiday)}</span>{/if}</p>{/if}
              {#each d.entries as e (e.id)}<Entry {e} ondone={toggleDone} onremove={remove} />{/each}
              {#if !d.past}<button type="button" class="dayadd" onclick={() => planDay(d.day)} data-day-add={d.day}><Plus size={16} aria-hidden="true" />{t('Add to plan')}</button>{/if}
            </div>
          {/if}
        {/each}
      </section>

      <aside class="side">
        <section class="card wc sg" aria-labelledby="wk-sg">
          <h2 id="wk-sg"><button type="button" class="sgh" aria-expanded={sgOpen} aria-controls="wk-sg-body" data-sg-toggle onclick={toggleSg}>
            <span>{t('Still to plan')}<small>{tn(week.suggestions.length, '{n} suggestion', '{n} suggestions')}</small></span>
            {#if sgOpen}<ChevronUp size={18} aria-hidden="true" />{:else}<ChevronDown size={18} aria-hidden="true" />{/if}
          </button></h2>
          {#if sgOpen}
          <div id="wk-sg-body">
          <p class="why">{t('The app suggests, you decide. Take puts it on the day shown.')}</p>
          <details class="srcs" data-sg-sources open={srcOpen || src.sgOff.length > 0} ontoggle={(e) => (srcOpen = e.currentTarget.open)}>
            <summary>{src.sgOff.length ? tn(src.sgOff.length, 'Sources · {n} off', 'Sources · {n} off|pl') : t('Where do the suggestions come from?')}</summary>
            <ul class="srclist">
              {#each SUGG_SOURCES as k (k)}
                <li><label><input type="checkbox" checked={!src.sgOff.includes(k)} data-sg-source={k} onchange={() => toggleSource(k)} /><span>{t(SOURCE_NAMES[k])}<small>{tn(week.sources[k], '{n} suggestion', '{n} suggestions')}</small></span></label></li>
              {/each}
            </ul>
            <p class="why">{t('Switch off what you do not want to see. Your own to-dos and Google stay as they are.')}</p>
            <details class="srcs" data-sg-ideas open={ideasOpen} ontoggle={(e) => (ideasOpen = e.currentTarget.open)}>
              <summary>{t('Change season ideas')}</summary>
              <SeasonIdeas cfg={seasonSettings} onsave={saveSeasons} />
            </details>
          </details>
          <ul>
            {#each sgShown as s (s.ref)}
              <li class="k-{s.kind}" data-sugg={s.ref}>
                <span class="dot" aria-hidden="true"></span>
                <span class="st"><b>{titleOf({ ...s, sessionKind: s.sessionKind })}</b><small>{[subOf(s), s.day && s.act === 'take' ? t('suggested: {day}', { day: dayName(s.day) }) : ''].filter(Boolean).join(' · ')}</small></span>
                <span class="sb">
                  {#if s.act === 'drop'}<button type="button" class="btn sm" onclick={() => drop(s)}>{t('Leave out')}</button>
                  {:else if s.act === 'move'}<button type="button" class="btn sm" onclick={() => take(s)}>{t('Move|week')}</button>
                  {:else if s.day}<button type="button" class="btn sm" onclick={() => take(s)}>{t('Take')}</button>{/if}
                  <button type="button" class="btn sm" onclick={() => skip(s)}>{t('Not this week')}</button>
                  <button type="button" class="btn sm" data-sg-never onclick={() => never(s)}>{t('Never suggest')}</button>
                </span>
              </li>
            {:else}
              <li class="none">{t('Nothing left to plan.')}</li>
            {/each}
          </ul>
          {#if src.sgNever.length}
            <details class="srcs" data-sg-never-list open={neverOpen} ontoggle={(e) => (neverOpen = e.currentTarget.open)}>
              <summary>{tn(src.sgNever.length, 'Put away · {n}', 'Put away · {n}|pl')}</summary>
              <ul class="srclist">
                {#each src.sgNever as n (n.ref)}
                  <li class="nv"><span>{n.title || n.ref}</span><button type="button" class="btn sm" data-sg-again={n.ref} onclick={() => showAgain(n)}>{t('Show again')}</button></li>
                {/each}
              </ul>
              <p class="why">{t('The app does not suggest these any more.')}</p>
            </details>
          {/if}
          {#if sgMore > 0}
            <button type="button" class="phone-more" onclick={() => (sgAll = true)} data-sugg-more><ChevronDown size={16} aria-hidden="true" />{tn(sgMore, 'Show {n} more suggestion', 'Show {n} more suggestions')}</button>
          {/if}
          </div>
          {/if}
          <a class="btn hi" href="#/week/plan" data-plan-week><CalendarCheck size={18} aria-hidden="true" />{due ? t('Plan the week (10 min)') : t('Plan the week again')}</a>
        </section>

        <WeekDreams {monday} {today} />
        <WeekPeople {monday} {today} />

        <section class="card wc add" aria-labelledby="wk-add">
          <h2 id="wk-add">{t('Add')}</h2>
          {#if form}
            <form onsubmit={add} data-week-form>
              <label>{form.kind === 'date' ? t('Date|week') : t('To-do')}<input type="text" bind:value={form.title} required maxlength="80" placeholder={form.kind === 'date' ? t('e.g. Dentist') : t('e.g. Order a tube')} /></label>
              <div class="two">
                <label>{t('Day')}<input type="date" bind:value={form.day} required={form.kind === 'date'} /></label>
                {#if form.kind === 'date'}<label>{t('Time')}<input type="time" bind:value={form.time} /></label>{/if}
              </div>
              {#if form.kind === 'date'}<BufferPick bind:before={buf.before} bind:after={buf.after} />{/if}
              {#if form.kind === 'todo'}<label>{t('Time needed (minutes, optional)')}<input type="number" min="5" max="480" step="5" bind:value={form.mins} placeholder="30" data-todo-mins /></label>{/if}
              {#if form.kind === 'todo'}<p class="why">{t('Without a day it waits under «Still to plan».')}</p>{/if}
              <div class="fb"><button type="submit" class="btn">{t('Save')}</button><button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button></div>
            </form>
          {:else}
            <div class="fb">
              <button type="button" class="btn" onclick={() => startAdd('date')} data-add="date"><Plus size={16} aria-hidden="true" />{t('Date|week')}</button>
              <button type="button" class="btn" onclick={() => startAdd('todo')} data-add="todo"><Plus size={16} aria-hidden="true" />{t('To-do')}</button>
              <a class="btn" href="#/week/away"><Palmtree size={16} aria-hidden="true" />{t('Holidays|tab')}</a>
            </div>
          {/if}
          <p class="why">{t(TRAIN_NOTE)}</p>
        </section>
      </aside>
    </div>
  {/if}
  <!-- Wegweiser 8: fewer things at once while planning the week, and the evening -->
  <PasstHier place="woche" />
</div>

{#snippet wxMark(wx)}
  <span class="wx" class:wet={wx.wet} data-wx={wx.wet ? 'wet' : wx.dry ? 'dry' : 'showers'}>
    {#if wx.wet}<CloudRain size={15} aria-hidden="true" />{:else if wx.dry}<Sun size={15} aria-hidden="true" />{:else}<CloudSun size={15} aria-hidden="true" />{/if}
    <span class="sr">{wxWords(wx)}</span>{#if wx.max != null}<span class="num" aria-hidden="true">{Math.round(wx.max)}°</span>{/if}
  </span>
{/snippet}

<style>
  .wkp {
    max-width: 1240px;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    margin: 0 0 12px;
  }
  .wfold > summary {
    cursor: pointer;
    color: var(--muted);
    font-size: var(--fs-small);
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
  .wfold[open] > summary {
    margin-bottom: 6px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    --k: var(--wk-sport);
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 40px;
    padding: 6px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='false'] {
    border-style: dashed;
    color: var(--ink-2);
  }
  .chip[aria-pressed='false'] .dot {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--k);
  }
  .k-date {
    --k: var(--wk-date);
  }
  .k-todo {
    --k: var(--wk-todo);
  }
  .k-away {
    --k: var(--wk-away);
  }
  .k-bike {
    --k: var(--wk-bike);
  }
  .k-sport {
    --k: var(--wk-sport);
  }
  .dot,
  .dots i {
    display: inline-block;
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--k);
  }
  .sum {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    margin: 0 0 16px;
    color: var(--ink-2);
  }
  .sum span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .sum b {
    color: var(--ink);
  }
  /* the seven days take the full width; «Still to plan» and «Add» sit beneath them, beside only on very wide screens */
  .notes {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: -4px 0 14px;
  }
  .notes p {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0;
  }
  .notes :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .dm {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: -2px 0 2px;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
  .wx {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
  .wx.wet {
    color: var(--wk-date);
  }
  .hol {
    padding: 1px 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--wk-away) 16%, var(--paper));
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }
  .dc {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    min-height: 320px;
    padding: 10px 8px;
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .days.slim .dc {
    min-height: 120px;
  }
  .dayadd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 44px;
    margin-top: auto;
    border: 1px dashed var(--line-strong);
    border-radius: 8px;
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .emptytop {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 40px;
    margin: 0 0 12px;
  }
  .dc.today {
    outline: 2px solid var(--pc);
    outline-offset: 1px;
  }
  .dc.past {
    opacity: 0.8;
  }
  .dc h3 {
    display: flex;
    justify-content: space-between;
    margin: 0 2px 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .dc h3 b {
    color: var(--ink);
    font-size: var(--fs-body);
  }
  .side {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }
  @media (min-width: 1800px) {
    .lay {
      grid-template-columns: minmax(0, 1fr) 300px;
    }
    .side {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .wc {
    padding: 16px;
  }
  h2 {
    margin: 0 0 4px;
    font-size: var(--fs-section);
  }
  .why {
    margin: 0 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .srcs > summary {
    cursor: pointer;
    color: var(--muted);
    font-size: var(--fs-small);
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  .sg .srclist li {
    border-top: 0;
    padding: 2px 0;
  }
  .sg .srclist label {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    min-height: 44px;
    width: 100%;
    text-align: left;
  }
  .sg .srclist input {
    flex: none;
    width: 20px;
    height: 20px;
    margin: 0;
  }
  .sg .srclist li.nv {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
  }
  .srclist span {
    flex: 1;
    min-width: 0;
    text-align: left;
  }
  .srclist small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sgh {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .sgh small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .sg ul {
    margin: 0 0 14px;
    padding: 0;
    list-style: none;
  }
  .sg li {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .sg li .dot {
    margin-top: 6px;
  }
  .st {
    flex: 1;
    min-width: 0;
  }
  .st b {
    display: block;
    font-weight: 600;
  }
  .st small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sb {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
    padding-left: 18px;
  }
  .none {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sg .btn.hi {
    width: 100%;
    justify-content: center;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  input {
    min-height: 44px;
    font: inherit;
    font-weight: 400;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .fb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0 10px;
  }
  /* phone: one line per day (summary), today open */
  .dr {
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .dr.today {
    outline: 2px solid var(--pc);
  }
  summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 0 14px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary b {
    width: 64px;
    flex: none;
  }
  summary .dots {
    display: flex;
    gap: 4px;
  }
  summary .cnt {
    flex: 1;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .dr[open] summary :global(svg) {
    transform: rotate(90deg);
  }
  .ens {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 14px 14px;
  }
  @media (max-width: 1100px) {
    .side {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 719px) {
    .days {
      grid-template-columns: minmax(0, 1fr);
    }
    .chip {
      min-height: 44px;
    }
  }
  /* «Handy kürzer» (Noah 20.10.2026 «4b»): the rest of «Still to plan» after one tap */
  .phone-more {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 44px;
    margin: var(--sp-2) 0 var(--sp-3);
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .wclose{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:14px;margin:10px 0}
  .wclose h2{font-size:var(--fs-sub);margin:0 0 4px}
  .wc-row{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;border:1px solid var(--line);border-radius:10px;padding:10px;margin:6px 0}
  .wc-t{display:flex;flex-direction:column;font-weight:600}.wc-t small{font-weight:400;color:var(--muted)}
  .wc-b{display:flex;gap:6px;flex-wrap:wrap}
</style>
