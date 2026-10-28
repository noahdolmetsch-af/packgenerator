<script>
  import { uiZoom } from '../uizoom.js'; // «Grösse»: the header box in the page's own pixels
  import { UNDO_MS } from '../ui/undo.js';
  /**
   * Search everything from the top bar (v0.19.6, start page answer 1a): gear, trips, templates,
   * bikes and notes. On a phone the magnifier opens the field under the bar (v0.46.1: a full-width sheet).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { commandActions, COMMAND_HREF } from '../search.js';
  import { ops } from '../bedienung.svelte.js';
  import { openTrip, addItem, openNew, openNote, quickRide, openData, openWear } from '../nav.js';
  import { sortBikes } from '../bikes.js';
  import { recordCare, undoCare } from '../home/care-tap.js';
  import { switchTips } from '../pageinfo/switchtips.js';
  import { countUse } from '../home/usage.js';
  import { phone } from '../media.svelte.js';
  import { t } from '../i18n.svelte.js';
  import SearchAnswer from '../helper/SearchAnswer.svelte';
  import SearchFree from '../kisuche/SearchFree.svelte';
  import AskAnswer from '../assistent/AskAnswer.svelte';
  import { smartSearch } from '../kisuche/smart.js';
  import { meaningsOf } from '../suche/meanings.js'; // Einzelidee 40: two meanings, the search asks
  import { findFeatures, FEATURE, FEATURES } from '../features.js';
  import { goFeature } from '../know/featureRun.js';
  import { helpAnswers, isQuestion } from '../clear/help.js';
  // «Suche mit Sprache und Antworten» (Noah 21.10.2026 «1a 2a 3a+b 4b+a 5b»): microphone, spoken commands
  // run at once with Undo, Gemini and «Ask further at» right here; switched in Ich › Suche (#/me/suche).
  import { tick } from 'svelte';
  import SearchMic from '../suche/SearchMic.svelte';
  import AskElsewhere from '../assistent/AskElsewhere.svelte';
  import { suche } from '../suche/suche.svelte.js';
  import { spokenCommand } from '../suche/logic.js';
  import { looksLikeQuestion } from '../helper/logic.js';
  import { localDay } from '../localday.js';
  // «Suche als Alleskönner» (Noah 21.10.2026 «1-8 alle»): values, reminders, several things at once, plan, jump
  import { actionOf, actionsOf, actionLabel, runActions } from '../suche/act.js';
  import { partsOf, jumpOf, planHref, weatherHref } from '../suche/say.js';
  // «Eingaben überall» (Noah 26.10.2026 «5a aber b möglich»): the diary in the search, switchable in its settings
  import { onDestroy } from 'svelte';
  import { gate } from '../tagebuch/lock.svelte.js';
  import { diarySearchable, lightEntry, JOURNAL_KEY, KIND as DIARY_KIND } from '../tagebuch/journal.js';

  // v0.76.0 «Fünf Orte»: short: the narrow field in the sidebar says only «Suchen» (with «/»).
  let { compact = false, short = false } = $props();
  let q = $state('');
  let open = $state(false); // phone: the field is shown
  let input = $state();
  let btn = $state(); // phone: the magnifier that opened the field
  let kh = $state(); // v0.77.0 KI-Helfer (answer 2a): «Frag den Helfer» above the hits
  let spoken = $state(false); // the text in the field was spoken (not typed)
  let heardNow = $state(''); // the words while the microphone listens
  let micMsg = $state('');
  let appHas = $state(false); // «The app answers» has an answer for q
  const asking = $derived(q.trim().length >= 3 && (looksLikeQuestion(q) || (spoken && isQuestion(q))));
  const all = liveQuery(async () => {
    const [items, trips, bikes, notes, tpl, events, journal] = await Promise.all([db.items.toArray(), db.trips.toArray(), db.bikes.toArray(), db.notes.toArray(), db.settings.get(TEMPLATES_KEY), db.events.toArray(), db.settings.get(JOURNAL_KEY)]);
    return { items, trips, bikes, notes, templates: tpl?.value ?? [], events, journal: journal?.value ?? {} };
  });
  // the diary entries load only once something is searched, without photos and sound
  let diaryRows = $state([]);
  let diarySub = null;
  $effect(() => {
    if (diarySub || q.trim().length < 2) return;
    diarySub = liveQuery(() => db.frei.where('kind').equals(DIARY_KIND).toArray()).subscribe({ next: (rows) => (diaryRows = rows.map(lightEntry)), error: () => {} });
  });
  onDestroy(() => diarySub?.unsubscribe());
  const data = $derived($all ? { ...$all, diary: diarySearchable($all.journal, gate.open) ? diaryRows : [] } : null);
  // «Kluge Suche» (14.10.2026): similar words, small typos and short filters on top of searchAll.
  const smart = $derived(q.trim().length >= 2 && data ? smartSearch(q, data) : { groups: [], also: [], fixed: null });
  const groups = $derived(smart.groups);
  const meanings = $derived(meaningsOf(q, groups));
  const count = $derived(groups.reduce((n, g) => n + g.rows.length, 0));
  // v0.46.0 (Noah 14a): "What do you want to do?": actions by keyword above the results.
  const cmds = $derived($all ? commandActions(q, { bikes: sortBikes($all.bikes), more: ops.search }) : []);
  // v0.96.0 «F1 Alles finden» (mockup B): the functions of the app are found too («garantie»).
  const feats = $derived(q.trim().length >= 2 && !isQuestion(q) ? findFeatures(q, t).filter((f) => !groups.some((g) => g.kind === 'page' && g.rows.some((r) => r.title === f.title))).slice(0, 3) : []);
  // Paket Q Zusatz 2 (Noah «1-3 alle a»): a whole question («Wo stelle ich das Backup-Passwort ein?») that no
  // function fits word for word finds the functions that answer it, with their first step (instead of «Functions»).
  const help = $derived(isQuestion(q) ? helpAnswers(q, t) : []);
  let focused = $state(false); // the field has the focus: an empty field shows the commands to try
  // v0.96.0 (mockup B): an empty search shows 3 commands to try, the last searches and all functions.
  const firstBike = $derived($all ? (sortBikes($all.bikes)[0] ?? null) : null);
  const bikeWord = $derived(firstBike ? String(firstBike.name ?? '').trim().split(/\s+/)[0].toLowerCase() : '');
  const tries = $derived([
    firstBike && bikeWord ? { say: `${t('chain lubed|command')} ${bikeWord}`, sub: t('enters «chain lubed» for the {bike}', { bike: firstBike.name }) } : { say: t('weigh|command'), sub: t('starts weighing, one item after the other') },
    { say: t('note saddle creaks'), sub: t('puts a note into the Inbox') },
    { say: t('day ride|command'), sub: t('makes a day ride like the last one') },
  ]);
  const RECENT = 'search.recent';
  let recent = $state(readRecent());
  function readRecent() {
    try {
      const v = JSON.parse(localStorage.getItem(RECENT) ?? '[]');
      return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 3) : [];
    } catch {
      return [];
    }
  }
  /** Remember what was searched (the last 3, newest first). */
  function remember(text) {
    const v = String(text ?? '').trim();
    if (v.length < 2) return;
    recent = [v, ...recent.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 3);
    try {
      localStorage.setItem(RECENT, JSON.stringify(recent));
    } catch {
      /* no storage: only for this visit */
    }
  }
  /** Fill the field (a command to try, a recent search) and keep the focus in it. */
  function fill(text) {
    q = text;
    queueMicrotask(() => input?.focus());
  }
  function goFeat(f) {
    remember(q);
    q = '';
    open = false;
    focused = false;
    const feature = FEATURE[f.featureId];
    if (feature) goFeature(feature, { bikeId: firstBike?.id ?? null });
  }
  function allFunctions() {
    q = '';
    open = false;
    focused = false;
  }
  // v0.96.0: «Search commands» on «What the app can do» opens the search with an example.
  $effect(() => {
    const show = (e) => {
      if ((phone.matches || compact) && !open) toggle();
      q = typeof e.detail === 'string' ? e.detail : '';
      focused = true;
      queueMicrotask(() => input?.focus());
    };
    window.addEventListener('pg:search', show);
    return () => window.removeEventListener('pg:search', show);
  });
  let done = $state(null); // { text, undo } after a bike job saved from here
  let doneTimer;
  const USE = { weigh: 'weigh', dayride: 'dayride', chain: 'care', sealant: 'care', wash: 'care', km: 'km', note: 'note', wear: 'wear', trip: 'trip' };
  const ctx = () => ({ today: localDay(), bikes: sortBikes($all?.bikes ?? []), trips: $all?.trips ?? [] });
  /** What the text says to do (a value, a reminder, a note, a plan, several of them), shown under «Do it now». */
  const says = $derived.by(() => {
    if (!$all || q.trim().length < 4) return null;
    const c = ctx();
    const many = actionsOf(q, partsOf(q), c);
    if (many) return many;
    const one = actionOf(q, c);
    // a single command of the search list shows there already
    return one && one.kind !== 'cmd' ? [one] : null;
  });
  const saysTitle = $derived(says ? (says.length > 1 ? t('Enter all {n}: {list}', { n: says.length, list: says.map((a) => actionLabel(a, localDay())).join(' · ') }) : actionLabel(says[0], localDay())) : '');
  /** Does it: a plan opens «Help me plan» with what was said; everything else is written with one Undo. */
  async function doSays(acts = says) {
    if (!acts?.length) return;
    remember(q);
    if (acts[0].kind === 'plan' || acts[0].kind === 'weather') {
      q = '';
      open = false;
      location.hash = acts[0].kind === 'plan' ? planHref(acts[0]) : weatherHref(acts[0]);
      return;
    }
    const r = await runActions(acts, ctx());
    if (!r.lines.length) return;
    countUse(acts.some((a) => a.cmd?.kind === 'note') ? 'note' : 'care');
    q = '';
    spoken = false;
    clearTimeout(doneTimer);
    done = { text: r.lines.length > 1 ? t('Entered: {list}', { list: r.lines.join(' · ') }) : r.lines[0], undoFn: r.undo };
    doneTimer = setTimeout(() => (done = null), UNDO_MS);
  }
  /**
   * The microphone heard a sentence: it goes into the field. With «Run spoken commands at once» (2a):
   * several things that write → all of them; one value, reminder, note, care job or plan → that; one
   * command → it runs; a page or trip by its name («öffne Tagebuch») → it opens.
   */
  async function said(text) {
    heardNow = '';
    if ((phone.matches || compact) && !open) toggle();
    q = text;
    spoken = true;
    focused = true;
    await tick();
    if (!suche.run) return;
    // said right after the page opened: wait for the data first, so the sentence is not lost
    if (!$all) await new Promise((ok) => { const s = all.subscribe((v) => { if (v) { ok(); queueMicrotask(() => s.unsubscribe()); } }); });
    if (says) return doSays(says);
    const c = spokenCommand(cmds, { run: true });
    if (c) return run(c, { direct: true });
    const row = jumpOf(text, groups);
    if (row && !asking) go(row);
  }
  async function run(c, { direct = false } = {}) {
    const cmd = c.cmd;
    remember(q);
    if (direct && cmd.kind === 'note' && String(cmd.text ?? '').trim()) return doSays([{ kind: 'cmd', cmd, writes: true }]);
    spoken = false;
    if (USE[cmd.kind]) countUse(USE[cmd.kind]);
    if (cmd.kind === 'tipsoff' || cmd.kind === 'tipson') {
      const r = await switchTips(cmd.kind === 'tipson');
      q = '';
      clearTimeout(doneTimer);
      done = { text: r.text, undoFn: r.undo };
      doneTimer = setTimeout(() => (done = null), UNDO_MS);
      return;
    }
    if (['chain', 'sealant', 'wash'].includes(cmd.kind)) {
      const r = await recordCare(cmd.bikeId, cmd.kind);
      q = '';
      clearTimeout(doneTimer);
      done = r;
      doneTimer = setTimeout(() => (done = null), UNDO_MS);
      return;
    }
    q = '';
    open = false;
    if (cmd.kind === 'weigh') location.hash = '#/gear?tab=weigh';
    else if (cmd.kind === 'dayride') quickRide(cmd.bikeId ?? null);
    else if (cmd.kind === 'km') openNew('km');
    else if (cmd.kind === 'note') openNote(cmd.text ?? '');
    else if (cmd.kind === 'wear') openWear();
    else if (cmd.kind === 'trip') openNew('list');
    // FE17 «Suche kann handeln» (Noah 13.10.2026): go there
    else if (cmd.kind === 'quicknote') openNote('');
    else if (cmd.kind === 'bike') location.hash = `#/bikes?bike=${encodeURIComponent(cmd.bikeId)}`;
    else if (COMMAND_HREF[cmd.kind]) location.hash = COMMAND_HREF[cmd.kind];
  }
  async function undoDone() {
    const fn = done?.undoFn;
    const u = $state.snapshot(done?.undo); // a plain copy: IndexedDB cannot store Svelte proxies
    clearTimeout(doneTimer);
    done = null;
    if (fn) return fn();
    await undoCare(u);
  }
  $effect(() => () => clearTimeout(doneTimer));
  // v0.46.1: while the sheet is open the top bar (with the sheet in it) lies above the page's own bars.
  $effect(() => {
    const on = open && (phone.matches || compact);
    document.body.classList.toggle('search-open', on);
    return () => document.body.classList.remove('search-open');
  });

  // v0.38.0 (Noah 13a): pages of "More" and the things of "New" are found too; an action does it.
  const RUN = { trip: () => openNew('list'), dayride: () => quickRide(), note: () => openNote(''), item: () => addItem(), km: () => openNew('km'), data: openData };
  function go(row) {
    remember(q);
    if (row.tripId) openTrip(row.tripId);
    q = '';
    open = false;
    if (row.action && RUN[row.action]) return RUN[row.action]();
    if (location.hash === row.href) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = row.href;
  }
  // v0.38.0: another page closes the search (the field and its results).
  $effect(() => {
    const close = () => ((q = ''), (open = false), (focused = false));
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  });
  // v0.40.0 (design check): a tap anywhere else (a place in the bottom bar, +) closes it too.
  let root = $state();
  $effect(() => {
    const away = (e) => {
      if (root && !root.contains(e.target) && (open || q || done || focused)) (q = ''), (open = false), (done = null), (focused = false);
    };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  });
  // v0.24.0 (Noah): what is not there yet can be added right from the search.
  function addNew() {
    const name = q.trim();
    q = '';
    open = false;
    addItem(name);
  }
  // v0.46.1: the sheet starts right under the top bar (its height differs with the safe area).
  let top = $state(64);
  function toggle() {
    open = !open;
    if (open) {
      top = Math.round((root?.closest('header')?.getBoundingClientRect().bottom ?? 64 * uiZoom()) / uiZoom());
      queueMicrotask(() => input?.focus());
    }
  }
  function close() {
    q = '';
    open = false;
    done = null;
    queueMicrotask(() => btn?.focus());
  }
  const key = (e) => {
    if (e.key === 'Escape') {
      q = '';
      focused = false;
      // v0.44.1 (AP21): on a phone the field closes, so the focus goes back to the magnifier (not to the page top).
      if (open) (open = false), queueMicrotask(() => btn?.focus());
    }
    if (e.key === 'Enter' && kh?.onEnter(q)) return e.preventDefault();
    if (e.key === 'Enter' && says) doSays();
    else if (e.key === 'Enter' && cmds.length) run(cmds[0]);
    else if (e.key === 'Enter' && count) go(groups[0].rows[0]);
  };
</script>

<!-- v0.46.1 (Noah: "bei Suche auf Handy blockiert Suchfeld obersten Teil"): on a phone the open search
     is one clean sheet under the top bar (field, then the results), the magnifier turns into ×. -->
<div class="search" bind:this={root} class:ph={phone.matches || compact} class:short class:open>
  {#if phone.matches || compact}
    <button type="button" class="icon" bind:this={btn} aria-label={open ? t('Close search') : t('Search everything')} aria-expanded={open} onclick={toggle}>
      {#if open}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      {:else}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
      {/if}
    </button>
    {#if open}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="sheet" style="--top: {top}px" onclick={(e) => e.target === e.currentTarget && close()}>
        {@render field()}
        {@render results()}
        {#if !q.trim() && !done}{@render empty()}{:else if q.trim().length < 2 && !done}<p class="tip">{t('Type two letters or more, or say what you want to do: "weigh", "day ride".')}</p>{/if}
      </div>
    {/if}
  {:else}
    {@render field()}
    {@render results()}
    {#if focused && !q.trim() && !done}<div class="res">{@render empty()}</div>{/if}
  {/if}
</div>

{#snippet empty()}
  <div class="try" role="region" aria-label={t('Try a command')}>
    <p class="gh">{t('Try a command')}</p>
    <ul class="cmds">
      {#each tries as x (x.say)}
        <li><button type="button" data-try={x.say} onclick={() => fill(x.say)}><span class="m"><b class="say">{x.say}</b><small>{x.sub}</small></span></button></li>
      {/each}
    </ul>
    {#if recent.length}
      <p class="gh">{t('Searched lately')}</p>
      <div class="recent">
        {#each recent as r (r)}<button type="button" class="rchip" onclick={() => fill(r)}>{r}</button>{/each}
      </div>
    {/if}
    <a class="allf" href="#/features" onclick={allFunctions}>{t('See all {n} functions', { n: FEATURES.length })} ›</a>
  </div>
{/snippet}

{#snippet field()}
  <label class="field">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
    <input bind:this={input} type="search" bind:value={q} oninput={() => (spoken = false)} onkeydown={key} onfocus={() => (focused = true)} placeholder={short ? `${t('Search')}  /` : t('What do you want to do? "weigh", "day ride factor"')} aria-label={t('What do you want to do? Search or say an action')} autocomplete="off" />
    <SearchMic onsaid={said} oninterim={(s) => ((heardNow = s), (micMsg = ''))} onerror={(m) => (micMsg = m)} />
  </label>
  {#if heardNow || micMsg}
    <p class="heard" role="status" data-search-heard>{heardNow ? `«${heardNow}»` : micMsg}</p>
  {/if}
{/snippet}

{#snippet results()}
  {#if done && !q.trim()}
    <div class="res" role="region" aria-label={t('Search results')}>
      <p class="done" role="status"><span>{done.text}</span><button type="button" class="btn sm" onclick={undoDone}>{t('Undo')}</button></p>
    </div>
  {/if}
  {#if q.trim().length >= 2}
    <div class="res" role="region" aria-label={t('Search results')} aria-live="polite">
      <!-- «Frag die App» (Noah 15.10.2026 «3 a und b»): the free answer from your own data, on top -->
      {#if suche.app}<AskAnswer {q} autoread={spoken && suche.read === 'auto'} onresult={(has) => (appHas = has)} onlink={() => { q = ''; open = false; }} />{/if}
      <SearchAnswer bind:this={kh} {q} items={$all?.items ?? []} onpropose={() => { q = ''; open = false; }} />
      {#if cmds.length || says}
        <p class="gh">{t('Do it now')}</p>
        <ul class="cmds">
          {#if says}
            <li><button type="button" data-cmd="says" onclick={() => doSays()}><span class="m"><b>{saysTitle}</b><small>{says[0].kind === 'plan' ? t('opens «Help me plan» with it filled in') : says[0].kind === 'weather' ? t('opens the weather page') : t('saves it at once; Undo takes it back')}</small></span><span class="go" aria-hidden="true">↵</span></button></li>
          {/if}
          {#each cmds as c (c.id)}
            <li><button type="button" data-cmd={c.kind} onclick={() => run(c)}><span class="m"><b>{c.title}</b>{#if c.sub}<small>{c.sub}</small>{/if}</span><span class="go" aria-hidden="true">↵</span></button></li>
          {/each}
        </ul>
      {/if}
      <!-- «Kluge Suche»: the hint to similar words / a typo and «Ask Claude» sit under the actions (FE17: actions on top, Enter runs the first) -->
      <!-- «Suche mit Sprache» (3a + b): Gemini answers here, «Ask further at» opens Claude, ChatGPT … -->
      <!-- one block «Weiter fragen» (Noah 22.10.2026 «3a»): the Chrome AI and the AI on this device inside it -->
      {#if asking && (suche.gemini || suche.links)}<AskElsewhere {q} gemini={suche.gemini} links={suche.links} auto={spoken && suche.geminiAuto && !(suche.app && appHas)} autoread={spoken && suche.read === 'auto'}>
          {#snippet children()}<SearchFree {q} data={$all} also={smart.also} fixed={smart.fixed} chrome={suche.chrome} links={suche.links} local={suche.local} inside={suche.links} />{/snippet}
        </AskElsewhere>
      {:else}<SearchFree {q} data={$all} also={smart.also} fixed={smart.fixed} chrome={suche.chrome} links={suche.links} local={suche.local} />{/if}
      {#if meanings.length === 2}
        <p class="mean" data-search-meanings><span>{t('Do you mean')}</span>
          {#each meanings as m, i (m.kind)}{#if i}<span>{t('or|choice')}</span>{/if}<button type="button" class="btn sm" onclick={() => ((q = m.q), input?.focus())} data-meaning={m.kind}>{t(m.name)} · {m.n}</button>{/each}<span>?</span>
        </p>
      {/if}
      {#each groups as g (g.kind)}
        <p class="gh">{t(g.name)}{g.more ? ` · ${t('{n} more', { n: g.more })}` : ''}</p>
        <ul>
          {#each g.rows as r (r.id)}
            <li><button type="button" onclick={() => go(r)}><span class="m"><b>{r.title}</b>{#if r.sub}<small>{r.sub}</small>{/if}</span>{#if r.v}<span class="v num">{r.v}</span>{/if}</button></li>
          {/each}
        </ul>
      {:else}
        {#if !cmds.length && !feats.length && !help.length}<p class="none">{t('Nothing found for "{q}".', { q: q.trim() })}</p>{/if}
      {/each}
      {#if help.length}
        <p class="gh">{t('Fits your question')}</p>
        <ul>
          {#each help as f (f.id)}
            <li><button type="button" data-help={f.featureId} onclick={() => goFeat(f)}><span class="m"><b>{f.title}</b><small>{f.sub}</small></span></button></li>
          {/each}
        </ul>
      {/if}
      {#if feats.length}
        <p class="gh">{t('Functions')}</p>
        <ul>
          {#each feats as f (f.id)}
            <li><button type="button" data-feat={f.featureId} onclick={() => goFeat(f)}><span class="m"><b>{f.title}</b><small>{f.sub}</small></span></button></li>
          {/each}
        </ul>
      {/if}
      {#if !groups.some((g) => g.kind === 'gear' && g.rows.some((r) => r.title.replace(/^★ /, '').toLowerCase() === q.trim().toLowerCase()))}
        <button type="button" class="add" onclick={addNew}>+ {t('Add "{q}" as a new item', { q: q.trim() })}</button>
      {/if}
    </div>
  {/if}
{/snippet}

<style>
  .search {
    position: relative;
    display: flex;
    align-items: center;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(460px, calc(32vw / var(--ui-zoom, 1)));
    height: 40px;
    padding: 0 12px;
    border-radius: 10px;
    background: var(--ground);
    color: var(--ink-3);
    box-sizing: border-box;
  }
  .field input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink);
    font: 400 15px var(--font-body);
  }
  /* v0.22.0 (AP03): the ring sits on the whole field. v0.98.0 R2: the bars are light, one ring colour. */
  .field:has(input:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  /* v0.46.1: phone: one sheet under the top bar, full width, the page dimmed below it. */
  .sheet {
    position: fixed;
    top: var(--top, 64px);
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px var(--gut, 16px) 16px;
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--paper-2);
    color: var(--ink);
  }
  .sheet .field {
    flex: none;
    width: 100%;
    height: 48px;
    border: 1.5px solid var(--line-strong);
    background: var(--paper);
  }
  /* «Suche mit Sprache»: the words while the microphone listens, or why it cannot */
  .heard {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 31;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--paper);
    border: 1px solid var(--line);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ph .heard {
    position: static;
    margin: 6px 0 0;
  }
  .tip {
    margin: 4px 2px;
    color: var(--ink-3);
    font-size: 15px;
  }
  .res {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    width: min(420px, calc(90vw / var(--ui-zoom, 1)));
    max-height: calc(70vh / var(--ui-zoom, 1));
    overflow: auto;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 16px 40px var(--shadow);
    z-index: 30;
    box-sizing: border-box;
  }
  /* v0.77.0: in the sidebar (short) the results open to the right, over the page (Mockup KI-Helfer 5),
     not to the left out of the window. */
  .short .res {
    left: 0;
    right: auto;
    width: min(640px, calc(calc(100vw / var(--ui-zoom, 1)) - 290px));
  }
  .sheet .res {
    position: static;
    flex: none;
    width: auto;
    max-height: none;
    overflow: visible;
    box-shadow: none;
  }
  /* v0.101.0 Design-Refresh P2 (H8): small group heads, rows with a soft corner, «Do it now» tinted */
  .mean {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 8px 8px 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .gh {
    margin: 10px 8px 4px;
    font: 600 var(--fs-tiny) var(--font-body);
    color: var(--ink-2);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  /* v0.40.0 (design check R3): the weight in a right column. */
  li button {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 6px 10px;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink);
    font: 500 15px var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  li button:hover,
  li button:focus-visible {
    background: var(--paper-2);
  }
  .m {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .v {
    flex: none;
    color: var(--ink-2);
    font-size: 14px;
    font-weight: 400;
  }
  li small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* v0.46.0: the actions first, each with a quiet ↵ (Enter does the first one). */
  .cmds li + li {
    margin-top: 4px;
  }
  .cmds li button {
    background: var(--hi-soft);
  }
  .cmds li button:hover,
  .cmds li button:focus-visible {
    background: var(--hi-soft);
    box-shadow: inset 0 0 0 1px var(--hi);
  }
  .go {
    flex: none;
    color: var(--ink-3);
  }
  .done {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    margin: 4px 6px;
    font-weight: 600;
  }
  .done span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .none {
    margin: 6px;
    color: var(--ink-3);
  }
  .say {
    font-family: var(--font-mono, ui-monospace, monospace);
  }
  .recent {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin: 4px 6px;
  }
  .rchip {
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-label) var(--font-body);
    cursor: pointer;
  }
  .allf {
    display: flex;
    align-items: center;
    min-height: 44px;
    margin: 4px 6px 0;
    color: var(--ink);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .add {
    display: block;
    width: 100%;
    min-height: 44px;
    margin-top: 4px;
    padding: 8px 10px;
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: 600 15px var(--font-body);
    text-align: left;
    overflow-wrap: break-word;
    cursor: pointer;
  }
  .add:hover,
  .add:focus-visible {
    background: var(--paper-2);
  }
</style>
