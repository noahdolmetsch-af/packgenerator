<script>
  /**
   * What the app can do (v0.30.0, #/features). v0.35.0: «New in the last updates» on top (WhatsNew).
   * v0.96.0 «F1 Alles finden» (Noah 11.10.2026, mockup A «1-5 a»): every function of the app
   * (features.js), in 6 groups by the situation you are in, or switched to 5 by the page it lives on
   * (Noah «1 a und b beides umstellbar», 11.10. «1-2 freigeben»). In each group what you never used
   * comes first, «All n ›» opens the rest. A search field narrows the list. #/features?f=<id> opens at one function.
   * SN6 (mockup «Seiten neu», Noah 13.10.2026 «ich gebe alle bild mockups frei»): on top three tips «New
   * for you» (the first one the main button); each group a card with 3 rows; a quiet circle = never used,
   * a tick = used (moves down), a spark = new in the last versions. The row itself takes you there;
   * «Take me there» and «Try it» (the playground) are in its «…». The situation chips are gone (each
   * card's «All n» shows the whole group), the news fold sits at the end, a legend under the cards.
   */
  import { liveQuery } from 'dexie';
  import { catalogue, findFeatures, FEATURE, FEATURES } from '../lib/features.js';
  import { goFeature } from '../lib/know/featureRun.js';
  import { featureData, usedOf } from '../lib/know/featureData.js';
  import { sinceOf } from '../lib/know/wasneu.js';
  import { WHATS_NEW, compareVersions, shortVersion } from '../lib/whatsnew.js';
  import { tripStates } from '../lib/tripstate.js';
  import { nextTrip } from '../lib/debrief.js';
  import { sortBikes } from '../lib/bikes.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn } from '../lib/i18n.svelte.js';
  import { Check, ChevronRight, Compass, Backpack, BookOpen, Bike, Leaf, Save, Search, CircleDashed, Sparkles, Star, Play } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import TipButton from '../lib/know/TipButton.svelte';
  import WhatsNew from '../lib/know/WhatsNew.svelte';
  import PlaySheet from '../lib/testdata/PlaySheet.svelte';
  import MoreActions from '../lib/ui/MoreActions.svelte';
  import Seg from '../lib/ui/Seg.svelte';

  const GROUP_ICON = { compass: Compass, backpack: Backpack, book: BookOpen, bike: Bike, leaf: Leaf, save: Save };
  /** Rows shown per group before «All n ›» (SN6: 3, as in the mockup). */
  const SHOWN = 3;
  /** SN6: a function that came with one of the last 3 versions and was never used shows a spark. */
  const RECENT = new Set(WHATS_NEW.slice(0, 3).map((e) => e.version));
  const isNew = (x) => !x.used && RECENT.has(sinceOf(x.id));

  // v0.110.0: the reading moved to know/featureData.js (shared with Ich › Was ist neu), unchanged
  const dataQ = liveQuery(featureData);
  const d = $derived($dataQ);
  const used = $derived(usedOf(d));
  let by = $state('situation');
  const all = $derived(d ? catalogue(d.tips, used, by) : null);
  const next = $derived(d ? nextTrip(d.trips, localDay()) : null);
  const bikeId = $derived(d ? (sortBikes(d.bikes)[0]?.id ?? null) : null);

  // #/features?f=<id>: open at that function (from the search or a tip with a form of its own)
  const wanted = typeof location !== 'undefined' ? (location.hash.match(/[?&]f=([^&]+)/)?.[1] ?? null) : null;
  const wantId = wanted ? decodeURIComponent(wanted) : null;
  let q = $state('');
  let opened = $state({});
  let play = $state(null); // the day the playground starts on («Try it»)
  const hits = $derived(q.trim().length >= 2 ? new Set(findFeatures(q, t).map((x) => x.featureId)) : null);
  const groups = $derived(all ? all.groups.map((g) => ({ ...g, rows: hits ? g.items.filter((x) => hits.has(x.id)) : g.items })).filter((g) => g.rows.length) : []);
  const isOpen = (g) => !!hits || !!opened[g.key] || (wantId != null && g.items.findIndex((x) => x.id === wantId) >= SHOWN);
  let scrolled = false; // once, when the list is there (not on every change of the data)
  $effect(() => {
    if (!all || !wantId || scrolled) return;
    scrolled = true;
    queueMicrotask(() => document.querySelector(`[data-feature="${CSS.escape(wantId)}"]`)?.scrollIntoView({ block: 'center' }));
  });

  /* ---------- SN6: «New for you», three tips that fit you ---------- */
  // 1. the newest function you never used; 2. a trip that waits for its debrief (else the next newest);
  // 3. the playground while never tried (else the next newest). Each a suggestion: nothing has to be done.
  const tips = $derived.by(() => {
    if (!all) return [];
    const usedNow = new Set(all.groups.flatMap((g) => g.items.filter((x) => x.used).map((x) => x.id)));
    const fresh = FEATURES.filter((f) => !usedNow.has(f.id) && f.id !== 'f.playground').sort((a, b) => compareVersions(sinceOf(b.id), sinceOf(a.id)));
    const out = [];
    const fn = (f, main = false) => ({ key: f.id, icon: Sparkles, tone: 'new', title: t(f.title), sub: t('new in {v}', { v: shortVersion(sinceOf(f.id)) }) + ' · ' + t(f.text), label: t('Show|tip'), main, go: () => goFeature(f, { bikeId }) });
    if (fresh[0]) out.push(fn(fresh[0], true));
    const states = tripStates(d.trips, { debriefs: d.debriefs, today: localDay() });
    const wait = d.trips
      .filter((x) => states[x.id]?.state === 'done' && x.entries?.length && !x.noDebrief)
      .sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')))[0];
    if (wait) out.push({ key: `debrief-${wait.id}`, icon: Star, tone: 'rate', title: t('Rate|tip'), sub: t('{name} waits for its debrief', { name: wait.title }), label: t('Show|tip'), href: `#/debrief/${encodeURIComponent(wait.id)}` });
    else if (fresh[1]) out.push(fn(fresh[1]));
    if (!usedNow.has('f.playground') && !d.demo) out.push({ key: 'f.playground', icon: Play, tone: 'play', title: t('Playground'), sub: t('try it out, without your data'), label: t('Try it'), go: () => goFeature(FEATURE['f.playground'], { bikeId }) });
    for (const f of fresh.slice(1)) {
      if (out.length >= 3) break;
      if (!out.some((x) => x.key === f.id)) out.push(fn(f));
    }
    return out.slice(0, 3);
  });

  /** The «…» of a row: «Take me there» (the same as a tap on the row) and «Try it» in the playground. */
  const rowActions = (x) => [
    { name: t('Take me there'), explain: t('Opens the place in the app'), icon: ChevronRight, run: () => document.querySelector(`[data-feature="${CSS.escape(x.id)}"] .fmain`)?.click() },
    ...(x.play && !x.used && !d?.demo ? [{ name: t('Try it'), explain: t('In the playground, without changing your data'), icon: Play, run: () => (play = x.play) }] : []),
  ];
</script>

{#snippet body(x)}
  <span class="fic" class:used={x.used} class:fresh={isNew(x)} aria-hidden="true">{#if x.used}<Check size={16} strokeWidth={2.5} />{:else if isNew(x)}<Sparkles size={16} />{:else}<CircleDashed size={18} />{/if}</span>
  <span class="fm">
    <span class="ft">{t(x.title)}</span>
    <span class="fs">{t(x.text)}</span>
    <span class="sr">{x.used ? t('Used|tips') : t('Never used|features')}</span>
  </span>
{/snippet}

{#snippet row(x)}
  <li data-feature={x.id} class="frow" class:used={x.used} class:want={x.id === wantId}>
    {#if x.tip}
      <TipButton id={x.tip} {next} cls="fmain">{@render body(x)}</TipButton>
    {:else}
      <button type="button" class="fmain" onclick={() => goFeature(x, { bikeId })}>{@render body(x)}</button>
    {/if}
    <MoreActions title={t(x.title)} label={t('More for {title}', { title: t(x.title) })} actions={rowActions(x)} />
  </li>
{/snippet}

<div class="feat">
  <!-- Design-Refresh P9 (I7): the path back to Ich. SN6: «Ich › Funktionen», one line with «tap to go there». -->
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Functions')} title={t('What the app can do')} sub={all ? `${t('{total} functions · you use {n}', { total: all.total, n: all.used })} · ${t('tap to go there')}` : ''} />
  <div class="ftop">
    <label class="ffind">
      <Search size={18} aria-hidden="true" />
      <input type="search" bind:value={q} placeholder={t('What do you want to do? e.g. «warranty»')} aria-label={t('Find a function')} autocomplete="off" />
    </label>
    <!-- Noah «1 a und b beides umstellbar»: by situation or by the page a function lives on -->
    <div class="fby"><Seg full={false} label={t('Sort')} options={[{ key: 'situation', name: t('By situation') }, { key: 'page', name: t('By page') }]} value={by} onchange={(k) => (by = k)} /></div>
  </div>
  {#if tips.length && !hits}
    <section class="fnew" aria-labelledby="fnew-h">
      <h2 id="fnew-h">{t('New for you')}</h2>
      <p class="fsub">{tn(tips.length, '{n} tip that fits you', '{n} tips that fit you')}</p>
      <ul class="ftips">
        {#each tips as x (x.key)}
          <li class="ftip" data-tip={x.key}>
            <span class="tic {x.tone}" aria-hidden="true"><x.icon size={18} /></span>
            <span class="fm"><span class="ft">{x.title}</span><span class="fs">{x.sub}</span></span>
            {#if x.href}<a class="btn" class:hi={x.main} href={x.href}>{x.label}</a>
            {:else}<button type="button" class="btn" class:hi={x.main} onclick={x.go}>{x.label}</button>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
  {#if all && !groups.length}
    <p class="fnone" role="status">{t('No function found for «{q}».', { q: q.trim() })}</p>
  {/if}
  <div class="fgrid">
    {#each groups as g (g.key)}
      {@const Icon = GROUP_ICON[g.icon]}
      {@const open = isOpen(g)}
      <section class="fgroup" data-group={g.key} aria-labelledby="fg-{g.key}">
        <header class="fgh">
          <span class="fgi" aria-hidden="true"><Icon size={20} /></span>
          <h2 id="fg-{g.key}">{t(g.label)}</h2>
          <span class="fgn num" title={t('{n} of {total} used', { n: g.used, total: g.total })}>{t('{n} of {total}', { n: g.used, total: g.total })}</span>
        </header>
        <ul class="flist">
          {#each open ? g.rows : g.rows.slice(0, SHOWN) as x (x.id)}{@render row(x)}{/each}
        </ul>
        {#if !open && g.rows.length > SHOWN}
          <button type="button" class="fall" onclick={() => (opened = { ...opened, [g.key]: true })}>{t('All {n}|features', { n: g.rows.length })}<ChevronRight size={16} aria-hidden="true" /></button>
        {/if}
      </section>
    {/each}
  </div>
  <p class="legend"><CircleDashed size={16} aria-hidden="true" /><span>{t('Circle = never used, tick = used (moves down). Under «…»: try it in the playground.')}</span></p>
  <!-- the news of the last versions, folded at the end (Ich › Was ist neu has them all) -->
  <div class="fnews"><WhatsNew /></div>
</div>
{#if play}<PlaySheet running={!!d?.demo} kind="weekend" day={play} onclose={() => (play = null)} />{/if}

<style>
  .feat {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    gap: var(--sp-4);
    align-content: start;
  }
  .feat > :global(.vhead) {
    margin: 0;
  }
  /* SN6: the search and «Nach Situation | Nach Seite» on one row (on a phone below each other) */
  .ftop {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-3);
  }
  .ffind {
    flex: 1 1 320px;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 48px;
    padding: 0 var(--sp-3);
    border: 1.5px solid var(--line-strong);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink-3);
  }
  .ffind:has(input:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .ffind input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink);
    font: 400 var(--fs-body) var(--font-body);
  }
  .fby {
    flex: none;
    max-width: 100%;
  }
  /* SN6: «Neu für dich», three tips in a row (one under the other on a phone) */
  .fnew h2 {
    margin: 0;
    font: 600 var(--fs-sub)/1.3 var(--font-body);
  }
  .fsub {
    margin: 2px 0 var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ftips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-3);
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  }
  .ftip {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-width: 0;
    padding: var(--sp-3) var(--sp-4);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .ftip .btn {
    flex: none;
    min-height: 44px;
  }
  .tic {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .tic.new,
  .fic.fresh {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .tic.rate,
  .fic.used {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .fnone {
    margin: var(--sp-2) 0;
    color: var(--ink-3);
  }
  .fgrid {
    display: grid;
    gap: var(--sp-4);
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    align-items: start;
  }
  .fgroup {
    min-width: 0;
    padding: var(--sp-4);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .fgh {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding-bottom: var(--sp-1);
  }
  .fgi {
    flex: none;
    display: inline-flex;
    color: var(--ink-2);
  }
  .fgh h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    font: 600 var(--fs-sub)/1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .fgn {
    flex: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .flist {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  /* SN6: the row takes you there; its «…» holds the rest */
  .frow {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .frow:first-child {
    border-top: 0;
  }
  .frow.want {
    background: var(--hi-soft);
  }
  .frow :global(.fmain) {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    min-height: 44px;
    padding: 4px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .frow :global(.fmain:focus-visible) {
    outline: var(--focus-ring);
    outline-offset: 2px;
    border-radius: 6px;
  }
  .fic {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-3);
  }
  .fm {
    flex: 1 1 auto;
    min-width: 0;
    display: grid;
    gap: 2px;
    justify-items: start;
  }
  .ft {
    font-weight: 500;
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  /* SN6: the line under the name stays short: two lines at most */
  .fs {
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
    overflow-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .used .ft,
  .used .fs {
    color: var(--ink-3);
  }
  .fall {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-label) var(--font-body);
    cursor: pointer;
  }
  .legend {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .legend :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
