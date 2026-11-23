<script>
  /**
   * «Touren-Liste aufräumen» (Noah 23.11.2026): Touren › Übersicht › «Doppelte prüfen». Trips with the same name,
   * day, length and bike are suggested for joining. Per group one trip stays (the app suggests the one with a
   * Rückblick and the most packed things; the choice is free), the others are archived, not deleted: «Wieder
   * trennen» puts them back as they were, here, at any time (aufraeumen.js, aufraeumendb.js).
   * Nothing is joined by itself; every group can be left out. Back closes only this sheet.
   */
  import { liveQuery } from 'dexie';
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { dates } from '../review/fmt.js';
  import { findDoubles, joinedGroups } from './aufraeumen.js';
  import { joinDoubles, splitDoubles } from './aufraeumendb.js';
  import { Archive, Check } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { onclose } = $props();
  let dialog = $state();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const q = liveQuery(async () => ({ trips: await db.trips.toArray(), debriefs: await db.debriefs.toArray() }));
  const groups = $derived($q ? findDoubles($q.trips, $q.debriefs) : []);
  const joined = $derived($q ? joinedGroups($q.trips) : []);
  let keep = $state({}); // group key → the id that stays (default: the suggestion)
  let off = $state(new Set()); // group keys left out
  let busy = $state(false);
  const keepOf = (g) => keep[g.key] ?? g.keep;
  const picks = $derived(groups.filter((g) => !off.has(g.key)).map((g) => ({ group: $state.snapshot(g), keepId: keepOf(g) })));
  const nExtra = $derived(picks.reduce((s, p) => s + p.group.members.length - 1, 0));
  const when = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const what = (m) => [m.rated ? t('Debrief written') : '', m.entries ? tn(m.entries, '{done} of {n} packed', '{done} of {n} packed', { done: m.packed }) : t('empty list')].filter(Boolean).join(' · ');
  const toggle = (k) => {
    const next = new Set(off);
    next.has(k) ? next.delete(k) : next.add(k);
    off = next;
  };

  async function join() {
    busy = true;
    try {
      const ids = await joinDoubles(db, picks);
      offerDone(tn(ids.length, '{n} trip joined.', '{n} trips joined.'), () => splitDoubles(db, ids));
    } finally {
      busy = false;
    }
  }
  async function split(g) {
    busy = true;
    try {
      const ids = [...g.ids];
      const n = await splitDoubles(db, ids);
      offerDone(tn(n, '{n} trip is back.', '{n} trips are back.'), async () => {
        const again = findDoubles(await db.trips.toArray(), await db.debriefs.toArray()).find((x) => x.members.some((m) => ids.includes(m.id)));
        if (again) await joinDoubles(db, [{ group: again, keepId: g.keepId }]);
      });
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet tdsheet vdlg" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="dp-h" data-doubles-sheet>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="dp-h">{t('Doubled trips')}</h2>
      {#if groups.length}<p class="vd-sub">{t('Same name, day, length and bike. Pick the one that stays; the others are hidden, not deleted.')}</p>{/if}
    </div>
  </div>
  {#if !$q}
    <p class="lead">{t('Loading…')}</p>
  {:else}
    {#if groups.length}
      <ul class="groups" data-doubles>
        {#each groups as g (g.key)}
          <li class="grp" class:off={off.has(g.key)} data-double={g.key}>
            <div class="gh">
              <button type="button" class="check" class:on={!off.has(g.key)} role="checkbox" aria-checked={!off.has(g.key)} aria-label={t('Join «{name}»', { name: g.title })} onclick={() => toggle(g.key)}>{#if !off.has(g.key)}<Check size={16} aria-hidden="true" />{/if}</button>
              <div class="gt"><b>{g.title}</b><small>{[dates(g.start), g.bike, tn(g.members.length, '{n} time', '{n} times')].filter(Boolean).join(' · ')}</small></div>
            </div>
            <ul class="mem" role="radiogroup" aria-label={t('Which one stays')}>
              {#each g.members as m (m.id)}
                <li>
                  <label>
                    <input type="radio" name={`keep-${g.key}`} checked={keepOf(g) === m.id} onchange={() => (keep = { ...keep, [g.key]: m.id })} />
                    <span><b>{keepOf(g) === m.id ? t('Stays') : t('Hidden')}</b> <small>{[when(m.createdAt), what(m)].filter(Boolean).join(' · ')}</small></span>
                  </label>
                </li>
              {/each}
            </ul>
          </li>
        {/each}
      </ul>
      <div class="vd-note"><Archive size={16} aria-hidden="true" /><span><b>{t('Hidden, not deleted')}</b> {t('The hidden ones no longer count on the list and for learning. «Take doubles apart» brings them back, here, at any time.')}</span></div>
    {:else}
      <p class="lead" data-no-doubles>{t('No doubled trips found.')}</p>
    {/if}
    {#if joined.length}
      <h3 class="jh">{t('Already joined')}</h3>
      <ul class="done" data-joined>
        {#each joined as g (g.keepId)}
          <li><span><b>{g.title}</b> <small>{tn(g.ids.length, '{n} hidden', '{n} hidden')}</small></span><button type="button" class="btn" disabled={busy} onclick={() => split(g)} aria-label="{t('Take doubles apart')}: {g.title}">{t('Take doubles apart')}</button></li>
        {/each}
      </ul>
    {/if}
  {/if}
  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button>
    {#if groups.length}
      <button type="button" class="btn hi" disabled={busy || !nExtra} onclick={join} data-join-doubles>{tn(nExtra, 'Join: hide {n} trip', 'Join: hide {n} trips')}</button>
    {/if}
  </div>
</dialog>

<style>
  .lead {
    margin: 0;
    color: var(--ink-2);
  }
  .groups,
  .mem,
  .done {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .groups {
    display: grid;
    gap: 12px;
  }
  .grp {
    padding: 4px 12px 8px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .grp.off .mem {
    opacity: 0.5;
  }
  .gh {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 56px;
  }
  .gt {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .gt small,
  .mem small,
  .done small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mem {
    padding-left: 52px;
  }
  .mem label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 44px;
    padding: 6px 0;
  }
  .mem input {
    flex: none;
    width: 20px;
    height: 20px;
    margin-top: 2px;
  }
  .mem span {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .check {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    position: relative;
    color: var(--paper);
  }
  .check :global(svg) {
    position: relative;
    z-index: 1;
  }
  .check::after {
    content: '';
    position: absolute;
    inset: 11px;
    border: 1.5px solid var(--line-strong);
    border-radius: 6px;
    background: var(--paper);
  }
  .check.on::after {
    border-color: var(--ink);
    background: var(--ink);
  }
  .jh {
    margin: 16px 0 4px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .done li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
    padding: 4px 0;
  }
  .done span {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .vd-note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .vd-note b {
    color: var(--ink);
    font-weight: 600;
  }
</style>
