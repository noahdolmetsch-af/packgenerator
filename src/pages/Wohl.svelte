<script>
  /**
   * Paket P «Was mir gut tut» (Noah 19.10.2026, plan-wuensche P): Ich › Was mir gut tut (#/me/wohl).
   * What makes your good days, read from the one history, the ride ledger and Fitbit. Observation only:
   * no grade, no diagnosis, every result says where it comes from («Wie kommt die App darauf?», #259)
   * and shows only from enough days. The rules are in lib/wohl.js.
   * Parts: your recipe of the day (#249), what helps (+ energy drains, voluntary, #251), good
   * combinations (#246), your comfort range (#248), surprises of the week (#256), the wished mix of
   * the balance ring (#254), short versions 5/20/60 min (#250), Neuland of the year (#253) and the
   * season switch (#89). Everything here is a suggestion: nothing is mandatory.
   */
  import { liveQuery } from 'dexie';
  import { FlaskConical, Layers, Shuffle, User, Sparkles, HeartHandshake, Puzzle, Gauge, BatteryLow, CalendarSearch, Target, Timer, Compass, Leaf, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import AreaIntro from '../lib/ui/AreaIntro.svelte';
  import Section from '../lib/ui/Section.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import { backClose } from '../lib/ui/backclose.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { historyQuery } from '../lib/abdb.js';
  import { balanceQuery } from '../lib/flow/data.svelte.js';
  import { balance, ringPaths, CATS, CAT } from '../lib/balance.js';
  import { lastDays } from '../lib/flow.js';
  import { weekOf } from '../lib/abauswertung.js';
  import { QUESTION } from '../lib/abfragen.js';
  import { db } from '../lib/db.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import {
    dayData, lifts, helps, drains, combos, comfort, recipe, goodRecipes, surprises, scoredDays, FACT, MIN_DAYS, GOOD,
    WISH_KEY, wishOf, wishGap, wishArcs, MINUTES, shortOf,
    NEULAND_KEY, neulandYear, addNeuland, renameNeuland, dropNeuland,
    SEASON_KEY, seasonOf, nextSeason, seasonListOf, tickSeason, addSeasonItem, renameSeasonItem, dropSeasonItem, moveSeasonItem,
    WOHL_KEY, wohlOf,
    EXP_KEY, EXP_DAYS, EXP_IDEAS, expSuggestion, experimentsOf, startExperiment, tickExperiment, stopExperiment, dropExperiment, renameExperiment, experimentState,
    PHASES_KEY, phasesOf, suggestedPhases, addPhase, renamePhase, dropPhase, phaseRows,
  } from '../lib/wohl.js';
  import { dailyValues } from '../lib/abauswertung.js';
  import { albumOf, ALBUM_KEY, albumCfgOf } from '../lib/wohl.js';
  import PhotoPick from '../lib/ui/PhotoPick.svelte';
  import { shrinkImage } from '../lib/photo.js';
  import '../lib/ich/ich.css';
  import '../lib/ui/daumen.css';

  const today = localDay();
  const year = today.slice(0, 4);
  const days60 = lastDays(today, 60);
  const daysLong = lastDays(today, 430); // the life phases look back up to the 4th season and own phases
  const plain = (x) => JSON.parse(JSON.stringify(x));

  const hist = historyQuery();
  const rows = $derived($hist?.rows ?? []);
  const extraQ = liveQuery(async () => {
    const [km, health, wish, neuland, season, cfg, exps, phases] = await Promise.all([
      db.kmBook.where('date').aboveOrEqual(daysLong[0]).toArray(),
      db.healthDays ? db.healthDays.where('date').aboveOrEqual(daysLong[0]).toArray() : [],
      db.settings.get(WISH_KEY),
      db.settings.get(NEULAND_KEY),
      db.settings.get(SEASON_KEY),
      db.settings.get(WOHL_KEY),
      db.settings.get(EXP_KEY),
      db.settings.get(PHASES_KEY),
    ]);
    return { km, health, wish: wish?.value ?? null, neuland: neuland?.value ?? [], season: season?.value ?? null, cfg: cfg?.value ?? null, exps: exps?.value ?? [], phases: phases?.value ?? null };
  });
  const ex = $derived($extraQ);
  const data = $derived(dayData({ rows, km: ex?.km ?? [], health: ex?.health ?? [], days: days60 }));
  const n = $derived(scoredDays(data));
  const cfg = $derived(wohlOf(ex?.cfg));
  const save = (key, value) => db.settings.put({ key, value: plain(value) });

  const fact = (k) => t(FACT[k].label);
  const f1 = (v) => (v == null ? '–' : Number(v).toLocaleString(locale(), { maximumFractionDigits: 1 }));
  const SRC = { hand: 'your answers', strava: 'Strava', fitbit: 'Fitbit' };
  const srcOf = (keys) => [...new Set(keys.flatMap((k) => FACT[k].src))].map((s) => t(SRC[s])).join(', ');

  // #249 the recipe of today, else of yesterday
  const rec = $derived(recipe(data, today) ?? recipe(data, days60.at(-2)));
  const recDay = $derived(recipe(data, today) ? t('today') : t('yesterday'));
  const recipes = $derived(goodRecipes(data));
  // what helps, what drains, combinations, comfort range
  const help = $derived(helps(data));
  const drain = $derived(drains(data));
  const combo = $derived(combos(data));
  const zone = $derived(comfort(data));
  // #256 surprises of this week
  const week = weekOf(today).filter((d) => d <= today);
  const surp = $derived(surprises(rows, week));
  const qName = (qid) => {
    const q = QUESTION[qid];
    return q?.was ? t(q.was) : q ? t(q.text) : qid;
  };

  // #254 the wished mix on the balance ring
  const bq = balanceQuery(today);
  const bal = $derived($bq ? balance({ ...$bq, today }) : null);
  const keys = CATS.map((c) => c.key);
  const wish = $derived(wishOf(ex?.wish, keys));
  const gaps = $derived(bal ? wishGap(bal.cats, wish) : []);
  const R = 200;
  const paths = $derived(bal ? ringPaths(bal.cats, R) : []);
  const arcs = $derived(wishArcs(keys, wish, R));
  let wishDlg = $state();
  let draft = $state({});
  function openWish() {
    draft = Object.fromEntries(keys.map((k) => [k, wish[k] ?? 50]));
    wishDlg?.showModal();
  }
  async function saveWish(e) {
    e.preventDefault();
    const before = ex?.wish ?? null;
    await save(WISH_KEY, wishOf(draft, keys));
    wishDlg.close();
    offerDone(t('Wished mix saved.'), () => save(WISH_KEY, before ?? {}));
  }
  async function clearWish() {
    const before = ex?.wish ?? null;
    await db.settings.delete(WISH_KEY);
    wishDlg.close();
    offerDone(t('Wished mix removed.'), () => save(WISH_KEY, before ?? {}));
  }

  // #250 short versions: the categories with the lowest value first
  let mins = $state(20);
  const shortCats = $derived(bal ? [...bal.cats].sort((a, b) => (a.value ?? 101) - (b.value ?? 101)).slice(0, 3).map((c) => c.key) : keys.slice(0, 3));

  // #253 Neuland
  const neu = $derived(neulandYear(ex?.neuland ?? [], rows, year));
  let nlEdit = $state(null); // { id?, name }
  async function saveNeuland(name) {
    const clean = String(name ?? '').trim();
    if (!clean) return t('Please a name.');
    const list = ex?.neuland ?? [];
    await save(NEULAND_KEY, nlEdit?.id ? renameNeuland(list, nlEdit.id, clean) : addNeuland(list, clean, today));
    offerDone(nlEdit?.id ? t('Renamed to «{name}».', { name: clean }) : t('«{name}» added to your Neuland.', { name: clean }), () => save(NEULAND_KEY, list));
  }
  async function delNeuland(x) {
    const list = ex?.neuland ?? [];
    await save(NEULAND_KEY, dropNeuland(list, x.id));
    offerDone(t('«{name}» removed.', { name: x.name }), () => save(NEULAND_KEY, list));
  }

  // #89 season switch
  const season = $derived(seasonListOf(ex?.season));
  let seasonPick = $state(nextSeason(today));
  const sNow = seasonOf(today);
  const sList = $derived(season[seasonPick]);
  const sDone = $derived(sList.done[year] ?? []);
  const itemName = (i) => (i.std ? t(i.name) : i.name);
  let sEdit = $state(null); // { id?, name }
  const setSeason = (v) => save(SEASON_KEY, v);
  async function saveSeasonItem(name) {
    const clean = String(name ?? '').trim();
    if (!clean) return t('Please a name.');
    const before = ex?.season ?? null;
    await setSeason(sEdit?.id ? renameSeasonItem(season, seasonPick, sEdit.id, clean) : addSeasonItem(season, seasonPick, clean));
    offerDone(sEdit?.id ? t('Renamed to «{name}».', { name: clean }) : t('«{name}» added.', { name: clean }), () => (before ? setSeason(before) : db.settings.delete(SEASON_KEY)));
  }
  async function delSeasonItem(i) {
    const before = ex?.season ?? null;
    await setSeason(dropSeasonItem(season, seasonPick, i.id));
    offerDone(t('«{name}» removed.', { name: itemName(i) }), () => (before ? setSeason(before) : db.settings.delete(SEASON_KEY)));
  }
  const SEASONS = $derived([{ key: 'spring', name: t('Spring') }, { key: 'autumn', name: t('Autumn') }]);

  const dayLong = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'long' });
  const missing = $derived(Math.max(0, MIN_DAYS * 2 - n));

  // #245 Kleine Experimente: a suggestion for 7 days, or your own (3, 7 or 14 days)
  const exps = $derived(experimentsOf(ex?.exps));
  const dataLong = $derived(dayData({ rows, km: ex?.km ?? [], health: ex?.health ?? [], days: daysLong }));
  const expRows = $derived(exps.map((x) => ({ x, s: experimentState(x, dataLong, today) })));
  const running = $derived(expRows.filter((r) => !r.s.done));
  const finished = $derived(expRows.filter((r) => r.s.done).slice(-3).reverse());
  const sugg = $derived(expSuggestion(bal?.least));
  const expName = (x) => (x.std ? t(x.what) : x.what);
  let expDlg = $state();
  let expForm = $state({ what: '', days: 7, idea: null });
  function openExp(idea = null) {
    expForm = { what: idea ? t(idea.what) : '', days: 7, idea };
    expDlg?.showModal();
  }
  async function saveExp(e) {
    e.preventDefault();
    const what = String(expForm.what ?? '').trim();
    if (!what) return;
    const list = ex?.exps ?? [];
    const std = !!expForm.idea && what === t(expForm.idea.what);
    await save(EXP_KEY, startExperiment(list, { what: std ? expForm.idea.what : what, std, fact: expForm.idea?.fact ?? null, days: Number(expForm.days) }, today));
    expDlg.close();
    offerDone(t('Experiment started: {name}.', { name: what }), () => save(EXP_KEY, list));
  }
  const expSave = async (fn, text) => {
    const list = ex?.exps ?? [];
    await save(EXP_KEY, fn(list));
    if (text) offerDone(text, () => save(EXP_KEY, list));
  };
  let expEdit = $state(null);
  async function renameExp(name) {
    const clean = String(name ?? '').trim();
    if (!clean) return t('Please a name.');
    await expSave((l) => renameExperiment(l, expEdit.id, clean), t('Renamed to «{name}».', { name: clean }));
  }
  const diffText = (s) => (s.diff == null ? t('Not enough days with a day score to compare yet.') : s.diff > 0 ? t('Day score {a} instead of {b} the days before: {d} more.', { a: f1(s.during.mean), b: f1(s.before.mean), d: f1(s.diff) }) : s.diff < 0 ? t('Day score {a} instead of {b} the days before: {d} less.', { a: f1(s.during.mean), b: f1(s.before.mean), d: f1(-s.diff) }) : t('Day score the same as the days before ({a}).', { a: f1(s.during.mean) }));

  // #255 Lebensphasen: your own and the app's suggestions (seasons), both can be renamed and removed
  const ph = $derived(phasesOf(ex?.phases));
  const phases = $derived([
    ...ph.own.map((p) => ({ ...p, own: true })),
    ...suggestedPhases(today).filter((p) => !ph.hidden.includes(p.id)).map((p) => ({ ...p, name: ph.names[p.id] ?? t(p.key, { year: p.year }) })),
  ]);
  const phRows = $derived(Object.fromEntries(phaseRows(phases, dataLong).map((r) => [r.id, r])));
  let phEdit = $state(null); // { id?, name, from, until }
  let phDlg = $state();
  let phErr = $state('');
  function openPhase(p = null) {
    phEdit = p ? { id: p.id, name: p.name, from: p.from, until: p.until, own: !!p.own } : { name: '', from: days60[0], until: today, own: true };
    phErr = '';
    phDlg?.showModal();
  }
  async function savePhase(e) {
    e.preventDefault();
    const name = String(phEdit.name ?? '').trim();
    if (!name) return (phErr = t('Please a name.'));
    const before = ex?.phases ?? null;
    let v = ex?.phases;
    if (phEdit.own) {
      if (!(phEdit.from <= phEdit.until)) return (phErr = t('The start must be before the end.'));
      v = phEdit.id ? addPhase(dropPhase(v, phEdit.id), { name, from: phEdit.from, until: phEdit.until }, phEdit.id) : addPhase(v, { name, from: phEdit.from, until: phEdit.until });
    } else v = renamePhase(v, phEdit.id, name);
    await save(PHASES_KEY, v);
    phDlg.close();
    offerDone(t('Phase «{name}» saved.', { name }), () => save(PHASES_KEY, before ?? {}));
  }
  async function delPhase(p) {
    const before = ex?.phases ?? null;
    await save(PHASES_KEY, dropPhase(ex?.phases, p.id));
    offerDone(t('«{name}» removed.', { name: p.name }), () => save(PHASES_KEY, before ?? {}));
  }

  // #79 Fotoalbum: your photos greet you on Heute (photos table, album: true)
  const albumQ = liveQuery(async () => {
    const [photos, cfg] = await Promise.all([db.photos.toArray(), db.settings.get(ALBUM_KEY)]);
    return { album: albumOf(photos), cfg: albumCfgOf(cfg?.value) };
  });
  const album = $derived($albumQ?.album ?? []);
  const albumCfg = $derived($albumQ?.cfg ?? { greet: true });
  let busy = $state(false);
  let photoErr = $state('');
  async function addPhoto(file) {
    busy = true;
    photoErr = '';
    try {
      const data = await shrinkImage(file, 1000, 0.8);
      const id = `album-${Date.now().toString(36)}`;
      await db.photos.put({ id, bikeId: null, tripId: null, album: true, name: '', data, addedAt: new Date().toISOString() });
      offerDone(t('Photo added to your album.'), () => db.photos.delete(id));
    } catch (e) {
      photoErr = e?.message ?? String(e);
    } finally {
      busy = false;
    }
  }
  async function delPhoto(p) {
    const rec = await db.photos.get(p.id);
    await db.photos.delete(p.id);
    offerDone(t('Photo removed.'), () => rec && db.photos.put(rec));
  }
  let capEdit = $state(null);
  async function saveCaption(name) {
    await db.photos.update(capEdit.id, { name: String(name ?? '').trim().slice(0, 60) });
  }

  // #252 Alleinsein, #257 Gutes Umplanen
  const aloneGood = $derived(dailyValues(rows, 'freunde.alleingut'));
  const aloneN = $derived(Object.keys(aloneGood).filter((d) => d >= days60[0]).length);
  const aloneMean = $derived(aloneN ? Object.entries(aloneGood).filter(([d]) => d >= days60[0]).reduce((s, [, v]) => s + v, 0) / aloneN : null);
  const aloneLift = $derived(lifts(data).find((l) => l.key === 'alone') ?? null);
  const replans = $derived(rows.filter((r) => r.qid === 'ziele.umplanen' && (Array.isArray(r.value) ? r.value[0] : r.value) === 'good' && r.day >= days60[0]).slice(0, 5));
</script>

<div class="ich-page wohl" data-page="wohl">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('What does me good')} title={t('What does me good')} sub={t('What your good days have in common. Only to look at: no grade, no diagnosis.')} />

  <AreaIntro
    key="wohl"
    kicker={t('How «What does me good» works')}
    title={t('Your good days, explained by your own data')}
    sub={t('The app compares days with a good day score (how happy you were with the day) to the others.')}
    steps={[
      { name: t('Answer|wohl'), text: t('Answer the evening question «How happy are you with the day?» now and then.') },
      { name: t('Wait|wohl'), text: t('After about 10 days the first results show here.') },
      { name: t('Look|wohl'), text: t('Tap «How does the app know?» under a result to see where it comes from.') },
    ]}
    tip={t('Everything here is a suggestion. Nothing is mandatory and you can ignore every line.')}
    know={t('Observation only: the app counts your days, it does not judge and does not diagnose.')}
  />

  {#if missing > 0}
    <p class="wl-wait card" role="note" data-wohl-wait><Sparkles size={18} aria-hidden="true" /><span>{tn(missing, 'Still {n} day with a day score, then the first results show here.', 'Still {n} days with a day score, then the first results show here.')}</span></p>
  {/if}

  <div class="ich-cols">
    <div class="ich-main">
      <!-- #245 Kleine Experimente -->
      <Section title={t('Small experiments')} sub={t('Try something for a few days and see what it does')}>
        <div class="card wl-box" data-wohl-exp>
          {#each running as r (r.x.id)}
            <div class="wl-exp" data-exp={r.x.id}>
              <p class="wl-big"><FlaskConical size={18} aria-hidden="true" /><b>{expName(r.x)}</b></p>
              <p class="muted">{t('Day {d} of {n} · {k} done', { d: r.s.day, n: r.x.days, k: r.s.ticks })}</p>
              <label class="wl-switch"><input type="checkbox" checked={r.x.ticks.includes(today)} onchange={() => expSave((l) => tickExperiment(l, r.x.id, today))} /><span>{t('Done today')}</span></label>
              {#if r.x.fact}<p class="muted small">{t('The app also ticks a day by itself when it sees «{fact}».', { fact: fact(r.x.fact) })}</p>{/if}
              <span class="wl-iacts">
                <button type="button" class="btn ic" aria-label={t('Rename «{name}»', { name: expName(r.x) })} onclick={() => (expEdit = { id: r.x.id, name: expName(r.x) })}><Pencil size={16} aria-hidden="true" /></button>
                <button type="button" class="btn" onclick={() => expSave((l) => stopExperiment(l, r.x.id), t('Experiment ended.'))}>{t('End now')}</button>
              </span>
            </div>
          {/each}
          {#if !running.length}
            <p>{t('Suggestion for 7 days: {what}', { what: t(sugg.what) })}</p>
            <div class="wl-acts">
              <button type="button" class="btn hi" onclick={() => openExp(sugg)} data-exp-suggest><FlaskConical size={18} aria-hidden="true" />{t('Try it')}</button>
              <button type="button" class="btn" onclick={() => openExp()} data-exp-own><Plus size={18} aria-hidden="true" />{t('Own experiment')}</button>
            </div>
          {:else}
            <button type="button" class="btn wl-add" onclick={() => openExp()}><Plus size={18} aria-hidden="true" />{t('Another experiment')}</button>
          {/if}
          {#each finished as r (r.x.id)}
            <div class="wl-done" data-exp-done={r.x.id}>
              <p><b>{expName(r.x)}</b> · <span class="muted">{t('ended')}</span></p>
              <p>{diffText(r.s)}</p>
              <details class="wl-how"><summary>{t('How does the app know?')}</summary><p>{t('{a} days of the experiment with a day score, {b} days before it with the same length. Ticks: {k}. Only an observation: many things change a day.', { a: r.s.during.n, b: r.s.before.n, k: r.s.ticks })}</p></details>
              <button type="button" class="btn ic" aria-label={t('Delete «{name}»', { name: expName(r.x) })} onclick={() => expSave((l) => dropExperiment(l, r.x.id), t('«{name}» removed.', { name: expName(r.x) }))}><Trash2 size={16} aria-hidden="true" /></button>
            </div>
          {/each}
        </div>
      </Section>

      <!-- #249 Rezept für gute Tage -->
      <Section title={t('Recipe of your day')} sub={t('What was there {day}', { day: recDay })}>
        <div class="card wl-box" data-wohl-recipe>
          {#if rec}
            <p class="wl-big"><Sparkles size={18} aria-hidden="true" /><b>{rec.good ? t('A good day ({score} of 10).', { score: f1(rec.score) }) : t('Day score {score} of 10.', { score: f1(rec.score) })}</b></p>
            {#if rec.parts.length}<p>{rec.good ? t('It had: {list}.', { list: rec.parts.map(fact).join(', ') }) : t('Was there anyway: {list}.', { list: rec.parts.map(fact).join(', ') })}</p>{:else}<p class="muted">{t('Nothing of your usual good parts was noted.')}</p>{/if}
          {:else}
            <p class="muted">{t('No day score for today or yesterday yet.')}</p>
          {/if}
          {#if recipes.length}
            <p class="wl-sub">{t('Your good days ({n}) most often had:', { n: recipes[0].of })}</p>
            <ul class="wl-chips">{#each recipes as r (r.key)}<li>{fact(r.key)} <em class="num">{r.n}×</em></li>{/each}</ul>
          {/if}
        </div>
      </Section>

      <!-- what helps + #259 -->
      <Section title={t('What does you good')} sub={t('A day score of {good} or more counts as a good day', { good: GOOD })}>
        <ul class="card slist" data-wohl-helps>
          {#each help as h (h.key)}
            <li class="srow wl-row">
              <span class="sib ok"><HeartHandshake size={18} aria-hidden="true" /></span>
              <span class="sm"><b>{t('Days with {fact}: {a} instead of {b}', { fact: fact(h.key), a: f1(h.with), b: f1(h.without) })}</b>
                <details class="wl-how"><summary>{t('How does the app know?')}</summary><p>{t('From {n} days with a day score: {a} days with it, mean {x}; {b} days without it, mean {y}. Sources: {src}.', { n: h.nWith + h.nWithout, a: h.nWith, x: f1(h.with), b: h.nWithout, y: f1(h.without), src: srcOf([h.key]) })}</p></details>
              </span>
            </li>
          {:else}
            <li class="srow"><span class="sm"><small>{t('Shows from {n} days with and {n} days without a thing.', { n: MIN_DAYS })}</small></span></li>
          {/each}
        </ul>
      </Section>

      <!-- #246 Gute Kombinationen -->
      <Section title={t('Good combinations')} sub={t('Two things on the same day, better together than alone')}>
        <ul class="card slist" data-wohl-combos>
          {#each combo as c (c.keys.join('+'))}
            <li class="srow wl-row">
              <span class="sib plan"><Puzzle size={18} aria-hidden="true" /></span>
              <span class="sm"><b>{t('{a} + {b}: {x} instead of {y}', { a: fact(c.keys[0]), b: fact(c.keys[1]), x: f1(c.both), y: f1(c.rest) })}</b>
                <details class="wl-how"><summary>{t('How does the app know?')}</summary><p>{t('{a} days with both, mean {x}; {b} days with one or none, mean {y}. Only shown when both together are better than each alone. Sources: {src}.', { a: c.nBoth, x: f1(c.both), b: c.nRest, y: f1(c.rest), src: srcOf(c.keys) })}</p></details>
              </span>
            </li>
          {:else}
            <li class="srow"><span class="sm"><small>{t('Shows from 4 days with both things together.')}</small></span></li>
          {/each}
        </ul>
      </Section>

      <!-- #248 Wohlfühlbereich -->
      <Section title={t('Your comfort range')} sub={t('The range with your best days, per value')}>
        <ul class="card slist" data-wohl-comfort>
          {#each zone as z (z.key)}
            <li class="srow wl-row">
              <span class="sib info"><Gauge size={18} aria-hidden="true" /></span>
              <span class="sm"><b>{t(z.label)}: {t(z.best.label)}</b><small>{t('mean {x} on {n} days, all days {y}', { x: f1(z.best.mean), n: z.best.n, y: f1(z.overall) })}</small>
                <details class="wl-how"><summary>{t('How does the app know?')}</summary><p>{z.all.map((a) => `${t(a.label)}: ${f1(a.mean)} (${tn(a.n, '{n} day', '{n} days')})`).join(' · ')}</p></details>
              </span>
            </li>
          {:else}
            <li class="srow"><span class="sm"><small>{t('Shows from 4 days in at least two ranges (sleep, time outside, km, coffee, screen).')}</small></span></li>
          {/each}
        </ul>
      </Section>

      <!-- #251 Energieräuber, voluntary -->
      <Section title={t('Energy drains')} sub={t('Voluntary: what comes with lower days')}>
        <div class="card wl-box" data-wohl-drains>
          <label class="wl-switch"><input type="checkbox" checked={cfg.drains} onchange={(e) => save(WOHL_KEY, { ...cfg, drains: e.currentTarget.checked })} /><span>{t('Show energy drains')}</span></label>
          {#if cfg.drains}
            {#each drain as d (d.key)}
              <p class="wl-line"><BatteryLow size={18} aria-hidden="true" /><span><b>{t('Days with {fact}: {a} instead of {b}', { fact: fact(d.key), a: f1(d.with), b: f1(d.without) })}</b>
                <details class="wl-how"><summary>{t('How does the app know?')}</summary><span>{t('{a} days with it, {b} without. Sources: {src}.', { a: d.nWith, b: d.nWithout, src: srcOf([d.key]) })}</span></details></span></p>
            {:else}
              <p class="muted">{t('No clear energy drain in your days. That is fine too.')}</p>
            {/each}
          {/if}
        </div>
      </Section>

      <!-- #255 Lebensphasen -->
      <Section title={t('Life phases')} sub={t('Compare times of your life: your own and the seasons')}>
        <ul class="card slist" data-wohl-phases>
          {#each phases as p (p.id)}
            {@const r = phRows[p.id]}
            <li class="srow wl-row" data-phase={p.id}>
              <span class="sib purple"><Layers size={18} aria-hidden="true" /></span>
              <span class="sm"><b>{p.name}</b><small>{dayLong(p.from)} – {dayLong(p.until)}</small>
                <small>{r?.n ? t('Day score {m} · good days {g} % · {km} km', { m: f1(r.mean), g: r.goodShare, km: r.km }) : t('No day score in this time yet · {km} km', { km: r?.km ?? 0 })}{r?.top ? ` · ${t('often: {fact}', { fact: fact(r.top) })}` : ''}</small>
              </span>
              <span class="rowacts">
                <button type="button" class="btn ic" aria-label={t('Rename «{name}»', { name: p.name })} onclick={() => openPhase(p)}><Pencil size={16} aria-hidden="true" /></button>
                <button type="button" class="btn ic" aria-label={t('Delete «{name}»', { name: p.name })} onclick={() => delPhase(p)}><Trash2 size={16} aria-hidden="true" /></button>
              </span>
            </li>
          {/each}
        </ul>
        <button type="button" class="btn wl-add" onclick={() => openPhase()} data-phase-add><Plus size={18} aria-hidden="true" />{t('Add phase')}</button>
      </Section>

      <!-- #252 Alleinsein, #257 Gutes Umplanen -->
      <Section title={t('Alone and replanned')} sub={t('From the evening questions, both can be switched off')}>
        <div class="card wl-box" data-wohl-alone>
          <p class="wl-line"><User size={18} aria-hidden="true" /><span>{aloneN ? t('Time alone did you good: {m} of 10 on {n} days.', { m: f1(aloneMean), n: aloneN }) : t('Not answered yet: «Were you alone on purpose today?» comes in the evening check.')}{aloneLift ? ` ${t('Days alone: day score {a} instead of {b}.', { a: f1(aloneLift.with), b: f1(aloneLift.without) })}` : ''}</span></p>
          <p class="wl-line"><Shuffle size={18} aria-hidden="true" /><span>{replans.length ? t('Replanning that was good:') : t('No good replanning noted yet. When it happens, it lands here.')}</span></p>
          {#if replans.length}<ul class="wl-list">{#each replans as r (r.id)}<li><span>{dayLong(r.day)}{r.note ? ` · ${r.note}` : ''}</span></li>{/each}</ul>{/if}
          <a class="btn" href="#/me/abfragen">{t('Switch questions on or off')}</a>
        </div>
      </Section>
    </div>

    <div class="ich-side">
      <!-- #256 Überraschungen -->
      <Section title={t('Surprises this week')} sub={t('Far from your normal of the 30 days before')}>
        <ul class="card slist" data-wohl-surprises>
          {#each surp as s (s.qid)}
            <li class="srow"><span class="sib warn"><CalendarSearch size={18} aria-hidden="true" /></span><span class="sm"><b>{qName(s.qid)}</b><small>{s.dir === 'up' ? t('higher than usual: {a} instead of {b}', { a: f1(s.week), b: f1(s.normal) }) : t('lower than usual: {a} instead of {b}', { a: f1(s.week), b: f1(s.normal) })}</small></span></li>
          {:else}
            <li class="srow"><span class="sm"><small>{t('No surprise this week: everything near your normal.')}</small></span></li>
          {/each}
        </ul>
      </Section>

      <!-- #254 Gewünschte Mischung -->
      <Section title={t('Wished mix')} sub={t('How your balance ring should look, ideally')}>
        <div class="card wl-box wl-ring" data-wohl-wish>
          {#if bal}
            <svg viewBox="0 0 {R} {R}" width="180" height="180" role="img" aria-label={t('Your balance with the wished mix as a line')}>
              {#each paths as p (p.key)}
                <path d={p.bg} class="bg" />
                {#if p.fg}<path d={p.fg} class="fg" />{/if}
              {/each}
              {#each arcs as a (a.key)}<path d={a.d} class="wish" data-wish={a.key} />{/each}
            </svg>
          {/if}
          {#if gaps.length}
            <p>{t('Furthest below your wish: {list}.', { list: gaps.map((g) => `${t(CAT[g.key].label)} (${g.value} / ${g.wish})`).join(', ') })}</p>
          {:else if Object.keys(wish).length}
            <p class="muted">{t('Your ring is close to your wish.')}</p>
          {:else}
            <p class="muted">{t('No wish yet. The line on the ring shows it once you set one.')}</p>
          {/if}
          <button type="button" class="btn" onclick={openWish} data-wish-edit><Target size={18} aria-hidden="true" />{Object.keys(wish).length ? t('Change wish') : t('Set wish')}</button>
        </div>
      </Section>

      <!-- #250 Kurze Version -->
      <Section title={t('Short and good')} sub={t('Every suggestion in 5, 20 or 60 minutes')}>
        <div class="card wl-box" data-wohl-short>
          <Seg full={false} small label={t('Time')} value={mins} onchange={(v) => (mins = v)} options={MINUTES.map((m) => ({ key: m, name: t('{n} min', { n: m }) }))} />
          <ul class="wl-list">
            {#each shortCats as k (k)}<li><Timer size={16} aria-hidden="true" /><span><b>{t(CAT[k].label)}</b> · {t(shortOf(k, mins))}</span></li>{/each}
          </ul>
          <p class="muted small">{t('The three areas lowest in your balance come first.')}</p>
        </div>
      </Section>

      <!-- #253 Neuland -->
      <Section title={t('Neuland {year}', { year })} sub={t('New places and things of the year')}>
        <ul class="card slist" data-wohl-neuland>
          {#each neu as x (x.id)}
            <li class="srow">
              <span class="sib done"><Compass size={18} aria-hidden="true" /></span>
              <span class="sm"><b>{x.name}</b><small>{dayLong(x.day)}{x.auto ? ` · ${t('from your evening answer')}` : ''}</small></span>
              {#if !x.auto}<span class="rowacts"><button type="button" class="btn ic" aria-label={t('Rename «{name}»', { name: x.name })} onclick={() => (nlEdit = { id: x.id, name: x.name })}><Pencil size={16} aria-hidden="true" /></button><button type="button" class="btn ic" aria-label={t('Delete «{name}»', { name: x.name })} onclick={() => delNeuland(x)}><Trash2 size={16} aria-hidden="true" /></button></span>{/if}
            </li>
          {:else}
            <li class="srow"><span class="sm"><small>{t('Nothing new yet this year. An evening with «New» and a note lands here by itself.')}</small></span></li>
          {/each}
        </ul>
        <button type="button" class="btn wl-add" onclick={() => (nlEdit = { name: '' })} data-neuland-add><Plus size={18} aria-hidden="true" />{t('Add Neuland')}</button>
      </Section>

      <!-- #79 Fotoalbum -->
      <Section title={t('Photo album')} sub={t('Your own photo greets you on Today, another one each time')}>
        <div class="card wl-box" data-wohl-album id="album">
          {#if album.length}
            <ul class="wl-album">
              {#each album as p (p.id)}
                <li>
                  <img src={p.data} alt={p.name || t('Your photo')} />
                  <span class="wl-iacts">
                    <button type="button" class="btn ic" aria-label={t('Caption')} onclick={() => (capEdit = { id: p.id, name: p.name ?? '' })}><Pencil size={16} aria-hidden="true" /></button>
                    <button type="button" class="btn ic" aria-label={t('Remove photo')} onclick={() => delPhoto(p)}><Trash2 size={16} aria-hidden="true" /></button>
                  </span>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="muted">{t('No photo yet. Add one and it greets you at the top of Today.')}</p>
          {/if}
          <PhotoPick onfile={addPhoto} {busy} has={album.length > 0} camera="Take photo" again="Another photo" />
          {#if photoErr}<p class="err" role="alert">{photoErr}</p>{/if}
          <label class="wl-switch"><input type="checkbox" checked={albumCfg.greet} onchange={(e) => save(ALBUM_KEY, { greet: e.currentTarget.checked })} /><span>{t('Show a photo on Today')}</span></label>
          <p class="muted small">{t('The photos stay on this device and in your backup.')}</p>
        </div>
      </Section>

      <!-- #89 Saisonwechsel -->
      <Section title={t('Season switch')} sub={sNow ? t('Now is the time: tick off what is done') : t('Next: {season}', { season: t(seasonPick === 'spring' ? 'Spring' : 'Autumn') })}>
        <div class="card wl-box" data-wohl-season>
          <Seg full={false} small label={t('Season')} value={seasonPick} onchange={(v) => (seasonPick = v)} options={SEASONS} />
          <ul class="wl-season">
            {#each sList.items as i, idx (i.id)}
              {@const done = sDone.includes(i.id)}
              <li class:done>
                <label><input type="checkbox" checked={done} onchange={() => setSeason(tickSeason(season, seasonPick, year, i.id))} /><span>{itemName(i)}</span></label>
                <span class="wl-iacts">
                  <button type="button" class="btn ic" disabled={idx === 0} aria-label={t('Move up')} onclick={() => setSeason(moveSeasonItem(season, seasonPick, i.id, -1))}><ChevronUp size={16} aria-hidden="true" /></button>
                  <button type="button" class="btn ic" disabled={idx === sList.items.length - 1} aria-label={t('Move down')} onclick={() => setSeason(moveSeasonItem(season, seasonPick, i.id, 1))}><ChevronDown size={16} aria-hidden="true" /></button>
                  <button type="button" class="btn ic" aria-label={t('Rename «{name}»', { name: itemName(i) })} onclick={() => (sEdit = { id: i.id, name: itemName(i) })}><Pencil size={16} aria-hidden="true" /></button>
                  <button type="button" class="btn ic" aria-label={t('Delete «{name}»', { name: itemName(i) })} onclick={() => delSeasonItem(i)}><Trash2 size={16} aria-hidden="true" /></button>
                </span>
              </li>
            {/each}
          </ul>
          <p class="muted small"><Check size={14} aria-hidden="true" /> {t('{a} of {b} done in {year}', { a: sDone.length, b: sList.items.length, year })}</p>
          <button type="button" class="btn wl-add" onclick={() => (sEdit = { name: '' })} data-season-add><Plus size={18} aria-hidden="true" />{t('Add point')}</button>
        </div>
      </Section>
    </div>
  </div>
</div>

<dialog class="sheet wl-wishsheet" bind:this={wishDlg} use:backClose aria-labelledby="wl-wish-h" data-wish-sheet>
  <form onsubmit={saveWish}>
    <div class="hd"><h2 id="wl-wish-h" class="title">{t('Wished mix')}</h2><span class="muted">{t('0 = not important now, 100 = very important')}</span></div>
    {#each CATS as c (c.key)}
      <label class="wl-slider"><span>{t(c.label)}</span><input type="range" min="0" max="100" step="10" bind:value={draft[c.key]} aria-label={t(c.label)} /><em class="num">{draft[c.key]}</em></label>
    {/each}
    <div class="acts foot daumen-foot">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => wishDlg.close()}>{t('Cancel')}</button>
      {#if Object.keys(wish).length}<button type="button" class="btn end" onclick={clearWish}>{t('Remove wish')}</button>{/if}
    </div>
  </form>
</dialog>

<dialog class="sheet" bind:this={expDlg} use:backClose aria-labelledby="wl-exp-h" data-exp-sheet>
  <form onsubmit={saveExp}>
    <div class="hd"><h2 id="wl-exp-h" class="title">{t('Small experiment')}</h2><span class="muted">{t('voluntary, you can end it any time')}</span></div>
    <label class="wl-field"><span class="lbl">{t('What do you try?')}</span><input class="inp" type="text" maxlength="80" bind:value={expForm.what} /></label>
    <p class="muted small">{t('Or pick an idea:')}</p>
    <div class="wl-ideas">{#each EXP_IDEAS.slice(0, 3) as i (i.what)}<button type="button" class="rv-chip" aria-pressed={expForm.what === t(i.what)} onclick={() => (expForm = { ...expForm, what: t(i.what), idea: i })}>{t(i.what)}</button>{/each}</div>
    <Seg full={false} small label={t('How long?')} value={expForm.days} onchange={(v) => (expForm.days = v)} options={EXP_DAYS.map((d) => ({ key: d, name: tn(d, '{n} day', '{n} days') }))} />
    <div class="acts foot daumen-foot">
      <button type="submit" class="btn hi" disabled={!String(expForm.what ?? '').trim()}>{t('Start')}</button>
      <button type="button" class="btn" onclick={() => expDlg.close()}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<dialog class="sheet" bind:this={phDlg} use:backClose aria-labelledby="wl-ph-h" data-phase-sheet>
  {#if phEdit}
    <form onsubmit={savePhase}>
      <div class="hd"><h2 id="wl-ph-h" class="title">{phEdit.id ? t('Change phase') : t('Add phase')}</h2></div>
      <label class="wl-field"><span class="lbl">{t('Name')}</span><input class="inp" type="text" maxlength="60" bind:value={phEdit.name} /></label>
      {#if phEdit.own}
        <div class="wl-two">
          <label class="wl-field"><span class="lbl">{t('From')}</span><input class="inp" type="date" max={today} bind:value={phEdit.from} /></label>
          <label class="wl-field"><span class="lbl">{t('Until')}</span><input class="inp" type="date" bind:value={phEdit.until} /></label>
        </div>
      {:else}
        <p class="muted">{t('A suggestion of the app: only the name can change.')}</p>
      {/if}
      {#if phErr}<p class="err" role="alert">{phErr}</p>{/if}
      <div class="acts foot daumen-foot">
        <button type="submit" class="btn hi">{t('Save')}</button>
        <button type="button" class="btn" onclick={() => phDlg.close()}>{t('Cancel')}</button>
      </div>
    </form>
  {/if}
</dialog>

{#if expEdit}
  <RenameSheet kicker={t('Small experiment')} title={t('Rename experiment')} value={expEdit.name} max={80} onsave={renameExp} onclose={() => (expEdit = null)} />
{/if}
{#if capEdit}
  <RenameSheet kicker={t('Photo album')} title={t('Caption')} value={capEdit.name} max={60} empty={t('no caption')} hint={t('A few words, shown on the photo.')} onsave={saveCaption} onclose={() => (capEdit = null)} />
{/if}
{#if nlEdit}
  <RenameSheet kicker={t('Neuland {year}', { year })} title={nlEdit.id ? t('Rename Neuland') : t('Add Neuland')} value={nlEdit.name} max={80} hint={t('A new place or a new thing, in a few words.')} onsave={saveNeuland} onclose={() => (nlEdit = null)} />
{/if}
{#if sEdit}
  <RenameSheet kicker={t('Season switch')} title={sEdit.id ? t('Rename point') : t('Add point')} value={sEdit.name} max={80} hint={t('One thing to think of when the season changes.')} onsave={saveSeasonItem} onclose={() => (sEdit = null)} />
{/if}

<style>
  .wohl {
    max-width: 1100px;
  }
  .wl-wait {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    margin: 0 0 18px;
  }
  .wl-box {
    padding: 14px 16px;
    display: grid;
    gap: 10px;
  }
  .wl-box p {
    margin: 0;
  }
  .wl-big {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .wl-sub {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .wl-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .wl-chips li {
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--l1) 14%, var(--paper));
  }
  .wl-chips em {
    font-style: normal;
    color: var(--ink-2);
  }
  .wl-row .sm {
    display: grid;
    gap: 2px;
  }
  .wl-how summary {
    cursor: pointer;
    color: var(--ink-2);
    font-size: var(--fs-small);
    min-height: 32px;
    display: flex;
    align-items: center;
  }
  .wl-how p,
  .wl-how span {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .wl-line {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .wl-switch {
    display: flex;
    gap: 10px;
    align-items: center;
    min-height: 44px;
  }
  .wl-switch input {
    width: 20px;
    height: 20px;
  }
  .wl-ring {
    justify-items: center;
    text-align: center;
  }
  .wl-ring .bg {
    fill: color-mix(in srgb, var(--l1) 14%, var(--paper));
  }
  .wl-ring .fg {
    fill: var(--l1);
  }
  .wl-ring .wish {
    fill: none;
    stroke: var(--ink);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
  .wl-list,
  .wl-season {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }
  .wl-list li {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .wl-season li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 8px;
    border-bottom: 1px solid var(--line, color-mix(in srgb, var(--ink) 10%, transparent));
    padding: 4px 0;
  }
  .wl-season label {
    display: flex;
    gap: 10px;
    align-items: center;
    min-height: 44px;
    flex: 1 1 160px;
  }
  .wl-season input {
    width: 20px;
    height: 20px;
  }
  .wl-season li.done span {
    color: var(--ink-2);
    text-decoration: line-through;
  }
  .wl-album {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
  }
  .wl-album li {
    display: grid;
    gap: 4px;
  }
  .wl-album img {
    width: 100%;
    height: 90px;
    object-fit: cover;
    border-radius: 10px;
  }
  .wl-iacts {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    flex: 0 0 auto;
  }
  .wl-iacts > .btn.ic {
    flex: 0 0 auto;
    width: 44px;
    min-width: 44px;
    padding: 0;
    justify-content: center;
  }
  .wl-season label {
    min-width: 0;
  }
  .wl-add {
    margin-top: 10px;
    justify-self: start;
  }
  .small {
    font-size: var(--fs-small);
  }
  .wl-slider {
    display: grid;
    grid-template-columns: 8.5em 1fr 2.5em;
    gap: 10px;
    align-items: center;
    min-height: 44px;
  }
  .wl-slider em {
    font-style: normal;
    text-align: right;
  }
  .wl-exp,
  .wl-done {
    display: grid;
    gap: 6px;
    padding-bottom: 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--ink) 10%, transparent);
  }
  .wl-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .wl-ideas {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }
  .wl-field {
    display: grid;
    gap: 4px;
    margin: 10px 0;
  }
  .wl-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
</style>
