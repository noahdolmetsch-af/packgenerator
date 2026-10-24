<script>
  /**
   * Paket P4 «Aktiv» (mockups TN1, TN2, TN4, TN5; Noah 21.10.2026 «alle offenen Mockups freigegeben», 5b: only
   * for tennis): the top of the tennis page, above the blocks.
   *   Cover photo (TN4, optional) with the week; «Heute abhaken»: [Gespielt] [Lektion gegeben] and «Wie letztes
   *   Mal» in one tap; «Gespielt?» after a planned time (TN5); «Geplant»: the next time on the court,
   *   [Platz buchen] (opens your booking app or page) and [Zeit eintragen]; Verlauf: three numbers and the
   *   last entries. A game played also ticks Tennis in Aktiv. Rules: lib/tennisday.js.
   * Not built from TN1/TN3 (said in the delivery note): the page «Weitergeben» with templates and groups,
   * the milestones on this page (they stay under Aktiv › Meilensteine).
   */
  import { liveQuery } from 'dexie';
  import { Camera, Check, Plus, CalendarPlus, ExternalLink, Pencil, Trash2, GraduationCap, RotateCcw, ImagePlus, Link } from '@lucide/svelte';
  import { db } from '../db.js';
  import { tick, removeEntry, putEntry } from '../flowdb.js';
  import { putItem, patchItem, dropItems, restoreItems } from '../sportsdb.js';
  import { TENNIS_KEY, tennisOf, lastPlayed, playDraft, cleanPlayed, cleanSlot, nextSlot, askSlot, tennisStats, recentTennis, labelOf, PLAY_TYPES, COURTS, RESULTS, safeUrl } from '../tennisday.js';
  import { addDays } from '../flow.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { dayShort, wd } from '../flow/words.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import PlayedSheet from './PlayedSheet.svelte';
  import CoverSheet from './CoverSheet.svelte';
  import SlotSheet from './SlotSheet.svelte';

  let { sport, items = [], log = [], act = null, today } = $props();

  const cfgQ = liveQuery(() => db.settings.get(TENNIS_KEY));
  const cfg = $derived(tennisOf($cfgQ?.value));
  const nowHM = () => new Date().toTimeString().slice(0, 5);
  let now = $state(nowHM());
  $effect(() => {
    const id = setInterval(() => (now = nowHM()), 60_000);
    return () => clearInterval(id);
  });

  const last = $derived(lastPlayed(items));
  const next = $derived(nextSlot(items, today, now));
  const ask = $derived(askSlot(items, today, now, addDays(today, -7)));
  const stats = $derived(tennisStats(items, log, today));
  const recent = $derived(recentTennis(items, 5));
  const playedToday = $derived(items.some((x) => x.sport === sport.id && x.kind === 'played' && x.day === today));
  const week = $derived(new Set(log.filter((e) => e.actId === 'tennis' && e.day > addDays(today, -7) && e.day <= today).map((e) => e.day)).size);
  const goal = $derived(act?.goals?.[0] ?? null);

  const typeName = (k) => t(labelOf(PLAY_TYPES, k));
  const courtName = (k) => t(labelOf(COURTS, k));
  const lastLine = $derived(last ? [typeName(last.type), t('{n} min', { n: last.min }), courtName(last.court)].join(' · ') : '');
  const dayLine = (d) => (d === today ? t('today') : d === addDays(today, 1) ? t('tomorrow') : d === addDays(today, -1) ? t('yesterday') : `${wd(d)} ${dayShort(d)}`);

  let sheet = $state(null); // { mode: 'played' | 'taught', start, id?, slotId? }
  let slotForm = $state(null); // { mode: 'slot' | 'book', start, id? }
  let coverOpen = $state(false);

  const saveCfg = (patch) => db.settings.put({ key: TENNIS_KEY, value: JSON.parse(JSON.stringify({ ...cfg, ...patch })) }).catch(saveFailed);

  /** A game played: the entry, the tick in Aktiv and, from a planned time, its answer; with Undo. */
  async function savePlayed(form, { id = null, slotId = null } = {}) {
    const rec = cleanPlayed(form, today);
    try {
      if (id) {
        const old = items.find((x) => x.id === id);
        await patchItem(id, rec);
        if (old?.flowId) {
          const e = await db.flowLog.get(old.flowId);
          if (e) await putEntry(db, { ...e, day: rec.day, min: rec.min });
        }
        offerDone(t('Saved.'));
        return;
      }
      const e = act ? await tick(db, act, { day: rec.day, min: rec.min, via: 'tennis' }) : null;
      const item = await putItem({ ...rec, ...(e ? { flowId: e.id } : {}) });
      if (slotId) await patchItem(slotId, { answer: 'played' });
      offerDone(t('Tennis noted. It counts in Aktiv too.'), async () => {
        await dropItems([item.id]);
        if (e) await removeEntry(db, e.id);
        if (slotId) await patchItem(slotId, { answer: null });
      });
    } catch (err) {
      saveFailed(err);
    }
  }
  async function saveTaught(form, { id = null } = {}) {
    const rec = { sport: sport.id, kind: 'taught', day: form.day || today, min: Math.max(5, Math.round(Number(form.min) || 60)), note: String(form.note ?? '').trim().slice(0, 300) };
    try {
      if (id) await patchItem(id, rec);
      else {
        const item = await putItem(rec);
        offerDone(t('Lesson noted.'), () => dropItems([item.id]));
      }
    } catch (err) {
      saveFailed(err);
    }
  }
  const likeLast = () => savePlayed({ ...playDraft(items, today), result: 'none' });
  const openPlayed = (slot = null) => (sheet = { mode: 'played', start: slot ? { ...playDraft(items, today), day: slot.day, min: slot.min, court: slot.court } : playDraft(items, today), slotId: slot?.id ?? null });
  const openTaught = () => (sheet = { mode: 'taught', start: { day: today, min: 60, note: '' } });
  function editEntry(x) {
    sheet = x.kind === 'taught' ? { mode: 'taught', start: { day: x.day, min: x.min, note: x.note ?? '' }, id: x.id } : { mode: 'played', start: { day: x.day, type: x.type, min: x.min, court: x.court, result: x.result, worked: x.worked ?? '' }, id: x.id };
  }
  const onSheet = (form) => (sheet.mode === 'taught' ? saveTaught(form, { id: sheet.id }) : savePlayed(form, { id: sheet.id, slotId: sheet.slotId }));

  async function skipSlot(s) {
    try {
      await patchItem(s.id, { answer: 'skipped' });
      offerDone(t('Noted: not played.'), () => patchItem(s.id, { answer: null }));
    } catch (err) {
      saveFailed(err);
    }
  }
  const openSlot = (s = null) => (slotForm = { mode: 'slot', id: s?.id ?? null, start: s ? { day: s.day, time: s.time, min: s.min, court: s.court } : { day: addDays(today, 1), time: '18:00', min: 60, court: last?.court ?? 'clay' } });
  const openBook = () => (slotForm = { mode: 'book', start: { bookUrl: cfg.bookUrl, bookName: cfg.bookName } });
  async function onSlot(form) {
    if (slotForm.mode === 'book') return saveCfg({ bookUrl: safeUrl(form.bookUrl), bookName: String(form.bookName ?? '').trim().slice(0, 60) });
    const rec = cleanSlot(form, today);
    try {
      if (slotForm.id) await patchItem(slotForm.id, rec);
      else await putItem(rec);
    } catch (err) {
      saveFailed(err);
    }
  }
  async function delEntry(x) {
    const name = x.kind === 'slot' ? `${dayLine(x.day)} ${x.time}` : `${x.kind === 'taught' ? t('Lesson given') : typeName(x.type)} · ${dayLine(x.day)}`;
    const text = x.kind === 'played' && x.flowId ? t('The tick in Aktiv goes too.') : t('Only this entry goes.');
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text })) !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const e = x.flowId ? await db.flowLog.get(x.flowId) : null;
        const recs = await dropItems([x.id]);
        if (e) await removeEntry(db, e.id);
        return { recs, e };
      },
      undo: async ({ recs, e }) => {
        await restoreItems(recs);
        if (e) await putEntry(db, e);
      },
      text: t('"{name}" deleted.', { name }),
      name,
    });
  }
  const resultName = (k) => (k && k !== 'none' ? t(labelOf(RESULTS, k)) : '');
</script>

<section class="tn-hero" class:has={!!cfg.cover} aria-labelledby="tn-hero-h" data-tennis-top>
  {#if cfg.cover}<img class="tn-img" src={cfg.cover} alt="" style:object-position="50% {cfg.y}%" data-tennis-cover />{/if}
  <div class="tn-over">
    <h2 id="tn-hero-h">{t('Tennis')}</h2>
    <p class="num">{goal ? t('{n} of {goal} in the last 7 days', { n: week, goal: goal.count }) : tn(week, '{n} day in the last 7 days', '{n} days in the last 7 days')}{#if last}{' · '}{courtName(last.court)}{/if}</p>
  </div>
  <button type="button" class="tn-cam" aria-label={cfg.cover ? t('Change the cover photo') : t('Add a cover photo')} onclick={() => (coverOpen = true)} data-cover-edit>{#if cfg.cover}<Camera size={20} aria-hidden="true" />{:else}<ImagePlus size={20} aria-hidden="true" />{/if}</button>
</section>

{#if ask}
  <section class="card tn-ask" aria-labelledby="tn-ask-h" data-tennis-ask>
    <h2 id="tn-ask-h">{t('{day} {time} booked · Played?', { day: dayLine(ask.day), time: ask.time })}</h2>
    <p class="small">{t('{min} min · {court}', { min: ask.min, court: courtName(ask.court) })}</p>
    <div class="tn-acts">
      <button type="button" class="btn hi" onclick={() => openPlayed(ask)} data-ask-yes><Check size={18} aria-hidden="true" />{t('Yes, played')}</button>
      <button type="button" class="btn" onclick={() => skipSlot(ask)} data-ask-no>{t('Not played')}</button>
    </div>
  </section>
{/if}

<section class="card" aria-labelledby="tn-today-h" data-tennis-today>
  <div class="hl"><h2 id="tn-today-h">{t('Tick off today')}</h2>{#if playedToday}<span class="tn-done small"><Check size={15} aria-hidden="true" />{t('played today')}</span>{/if}</div>
  <div class="tn-acts">
    <button type="button" class="btn hi" onclick={() => openPlayed()} data-tennis-played><Plus size={18} aria-hidden="true" />{t('Played')}</button>
    <button type="button" class="btn" onclick={openTaught} data-tennis-taught><GraduationCap size={18} aria-hidden="true" />{t('Lesson given')}</button>
  </div>
  {#if last}
    <button type="button" class="chip tn-like" onclick={likeLast} data-tennis-like><RotateCcw size={15} aria-hidden="true" />{t('Like last time: {line}', { line: lastLine })}</button>
  {/if}
</section>

<section class="card" aria-labelledby="tn-plan-h" data-tennis-plan>
  <div class="hl"><h2 id="tn-plan-h">{t('Planned|tennis')}</h2></div>
  {#if next}
    <div class="tn-slot" data-tennis-next>
      <span class="tn-when"><b>{dayLine(next.day)} {next.time}</b><small>{t('{min} min · {court}', { min: next.min, court: courtName(next.court) })}</small></span>
      <button type="button" class="ibtn" aria-label={t('Change «{name}»', { name: `${dayLine(next.day)} ${next.time}` })} onclick={() => openSlot(next)}><Pencil size={16} aria-hidden="true" /></button>
      <button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name: `${dayLine(next.day)} ${next.time}` })} onclick={() => delEntry(next)}><Trash2 size={16} aria-hidden="true" /></button>
    </div>
  {:else}
    <p class="none">{t('Nothing planned. Booked a court? Enter the time.')}</p>
  {/if}
  <div class="tn-acts">
    {#if cfg.bookUrl}
      <a class="btn" href={cfg.bookUrl} target="_blank" rel="noopener noreferrer" data-tennis-book><ExternalLink size={16} aria-hidden="true" />{cfg.bookName ? t('Book a court in {name}', { name: cfg.bookName }) : t('Book a court')}</a>
    {:else}
      <button type="button" class="btn" onclick={openBook} data-tennis-book-set><Link size={16} aria-hidden="true" />{t('Set the booking link')}</button>
    {/if}
    <button type="button" class="btn" onclick={() => openSlot()} data-tennis-slot><CalendarPlus size={16} aria-hidden="true" />{t('Enter a time')}</button>
  </div>
  <p class="small">{t('On the day the app asks «Played?».')}{#if cfg.bookUrl}{' '}<button type="button" class="lnk" onclick={openBook}>{t('Change the booking link')}</button>{/if}</p>
</section>

<section class="card" aria-labelledby="tn-log-h" data-tennis-log>
  <div class="hl"><h2 id="tn-log-h">{t('History|tennis')}</h2></div>
  <div class="tn-stats">
    <div><b class="num">{stats.month}</b><small>{t('played this month')}</small></div>
    <div><b class="num">{stats.taught}</b><small>{t('lessons this month')}</small></div>
    <div><b class="num">{num(stats.hours)}</b><small>{t('h on the court this year')}</small></div>
  </div>
  {#if recent.length}
    <ul class="ilist">
      {#each recent as x (x.id)}
        {@const name = x.kind === 'taught' ? t('Lesson given') : typeName(x.type)}
        <li data-tennis-entry={x.kind}>
          <div class="ent" style="flex-direction:column;align-items:flex-start">
            <b>{name}{#if resultName(x.result)}{' · '}{resultName(x.result)}{/if}</b>
            <small>{dayLine(x.day)} · {t('{n} min', { n: x.min })}{#if x.kind === 'played'}{' · '}{courtName(x.court)}{/if}</small>
            {#if x.worked || x.note}<small>{x.worked || x.note}</small>{/if}
          </div>
          <button type="button" class="ibtn" aria-label={t('Change «{name}»', { name: `${name} · ${dayLine(x.day)}` })} onclick={() => editEntry(x)}><Pencil size={16} aria-hidden="true" /></button>
          <button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name: `${name} · ${dayLine(x.day)}` })} onclick={() => delEntry(x)}><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="none">{t('Nothing yet. «Played» notes a game, «Lesson given» a lesson you gave.')}</p>
  {/if}
</section>

{#if sheet}<PlayedSheet start={sheet.start} mode={sheet.mode} onsave={onSheet} onclose={() => (sheet = null)} />{/if}
{#if slotForm}<SlotSheet start={slotForm.start} mode={slotForm.mode} onsave={onSlot} onclose={() => (slotForm = null)} />{/if}
{#if coverOpen}<CoverSheet cover={cfg.cover} y={cfg.y} onsave={(v) => saveCfg(v)} onclose={() => (coverOpen = false)} />{/if}

<style>
  .tn-hero {
    position: relative;
    overflow: hidden;
    min-height: 120px;
    border: 1px solid var(--card-line);
    border-left: 6px solid var(--sc, var(--line));
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .tn-hero.has {
    min-height: 170px;
  }
  .tn-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .tn-over {
    position: absolute;
    left: 0;
    right: 56px;
    bottom: 0;
    padding: 14px 16px;
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .tn-hero.has .tn-over {
    right: 0;
    padding-right: 64px;
    background: linear-gradient(to top, var(--scrim), transparent);
    color: var(--paper);
  }
  .tn-over h2 {
    margin: 0;
    font: 700 var(--fs-section) / 1.2 var(--font-body);
    color: inherit;
  }
  .tn-over p {
    margin: 2px 0 0;
    font-size: var(--fs-small);
  }
  .tn-cam {
    position: absolute;
    right: 10px;
    bottom: 10px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .tn-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 0;
  }
  .tn-acts .btn {
    min-height: 44px;
    text-decoration: none;
  }
  .tn-like {
    margin-top: 10px;
    min-height: 44px;
    overflow-wrap: break-word;
    text-align: left;
  }
  .tn-done {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .tn-ask {
    border-color: var(--accent);
  }
  .tn-ask h2 {
    overflow-wrap: break-word;
  }
  .tn-slot {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 8px 0 0;
  }
  .tn-when {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
  }
  .tn-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 10px 0;
  }
  .tn-stats div {
    display: flex;
    flex-direction: column;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--paper-2);
    overflow-wrap: break-word;
  }
  .tn-stats b {
    font-size: var(--fs-section);
  }
</style>
