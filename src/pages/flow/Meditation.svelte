<script>
  /**
   * Hobby pages 2 «Kissenzeit»: the meditation page (mockup B1, Noah 10.10.2026, H4a–H7a, H12a, H13a, H28a).
   *   #/flow/act/meditation   the core (start from a template, «Wie letztes Mal», the log), «Heute
   *                           vielleicht» and all kinds, the challenge (only near the best time, at most
   *                           one a day), the milestones (6 + 4), the history, the seven sounds, quotes,
   *                           own links, places and things, Fitbit as a grey «geplant» row, «Diese Seite kann».
   * Everything is a suggestion: templates, kinds, places, things, quotes and the challenge can be changed,
   * put away or deleted. A session runs in the full view (B7, FlowLayer) and is saved in flowLog + flowSessions.
   */
  import { ChevronLeft, Play, X, Plus, Lightbulb, Volume2, Link as LinkIcon, ExternalLink, Activity as Pulse, Check } from '@lucide/svelte';
  import ActIcon from '../../lib/flow/ActIcon.svelte';
  import Dial from '../../lib/flow/hobby/Dial.svelte';
  import MsBlock from '../../lib/flow/hobby/MsBlock.svelte';
  import Sugg from '../../lib/flow/hobby/Sugg.svelte';
  import CanDo from '../../lib/flow/hobby/CanDo.svelte';
  import { db } from '../../lib/db.js';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { actState } from '../../lib/flow.js';
  import { msContext, actMilestones, evaluate, isOff, newStars } from '../../lib/flowms.js';
  import { artsOf, addArt, toggleFavArt, sortTemplates, bowlWords, lastSession, daysGrid, streaks, weekMinutes, challenge, PLACES, THINGS, choiceList, placeCounts, linkOf, linksOf, sessionPlan, ARTS_KEY, PLACES_KEY, THINGS_KEY, LINKS_KEY, SOUND_KEY, CHALLENGE_KEY } from '../../lib/flowmed.js';
  import { planMarks } from '../../lib/flowbowl.js';
  import { SOUNDS, soundOk, playSound, canVibrate, vibrate, DEFAULT_SOUND, DEFAULT_END_SOUND } from '../../lib/flowsounds.js';
  import { quotesOf, QUOTES_KEY, quoteSet } from '../../lib/flowquotes.js';
  import { saveStars, putSetting } from '../../lib/flowdb.js';
  import { startSession, clockState, ui, actName } from '../../lib/flow/ui.svelte.js';
  import { actGoalText } from '../../lib/flow/words.js';
  import { tileName, whenShort, tplName, artName } from '../../lib/flow/hobby/words.js';
  import { clock } from '../../lib/flowtimer.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn, lang } from '../../lib/i18n.svelte.js';

  let { actId = 'meditation' } = $props();
  const today = localDay();
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    seedMed(data, actId);
  });
  const act = $derived(data?.acts.find((a) => a.id === actId) ?? null);
  const st = $derived(act && data ? actState(act, data.log, today, data.tripDays) : null);
  const base = $derived(`#/flow/act/${encodeURIComponent(actId)}`);

  /* milestones of this page (6 + 4); the stars reached are kept for ever */
  const ctx = $derived(data ? msContext({ acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays }) : null);
  const stored = $derived(new Map((data?.stars ?? []).map((s) => [s.id, s.day])));
  const ms = $derived(act && ctx ? actMilestones(act).map((m) => ({ ...evaluate(m, ctx, stored, data.tune), off: isOff(m, data.tune) })) : []);
  $effect(() => {
    const fresh = newStars(ms, stored);
    if (fresh.length) saveStars(db, fresh);
  });
  const msShown = $derived(ms.filter((r) => !r.off));

  /* the core: templates, «Wie letztes Mal», the log */
  const tpls = $derived(sortTemplates(data?.tpls ?? []));
  let allTpls = $state(false);
  const tplsShown = $derived(allTpls ? tpls : tpls.slice(0, 3));
  const arts = $derived(artsOf(data?.arts));
  const artOf = (id) => arts.all.find((a) => a.id === id) ?? null;
  const places = $derived(choiceList(data?.places, PLACES));
  const placeName = (p) => (!p ? '' : p.own ? p.name : t(p.name));
  const curPlace = $derived(places.list.find((p) => p.id === places.cur) ?? null);
  const between = $derived(soundOk(data?.sound, DEFAULT_SOUND));
  const running = $derived(!!clockState.tm);
  const modeLine = (bowl) => {
    const w = bowlWords(bowl);
    return t(w.key, w.vars);
  };
  function begin({ minutes, bowl, sound, endSound, art, tplId = null, name = null }) {
    if (running) {
      ui.sessionOpen = true;
      return;
    }
    const a = artOf(art);
    const plan = sessionPlan({ minutes, bowl, sound, endSound, art, tplId, name, place: places.cur });
    plan.extra.session.artLabel = a ? artName(a) : act ? actName(act) : '';
    plan.extra.session.placeLabel = placeName(curPlace);
    startSession(actId, plan);
  }
  const startTpl = (x) => begin({ minutes: x.minutes, bowl: x.bowl, sound: x.sound, endSound: x.endSound, art: x.art, tplId: x.id, name: tplName(x) });
  const last = $derived(data ? lastSession(data.sessions, data.log, actId) : null);
  const lastTpl = $derived(last?.tplId ? tpls.find((x) => x.id === last.tplId) : null);
  const startLast = () => last && begin({ minutes: last.target ?? last.min, bowl: last.bowl, sound: last.sound, endSound: last.endSound, art: last.art, tplId: last.tplId, name: lastTpl ? tplName(lastTpl) : null });
  const weeks = $derived(data ? weekMinutes(data.log, actId, today, 8) : []);
  const weekMax = $derived(Math.max(1, ...weeks.map((w) => w.min)));
  const str = $derived(data ? streaks(data.log, actId, today) : { now: 0, longest: 0 });

  /* kinds (H13a) and the challenge (H12a) */
  const favArts = $derived(arts.favs.map(artOf).filter(Boolean));
  const tplForArt = (id) => tpls.find((x) => x.art === id) ?? null;
  function startArt(a) {
    const x = tplForArt(a.id);
    if (x) return startTpl(x);
    begin({ minutes: a.minutes ?? 20, bowl: { mode: 'none' }, sound: between, endSound: DEFAULT_END_SOUND, art: a.id });
  }
  const saveArts = (v) => putSetting(db, ARTS_KEY, v);
  let newArt = $state('');
  async function addOwnArt(e) {
    e.preventDefault();
    if (!newArt.trim()) return;
    await saveArts(addArt(data.arts, newArt));
    newArt = '';
  }
  const ch = $derived(data ? challenge({ log: data.log, actId, today, seen: data.seen }) : null);
  const hideChallenge = () => putSetting(db, CHALLENGE_KEY, { day: today, off: true });

  /* history */
  const grid = $derived(data ? daysGrid(data.log, actId, today, 28) : []);

  /* sounds */
  const setSound = (id) => putSetting(db, SOUND_KEY, id);
  const hear = (id) => (id === 'vibrate' ? vibrate() : playSound(id, 0, 0.4));

  /* quotes (H6a, H28a) */
  const quotes = $derived(quotesOf(data?.quotes, lang.v === 'de'));
  let showSugg = $state(false);
  let origOpen = $state(null);
  const saveQuotes = (patch) => putSetting(db, QUOTES_KEY, { ...quoteSet(data.quotes), ...patch });
  const quoteOff = (id) => {
    const s = quoteSet(data.quotes);
    return s.own.some((x) => x.id === id) ? saveQuotes({ own: s.own.filter((x) => x.id !== id) }) : saveQuotes({ off: [...s.off, id], add: s.add.filter((x) => x !== id) });
  };
  const quoteAdd = (id) => saveQuotes({ add: [...quoteSet(data.quotes).add, id] });
  const quotesBack = () => saveQuotes({ off: [] });
  let qText = $state('');
  let qSource = $state('');
  let qOpen = $state(false);
  async function addQuote(e) {
    e.preventDefault();
    if (!qText.trim()) return;
    const s = quoteSet(data.quotes);
    await saveQuotes({ own: [...s.own, { id: `own-${Date.now().toString(36)}`, text: qText, source: qSource }] });
    qText = '';
    qSource = '';
    qOpen = false;
  }

  /* own links (only what the user types, nothing preset) */
  const links = $derived(linksOf(data?.links));
  let lTitle = $state('');
  let lUrl = $state('');
  let lOpen = $state(false);
  let lBad = $state(false);
  async function addLink(e) {
    e.preventDefault();
    const l = linkOf(lTitle, lUrl);
    lBad = !l;
    if (!l) return;
    await putSetting(db, LINKS_KEY, [...links, l]);
    lTitle = '';
    lUrl = '';
    lOpen = false;
  }
  const removeLink = (l) => putSetting(db, LINKS_KEY, links.filter((x) => x.id !== l.id));

  /* places and things */
  const counts = $derived(placeCounts(data?.sessions ?? [], actId));
  const pickPlace = (p) => putSetting(db, PLACES_KEY, { cur: places.cur === p.id ? null : p.id, own: places.own, hidden: places.hidden });
  let newPlace = $state('');
  async function addPlace(e) {
    e.preventDefault();
    const nm = newPlace.trim();
    if (!nm) return;
    await putSetting(db, PLACES_KEY, { cur: `own:${nm}`, own: [...new Set([...places.own, nm])], hidden: places.hidden });
    newPlace = '';
  }
  const things = $derived(choiceList(data?.things, THINGS));
  const dropThing = (x) => putSetting(db, THINGS_KEY, x.own ? { own: things.own.filter((n) => `own:${n}` !== x.id), hidden: things.hidden } : { own: things.own, hidden: [...things.hidden, x.id] });
  let newThing = $state('');
  async function addThing(e) {
    e.preventDefault();
    const nm = newThing.trim();
    if (!nm) return;
    await putSetting(db, THINGS_KEY, { own: [...new Set([...things.own, nm])], hidden: things.hidden });
    newThing = '';
  }

  const CAN = [
    'start in one tap: from a template or like last time',
    'templates with name, last use and duration',
    'a clock with sounds exactly where you want them',
    'twelve kinds, your favourites first',
    'milestones with «soon» and «recently»',
    'a calm full view while you sit, the gong also when locked (Android)',
    'sounds, quotes with their source, own links and places',
  ];
</script>

<div class="med">
  <p class="back"><a href="#/flow/activity"><ChevronLeft size={16} aria-hidden="true" />{t('Back to Activity')}</a></p>

  {#if data && !act}
    <section class="surf pad">
      <h1 class="h1" tabindex="-1" data-page-title>{t('Activity|tab')}</h1>
      <p class="hint">{t('This activity has no page of its own yet.')} <a href="#/flow/edit/{encodeURIComponent(actId)}?from=activity">{t('Open the activity')}</a></p>
    </section>
  {:else if data && act}
    <header class="surf head">
      <ActIcon icon={act.icon} ring={act.ring} size={26} />
      <div class="ht">
        <h1 class="h1" tabindex="-1" data-page-title>{actName(act)}</h1>
        <p class="pills"><span class="pill ok">{t('Mindful|ring')}</span>{#if tileName(act) !== actName(act)}<span class="pill">«{tileName(act)}»</span>{/if}</p>
      </div>
      {#if st && !st.resting}
        <div class="goal">
          <span class="gring num" aria-hidden="true">{st.stand.n}/{st.stand.of}</span>
          <span class="gt"><b>{t('Goal|flow')}</b><small>{actGoalText(act, today)}</small></span>
        </div>
      {/if}
    </header>

    <h2 class="zlabel hs">{t('Core')}</h2>
    <div class="core">
      <section class="surf pad" aria-labelledby="k1">
        <h3 id="k1" class="kh"><span class="kn">1</span>{t('From a template')}</h3>
        <ul class="tpls">
          {#each tplsShown as x (x.id)}
            <li data-tpl={x.id}>
              <button type="button" class="play" aria-label={t('Start {name}', { name: tplName(x) })} onclick={() => startTpl(x)}><Play size={18} aria-hidden="true" /></button>
              <a class="tn" href="{base}/timer?tpl={encodeURIComponent(x.id)}">
                <b>{tplName(x)}</b>
                <small class="num">{x.minutes} min · {modeLine(x.bowl)}{#if x.art && artOf(x.art)}{' · '}{artName(artOf(x.art))}{/if}</small>
                <small>{x.usedAt ? t('last {when}', { when: whenShort(x.usedAt) }) : t('not used yet')}</small>
              </a>
            </li>
          {:else}
            <li class="none">{t('No template yet.')}</li>
          {/each}
        </ul>
        <p class="links">
          {#if tpls.length > 3}<button type="button" class="lnk" aria-expanded={allTpls} onclick={() => (allTpls = !allTpls)}>{allTpls ? t('fewer') : tn(tpls.length, 'the {n} template', 'all {n} templates')}</button>{' · '}{/if}
          <a href="{base}/timer?new=1" data-to="new-tpl">{t('new template')}</a>
        </p>
      </section>

      <section class="surf pad" aria-labelledby="k2">
        <h3 id="k2" class="kh"><span class="kn">2</span>{t('Like last time')}</h3>
        {#if last}
          <p class="when">{whenShort(last.at)}</p>
          <div class="lastrow">
            <Dial total={(last.target ?? last.min) * 60} marks={planMarks((last.target ?? last.min) * 60, last.bowl)} small>
              <b class="ltime num">{clock((last.target ?? last.min) * 60)}</b>
            </Dial>
            <p class="lt"><b>{last.art && artOf(last.art) ? artName(artOf(last.art)) : actName(act)} · {last.target ?? last.min} min</b><small>{modeLine(last.bowl)} · {t(SOUNDS.find((s) => s.id === last.sound)?.name ?? 'Singing bowl deep')}</small></p>
          </div>
          <button type="button" class="btn hi wide" onclick={startLast} data-start="last"><Play size={18} aria-hidden="true" />{running ? t('Open the running session') : t('Start|session')}</button>
          <p class="links"><a href="{base}/timer?last=1">{t('adjust first')}</a>{' · '}<a href="{base}/timer?last=1">{t('Intervals')}</a></p>
        {:else}
          <p class="hint">{t('After your first session it starts here again in one tap.')}</p>
          <a class="btn wide" href="{base}/timer?new=1">{t('Set the clock')}</a>
        {/if}
      </section>

      <section class="surf pad" aria-labelledby="k3">
        <h3 id="k3" class="kh"><span class="kn">3</span>{t('Log')}</h3>
        <p class="hint">{t('Minutes per week, last 8 weeks')}</p>
        <div class="bars" role="img" aria-label={t('Minutes per week, last 8 weeks')}>
          {#each weeks as w, i (w.week)}<i class:now={i === weeks.length - 1} style:height="{Math.max(4, Math.round((w.min / weekMax) * 100))}%"></i>{/each}
        </div>
        <p class="hint num">{t('Streak: {n} days', { n: str.now })} · {t('this week {n} min', { n: weeks.at(-1)?.min ?? 0 })}</p>
        <a class="btn wide" href="{base}/log" data-to="log">{t('Open the log')}</a>
      </section>
    </div>

    <h2 class="zlabel hs">{t('Kinds')}</h2>
    <section class="surf pad">
      <p class="cap">{t('Maybe today')}</p>
      <div class="favs">
        {#each favArts as a (a.id)}
          {@const x = tplForArt(a.id)}
          <div class="fav" data-art={a.id}>
            <button type="button" class="fb" onclick={() => startArt(a)}>
              <b>{artName(a)}</b>
              <small>{x ? t('Template «{name}»', { name: tplName(x) }) : t('{n} min · only start and end', { n: a.minutes ?? 20 })}</small>
            </button>
            <button type="button" class="ib sm" aria-label={t('Remove {name} from today', { name: artName(a) })} onclick={() => saveArts(toggleFavArt(data.arts, a.id))}><X size={16} aria-hidden="true" /></button>
          </div>
        {/each}
      </div>
      {#if ch}
        <p class="chal" data-challenge={ch.target}>
          <Lightbulb size={18} aria-hidden="true" />
          <span>{t('Can you do {n} minutes today? Your longest so far: {best}.', { n: ch.target, best: ch.best })}</span>
          <a href="{base}/timer?min={ch.target}">{t('try it')}</a>
          <button type="button" class="ib sm" aria-label={t('Not today')} onclick={hideChallenge}><X size={16} aria-hidden="true" /></button>
        </p>
      {/if}
      <p class="cap">{t('All kinds')}<Sugg /></p>
      <div class="chips">
        {#each arts.all as a (a.id)}
          {@const on = arts.favs.includes(a.id)}
          <button type="button" class="chip" class:on aria-pressed={on} onclick={() => saveArts(toggleFavArt(data.arts, a.id))}>{#if on}<Check size={16} aria-hidden="true" />{:else}<Plus size={16} aria-hidden="true" />{/if}{artName(a)}</button>
        {/each}
      </div>
      <form class="addrow" onsubmit={addOwnArt}>
        <label class="grow"><span class="sr">{t('Own kind')}</span><input class="inp" bind:value={newArt} maxlength="40" placeholder={t('Own kind')} /></label>
        <button type="submit" class="btn">{t('+ Kind')}</button>
      </form>
      <p class="hint">{t('Twelve kinds as a start, add your own.')}</p>
    </section>

    <h2 class="zlabel hs">{t('Milestones')} <span class="hsub">· 6 + 4</span></h2>
    <MsBlock list={msShown} all={msShown} {today} compact tuneHref="#/flow/milestones?act={encodeURIComponent(actId)}&tune=1" />

    <div class="two">
      <div class="col">
        <h2 class="zlabel hs">{t('History')}</h2>
        <section class="surf pad">
          <div class="grid" role="img" aria-label={t('Last 4 weeks')}>
            {#each grid as g (g.day)}<i class:on={g.on} title={g.day}></i>{/each}
          </div>
          <p class="hint">{t('Last 4 weeks')} · {t('current streak {n} days', { n: str.now })} · {t('longest {n}', { n: str.longest })}</p>
          <p class="fitbit"><Pulse size={16} aria-hidden="true" /><span>{t('Fitbit: resting pulse, HRV and sleep as an observation')}</span><span class="pill">{t('planned')}</span></p>
        </section>

        <h2 class="zlabel hs">{t('Sound')}</h2>
        <section class="surf pad">
          <p class="cap">{t('The sound in between; start and end: {name}', { name: t('Singing bowl deep') })}</p>
          <ul class="sounds">
            {#each SOUNDS as s (s.id)}
              <li class:on={between === s.id} data-sound={s.id}>
                <button type="button" class="sp" aria-pressed={between === s.id} onclick={() => setSound(s.id)}><Volume2 size={18} aria-hidden="true" /><b>{t(s.name)}</b>{#if s.sugg}<Sugg />{/if}</button>
                <button type="button" class="hear" onclick={() => hear(s.id)}><Play size={14} aria-hidden="true" />{t('listen')}</button>
              </li>
            {/each}
          </ul>
          {#if !canVibrate()}<p class="hint">{t('Vibration only works on Android; an iPhone cannot vibrate from a web page.')}</p>{/if}
        </section>

        <h2 class="zlabel hs">{t('Places and things')}</h2>
        <section class="surf pad">
          <p class="cap">{t('Where do you sit?')}<Sugg /></p>
          <div class="chips">
            {#each places.list as p (p.id)}
              <button type="button" class="chip" class:on={places.cur === p.id} aria-pressed={places.cur === p.id} onclick={() => pickPlace(p)} data-place={p.id}>{placeName(p)}{#if counts.get(p.id)}<span class="cnt num">· {counts.get(p.id)}×</span>{/if}</button>
            {/each}
          </div>
          <form class="addrow" onsubmit={addPlace}>
            <label class="grow"><span class="sr">{t('Own place')}</span><input class="inp" bind:value={newPlace} maxlength="40" placeholder={t('Own place')} /></label>
            <button type="submit" class="btn">{t('+ Place')}</button>
          </form>
          <p class="cap">{t('What helps')}</p>
          <div class="chips">
            {#each things.list as x (x.id)}
              <span class="chip still">{x.own ? x.name : t(x.name)}<button type="button" class="cx" aria-label={t('Remove {name}', { name: x.own ? x.name : t(x.name) })} onclick={() => dropThing(x)}><X size={14} aria-hidden="true" /></button></span>
            {/each}
          </div>
          <form class="addrow" onsubmit={addThing}>
            <label class="grow"><span class="sr">{t('Own thing')}</span><input class="inp" bind:value={newThing} maxlength="40" placeholder={t('Own thing')} /></label>
            <button type="submit" class="btn">{t('+ Thing')}</button>
          </form>
        </section>
      </div>

      <div class="col">
        <h2 class="zlabel hs">{t('Quotes')}</h2>
        <section class="surf pad">
          <ul class="quotes">
            {#each quotes.shown as x (x.id)}
              <li data-quote={x.id}>
                <blockquote>«{x.text}»</blockquote>
                <p class="src">{#if x.own}{x.source || t('own quote')}{:else}{x.author}, {x.source} · {t('public domain · own translation')}{/if}</p>
                <p class="qa">
                  {#if x.orig}<button type="button" class="lnk" aria-expanded={origOpen === x.id} onclick={() => (origOpen = origOpen === x.id ? null : x.id)}>{origOpen === x.id ? t('hide the original') : t('show the original')}</button>{' · '}{/if}
                  <button type="button" class="lnk" onclick={() => quoteOff(x.id)}>{t('leave out')}</button>
                </p>
                {#if origOpen === x.id}<p class="orig">{x.orig}</p>{/if}
              </li>
            {/each}
          </ul>
          {#if showSugg}
            <ul class="quotes sugg">
              {#each quotes.sugg as x (x.id)}
                <li data-quote={x.id}>
                  <blockquote>«{x.text}»</blockquote>
                  <p class="src">{x.author}, {x.source} · {t('public domain · own translation')}<Sugg /></p>
                  <p class="qa"><button type="button" class="lnk" onclick={() => quoteAdd(x.id)}>{t('add')}</button></p>
                </li>
              {/each}
            </ul>
          {/if}
          <p class="links">
            {#if quotes.sugg.length}<button type="button" class="lnk" aria-expanded={showSugg} onclick={() => (showSugg = !showSugg)}>{showSugg ? t('hide the suggestions') : tn(quotes.sugg.length, '{n} more suggestion', '{n} more suggestions')}</button>{' · '}{/if}
            {#if quotes.off}<button type="button" class="lnk" onclick={quotesBack}>{tn(quotes.off, 'bring {n} back', 'bring {n} back')}</button>{' · '}{/if}
            <button type="button" class="lnk" aria-expanded={qOpen} onclick={() => (qOpen = !qOpen)}>{t('+ own quote with source')}</button>
          </p>
          {#if qOpen}
            <form class="form" onsubmit={addQuote}>
              <label><span class="lbl">{t('Quote')}</span><textarea class="inp" rows="2" bind:value={qText} maxlength="300"></textarea></label>
              <label><span class="lbl">{t('Source')}</span><input class="inp" bind:value={qSource} maxlength="120" /></label>
              <p class="hint">{t('Own quotes stay on this device only.')}</p>
              <button type="submit" class="btn">{t('Add quote')}</button>
            </form>
          {/if}
        </section>

        <h2 class="zlabel hs">{t('Links')}</h2>
        <section class="surf pad">
          {#if links.length}
            <ul class="lks">
              {#each links as l (l.id)}
                <li>
                  <a class="la" href={l.url} target="_blank" rel="noopener noreferrer"><LinkIcon size={16} aria-hidden="true" /><span><b>{l.title}</b><small>{new URL(l.url).hostname}</small></span><ExternalLink size={16} aria-hidden="true" /></a>
                  <button type="button" class="ib sm" aria-label={t('Remove {name}', { name: l.title })} onclick={() => removeLink(l)}><X size={16} aria-hidden="true" /></button>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="hint">{t('No links yet. Add your own: a title and an address.')}</p>
          {/if}
          {#if lOpen}
            <form class="form" onsubmit={addLink}>
              <label><span class="lbl">{t('Title')}</span><input class="inp" bind:value={lTitle} maxlength="80" /></label>
              <label><span class="lbl">{t('Address')}</span><input class="inp" type="url" inputmode="url" bind:value={lUrl} placeholder="https://" /></label>
              {#if lBad}<p class="bad">{t('That is not a web address.')}</p>{/if}
              <button type="submit" class="btn">{t('Add link')}</button>
            </form>
          {:else}
            <button type="button" class="btn addl" onclick={() => (lOpen = true)}>{t('+ Link')}</button>
          {/if}
        </section>
      </div>
    </div>

    <CanDo items={CAN} />
  {/if}
</div>

<style>
  .med {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 1328px;
    margin: 0 auto;
    min-width: 0;
  }
  .back {
    margin: 0;
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--accent);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .pad {
    padding: 16px 18px;
    min-width: 0;
  }
  @media (min-width: 720px) {
    .pad {
      padding: 20px 24px;
    }
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    padding: 16px 18px;
  }
  .ht {
    flex: 1 1 200px;
    min-width: 0;
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-title)/1.1 var(--font-brand);
  }
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 6px 0 0;
  }
  .goal {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .gring {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border: 5px solid var(--accent);
    border-radius: 50%;
    font: 800 var(--fs-body) var(--font-brand);
  }
  .gt {
    line-height: 1.3;
  }
  .gt b {
    display: block;
  }
  .gt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hs {
    margin: 18px 0 0;
    color: var(--pc);
  }
  .hsub {
    color: var(--ink-3);
    font-weight: 500;
  }
  .core {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 959px) {
    .core {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .kh {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    font: 700 var(--fs-sub)/1.2 var(--font-body);
  }
  .kn {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--paper);
    font-size: var(--fs-small);
  }
  .tpls,
  .sounds,
  .quotes,
  .lks {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tpls li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .tpls li:first-child {
    border-top: 0;
  }
  .play {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--ok-soft);
    color: var(--accent);
    cursor: pointer;
  }
  .tn {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 44px;
    justify-content: center;
    color: var(--ink);
    text-decoration: none;
    line-height: 1.3;
  }
  .tn b {
    font-weight: 600;
  }
  .tn small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .none {
    color: var(--ink-3);
  }
  .links {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .links a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--accent);
  }
  .when {
    margin: 0 0 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lastrow {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 12px;
  }
  .ltime {
    font: 800 var(--fs-section)/1 var(--font-brand);
  }
  .lt {
    flex: 1;
    min-width: 0;
    margin: 0;
    line-height: 1.35;
  }
  .lt b {
    display: block;
  }
  .lt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .wide {
    width: 100%;
    min-height: 48px;
  }
  .bars {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 90px;
    margin: 8px 0;
  }
  .bars i {
    flex: 1;
    border-radius: 4px 4px 0 0;
    background: var(--accent);
  }
  .bars i.now {
    background: var(--accent-soft);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint + .btn {
    margin-top: 12px;
  }
  .cap {
    margin: 0 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .addrow + .cap,
  .favs + .cap,
  .chal + .cap {
    margin-top: 14px;
  }
  .favs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  @media (max-width: 959px) {
    .favs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 419px) {
    .favs {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .fav {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    min-width: 0;
    padding: 4px 4px 4px 0;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .fb {
    flex: 1;
    min-width: 0;
    min-height: 56px;
    padding: 8px 12px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    line-height: 1.3;
    cursor: pointer;
  }
  .fb b {
    display: block;
    font-weight: 600;
  }
  .fb small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .chal {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 12px 0 0;
    padding: 6px 6px 6px 14px;
    border-radius: var(--radius-card);
    background: var(--ok-soft);
    color: var(--ink);
  }
  .chal span {
    flex: 1 1 200px;
  }
  .chal a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--accent);
    font-size: var(--fs-small);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 14px;
    border: 1.5px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small)/1.3 var(--font-body);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--ok-soft);
  }
  .chip.still {
    cursor: default;
    padding-top: 0;
    padding-bottom: 0;
    padding-right: 0;
  }
  .cnt {
    color: var(--ink-3);
  }
  .cx {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .addrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .addrow .grow {
    flex: 1 1 180px;
    min-width: 0;
  }
  .addrow .inp,
  .addrow .btn {
    min-height: 44px;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
  .ib.sm {
    border-color: transparent;
    background: none;
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    gap: 0 20px;
  }
  @media (max-width: 959px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(14, minmax(0, 1fr));
    gap: 4px;
    max-width: 420px;
  }
  .grid i {
    aspect-ratio: 1;
    border-radius: 4px;
    background: var(--paper-2);
  }
  .grid i.on {
    background: var(--accent);
  }
  .grid + .hint {
    margin-top: 10px;
  }
  .fitbit {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sounds {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sounds li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px 0 0;
    border: 1.5px solid var(--line);
    border-radius: 10px;
  }
  .sounds li.on {
    border-color: var(--accent);
  }
  .sp {
    flex: 1;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 10px;
    min-width: 0;
    min-height: 48px;
    padding: 4px 12px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .sp b {
    font-weight: 600;
  }
  .hear {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .sounds + .hint {
    margin-top: 10px;
  }
  .quotes li {
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .quotes li:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .quotes.sugg {
    margin-top: 10px;
    padding: 4px 12px;
    border: 1px dashed var(--l2);
    border-radius: var(--radius-card);
    background: var(--warn-soft);
  }
  .quotes.sugg li:first-child {
    padding-top: 10px;
  }
  blockquote {
    margin: 0;
    font-style: italic;
    font-size: var(--fs-sub);
    line-height: 1.4;
  }
  .src {
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .qa {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .orig {
    margin: 6px 0 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lnk {
    position: relative;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .lnk::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 44px;
    transform: translateY(-50%);
  }
  .addl {
    min-height: 44px;
    margin-top: 10px;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }
  .form .btn {
    align-self: flex-start;
    min-height: 44px;
  }
  .bad {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .lks li {
    display: flex;
    align-items: center;
    gap: 6px;
    border-top: 1px solid var(--line);
  }
  .lks li:first-child {
    border-top: 0;
  }
  .la {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    min-height: 52px;
    color: var(--ink);
    text-decoration: none;
  }
  .la span {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .la b {
    display: block;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .la small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
