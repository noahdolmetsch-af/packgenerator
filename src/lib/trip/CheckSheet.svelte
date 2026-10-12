<script>
  /**
   * v0.111.0 Vorabend-Check (mockup V2, Noah «v1-v4 ok» 12.10.2026 22:34) and Schluss-Check (mockup V6,
   * «v5-6 ok» 22:39): the trip's check as a sheet like the charge list (T8). On top the title, one line
   * and the chips the app knows (weather, route; back on, notes, debrief waiting), «2 von 8 erledigt» with
   * a bar, the rows with icon, a quiet line, a link (SLF, MeteoSchweiz, Ladeliste) and a round tick.
   * The evening before: what was missing on an earlier trip of this type, «Dazu» adds it as a row.
   * At the bottom «Liste anpassen» (CheckEdit), «Später» and «Fertig» (after the trip: «Fertig, zum Rückblick»).
   * Everything is a suggestion: nothing must be ticked.
   */
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { domainOf, domainName } from '../domains.js';
  import { checkOf, checkCount, toggleCheck, addCheck, missedBefore } from '../checks.js';
  import { chargeList, chargeCount } from '../charge.js';
  import { checkIcon } from './checkicons.js';
  import { checkHint, checkLink, checkChips, shortDay } from './checkhints.js';
  import { backClose } from '../ui/backclose.js';
  import { openTrip } from '../nav.js';
  import { daysFrom } from '../phase.js';
  import { localDay } from '../localday.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { X, Check, ArrowUpRight, BookOpen, Plus, TriangleAlert, Ellipsis, Sun, Route, NotebookPen } from '@lucide/svelte';
  import './trip.css';

  let { trip, kind = 'eve', items = [], trips = [], debriefs = [], standard = null, notes = 0, debriefDone = false, debriefHref = '', onedit, onclose } = $props();

  let dlg;
  $effect(() => {
    dlg.showModal();
  });
  const close = () => dlg?.open && dlg.close();

  const domain = $derived(domainOf(trip));
  const area = $derived(t(domainName(domain)));
  const list = $derived(checkOf(trip, kind, standard));
  const count = $derived(checkCount(list));
  const charged = $derived(kind === 'eve' ? chargeCount(trip, chargeList(trip, items)) : null);
  const chips = $derived(checkChips(kind, { trip, notes, debriefDone }));
  const CHIP_ICON = { wx: Sun, route: Route, notes: NotebookPen, debrief: BookOpen };
  const learn = $derived(kind === 'eve' ? (missedBefore(trips, debriefs, domain, list, { except: trip.id })[0] ?? null) : null);
  const outLinks = $derived(list.map((r) => checkLink(r, kind)).filter((l) => l?.out));
  const hid = $derived(`cs-${kind}-h`);

  const when = $derived.by(() => {
    if (kind === 'after') return trip.finished ? t('back since {day}', { day: shortDay(trip.finished) }) : '';
    if (!trip.startDate) return '';
    const day = new Date(`${trip.startDate}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
    const until = daysFrom(localDay(), trip.startDate);
    return until === 0 ? t('today, {day}', { day }) : until === 1 ? t('tomorrow, {day}', { day }) : day;
  });
  const sub = $derived([`${area} ${trip.title}`, when].filter(Boolean).join(' · '));

  // read and written in one go, so quick taps are never lost (like the charge list)
  const save = (fn) =>
    db.transaction('rw', db.trips, async () => {
      const cur = await db.trips.get(trip.id);
      if (cur) await db.trips.update(trip.id, touched({ [kind]: fn(checkOf(cur, kind, standard)) }));
    });
  const tick = (id) => save((l) => toggleCheck(l, id));
  const takeLearn = (name) => save((l) => addCheck(l, t('Pack {name}', { name })));
  // «Liste anpassen»: this sheet closes, then the page opens the editor (one history entry, backclose.js)
  let next = null;
  const edit = () => {
    next = 'edit';
    close();
  };
  // after the trip: on to the debrief (the address changes first, so the back entry stays out of the way)
  const done = () => {
    if (kind === 'after' && debriefHref) {
      openTrip(trip.id);
      location.hash = debriefHref;
    }
    close();
  };
</script>

<dialog class="sheet from-below cks" bind:this={dlg} use:backClose onclose={() => (next === 'edit' ? onedit?.() : onclose?.())} onclick={(e) => e.target === dlg && close()} aria-labelledby={hid} data-check-sheet={kind}>
  <header class="hd">
    <div class="tt">
      <h2 id={hid}>{kind === 'eve' ? t('Evening-before check') : t('After-trip check')}</h2>
      <p class="sub">{sub}</p>
    </div>
    <button type="button" class="x" aria-label={t('Close the window')} onclick={close}><X size={20} aria-hidden="true" /></button>
  </header>

  {#if chips.length}
    <ul class="chips" aria-label={t('What the app knows about this trip')}>
      {#each chips as c (c.key)}{@const I = CHIP_ICON[c.key] ?? Check}<li><I size={14} aria-hidden="true" />{c.text}</li>{/each}
    </ul>
  {/if}

  {#if list.length}
    <p class="prog"><b class="num" data-count>{t('{done} of {n} done', { done: count.done, n: count.total })}</b><span class="bar" aria-hidden="true"><i style:width="{count.total ? (count.done / count.total) * 100 : 0}%"></i></span></p>
    <ul class="rows">
      {#each list as r (r.id)}
        {@const I = checkIcon(r.id, kind)}
        {@const hint = checkHint(r, kind, { trip, charged })}
        {@const link = checkLink(r, kind)}
        <li class:dn={r.done} class:haslink={!!link}>
          <label class="lb" for="ck-{kind}-{r.id}">
            <span class="ib" aria-hidden="true"><I size={18} /></span>
            <span class="tx"><span class="nm">{t(r.label)}</span>{#if hint}<small>{hint}</small>{/if}</span>
          </label>
          {#if link}
            <a class="lnk" href={link.href} target={link.out ? '_blank' : undefined} rel={link.out ? 'noopener noreferrer' : undefined} onclick={() => !link.out && openTrip(trip.id)}><span class="pl">{t(link.label)}<ArrowUpRight size={13} aria-hidden="true" /></span></a>
          {/if}
          <span class="ckw"><input id="ck-{kind}-{r.id}" class="ck" type="checkbox" checked={r.done} onchange={() => tick(r.id)} /><Check class="ckm" size={15} strokeWidth={2.5} aria-hidden="true" /></span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="empty">{t('Empty. Add what you want to remember.')}</p>
  {/if}

  {#if learn}
    <div class="learn">
      <span class="lib" aria-hidden="true"><BookOpen size={18} /></span>
      <span class="tx"><span class="nm">{t('From your debrief of {day}', { day: shortDay(learn.at) })}</span><small>{learn.n > 1 ? tn(learn.n, '«{name}» was missing {n} time · add it as a row?', '«{name}» was missing {n} times · add it as a row?', { name: learn.name }) : t('«{name}» was missing · add it as a row?', { name: learn.name })}</small></span>
      <button type="button" class="btn" onclick={() => takeLearn(learn.name)}><Plus size={15} aria-hidden="true" />{t('Add|row')}</button>
    </div>
  {/if}
  {#if outLinks.length}
    <p class="hint"><TriangleAlert size={15} aria-hidden="true" /><span>{list.some((r) => r.id === 'bulletin') ? t('The app does not read the bulletin, it only opens the page.') : t('The app does not read these pages, it only opens them.')}</span></p>
  {/if}

  <div class="foot">
    <button type="button" class="tp-link edit" onclick={edit}><Ellipsis size={15} aria-hidden="true" />{t('Adjust the list')}</button>
    <span class="bt">
      <button type="button" class="btn" onclick={close}>{t('Later')}</button>
      <button type="button" class="btn hi" onclick={done}>{kind === 'after' && debriefHref ? t('Done, to the debrief') : t('Done')}</button>
    </span>
  </div>
</dialog>

<style>
  .cks {
    width: min(640px, calc(100vw - 24px));
    padding: 20px;
  }
  .hd {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }
  .tt {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-section) / 1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .sub {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
  }
  .chips li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .prog {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 2px 10px;
  }
  .prog b {
    flex: none;
    font-weight: 600;
  }
  .bar {
    flex: 1;
    height: 6px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--hi);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 4px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 8px 0;
  }
  .rows li + li {
    border-top: 1px solid var(--line);
  }
  .lb {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }
  .ib,
  .lib {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .tx {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
  }
  .tx small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.35;
  }
  .dn .nm {
    color: var(--ink-3);
  }
  .dn .ib {
    background: var(--hi-soft);
    color: var(--hi);
  }
  /* the link: a 44 px tap area with a small pill inside */
  .lnk {
    flex: none;
    display: inline-flex;
    align-items: center;
    min-width: 44px;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
  }
  .pl {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid var(--line);
    border-radius: 99px;
    font-size: var(--fs-small);
    font-weight: 500;
    white-space: nowrap;
  }
  .ckw {
    position: relative;
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
  }
  .ck {
    appearance: none;
    width: 26px;
    height: 26px;
    margin: 0;
    border: 1.8px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper);
    cursor: pointer;
  }
  .ck:checked {
    background: var(--hi);
    border-color: var(--hi);
  }
  .ck:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .ckw :global(.ckm) {
    position: absolute;
    color: var(--hi-ink);
    pointer-events: none;
    opacity: 0;
  }
  .ck:checked + :global(.ckm) {
    opacity: 1;
  }
  .empty {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .learn {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-card);
    background: var(--hi-soft);
  }
  .learn .lib {
    background: var(--paper);
    color: var(--hi);
  }
  .learn .btn {
    flex: none;
  }
  .hint {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 10px 0 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
  }
  .foot .edit {
    margin-right: auto;
  }
  .foot .bt {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-left: auto;
  }
  /* a phone: the link under the words, the tick on the right over both lines (V2, V6 at 390 px) */
  @media (max-width: 719px) {
    .cks {
      padding: 18px 16px;
    }
    .rows li.haslink {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 44px;
      column-gap: 12px;
      row-gap: 4px;
    }
    .rows li.haslink .lb {
      grid-column: 1;
      grid-row: 1;
    }
    .rows li.haslink .lnk {
      grid-column: 1;
      grid-row: 2;
      justify-self: start;
      margin-left: 46px;
    }
    .rows li.haslink .ckw {
      grid-column: 2;
      grid-row: 1 / span 2;
    }
  }
</style>
