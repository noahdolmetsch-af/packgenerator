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
   * SN6+ «SN6 plus» (mockups SN6p, Noah 13.10.2026 «freigabe SN6p», answers 1b 2b 3b 4a 5b; rules in
   * know/sn6plus.js): from the top the head, K1 the progress bar, K3 «Fits right now», K2 «Your top 5»
   * (since the start), the search, K6 «New since your last visit» (since the previous opening of the app;
   * it replaces «New for you», whose debrief and playground tips moved to K3) and the six cards, each with
   * its own small bar. K4: the «…» of a row holds «How it works», three short steps, open as text.
   * Impeccable Runde 2: «Your top 5» and «New since your last visit» show only when they have something, so the
   * search sits right under «Fits right now». Each row shows its own icon and a small sign in words, «new for
   * you» (never used) or «✓ used», instead of the dashed circle; the path says «Ich › What the app can do».
   */
  import { liveQuery } from 'dexie';
  import { catalogue, findFeatures, FEATURE, FEATURE_GROUPS } from '../lib/features.js';
  import { goFeature } from '../lib/know/featureRun.js';
  import { featureData, usedOf } from '../lib/know/featureData.js';
  import { shortVersion } from '../lib/whatsnew.js';
  import { nextTrip } from '../lib/debrief.js';
  import { sortBikes } from '../lib/bikes.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, lang, locale } from '../lib/i18n.svelte.js';
  import { ChevronRight, Compass, Backpack, BookOpen, Bike, Leaf, Save, Search, Sparkles, Star, Play, ListChecks, Mountain, Wrench, Info } from '@lucide/svelte';
  import { TIP } from '../lib/tips.js';
  import { TIP_ICON } from '../lib/know/icons.js';
  import { howtoOf } from '../lib/know/howto.js';
  import { rowsOf } from '../lib/know/wasneu.js';
  import { topFive, newSinceOpen, fitsNow, moreThanMonth, share } from '../lib/know/sn6plus.js';
  import { readUses, readOpens, readProgress, writeProgress } from '../lib/know/wasneuStore.js';
  import { switchTrip } from '../lib/nav.js';
  import { slfUrl } from '../lib/sk/links.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { db } from '../lib/db.js';
  import { INTRO_KEY } from '../lib/home/introkt.js';
  import { Keyboard, Hand, Scale as RuleIcon, Clock } from '@lucide/svelte';
  import { WHEN } from '../lib/know/wann.js'; // «332 sichtbar» 2a: when a function appears
  // «Alles finden 2» (Noah 22.10.2026 «3a»): one help place. The handbook, the keyboard shortcuts, how the app
  // decides and the start page intro moved here from Ich (they were in its fold «Hilfe»).
  const keysHelp = () => window.dispatchEvent(new Event('pg:keys'));
  async function introAgain() {
    await db.settings.put({ key: INTRO_KEY, value: false });
    location.hash = '#/';
  }
  import TipButton from '../lib/know/TipButton.svelte';
  import WhatsNew from '../lib/know/WhatsNew.svelte';
  import PlaySheet from '../lib/testdata/PlaySheet.svelte';
  import MoreActions from '../lib/ui/MoreActions.svelte';
  import Seg from '../lib/ui/Seg.svelte';

  const GROUP_ICON = { compass: Compass, backpack: Backpack, book: BookOpen, bike: Bike, leaf: Leaf, save: Save };
  /** Rows shown per group before «All n ›» (SN6: 3, as in the mockup). */
  const SHOWN = 3;

  // v0.110.0: the reading moved to know/featureData.js (shared with Ich › Was ist neu), unchanged
  const dataQ = liveQuery(featureData);
  const d = $derived($dataQ);
  const used = $derived(usedOf(d));
  let by = $state('situation');
  // Paket C «Nicht für mich»: marked functions stay, at the end of their group
  const notQ = liveQuery(async () => (await db.settings.get('ruhig.notForMe'))?.value ?? {});
  const all = $derived(d ? catalogue(d.tips, used, by, $notQ) : null);
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

  /* ---------- SN6+ (answers 1b 2b 3b 5b): progress, «Fits right now», «Your top 5», «New since your last visit» ---------- */
  const usedNow = $derived(all ? new Set(all.groups.flatMap((g) => g.items.filter((x) => x.used).map((x) => x.id))) : new Set());
  // K2: the counts of this device since the start (wasneu.js), fresh after every opening of a function
  let uses = $state(readUses());
  $effect(() => {
    const again = () => (uses = readUses());
    window.addEventListener('pg:uses', again);
    return () => window.removeEventListener('pg:uses', again);
  });
  const top = $derived(topFive(uses, usedNow));
  // K1: today's count is kept once a day (not while a demo runs), «more than a month ago» from it
  const today = localDay();
  const progress = readProgress();
  const more = $derived(all ? moreThanMonth(progress, all.used, today) : null);
  $effect(() => {
    if (all && d && !d.demo) writeProgress(all.used, today);
  });
  // K6: the previous opening of the app (main.js), read once when the page opens
  const opens = readOpens();
  const fresh = $derived(newSinceOpen(opens.prev, rowsOf(usedNow, uses)));
  const sinceDay = (at) => new Date(at).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  // K3: what fits the situation now (the debrief and the playground came from «New for you»)
  const fits = $derived(d ? fitsNow({ trips: d.trips, bikes: d.bikes, debriefs: d.debriefs, used: usedNow, demo: d.demo, today }) : []);
  const startsIn = (n) => (n < 0 ? t('on the way now') : n === 0 ? t('starts today') : n === 1 ? t('starts tomorrow') : t('starts in {n} days', { n }));
  const FIT_ICON = { trip: ListChecks, bulletin: Mountain, chain: Wrench, rate: Star, play: Play };
  function fitOf(x) {
    if (x.kind === 'trip') return { title: t('Check the packing list'), sub: `${x.trip.title}: ${startsIn(x.days)}`, label: t('Check|fit'), go: () => switchTrip(x.trip.id, '#/pack') };
    if (x.kind === 'bulletin') return { title: t('Avalanche bulletin'), sub: t('{name}: read it the evening before', { name: x.trip.title }), label: t('Open|fit'), href: slfUrl(lang.v), out: true };
    if (x.kind === 'chain') return { title: t('Care for the chain'), sub: t('{bike}: {km} km since the last chain care', { bike: x.bike.name, km: x.since }), label: t('Show|tip'), href: `#/bikes?tab=care&bike=${encodeURIComponent(x.bike.id)}` };
    if (x.kind === 'rate') return { title: t('Rate|tip'), sub: t('{name} waits for its debrief', { name: x.trip.title }), label: t('Show|tip'), href: `#/debrief/${encodeURIComponent(x.trip.id)}` };
    return { title: t('Playground'), sub: t('try it out, without your data'), label: t('Try it'), go: () => goFeature(FEATURE['f.playground'], { bikeId }) };
  }
  /** The icon of a function: its tip's, else its group's. */
  const iconOf = (f) => (f.tip && TIP_ICON[TIP[f.tip]?.icon]) || GROUP_ICON[FEATURE_GROUPS.find((g) => g.key === f.group)?.icon] || Sparkles;

  /** The «…» of a row: «Take me there» (the same as a tap on the row) and «Try it» in the playground. */
  const rowActions = (x) => [
    { name: t('Take me there'), explain: t('Opens the place in the app'), icon: ChevronRight, run: () => document.querySelector(`[data-feature="${CSS.escape(x.id)}"] .fmain`)?.click() },
    ...(x.play && !x.used && !d?.demo ? [{ name: t('Try it'), explain: t('In the playground, without changing your data'), icon: Play, run: () => (play = x.play) }] : []),
  ];
  /** SN6+ K4: «How it works» in the «…», three short steps open as text (answer 4a). */
  function howOf(x) {
    const steps = howtoOf(x.id).map((st) => t(st));
    return steps.length ? { title: t('How it works'), count: tn(steps.length, '{n} step', '{n} steps'), steps } : null;
  }
</script>

{#snippet body(x)}
  {@const Icon = iconOf(x)}
  <span class="fic" aria-hidden="true"><Icon size={18} /></span>
  <span class="fm">
    <span class="ft">{t(x.title)}</span>
    <span class="fs">{t(x.text)}</span>
    <!-- «332 sichtbar» 2a (Noah 27.10.2026): a function that shows only in its situation says when -->
    {#if WHEN[x.id]}<span class="fwhen" data-when={x.id}><Clock size={13} aria-hidden="true" />{t(WHEN[x.id])}</span>{/if}
    <!-- Impeccable Runde 2: the state in words, not a sign to guess -->
    {#if x.notForMe}<span class="pill fstate">{t('Not for me|feature')}</span>{:else if x.used}<span class="pill ok fstate">{t('used|features')}</span>{:else}<span class="pill act fstate">{t('new for you')}</span>{/if}
  </span>
{/snippet}

{#snippet row(x)}
  <li data-feature={x.id} class="frow" class:used={x.used} class:want={x.id === wantId}>
    {#if x.tip}
      <TipButton id={x.tip} {next} cls="fmain">{@render body(x)}</TipButton>
    {:else}
      <button type="button" class="fmain" onclick={() => goFeature(x, { bikeId })}>{@render body(x)}</button>
    {/if}
    <MoreActions title={t(x.title)} label={t('More for {title}', { title: t(x.title) })} actions={rowActions(x)} howto={howOf(x)} />
  </li>
{/snippet}

<div class="feat" data-blocks="sn6plus">
  <!-- Design-Refresh P9 (I7): the path back to Ich. SN6: «Ich › Funktionen», one line with «tap to go there». -->
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Help and functions')} title={t('Help and functions')} sub={all ? `${t('{total} functions · you use {n}', { total: all.total, n: all.used })} · ${t('tap to go there')}` : ''} />
  <ul class="fhelp" data-block="help" aria-label={t('Help|me')}>
    <li><a href="#/me/handbook" data-help-row="handbook"><BookOpen size={18} aria-hidden="true" /><span><b>{t('Handbook')}</b><small>{t('How to switch on every function, with an example')}</small></span><ChevronRight size={16} aria-hidden="true" /></a></li>
    <li><a href="#/me/regeln" data-help-row="rules"><RuleIcon size={18} aria-hidden="true" /><span><b>{t('How the app decides')}</b><small>{t('Every rule, where to change it')}</small></span><ChevronRight size={16} aria-hidden="true" /></a></li>
    <li><button type="button" onclick={keysHelp} aria-haspopup="dialog" data-help-row="keys"><Keyboard size={18} aria-hidden="true" /><span><b>{t('Help and keyboard shortcuts')}</b><small>{t('Every page has a «?» at the top: its own help')}</small></span><ChevronRight size={16} aria-hidden="true" /></button></li>
    <li><button type="button" onclick={introAgain} data-intro-again><Hand size={18} aria-hidden="true" /><span><b>{t('Show the start page intro again')}</b></span><ChevronRight size={16} aria-hidden="true" /></button></li>
  </ul>
  <!-- SN6+ K1: how many functions you use, with a small bar -->
  {#if all}
    <div class="fprog" data-block="progress">
      <span class="bar" aria-hidden="true"><i style:width="{share(all.used, all.total)}%"></i></span>
      <span><b class="num">{t('{n} of {total} used', { n: all.used, total: all.total })}</b>{#if more > 0}<span class="more"> · {t('{n} more than a month ago', { n: more })}</span>{/if}</span>
    </div>
  {/if}
  <!-- SN6+ K3 «Fits right now» (answer 3b: on top) -->
  {#if d}
    <section class="fblock" data-block="fits" aria-labelledby="ffit-h">
      <h2 id="ffit-h">{t('Fits right now')}</h2>
      <p class="fsub">{t('changes with your situation')}</p>
      {#if fits.length}
        <ul class="fcard fits">
          {#each fits as x (x.key)}
            {@const f = fitOf(x)}
            {@const Icon = FIT_ICON[x.kind]}
            <li class="fline" data-fit={x.kind}>
              <span class="tic {x.kind}" aria-hidden="true"><Icon size={18} /></span>
              <span class="fm"><span class="ft">{f.title}</span><span class="fs">{f.sub}</span></span>
              {#if f.href}<a class="btn" href={f.href} target={f.out ? '_blank' : undefined} rel={f.out ? 'noopener noreferrer' : undefined}>{f.label}</a>
              {:else}<button type="button" class="btn" onclick={f.go}>{f.label}</button>{/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="fquiet" role="status"><Info size={16} aria-hidden="true" /><span>{t('Nothing fits right now. A trip coming up, chain care or a debrief brings a tip here.')}</span></p>
      {/if}
    </section>
  {/if}
  <!-- SN6+ K2 «Your top 5» since the start (answer 2b) -->
  {#if d && top.length}
    <section class="fblock" data-block="top" aria-labelledby="ftop-h">
      <h2 id="ftop-h">{t('Your top 5')}</h2>
      <p class="fsub">{t('what you use most since the start · tap to go there')}</p>
      <ol class="ftop5">
          {#each top as x, i (x.id)}
            {@const Icon = iconOf(x)}
            <li data-top={x.id}>
              <button type="button" class="ftopb" onclick={() => goFeature(FEATURE[x.id], { bikeId })}>
                <span class="rank num" aria-hidden="true">{i + 1}</span>
                <span class="tic" aria-hidden="true"><Icon size={18} /></span>
                <span class="fm"><span class="ft">{t(x.title)}</span><span class="fs num">{t('{n} times|top', { n: x.n })}</span></span>
              </button>
            </li>
          {/each}
      </ol>
    </section>
  {/if}
  <div class="ftop" data-block="search">
    <label class="ffind">
      <Search size={18} aria-hidden="true" />
      <input type="search" bind:value={q} placeholder={t('What do you want to do? e.g. «warranty»')} aria-label={t('Find a function')} autocomplete="off" />
    </label>
    <!-- Noah «1 a und b beides umstellbar»: by situation or by the page a function lives on -->
    <div class="fby"><Seg full={false} label={t('Sort')} options={[{ key: 'situation', name: t('By situation') }, { key: 'page', name: t('By page') }, { key: 'moment', name: t('By moment') }]} value={by} onchange={(k) => (by = k)} /></div>
  </div>
  {#if by === 'moment'}<p class="fsub" data-moment-hint>{t('By moment: the functions sorted by the situation in which you need them. Today shows the moment you are in.')}</p>{/if}
  <!-- SN6+ K6 «New since your last visit» (answers 1b and 5b), in place of «New for you» -->
  {#if d && !hits && fresh.rows.length}
    <section class="fblock" data-block="news" aria-labelledby="fsince-h">
      <h2 id="fsince-h">{t('New since your last visit')}</h2>
        <p class="fsub">{t('since {date}', { date: sinceDay(fresh.from) })} · {tn(fresh.rows.length, '{n} new function', '{n} new functions')}</p>
        <ul class="fcard fresh">
          {#each fresh.rows as x (x.id)}
            <li data-new={x.id}>
              <button type="button" class="fline" onclick={() => goFeature(FEATURE[x.id], { bikeId })}>
                <span class="tic new" aria-hidden="true"><Sparkles size={18} /></span>
                <span class="fm"><span class="ft">{t(x.title)}</span><span class="fs">{t('new in {v}', { v: shortVersion(x.since) })} · {t(x.text)}</span></span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
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
          <span class="fgn num">{t('{n} of {total} used', { n: g.used, total: g.total })}</span>
        </header>
        <span class="bar sm" aria-hidden="true"><i style:width="{share(g.used, g.total)}%"></i></span>
        <ul class="flist">
          {#each open ? g.rows : g.rows.slice(0, SHOWN) as x (x.id)}{@render row(x)}{/each}
        </ul>
        {#if !open && g.rows.length > SHOWN}
          <button type="button" class="fall" onclick={() => (opened = { ...opened, [g.key]: true })}>{t('All {n}|features', { n: g.rows.length })}<ChevronRight size={16} aria-hidden="true" /></button>
        {/if}
      </section>
    {/each}
  </div>
  <p class="legend"><Info size={16} aria-hidden="true" /><span>{t('Used ones move down. Under «…»: how it works, and try it in the playground.')}</span></p>
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
  /* SN6+ K1: the progress bar under the head, and a small one in every card */
  .fhelp {
    list-style: none;
    margin: 0 0 var(--sp-3);
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 8px;
  }
  .fhelp a,
  .fhelp button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 56px;
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .fhelp span {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .fhelp small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .fprog {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    margin-top: calc(-1 * var(--sp-2));
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fprog b {
    color: var(--ink);
    font-weight: 600;
  }
  .bar {
    flex: none;
    display: block;
    width: 200px;
    max-width: 100%;
    height: 8px;
    border-radius: 9px;
    background: var(--line);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--accent);
  }
  .bar.sm {
    width: 100%;
    height: 5px;
    margin: 2px 0 var(--sp-2);
  }
  /* SN6+ K3, K2, K6: a heading, a short line, then one card with rows (or one quiet line) */
  .fblock h2 {
    margin: 0;
    font: 600 var(--fs-sub)/1.3 var(--font-body);
  }
  .fsub {
    margin: 2px 0 var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fcard {
    list-style: none;
    margin: 0;
    padding: var(--sp-1) var(--sp-4);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .fcard > li {
    border-top: 1px solid var(--line);
  }
  .fcard > li:first-child {
    border-top: 0;
  }
  .fline {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-width: 0;
    min-height: 56px;
    padding: var(--sp-2) 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
  }
  button.fline {
    cursor: pointer;
  }
  button.fline :global(svg:last-child) {
    flex: none;
    color: var(--ink-3);
  }
  button.fline:focus-visible,
  .ftopb:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
    border-radius: 6px;
  }
  .fline .btn {
    flex: none;
    min-height: 44px;
    min-width: 96px;
  }
  .fquiet {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fquiet :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .ftop5 {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-3);
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .ftop5 > li {
    min-width: 0;
  }
  .ftopb {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    width: 100%;
    height: 100%;
    min-height: 56px;
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  /* a long single word (Wettervorschläge) breaks inside the narrow tile instead of widening the page */
  .ftopb .fm {
    grid-template-columns: minmax(0, 1fr);
    justify-items: stretch;
  }
  .ftopb .ft {
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .rank {
    flex: none;
    min-width: 1.2em;
    color: var(--ink-2);
    font-weight: 600;
    text-align: center;
  }
  /* on a phone the first place is wide, the others two by two (as in the mockup) */
  @media (max-width: 900px) {
    .ftop5 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .ftop5 > li:first-child {
      grid-column: 1 / -1;
    }
  }
  /* a phone: the button of a «Fits right now» row goes under its text, full width (as in the mockup);
     the small top tiles keep their words and leave the icon out */
  @media (max-width: 600px) {
    .fits .fline {
      flex-wrap: wrap;
    }
    .fits .fline .fm {
      flex: 1 1 calc(100% - 52px);
    }
    .fits .fline .btn {
      flex: 1 1 100%;
    }
    .ftop5 > li:not(:first-child) .tic {
      display: none;
    }
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
  .tic.new {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .tic.rate,
  .tic.chain {
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
  .fwhen {
    display: flex;
    gap: 6px;
    align-items: baseline;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
    font-style: italic;
  }
  .fwhen :global(svg) {
    flex: none;
    transform: translateY(2px);
  }
  .used .ft,
  .used .fs {
    color: var(--ink-3);
  }
  .fstate {
    margin-top: 2px;
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
