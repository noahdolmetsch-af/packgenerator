<script>
  /**
   * AB1 + AB5 «Deine Abfragen» (Noah 14.10.2026 00:06:40 «freigabe»), Ich › Deine Abfragen (#/me/abfragen):
   * what the app asks you and how often. 50 playful questions in 10 areas, 31 on at the start; each row
   * has its question, quietly «bisher: …», a small tag for the answer kind, the source, its interval
   * (a tap opens the choice) and a switch. Under «Eigene» your own questions (AB2), «Eigene Frage anlegen»
   * at the end. Right: where the answers go, where the values come from, the answer kinds.
   * Everything is a suggestion: every question can be switched off, changed and switched on again.
   * WG «Wi gaht's?» takes over the daily check: «Feste Runden», the two fixed rounds (07:00 and 20:30) with
   * a switch and both times changeable; the rule is roundTime in abfragen.js.
   * Impeccable Runde 2: the head says how often a day the app asks («31 questions on · about 34 times a day, in 2
   * rounds (07:00 and 20:30)»), above 15 a calm hint; «so far: …» only in the interval sheet; «Where the values
   * come from» and «Answer kinds» are one fold «How it works».
   */
  import { Trash2, Check } from '@lucide/svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../lib/ui/GroupDeleteSheet.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { offerDone, offerRename } from '../lib/ui/rename.svelte.js';
  import { ChevronDown, ChevronUp, Plus, Pencil, Hand, Watch, CircleDashed, Smartphone, Info, RotateCcw, Gauge, ChartLine, ChevronRight } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import AreaIcon from '../lib/abfragen/AreaIcon.svelte';
  import IntervalSheet from '../lib/abfragen/IntervalSheet.svelte';
  import OwnSheet from '../lib/abfragen/OwnSheet.svelte';
  import Auswertung from '../lib/abfragen/Auswertung.svelte';
  import { abQuery, ensureConfig, saveConfig } from '../lib/abdb.js';
  import { OWN_AREA, configOf, settingOf, setOn, setEvery, putOwn, newOwn, counts, stampOf, setRounds, timeOf, perDay, BUSY_DAY, areasOf, questionsIn, renameQuestion, moveToArea, deleteQuestion, restoreQuestion, goneQuestions, moveQuestion, renameArea, addArea, deleteArea, moveArea, listChanged, resetList } from '../lib/abfragen.js';
  import { qText, areaName, everyText, kindLabel, kindExtra, srcText } from '../lib/abfragen/words.js';
  import { localDay } from '../lib/localday.js';
  import { t } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';
  import '../lib/abfragen/ab.css';

  const today = localDay();
  const query = abQuery(today);
  const data = $derived($query);
  $effect(() => {
    if (data && !data.stored) ensureConfig();
  });
  const cfg = $derived(configOf(data?.cfg));
  const n = $derived(counts(cfg));
  const day = $derived(perDay(cfg));
  const headLine = $derived(
    [t('{on} questions on', { on: n.on }), cfg.rounds.on ? t('about {n} times a day, in 2 rounds ({a} and {b})', { n: day, a: cfg.rounds.morning, b: cfg.rounds.evening }) : t('about {n} times a day', { n: day })].join(' · ') +
      (day > BUSY_DAY ? `. ${t('A lot? Switch single questions off or set them to «weekly».')}` : ''),
  );
  // Noah 20.10.2026: the groups as the person has them (renamed, own ones, deleted ones gone, own order); «Eigene» last
  const areas = $derived(areasOf(cfg));
  const groups = $derived([...areas.map((a) => ({ key: a.key, list: questionsIn(cfg, a.key) })), { key: OWN_AREA, list: questionsIn(cfg, OWN_AREA) }]);
  const nameOf = (key) => areaName(key, cfg);

  let open = $state({ erholung: true });
  const allOpen = $derived(areas.every((a) => open[a.key]));
  const toggleAll = () => (open = allOpen ? {} : Object.fromEntries(areas.map((a) => [a.key, true])));

  /* Noah 20.10.2026 «editieren und löschen …, neue pro Gruppe erstellen, Gruppen editieren, hinzufügen, löschen»:
     «Bearbeiten» shows on every question and group: drag handle, arrows, pencil and bin. */
  let editing = $state(false);
  let renamingArea = $state(null);
  let deletingArea = $state(null);
  let newAreaName = $state('');
  let areaMsg = $state('');
  const gone = $derived(goneQuestions(cfg));
  const fresh = () => configOf(data?.cfg);
  async function removeQuestion(q) {
    const name = qText(q);
    const answer = await askDelete({ title: t('Delete «{q}»?', { q: name }), text: q.own ? t('Your own question goes. Its answers stay in the history.') : t('The question no longer asks. Its answers stay in the history. «Deleted questions» brings it back.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      name,
      text: t('«{q}» deleted.', { q: name }),
      run: async () => {
        const before = fresh();
        await save(deleteQuestion(before, q.id));
        return before;
      },
      undo: (before) => save(before),
    });
  }
  const stepQ = (key, from, to) => save(moveQuestion(fresh(), key, from, to));
  const stepArea = (from, to) => save(moveArea(fresh(), from, to));
  async function saveAreaName(name) {
    const a = renamingArea;
    const before = fresh();
    await save(renameArea(before, a.key, name));
    offerRename(String(name ?? '').trim() || (a.std ? t(a.std) : nameOf(a.key)), () => save(before));
  }
  async function removeArea(to) {
    const a = deletingArea;
    const name = nameOf(a.key);
    const before = fresh();
    await save(deleteArea(before, a.key, to));
    offerDone(t('Group «{name}» deleted.|questions', { name }), () => save(before));
  }
  async function newGroup(e) {
    e?.preventDefault();
    const r = addArea(fresh(), newAreaName);
    if (!r.key) return (areaMsg = t('Give it a name.'));
    await save(r.cfg);
    offerDone(t('Group «{name}» added.', { name: newAreaName.trim() }));
    open = { ...open, [r.key]: true };
    newAreaName = '';
    areaMsg = '';
  }
  async function backToStandard() {
    const before = fresh();
    await save(resetList(before));
    offerDone(t('Questions and groups back to standard.'), () => save(before));
  }
  async function bringBack(q) {
    await save(restoreQuestion(fresh(), q.id));
    offerDone(t('«{q}» is back.', { q: qText(q) }));
  }

  let ivFor = $state(null);
  let ownFor = $state(undefined); // undefined: closed; null: a new one; a question: change it
  let ownArea = $state(OWN_AREA); // the group a new question goes into («+ Frage in dieser Gruppe»)
  const addIn = (key) => {
    ownArea = key;
    ownFor = null;
  };

  const save = (next) => saveConfig(next);
  function flip(q, on) {
    let next = setOn(cfg, q.id, on, stampOf());
    if (on && settingOf(cfg, q).every.kind === 'off') next = setEvery(next, q.id, { kind: 'daily', time: '20:00' });
    save(next);
  }
  function saveOwn(x) {
    const q = x.id ? groups.flatMap((g) => g.list).find((y) => y.id === x.id) : null;
    if (q && !q.own) {
      // a question of the list: its text (only when changed), its group and its interval; the answer kind stays
      let next = fresh();
      if (x.textChanged) next = renameQuestion(next, q.id, x.text);
      if (x.area !== q.area) next = moveToArea(next, q.id, x.area);
      const off = x.every?.kind === 'off';
      next = off ? setOn(next, q.id, false, stampOf()) : setEvery(settingOf(next, q).on ? next : setOn(next, q.id, true, stampOf()), q.id, x.every);
      return save(next);
    }
    const own = x.id ? x : newOwn(x);
    if (own) save(putOwn(cfg, own, stampOf()));
  }
  // WG: the fixed rounds; a time that is none keeps the one before
  const setTime = (key, value) => {
    const v = timeOf(value);
    if (v) save(setRounds(cfg, { [key]: v }));
  };
  const ICON_SRC = { hand: Hand, later: Watch, open: CircleDashed, only: Hand, app: Smartphone };
  const exOf = (list) => list.find((q) => settingOf(cfg, q).on) ?? list[0];
</script>

<div class="ich-page abpage">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Your questions')} sub={headLine}>
    <button type="button" class="btn" class:hi={editing} aria-pressed={editing} onclick={() => (editing = !editing)} data-ab-edit>{#if editing}<Check size={18} aria-hidden="true" />{t('Done|edit')}{:else}<Pencil size={18} aria-hidden="true" />{t('Edit questions and groups')}{/if}</button>
    <button type="button" class="btn" onclick={() => addIn(OWN_AREA)}><Plus size={18} aria-hidden="true" />{t('Create your own question')}</button>
  </VeloHead>

  <div class="ich-cols">
    <div class="ich-main">
      <div class="top"><span class="num">{t('{areas} areas · {all} questions · {on} on', { areas: areas.length, all: n.all, on: n.on })}</span>{#if !editing}<button type="button" class="ab-lnk lk" onclick={toggleAll}>{allOpen ? t('Collapse all') : t('Expand all')}</button>{/if}</div>
      {#if editing}
        <!-- the groups: drag or arrows to sort, pencil to rename, bin to delete (the questions go where you choose) -->
        <section class="card edg" aria-labelledby="ab-groups-h" data-ab-groups>
          <h2 id="ab-groups-h">{t('Groups|questions')}</h2>
          <p class="eh">{t('Sort with the arrows or drag the handle. Deleting a group asks where its questions go; no question is deleted with it.')}</p>
          <ul class="er" use:sortable={{ onmove: stepArea }}>
            {#each areas as a, i (a.key)}
              <li data-sort-id={a.key} data-area-row={a.key}>
                <SortGrip name={nameOf(a.key)} onstep={(dir) => stepArea(i, i + dir)} />
                <span class="ich-ib sm"><AreaIcon area={a.key} size={16} /></span>
                <span class="nm">{nameOf(a.key)} <small class="num">{questionsIn(cfg, a.key).length}</small></span>
                <SortArrows name={nameOf(a.key)} {i} n={areas.length} onstep={(dir) => stepArea(i, i + dir)} />
                <button type="button" class="eb" aria-label={t('Rename {name}', { name: nameOf(a.key) })} onclick={() => (renamingArea = a)} data-area-rename><Pencil size={16} aria-hidden="true" /></button>
                <button type="button" class="eb" aria-label={t('Delete {name}', { name: nameOf(a.key) })} onclick={() => (deletingArea = a)} data-area-delete><Trash2 size={16} aria-hidden="true" /></button>
              </li>
            {/each}
            <li class="fixed" data-area-row={OWN_AREA}>
              <span class="ich-ib sm"><AreaIcon area={OWN_AREA} size={16} /></span>
              <span class="nm">{nameOf(OWN_AREA)} <small>{t('always last · for questions without a group')}</small></span>
              <button type="button" class="eb" aria-label={t('Rename {name}', { name: nameOf(OWN_AREA) })} onclick={() => (renamingArea = { key: OWN_AREA, std: 'Own|questions' })} data-area-rename><Pencil size={16} aria-hidden="true" /></button>
            </li>
          </ul>
          <form class="addrow" onsubmit={newGroup}>
            <input class="inp" type="text" maxlength="40" aria-label={t('Name of the new group|questions')} placeholder={t('New group, e.g. Work')} bind:value={newAreaName} oninput={() => (areaMsg = '')} data-area-new />
            <button type="submit" class="btn" data-area-add><Plus size={16} aria-hidden="true" />{t('Add group')}</button>
          </form>
          {#if areaMsg}<p class="err" role="alert">{areaMsg}</p>{/if}
        </section>
      {/if}
      <div class="areas">
        {#each groups as g (g.key)}
          {@const own = g.key === OWN_AREA}
          {@const c = n.per[g.key] ?? { all: 0, on: 0 }}
          {@const shown = open[g.key] || own || editing}
          <section class="card area" class:open={shown} data-area={g.key} aria-labelledby="ab-a-{g.key}">
            {#if own || editing}
              <div class="ah">
                <span class="ich-ib"><AreaIcon area={g.key} /></span>
                <span class="ich-m"><b id="ab-a-{g.key}">{nameOf(g.key)}</b><small>{#if own && !g.list.length}{t('none yet · your own playful questions come here')}{:else}<span class="num">{t('{n} questions · {on} on', { n: c.all, on: c.on })}</span>{/if}</small></span>
              </div>
            {:else}
              <button type="button" class="ah tap" aria-expanded={!!open[g.key]} onclick={() => (open = { ...open, [g.key]: !open[g.key] })}>
                <span class="ich-ib"><AreaIcon area={g.key} /></span>
                <span class="ich-m"><b id="ab-a-{g.key}">{nameOf(g.key)}</b><small><span class="num">{t('{n} questions · {on} on', { n: c.all, on: c.on })}</span>{#if !open[g.key] && g.list.length}{' · '}{t('e.g. «{q}»', { q: qText(exOf(g.list)) })}{/if}</small></span>
                {#if open[g.key]}<span class="fold">{t('collapse')}<ChevronUp size={16} aria-hidden="true" /></span>{:else}<ChevronDown class="ich-chev" size={18} aria-hidden="true" />{/if}
              </button>
            {/if}
            {#if shown && g.list.length}
              {#if editing}
                <ul class="ql er qe" use:sortable={{ onmove: (from, to) => stepQ(g.key, from, to) }}>
                  {#each g.list as q, i (q.id)}
                    <li data-sort-id={q.id} data-q={q.id}>
                      <SortGrip name={qText(q)} onstep={(dir) => stepQ(g.key, i, i + dir)} />
                      <span class="nm">{qText(q)}<small>{kindLabel(q.form)}{q.own ? ` · ${t('own|question')}` : q.edited ? ` · ${t('changed|question')}` : ''}</small></span>
                      <SortArrows name={qText(q)} {i} n={g.list.length} onstep={(dir) => stepQ(g.key, i, i + dir)} />
                      <button type="button" class="eb" aria-label={t('Change «{q}»', { q: qText(q) })} onclick={() => (ownFor = q)} data-q-edit><Pencil size={16} aria-hidden="true" /></button>
                      <button type="button" class="eb" aria-label={t('Delete «{q}»', { q: qText(q) })} onclick={() => removeQuestion(q)} data-q-delete><Trash2 size={16} aria-hidden="true" /></button>
                    </li>
                  {/each}
                </ul>
              {:else}
              <ul class="ql">
                {#each g.list as q (q.id)}
                  {@const s = settingOf(cfg, q)}
                  <li class="q" class:off={!s.on} data-q={q.id}>
                    <span class="qm">
                      <b>{qText(q)}</b>
                      <span class="ab-tags">
                        <span class="ab-kind">{kindLabel(q.form)}</span>
                        {#if q.sample}<span class="ab-ex" data-sample>{t('sample|question')}</span>{/if}
                        {#if kindExtra(q.form)}<span class="ab-ex">{kindExtra(q.form)}</span>{/if}
                        {#each q.src as k (k)}{@const I = ICON_SRC[k] ?? Hand}<span class="ab-src {k}"><I size={13} aria-hidden="true" />{srcText(k)}</span>{/each}
                      </span>
                    </span>
                    <span class="ivw">
                      {#if q.own}<button type="button" class="ab-iv" onclick={() => (ownFor = q)} aria-label={t('Change «{q}»', { q: qText(q) })}><Pencil size={14} aria-hidden="true" /><span>{s.on ? everyText(s.every) : t('off|question')}</span></button>
                      {:else if s.on}<button type="button" class="ab-iv" onclick={() => (ivFor = q)} aria-label={t('How often: {every}', { every: everyText(s.every) })}><span>{everyText(s.every)}</span><ChevronDown size={14} aria-hidden="true" /></button>
                      {:else}<span class="ab-ivoff">{t('off|question')}</span>{/if}
                    </span>
                    <label class="ab-sw"><span class="sr">{qText(q)}</span><input type="checkbox" role="switch" checked={s.on} onchange={(e) => flip(q, e.currentTarget.checked)} /></label>
                  </li>
                {/each}
              </ul>
              {/if}
            {/if}
            {#if shown && (!own || editing)}
              <button type="button" class="ab-lnk addq" onclick={() => addIn(g.key)} data-q-add={g.key}><Plus size={16} aria-hidden="true" />{t('New question in «{name}»', { name: nameOf(g.key) })}</button>
            {/if}
          </section>
        {/each}
      </div>
      <button type="button" class="ab-add" onclick={() => addIn(OWN_AREA)} data-own-add><Plus size={18} aria-hidden="true" /><span><b>{t('Create your own question')}</b><small>{t('Name, area, answer kind and interval')}</small></span></button>
      {#if gone.length}
        <details class="card gonef" data-ab-gone>
          <summary>{t('Deleted questions ({n})', { n: gone.length })}</summary>
          <ul class="er">
            {#each gone as q (q.id)}
              <li><span class="nm">{qText(q)}<small>{nameOf(q.area)}</small></span><button type="button" class="btn sm" onclick={() => bringBack(q)} data-q-restore={q.id}><RotateCcw size={16} aria-hidden="true" />{t('Bring back')}</button></li>
            {/each}
          </ul>
        </details>
      {/if}
      {#if editing && listChanged(cfg)}
        <p><button type="button" class="btn" onclick={backToStandard} data-ab-reset><RotateCcw size={16} aria-hidden="true" />{t('Back to standard')}</button> <small class="quiet">{t('Texts, groups and order of the app come back; your own questions and the switches stay.')}</small></p>
      {/if}
    </div>

    <div class="ich-side">
      <!-- WG: «Feste Runden», a suggestion: on by default, can be switched off, both times changeable -->
      <section class="ich-sec" aria-labelledby="ab-rounds-h" data-rounds>
        <div class="ich-h"><div><h2 id="ab-rounds-h">{t('Fixed rounds')}</h2><p class="ich-hs">{t('a suggestion, can be switched off')}</p></div></div>
        <div class="card side">
          <div class="rsw">
            <span class="rm"><b>{t('Ask in two rounds')}</b><small>{t('Questions before 12:00 come in the morning round, from 18:00 in the evening round; the others keep their own time.')}</small></span>
            <label class="ab-sw"><span class="sr">{t('Ask in two rounds')}</span><input type="checkbox" role="switch" checked={cfg.rounds.on} onchange={(e) => save(setRounds(cfg, { on: e.currentTarget.checked }))} /></label>
          </div>
          {#if cfg.rounds.on}
            <div class="rtimes">
              <label><span>{t('Morning round')}</span><input class="inp num" type="time" value={cfg.rounds.morning} onchange={(e) => setTime('morning', e.currentTarget.value)} data-round="morning" /></label>
              <label><span>{t('Evening round')}</span><input class="inp num" type="time" value={cfg.rounds.evening} onchange={(e) => setTime('evening', e.currentTarget.value)} data-round="evening" /></label>
            </div>
          {/if}
        </div>
      </section>
      <section class="ich-sec" aria-labelledby="ab-where-h">
        <div class="ich-h"><div><h2 id="ab-where-h">{t('Where the answers go')}</h2></div></div>
        <div class="card side">
          <p class="p">{t('All answers go into one history under Data, together with the values from Fitbit and Strava.')}</p>
          <ul class="reads">
            <li><RotateCcw size={16} aria-hidden="true" /><span>{t('Rückblick of a trip')}</span><small>{t('Mood, sleep, resting pulse')}</small></li>
            <li><Gauge size={16} aria-hidden="true" /><span>{t('Watts per kg')}</span><small>{t('Weight')}</small></li>
            <li><ChartLine size={16} aria-hidden="true" /><span>{t('Balance')}</span><small>{t('all answers')}</small></li>
          </ul>
          <a class="btn" href="#/me/history">{t('See the history')}<ChevronRight size={16} aria-hidden="true" /></a>
        </div>
      </section>
      <!-- Impeccable Runde 2: the two explaining blocks in one fold -->
      <details class="ich-sec howfold" data-how>
        <summary class="ich-h howsum"><div><h2 id="ab-how-h">{t('How it works|ab')}</h2><p class="ich-hs">{t('Where the values come from, answer kinds')}</p></div><ChevronDown class="howchev" size={20} aria-hidden="true" /></summary>
        <h3 class="howh" id="ab-src-h">{t('Where the values come from')}</h3>
        <ul class="card side leg" aria-labelledby="ab-src-h">
          <li><span class="ab-src hand"><Hand size={13} aria-hidden="true" />{srcText('hand')}</span><small>{t('you enter it when the question comes')}</small></li>
          <li><span class="ab-src later"><Watch size={13} aria-hidden="true" />{srcText('later')}</span><small>{t('tested: steps, sleep, resting pulse, HRV · with the connection to Fitbit')}</small></li>
          <li><span class="ab-src open"><CircleDashed size={13} aria-hidden="true" />{srcText('open')}</span><small>{t('active zone minutes, oxygen, weight')}</small></li>
          <li><span class="ab-src only"><Hand size={13} aria-hidden="true" />{srcText('only')}</span><small>{t('e.g. screen time, Samsung Health: a web app cannot reach these data')}</small></li>
        </ul>
        <h3 class="howh" id="ab-kinds-h">{t('Answer kinds')} <small>· {t('stands as a small tag next to every question')}</small></h3>
        <ul class="card side forms" aria-labelledby="ab-kinds-h">
          <li><span class="ab-kind">1–10</span><span>{t('as numbers or a battery')}</span><small>{t('saved: always 1–10')}</small></li>
          <li><span class="ab-kind">{t('Chips')}</span><span>{t('one or several choices')}</span><small>{t('saved: fixed keys')}</small></li>
          <li><span class="ab-kind">{t('yes / no')}</span><span>{t('sometimes with «partly» or «several times»')}</span><small>{t('saved: 1 · 0.5 · 0')}</small></li>
          <li><span class="ab-kind">{t('Number')}</span><span>{t('with a unit: kg, min, cups, h')}</span><small>{t('saved: the number')}</small></li>
          <li><span class="ab-kind">{t('Sentence')}</span><span>{t('text')}</span><small>{t('saved: only for the diary')}</small></li>
        </ul>
      </details>
      <!-- AB6, Noah 14.10. 00:52:22 1a 2a 3b 4ab (4ab): the analysis here too, short, with a link to the whole page -->
      <div class="ich-sec" data-analysis><Auswertung compact idp="awa" /></div>
      <p class="hint"><Info size={15} aria-hidden="true" /><span>{t('If a wording changes, the old answers go on in the same history. «so far» names the earlier question that lives on in it.')}</span></p>
    </div>
  </div>
</div>

{#if ivFor}
  <IntervalSheet title={qText(ivFor)} was={ivFor.was ?? ''} every={settingOf(cfg, ivFor).every} onsave={(e) => save(setEvery(cfg, ivFor.id, e))} onclose={() => (ivFor = null)} />
{/if}
{#if ownFor !== undefined}
  <OwnSheet
    question={ownFor}
    area={ownFor ? ownFor.area : ownArea}
    every={ownFor ? settingOf(cfg, ownFor).every : undefined}
    areas={[...areas.map((a) => ({ key: a.key, name: nameOf(a.key) })), { key: OWN_AREA, name: nameOf(OWN_AREA) }]}
    onsave={saveOwn}
    ondelete={(id) => {
      const q = groups.flatMap((g) => g.list).find((y) => y.id === id);
      if (q) removeQuestion(q);
    }}
    onclose={() => (ownFor = undefined)}
  />
{/if}
{#if renamingArea}
  <RenameSheet
    kicker={t('Group|questions')}
    title={t('Rename group|questions')}
    value={nameOf(renamingArea.key)}
    empty={renamingArea.std ? t('Empty: back to the standard name.') : ''}
    max={40}
    onsave={saveAreaName}
    onclose={() => (renamingArea = null)}
  />
{/if}
{#if deletingArea}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?|questions', { name: nameOf(deletingArea.key) })}
    count={questionsIn(cfg, deletingArea.key).length}
    what={(k) => (k === 1 ? t('1 question') : t('{n} questions', { n: k }))}
    none={nameOf(OWN_AREA)}
    noneHint={t('The questions stay and show under «{name}».', { name: nameOf(OWN_AREA) })}
    targets={areas.filter((a) => a.key !== deletingArea.key).map((a) => ({ id: a.key, name: nameOf(a.key) }))}
    onconfirm={removeArea}
    onclose={() => (deletingArea = null)}
  />
{/if}

<style>
  .abpage {
    max-width: 1180px;
  }
  /* Noah 20.10.2026: «Bearbeiten» of questions and groups */
  .edg {
    margin: 0 0 10px;
    padding: 14px 16px;
  }
  .edg h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .eh {
    margin: 4px 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .er {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .er li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    border-top: 1px solid var(--line);
  }
  .er li:first-child {
    border-top: 0;
  }
  .qe li:first-child {
    border-top: 1px solid var(--line);
  }
  .er .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .er .nm small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ich-ib.sm {
    width: 30px;
    height: 30px;
  }
  .eb {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .eb:hover {
    background: var(--paper-2);
  }
  .addrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .addrow .inp {
    flex: 1 1 200px;
    min-height: 44px;
    box-sizing: border-box;
  }
  .err {
    margin: 6px 0 0;
    color: var(--warn, var(--ink));
    font-size: var(--fs-small);
  }
  .addq {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin: 0 0 6px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .gonef {
    margin-top: 10px;
    padding: 4px 16px;
  }
  .gonef summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--ink-2);
  }
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* Impeccable Runde 2: «How it works», folded */
  .howsum {
    align-items: center;
    min-height: 44px;
    cursor: pointer;
    list-style: none;
  }
  .howsum::-webkit-details-marker {
    display: none;
  }
  .howsum :global(.howchev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.18s ease-out;
  }
  .howfold[open] > .howsum :global(.howchev) {
    transform: rotate(180deg);
  }
  @media (prefers-reduced-motion: reduce) {
    .howsum :global(.howchev) {
      transition: none;
    }
  }
  .howh {
    margin: 14px 2px 8px;
    color: var(--ink);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .howh small {
    color: var(--ink-3);
    font-weight: 400;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 10px;
    margin: 0 2px 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lk {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    cursor: pointer;
  }
  .areas {
    display: grid;
    gap: 10px;
  }
  .area {
    padding: 0 16px;
    min-width: 0;
  }
  .ah {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 64px;
    padding: 10px 0;
    box-sizing: border-box;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
  }
  .ah.tap {
    cursor: pointer;
  }
  .ah b {
    font-weight: 600;
  }
  .fold {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .ql {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .q {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 12px;
    align-items: center;
    min-height: 64px;
    padding: 12px 0 12px 48px;
    border-top: 1px solid var(--line);
  }
  .qm {
    display: grid;
    min-width: 0;
  }
  .qm b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .q.off .qm b {
    color: var(--ink-3);
  }
  .p {
    margin: 0 0 10px;
    line-height: 1.45;
  }
  .side {
    padding: 14px 16px;
  }
  .reads {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
  }
  .reads li {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .reads li:first-child {
    border-top: 0;
  }
  .reads small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
  }
  .leg,
  .forms {
    list-style: none;
    margin: 0;
  }
  .leg li {
    display: grid;
    justify-items: start;
    gap: 4px;
    padding: 6px 0;
  }
  .leg small,
  .forms small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .forms li {
    display: grid;
    grid-template-columns: 84px minmax(0, 1fr);
    column-gap: 10px;
    align-items: baseline;
    padding: 9px 0;
    border-top: 1px solid var(--line);
  }
  .forms li:first-child {
    border-top: 0;
  }
  .forms .ab-kind {
    justify-self: start;
  }
  .forms small {
    grid-column: 2;
  }
  /* WG: «Feste Runden» */
  .rsw {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .rm {
    flex: 1;
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .rm b {
    font-weight: 500;
  }
  .rm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .rtimes {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .rtimes label {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .rtimes span {
    color: var(--ink-3);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .rtimes input {
    min-height: 44px;
    box-sizing: border-box;
  }
  .hint {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0 2px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  @media (max-width: 719px) {
    /* the name gets its own line, the arrows, pencil and bin go under it on the right */
    .er li {
      flex-wrap: wrap;
      row-gap: 0;
      padding: 6px 0;
    }
    .er .nm {
      flex: 1 1 calc(100% - 90px);
    }
    .er li > :global(.sort-arrows) {
      margin-left: auto;
    }
    .q {
      grid-template-columns: minmax(0, 1fr) auto;
      row-gap: 8px;
      padding-left: 0;
    }
    .qm {
      grid-column: 1;
      grid-row: 1;
    }
    .q > .ab-sw {
      grid-column: 2;
      grid-row: 1;
      align-self: start;
    }
    .ivw {
      grid-column: 1 / 3;
      grid-row: 2;
    }
    .reads li {
      grid-template-columns: 22px minmax(0, 1fr);
      row-gap: 0;
      padding: 6px 0;
    }
    .reads small {
      grid-column: 2;
      text-align: left;
    }
  }
</style>
