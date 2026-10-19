<script>
  /**
   * Paket Q #142 «Wiedereinstieg nach langer Pause»: after 21 days without opening the app on this
   * device, a window first shows what is due and what is new (comeback.js). «Später», «Heute nicht»,
   * «Alles klar» (done; the greeting goes away).
   */
  import { db } from '../db.js';
  import { t, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { LAST_BACKUP, backupDue } from '../backup.js';
  import { WHATS_NEW } from '../whatsnew.js';
  import { LAST_OPEN, COMEBACK, startComeback, showComeback, later, notToday, comebackLines, daysBetween } from './comeback.js';
  import CheckWindow from './CheckWindow.svelte';

  let { care = 0, inbox = 0 } = $props();
  let rec = $state(null);
  let base = $state(null);
  const lines = $derived(base ? comebackLines({ ...base, care, inbox }, base.today) : []);

  $effect(() => {
    (async () => {
      const now = new Date();
      const [last, waiting, bk, trips] = await Promise.all([db.meta.get(LAST_OPEN), db.meta.get(COMEBACK), db.meta.get(LAST_BACKUP), db.trips.toArray()]);
      await db.meta.put({ key: LAST_OPEN, at: now.toISOString() });
      const r = startComeback(last?.at ?? null, waiting?.rec ?? null, now);
      if (!r) return;
      if (!waiting) await db.meta.put({ key: COMEBACK, rec: r });
      if (!showComeback(r, now)) return;
      const today = localDay(now);
      const next = trips.filter((x) => x.startDate && x.startDate >= today && !x.finished && x.status !== 'done' && !x.skipped).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
      const b = backupDue(bk?.at ?? null, now);
      const since = r.since.slice(0, 10);
      const news = WHATS_NEW.filter((e) => e.date > since).length;
      base = { trip: next, backupDue: b.due, backupDays: b.days, news, today };
      rec = r;
    })();
  });

  const keep = (r) => db.meta.put({ key: COMEBACK, rec: r });
  const doneAll = () => db.meta.delete(COMEBACK);
  const days = $derived(rec ? daysBetween(rec.since, new Date()) : 0);
</script>

{#if rec}
  <CheckWindow id="cb" section="comeback" title={t('Welcome back')} sub={t('You were away for {n} days (last time {date}). This is what is waiting:', { n: days, date: dateOf(rec.since.slice(0, 10)) })}
    main={{ label: t('All clear'), onclick: doneAll }}
    onlater={() => keep(later(rec))}
    onnottoday={() => keep(notToday(rec))}>
    {#if lines.length}
      <ul class="cb-list">
        {#each lines as l (l.key)}
          <li data-cb={l.key}><a href={l.href} onclick={() => doneAll()}>{t(l.text, l.vars)}</a></li>
        {/each}
      </ul>
    {:else}
      <p>{t('Nothing is due. Everything is as you left it.')}</p>
    {/if}
  </CheckWindow>
{/if}

<style>
  .cb-list {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .cb-list a {
    display: block;
    padding: 10px 12px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
    color: var(--ink);
    text-decoration: none;
  }
</style>
