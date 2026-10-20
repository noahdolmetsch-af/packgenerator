<script>
  /**
   * v0.86.0 «Meditation einfach» (mockup C, Noah «1-5 a» 11.10.2026): «Mehr» of the meditation page,
   * #/flow/act/meditation/mehr. Everything rare in one place, folded: one 60 px row per topic (symbol,
   * title, one line), all closed at first. Klang (the sound in between, «anhören»), Arten («Heute
   * vielleicht», the challenge, all kinds, own kinds), Orte und Dinge, Zitate (original, «weglassen», own
   * ones), Links (own only), Alle Sterne (the milestones 6 + 4), Vorlagen verwalten. These are the blocks of
   * the old long page (hobby pages 2), moved here: nothing lost, only folded away.
   * v0.93.0: …/mehr?open=stars opens «Alle Sterne» (the milestone row of «Neue Sitzung»).
   * v0.105.0 Design-Refresh P8 «Aktiv» (A13): the crumb, «Mehr zur Meditation», one white card of folds
   * (Vorlagen first, the title with its quiet line, a triangle); at the side «Heute vielleicht» as a
   * suggestion tile (the minutes challenge and the kinds suggested today, any of them as a challenge).
   */
  import { Play, X, Plus, Lightbulb, Link as LinkIcon, ExternalLink, Check, Zap } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import SuggestTile from '../../lib/ui/SuggestTile.svelte';
  import ChallengeSheet from '../../lib/ui/ChallengeSheet.svelte';
  import { CHALLENGES_KEY, suggestKey, toggleTick, tickedToday, challengesOf, newChallenge, countOf, activeFor, stepChallenges, freshDone, monthEnd } from '../../lib/challenge.js';
  import MsBlock from '../../lib/flow/hobby/MsBlock.svelte';
  import Sugg from '../../lib/flow/hobby/Sugg.svelte';
  import { db } from '../../lib/db.js';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { msContext, actMilestones, evaluate, isOff, newStars } from '../../lib/flowms.js';
  import { artsOf, addArt, toggleFavArt, bowlWords, challenge, PLACES, THINGS, choiceList, placeCounts, linkOf, linksOf, ARTS_KEY, PLACES_KEY, THINGS_KEY, LINKS_KEY, SOUND_KEY, CHALLENGE_KEY } from '../../lib/flowmed.js';
  import { SOUNDS, soundOk, playSound, canVibrate, vibrate, DEFAULT_SOUND, DEFAULT_END_SOUND } from '../../lib/flowsounds.js';
  import { quotesOf, QUOTES_KEY, quoteSet, quoteOfDay } from '../../lib/flowquotes.js';
  import { saveStars, putSetting } from '../../lib/flowdb.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { beginMed, tplStart, medTemplates, lastStart } from '../../lib/flow/hobby/medstart.js';
  import { whenShort, tplName, artName } from '../../lib/flow/hobby/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn, lang } from '../../lib/i18n.svelte.js';

  let { actId = 'meditation', params = new URLSearchParams() } = $props();
  const today = localDay();
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    seedMed(data, actId);
  });
  const act = $derived(data?.acts.find((a) => a.id === actId) ?? null);
  const base = $derived(`#/flow/act/${encodeURIComponent(actId)}`);
  const start = (x) => beginMed(actId, data, x);

  /* milestones of this page (6 + 4); the stars reached are kept for ever */
  const ctx = $derived(data ? msContext({ acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays }) : null);
  const stored = $derived(new Map((data?.stars ?? []).map((s) => [s.id, s.day])));
  const ms = $derived(act && ctx ? actMilestones(act).map((m) => ({ ...evaluate(m, ctx, stored, data.tune), off: isOff(m, data.tune) })) : []);
  $effect(() => {
    const fresh = newStars(ms, stored);
    if (fresh.length) saveStars(db, fresh);
  });
  const msShown = $derived(ms.filter((r) => !r.off));
  const starsGot = $derived(msShown.reduce((a, r) => a + r.reached.length, 0));

  /* templates */
  const tpls = $derived(medTemplates(data));
  const ls = $derived(data ? lastStart(data, actId) : null);
  const modeLine = (bowl) => {
    const w = bowlWords(bowl);
    return t(w.key, w.vars);
  };

  /* kinds (H13a) and the challenge (H12a) */
  const arts = $derived(artsOf(data?.arts));
  const artOf = (id) => arts.all.find((a) => a.id === id) ?? null;
  const favArts = $derived(arts.favs.map(artOf).filter(Boolean));
  const between = $derived(soundOk(data?.sound, DEFAULT_SOUND));
  const tplForArt = (id) => tpls.find((x) => x.art === id) ?? null;
  function startArt(a) {
    const x = tplForArt(a.id);
    if (x) return start(tplStart(x));
    start({ minutes: a.minutes ?? 20, bowl: { mode: 'none' }, sound: between, endSound: DEFAULT_END_SOUND, art: a.id });
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

  /* sounds */
  const setSound = (id) => putSetting(db, SOUND_KEY, id);
  const hear = (id) => (id === 'vibrate' ? vibrate() : playSound(id, 0, 0.4));
  const soundName = (id) => t(SOUNDS.find((s) => s.id === id)?.name ?? 'Singing bowl deep');

  /* quotes (H6a, H28a) */
  const quotes = $derived(quotesOf(data?.quotes, lang.v === 'de'));
  const todayQuote = $derived(quoteOfDay(quotes.shown, today));
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
  const places = $derived(choiceList(data?.places, PLACES));
  const placeName = (p) => (!p ? '' : p.own ? p.name : t(p.name));
  const curPlace = $derived(places.list.find((p) => p.id === places.cur) ?? null);
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
  const thingName = (x) => (x.own ? x.name : t(x.name));
  const dropThing = (x) => putSetting(db, THINGS_KEY, x.own ? { own: things.own.filter((n) => `own:${n}` !== x.id), hidden: things.hidden } : { own: things.own, hidden: [...things.hidden, x.id] });
  let newThing = $state('');
  async function addThing(e) {
    e.preventDefault();
    const nm = newThing.trim();
    if (!nm) return;
    await putSetting(db, THINGS_KEY, { own: [...new Set([...things.own, nm])], hidden: things.hidden });
    newThing = '';
  }

  /* the one-line summaries of the folded rows */
  const sums = $derived({
    sound: `${soundName(between)} · ${tn(SOUNDS.length, '{n} sound', '{n} sounds')}`,
    kinds: t('{n} kinds, {m} suggested today', { n: arts.all.length, m: favArts.length }),
    places: [curPlace ? placeName(curPlace) : t('no place chosen'), things.list.slice(0, 3).map(thingName).join(', ')].filter(Boolean).join(' · '),
    quotes: [tn(quotes.shown.length, '{n} quote', '{n} quotes'), todayQuote ? t('today {name}', { name: todayQuote.own ? t('own quote') : todayQuote.author }) : ''].filter(Boolean).join(' · '),
    links: links.length ? tn(links.length, '{n} link', '{n} links') : t('none yet'),
    stars: `${tn(msShown.length, '{n} milestone', '{n} milestones')} · ${t('{n} reached', { n: starsGot })}`,
    tpls: `${tn(tpls.length, '{n} template', '{n} templates')} · ${t('set the intervals')}`,
  });

  /* v0.105.0 Design-Refresh P8 «Aktiv» (A13): «Heute vielleicht» as a suggestion tile (Noah «d1-d5»: any
     suggestion can become a challenge). The options: the minutes challenge, the kinds suggested today and
     own ones; ticking counts here only (the session itself is logged by the timer). */
  const SG_KEY = suggestKey('med');
  const sgQ = liveQuery(async () => {
    const [s, c] = await Promise.all([db.settings.get(SG_KEY), db.settings.get(CHALLENGES_KEY)]);
    return { s: s?.value ?? null, list: challengesOf(c?.value) };
  });
  const sgOf = (v = {}) => ({ pick: v.pick ?? null, own: Array.isArray(v.own) ? v.own : [], ticks: v.ticks && typeof v.ticks === 'object' ? v.ticks : {} });
  const sg = $derived(sgOf($sgQ?.s ?? {}));
  const chName = $derived(ch ? t('{n} min', { n: ch.target }) : null);
  const sgKeep = $derived([sg.pick, ...($sgQ?.list ?? []).filter((c) => c.area === 'med' && !c.stopped && !c.doneOn).map((c) => c.what)].filter(Boolean));
  const sgOptions = $derived([...new Set([...(chName ? [chName] : []), ...favArts.map(artName), ...sg.own, ...sgKeep])]);
  const sgPick = $derived(sgOptions.includes(sg.pick) ? sg.pick : (sgOptions[0] ?? null));
  const sgArt = $derived(favArts.find((a) => artName(a) === sgPick) ?? null);
  const sgDone = $derived(!!sgPick && tickedToday(sg, sgPick, today));
  const clist = $derived($sgQ?.list ?? []);
  const running = $derived(sgPick ? activeFor(clist, sgPick, today, 'med') : null);
  const chRun = $derived(running ? { ...running, n: countOf(running, sg) } : null);
  const reached = $derived(freshDone(clist, today).find((c) => c.area === 'med' && c.what === sgPick) ?? null);
  let sheet = $state(false);
  const saveSg = (next) => putSetting(db, SG_KEY, next);
  function addOwnSg(name) {
    const n = name.trim().slice(0, 40);
    if (n) saveSg({ ...sg, own: [...new Set([...sg.own, n])].slice(0, 8), pick: n });
  }
  // 0.133.0 (fix 14.10.): one tap at a time, toggled on the saved record (the live query lags behind,
  // so a quick double tap ticked twice and the next tap could not take it back)
  let sgTicking = false;
  async function tickSg() {
    if (sgTicking) return;
    sgTicking = true;
    try {
      const cur = sgOf((await db.settings.get(SG_KEY))?.value ?? {});
      const next = { ...toggleTick(cur, sgPick, today), pick: sgPick };
      await saveSg(next);
      const r = stepChallenges(clist, { med: next }, today);
      if (r.reached.length) await putSetting(db, CHALLENGES_KEY, r.list);
    } finally {
      sgTicking = false;
    }
  }
  async function saveChallenge({ times, until }) {
    const next = running ? clist.map((c) => (c.id === running.id ? { ...c, times, until } : c)) : [...clist, newChallenge({ area: 'med', what: sgPick, times, until, today })];
    await putSetting(db, CHALLENGES_KEY, stepChallenges(next, { med: sg }, today).list);
  }
  const stopChallenge = () => putSetting(db, CHALLENGES_KEY, clist.map((c) => (c.id === running?.id ? { ...c, stopped: true } : c)));
</script>

<div class="mm">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Analysis|place') }, { href: base, label: act ? actName(act) : t('Meditation') }]} here={t('More|meditation')} />
    <h1 class="h1" tabindex="-1" data-page-title>{!act || actId === 'meditation' ? t('More about meditation') : `${actName(act)} · ${t('More|meditation')}`}</h1>
    <p class="sub">{t('Everything rare in one place · closed, the page stays calm')}</p>
  </header>

  {#if data && act}
   <div class="lay">
    <div class="card folds">
      {#snippet head(title, sum)}
        <summary>
          <span class="rt"><b>{title}</b> <small>{sum}</small></span>
          <span class="tri" aria-hidden="true"></span>
        </summary>
      {/snippet}

      <details data-fold="templates">
        {@render head(t('Templates'), sums.tpls)}
        <div class="in">
          <ul class="tpls card">
            {#each tpls as x (x.id)}
              <li data-tpl={x.id}>
                <button type="button" class="play" aria-label={t('Start {name}', { name: tplName(x) })} onclick={() => start(tplStart(x))}><Zap size={18} aria-hidden="true" /></button>
                <a class="tn" href="{base}/timer?tpl={encodeURIComponent(x.id)}">
                  <b>{tplName(x)}</b>
                  <small class="num">{t('{n} min', { n: x.minutes })} · {modeLine(x.bowl)}{#if x.art && artOf(x.art)}{' · '}{artName(artOf(x.art))}{/if}</small>
                  <small>{x.usedAt ? t('last {when}', { when: whenShort(x.usedAt) }) : t('not used yet')}</small>
                </a>
              </li>
            {:else}
              <li class="none">{t('No template yet.')}</li>
            {/each}
          </ul>
          <p class="links">
            <a href="{base}/timer?new=1">{t('new template')}</a>
            {#if ls}{' · '}<a href="{base}/timer?last=1">{t('adjust last time first')}</a>{/if}
          </p>
        </div>
      </details>

      <details data-fold="sound">
        {@render head(t('Sounds'), sums.sound)}
        <div class="in">
          <p class="cap">{t('The sound in between; start and end: {name}', { name: t('Singing bowl deep') })}</p>
          <ul class="sounds">
            {#each SOUNDS as s (s.id)}
              <li class:on={between === s.id} data-sound={s.id}>
                <button type="button" class="sp" aria-pressed={between === s.id} onclick={() => setSound(s.id)}><span class="dot" aria-hidden="true"></span><b>{t(s.name)}</b>{#if s.sugg}<Sugg />{/if}</button>
                <button type="button" class="hear" onclick={() => hear(s.id)}><Play size={14} aria-hidden="true" />{t('listen')}</button>
              </li>
            {/each}
          </ul>
          {#if !canVibrate()}<p class="hint">{t('Vibration only works on Android; an iPhone cannot vibrate from a web page.')}</p>{/if}
        </div>
      </details>

      <details data-fold="kinds">
        {@render head(t('Kinds'), sums.kinds)}
        <div class="in">
          <p class="cap">{t('Maybe today')}</p>
          <div class="favs">
            {#each favArts as a (a.id)}
              {@const x = tplForArt(a.id)}
              <div class="fav" data-art={a.id}>
                <button type="button" class="fb" onclick={() => startArt(a)}>
                  <b>{artName(a)}</b>
                  <small>{x ? t('Template «{name}»', { name: tplName(x) }) : t('{n} min · only start and end', { n: a.minutes ?? 20 })}</small>
                </button>
                <button type="button" class="ib" aria-label={t('Remove {name} from today', { name: artName(a) })} onclick={() => saveArts(toggleFavArt(data.arts, a.id))}><X size={16} aria-hidden="true" /></button>
              </div>
            {/each}
          </div>
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
        </div>
      </details>

      <details data-fold="places">
        {@render head(t('Places and things'), sums.places)}
        <div class="in">
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
              <span class="chip still">{thingName(x)}<button type="button" class="cx" aria-label={t('Remove {name}', { name: thingName(x) })} onclick={() => dropThing(x)}><X size={14} aria-hidden="true" /></button></span>
            {/each}
          </div>
          <form class="addrow" onsubmit={addThing}>
            <label class="grow"><span class="sr">{t('Own thing')}</span><input class="inp" bind:value={newThing} maxlength="40" placeholder={t('Own thing')} /></label>
            <button type="submit" class="btn">{t('+ Thing')}</button>
          </form>
        </div>
      </details>

      <details data-fold="quotes">
        {@render head(t('Quotes'), sums.quotes)}
        <div class="in">
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
        </div>
      </details>

      <details data-fold="links">
        {@render head(t('Links'), sums.links)}
        <div class="in">
          {#if links.length}
            <ul class="lks">
              {#each links as l (l.id)}
                <li>
                  <a class="la" href={l.url} target="_blank" rel="noopener noreferrer"><LinkIcon size={16} aria-hidden="true" /><span><b>{l.title}</b><small>{new URL(l.url).hostname}</small></span><ExternalLink size={16} aria-hidden="true" /></a>
                  <button type="button" class="ib" aria-label={t('Remove {name}', { name: l.title })} onclick={() => removeLink(l)}><X size={16} aria-hidden="true" /></button>
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
        </div>
      </details>

      <details data-fold="stars" open={params.get('open') === 'stars'}>
        {@render head(t('All stars'), sums.stars)}
        <div class="in">
          <MsBlock list={msShown} all={msShown} {today} compact tuneHref="#/flow/milestones?act={encodeURIComponent(actId)}&tune=1" />
        </div>
      </details>
    </div>

    <aside class="col">
      {#if sgOptions.length}
        <Sec id="maybe-h" title={t('Maybe today')}>
          <SuggestTile icon={Lightbulb} id="sg-med" title={sgPick ?? ''} sub={ch && sgPick === chName ? t('Can you do {n} minutes today? Your longest so far: {best}.', { n: ch.target, best: ch.best }) : ''} options={sgOptions} pick={sgPick} done={sgDone} challenge={chRun} {reached} onpick={(o) => saveSg({ ...sg, pick: o })} onadd={addOwnSg} ontick={tickSg} onchallenge={() => (sheet = true)} />
          <p class="go">
            {#if sgArt}
              <button type="button" class="btn" onclick={() => startArt(sgArt)}>{t('Maybe today|start')}</button>
            {:else if ch && sgPick === chName}
              <a class="btn" href="{base}/timer?min={ch.target}" data-challenge={ch.target}>{t('Maybe today|start')}</a>
            {/if}
            {#if ch && sgPick === chName}<button type="button" class="btn" onclick={hideChallenge}>{t('Not today')}</button>{/if}
          </p>
        </Sec>
      {/if}
    </aside>
   </div>
  {/if}
</div>

<ChallengeSheet bind:open={sheet} what={sgPick ?? ''} times={running?.times ?? 10} until={running?.until ?? monthEnd(today)} min={today} running={!!running} onsave={saveChallenge} onstop={stopChallenge} />

<style>
  /* v0.105.0 Design-Refresh P8 «Aktiv» (A13): two columns, one white card of folds, the suggestion at the side */
  .mm {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-page)/1.1 var(--font-brand);
  }
  .sub {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    min-width: 0;
  }
  .folds {
    padding: 0 var(--sp-4);
    min-width: 0;
  }
  details + details {
    border-top: 1px solid var(--line);
  }
  summary {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 52px;
    padding: var(--sp-2) 0;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .tri {
    flex: none;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 7px solid var(--ink-2);
    transition: transform 0.15s;
  }
  details[open] > summary .tri {
    transform: rotate(90deg);
  }
  .rt {
    flex: 1;
    min-width: 0;
    line-height: 1.4;
  }
  .rt b {
    font-weight: 600;
  }
  .rt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .go {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin: var(--sp-2) 0 0;
  }
  .go:empty {
    display: none;
  }
  .go .btn {
    min-height: 44px;
  }
  .in {
    padding: 0 0 var(--sp-4);
    min-width: 0;
  }
  .hint {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .cap {
    margin: 0 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .addrow + .cap,
  .favs + .cap {
    margin-top: 14px;
  }
  .sounds,
  .quotes,
  .lks,
  .tpls {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sounds li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sp {
    flex: 1;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 10px;
    min-width: 0;
    min-height: 50px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .sp b {
    font-weight: 500;
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border: 1.5px solid var(--ink-2);
    border-radius: 50%;
  }
  .sounds li.on .dot {
    border-color: var(--ink);
    background: var(--ink);
  }
  .sounds li.on .sp b {
    font-weight: 700;
  }
  .hear {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .favs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
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
  .cx,
  .ib {
    flex: none;
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
  .tpls.card {
    padding: 0 var(--sp-3);
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
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
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
</style>
