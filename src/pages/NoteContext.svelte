<script>
  /**
   * Notizen im Zusammenhang (#/notes/zusammenhang; 996 Ideen, Noah 25.10.2026 «bauen … 12, 13, 14, 15»):
   * one page for what ties notes together. Links with a meaning (source, counter-argument, follow-up
   * question), notes that wait for an event (after a trip, after a workshop visit), the memory cards,
   * and the trash that brings a note back with its attachments. Each part is set inside the note itself
   * (Notes › open a note); this page gives the overview. Logic: src/lib/notes/context.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, tn } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Card from '../lib/ruhig/Card.svelte';
  import MemoryCard from '../lib/notes/MemoryCard.svelte';
  import { TRASH } from '../lib/notes/trash.js';
  import { noteTitle } from '../lib/notebook.js';
  import { RELS, REL, relOverview, afterDue, afterWaiting, AFTER, cardNotes, cardOf } from '../lib/notes/context.js';
  import { Network, CalendarClock, Sparkles, ArchiveRestore, ChevronRight, Volume2, MapPin } from '@lucide/svelte';
  import '../lib/ruhig/ruhig.css';

  const notesQ = liveQuery(() => db.notes.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const trashQ = liveQuery(() => db.docs.where('kind').equals(TRASH).count());
  const notes = $derived($notesQ ?? []);
  const ctx = $derived({ trips: $tripsQ ?? [], visits: $visitsQ ?? [], today: localDay() });
  const rels = $derived(relOverview(notes));
  const relN = $derived(RELS.reduce((n, r) => n + rels[r.key].length, 0));
  const due = $derived(afterDue(notes, ctx));
  const waiting = $derived(afterWaiting(notes, ctx));
  const cards = $derived(cardNotes(notes));
  let open = $state({ links: true, after: false, cards: false, trash: false });
  let shown = $state(null);
  const href = (id) => `#/notes?open=${encodeURIComponent(id)}`;
  const tripName = (id) => ($tripsQ ?? []).find((x) => x.id === id)?.title ?? '';
  const afterText = (a) => [t(AFTER.find((x) => x.key === a.kind)?.label ?? ''), a.tripId ? tripName(a.tripId) : ''].filter(Boolean).join(' · ');
</script>

<div class="nc-page" data-note-context>
  <Crumbs crumbs={[{ label: t('Plan|place'), href: '#/week' }, { label: t('Notes'), href: '#/notes' }]} here={t('Notes in context')} />
  <PageHead title={t('Notes in context')} text={t('What ties your notes together. You set each part inside a note; here you see them all.')} />

  <ul class="rh-cards">
    <Card id="links" icon={Network} title={t('Links with a meaning')} lead={relN ? tn(relN, '{n} link with a meaning', '{n} links with a meaning') : t('Source, counter-argument or follow-up question')} bind:open={open.links}>
      <p class="rh-help">{t('Open a note › Linked notes › choose the meaning beside the link. The other note reads it the other way round.')}</p>
      {#each RELS as r (r.key)}
        {#if rels[r.key].length}
          <h3 class="rh-sub">{t(r.own)} <span class="rh-tag">{rels[r.key].length}</span></h3>
          <ul class="rh-list">
            {#each rels[r.key] as x (x.from.id + x.to.id)}
              <li data-rel={r.key}><span class="rh-grow"><a href={href(x.from.id)}>{x.from.title || t('Note')}</a><small>{t(REL[r.key].own)}: <a href={href(x.to.id)}>{x.to.title || t('Note')}</a></small></span></li>
            {/each}
          </ul>
        {/if}
      {/each}
      {#if rels.none.length}<p class="rh-empty">{tn(rels.none.length, '{n} link has no meaning yet.', '{n} links have no meaning yet.')}</p>{/if}
      {#if !relN && !rels.none.length}<p class="rh-empty">{t('No linked notes yet.')}</p>{/if}
    </Card>

    <Card id="after" icon={CalendarClock} title={t('Reminder after an event')} lead={due.length ? tn(due.length, '{n} note is back', '{n} notes are back') : waiting.length ? tn(waiting.length, '{n} note waits', '{n} notes wait') : t('After the next trip or workshop visit')} bind:open={open.after}>
      <p class="rh-help">{t('Open a note › Remind me › Or after an event. The note comes back on top of Notes when it happened.')}</p>
      {#if due.length}
        <h3 class="rh-sub">{t('Back now')}</h3>
        <ul class="rh-list">{#each due as x (x.note.id)}<li data-after-back><span class="rh-grow"><a href={href(x.note.id)}>{noteTitle(x.note) || t('Note')}</a><small>{afterText(x.note.after)}{x.hit.title ? ` · ${x.hit.title}` : ''}</small></span></li>{/each}</ul>
      {/if}
      {#if waiting.length}
        <h3 class="rh-sub">{t('Waiting')}</h3>
        <ul class="rh-list">{#each waiting as n (n.id)}<li data-after-wait><span class="rh-grow"><a href={href(n.id)}>{noteTitle(n) || t('Note')}</a><small>{afterText(n.after)}</small></span></li>{/each}</ul>
      {/if}
      {#if !due.length && !waiting.length}<p class="rh-empty">{t('No note waits for an event.')}</p>{/if}
    </Card>

    <Card id="cards" icon={Sparkles} title={t('Memory cards')} lead={cards.length ? tn(cards.length, '{n} card', '{n} cards') : t('Text, sound, picture and place as one scene')} bind:open={open.cards}>
      <p class="rh-help">{t('Open a note › Make a memory card. Choose the picture and record a sound of up to one minute.')}</p>
      {#if cards.length}
        <ul class="mc-grid">
          {#each cards as n (n.id)}
            {@const c = cardOf(n)}
            <li><button type="button" class="mc" onclick={() => (shown = n)} data-card={n.id}>
              {#if c.photo}<img src={c.photo} alt="" />{:else}<span class="mc-no"><Sparkles size={22} aria-hidden="true" /></span>{/if}
              <span class="mc-t"><b>{c.title || t('Note')}</b><small>{#if c.voice}<Volume2 size={12} aria-hidden="true" />{/if}{#if c.place}<MapPin size={12} aria-hidden="true" />{c.place}{/if}</small></span>
            </button></li>
          {/each}
        </ul>
      {:else}<p class="rh-empty">{t('No memory card yet.')}</p>{/if}
    </Card>

    <Card id="trash" icon={ArchiveRestore} title={t('Restore with attachments')} lead={$trashQ ? tn($trashQ, '{n} note in the trash', '{n} notes in the trash') : t('Photos, files and links come back with the note')} bind:open={open.trash}>
      <p class="rh-help">{t('A note from the trash comes back with its photos, files and links. Before you put it back, the trash shows what comes with it and which linked note is missing.')}</p>
      <a class="btn" href="#/notes?trash=1" data-open-trash>{t('Open the trash')}<ChevronRight size={16} aria-hidden="true" /></a>
    </Card>
  </ul>
</div>

{#if shown}<MemoryCard note={shown} onclose={() => (shown = null)} />{/if}

<style>
  .nc-page {
    max-width: 760px;
  }
  .rh-help {
    margin: 0 0 var(--sp-3);
  }
  .rh-sub {
    margin: var(--sp-3) 0 6px;
  }
  .mc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .mc {
    display: grid;
    width: 100%;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .mc img,
  .mc-no {
    width: 100%;
    height: 96px;
    object-fit: cover;
  }
  .mc-no {
    display: grid;
    place-items: center;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .mc-t {
    display: grid;
    gap: 2px;
    padding: 6px 8px 8px;
  }
  .mc-t b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mc-t small {
    display: flex;
    align-items: center;
    gap: 3px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
