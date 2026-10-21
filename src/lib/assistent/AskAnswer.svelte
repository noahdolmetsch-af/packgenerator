<script>
  /*
   * «Frag die App» (Noah 15.10.2026 «1 beides 2a und b 3 a und b»): the free answer from your own data,
   * as one card. Used in the search (above the actions) and on the page «Assistent». Reads what it needs
   * itself (ride ledger, trips, gear, bike care, learnings); nothing leaves the device.
   * «Diktat» (Noah 19.10.2026 «4 beides wählbar»): under a dictated note with `tools` it also offers
   * «Read aloud» and «Add to note»; with `fallback` it says so when no rule fits and links to the
   * Assistent; `autoread` reads a new answer aloud at once (onreading(true|false) around it).
   */
  import { liveQuery } from 'dexie';
  import { MessageCircle, ChevronRight, Volume2, Plus, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { bikeCare } from '../readiness.js';
  import { withVisits } from '../workshop.js';
  import { switchTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { t, lang } from '../i18n.svelte.js';
  import { answerFor } from './answers.js';
  import { readAloud, stopReading, speechLang, voiceApi } from '../speak.js';

  let { q = '', onlink = () => {}, tools = false, fallback = false, autoread = false, onadopt = null, onreading = () => {}, onclose = null, onresult = () => {} } = $props();
  const today = localDay();
  const src = liveQuery(async () => {
    const [book, trips, items, bikes, visits, tasks, learnings] = await Promise.all([db.kmBook.toArray(), db.trips.toArray(), db.items.toArray(), db.bikes.toArray(), db.visits.toArray(), db.maintenance.toArray(), db.learnings.toArray()]);
    const care = bikes.filter((b) => !b.archived && !b.gone).map((b) => bikeCare(withVisits(b, visits), { tasks, visits, today })).filter(Boolean);
    return { today, book, trips, items, care, learnings };
  });
  const answer = $derived($src && q.trim().length >= 3 ? answerFor(q, $src) : null);
  const spoken = $derived(answer ? [answer.title, ...answer.lines].filter(Boolean).join('. ') : '');
  const canRead = !!voiceApi();
  // «Suche mit Sprache» (21.10.2026): the search knows whether the app had an answer (then Gemini waits for a tap)
  $effect(() => onresult(!!answer));
  let reading = $state(false);
  function read() {
    if (reading) {
      stopReading();
      reading = false;
      return onreading(false);
    }
    reading = true;
    onreading(true);
    readAloud(spoken, { lang: speechLang(lang.v), onend: () => ((reading = false), onreading(false)) });
  }
  let readFor = '';
  $effect(() => {
    if (!autoread || !spoken || !canRead || spoken === readFor) return;
    readFor = spoken;
    read();
  });
  $effect(() => () => reading && stopReading());

  function open(e) {
    const l = answer?.link;
    if (!l) return;
    if (l.tripId) {
      e.preventDefault();
      switchTrip(l.tripId, '#/pack');
    }
    onlink();
  }
</script>

{#if answer}
  <div class="aa" data-aa={answer.kind} role="status">
    <p class="aa-from"><MessageCircle size={14} aria-hidden="true" />{t('The app answers, from your data')}</p>
    <p class="aa-t">{answer.title}</p>
    {#each answer.lines as l, i (i)}<p class="aa-l">{l}</p>{/each}
    {#if answer.link}
      <a class="aa-go" href={answer.link.href ?? '#/pack'} onclick={open}>{answer.link.label}<ChevronRight size={16} aria-hidden="true" /></a>
    {/if}
    {#if tools}
      <p class="aa-tools">
        {#if canRead}<button type="button" class="btn sm" aria-pressed={reading} onclick={read} data-aa-read><Volume2 size={14} aria-hidden="true" />{reading ? t('Stop reading') : t('Read aloud')}</button>{/if}
        {#if onadopt}<button type="button" class="btn sm" onclick={() => onadopt(spoken)} data-aa-adopt><Plus size={14} aria-hidden="true" />{t('Add to note')}</button>{/if}
        {#if onclose}<button type="button" class="btn sm" onclick={onclose} aria-label={t('Close the answer')}><X size={14} aria-hidden="true" /></button>{/if}
      </p>
    {/if}
  </div>
{:else if fallback && $src && q.trim().length >= 3}
  <div class="aa" data-aa="none" role="status">
    <p class="aa-from"><MessageCircle size={14} aria-hidden="true" />{t('The app answers, from your data')}</p>
    <p class="aa-t">{t('The app knows nothing about this yet.')}</p>
    <p class="aa-l">«{q}»</p>
    <a class="aa-go" href={`#/assistent?q=${encodeURIComponent(q)}`} onclick={onlink}>{t('Ask in the Assistant')}<ChevronRight size={16} aria-hidden="true" /></a>
    {#if onclose}<p class="aa-tools"><button type="button" class="btn sm" onclick={onclose} aria-label={t('Close the answer')}><X size={14} aria-hidden="true" /></button></p>{/if}
  </div>
{/if}

<style>
  .aa {
    margin: 6px 6px 8px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--hi-soft, var(--paper-2));
    overflow-wrap: break-word;
  }
  .aa-from {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .aa-t {
    margin: 0;
    font-weight: 600;
    color: var(--ink);
  }
  .aa-l {
    margin: 2px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .aa-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 0 0;
  }
  .aa-tools .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .aa-go {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-top: 6px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--hi, var(--accent));
    text-decoration: none;
  }
</style>
