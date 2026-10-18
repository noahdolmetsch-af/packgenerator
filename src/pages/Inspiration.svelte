<script>
  import Crumbs from '../lib/ui/Crumbs.svelte'; // P3b I2a: the full path back
  /**
   * «Inspiration» (UC2-1, UC2-2, UC2-4; mockups 13.10.2026, Noah «3b» + «a», 4a, 5a): your own links to
   * rigs, packing lists, videos, routes, listening tips, products, races and guides. On a computer an
   * entry in the sidebar under the five places, on a phone Ich › Inspiration (not in the bottom bar).
   * - Paste a link (or share it from the browser): the app tells the kind from the address; nothing is
   *   fetched, no text or photo from the page is copied (inspiration.js).
   * - Filter by kind or star, your key words on each card, the note «Das übernehme ich» and what it
   *   becomes: a packing rule (a quiet hint while packing), a wishlist item or a note (TakeDialog); a
   *   route a trip draft (a trip idea, like «Aus Notiz wird …» on the Notes page), a race a calendar file.
   * - Rigs and races are the same links as in Velos › Setup (settings 'rigLinks'), never kept twice.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';
  import { wide } from '../lib/media.svelte.js';
  import { take, openNote } from '../lib/nav.js';
  import { nextId } from '../lib/gear.js';
  import { newTrip } from '../lib/trips.js';
  import { sortBikes } from '../lib/bikes.js';
  import { TYPES, TAKEN_LABEL, INSPO_KEY, RIG_KEY, INSPO_WISH, allLinks, freshLink, putLink, dropLink, filterLinks, rigsOfRace, recentTaken, withTaken, ruleFrom, wishFrom, noteFrom, raceIcs } from '../lib/inspiration.js';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import InspoCard from '../lib/inspiration/InspoCard.svelte';
  import LinkDialog from '../lib/inspiration/LinkDialog.svelte';
  import TakeDialog from '../lib/inspiration/TakeDialog.svelte';
  import { Plus, Check, Compass } from '@lucide/svelte';

  const rigQ = liveQuery(() => db.settings.get(RIG_KEY));
  const inspQ = liveQuery(() => db.settings.get(INSPO_KEY));
  const links = $derived(allLinks($rigQ?.value ?? [], $inspQ?.value ?? []));
  let filter = $state('all');
  const shown = $derived(filterLinks(links, filter));
  const recent = $derived(recentTaken(links, 3));

  let paste = $state('');
  let linkDlg = $state.raw(null); // { link } | { url, title, shared }
  let takeDlg = $state.raw(null); // { link, text, make }
  let done = $state.raw(null); // { text, href, label }: what was just taken over

  // A link shared from another app (App.svelte keeps it as INSPO_WISH), also when the page is open.
  const wish = () => {
    const raw = take(INSPO_WISH);
    if (!raw) return;
    try {
      const w = JSON.parse(raw);
      linkDlg = { url: w.url ?? '', title: w.title ?? '', shared: true };
    } catch {
      /* not ours */
    }
  };
  $effect(() => {
    wish();
    window.addEventListener('pg:inspo', wish);
    return () => window.removeEventListener('pg:inspo', wish);
  });

  /** Change both stores in one go (rigs and races live in Velos › Setup's list). */
  async function store(fn, more = []) {
    await db.transaction('rw', [db.settings, ...more], async () => {
      const rig = (await db.settings.get(RIG_KEY))?.value ?? [];
      const insp = (await db.settings.get(INSPO_KEY))?.value ?? [];
      const out = await fn({ rig, insp });
      if (JSON.stringify(out.rig) !== JSON.stringify(rig)) await db.settings.put({ key: RIG_KEY, value: out.rig });
      if (JSON.stringify(out.insp) !== JSON.stringify(insp)) await db.settings.put({ key: INSPO_KEY, value: out.insp });
    });
  }
  const saveLink = (l) => store((s) => putLink($state.snapshot(l), s));
  const deleteLink = (l) => store((s) => dropLink(l.id, s));
  const star = (l) => store((s) => putLink({ ...freshLink(l, s), star: !l.star }, s));
  const setTake = (l, text) => store((s) => putLink({ ...freshLink(l, s), take: text }, s));
  const openAdd = () => {
    linkDlg = { url: paste.trim(), title: '' };
    paste = '';
  };

  const WHERE = {
    rule: { href: '#/debrief/learnings', label: 'What the app has learned' },
    wish: { href: '#/gear?view=wish', label: 'Wishlist' },
    note: { href: '#/notes', label: 'Notes' },
    trip: { href: '#/trips', label: 'Trips|place' },
  };
  const stamp = () => Date.now().toString(36);

  /** UC2-2: the note becomes a packing rule, a wishlist item or a note; the link remembers it. */
  async function make(link, kind, text) {
    const now = new Date().toISOString();
    let ref = null;
    await store(
      async (s) => {
        if (kind === 'rule') {
          const rec = ruleFrom(link, text, { id: `insp-r-${stamp()}`, now });
          await db.learnings.put(rec);
          ref = rec.id;
        } else if (kind === 'wish') {
          const rec = wishFrom(link, text, { id: nextId(await db.items.toArray(), 'lux'), now });
          await db.items.put(rec);
          ref = rec.id;
        } else {
          const rec = noteFrom(link, text, { id: `note-${stamp()}`, now });
          await db.notes.put(rec);
          ref = rec.id;
        }
        return putLink(withTaken(freshLink(link, s), { kind, text, at: now, ref }), s);
      },
      [db.learnings, db.items, db.notes],
    );
    done = { text: `${t(TAKEN_LABEL[kind])}: ${text}`, ...WHERE[kind] };
  }

  /** A route becomes a trip draft (a trip idea, as on the Notes page); a race a calendar file. */
  async function act(link, kind, text) {
    if (kind === 'rule' || kind === 'wish' || kind === 'note') {
      takeDlg = { link, text: text?.trim() || link.title, make: kind };
      return;
    }
    const now = new Date().toISOString();
    if (kind === 'trip') {
      const bike = sortBikes(await db.bikes.toArray())[0];
      if (!bike) {
        done = { text: t('A trip draft needs a bike first.'), href: '#/bikes', label: 'Bikes|place', warn: true };
        return;
      }
      let id = null;
      await store(
        async (s) => {
          const trip = { ...newTrip({ title: link.title, startDate: null, days: link.facts?.days || 1, bike }, await db.trips.toArray(), await db.items.toArray()), idea: true, note: `${link.title} ${link.url}` };
          await db.trips.put(trip);
          id = trip.id;
          return putLink(withTaken(freshLink(link, s), { kind, text: link.title, at: now, ref: id }), s);
        },
        [db.trips, db.items, db.bikes],
      );
      done = { text: `${t('Trip draft')}: ${link.title}`, ...WHERE.trip };
    } else if (kind === 'calendar') {
      const ics = raceIcs(link, now);
      if (!ics) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.download = `${link.title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'race'}.ics`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      await store((s) => putLink(withTaken(freshLink(link, s), { kind, text: link.title, at: now, ref: null }), s));
      done = { text: t('Calendar file for «{title}» saved. Open it to add the race to your calendar.', { title: link.title }) };
    }
  }
</script>

<div class="insp">
  {#if !wide.matches}<Crumbs crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Inspiration')} />{/if}
  <PageHead title={t('Inspiration')} text={t('Your own links to rigs, packing lists, videos, routes, listening tips, products and races. The app recognises the kind of link. Your notes stay with you.')} />

  <form class="if-add" onsubmit={(e) => (e.preventDefault(), openAdd())}>
    <div class="if-row">
      <label class="if-field"><span class="sr">{t('Link')}</span><input class="inp" type="url" inputmode="url" bind:value={paste} placeholder={t('Paste a link, e.g. bikepacking.com/…')} /></label>
      <button type="submit" class="btn hi"><Plus size={16} aria-hidden="true" />{t('Add link|insp')}</button>
    </div>
    <p class="if-hint">{t('On the phone also: in the browser «Share» › Pack Generator. The app gives no list; only your links are here.')}</p>
  </form>

  {#if links.length}
    <div class="if-chips" role="group" aria-label={t('Show')}>
      <button type="button" class="if-chip" aria-pressed={filter === 'all'} onclick={() => (filter = 'all')}>{t('All')}</button>
      {#each TYPES as k (k.key)}<button type="button" class="if-chip" aria-pressed={filter === k.key} onclick={() => (filter = k.key)}>{t(k.plural)}</button>{/each}
      <button type="button" class="if-chip" aria-pressed={filter === 'star'} onclick={() => (filter = 'star')}>{t('Starred|insp')}</button>
    </div>
  {/if}

  <div class="if-live" role="status">
    {#if done}<p class="if-done" class:warn={done.warn}><Check size={16} aria-hidden="true" /><span>{done.text}{#if done.href}{' · '}<a href={done.href}>{t(done.label)}</a>{/if}</span></p>{/if}
  </div>

  {#if recent.length}
    <section class="if-recent" aria-labelledby="if-rec-h">
      <h2 id="if-rec-h">{t('Taken over lately')}</h2>
      <ul>
        {#each recent as r (`${r.linkId}-${r.at}`)}
          <li><Check size={16} aria-hidden="true" /><span><b>{t(TAKEN_LABEL[r.kind])}:</b> {r.text} <small>· {t('from {source}', { source: r.from })}</small></span></li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if !links.length}
    <Empty icon={Compass} title={t('No links yet')} text={t('Paste your first link above: a rig, a packing list, a video or a route. Only your own links are here.')} />
  {:else if !shown.length}
    <p class="if-hint">{t('Nothing of this kind yet.')}</p>
  {:else}
    <div class="if-grid">
      {#each shown as l (l.id)}
        <InspoCard link={l} rigs={l.type === 'race' ? rigsOfRace(links, l.id) : 0} onstar={() => star(l)} onedit={() => (linkDlg = { link: l })} ontake={(text) => setTake(l, text)} onact={(kind, text) => act(l, kind, text)} />
      {/each}
    </div>
  {/if}
  <p class="if-foot">{t('Other pages only as a link, no text or photos from them in the app.')}</p>
</div>

{#if linkDlg}
  <LinkDialog link={linkDlg.link ?? null} url={linkDlg.url ?? ''} title={linkDlg.title ?? ''} shared={!!linkDlg.shared} onsave={saveLink} ondelete={deleteLink} oninbox={(url, title) => openNote([title, url].filter(Boolean).join('\n'))} onclose={() => (linkDlg = null)} />
{/if}
{#if takeDlg}
  <TakeDialog link={takeDlg.link} text={takeDlg.text} make={takeDlg.make} onmake={(kind, text) => make(takeDlg.link, kind, text)} onclose={() => (takeDlg = null)} />
{/if}

<style>
  .insp {
    max-width: 1100px;
  }
  .if-add {
    margin: 0 0 16px;
    padding: 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .if-row {
    display: flex;
    gap: 10px;
  }
  .if-field {
    flex: 1;
    min-width: 0;
  }
  .if-field input {
    width: 100%;
    box-sizing: border-box;
  }
  .if-hint,
  .if-foot {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .if-foot {
    margin: 20px 0 0;
    text-align: center;
  }
  .if-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 14px;
  }
  .if-chip {
    min-height: 36px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .if-chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .if-done {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0 0 14px;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--ok-soft);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .if-done.warn {
    background: var(--warn-soft);
  }
  .if-done :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .if-recent {
    margin: 0 0 16px;
    padding: 14px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .if-recent h2 {
    margin: 0 0 6px;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .if-recent ul {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .if-recent li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .if-recent li :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--hi);
  }
  .if-recent b {
    font-weight: 600;
  }
  .if-recent small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .if-grid {
    display: grid;
    gap: 16px;
    align-items: start;
  }
  @media (min-width: 900px) {
    .if-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 719px) {
    .if-row {
      flex-direction: column;
    }
  }
  @media (pointer: coarse) {
    .if-chip {
      min-height: 44px;
    }
  }
</style>
