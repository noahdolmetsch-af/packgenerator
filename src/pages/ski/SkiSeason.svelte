<script>
  /**
   * Paket P2 «Skitour» (mockups R8, R11, R13 and V5, Noah 21.10.2026): #/ski/season, the season around the
   * tours. In October a countdown to the season start; the season goal (tours, metres climbed) with its
   * progress; wish tours (add, rename, tick off, reorder with arrows and drag, delete with Undo); ski days of
   * the last eight weeks; transceiver practice; courses with «Auffrischen» after two years; metres climbed
   * per ski (from «Nach der Tour»); last season in short. Rules: lib/skiplan.js.
   */
  import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Pencil, CalendarClock } from '@lucide/svelte';
  import { skiQuery, updSkiSetting } from '../../lib/ski/skidb.js';
  import { seasonStats } from '../../lib/ski.js';
  import { GOAL_KEY, WISHES_KEY, LVS_KEY, COURSES_KEY, goalOf, goalProgress, addWish, renameWish, dropWish, moveWish, toggleWish, lvsOfSeason, courseDue, skiWeeks, daysToSeason, lastSeason, hmPerSki } from '../../lib/skiplan.js';
  import { sortable } from '../../lib/ui/sortable.js';
  import SortGrip from '../../lib/ui/SortGrip.svelte';
  import SortArrows from '../../lib/ui/SortArrows.svelte';
  import { askDelete, deleteWithUndo } from '../../lib/ui/ask.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn, num, nameOf, locale } from '../../lib/i18n.svelte.js';

  const today = localDay();
  const q = skiQuery();
  const data = $derived($q);
  const trips = $derived(data?.trips ?? []);
  const stats = $derived(seasonStats(trips, today));
  const goal = $derived(goalOf(data?.goal, stats.id));
  const prog = $derived(goalProgress(goal, stats));
  const wishes = $derived(data?.wishes ?? []);
  const lvs = $derived(lvsOfSeason(data?.lvs, stats.id));
  const courses = $derived(data?.courses ?? []);
  const weeks = $derived(skiWeeks(trips, today));
  const maxWeek = $derived(Math.max(1, ...weeks.map((w) => w.n)));
  const toStart = daysToSeason(today);
  const last = $derived(lastSeason(trips, today));
  const perSki = $derived(hmPerSki(trips, today));
  const itemName = (id) => {
    const i = (data?.items ?? []).find((x) => x.id === id);
    return i ? nameOf(i) : t('Ski (deleted)');
  };
  const shortDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const weekDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
  const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  /* the goal */
  const setGoal = (key, value) => {
    const n = Number(String(value).replace(/[^\d]/g, ''));
    return updSkiSetting(GOAL_KEY, (g) => ({ ...g, [stats.id]: { ...(g?.[stats.id] ?? {}), [key]: Number.isFinite(n) ? n : 0 } }), {});
  };

  /* wish tours */
  let wishName = $state('');
  let editing = $state(null);
  let editName = $state('');
  const saveWishes = (fn) => updSkiSetting(WISHES_KEY, fn);
  async function addOne(e) {
    e.preventDefault();
    if (!wishName.trim()) return;
    const name = wishName;
    wishName = '';
    await saveWishes((list) => addWish(list, name, uid('wish')));
  }
  function startEdit(w) {
    editing = w.id;
    editName = w.name;
  }
  async function endEdit(e) {
    e?.preventDefault?.();
    if (!editing) return;
    const id = editing;
    editing = null;
    await saveWishes((list) => renameWish(list, id, editName));
  }
  async function removeWish(w) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: w.name }), text: t('The wish tour goes from the list. Your tours stay.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      run: () => saveWishes((list) => dropWish(list, w.id)),
      undo: (before) => updSkiSetting(WISHES_KEY, () => before),
      text: t('«{name}» deleted.', { name: w.name }),
      name: w.name,
    });
  }
  const move = (from, to) => saveWishes((list) => moveWish(list, from, to));

  /* transceiver practice */
  let lvsDay = $state(today);
  let lvsNote = $state('');
  async function addLvs(e) {
    e.preventDefault();
    if (!lvsDay) return;
    const entry = { id: uid('lvs'), day: lvsDay, note: lvsNote.trim() };
    lvsNote = '';
    await updSkiSetting(LVS_KEY, (log) => [...log, entry]);
  }
  async function removeLvs(x) {
    const name = shortDay(x.day);
    const answer = await askDelete({ title: t('Delete the practice of {day}?', { day: name }) });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      run: () => updSkiSetting(LVS_KEY, (log) => log.filter((y) => y.id !== x.id)),
      undo: (before) => updSkiSetting(LVS_KEY, () => before),
      text: t('Practice of {day} deleted.', { day: name }),
      name,
    });
  }

  /* courses */
  let courseName = $state('');
  let courseDay = $state('');
  let editCourse = $state(null);
  let editCourseName = $state('');
  async function addCourse(e) {
    e.preventDefault();
    if (!courseName.trim()) return;
    const c = { id: uid('course'), name: courseName.trim(), day: courseDay || '' };
    courseName = '';
    courseDay = '';
    await updSkiSetting(COURSES_KEY, (list) => [...list, c]);
  }
  async function endCourse(e) {
    e?.preventDefault?.();
    if (!editCourse) return;
    const id = editCourse;
    const name = editCourseName.trim();
    editCourse = null;
    if (name) await updSkiSetting(COURSES_KEY, (list) => list.map((c) => (c.id === id ? { ...c, name } : c)));
  }
  const setCourseDay = (c, day) => updSkiSetting(COURSES_KEY, (list) => list.map((x) => (x.id === c.id ? { ...x, day } : x)));
  async function removeCourse(c) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: c.name }) });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      run: () => updSkiSetting(COURSES_KEY, (list) => list.filter((x) => x.id !== c.id)),
      undo: (before) => updSkiSetting(COURSES_KEY, () => before),
      text: t('«{name}» deleted.', { name: c.name }),
      name: c.name,
    });
  }
</script>

<div class="sk">
  <p class="sk-back"><a href="#/ski"><ChevronLeft size={16} aria-hidden="true" />{t('Ski tours')}</a></p>
  <div>
    <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Season {id}', { id: stats.id })}</h1>
    <p class="sk-sub num">{tn(stats.tours, '{n} tour|ski', '{n} tours')} · {num(stats.hm)} {t('m climbed|short')}</p>
  </div>

  {#if data}
    {#if toStart != null}
      <section class="surf sk-pad box" data-season-start>
        <p class="sk-kicker">{t('Season start')}</p>
        <p class="sk-title num">{tn(toStart, 'In {n} day the season starts', 'In {n} days the season starts')}</p>
        <a class="sk-row" href="#/ski/care"><span class="sk-rt"><b>{t('Season care')}</b><small>{t('Transceiver, skins, wax before the first tour')}</small></span><ChevronRight size={18} aria-hidden="true" /></a>
      </section>
    {/if}
    <div class="sk-cols">
      <div class="col">
        <section class="surf sk-pad box" aria-labelledby="gl-h" data-season="goal">
          <h2 id="gl-h" class="sk-title">{t('Season goal')}</h2>
          <p class="sk-quiet">{t('A suggestion for you, never a must. Leave it empty if you do not want a goal.')}</p>
          <div class="sk-grid2">
            <label class="sk-field"><span>{t('Tours|ski')}</span><input class="inp num" inputmode="numeric" value={goal.tours || ''} onchange={(e) => setGoal('tours', e.currentTarget.value)} data-goal="tours" /></label>
            <label class="sk-field"><span>{t('Metres climbed')}</span><input class="inp num" inputmode="numeric" value={goal.hm || ''} onchange={(e) => setGoal('hm', e.currentTarget.value)} data-goal="hm" /></label>
          </div>
          {#each [['tours', 'Tours|ski'], ['hm', 'Metres climbed']] as [k, label] (k)}
            {#if prog[k].of}
              <div class="sk-count"><b>{t(label)}</b><span class="num" data-progress={k}>{t('{n} of {m}', { n: num(prog[k].n), m: num(prog[k].of) })}</span></div>
              <span class="sk-bar" role="progressbar" aria-label={t(label)} aria-valuemin="0" aria-valuemax="100" aria-valuenow={prog[k].pct}><i style:width="{prog[k].pct}%"></i></span>
            {/if}
          {/each}
        </section>

        <section class="surf sk-pad box" aria-labelledby="ws-h" data-season="wishes">
          <h2 id="ws-h" class="sk-title">{t('Wish tours')}</h2>
          <p class="sk-quiet">{t('Peaks you want to climb this winter. Tick one when you were up there; drag or use the arrows to sort.')}</p>
          {#if wishes.length}
            <ul class="sk-list wl" use:sortable={{ onmove: move }}>
              {#each wishes as w, i (w.id)}
                <li data-sort-id={w.id} data-wish={w.name}>
                  <SortGrip name={w.name} onstep={(dir) => move(i, i + dir)} />
                  <button type="button" class="tick" role="checkbox" aria-checked={!!w.doneDay} aria-label={w.name} onclick={() => saveWishes((list) => toggleWish(list, w.id, today))}><span class="sk-box" aria-hidden="true">{#if w.doneDay}<Check size={18} strokeWidth={3} />{/if}</span></button>
                  {#if editing === w.id}
                    <form class="grow" onsubmit={endEdit}>
                      <!-- svelte-ignore a11y_autofocus -->
                      <input class="inp" bind:value={editName} aria-label={t('Name')} autofocus onblur={endEdit} />
                    </form>
                  {:else}
                    <span class="grow nm" class:done={w.doneDay}><b>{w.name}</b>{#if w.doneDay}<small class="num">{t('done on {day}', { day: shortDay(w.doneDay) })}</small>{/if}</span>
                  {/if}
                  <span class="acts">
                    {#if editing !== w.id}<button type="button" class="ib" aria-label={t('Rename {name}', { name: w.name })} onclick={() => startEdit(w)}><Pencil size={16} aria-hidden="true" /></button>{/if}
                    <SortArrows name={w.name} {i} n={wishes.length} onstep={(dir) => move(i, i + dir)} />
                    <button type="button" class="ib" aria-label={t('Delete {name}', { name: w.name })} onclick={() => removeWish(w)}><Trash2 size={16} aria-hidden="true" /></button>
                  </span>
                </li>
              {/each}
            </ul>
          {/if}
          <form class="add" onsubmit={addOne}>
            <input class="inp grow" bind:value={wishName} maxlength="80" placeholder={t('e.g. {x}', { x: 'Piz Beispiel' })} aria-label={t('New wish tour')} data-wish-new />
            <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
          </form>
        </section>

        <section class="surf sk-pad box" aria-labelledby="wk-h" data-season="weeks">
          <h2 id="wk-h" class="sk-title">{t('Ski days, last 8 weeks')}</h2>
          <div class="weeks" role="img" aria-label={t('{n} ski days in 8 weeks', { n: weeks.reduce((s, w) => s + w.n, 0) })}>
            {#each weeks as w (w.start)}
              <span class="wk"><i style:height="{(w.n / maxWeek) * 100}%" class:none={!w.n}></i><small class="num">{w.n || ''}</small></span>
            {/each}
          </div>
          <p class="sk-quiet wkl num"><span>{t('Week of {day}', { day: weekDay(weeks[0].start) })}</span><span>{t('this week')}</span></p>
        </section>
      </div>

      <div class="col">
        <section class="surf sk-pad box" aria-labelledby="lv-h" data-season="lvs">
          <h2 id="lv-h" class="sk-title">{t('Transceiver practice')}</h2>
          <p class="sk-quiet">{tn(lvs.length, '{n} practice this season', '{n} practices this season')}{#if !lvs.length}{' · '}{t('One search exercise before the first tour helps a lot.')}{/if}</p>
          {#if lvs.length}
            <ul class="sk-list">
              {#each lvs as x (x.id)}
                <li class="ln" data-lvs={x.day}><CalendarClock size={16} aria-hidden="true" /><span class="grow num">{shortDay(x.day)}{#if x.note}{' · '}{x.note}{/if}</span><button type="button" class="ib" aria-label={t('Delete {name}', { name: shortDay(x.day) })} onclick={() => removeLvs(x)}><Trash2 size={16} aria-hidden="true" /></button></li>
              {/each}
            </ul>
          {/if}
          <form class="add" onsubmit={addLvs}>
            <input class="inp num" type="date" bind:value={lvsDay} aria-label={t('Day')} />
            <input class="inp grow" bind:value={lvsNote} placeholder={t('e.g. «two buried, 6 min»')} aria-label={t('Note')} data-lvs-note />
            <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
          </form>
        </section>

        <section class="surf sk-pad box" aria-labelledby="cs-h" data-season="courses">
          <h2 id="cs-h" class="sk-title">{t('Courses')}</h2>
          <p class="sk-quiet">{t('Avalanche or first aid course: after two years the app suggests a refresh.')}</p>
          {#if courses.length}
            <ul class="sk-list">
              {#each courses as c (c.id)}
                <li class="ln" data-course={c.name}>
                  {#if editCourse === c.id}
                    <form class="grow" onsubmit={endCourse}>
                      <!-- svelte-ignore a11y_autofocus -->
                      <input class="inp" bind:value={editCourseName} aria-label={t('Name')} autofocus onblur={endCourse} />
                    </form>
                  {:else}
                    <span class="grow nm"><b>{c.name}</b>{#if courseDue(c, today)}<span class="pill warn" data-refresh>{t('Refresh|course')}</span>{/if}</span>
                  {/if}
                  <span class="acts">
                    {#if editCourse !== c.id}<button type="button" class="ib" aria-label={t('Rename {name}', { name: c.name })} onclick={() => ((editCourse = c.id), (editCourseName = c.name))}><Pencil size={16} aria-hidden="true" /></button>{/if}
                    <input class="inp num dt" type="date" value={c.day} onchange={(e) => setCourseDay(c, e.currentTarget.value)} aria-label={t('Day of {name}', { name: c.name })} />
                    <button type="button" class="ib" aria-label={t('Delete {name}', { name: c.name })} onclick={() => removeCourse(c)}><Trash2 size={16} aria-hidden="true" /></button>
                  </span>
                </li>
              {/each}
            </ul>
          {/if}
          <form class="add" onsubmit={addCourse}>
            <input class="inp grow" bind:value={courseName} placeholder={t('e.g. «Avalanche course level 1»')} aria-label={t('New course')} data-course-new />
            <input class="inp num" type="date" bind:value={courseDay} aria-label={t('Day')} />
            <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
          </form>
        </section>

        <section class="surf sk-pad box" aria-labelledby="sk-h" data-season="skis">
          <h2 id="sk-h" class="sk-title">{t('Ski and skins')}</h2>
          {#if perSki.length}
            <ul class="sk-list">
              {#each perSki as s (s.itemId)}
                <li class="ln" data-ski-hm={s.itemId}><span class="grow"><b>{itemName(s.itemId)}</b><small class="num">{tn(s.tours, '{n} tour|ski', '{n} tours')} · {t('{hm} m this season', { hm: num(s.seasonHm) })}</small></span><span class="num big">{num(s.hm)} {t('m climbed|short')}</span></li>
              {/each}
            </ul>
          {:else}
            <p class="sk-quiet">{t('Pick the ski in «After the tour»: the metres climbed per ski add up here (for wax and skins).')}</p>
          {/if}
        </section>

        <section class="surf sk-pad box" aria-labelledby="ls-h" data-season="last">
          <h2 id="ls-h" class="sk-title">{t('Last season {id}', { id: last.id })}</h2>
          {#if last.tours}
            <p class="num">{tn(last.tours, '{n} tour|ski', '{n} tours')} · {num(last.hm)} {t('m climbed|short')}{#if last.peaks.length}{' · '}{last.peaks.slice(0, 3).map((p) => p.name).join(', ')}{/if}</p>
          {:else}
            <p class="sk-quiet">{t('No tours noted last season.')}</p>
          {/if}
        </section>
      </div>
    </div>
  {/if}
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .box {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .wl li,
  .ln {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    border-bottom: 1px solid var(--line);
  }
  .wl li:last-child,
  .ln:last-child {
    border-bottom: 0;
  }
  .wl li,
  .ln {
    flex-wrap: wrap;
  }
  .grow {
    flex: 1 1 9em;
    min-width: 0;
  }
  .acts {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .wkl {
    display: flex;
    justify-content: space-between;
    margin: 0;
  }
  .nm,
  .ln > .grow {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-wrap: break-word;
  }
  .nm small,
  .ln small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nm.done b {
    color: var(--ink-2);
  }
  .tick,
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .add .inp {
    min-height: 44px;
  }
  .dt {
    width: 9.5em;
    min-height: 44px;
  }
  .big {
    font-weight: 600;
  }
  .weeks {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 6px;
    height: 120px;
    align-items: end;
  }
  .wk {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
    gap: 2px;
  }
  .wk i {
    display: block;
    width: 70%;
    min-height: 3px;
    max-height: 70%;
    border-radius: 4px 4px 0 0;
    background: var(--hi);
  }
  .wk i.none {
    background: var(--line);
  }
  .wk small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  @media (max-width: 359px) {
    .sk-grid2 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
