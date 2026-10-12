<script>
  /**
   * v0.110.0 Design-Refresh P10 (I11, I11c, I11d; Noah 12.10.2026 «Runde 20 freigegeben»): Ich › Was ist neu
   * (#/me/news). On top the newest version as a card (name, one sentence, points, «Try it», «How to test
   * it»); below every function one by one, sortable by newest, name, category, place, your top 10 and
   * the most important 10, with a search; then all versions by month. Beside it: the message after an
   * update (switch), since your last visit, never tried, how to test this version, planned next.
   * #/me/news?all&sort=<key> is the whole list (I11c/I11d) with the other sorts beside it.
   * The counts of «Your top 10» live only on this device (wasneuStore.js); nothing here is mandatory.
   */
  import { liveQuery } from 'dexie';
  import { WHATS_NEW, shortVersion } from '../lib/whatsnew.js';
  import { FEATURES, FEATURE_GROUPS, PAGE_GROUPS } from '../lib/features.js';
  import { isUsed } from '../lib/tips.js';
  import { featureData, usedOf } from '../lib/know/featureData.js';
  import { goFeature } from '../lib/know/featureRun.js';
  import { SORTS, sortKey, rowsOf, sortRows, searchRows, newSince, neverTried, byMonth, messageOn, PLANNED, LIST_ROWS, NEWS_HREF } from '../lib/know/wasneu.js';
  import { readUses, readUpdate, writeUpdate, readMute, writeMute, readTested, writeTested } from '../lib/know/wasneuStore.js';
  import { nextTrip } from '../lib/debrief.js';
  import { sortBikes } from '../lib/bikes.js';
  import { openData } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { Check, ChevronRight, Compass, Backpack, BookOpen, Bike, Leaf, Save, Search, Sparkles, Star, Lightbulb, Activity, Route, ListOrdered, Tags, MapPin } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import TipButton from '../lib/know/TipButton.svelte';
  import PlaySheet from '../lib/testdata/PlaySheet.svelte';
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
  const msgOn = $derived(messageOn({ update, mute, current }));
  function setMsg(on) {
    if (on) {
      writeMute(null);
      if (update?.v !== current) writeUpdate({ v: current, from: update?.from ?? null, at: update?.at ?? localDay() });
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
  function showTest() {
    testEl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    testEl?.querySelector('input')?.focus({ preventScroll: true });
  }

  // all versions by month: the newest month open with its first versions, the next two as rows, the rest «Earlier»
  const months = byMonth();
  const FIRST = 6;
  let moreVersions = $state(false);
  const day = (iso, o = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), o);
  const monthName = (key) => day(`${key}-15`, { month: 'long', year: 'numeric' });
  const nameOf = (e) => (e.title ? t(e.title) : t(e.points[0].text));
  const tryHref = (e) => e.points.find((p) => p.href)?.href ?? NEWS_HREF;
  function go(p, ev) {
    if (p.action !== 'data') return;
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
    <TipButton id={r.tip} {next} cls="btn sm wn-go">{t('Take me there')}<ChevronRight size={16} aria-hidden="true" /></TipButton>
  {:else}
    <button type="button" class="btn sm wn-go" onclick={() => goFeature(r, { bikeId })}>{t('Take me there')}<ChevronRight size={16} aria-hidden="true" /></button>
  {/if}
{/snippet}

{#snippet version(e)}
  <details class="wn-ver" data-version={e.version}>
    <summary class="ich-row">
      <span class="ich-ib num wn-vb">{shortVersion(e.version)}</span>
      <span class="ich-m"><b class="wn-vt">{nameOf(e)}</b><small>{day(e.date, { day: 'numeric', month: 'short' })} · {tn(e.points.length, '{n} point', '{n} points')}</small></span>
      <ChevronRight class="ich-chev wn-tri" size={18} aria-hidden="true" />
    </summary>
    <ul class="wn-pts">
      {#each e.points as p (p.text)}
        <li>
          {#if p.href}<a href={p.href} onclick={(ev) => go(p, ev)}><span>{t(p.text)}</span><ChevronRight size={16} aria-hidden="true" /></a>
          {:else}<span>{t(p.text)}</span>{/if}
        </li>
      {/each}
    </ul>
  </details>
{/snippet}

<div class="ich-page wn">
  <VeloHead
    crumbs={all ? [{ label: t('Me|place'), href: '#/me' }, { label: t('What is new'), href: NEWS_HREF }] : [{ label: t('Me|place'), href: '#/me' }]}
    here={all ? t('All functions') : ''}
    title={t('What is new')}
    sub={t('{n} updates since 0.1 · {f} functions · last {date}', { n: WHATS_NEW.length, f: FEATURES.length, date: day(newest.date) })}
  />
  <div class="ich-cols">
    <div class="ich-main">
      {#if !all}
        <!-- I11: the newest version as a card -->
        <section class="card wn-top" aria-labelledby="wn-top-h" data-newest={current}>
          <div class="wn-tophead">
            <span class="wn-ic" aria-hidden="true"><Sparkles size={20} /></span>
            <div class="wn-topt">
              <p class="wn-when">{t('New in {v} · {date}', { v: shortVersion(current), date: day(newest.date) })}</p>
              <h2 id="wn-top-h">{newest.title ? t(newest.title) : t('Version {v}', { v: shortVersion(current) })}</h2>
              {#if newest.lead}<p class="wn-lead">{t(newest.lead)}</p>{/if}
            </div>
          </div>
          <ul class="wn-checks">
            {#each newest.points as p (p.text)}<li><Check size={16} aria-hidden="true" /><span>{t(p.text)}</span></li>{/each}
          </ul>
          <div class="ich-acts">
            <a class="btn hi" href={tryHref(newest)}>{t('Try it')}<ChevronRight size={16} aria-hidden="true" /></a>
            {#if newest.test?.length}<button type="button" class="btn" onclick={showTest}>{t('How to test it')}</button>{/if}
          </div>
        </section>
      {/if}

      <!-- I11 / I11c / I11d: every function one by one -->
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
            <p class="wn-none" role="status">{by === 'top' && !q.trim() ? t('Nothing counted yet: open a function with «Take me there», and it counts here.') : t('No function found for «{q}».', { q: q.trim() })}</p>
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

      {#if !all}
        <!-- I11: all versions by month, the newest open -->
        <section class="ich-sec wn-vers" aria-labelledby="wn-ver-h">
          <div class="ich-h"><div><h2 id="wn-ver-h">{t('All versions')}</h2><p class="ich-hs">{t('by month, the newest open')}</p></div></div>
          <div class="card ich-list" data-month={months[0].key}>
            {#each moreVersions ? months[0].entries : months[0].entries.slice(0, FIRST) as e (e.version)}{@render version(e)}{/each}
            {#if months[0].entries.length > FIRST}
              <button type="button" class="ich-row wn-morev" aria-expanded={moreVersions} onclick={() => (moreVersions = !moreVersions)}>
                <span class="ich-m"><b>{moreVersions ? t('Show fewer') : t('All {n} updates of {month}', { n: months[0].entries.length, month: monthName(months[0].key) })}</b></span>
              </button>
            {/if}
          </div>
          {#if months.length > 1}
            <div class="card ich-list wn-months">
              {#each months.slice(1, 3) as m (m.key)}
                <details data-month={m.key}>
                  <summary class="ich-row"><span class="ich-m"><b>{monthName(m.key)} <small class="wn-mn">{tn(m.entries.length, '{n} update', '{n} updates')}</small></b></span><ChevronRight class="ich-chev wn-tri" size={18} aria-hidden="true" /></summary>
                  <div class="wn-in">{#each m.entries as e (e.version)}{@render version(e)}{/each}</div>
                </details>
              {/each}
              {#if months.length > 3}
                <details data-month="earlier">
                  <summary class="ich-row"><span class="ich-m"><b>{t('Earlier')} <small class="wn-mn">{t('back to the first version 0.1')}</small></b></span><ChevronRight class="ich-chev wn-tri" size={18} aria-hidden="true" /></summary>
                  <div class="wn-in">{#each months.slice(3).flatMap((m) => m.entries) as e (e.version)}{@render version(e)}{/each}</div>
                </details>
              {/if}
            </div>
          {/if}
        </section>
      {/if}
    </div>

    <div class="ich-side">
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
          <p class="ich-fine"><Lightbulb size={16} aria-hidden="true" /><span>{t('Each row leads with «Take me there» straight to its place in the app.')}</span></p>
        {/if}
      {:else}
        <!-- I11b: the message after an update, switched here -->
        <section class="ich-sec" aria-labelledby="wn-msg-h">
          <div class="ich-h"><div><h2 id="wn-msg-h">{t('Message after updates')}</h2><p class="ich-hs">{t('you can change this at any time')}</p></div></div>
          <div class="card ich-list">
            <label class="ich-row wn-sw">
              <span class="ich-m"><b>{t('Show the message for {v}', { v: shortVersion(current) })}</b><small>{msgOn ? t('it comes at each start until you tick «Do not show again»') : t('switched off with «Do not show again» · with the next update it comes again')}</small></span>
              <input type="checkbox" role="switch" class="wn-switch" checked={msgOn} onchange={(e) => setMsg(e.currentTarget.checked)} />
            </label>
          </div>
        </section>

        {#if since}
          <section class="ich-sec" aria-labelledby="wn-since-h">
            <div class="ich-h"><div><h2 id="wn-since-h">{t('Since your last visit')}</h2><p class="ich-hs">{tn(since.length, '{n} new function since {v}', '{n} new functions since {v}', { v: shortVersion(update.from) })}</p></div></div>
            {#if since.length}
              <ul class="card ich-list">
                {#each since.slice(0, 5) as r (r.id)}
                  {@const Icon = GROUP_ICON[GROUP[r.group].icon]}
                  <li><button type="button" class="ich-row" data-feature={r.id} onclick={() => goFeature(r, { bikeId })}><span class="ich-ib"><Icon size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(r.title)}</b><small class="num">{shortVersion(r.since)}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></button></li>
                {/each}
              </ul>
            {/if}
          </section>
        {/if}

        {#if never.length}
          <section class="ich-sec" aria-labelledby="wn-never-h">
            <div class="ich-h"><div><h2 id="wn-never-h">{t('Never tried')}</h2><p class="ich-hs">{t('on the playground, your data stays')}</p></div></div>
            <ul class="card ich-list">
              {#each never as r (r.id)}
                {@const Icon = GROUP_ICON[GROUP[r.group].icon]}
                <li class="ich-row" data-feature={r.id}><span class="ich-ib"><Icon size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(r.title)}</b><small>{t(GROUP[r.group].label)}</small></span><button type="button" class="btn sm" onclick={() => (play = r.play)}>{t('Try it')}</button></li>
              {/each}
            </ul>
          </section>
        {/if}

        {#if newest.test?.length}
          <section class="ich-sec" aria-labelledby="wn-test-h" bind:this={testEl} id="wn-test">
            <div class="ich-h"><div><h2 id="wn-test-h">{t('How to test {v}', { v: shortVersion(current) })}</h2><p class="ich-hs">{tn(newest.test.length, 'in {n} step', 'in {n} steps')}</p></div></div>
            <ol class="card ich-list wn-steps">
              {#each newest.test as s, i (s)}
                <li><label class="ich-row"><input type="checkbox" checked={tested.includes(i)} onchange={(e) => tick(i, e.currentTarget.checked)} /><span class="ich-m"><span><b class="num">{i + 1}.</b> {t(s)}</span></span></label></li>
              {/each}
            </ol>
          </section>
        {/if}

        <section class="ich-sec" aria-labelledby="wn-plan-h">
          <div class="ich-h"><div><h2 id="wn-plan-h">{t('Planned next')}</h2><p class="ich-hs">{t('from your projects, without a date')}</p></div></div>
          <ul class="card ich-list">
            {#each PLANNED as p (p.name)}
              {@const Icon = PLAN_ICON[p.icon]}
              <li class="ich-row"><span class="ich-ib"><Icon size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(p.name)}</b><small>{t(p.note)}</small></span></li>
            {/each}
          </ul>
        </section>
      {/if}
    </div>
  </div>
</div>
{#if play}<PlaySheet running={!!d?.demo} kind="weekend" day={play} onclose={() => (play = null)} />{/if}

<style>
  .wn {
    max-width: 1100px;
  }
  /* the newest version: a white card with a soft icon, the points with ticks, two buttons */
  .wn-top {
    margin: 0 0 24px;
    padding: 16px 18px 18px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
  }
  .wn-tophead {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .wn-ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .wn-topt {
    min-width: 0;
  }
  .wn-when {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .wn-top h2 {
    margin: 2px 0 0;
    font: 600 var(--fs-section) / 1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .wn-lead {
    margin: 6px 0 0;
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .wn-checks {
    list-style: none;
    margin: 12px 0 16px;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .wn-checks li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .wn-checks li > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--hi);
  }
  .wn-checks li > span {
    min-width: 0;
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
      grid-template-columns: minmax(0, 2.6fr) minmax(0, 1.2fr) minmax(0, 0.6fr) minmax(0, 0.9fr) auto;
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
  /* the versions */
  .wn-vers .card {
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
  }
  .wn-months {
    margin-top: 12px;
  }
  .wn-ver > summary,
  .wn-months details > summary {
    list-style: none;
  }
  .wn-vb {
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .wn-vt {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .wn-mn {
    margin-left: 6px;
    font-weight: 400;
  }
  details[open] > summary :global(.wn-tri) {
    transform: rotate(90deg);
  }
  .wn-pts {
    list-style: none;
    margin: 0 0 8px 46px;
    padding: 0;
  }
  .wn-pts li {
    padding: 6px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .wn-pts a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 32px;
    color: var(--ink);
    text-decoration: none;
  }
  .wn-pts a :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .wn-in {
    padding-left: 12px;
  }
  .wn-morev {
    min-height: 48px;
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
