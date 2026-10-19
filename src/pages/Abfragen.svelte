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
  import { ChevronDown, ChevronUp, Plus, Pencil, Hand, Watch, CircleDashed, Smartphone, Info, RotateCcw, Gauge, ChartLine, ChevronRight } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import AreaIcon from '../lib/abfragen/AreaIcon.svelte';
  import IntervalSheet from '../lib/abfragen/IntervalSheet.svelte';
  import OwnSheet from '../lib/abfragen/OwnSheet.svelte';
  import Auswertung from '../lib/abfragen/Auswertung.svelte';
  import { abQuery, ensureConfig, saveConfig } from '../lib/abdb.js';
  import { AREAS, OWN_AREA, QUESTIONS, configOf, settingOf, setOn, setEvery, putOwn, dropOwn, newOwn, counts, stampOf, setRounds, timeOf, perDay, BUSY_DAY } from '../lib/abfragen.js';
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
  const groups = $derived([...AREAS.map((a) => ({ key: a.key, list: QUESTIONS.filter((x) => x.area === a.key) })), { key: OWN_AREA, list: cfg.own }]);

  let open = $state({ erholung: true });
  const allOpen = $derived(AREAS.every((a) => open[a.key]));
  const toggleAll = () => (open = allOpen ? {} : Object.fromEntries(AREAS.map((a) => [a.key, true])));

  let ivFor = $state(null);
  let ownFor = $state(undefined); // undefined: closed; null: a new one; a question: change it

  const save = (next) => saveConfig(next);
  function flip(q, on) {
    let next = setOn(cfg, q.id, on, stampOf());
    if (on && settingOf(cfg, q).every.kind === 'off') next = setEvery(next, q.id, { kind: 'daily', time: '20:00' });
    save(next);
  }
  function saveOwn(x) {
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
    <button type="button" class="btn" onclick={() => (ownFor = null)}><Plus size={18} aria-hidden="true" />{t('Create your own question')}</button>
  </VeloHead>

  <div class="ich-cols">
    <div class="ich-main">
      <div class="top"><span class="num">{t('{areas} areas · {all} questions · {on} on', { areas: AREAS.length, all: n.all, on: n.on })}</span><button type="button" class="ab-lnk lk" onclick={toggleAll}>{allOpen ? t('Collapse all') : t('Expand all')}</button></div>
      <div class="areas">
        {#each groups as g (g.key)}
          {@const own = g.key === OWN_AREA}
          {@const c = n.per[g.key] ?? { all: 0, on: 0 }}
          <section class="card area" class:open={open[g.key] || own} data-area={g.key} aria-labelledby="ab-a-{g.key}">
            {#if own}
              <div class="ah">
                <span class="ich-ib"><AreaIcon area={g.key} /></span>
                <span class="ich-m"><b id="ab-a-{g.key}">{areaName(g.key)}</b><small>{g.list.length ? t('{n} own questions · {on} on', { n: g.list.length, on: c.on }) : t('none yet · your own playful questions come here')}</small></span>
              </div>
            {:else}
              <button type="button" class="ah tap" aria-expanded={!!open[g.key]} onclick={() => (open = { ...open, [g.key]: !open[g.key] })}>
                <span class="ich-ib"><AreaIcon area={g.key} /></span>
                <span class="ich-m"><b id="ab-a-{g.key}">{areaName(g.key)}</b><small><span class="num">{t('{n} questions · {on} on', { n: c.all, on: c.on })}</span>{#if !open[g.key]}{' · '}{t('e.g. «{q}»', { q: qText(exOf(g.list)) })}{/if}</small></span>
                {#if open[g.key]}<span class="fold">{t('collapse')}<ChevronUp size={16} aria-hidden="true" /></span>{:else}<ChevronDown class="ich-chev" size={18} aria-hidden="true" />{/if}
              </button>
            {/if}
            {#if (open[g.key] || own) && g.list.length}
              <ul class="ql">
                {#each g.list as q (q.id)}
                  {@const s = settingOf(cfg, q)}
                  <li class="q" class:off={!s.on} data-q={q.id}>
                    <span class="qm">
                      <b>{qText(q)}</b>
                      <span class="ab-tags">
                        <span class="ab-kind">{kindLabel(q.form)}</span>
                        {#if kindExtra(q.form)}<span class="ab-ex">{kindExtra(q.form)}</span>{/if}
                        {#each q.src as k (k)}{@const I = ICON_SRC[k] ?? Hand}<span class="ab-src {k}"><I size={13} aria-hidden="true" />{srcText(k)}</span>{/each}
                      </span>
                    </span>
                    <span class="ivw">
                      {#if own}<button type="button" class="ab-iv" onclick={() => (ownFor = q)} aria-label={t('Change «{q}»', { q: qText(q) })}><Pencil size={14} aria-hidden="true" /><span>{s.on ? everyText(s.every) : t('off|question')}</span></button>
                      {:else if s.on}<button type="button" class="ab-iv" onclick={() => (ivFor = q)} aria-label={t('How often: {every}', { every: everyText(s.every) })}><span>{everyText(s.every)}</span><ChevronDown size={14} aria-hidden="true" /></button>
                      {:else}<span class="ab-ivoff">{t('off|question')}</span>{/if}
                    </span>
                    <label class="ab-sw"><span class="sr">{qText(q)}</span><input type="checkbox" role="switch" checked={s.on} onchange={(e) => flip(q, e.currentTarget.checked)} /></label>
                  </li>
                {/each}
              </ul>
            {/if}
          </section>
        {/each}
      </div>
      <button type="button" class="ab-add" onclick={() => (ownFor = null)} data-own-add><Plus size={18} aria-hidden="true" /><span><b>{t('Create your own question')}</b><small>{t('Name, area, answer kind and interval')}</small></span></button>
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
  <OwnSheet question={ownFor} onsave={saveOwn} ondelete={(id) => save(dropOwn(cfg, id))} onclose={() => (ownFor = undefined)} />
{/if}

<style>
  .abpage {
    max-width: 1180px;
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
