<script>
  /**
   * Paket C › Assistent mit Belegen (#/me/ruhig/belege; 996 Ideen UC-018-I1, UC-018-I3, UC-311-I2, UC-019-I2):
   * «Antwort mit Beleg», «Plan hinterfragen», «KI-Vorschläge erst prüfen», «Eigene Verbote».
   * The free answer of the app (AskAnswer) plus the own entries it touches as links; the free Gemini (through
   * the app's server, api/helper.js, no new file) gets the same entries numbered and cites them. Every AI
   * answer waits as «still to check» until you take it or drop it. Logic: belege.js.
   */
  import { liveQuery } from 'dexie';
  import { BookOpenCheck, MessageCircleQuestion, ListChecks, Ban, Send, Plus, Trash2, Check, X } from '@lucide/svelte';
  import Card from './Card.svelte';
  import AskAnswer from '../assistent/AskAnswer.svelte';
  import { askGemini, geminiError } from '../assistent/gemini.js';
  import { db } from '../db.js';
  import { searchAll } from '../search.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { addTodo } from '../merkendb.js';
  import { t, lang, nameOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { settingQ, saveSetting } from './store.js';
  import { openFromHash } from './open.js';
  import { dmy, addDays } from './base.js';
  import { CHECK_KEY, BANS_KEY, BAN_KINDS, sourcesFor, sourceContext, citedIn, nextTrip, openAssumptions, checksOf, newCheck, setCheck, bansOf, newBan, banHits } from './belege.js';

  const today = localDay();
  const first = openFromHash();
  let open = $state({ sources: first === 'sources' || !first, devil: first === 'devil', check: first === 'check', bans: first === 'bans' });

  const dataQ = liveQuery(async () => {
    const [items, trips, bikes, notes, tpl, events] = await Promise.all([db.items.toArray(), db.trips.toArray(), db.bikes.toArray(), db.notes.toArray(), db.settings.get(TEMPLATES_KEY), db.events.toArray()]);
    return { items, trips, bikes, notes, templates: tpl?.value ?? [], events };
  });
  const cQ = settingQ(CHECK_KEY);
  const bQ = settingQ(BANS_KEY);
  const checks = $derived(checksOf($cQ));
  const bans = $derived(bansOf($bQ));
  const saveChecks = (l) => saveSetting(CHECK_KEY, l);
  const keepCheck = (from, q, text) => {
    const c = newCheck({ from, q, text }, today);
    if (c) saveChecks([c, ...checksOf($cQ)].slice(0, 60));
    return c;
  };

  /* Antwort mit Beleg */
  let q = $state('');
  let asked = $state('');
  const sources = $derived(asked && $dataQ ? sourcesFor(asked, (w) => searchAll(w, $dataQ)) : []);
  let ai = $state(null); // { text, cited, check } | { error }
  let aiBusy = $state(false);
  const banLine = () => t('My own no-gos, please respect them:');
  async function askAi() {
    aiBusy = true;
    ai = null;
    const context = sourceContext(sources, bans, { cite: t('Answer only from these entries of mine where you can, and name the numbers you used as [1], [2]. Say clearly what is a guess.'), banLine: banLine() });
    const res = await askGemini(asked, { context, lang: lang.v });
    aiBusy = false;
    if (!res.ok) return (ai = { error: geminiError(res.error) });
    const c = keepCheck('Gemini', asked, res.text);
    ai = { text: res.text, cited: citedIn(res.text, sources.length), check: c?.id };
  }
  function submit(e) {
    e.preventDefault();
    asked = q.trim();
    ai = null;
  }

  /* Plan hinterfragen */
  const trip = $derived($dataQ ? nextTrip($dataQ.trips, today) : null);
  const byId = $derived(Object.fromEntries(($dataQ?.items ?? []).map((i) => [i.id, i])));
  const open1 = $derived(openAssumptions(trip, byId));
  let devil = $state(null);
  let devilBusy = $state(false);
  async function challenge() {
    devilBusy = true;
    devil = null;
    const list = (trip.entries ?? []).map((e) => nameOf(byId[e.itemId])).filter(Boolean).slice(0, 60).join(', ');
    const context = [`${t('Trip')}: ${trip.title}, ${dmy(trip.startDate)}, ${trip.days ?? 1} ${t('days')}`, `${t('Packing list')}: ${list}`, ...open1.map((x) => t(x.text)), bans.length ? `${banLine()} ${bans.map((b) => b.text).join('; ')}` : ''].filter(Boolean).join('\n');
    const question = t('Question my plan kindly: give the three strongest counter-arguments and the open assumptions. No new plan, only questions and doubts.');
    const res = await askGemini(question, { context, lang: lang.v });
    devilBusy = false;
    if (!res.ok) return (devil = { error: geminiError(res.error) });
    const c = keepCheck('Gemini', question, res.text);
    devil = { text: res.text, check: c?.id };
  }

  /* KI-Vorschläge erst prüfen */
  const openChecks = $derived(checks.filter((c) => c.state === 'open'));
  const doneChecks = $derived(checks.filter((c) => c.state !== 'open').slice(0, 5));
  async function take(c) {
    const res = await addTodo(db, { text: t('Check the AI suggestion: {q}', { q: (c.q || c.text).slice(0, 80) }), due: addDays(today, 1), src: `ki:${c.id}` });
    await saveChecks(setCheck(checks, c.id, 'taken'));
    offerDone(t('In Merken as a to-do. Nothing else was changed.'), res ? async () => (await res.undo(), await saveChecks(setCheck(checksOf($cQ), c.id, 'open'))) : null);
  }

  /* Eigene Verbote */
  let banText = $state('');
  let banKind = $state('take');
  const hits = $derived($dataQ ? banHits(bans, { trip, items: $dataQ.items }) : []);
</script>

<ul class="rh-cards">
  <Card id="sources" icon={BookOpenCheck} title={t('Answer with sources')} lead={t('The answer names your own entries it used; each one opens with a tap')} bind:open={open.sources}>
    <form class="rh-row" onsubmit={submit}>
      <input class="inp" type="search" bind:value={q} placeholder={t('e.g. What did I learn about the Jura?')} aria-label={t('Your question')} data-belege-q />
      <button type="submit" class="btn hi" disabled={!q.trim()}>{t('Ask')}</button>
    </form>
    {#if asked}
      <AskAnswer q={asked} here />
      <p class="rh-sub">{t('Sources from your entries')}</p>
      {#if sources.length}
        <ol class="rh-src" data-sources>
          {#each sources as s, i (s.kind + s.id)}
            <li class:cited={ai?.cited?.includes(i + 1)}><span class="rh-n">[{i + 1}]</span>{#if s.href}<a href={s.href}>{s.title}</a>{:else}<span>{s.title}</span>{/if}{#if s.sub}<small> · {s.sub}</small>{/if}</li>
          {/each}
        </ol>
      {:else}<p class="rh-empty">{t('No entry of yours fits these words.')}</p>{/if}
      <button type="button" class="btn sm" onclick={askAi} disabled={aiBusy}><Send size={14} aria-hidden="true" />{aiBusy ? t('Gemini thinks…') : t('Ask Gemini with these sources')}</button>
      {#if ai?.error}<p class="rh-note">{ai.error}</p>{/if}
      {#if ai?.text}
        <div class="rh-ai" data-ai-answer>
          <span class="rh-tag warn">{t('From Gemini · still to check')}</span>
          <p>{ai.text}</p>
          {#if sources.length}<small class="rh-help">{ai.cited.length ? t('It used: {list}', { list: ai.cited.map((n) => `[${n}]`).join(' ') }) : t('It named none of your entries: read it as a guess.')}</small>{/if}
        </div>
      {/if}
    {/if}
  </Card>

  <Card id="devil" icon={MessageCircleQuestion} title={t('Question my plan')} lead={t('Kind doubts and open assumptions about your next trip')} bind:open={open.devil}>
    {#if trip}
      <p class="rh-help">{t('Your next trip: {trip}, {day}.', { trip: trip.title, day: dmy(trip.startDate) })}</p>
      {#if open1.length}
        <ul class="rh-list" data-assumptions>{#each open1 as x (x.key)}<li><span class="rh-grow">{t(x.text)}</span></li>{/each}</ul>
      {:else}<p class="rh-note">{t('The app finds nothing open. That can be a blind spot too.')}</p>{/if}
      <button type="button" class="btn sm" onclick={challenge} disabled={devilBusy}><Send size={14} aria-hidden="true" />{devilBusy ? t('Gemini thinks…') : t('Collect the strongest counter-arguments')}</button>
      {#if devil?.error}<p class="rh-note">{devil.error}</p>{/if}
      {#if devil?.text}<div class="rh-ai"><span class="rh-tag warn">{t('From Gemini · still to check')}</span><p>{devil.text}</p></div>{/if}
    {:else}<p class="rh-empty">{t('No trip ahead. Plan one, then the app can question it.')}</p>{/if}
  </Card>

  <Card id="check" icon={ListChecks} title={t('Check AI suggestions first')} lead={t('Every AI answer waits with its origin until you take it or drop it')} bind:open={open.check}>
    <p class="rh-help">{t('Nothing an AI says changes your gear, to-dos or rules by itself. «Take» makes a to-do to check it.')}</p>
    {#if openChecks.length}
      <ul class="rh-list" data-checks>
        {#each openChecks as c (c.id)}
          <li class="rh-chk"><span class="rh-grow"><span class="rh-tag warn">{t('{from} · {day} · still to check', { from: c.from, day: dmy(c.day) })}</span>{#if c.q}<small>{c.q}</small>{/if}<span class="rh-ct">{c.text}</span></span>
            <button type="button" class="rh-x" aria-label={t('Take')} onclick={() => take(c)}><Check size={18} /></button>
            <button type="button" class="rh-x" aria-label={t('Drop')} onclick={() => saveChecks(setCheck(checks, c.id, 'dropped'))}><X size={18} /></button>
          </li>
        {/each}
      </ul>
    {:else}<p class="rh-empty">{t('Nothing waits. Answers of Gemini on this page land here.')}</p>{/if}
    {#if doneChecks.length}<p class="rh-help">{doneChecks.map((c) => `${dmy(c.day)} ${c.state === 'taken' ? t('taken') : t('dropped')}`).join(' · ')}</p>{/if}
  </Card>

  <Card id="bans" icon={Ban} title={t('My own no-gos')} lead={t('Things you do not want to take or buy; suggestions respect them')} bind:open={open.bans}>
    <form class="rh-row" onsubmit={(e) => { e.preventDefault(); const b = newBan(banText, banKind); if (b) saveSetting(BANS_KEY, [...bans, b]); banText = ''; }}>
      <input class="inp" bind:value={banText} placeholder={t('e.g. single-use batteries')} aria-label={t('New no-go')} data-ban-new />
      <select class="inp rh-bk" bind:value={banKind} aria-label={t('Kind')}>{#each BAN_KINDS as k (k.key)}<option value={k.key}>{t(k.label)}</option>{/each}</select>
      <button type="submit" class="btn sm" disabled={!banText.trim()}><Plus size={14} aria-hidden="true" />{t('Add')}</button>
    </form>
    {#if bans.length}
      <ul class="rh-list" data-bans>{#each bans as b (b.id)}<li><Ban size={16} aria-hidden="true" /><span class="rh-grow">{b.text}<small>{t(BAN_KINDS.find((k) => k.key === b.kind).label)}</small></span><button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => saveSetting(BANS_KEY, bans.filter((x) => x.id !== b.id))}><Trash2 size={16} /></button></li>{/each}</ul>
    {:else}<p class="rh-empty">{t('No no-go yet.')}</p>{/if}
    {#if hits.length}
      <p class="rh-sub">{t('Where they show up now')}</p>
      <ul class="rh-list" data-ban-hits>{#each hits as h (h.ban.id + h.item.id)}<li><span class="rh-grow">{nameOf(h.item)}<small>{h.where === 'trip' ? t('on the list of {trip}, but you wanted to leave «{ban}» at home', { trip: trip?.title ?? '', ban: h.ban.text }) : t('on your wish list, but you did not want to buy «{ban}»', { ban: h.ban.text })}</small></span></li>{/each}</ul>
    {/if}
    <p class="rh-help">{t('Gemini gets your no-gos with every question on this page.')}</p>
  </Card>
</ul>

<style>
  .rh-src {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 4px;
  }
  .rh-src li {
    padding: 6px 8px;
    border-radius: var(--r-ctl);
    overflow-wrap: break-word;
  }
  .rh-src li.cited {
    background: var(--accent-soft);
  }
  .rh-n {
    font-weight: 600;
    margin-right: 6px;
    color: var(--ink-2);
  }
  .rh-ai {
    display: grid;
    gap: 6px;
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
  }
  .rh-ai p,
  .rh-ct {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  .rh-ct {
    display: block;
    max-height: 7.5em;
    overflow: hidden;
  }
  .rh-chk {
    align-items: flex-start !important;
  }
  .rh-chk .rh-grow {
    display: grid;
    gap: 4px;
  }
  .rh-bk {
    width: auto;
    flex: none !important;
  }
</style>
