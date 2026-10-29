<script>
  /**
   * Mini-Tools (Noah 28.10.2026 «idee: mini tools …», answers «1b 2a 3a», ideas 1, 2, 4, 5, 7, 9, 10):
   * Ich › Mini-Tools (#/me/mini). Small tools to ask a group by link, without an account; the answers come
   * back by themselves (sealed, only this device can read them) and the app counts them (no AI, «3a»).
   * The first tool: «Find a date» (idea 1, like Doodle). #/me/mini/neu makes one, #/me/mini/<id> is one question.
   * The second: «Mini survey» (idea 2), #/me/mini/umfrage makes one (lib/mini/PollNew.svelte), its result is
   * lib/mini/PollResult.svelte. The third: «Sign-up list» (idea 4), #/me/mini/liste (ListNew, ListResult).
   * The others follow as their own small PRs on the same store (lib/mini/client.js, api/_lib/mini.js).
   */
  import { untrack } from 'svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, locale } from '../lib/i18n.svelte.js';
  import { localDay } from '../lib/localday.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import QrCode from '../lib/ich/QrCode.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { ME_KEY } from '../lib/freunde/freunde.js';
  import { newTrip } from '../lib/trips.js';
  import { openTrip } from '../lib/nav.js';
  import { createQuestion, editQuestion, readAnswers, endQuestion, joinLinkOf, MINI_ERRORS } from '../lib/mini/client.js';
  import { MINE_KEY, listOf, readMine, saveMine, updateOne, running } from '../lib/mini/store.js';
  import PollNew from '../lib/mini/PollNew.svelte';
  import PollResult from '../lib/mini/PollResult.svelte';
  import { KIND_POLL, pollQuestion, countPoll, summarize } from '../lib/mini/poll.js';
  import ListNew from '../lib/mini/ListNew.svelte';
  import ListResult from '../lib/mini/ListResult.svelte';
  import { KIND_LIST, listQuestion } from '../lib/mini/liste.js';
  import { KIND_DATE, OPTS_MIN, OPTS_MAX, PICKS, dateQuestion, cleanOpts, optKey, tally, busyDays, nextDays, summaryLines, icsOf } from '../lib/mini/termin.js';
  import { CalendarCheck, Plus, ChevronRight, Share2, Copy, QrCode as QrIcon, RefreshCw, CalendarPlus, Route, MessageCircle, Pencil, Trash2, CircleStop, Lock, ListChecks, ClipboardList } from '@lucide/svelte';

  let { hash = '' } = $props();
  const sub = untrack(() => String(hash).replace(/^#\/me\/mini\/?/, '').split('?')[0]);
  const isNew = sub === 'neu';
  const isNewPoll = sub === 'umfrage';
  const isNewList = sub === 'liste';
  const openId = !isNew && !isNewPoll && !isNewList && sub ? decodeURIComponent(sub) : '';

  const mineQ = liveQuery(() => db.settings.get(MINE_KEY));
  const mine = $derived(listOf($mineQ?.value));
  const loaded = $derived($mineQ !== undefined);
  const today = localDay();

  const DAYS_OPEN = [7, 14, 30, 60];
  const dayFmt = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' });
  const optFmt = (o) => `${dayFmt(o.d)}${o.t ? ` ${o.t}` : ''}`;
  const endFmt = (iso) => new Date(iso).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'Europe/Zurich' });
  const errText = (e) => t(MINI_ERRORS[e?.code] ?? MINI_ERRORS.server_error);

  /* ---------- new question ---------- */
  const tripsQ = liveQuery(() => db.trips.toArray());
  const eventsQ = liveQuery(() => db.gEvents.where('day').aboveOrEqual(today).toArray().catch(() => []));
  const busy = $derived(busyDays($tripsQ ?? [], $eventsQ ?? []));
  const meQ = liveQuery(() => db.settings.get(ME_KEY));
  let title = $state('');
  let note = $state('');
  let by = $state('');
  let bySeen = false;
  $effect(() => {
    if (!bySeen && $meQ !== undefined) {
      by = typeof $meQ?.value === 'string' ? $meQ.value : '';
      bySeen = true;
    }
  });
  let picked = $state([]); // [{ d, t }]
  let days = $state(30);
  let formErr = $state('');
  let making = $state(false);
  const pickDays = nextDays(today, 42);
  const isPicked = (d) => picked.some((o) => o.d === d);
  function flip(d) {
    formErr = '';
    if (isPicked(d)) picked = picked.filter((o) => o.d !== d);
    else if (picked.length < OPTS_MAX) picked = cleanOpts([...picked, { d, t: '' }]);
    else formErr = t('At most {n} days.', { n: OPTS_MAX });
  }
  async function make(e) {
    e?.preventDefault?.();
    formErr = '';
    const q = dateQuestion({ title, note, by, opts: picked });
    if (!title.trim()) return (formErr = t('Write a title first, so people know what it is about.'));
    if (!q) return (formErr = t('Pick at least {n} days.', { n: OPTS_MIN }));
    making = true;
    try {
      const srv = await createQuestion(q, { days });
      const rec = { id: `mt-${Date.now().toString(36)}`, kind: KIND_DATE, title: q.title, note: q.note, by: q.by, opts: q.opts, made: new Date().toISOString(), srv, answers: [], me: { picks: {} }, read: null, closed: false };
      await saveMine(db, [rec, ...(await readMine(db))]);
      location.hash = `#/me/mini/${encodeURIComponent(rec.id)}`;
    } catch (err) {
      formErr = errText(err);
    } finally {
      making = false;
    }
  }

  /* ---------- one question ---------- */
  const q = $derived(openId ? (mine.find((x) => x.id === openId) ?? null) : null);
  const isPoll = $derived(q?.kind === KIND_POLL);
  const isList = $derived(q?.kind === KIND_LIST);
  const link = $derived(q?.srv ? joinLinkOf(q.srv.id, q.srv.key) : '');
  const isOpen = $derived(running(q));
  const rows = $derived(q ? [...(q.answers ?? []), ...(Object.keys(q.me?.picks ?? {}).length ? [{ name: t('You'), picks: q.me.picks, me: true }] : [])] : []);
  const result = $derived(q ? tally(q.opts, rows) : { list: [], best: null });
  const bestOpt = $derived(result.best ? q.opts.find((o) => optKey(o) === result.best.key) : null);
  let busyRead = $state(false);
  let readErr = $state('');
  let said = $state('');
  let qr = $state(false);
  let renaming = $state(false);

  async function refresh() {
    if (!q?.srv || !isOpen) return;
    busyRead = true;
    readErr = '';
    try {
      const d = await readAnswers(q.srv);
      const keep = (a) =>
        q.kind === KIND_POLL
          ? { a: a.a, name: q.anon ? '' : String(a.name ?? '').slice(0, 40), r: a.r && typeof a.r === 'object' ? a.r : {}, at: a.at }
          : q.kind === KIND_LIST
          ? { a: a.a, name: String(a.name ?? '').slice(0, 40), note: String(a.note ?? '').slice(0, 120), at: a.at, t0: a.t0 ?? a.at }
          : { a: a.a, name: String(a.name ?? '').slice(0, 40), picks: a.picks ?? {}, note: String(a.note ?? '').slice(0, 200), at: a.at };
      await updateOne(db, q.id, (x) => ({ ...x, answers: d.answers.map(keep), read: new Date().toISOString() }));
    } catch (err) {
      if (err?.code === 'not_found') await updateOne(db, q.id, (x) => ({ ...x, closed: true }));
      readErr = errText(err);
    } finally {
      busyRead = false;
    }
  }
  let readOnce = false;
  $effect(() => {
    if (q && !readOnce) {
      readOnce = true;
      untrack(refresh);
    }
  });

  async function setMine(key, v) {
    await updateOne(db, q.id, (x) => {
      const picks = { ...(x.me?.picks ?? {}) };
      if (picks[key] === v) delete picks[key];
      else picks[key] = v;
      return { ...x, me: { picks } };
    });
  }

  const shareText = $derived(
    !q ? '' : isList ? t('{title}: sign up here, no app and no account needed.', { title: q.title }) : isPoll ? t('{title}: a few short questions. Tap your answers, no app and no account needed.', { title: q.title }) : t('{title}: which day works for you? Tap your answer, no app and no account needed.', { title: q.title }),
  );
  async function share() {
    said = '';
    try {
      if (navigator.share) await navigator.share({ title: q.title, text: shareText, url: link });
      else await copy();
    } catch {
      /* the share window was closed */
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${link}`);
      said = t('Link copied. Paste it into a message.');
    } catch {
      said = t('Copying did not work. Select the link and copy it by hand.');
    }
  }
  const fmtNum = (n) => Number(n).toLocaleString(locale(), { maximumFractionDigits: 1 });
  const resultText = $derived(
    q && isPoll
      ? [q.title, answersText(q.answers?.length ?? 0), ...summarize(countPoll(q, q.answers ?? []), t, fmtNum)].join('\n')
      : q
      ? [
          `${q.title}`,
          bestOpt ? t('Best day: {day}', { day: optFmt(bestOpt) }) : t('No answers yet'),
          ...summaryLines(result, optFmt, { y: t('works'), m: t('maybe'), n: t('does not work'), none: t('no answer yet') }),
        ].join('\n')
      : '',
  );
  const waResult = $derived(`https://wa.me/?text=${encodeURIComponent(resultText)}`);

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function toCalendar() {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    download(`${q.title.replace(/[^\p{L}\d _-]/gu, '').trim() || 'termin'}.ics`, icsOf(q.title, bestOpt, stamp, q.id), 'text/calendar');
    said = t('Calendar file saved. Open it to add the day to your calendar.');
  }
  let tripErr = $state('');
  async function planTrip() {
    tripErr = '';
    const bikes = await db.bikes.toArray();
    if (!bikes.length) return (tripErr = t('Add a bike first (Velos), then the trip can be planned.'));
    const trip = { ...newTrip({ title: q.title, startDate: bestOpt.d, days: 1, bike: bikes[0] }, await db.trips.toArray(), await db.items.toArray()), idea: true, fromMini: q.id };
    await db.trips.put(trip);
    openTrip(trip.id);
    location.hash = '#/pack';
  }

  async function rename(name) {
    const v = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!v) return t('A title is needed.');
    if (isOpen) {
      try {
        await editQuestion(q.srv, q.kind === KIND_LIST ? listQuestion({ ...q, title: v }) : q.kind === KIND_POLL ? pollQuestion({ title: v, note: q.note, by: q.by, anon: q.anon, qs: q.qs }) : dateQuestion({ title: v, note: q.note, by: q.by, opts: q.opts }));
      } catch (err) {
        return errText(err);
      }
    }
    await updateOne(db, q.id, (x) => ({ ...x, title: v }));
    renaming = false;
    offerDone(t('Renamed to «{name}».', { name: v }));
    return undefined;
  }
  async function stop() {
    const a = await askDelete({ title: t('End «{name}»?', { name: q.title }), text: t('The link stops working and the answers are deleted on the server. The result stays here on your device.'), label: t('End now') });
    if (a !== 'delete') return;
    try {
      await endQuestion(q.srv);
    } catch {
      /* offline: the server deletes it by itself on its last day */
    }
    await updateOne(db, q.id, (x) => ({ ...x, closed: true }));
    offerDone(t('Ended. The result stays here.'));
  }
  async function remove() {
    const a = await askDelete({ title: t('Delete «{name}»?', { name: q.title }), text: isOpen ? t('The question and its answers go. The link stops working.') : t('The question and its answers go from this device.') });
    if (a !== 'delete') return;
    const wasOpen = isOpen;
    const ok = await deleteWithUndo({
      name: q.title,
      text: t('«{name}» deleted.', { name: q.title }),
      run: async () => {
        const list = await readMine(db);
        const old = list.find((x) => x.id === q.id);
        await saveMine(db, list.filter((x) => x.id !== q.id));
        return old;
      },
      undo: async (old) => saveMine(db, [{ ...old, closed: old.closed || wasOpen }, ...(await readMine(db)).filter((x) => x.id !== old.id)]),
    });
    if (ok) {
      if (wasOpen) endQuestion(q.srv).catch(() => {});
      location.hash = '#/me/mini';
    }
  }
  function answersText(n) {
    return n === 1 ? t('1 answer') : t('{n} answers', { n });
  }
  const cell = (r, o) => r.picks?.[optKey(o)] ?? '';
  const pickLabel = (k) => t(PICKS.find((p) => p.key === k)?.label ?? 'No answer yet');
</script>

<div class="mt-page ich-page" data-minitools>
  {#if isNew}
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }]} title={t('Find a date')} sub={t('Pick days, share a link, see which day works for most')} />
    <form class="ich-main mt-form" onsubmit={make} data-mt-new>
      <section class="card mt-box">
        <label class="mt-fld"><span>{t('What is it about?')}</span><input type="text" bind:value={title} maxlength="80" placeholder={t('e.g. Weekend trip Jura')} data-mt-title /></label>
        <label class="mt-fld"><span>{t('A note for the others (optional)')}</span><input type="text" bind:value={note} maxlength="200" data-mt-note /></label>
        <label class="mt-fld"><span>{t('Your name for the others')}</span><input type="text" bind:value={by} maxlength="40" autocomplete="given-name" data-mt-by /></label>
      </section>
      <section class="card mt-box" aria-labelledby="mt-days-h">
        <div class="mt-h"><h2 id="mt-days-h">{t('Pick days')}</h2><span class="mt-count" data-mt-count>{t('{n} of at most {max}', { n: picked.length, max: OPTS_MAX })}</span></div>
        <p class="mt-help">{t('Grey days are already busy in your trips or calendar. You can still pick them.')}</p>
        <div class="mt-days" role="group" aria-label={t('Pick days')}>
          {#each pickDays as d (d)}
            <button type="button" class="mt-day" class:on={isPicked(d)} class:busy={busy.has(d)} aria-pressed={isPicked(d)} onclick={() => flip(d)} data-mt-day={d}>
              <b>{dayFmt(d)}</b>{#if busy.has(d)}<small>{t('busy')}</small>{/if}
            </button>
          {/each}
        </div>
        {#if picked.length}
          <ul class="mt-times">
            {#each picked as o, i (o.d)}
              <li><span>{dayFmt(o.d)}</span><label><span class="sr">{t('Time (optional)')}</span><input type="time" bind:value={picked[i].t} aria-label={t('Time (optional) for {day}', { day: dayFmt(o.d) })} data-mt-time={o.d} /></label></li>
            {/each}
          </ul>
          <p class="mt-help">{t('A time is optional. Without one, the whole day counts.')}</p>
        {/if}
      </section>
      <section class="card mt-box">
        <label class="mt-fld"><span>{t('Answers possible for')}</span>
          <select bind:value={days} data-mt-daysopen>
            {#each DAYS_OPEN as n (n)}<option value={n}>{t('{n} days', { n })}</option>{/each}
          </select>
        </label>
        <p class="mt-help"><Lock size={14} aria-hidden="true" /> {t('Only you can read the answers. They are locked on the other person’s device; the server cannot read them and deletes them after these days.')}</p>
      </section>
      {#if formErr}<p class="mt-err" role="alert" data-mt-err>{formErr}</p>{/if}
      <div class="mt-acts"><button type="submit" class="btn hi" disabled={making} data-mt-make><Share2 size={18} aria-hidden="true" />{t('Make the link')}</button><a class="btn btn-link" href="#/me/mini">{t('Cancel')}</a></div>
    </form>
  {:else if isNewPoll}
    <PollNew />
  {:else if isNewList}
    <ListNew />
  {:else if openId}
    {#if !loaded}
      <p class="mt-help">…</p>
    {:else if !q}
      <Empty title={t('Question not found')} text={t('It was deleted on this device.')} action={{ label: t('Mini tools'), href: '#/me/mini' }} />
    {:else}
      <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }]} title={q.title} sub={isOpen ? t('Open for answers until {day}', { day: endFmt(q.srv.end) }) : t('Ended. The result stays here.')} />
      <div class="ich-main">
        {#if isOpen}
          <section class="card mt-box" aria-labelledby="mt-share-h" data-mt-share>
            <h2 id="mt-share-h">{t('Share the link')}</h2>
            <p class="mt-help">{t('Send it to the people you choose. They answer in the browser, without the app and without an account.')}</p>
            <input class="mt-url" readonly value={link} aria-label={t('The link')} data-mt-link onfocus={(e) => e.currentTarget.select()} />
            <div class="mt-acts">
              <button type="button" class="btn hi" onclick={share}><Share2 size={16} aria-hidden="true" />{t('Send')}</button>
              <button type="button" class="btn" onclick={copy} data-mt-copy><Copy size={16} aria-hidden="true" />{t('Copy link')}</button>
              <button type="button" class="btn" aria-pressed={qr} onclick={() => (qr = !qr)}><QrIcon size={16} aria-hidden="true" />{t('QR code')}</button>
            </div>
            {#if qr}<div class="mt-qr"><QrCode text={link} label={t('QR code of the link')} /></div>{/if}
          </section>
        {/if}

        {#if isList}
          <ListResult {q} open={isOpen} />
          {#if isOpen}<div><button type="button" class="btn sm" onclick={refresh} disabled={busyRead} data-mt-refresh><RefreshCw size={16} aria-hidden="true" />{t('Look for new answers')}</button></div>{/if}
          {#if readErr}<p class="mt-err" role="alert" data-mt-readerr>{readErr}</p>{/if}
          {#if said}<p class="mt-help" role="status">{said}</p>{/if}
        {:else if isPoll}
          <PollResult {q} waLink={(q.answers?.length ?? 0) ? waResult : ''} />
          {#if isOpen}<div><button type="button" class="btn sm" onclick={refresh} disabled={busyRead} data-mt-refresh><RefreshCw size={16} aria-hidden="true" />{t('Look for new answers')}</button></div>{/if}
          {#if readErr}<p class="mt-err" role="alert" data-mt-readerr>{readErr}</p>{/if}
          {#if said}<p class="mt-help" role="status">{said}</p>{/if}
        {:else}
        <section class="card mt-box mt-best" aria-labelledby="mt-best-h" data-mt-best>
          <h2 id="mt-best-h">{bestOpt ? t('Best day: {day}', { day: optFmt(bestOpt) }) : t('No answers yet')}</h2>
          <p class="mt-help" data-mt-answers>{answersText(q.answers?.length ?? 0)}{q.read ? ` · ${t('read {time}', { time: new Date(q.read).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) })}` : ''}</p>
          <ul class="mt-bars">
            {#each result.list as c (c.key)}
              {@const total = Math.max(1, rows.length)}
              <li class:top={result.best?.key === c.key}>
                <span class="mt-bl">{optFmt(c)}</span>
                <span class="mt-bar" aria-hidden="true"><b style={`width:${(c.y / total) * 100}%`}></b><i style={`width:${(c.m / total) * 100}%`}></i></span>
                <span class="mt-bn">{t('{y} works, {m} maybe', { y: c.y, m: c.m })}</span>
              </li>
            {/each}
          </ul>
          {#if bestOpt}
            <div class="mt-acts">
              <button type="button" class="btn hi" onclick={planTrip} data-mt-trip><Route size={16} aria-hidden="true" />{t('Plan a trip on this day')}</button>
              <button type="button" class="btn" onclick={toCalendar} data-mt-ics><CalendarPlus size={16} aria-hidden="true" />{t('Add to calendar')}</button>
              <a class="btn" href={waResult} target="_blank" rel="noopener" data-mt-wa><MessageCircle size={16} aria-hidden="true" />{t('Send the result to the group')}</a>
            </div>
            {#if tripErr}<p class="mt-err" role="alert">{tripErr}</p>{/if}
          {/if}
          {#if isOpen}<div><button type="button" class="btn sm" onclick={refresh} disabled={busyRead} data-mt-refresh><RefreshCw size={16} aria-hidden="true" />{t('Look for new answers')}</button></div>{/if}
          {#if readErr}<p class="mt-err" role="alert" data-mt-readerr>{readErr}</p>{/if}
          {#if said}<p class="mt-help" role="status">{said}</p>{/if}
        </section>

        <section class="card mt-box" aria-labelledby="mt-who-h">
          <h2 id="mt-who-h">{t('Who can when')}</h2>
          <div class="mt-tablewrap">
            <table class="mt-table" data-mt-table>
              <thead><tr><th scope="col">{t('Name')}</th>{#each q.opts as o (optKey(o))}<th scope="col">{optFmt(o)}</th>{/each}</tr></thead>
              <tbody>
                {#each q.answers ?? [] as r (r.a)}
                  <tr data-mt-row>
                    <th scope="row">{r.name || t('Without a name')}{#if r.note}<small>{r.note}</small>{/if}</th>
                    {#each q.opts as o (optKey(o))}{@const v = cell(r, o)}<td class={`p-${v || 'o'}`} title={pickLabel(v)}><span aria-hidden="true">{v === 'y' ? '✓' : v === 'm' ? '?' : v === 'n' ? '✗' : '–'}</span><span class="sr">{pickLabel(v)}</span></td>{/each}
                  </tr>
                {/each}
                <tr class="mt-me" data-mt-me>
                  <th scope="row">{t('You')}<small>{t('tap to answer')}</small></th>
                  {#each q.opts as o (optKey(o))}
                    {@const v = q.me?.picks?.[optKey(o)] ?? ''}
                    <td class={`p-${v || 'o'}`}>
                      <button type="button" class="mt-cyc" onclick={() => setMine(optKey(o), v === '' ? 'y' : v === 'y' ? 'm' : v === 'm' ? 'n' : v)} aria-label={t('Your answer for {day}: {answer}', { day: optFmt(o), answer: pickLabel(v) })} data-mt-mine={optKey(o)}>{v === 'y' ? '✓' : v === 'm' ? '?' : v === 'n' ? '✗' : '+'}</button>
                    </td>
                  {/each}
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-help">{t('Your own row stays on this device. Tap again to change it: ✓ works, ? maybe, ✗ does not work.')}</p>
        </section>
        {/if}

        <div class="mt-acts">
          <button type="button" class="btn sm" onclick={() => (renaming = true)} data-mt-rename><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>
          {#if isOpen}<button type="button" class="btn sm" onclick={stop} data-mt-stop><CircleStop size={16} aria-hidden="true" />{t('End the question')}</button>{/if}
          <button type="button" class="btn sm" onclick={remove} data-mt-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
        </div>
      </div>
      {#if renaming}<RenameSheet kicker={isList ? t('Sign-up list') : isPoll ? t('Mini survey') : t('Find a date')} title={t('Rename')} value={q.title} max={80} onsave={rename} onclose={() => (renaming = false)} />{/if}
    {/if}
  {:else}
    <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Mini tools')} sub={t('Ask a group by link and get the answers counted')} />
    <div class="ich-main">
      <section class="ich-sec" aria-labelledby="mt-tools-h">
        <div class="ich-h"><div><h2 id="mt-tools-h">{t('Tools')}</h2></div></div>
        <ul class="ich-list card">
          <li>
            <a class="ich-row" href="#/me/mini/neu" data-mt-tool="date">
              <span class="ich-ib"><CalendarCheck size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Find a date')}</b><small>{t('Which day works for everyone? Like Doodle, without an account.')}</small></span>
              <Plus class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="ich-row" href="#/me/mini/umfrage" data-mt-tool="poll">
              <span class="ich-ib"><ListChecks size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Mini survey')}</b><small>{t('A few short questions; the app counts the answers and sums them up.')}</small></span>
              <Plus class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="ich-row" href="#/me/mini/liste" data-mt-tool="list">
              <span class="ich-ib"><ClipboardList size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Sign-up list')}</b><small>{t('A number of places and a waiting list; who comes too late moves up.')}</small></span>
              <Plus class="ich-chev" size={18} aria-hidden="true" />
            </a>
          </li>
        </ul>
        <p class="mt-help">{t('How it works: you make a question and send the link. People answer in the browser, without the app and without an account. Their answers come back by themselves, and the app counts them for you.')}</p>
      </section>
      <section class="ich-sec" aria-labelledby="mt-mine-h">
        <div class="ich-h"><div><h2 id="mt-mine-h">{t('Your questions')}</h2></div></div>
        {#if !mine.length}
          <p class="mt-help" data-mt-empty>{t('None yet. Start with «Find a date» or a «Mini survey».')}</p>
        {:else}
          <ul class="ich-list card" data-mt-list>
            {#each mine as x (x.id)}
              <li>
                <a class="ich-row" href={`#/me/mini/${encodeURIComponent(x.id)}`} data-mt-item={x.id}>
                  <span class="ich-ib">{#if x.kind === KIND_POLL}<ListChecks size={18} aria-hidden="true" />{:else if x.kind === KIND_LIST}<ClipboardList size={18} aria-hidden="true" />{:else}<CalendarCheck size={18} aria-hidden="true" />{/if}</span>
                  <span class="ich-m"><b>{x.title}</b><small>{answersText(x.answers?.length ?? 0)} · {running(x) ? t('open until {day}', { day: endFmt(x.srv.end) }) : t('ended')}</small></span>
                  <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>
  {/if}
</div>

<style>
  .mt-page {
    max-width: 860px;
  }
  .mt-form {
    display: grid;
    gap: var(--sp-3);
  }
  .mt-box {
    display: grid;
    gap: var(--sp-3);
    min-width: 0;
  }
  .mt-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
    text-wrap: balance;
  }
  .mt-h {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--sp-2);
    flex-wrap: wrap;
  }
  .mt-count,
  .mt-help {
    color: var(--ink-3);
    font-size: var(--fs-small);
    margin: 0;
  }
  .mt-fld {
    display: grid;
    gap: var(--sp-1);
  }
  .mt-fld > span {
    font-weight: 600;
  }
  .mt-fld input,
  .mt-fld select,
  .mt-url {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .mt-days {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: 6px;
  }
  .mt-day {
    min-height: 48px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    display: grid;
    place-content: center;
    gap: 0;
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
    padding: 4px;
  }
  .mt-day b {
    font-weight: 600;
  }
  .mt-day small {
    font-size: var(--fs-label);
    color: var(--ink-3);
  }
  .mt-day.busy:not(.on) {
    background: var(--paper-2);
    color: var(--ink-3);
  }
  .mt-day.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .mt-day.on small {
    color: inherit;
  }
  .mt-day:focus-visible,
  .mt-cyc:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .mt-times {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .mt-times li {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--sp-2);
  }
  .mt-times input {
    min-height: 44px;
  }
  .mt-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    align-items: center;
  }
  .mt-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .mt-qr {
    max-width: 240px;
  }
  .mt-bars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .mt-bars li {
    display: grid;
    grid-template-columns: minmax(84px, auto) minmax(40px, 1fr) auto;
    gap: var(--sp-2);
    align-items: center;
    font-size: var(--fs-small);
  }
  .mt-bars li.top .mt-bl {
    font-weight: 700;
  }
  .mt-bar {
    display: flex;
    height: 10px;
    border-radius: 5px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .mt-bar b {
    background: var(--accent);
  }
  .mt-bar i {
    background: var(--warn);
    opacity: 0.6;
  }
  .mt-bn {
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }
  .mt-tablewrap {
    overflow-x: auto;
    min-width: 0;
    max-width: 100%;
  }
  .mt-table {
    border-collapse: separate;
    border-spacing: 4px;
    font-size: var(--fs-small);
  }
  .mt-table th {
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
  }
  .mt-table thead th {
    text-align: center;
    color: var(--ink-3);
    font-weight: 500;
  }
  .mt-table tbody th small {
    display: block;
    font-weight: 400;
    color: var(--ink-3);
    white-space: normal;
    max-width: 16ch;
  }
  .mt-table td {
    position: relative;
    text-align: center;
    min-width: 44px;
    height: 36px;
    border-radius: 6px;
  }
  .p-y {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .p-m {
    background: var(--warn-soft);
    color: var(--ink);
  }
  .p-n {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .p-o {
    background: var(--paper-2);
    color: var(--ink-3);
  }
  .mt-me th {
    padding-top: 6px;
  }
  .mt-cyc {
    width: 100%;
    min-width: 44px;
    min-height: 44px;
    border: 1px dashed var(--line);
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
</style>
