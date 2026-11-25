<script>
  /**
   * Paket C › Assistent mit Belegen (#/me/ruhig/belege; 996 Ideen UC-018-I1, UC-018-I3, UC-311-I2, UC-019-I2):
   * «Antwort mit Beleg», «Plan hinterfragen», «KI-Vorschläge erst prüfen», «Eigene Verbote».
   * The free answer of the app (AskAnswer) plus the own entries it touches as links. Old AI answers kept from
   * before (the AI is gone) wait as «still to check» until you take them or drop them. Logic: belege.js.
   */
  import { liveQuery } from 'dexie';
  import { BookOpenCheck, MessageCircleQuestion, ListChecks, Ban, Plus, Trash2, Check, X } from '@lucide/svelte';
  import Card from './Card.svelte';
  import AskAnswer from '../assistent/AskAnswer.svelte';
  import { db } from '../db.js';
  import { searchAll } from '../search.js';
  import { TEMPLATES_KEY } from '../templates.js';
  import { addTodo } from '../merkendb.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { settingQ, saveSetting } from './store.js';
  import { openFromHash } from './open.js';
  import { dmy, addDays } from './base.js';
  import { CHECK_KEY, BANS_KEY, BAN_KINDS, sourcesFor, nextTrip, openAssumptions, checksOf, setCheck, bansOf, newBan, banHits } from './belege.js';

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

  /* Antwort mit Beleg */
  let q = $state('');
  let asked = $state('');
  const sources = $derived(asked && $dataQ ? sourcesFor(asked, (w) => searchAll(w, $dataQ)) : []);
  function submit(e) {
    e.preventDefault();
    asked = q.trim();
  }

  /* Plan hinterfragen */
  const trip = $derived($dataQ ? nextTrip($dataQ.trips, today) : null);
  const byId = $derived(Object.fromEntries(($dataQ?.items ?? []).map((i) => [i.id, i])));
  const open1 = $derived(openAssumptions(trip, byId));

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
            <li><span class="rh-n">[{i + 1}]</span>{#if s.href}<a href={s.href}>{s.title}</a>{:else}<span>{s.title}</span>{/if}{#if s.sub}<small> · {s.sub}</small>{/if}</li>
          {/each}
        </ol>
      {:else}<p class="rh-empty">{t('No entry of yours fits these words.')}</p>{/if}
    {/if}
  </Card>

  <Card id="devil" icon={MessageCircleQuestion} title={t('Question my plan')} lead={t('Kind doubts and open assumptions about your next trip')} bind:open={open.devil}>
    {#if trip}
      <p class="rh-help">{t('Your next trip: {trip}, {day}.', { trip: trip.title, day: dmy(trip.startDate) })}</p>
      {#if open1.length}
        <ul class="rh-list" data-assumptions>{#each open1 as x (x.key)}<li><span class="rh-grow">{t(x.text)}</span></li>{/each}</ul>
      {:else}<p class="rh-note">{t('The app finds nothing open. That can be a blind spot too.')}</p>{/if}
    {:else}<p class="rh-empty">{t('No trip ahead. Plan one, then the app can question it.')}</p>{/if}
  </Card>

  {#if checks.length}
  <Card id="check" icon={ListChecks} title={t('Earlier AI suggestions')} lead={t('Answers kept from before; take them or drop them')} bind:open={open.check}>
    <p class="rh-help">{t('Nothing an AI said changes your gear, to-dos or rules by itself. «Take» makes a to-do to check it.')}</p>
    {#if openChecks.length}
      <ul class="rh-list" data-checks>
        {#each openChecks as c (c.id)}
          <li class="rh-chk"><span class="rh-grow"><span class="rh-tag warn">{t('{from} · {day} · still to check', { from: c.from, day: dmy(c.day) })}</span>{#if c.q}<small>{c.q}</small>{/if}<span class="rh-ct">{c.text}</span></span>
            <button type="button" class="rh-x" aria-label={t('Take')} onclick={() => take(c)}><Check size={20} /></button>
            <button type="button" class="rh-x" aria-label={t('Drop')} onclick={() => saveChecks(setCheck(checks, c.id, 'dropped'))}><X size={20} /></button>
          </li>
        {/each}
      </ul>
    {:else}<p class="rh-empty">{t('Nothing waits any more.')}</p>{/if}
    {#if doneChecks.length}<p class="rh-help">{doneChecks.map((c) => `${dmy(c.day)} ${c.state === 'taken' ? t('taken') : t('dropped')}`).join(' · ')}</p>{/if}
  </Card>
  {/if}

  <Card id="bans" icon={Ban} title={t('My own no-gos')} lead={t('Things you do not want to take or buy; a list that holds one shows a hint')} bind:open={open.bans}>
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
  .rh-n {
    font-weight: 600;
    margin-right: 6px;
    color: var(--ink-2);
  }
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
