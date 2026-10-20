<script>
  /**
   * v0.110.0 Design-Refresh P10 (I11, I11c, I11d; Noah 12.10.2026 «Runde 20 freigegeben»): Ich › Was ist neu
   * (#/me/news). On top the newest version as a card (name, one sentence, points, «Try it», «How to test
   * it»); below every function one by one, sortable by newest, name, category, place, your top 10 and
   * the most important 10, with a search; then all versions by month. Beside it: the message after an
   * update (switch), since your last visit, never tried, how to test this version, planned next.
   * #/me/news?all&sort=<key> is the whole list (I11c/I11d) with the other sorts beside it.
   * The counts of «Your top 10» live only on this device (wasneuStore.js); nothing here is mandatory.
   * v0.118.0 «Was ist neu 2» (mockup W2, Noah 13.10.2026 «w1-w3 freigeben», answers 2a 4a): every version in
   * its own words (know/VersionNews.svelte): the newest as the card on top, then one row «All functions»
   * to the whole list (unchanged, #/me/news?all), then all versions open, grouped by month, as cards.
   * SL1/SL4 «Scrollen und Listen» (Noah 14.10.2026 «SL1–SL4 freigegeben», answers «alle a»): the versions
   * by day (the five newest days each a group, older days one group), only the newest group open, a group
   * shows five rows and «Show n more», a row opens to its points; a search and «New for you» stay on top
   * with the group you are in; a jump bar (phone: chips, computer: beside the page); «Back to top».
   * 0.163.0 «Handy kurz» (Durchklick 2, Noah 15.10.2026 «freigabe», answer 1 «wo sinnvoll»): on a phone the
   * side parts (message, since your visit, never tried, how to test, planned next) are one closed line each;
   * «How to test it» opens its line. A computer keeps them open.
   * Impeccable Runde 2: every group head names its versions too («Yesterday, 17 Oct · 0.130–0.136 · 12 updates»),
   * so a version is found by its number; the grouping by day (SL1, approved) stays.
   */
  import { liveQuery } from 'dexie';
  import { tick as settled } from 'svelte';
  import { phone } from '../lib/media.svelte.js';
  import { WHATS_NEW, shortVersion, compareVersions, itemsOf } from '../lib/whatsnew.js';
  import { FEATURES, FEATURE_GROUPS, PAGE_GROUPS } from '../lib/features.js';
  import { isUsed } from '../lib/tips.js';
  import { featureData, usedOf } from '../lib/know/featureData.js';
  import { goFeature } from '../lib/know/featureRun.js';
  import { SORTS, sortKey, rowsOf, sortRows, searchRows, newSince, neverTried, messageOn, BANNER_DAYS, PLANNED, LIST_ROWS, NEWS_HREF } from '../lib/know/wasneu.js';
  import { readUses, readUpdate, writeUpdate, readMute, writeMute, readTested, writeTested } from '../lib/know/wasneuStore.js';
  import { nextTrip } from '../lib/debrief.js';
  import { sortBikes } from '../lib/bikes.js';
  import { openData } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num, locale } from '../lib/i18n.svelte.js';
  import { Check, ChevronRight, ChevronDown, ChevronUp, Compass, Backpack, BookOpen, Bike, Leaf, Save, Search, Star, Lightbulb, Activity, Route, ListOrdered, Tags, MapPin, ListFilter } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import TipButton from '../lib/know/TipButton.svelte';
  import VersionNews from '../lib/know/VersionNews.svelte';
  import PlaySheet from '../lib/testdata/PlaySheet.svelte';
  import ListBar from '../lib/list/ListBar.svelte';
  import ListGroup from '../lib/list/ListGroup.svelte';
  import ListNav from '../lib/list/ListNav.svelte';
  import TopButton from '../lib/list/TopButton.svelte';
  import TipWeek from '../lib/clear/TipWeek.svelte';
  import { byDay } from '../lib/list/listen.js';
  import '../lib/bikes/velo-dlg.css';
  import '../lib/ich/ich.css';

  const GROUP_ICON = { compass: Compass, backpack: Backpack, book: BookOpen, bike: Bike, leaf: Leaf, save: Save };
  const GROUP = Object.fromEntries(FEATURE_GROUPS.map((g) => [g.key, g]));
  const PLACE = Object.fromEntries(PAGE_GROUPS.map((g) => [g.key, g]));
  const SORT_ICON = { new: Star, name: BookOpen, group: Backpack, place: Route, top: Activity, best: Lightbulb };
  const PLAN_ICON = { route: Route, book: BookOpen, star: Star };
  const SORT_ROWS = { new: ListOrdered, name: BookOpen, group: Tags, place: MapPin };

  // the address: #/me/news (the page) or #/me/news?all&sort=top (the whole list)
  const query = new URLSearchParams((typeof location !== 'undefined' ? location.hash : '').split('?')[1] ?? '');
  const all = query.has('all');
  let by = $state(sortKey(query.get('sort')));
  let q = $state('');

  const newest = WHATS_NEW[0];
  const current = newest.version;
  const dataQ = liveQuery(featureData);
  const d = $derived($dataQ);
  const usedSet = $derived.by(() => {
    if (!d) return new Set();
    const u = usedOf(d);
    return new Set(FEATURES.filter((f) => isUsed(d.tips, f.id, u)).map((f) => f.id));
  });
  let uses = $state(readUses());
  $effect(() => {
    const again = () => (uses = readUses());
    window.addEventListener('pg:uses', again);
    window.addEventListener('storage', again);
    return () => {
      window.removeEventListener('pg:uses', again);
      window.removeEventListener('storage', again);
    };
  });
  const rows = $derived(rowsOf(usedSet, uses, current));
  const sorted = $derived(sortRows(rows, by, t));
  const found = $derived(searchRows(sorted, q, t));
  const ranked = $derived(by === 'top' || by === 'best');
  // the page shows 10 rows and «All n functions ›»; the whole list, a ranking or a search shows all
  const shown = $derived(all || ranked || q.trim() ? found : found.slice(0, LIST_ROWS));
  const maxN = $derived(Math.max(1, ...sorted.map((r) => r.n)));
  const third = $derived(by === 'place' || by === 'best' ? 'place' : 'since');
  const next = $derived(d ? nextTrip(d.trips, localDay()) : null);
  const bikeId = $derived(d ? (sortBikes(d.bikes)[0]?.id ?? null) : null);
  const sortOf = (k) => SORTS.find((s) => s.key === k);

  // the side column
  let update = $state(readUpdate());
  let mute = $state(readMute());
  // v0.127.0 A-U1: the banner on Today, for BANNER_DAYS days; switched on again it starts its days anew
  const msgOn = $derived(messageOn({ update, mute, current, today: localDay() }));
  function setMsg(on) {
    if (on) {
      writeMute(null);
      if (update?.v !== current || !messageOn({ update, current, today: localDay() })) writeUpdate({ v: current, from: update?.from ?? null, at: localDay() });
    } else writeMute(current);
    update = readUpdate();
    mute = readMute();
  }
  const since = $derived(update?.v === current && update.from ? newSince(rows, update.from) : null);
  const never = $derived(d && !d.demo ? neverTried(rows) : []);
  let play = $state(null);
  let tested = $state(readTested(current));
  function tick(i, on) {
    tested = on ? [...new Set([...tested, i])].sort() : tested.filter((x) => x !== i);
    writeTested(current, tested);
  }
  let testEl = $state();
  // 0.163.0: the closed lines of the side on a phone
  let sideOpen = $state({ msg: false, since: false, never: false, test: false, plan: false });
  async function showTest() {
    sideOpen.test = true;
    await settled();
    testEl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    testEl?.querySelector('input')?.focus({ preventScroll: true });
  }

  const day = (iso, o = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), o);

  // SL1: the versions by day (the newest is the card on top), a search, «New for you», one row opens
  let vq = $state('');
  let only = $state('all');
  let openV = $state(null);
  let active = $state(null);
  const today = localDay();
  const forYou = $derived(update?.from ? WHATS_NEW.filter((e) => compareVersions(e.version, update.from) > 0 && compareVersions(e.version, current) <= 0) : []);
  const hayOf = (e) => [e.version, e.title, t(e.title), e.lead ?? '', e.lead ? t(e.lead) : '', ...itemsOf(e).flatMap((p) => [p.text, t(p.text)])].join(' ').toLowerCase();
  const verFound = $derived.by(() => {
    const words = vq.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const pool = only === 'you' ? forYou : WHATS_NEW.slice(1);
    return words.length ? pool.filter((e) => ((h) => words.every((w) => h.includes(w)))(hayOf(e))) : pool;
  });
  const searching = $derived(!!vq.trim() || only !== 'all');
  const days = $derived(byDay(verFound, today));
  const dayLabel = (g) => {
    if (g.older) return g.from === g.to ? t('Older: {d}', { d: day(g.to, { day: 'numeric', month: 'short' }) }) : t('Older: {from} – {to}', { from: day(g.from, { day: 'numeric', month: 'short' }), to: day(g.to, { day: 'numeric', month: 'short' }) });
    const d = day(g.to, { day: 'numeric', month: 'short' });
    if (g.ago === 0) return t('Today, {d}', { d });
    if (g.ago === 1) return t('Yesterday, {d}', { d });
    return day(g.to, { weekday: 'long', day: 'numeric', month: 'short' });
  };
  const chipLabel = (g) => (g.older ? t('Older|group') : g.ago === 0 ? t('Today') : g.ago === 1 ? t('Yesterday') : day(g.to, { day: 'numeric', month: 'short' }));
  const nUp = (n) => tn(n, '{n} update', '{n} updates');
  // Impeccable Runde 2: the versions of a group, oldest to newest («0.130–0.136»; one version alone)
  const verRange = (g) => {
    const lo = shortVersion(g.entries.at(-1).version);
    const hi = shortVersion(g.entries[0].version);
    return lo === hi ? hi : `${lo}–${hi}`;
  };
  // the newest day is open (answer: only the newest open); a search opens every group it found
  let opened = $state({});
  const isOpen = (g, i) => opened[g.key] ?? (searching || i === 0);
  const jumps = $derived(days.map((g) => ({ id: g.key, label: chipLabel(g), n: g.entries.length })));
  const cur = $derived(days.find((g) => g.key === active));
  function jump(id) {
    opened = { ...opened, [id]: true };
    requestAnimationFrame(() => document.getElementById(`g-${id}`)?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  }
  const tryP = (e) => e.points.find((p) => p.href || p.action) ?? null;
  function tryIt(ev) {
    if (tryP(newest)?.action !== 'data') return;
    ev.preventDefault();
    openData();
  }
</script>

{#snippet usedCell(r)}
  {#if by === 'top'}
    <span class="wn-bar" aria-hidden="true"><i style="width: {Math.round((r.n / maxN) * 100)}%"></i></span><span class="num wn-n">{r.n}×</span>
  {:else if r.state === 'new'}
    <span class="pill wn-new">{t('New|news')}</span>
  {:else if r.state === 'never'}
    <span class="pill warn wn-never">{t('Never|used')}</span>
  {:else}
    <span class="wn-used"><Check size={14} strokeWidth={3} aria-hidden="true" />{#if r.n}<span class="num">{r.n}×</span>{:else}<span class="sr">{t('Used|tips')}</span>{/if}</span>
  {/if}
{/snippet}

{#snippet takeMe(r)}
  {#if r.tip}
    <TipButton id={r.tip} {next} cls="btn sm wn-go">{t('Go|news')}<ChevronRight size={16} aria-hidden="true" /></TipButton>
  {:else}
    <button type="button" class="btn sm wn-go" onclick={() => goFeature(r, { bikeId })}>{t('Go|news')}<ChevronRight size={16} aria-hidden="true" /></button>
  {/if}
{/snippet}


<div class="ich-page wn">
  <VeloHead
    crumbs={all ? [{ label: t('Me|place'), href: '#/me' }, { label: t('What is new'), href: NEWS_HREF }] : [{ label: t('Me|place'), href: '#/me' }]}
    here={all ? t('All functions') : ''}
    title={t('What is new')}
    sub={t('{n} updates since 0.1 · each with its own text · last {date}', { n: WHATS_NEW.length, date: day(newest.date) })}
  />
  <div class="ich-cols">
    <div class="ich-main">
      {#if !all}
        <!-- I11 / W2: the newest version as a card, in its own words -->
        <section class="wn-top" data-newest={current}>
          <VersionNews e={newest} card top level={2} id="wn-top-h">
            {#snippet extra()}
              <div class="ich-acts wn-topacts">
                <a class="btn k hi" href={tryP(newest)?.href ?? NEWS_HREF} onclick={tryIt}>{t('Try it')}<ChevronRight size={16} aria-hidden="true" /></a>
                {#if newest.test?.length}<button type="button" class="btn k" onclick={showTest}>{t('How to test it')}</button>{/if}
              </div>
            {/snippet}
          </VersionNews>
        </section>

        <!-- W2: the whole list of functions behind one row (the list itself is unchanged) -->
        <a class="card ich-list wn-allrow" href="{NEWS_HREF}?all&sort=new">
          <span class="ich-row">
            <span class="ich-ib"><ListFilter size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{t('All functions')}</b><small>{t('{n} · sortable, with a search', { n: FEATURES.length })}</small></span>
            <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
          </span>
        </a>
      {/if}

      <!-- I11 / I11c / I11d: every function one by one (v0.118.0: on its own page, #/me/news?all) -->
      {#if all}
      <section class="ich-sec" aria-labelledby="wn-all-h">
        <div class="ich-h"><div>
          <h2 id="wn-all-h">{t('All functions')}</h2>
          <p class="ich-hs">{all || ranked ? t('sorted: {sort}, {note}', { sort: t(sortOf(by).label), note: t(sortOf(by).note, { n: FEATURES.length }) }) : t('every one, sortable')}</p>
        </div></div>
        <div class="wn-sort" role="group" aria-labelledby="wn-sort-l">
          <span id="wn-sort-l" class="wn-sl">{t('Sort')}</span>
          {#each SORTS as s (s.key)}
            <button type="button" class="vd-chip wn-chip" aria-pressed={by === s.key} onclick={() => (by = s.key)}>{t(s.label)}</button>
          {/each}
        </div>
        <label class="wn-find">
          <Search size={18} aria-hidden="true" />
          <input type="search" bind:value={q} placeholder={t('Find a function')} aria-label={t('Find a function')} autocomplete="off" />
        </label>
        <div class="card wn-list" data-sort={by}>
          <div class="wn-row wn-head" aria-hidden="true">
            <span>{t('Function')}</span><span>{t('Category')}</span><span>{third === 'place' ? t('Place|sort') : t('Since|version')}</span><span>{t('Used|count')}</span><span></span>
          </div>
          <ol class="wn-rows" aria-labelledby="wn-all-h">
            {#each shown as r, i (r.id)}
              <li class="wn-row" data-feature={r.id} data-state={r.state}>
                <span class="wn-fn">
                  {#if ranked}<span class="wn-rank num" aria-hidden="true">{i + 1}</span>{/if}
                  <span class="wn-ft"><b>{t(r.title)}</b>{#if by !== 'top'}<small>{t(r.text)}</small>{/if}</span>
                </span>
                <span class="wn-cat">{t(GROUP[r.group].label)}</span>
                <span class="wn-3 num">{third === 'place' ? t(PLACE[r.place].label) : shortVersion(r.since)}</span>
                <span class="wn-use">{@render usedCell(r)}</span>
                <span class="wn-act">{@render takeMe(r)}</span>
              </li>
            {/each}
          </ol>
          {#if !shown.length}
            <p class="wn-none" role="status">{by === 'top' && !q.trim() ? t('Nothing counted yet: open a function with «Go», and it counts here.') : t('No function found for «{q}».', { q: q.trim() })}</p>
          {/if}
          {#if by === 'top'}
            <p class="wn-foot">{t('Counted only on this device, how often you open a function. Nothing leaves it.')}</p>
          {:else if by === 'best'}
            <p class="wn-foot">{t('Chosen once: what brings the most when packing, riding and caring. Beside it «Your top 10», which counts what you use.')}</p>
          {:else if !all && !q.trim()}
            <a class="wn-foot wn-more" href="{NEWS_HREF}?all&sort={by}">{t('All {n} functions', { n: FEATURES.length })}<ChevronRight size={16} aria-hidden="true" /></a>
          {/if}
        </div>
      </section>

      {/if}

      {#if !all}
        <!-- SL1 (answers 1a 4a): the versions by day, only the newest open, five rows and «Show n more» -->
        <section class="ich-sec wn-vers" aria-labelledby="wn-ver-h">
          <div class="ich-h"><div><h2 id="wn-ver-h">{t('All versions')}</h2><p class="ich-hs">{t('by day, the newest open')}</p></div></div>
          <!-- SL4 (answer 5a): the search and the group you are in stay on top -->
          <ListBar bind:active current={cur ? dayLabel(cur) : ''} count={cur ? nUp(cur.entries.length) : ''}>
            <label class="wn-find wn-vfind">
              <Search size={18} aria-hidden="true" />
              <input type="search" bind:value={vq} placeholder={t('Find an update')} aria-label={t('Find an update')} autocomplete="off" />
            </label>
            {#if forYou.length}
              <div class="wn-sort" role="group" aria-label={t('Show')}>
                <button type="button" class="vd-chip wn-chip" aria-pressed={only === 'all'} onclick={() => (only = 'all')}>{t('All')} <span class="num">{WHATS_NEW.length - 1}</span></button>
                <button type="button" class="vd-chip wn-chip" aria-pressed={only === 'you'} data-only="you" onclick={() => (only = 'you')}>{t('New for you')} <span class="num">{forYou.length}</span></button>
              </div>
            {/if}
          </ListBar>
          <!-- SL1 (answer 2a): the jump bar, on a phone as chips -->
          <div class="wn-jump-ph"><ListNav groups={jumps} {active} onjump={jump} /></div>
          <div class="wn-days">
            {#each days as g, i (g.key)}
              <ListGroup id={g.key} title={`${dayLabel(g)} · ${verRange(g)}`} count={nUp(g.entries.length)} peek={g.older ? t('back to the first version 0.1') : g.entries.slice(0, 3).map((e) => t(e.title)).join(' · ')} bind:open={() => isOpen(g, i), (v) => (opened = { ...opened, [g.key]: v })} rows={g.entries} more={(n) => t('Show {n} more|list', { n })}>
                {#snippet row(e)}
                  <button type="button" class="wn-vr" aria-expanded={openV === e.version} data-row={e.version} onclick={() => (openV = openV === e.version ? null : e.version)}>
                    <span class="wn-vb num">{shortVersion(e.version)}</span>
                    <span class="wn-vm"><b>{t(e.title)}</b>{#if e.lead}<small>{t(e.lead)}</small>{/if}</span>
                    {#if openV === e.version}<ChevronUp size={18} aria-hidden="true" />{:else}<ChevronDown size={18} aria-hidden="true" />{/if}
                  </button>
                  {#if openV === e.version}<div class="wn-vopen"><VersionNews {e} level={4} /></div>{/if}
                {/snippet}
              </ListGroup>
            {/each}
            {#if !days.length}<p class="wn-none" role="status">{t('No update found for «{q}».', { q: vq.trim() })}</p>{/if}
          </div>
          {#if !searching}<p class="wn-end"><Check size={16} aria-hidden="true" />{t('That is all: {n} updates on {d} days.', { n: WHATS_NEW.length, d: new Set(WHATS_NEW.map((e) => e.date)).size })}</p>{/if}
        </section>
        <TopButton />
      {/if}
    </div>

    <div class="ich-side">
      <!-- «Heute neu» A (Noah 20.10.2026 «5b»): the tip of the week lives here now, no longer on Heute -->
      <section class="ich-sec" data-tipweek-me><TipWeek /></section>
      {#if all}
        {#if by === 'best'}
          <!-- I11d: the two rankings -->
          <section class="ich-sec" aria-labelledby="wn-two-h">
            <div class="ich-h"><div><h2 id="wn-two-h">{t('Two rankings')}</h2></div></div>
            <ul class="card ich-list">
              <li><button type="button" class="ich-row" onclick={() => (by = 'top')}><span class="ich-ib"><Activity size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Your top 10')}</b><small>{t('what you use most, counted on this device')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></button></li>
              <li><div class="ich-row" aria-current="true"><span class="ich-ib"><Lightbulb size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Most important 10')}</b><small>{t('what brings the most, chosen once')}</small></span></div></li>
            </ul>
          </section>
        {:else}
          <!-- I11c: the other sorts -->
          <section class="ich-sec" aria-labelledby="wn-other-h">
            <div class="ich-h"><div><h2 id="wn-other-h">{t('Other sorts')}</h2></div></div>
            <ul class="card ich-list">
              {#each SORTS.filter((s) => s.key !== by) as s (s.key)}
                {@const Icon = SORT_ROWS[s.key] ?? SORT_ICON[s.key]}
                <li><button type="button" class="ich-row" data-sort-to={s.key} onclick={() => (by = s.key)}><span class="ich-ib"><Icon size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(s.label)}</b><small>{t(s.note, { n: FEATURES.length })}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></button></li>
              {/each}
            </ul>
          </section>
          <p class="ich-fine"><Lightbulb size={16} aria-hidden="true" /><span>{t('Each row leads with «Go» straight to its place in the app.')}</span></p>
        {/if}
      {:else}
        <!-- 0.163.0 «Handy kurz» (Noah 15.10.2026): on a phone the side parts are one closed line each (SL ListGroup);
             a computer keeps them open as before -->
        {#if phone.matches}
          <ListGroup id="wn-msg" title={t('Message after updates')} peek={msgOn ? t('Show the message after updates') : t('closed with × · with the next update it comes again')} bind:open={sideOpen.msg}>{@render msgBody()}</ListGroup>
          {#if since}<ListGroup id="wn-since" title={t('Since your last visit')} count={tn(since.length, '{n} new function since {v}', '{n} new functions since {v}', { v: shortVersion(update.from) })} bind:open={sideOpen.since}>{@render sinceBody()}</ListGroup>{/if}
          {#if never.length}<ListGroup id="wn-never" title={t('Never tried')} count={num(never.length)} peek={never.slice(0, 3).map((r) => t(r.title)).join(' · ')} bind:open={sideOpen.never}>{@render neverBody()}</ListGroup>{/if}
          {#if newest.test?.length}<div bind:this={testEl} id="wn-test"><ListGroup id="wn-test-g" title={t('How to test {v}', { v: shortVersion(current) })} count={tn(newest.test.length, 'in {n} step', 'in {n} steps')} bind:open={sideOpen.test}>{@render testBody()}</ListGroup></div>{/if}
          <ListGroup id="wn-plan" title={t('Planned next')} peek={PLANNED.slice(0, 3).map((p) => t(p.name)).join(' · ')} bind:open={sideOpen.plan}>{@render planBody()}</ListGroup>
        {:else}
        <!-- I11b: the message after an update, switched here (v0.127.0 A-U1: the banner on Today) -->
        <section class="ich-sec" aria-labelledby="wn-msg-h">
          <div class="ich-h"><div><h2 id="wn-msg-h">{t('Message after updates')}</h2><p class="ich-hs">{t('you can change this at any time')}</p></div></div>
          {@render msgBody()}
        </section>

        {#if since}
          <section class="ich-sec" aria-labelledby="wn-since-h">
            <div class="ich-h"><div><h2 id="wn-since-h">{t('Since your last visit')}</h2><p class="ich-hs">{tn(since.length, '{n} new function since {v}', '{n} new functions since {v}', { v: shortVersion(update.from) })}</p></div></div>
            {@render sinceBody()}
          </section>
        {/if}

        {#if never.length}
          <section class="ich-sec" aria-labelledby="wn-never-h">
            <div class="ich-h"><div><h2 id="wn-never-h">{t('Never tried')}</h2><p class="ich-hs">{t('on the playground, your data stays')}</p></div></div>
            {@render neverBody()}
          </section>
        {/if}

        {#if newest.test?.length}
          <section class="ich-sec" aria-labelledby="wn-test-h" bind:this={testEl} id="wn-test">
            <div class="ich-h"><div><h2 id="wn-test-h">{t('How to test {v}', { v: shortVersion(current) })}</h2><p class="ich-hs">{tn(newest.test.length, 'in {n} step', 'in {n} steps')}</p></div></div>
            {@render testBody()}
          </section>
        {/if}

        <section class="ich-sec" aria-labelledby="wn-plan-h">
          <div class="ich-h"><div><h2 id="wn-plan-h">{t('Planned next')}</h2><p class="ich-hs">{t('from your projects, without a date')}</p></div></div>
          {@render planBody()}
        </section>
        {/if}
        <!-- SL1 (answer 2a): the jump bar beside the page on a computer, it stays in view -->
        <div class="wn-jump-dt"><ListNav groups={jumps} {active} onjump={jump} mode="toc" /></div>
      {/if}
    </div>
  </div>
</div>
<!-- 0.163.0: the bodies of the side parts (open sections on a computer, closed lines on a phone) -->
{#snippet msgBody()}
  <div class="card ich-list">
    <label class="ich-row wn-sw">
      <span class="ich-m"><b>{t('Show the message after updates')}</b><small>{msgOn ? t('a calm banner on Today for {n} days, until you close it with ×', { n: BANNER_DAYS }) : t('closed with × · with the next update it comes again')}</small></span>
      <input type="checkbox" role="switch" class="wn-switch" checked={msgOn} onchange={(e) => setMsg(e.currentTarget.checked)} />
    </label>
  </div>
{/snippet}

{#snippet sinceBody()}
  {#if since.length}
    <ul class="card ich-list">
      {#each since.slice(0, 5) as r (r.id)}
        {@const Icon = GROUP_ICON[GROUP[r.group].icon]}
        <li><button type="button" class="ich-row" data-feature={r.id} onclick={() => goFeature(r, { bikeId })}><span class="ich-ib"><Icon size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(r.title)}</b><small class="num">{shortVersion(r.since)}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></button></li>
      {/each}
    </ul>
  {/if}
{/snippet}

{#snippet neverBody()}
  <ul class="card ich-list">
    {#each never as r (r.id)}
      {@const Icon = GROUP_ICON[GROUP[r.group].icon]}
      <li class="ich-row ich-wrap" data-feature={r.id}><span class="ich-ib"><Icon size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(r.title)}</b><small>{t(GROUP[r.group].label)}</small></span><button type="button" class="btn sm" onclick={() => (play = r.play)}>{t('Try it')}</button></li>
    {/each}
  </ul>
{/snippet}

{#snippet testBody()}
  <ol class="card ich-list wn-steps">
    {#each newest.test as s, i (s)}
      <li><label class="ich-row"><input type="checkbox" checked={tested.includes(i)} onchange={(e) => tick(i, e.currentTarget.checked)} /><span class="ich-m"><span><b class="num">{i + 1}.</b> {t(s)}</span></span></label></li>
    {/each}
  </ol>
{/snippet}

{#snippet planBody()}
  <ul class="card ich-list">
    {#each PLANNED as p (p.name)}
      {@const Icon = PLAN_ICON[p.icon]}
      <li class="ich-row"><span class="ich-ib"><Icon size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(p.name)}</b><small>{t(p.note)}</small></span></li>
    {/each}
  </ul>
{/snippet}

{#if play}<PlaySheet running={!!d?.demo} kind="weekend" day={play} onclose={() => (play = null)} />{/if}

<style>
  .wn {
    max-width: 1100px;
  }
  /* the newest version: its card (know/VersionNews.svelte) with «Try it» and «How to test it» */
  .wn-top {
    margin: 0 0 16px;
  }
  .wn-top :global(.vn-t) {
    font-size: var(--fs-section);
  }
  .wn-topacts {
    margin-top: 14px;
  }
  /* W2: one row to the whole list of functions */
  .wn-allrow {
    display: block;
    margin: 0 0 24px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
    color: var(--ink);
    text-decoration: none;
  }
  @media (max-width: 719px) {
    /* 0.163.0: a little less air on a phone */
    .wn-allrow {
      margin-bottom: 16px;
    }
    .wn-top {
      margin-bottom: 12px;
    }
  }
  .wn-allrow:hover .ich-m b {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  /* the sort chips and the search */
  .wn-sort {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0 0 10px;
  }
  @media (pointer: fine) {
    .wn-sort .wn-chip {
      min-height: 36px;
      padding: 4px 11px;
    }
  }
  .wn-sl {
    margin-right: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .wn-find {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    padding: 0 12px;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-3);
  }
  .wn-find:focus-within {
    outline: var(--focus-ring);
  }
  .wn-find input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    outline: none;
  }
  /* the list: a white card with rows; on a computer a table of five columns */
  .wn-list {
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
    overflow: hidden;
  }
  .wn-rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .wn-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'fn act' 'use act';
    align-items: center;
    gap: 4px 12px;
    padding: 10px 16px;
    border-top: 1px solid var(--line);
  }
  .wn-head {
    display: none;
  }
  /* a small phone: the name over the whole row, the state and the button below it */
  @media (max-width: 419px) {
    .wn-row {
      grid-template-areas: 'fn fn' 'use act';
    }
  }
  .wn-fn {
    grid-area: fn;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
  }
  .wn-ft {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .wn-ft b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .wn-ft small {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.35;
    overflow-wrap: break-word;
  }
  .wn-cat,
  .wn-3 {
    display: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .wn-use {
    grid-area: use;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-size: var(--fs-small);
  }
  .wn-act {
    grid-area: act;
  }
  .wn-rank {
    flex: none;
    display: inline-grid;
    place-items: center;
    min-width: 24px;
    height: 24px;
    border-radius: 999px;
    background: var(--hi-soft);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .wn-used {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--hi);
  }
  .pill.wn-new {
    background: var(--hi-soft);
    color: var(--hi);
  }
  .wn-bar {
    flex: none;
    width: 60px;
    height: 6px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .wn-bar i {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--hi);
  }
  .wn-n {
    color: var(--ink);
  }
  .wn-none,
  .wn-foot {
    margin: 0;
    padding: 12px 16px;
    border-top: 1px solid var(--line);
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .wn-more {
    display: flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    box-sizing: border-box;
    color: var(--ink);
    text-decoration: none;
  }
  .wn-more:hover {
    text-decoration: underline;
  }
  @media (min-width: 720px) {
    .wn-row {
      grid-template-columns: minmax(0, 2.6fr) minmax(0, 1.2fr) minmax(68px, 0.7fr) minmax(0, 0.9fr) auto;
      grid-template-areas: 'fn cat third use act';
    }
    .wn-head {
      display: grid;
      padding-block: 12px;
      border-top: 0;
      color: var(--ink-2);
      font-size: var(--fs-tiny);
      font-weight: 600;
    }
    .wn-cat {
      display: block;
      grid-area: cat;
    }
    .wn-3 {
      display: block;
      grid-area: third;
    }
  }
  /* SL1: the versions by day; a row opens to its points */
  .wn-vfind {
    margin: 0;
  }
  .wn-vers .wn-sort {
    margin: 0;
  }
  .wn-jump-ph {
    margin: 0 0 14px;
  }
  .wn-days {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .wn-vr {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    min-height: 52px;
    padding: 11px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .wn-vr:focus-visible {
    outline: var(--focus-ring);
  }
  .wn-vr > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-3);
  }
  .wn-vb {
    flex: none;
    min-width: 44px;
    margin-top: 2px;
    padding: 0 7px;
    border-radius: 7px;
    background: var(--hi-soft);
    color: var(--ink);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
    text-align: center;
  }
  .wn-vm {
    flex: 1;
    min-width: 0;
  }
  .wn-vm b {
    display: block;
    font-weight: 500;
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .wn-vm small {
    display: block;
    margin-top: 1px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .wn-vr[aria-expanded='true'] small {
    white-space: normal;
  }
  .wn-vopen {
    padding: 0 0 12px 56px;
  }
  .wn-vopen :global(.vn) {
    padding: 0;
    border: 0;
  }
  .wn-vopen :global(.vn-h),
  .wn-vopen :global(.vn-t),
  .wn-vopen :global(.vn-ld) {
    display: none;
  }
  .wn-end {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 14px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wn-jump-dt {
    display: none;
  }
  @media (min-width: 1000px) {
    .wn .ich-side {
      align-self: stretch;
    }
    .wn-jump-dt {
      display: block;
      position: sticky;
      top: 16px;
    }
    .wn-jump-ph {
      display: none;
    }
  }
  @media (max-width: 419px) {
    .wn-vopen {
      padding-left: 0;
    }
  }
  /* the side column */
  .ich-side .card {
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
  }
  .wn-sw {
    cursor: pointer;
  }
  .wn-switch {
    appearance: none;
    flex: none;
    position: relative;
    width: 44px;
    height: 26px;
    margin: 0;
    border-radius: 999px;
    background: var(--line);
    cursor: pointer;
    transition: background 0.15s;
  }
  .wn-switch::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: transform 0.15s;
  }
  .wn-switch:checked {
    background: var(--hi);
  }
  .wn-switch:checked::after {
    transform: translateX(18px);
  }
  .wn-switch:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .wn-steps {
    margin: 0;
  }
  .wn-steps input {
    flex: none;
    width: 20px;
    height: 20px;
    margin: 2px 0 0;
    accent-color: var(--hi);
  }
  .wn-steps .ich-row {
    align-items: flex-start;
    min-height: 44px;
    cursor: pointer;
  }
  @media print {
    .wn-sort,
    .wn-find,
    .wn-act {
      display: none;
    }
  }
</style>
