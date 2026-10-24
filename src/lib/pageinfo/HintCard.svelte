<script module>
  // a visit of the Einstieg counts once per opening of a page (each hash change is a new opening)
  const seenIntro = new Set();
  // Gesamttest 20.10 «2a»: was this opening the first visit of the page? Kept per opening, so a re-mount of the
  // card while the page loads its data keeps it open on the first visit
  const freshOf = new Map();
  let nav = 0;
  if (typeof window !== 'undefined') window.addEventListener('hashchange', () => nav++);
</script>

<script>
  /**
   * Hinweistexte HT1–HT2 (Noah 14.10.2026, mockups approved 20:31 «HT1–HT2 freigegeben», answers «1a 2b 3a»):
   * the short card at the top of a page: what the page is for, «Typisch hier» (three situations; folded on
   * a phone, 2b), «Weiter unten» (chips that jump to a part of the page; a chip shows only when its part is
   * there) and «Das kann die App hier» (opens the fold at the page end). × folds the card to the quiet line
   * «Was hier steht ›», which opens it again (1a). Data in hints.js; the state in the setting of pageinfo.
   * page: a key of HINTS (and of PAGES for the fold).
   * intro (Noah 19.10 «2a»: one card per page): a key of INTROS (lib/intro.js). The «Einstieg» of that page
   * then lives in this card instead of its own: the small tour offered on the first visit, «So geht's hier»
   * (its three things, with links), «Was dich erwartet», one «Wusstest du» with its source, the small tour
   * and the Handbook. The tip of the day stays in the tip line (TipLine) under the card.
   * foldedOnPhone (Paket D, Noah 19.10.2026 «1a», Handy kurz): on a phone the card starts as its quiet line.
   * only: '' draws both states here; 'line' only the folded line, as a small chip «Was hier steht ›» (for a page
   * head); 'card' only the open card. A page may place the two in different spots (Trips on a phone).
   * Gesamttest 20.10.2026 «2a» (B2): the card is open on the first visit of a page only; after that it is the
   * quiet line «ⓘ So geht's ›», a tap opens it in place (and it stays open until ×). Seen per page in the
   * setting of pageinfo (hintSeen), on the device and in the backup.
   */
  import { Info, X, ChevronDown, ChevronRight, Lightbulb, Bike, Wrench, Store, ShoppingBag, Scale, Heart, Plus, BookOpen, Cloud, Check, Clock, NotebookPen, Moon, ChartLine, Columns2, Sun, Shirt, Layers, Camera, ShieldCheck, Save, Settings, CircleQuestionMark, Target, Play, Bell, Upload, Link2, Flag } from '@lucide/svelte';
  import { pageInfo } from './store.svelte.js';
  import { hintOf } from '../hints.js';
  import { canRows, canShown, setHint, hintOpen, hintSeen, markHintSeen } from '../pageinfo.js';
  import { phone } from '../media.svelte.js';
  import { t, tn } from '../i18n.svelte.js';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { dayContext } from './store.svelte.js';
  import KindTag from './KindTag.svelte';
  import { tipOfDay, factOfDay } from '../pageinfo.js';
  import { localDay } from '../localday.js';
  import { INTRO_KEY, INTROS, tipsOf, visit, offerTour, setOffered } from '../intro.js';
  import { TOURS, stepCount } from '../tour.js';
  import { startTour } from '../tour/run.js';
  import { sayHere } from './here.svelte.js';
  import { Map as MapIcon, Backpack, History, Boxes, ShoppingCart, ListChecks, Timer, CalendarDays, Star, Copy, Thermometer } from '@lucide/svelte';

  let { page, intro: introKey = null, foldedOnPhone = false, only = '' } = $props();
  // «Alles finden 2»: the «?» at the top shows this page's help
  $effect(() => (only === 'sheet' ? undefined : sayHere({ hint: page, intro: introKey })));
  // svelte-ignore state_referenced_locally
  const intro = introKey ? INTROS[introKey] : null;
  const ICON_INTRO = { check: Check, goal: Target, moon: Moon, map: MapIcon, pack: Backpack, back: History, scale: Scale, blocks: Boxes, cart: ShoppingCart, bike: Bike, wrench: Wrench, list: ListChecks, timer: Timer, chart: ChartLine, calendar: CalendarDays, heart: Heart, star: Star, bag: ShoppingBag, sun: Sun, copy: Copy, shirt: Shirt, thermo: Thermometer };
  const today = localDay();
  const dc = dayContext(today);
  // the Einstieg's state (visits, offered) lives in its own setting, as before (in the backup)
  let introRaw = $state(undefined);
  $effect(() => {
    if (!intro) return;
    const sub = liveQuery(() => db.settings.get(INTRO_KEY)).subscribe({ next: (x) => (introRaw = x?.value) });
    return () => sub.unsubscribe();
  });
  const saveIntro = (fn) =>
    db.transaction('rw', db.settings, async () => {
      const next = fn((await db.settings.get(INTRO_KEY))?.value);
      if (next) await putSetting(db, INTRO_KEY, next);
    });
  // one visit per opening of the page: a re-mount of the card (the data of the page loads) is no new visit
  $effect(() => {
    if (!intro || seenIntro.has(`${introKey}:${nav}`)) return;
    seenIntro.add(`${introKey}:${nav}`);
    saveIntro((v) => visit(v, introKey));
  });
  const hasTour = $derived(!!intro?.tour && !!TOURS[intro.tour]);
  const offer = $derived(hasTour && offerTour(introRaw, introKey));
  const introName = $derived(intro ? t(intro.name) : '');
  // the «Wusstest du» with its source; never the tip the tip line shows today
  const fact = $derived(intro && pi.loaded ? factOfDay(pi.info, tipsOf(introKey), today, tipOfDay(pi.info, page, today, dc.ctx)?.id) : null);
  function tour() {
    saveIntro((v) => setOffered(v, introKey));
    startTour(intro.tour);
  }
  const ICONS = { bike: Bike, wrench: Wrench, shop: Store, bag: ShoppingBag, scale: Scale, heart: Heart, plus: Plus, book: BookOpen, cloud: Cloud, check: Check, clock: Clock, note: NotebookPen, moon: Moon, chart: ChartLine, columns: Columns2, sun: Sun, shirt: Shirt, layers: Layers, camera: Camera, shield: ShieldCheck, save: Save, settings: Settings, help: CircleQuestionMark, target: Target, play: Play, bell: Bell, upload: Upload, link: Link2, flag: Flag };
  const pi = pageInfo();
  const hint = $derived(hintOf(page));
  // the first visit (2a): decided once per opening, before this visit marks the page as seen
  let fresh = $state(null);
  $effect(() => {
    if (!pi.loaded || fresh !== null) return;
    const k = `${page}:${nav}`;
    const seen = hintSeen(pi.info, page);
    if (!freshOf.has(k)) freshOf.set(k, !seen);
    fresh = freshOf.get(k);
    if (!seen) pi.save((v) => markHintSeen(v, page));
  });
  // Paket D «1a»: on a phone the Handy-kurz pages start folded even on the first visit
  const open = $derived(pi.loaded && fresh !== null && hintOpen(pi.info, page, fresh && !(foldedOnPhone && phone.matches)));
  const canN = $derived(pi.loaded && canShown(pi.info, page) ? canRows(page).length : 0);

  // «Weiter unten»: only the parts that are on the page now (they come with the data, so look a few times)
  let here = $state([]);
  $effect(() => {
    const ids = (hint?.jumps ?? []).map((j) => j[1]);
    const look = () => (here = ids.filter((id) => document.getElementById(id)));
    const timers = [0, 300, 1000, 2500].map((ms) => setTimeout(look, ms));
    return () => timers.forEach(clearTimeout);
  });
  const jumps = $derived((hint?.jumps ?? []).filter((j) => here.includes(j[1])));

  function jump(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'DETAILS') el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function toCan() {
    const el = document.querySelector('[data-section="can"]');
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

{#if hint && only === 'sheet'}
  <!-- «Alles finden 2» (Noah 22.10.2026 «3a»): the whole help of the page, in the «?» window (nav/HelpButton) -->
  <section class="hint sheetmode" data-hint={page} data-intro-in={introKey} aria-label={t('What is here')}>
    <div class="h">
      <Info size={20} aria-hidden="true" />
      <p><b>{t(hint.lead[0])}</b> {t(hint.lead[1])}</p>
    </div>
    {#if offer}
      <div class="offer" data-offer>
        <span>{t('New here? A short tour of {place} ({n} steps)', { place: introName, n: stepCount(intro.tour) })}</span>
        <span class="oacts">
          <button type="button" class="btn sm" onclick={() => saveIntro((v) => setOffered(v, introKey))}>{t('No thanks')}</button>
          <button type="button" class="btn sm" onclick={tour}>{t('Start ›|tour')}</button>
        </span>
      </div>
    {/if}
    <p class="jl">{t('Typical here')}</p>
    <ul class="uc" data-uses>
      {#each hint.uses as [icon, title, text] (title)}
        {@const Icon = ICONS[icon] ?? Info}
        <li><Icon size={18} aria-hidden="true" /><span><b>{t(title)}</b>{t(text)}</span></li>
      {/each}
    </ul>
    {#if intro}
      <p class="jl">{t('How to use {place}', { place: introName })}</p>
      <ul class="uc" data-intro-things={introKey}>
        {#each intro.things as x (x.title)}
          {@const Icon = ICON_INTRO[x.icon] ?? Check}
          <li><Icon size={18} aria-hidden="true" /><span><b>{#if x.href}<a href={x.href}>{t(x.title)}</a>{:else}{t(x.title)}{/if}</b>{t(x.text)}</span></li>
        {/each}
      </ul>
      <p class="expect" data-expect><b>{t('What to expect:')}</b> {t(intro.expect)}</p>
      {#if fact}
        <div class="fact" data-fact={fact.id}>
          <p><KindTag kind="know" />{t(fact.text)}</p>
          <p class="src">{t('Source: {source}', { source: t(fact.source) })}</p>
        </div>
      {/if}
      {#if hasTour}<div class="links"><button type="button" class="lk" onclick={tour}>{t('Tour of {place} ({n} steps)', { place: introName, n: stepCount(intro.tour) })}</button></div>{/if}
    {/if}
  </section>
{:else if hint && only !== 'line' && jumps.length}
  <!-- «Alles finden 2» (Noah 22.10.2026 «1a», new proposal «Auf dieser Seite»): the chips that jump to the parts of
       the page stay on the page, always open, as one quiet row; the explanation is behind the «?» at the top -->
  <nav class="onpage" data-onpage={page} aria-label={t('On this page')}>
    <span class="jl">{t('On this page')}</span>
    <div class="jump">
      {#each jumps as [label, id] (id)}<button type="button" data-jump={id} onclick={() => jump(id)}>{t(label)}</button>{/each}
    </div>
  </nav>
{/if}
<style>
  /* Noah 19.10 «2a»: the Einstieg inside the card */
  .offer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-right: 8px;
    padding: 8px 12px;
    border-radius: 12px;
    background: var(--paper);
    font-size: var(--fs-small);
  }
  .oacts {
    display: flex;
    gap: 6px;
  }
  .oacts .btn {
    min-height: 44px;
  }
  .uc a {
    color: inherit;
  }
  .expect {
    margin: 0;
    padding-right: 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .fact {
    margin-right: 8px;
    padding: 9px 11px;
    border-radius: 12px;
    background: var(--paper); /* Design 2: inside the help card like its rows, no own colour */
    font-size: var(--fs-small);
  }
  .fact p {
    margin: 0;
  }
  .fact .src {
    margin-top: 2px;
    color: var(--ink-3);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    padding-right: 8px;
  }
  .links .lk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--hi);
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }
  .hint {
    display: grid;
    gap: 10px;
    margin-bottom: 12px;
    padding: 14px 8px 14px 16px;
    border: 1px solid var(--help-line);
    border-radius: var(--help-r);
    background: var(--help-bg);
  }
  .h {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .h > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--help-icon);
  }
  .h p {
    flex: 1;
    min-width: 0;
    margin: 0;
  }
  .jl {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .uc {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0 8px 0 0;
    list-style: none;
  }
  .uc li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 9px 11px;
    border-radius: 12px;
    background: var(--paper);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .uc li :global(svg) {
    flex: none;
    margin-top: 1px;
    color: var(--ink-3);
  }
  .uc b {
    display: block;
    color: var(--ink);
  }
  .onpage {
    display: grid;
    gap: 6px;
    margin-bottom: 12px;
  }
  .onpage .jl {
    margin: 0;
  }
  .sheetmode {
    margin: 0;
    border: 0;
    padding: 0;
    background: none;
  }
  .jump {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-right: 8px;
  }
  .jump button {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 500;
    cursor: pointer;
  }
</style>
