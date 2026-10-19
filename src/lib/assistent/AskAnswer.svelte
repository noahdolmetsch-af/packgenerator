<script>
  /*
   * «Frag die App» (Noah 15.10.2026 «1 beides 2a und b 3 a und b»): the free answer from your own data,
   * as one card. Used in the search (above the actions) and on the page «Assistent». Reads what it needs
   * itself (ride ledger, trips, gear, bike care, learnings); nothing leaves the device.
   */
  import { liveQuery } from 'dexie';
  import { MessageCircle, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { bikeCare } from '../readiness.js';
  import { withVisits } from '../workshop.js';
  import { switchTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import { answerFor } from './answers.js';

  let { q = '', onlink = () => {} } = $props();
  const today = localDay();
  const src = liveQuery(async () => {
    const [book, trips, items, bikes, visits, tasks, learnings] = await Promise.all([db.kmBook.toArray(), db.trips.toArray(), db.items.toArray(), db.bikes.toArray(), db.visits.toArray(), db.maintenance.toArray(), db.learnings.toArray()]);
    const care = bikes.filter((b) => !b.archived && !b.gone).map((b) => bikeCare(withVisits(b, visits), { tasks, visits, today })).filter(Boolean);
    return { today, book, trips, items, care, learnings };
  });
  const answer = $derived($src && q.trim().length >= 3 ? answerFor(q, $src) : null);

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
