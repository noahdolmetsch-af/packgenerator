<script>
  /**
   * Hobby pages 3 «Nach dem Gong»: the evaluation after a session (mockup B3, Noah 10.10.2026, H11a,
   * H23a, H24a). #/flow/act/meditation/done/<id> (…?edit=1 from the session's page B5).
   * v0.86.0 «Meditation einfach» (mockup E, Noah «1-5 a» 11.10.2026): only the minutes, one muted line,
   * at most one quiet line (streak, new star or best time, only when something changed), the sentence,
   * the depth and «Fertig» (saves; with nothing entered it only closes). Mood, what helped, the kind
   * and «Als Nächstes» fold behind «mehr erfassen». Gone: «Ohne Notiz schliessen», «Wo du stehst», the
   * quote, the Fitbit row and «Diese Seite kann». Earlier:
   *   the note, large and calm: a sentence, depth 1–5, mood, «Was hat geholfen?» (suggestions plus own),
   *   the kind it was; «Speichern» or «Ohne Notiz schliessen» (everything is optional);
   *   a new star and a new best time, quietly; the streak, the comparison with the average and this week;
   *   «Als Nächstes»: one calm suggestion with a calendar file (.ics), can be switched off;
   *   «Wo du stehst» (the three closest milestones), the quote of the day, Fitbit as a grey «geplant» row.
   */
  import { ChevronLeft, ChevronRight, Star, Check, Plus, CalendarPlus, X } from '@lucide/svelte';
  import Sugg from '../../lib/flow/hobby/Sugg.svelte';
  import { db } from '../../lib/db.js';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { msContext, actMilestones, evaluate, isOff, newStars } from '../../lib/flowms.js';
  import { artsOf, sortTemplates, streaks, compareSession, starsOfSession, nextUp, icsEvent, noteOf, toggleIn, medMoodsOffered, HELPED, choiceList, HELPED_KEY, NEXT_KEY } from '../../lib/flowmed.js';
  import { saveNote, saveStars, putSetting } from '../../lib/flowdb.js';
  import { actName, toast } from '../../lib/flow/ui.svelte.js';
  import { tplName, artName, msName, timeShort, moodLabel, helpedLabel } from '../../lib/flow/hobby/words.js';
  import { dayShort } from '../../lib/flow/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn } from '../../lib/i18n.svelte.js';

  let { actId = 'meditation', id = '', params = new URLSearchParams() } = $props();
  const today = localDay();
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    seedMed(data, actId);
  });
  const base = $derived(`#/flow/act/${encodeURIComponent(actId)}`);
  const editing = $derived(params.get('edit') === '1');
  const after = $derived(editing ? `${base}/s/${encodeURIComponent(id)}` : base);
  const act = $derived(data?.acts.find((a) => a.id === actId) ?? null);
  const entry = $derived(data?.log.find((e) => e.id === id) ?? null);
  const sess = $derived(data?.sessions.find((s) => s.id === id) ?? null);
  const arts = $derived(artsOf(data?.arts));
  const artOf = (x) => arts.all.find((a) => a.id === x) ?? null;
  const tpls = $derived(sortTemplates(data?.tpls ?? []));
  const tpl = $derived(sess?.tplId ? tpls.find((x) => x.id === sess.tplId) : null);

  /* the form, filled once from the session */
  let ready = $state(false);
  let note = $state('');
  let depth = $state(null);
  let moods = $state([]);
  let helped = $state([]);
  let art = $state(null);
  let allArts = $state(false);
  $effect(() => {
    if (ready || !data || !entry) return;
    const n = noteOf(sess);
    note = n.note;
    depth = n.depth;
    moods = n.moods;
    helped = n.helped;
    art = sess?.art ?? null;
    ready = true;
  });
  const helpList = $derived(choiceList(data?.helped, HELPED));
  let ownHelp = $state('');
  let helpOpen = $state(false);
  async function addHelp(e) {
    e.preventDefault();
    const nm = ownHelp.trim();
    if (!nm) return;
    await putSetting(db, HELPED_KEY, { own: [...new Set([...helpList.own, nm])], hidden: helpList.hidden });
    helped = [...helped, `own:${nm}`];
    ownHelp = '';
    helpOpen = false;
  }
  // the kinds to pick: the favourites, the one it was, all on «…»
  const artChoices = $derived.by(() => {
    if (allArts) return arts.all;
    const ids = [...new Set([...(art ? [art] : []), ...arts.favs])];
    return ids.map(artOf).filter(Boolean);
  });

  // «Fertig» saves like «Speichern» did; with nothing entered or changed it only closes
  let moreOpen = $state(false);
  let first = $state('');
  const snap = () => JSON.stringify({ note: note.trim(), depth, moods, helped, art });
  $effect(() => {
    if (ready && !first) first = snap();
  });
  async function finish() {
    if (snap() !== first) {
      await saveNote(db, id, { note: note.trim(), depth, moods, helped, art });
      toast(t('Note saved'));
    }
    location.hash = after;
  }

  /* the facts */
  const min = $derived(Math.round(Number(entry?.min) || 0));
  // «Morgen 20» · Atemzüge zählen · 07:00 bis 07:20
  const facts = $derived.by(() => {
    if (!entry) return '';
    const parts = [];
    if (tpl) parts.push(`«${tplName(tpl)}»`);
    const a = artOf(art ?? sess?.art);
    parts.push(a ? artName(a) : actName(act));
    const at = Date.parse(sess?.at ?? entry.at ?? '');
    const end = Date.parse(sess?.endAt ?? '');
    if (!Number.isNaN(at)) parts.push(Number.isNaN(end) ? timeShort(at) : t('{from} to {to}', { from: timeShort(at), to: timeShort(end) }));
    return parts.join(' · ');
  });

  /* stars, streak, comparison */
  const ctx = $derived(data ? msContext({ acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays }) : null);
  const stored = $derived(new Map((data?.stars ?? []).map((s) => [s.id, s.day])));
  const ms = $derived(act && ctx ? actMilestones(act).filter((m) => !isOff(m, data.tune)).map((m) => evaluate(m, ctx, stored, data.tune)) : []);
  $effect(() => {
    const fresh = newStars(ms, stored);
    if (fresh.length) saveStars(db, fresh);
  });
  const won = $derived(act && data && entry ? starsOfSession({ act, acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays, tune: data.tune }, id) : []);
  const cmp = $derived(data && entry ? compareSession(data.log, actId, id, today) : null);
  const str = $derived(data ? streaks(data.log, actId, today) : { now: 0, longest: 0 });
  // at most one quiet line, only when something changed: the streak grew (the first session of today),
  // a new star, a new best time
  const quietLine = $derived.by(() => {
    if (!data || !entry) return '';
    const parts = [];
    const firstToday = entry.day === today && !data.log.some((e) => e.actId === actId && e.day === today && e.id !== id && (e.at ?? '') < (entry.at ?? ''));
    if (firstToday && str.now >= 2) parts.push(t('Streak {n} days', { n: str.now }));
    if (won.length) parts.push(t('new star «{name}»', { name: msName(won[0].r.m) }));
    else if (cmp?.isBest) parts.push(t('New best time: {n} minutes (before {b}).', { n: cmp.min, b: cmp.best }));
    return parts.join(' · ');
  });

  /* «Als Nächstes» (H24a) */
  const nx = $derived(data && entry && !data.nextOff ? nextUp({ log: data.log, tpls, session: { ...(sess ?? entry), actId, min }, today }) : null);
  const nxTpl = $derived(nx?.tplId ? tpls.find((x) => x.id === nx.tplId) : null);
  const nxTitle = $derived(nx ? (nxTpl ? tplName(nxTpl) : `${artOf(nx.art) ? artName(artOf(nx.art)) : actName(act)} ${nx.minutes}`) : '');
  const nxDay = $derived(nx ? (nx.day === today ? t('today') : nx.day === addOne(today) ? t('tomorrow') : dayShort(nx.day)) : '');
  function addOne(d) {
    const x = new Date(`${d}T00:00:00Z`);
    x.setUTCDate(x.getUTCDate() + 1);
    return x.toISOString().slice(0, 10);
  }
  function ics() {
    const text = icsEvent({ uid: `med-${nx.day}-${nx.time.replace(':', '')}`, title: `${actName(act)} · ${nxTitle}`, note: t('A suggestion from the Pack Generator. Change or delete it as you like.'), day: nx.day, time: nx.time, minutes: nx.minutes });
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `meditation-${nx.day}.ics`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const nextOff = () => putSetting(db, NEXT_KEY, { off: true });

</script>

<div class="md">
  <p class="back"><a href={after}><ChevronLeft size={16} aria-hidden="true" />{editing ? t('Back to the session') : act ? actName(act) : t('Meditation')}</a></p>

  {#if data && !entry}
    <section class="surf pad">
      <h1 class="h1" tabindex="-1" data-page-title>{t('Session')}</h1>
      <p class="hint">{t('This session is no longer there.')} <a href="{base}/log">{t('Open the log')}</a></p>
    </section>
  {:else if data && entry}
    <header class="hero">
      <h1 class="big num" tabindex="-1" data-page-title>{tn(min, '{n} minute.', '{n} minutes.')}</h1>
      <p class="facts">{facts}</p>
      {#if quietLine}<p class="won" data-won><Star size={14} aria-hidden="true" />{quietLine}</p>{/if}
    </header>

    <div class="col">
      <section class="note" aria-labelledby="note-h">
        <h2 id="note-h" class="nk">{t('How was it? · optional')}</h2>
        <label class="nl"><span class="sr">{t('Note')}</span><textarea class="ntext" rows="3" maxlength="1000" bind:value={note} placeholder={t('A sentence, how it was')} data-note></textarea></label>

        <p class="cap" id="depth-l">{t('Depth')}</p>
        <div class="depth" role="group" aria-labelledby="depth-l">
          <span class="dl">{t('shallow|depth')}</span>
          {#each [1, 2, 3, 4, 5] as d (d)}
            <button type="button" class="dn num" class:on={depth === d} aria-pressed={depth === d} aria-label={t('Depth {n} of 5', { n: d })} onclick={() => (depth = depth === d ? null : d)} data-depth={d}>{d}</button>
          {/each}
          <span class="dl">{t('deep|depth')}</span>
        </div>

        <details class="more" bind:open={moreOpen} data-more>
          <summary>
            <span class="mt"><b>{t('record more')}</b><small>{t('Mood · what helped · kind · next up')}</small></span>
            <ChevronRight size={18} class="chev" aria-hidden="true" />
          </summary>

          <p class="cap">{t('Mood')}</p>
          <div class="chips">
            {#each medMoodsOffered(moods) as m (m.id)}
              {@const on = moods.includes(m.id)}
              <button type="button" class="chip" class:on aria-pressed={on} onclick={() => (moods = toggleIn(moods, m.id))} data-mood={m.id}>{#if on}<Check size={16} aria-hidden="true" />{:else}<Plus size={16} aria-hidden="true" />{/if}{moodLabel(m.id)}</button>
            {/each}
          </div>

          <p class="cap">{t('What helped?')}<Sugg /></p>
          <div class="chips">
            {#each helpList.list as h (h.id)}
              {@const hid = h.own ? `own:${h.name}` : h.id}
              {@const on = helped.includes(hid)}
              <button type="button" class="chip" class:on aria-pressed={on} onclick={() => (helped = toggleIn(helped, hid))}>{#if on}<Check size={16} aria-hidden="true" />{:else}<Plus size={16} aria-hidden="true" />{/if}{helpedLabel(hid)}</button>
            {/each}
            {#if !helpOpen}<button type="button" class="chip ghost" onclick={() => (helpOpen = true)}><Plus size={16} aria-hidden="true" />{t('own|helped')}</button>{/if}
          </div>
          {#if helpOpen}
            <form class="addrow" onsubmit={addHelp}>
              <label class="grow"><span class="sr">{t('What helped?')}</span><input class="inp" bind:value={ownHelp} maxlength="60" placeholder={t('e.g. a walk before')} /></label>
              <button type="submit" class="btn">{t('Add')}</button>
              <button type="button" class="ib" aria-label={t('Cancel')} onclick={() => (helpOpen = false)}><X size={18} aria-hidden="true" /></button>
            </form>
          {/if}

          <p class="cap" id="art-l">{t('The kind was')}</p>
          <div class="seg" role="group" aria-labelledby="art-l">
            {#each artChoices as a (a.id)}
              <button type="button" class="sg" class:on={art === a.id} aria-pressed={art === a.id} onclick={() => (art = art === a.id ? null : a.id)}>{artName(a)}</button>
            {/each}
            {#if !allArts && arts.all.length > artChoices.length}<button type="button" class="sg more-k" aria-label={t('all kinds')} onclick={() => (allArts = true)}>…</button>{/if}
          </div>

          {#if nx}
            <div class="nxr" data-next>
              <p class="cap">{t('Next up')}<Sugg /></p>
              <b>{nxDay} {nx.time} · {nxTitle}</b>
              <small>{nx.why === 'short' ? t('after a long session rather short and soft') : t('the same again, at the same time')}</small>
              <span class="nxa">
                <button type="button" class="lnk" onclick={ics} data-ics><CalendarPlus size={16} aria-hidden="true" />{t('add to the calendar')}</button>
                <button type="button" class="lnk q" onclick={nextOff}>{t('no suggestions')}</button>
              </span>
            </div>
          {/if}
        </details>
      </section>

      <button type="button" class="btn hi fertig" onclick={finish} data-save-note>{t('Done')}</button>
    </div>
  {/if}
</div>

<style>
  .md {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 1328px;
    margin: 0 auto;
    min-width: 0;
  }
  .back {
    margin: 0;
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--accent);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .pad {
    padding: 16px 18px;
    min-width: 0;
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-title)/1.1 var(--font-brand);
  }
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }
  .big {
    margin: 0;
    color: var(--accent);
    font: 800 var(--fs-display)/1.05 var(--font-brand);
  }
  .facts {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .won {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 2px 0 0;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font: 600 var(--fs-small)/1.4 var(--font-body);
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;
    max-width: 620px;
    margin: 0 auto;
    min-width: 0;
  }
  .note {
    min-width: 0;
    padding: 18px;
    border: 1px solid var(--l2);
    border-radius: var(--radius-card);
    background: var(--warn-soft);
    box-shadow: var(--card-shadow);
  }
  .nk {
    margin: 0 0 10px;
    color: var(--warn);
    font: 700 var(--fs-tiny)/1.3 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .nl {
    display: block;
  }
  .ntext {
    display: block;
    width: 100%;
    box-sizing: border-box;
    min-height: 84px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: italic var(--fs-sub)/1.45 var(--font-body);
    resize: vertical;
  }
  .cap {
    margin: 16px 0 8px;
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .depth {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .dl {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  @media (max-width: 419px) {
    /* flach 1 2 3 4 5 tief stays on one line at 390 px */
    .depth {
      gap: 5px;
    }
    .dl {
      font-size: var(--fs-tiny);
    }
  }
  .dn {
    width: 44px;
    height: 44px;
    border: 1.5px solid var(--line-strong);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: 800 var(--fs-sub) var(--font-brand);
    cursor: pointer;
  }
  .dn.on {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .more {
    margin-top: 16px;
    border-top: 1px solid var(--l2);
  }
  .more summary {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 8px 4px 0;
    cursor: pointer;
    list-style: none;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more summary :global(.chev) {
    flex: none;
    color: var(--ink-2);
    transition: transform 0.15s;
  }
  .more[open] summary :global(.chev) {
    transform: rotate(90deg);
  }
  .mt {
    flex: 1;
    min-width: 0;
    line-height: 1.35;
  }
  .mt b {
    display: block;
    font-weight: 600;
  }
  .mt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 14px;
    border: 1.5px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small)/1.3 var(--font-body);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .chip.ghost {
    border-style: dashed;
    color: var(--ink-2);
  }
  .addrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .grow {
    flex: 1 1 180px;
    min-width: 0;
  }
  .addrow .inp,
  .addrow .btn {
    min-height: 44px;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .seg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .sg {
    min-height: 44px;
    padding: 6px 14px;
    border: 0;
    border-radius: 9px;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small)/1.3 var(--font-body);
    cursor: pointer;
  }
  .sg.on {
    background: var(--paper);
    color: var(--ink);
    font-weight: 700;
    box-shadow: var(--card-shadow);
  }
  .nxr {
    line-height: 1.35;
  }
  .nxr b {
    display: block;
  }
  .nxr small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nxa {
    display: flex;
    flex-wrap: wrap;
    gap: 0 16px;
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
  .lnk.q {
    color: var(--ink-3);
  }
  .fertig {
    width: 100%;
    min-height: 60px;
    justify-content: center;
    border-radius: 14px;
    font: 700 var(--fs-sub)/1.2 var(--font-body);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
