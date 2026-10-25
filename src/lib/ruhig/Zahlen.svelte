<script>
  /**
   * Paket C › Zahlen, die verständlich bleiben (#/me/ruhig/zahlen; 996 Ideen UC-218-I2, UC-242-I2, UC-223-I3):
   * «Eine Fahrt, zwei Rollen», «Was eine Skala meinte», «Gespräch über Körperwerte vorbereiten».
   * Observation only: the summary for a professional never suggests a diagnosis. Logic: zahlen.js.
   */
  import { liveQuery } from 'dexie';
  import { Bike, SlidersHorizontal, Stethoscope, Settings2, Copy, Printer, Plus, X } from '@lucide/svelte';
  import Card from './Card.svelte';
  import KindsEdit from './KindsEdit.svelte';
  import { db } from '../db.js';
  import { allQuestions, AB_KEY } from '../abfragen.js';
  import { WEIGHT_KEY, entriesOf } from '../weight.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { settingQ, saveSetting } from './store.js';
  import { openFromHash } from './open.js';
  import { dmy, addDays } from './base.js';
  import { kindName } from './kinds.js';
  import { ROLES_KEY, rolesOf, rolesOfAct, flipRole, roleCount, dropRole, roleSums, SCALES_KEY, scalesOf, setScale, meaningOn, TALK_KEY, talkOf, bodySummary, talkText } from './zahlen.js';

  const today = localDay();
  const first = openFromHash();
  let open = $state({ roles: first === 'roles', scales: first === 'scales', talk: first === 'talk' });
  const nm = (k) => kindName(k, t);

  /* Eine Fahrt, zwei Rollen */
  const rQ = settingQ(ROLES_KEY);
  const actsQ = liveQuery(() => db.activities.toArray().catch(() => []));
  const r = $derived(rolesOf($rQ));
  const saveR = (x) => saveSetting(ROLES_KEY, x);
  let span = $state(30);
  const from = $derived(addDays(today, -span + 1));
  const acts = $derived(($actsQ ?? []).filter((a) => a?.day && a.day >= from && (a.kind === 'ride' || /ride/i.test(a.type ?? ''))).sort((a, b) => b.day.localeCompare(a.day) || String(b.time).localeCompare(String(a.time))));
  const sums = $derived(roleSums(r, acts));
  let editRoles = $state(false);
  let showAll = $state(false);
  const hmin = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;

  /* Was eine Skala meinte */
  const cfgQ = liveQuery(async () => (await db.settings.get(AB_KEY))?.value ?? null);
  const ansQ = liveQuery(async () => db.abAnswers.where('day').aboveOrEqual(addDays(today, -90)).toArray());
  const sQ = settingQ(SCALES_KEY);
  const scales = $derived(scalesOf($sQ));
  const answered = $derived(new Set(($ansQ ?? []).map((a) => a.qid)));
  let allScales = $state(false);
  const scaleQs = $derived(allQuestions($cfgQ).filter((q) => q.form?.kind === 'scale' && (allScales || answered.has(q.id) || scales[q.id] || q.own)));
  const qText = (q) => (q.edited || q.own ? q.text : t(q.text));
  let lo = $state({});
  let hi = $state({});
  const lastAnswers = (qid) => ($ansQ ?? []).filter((a) => a.qid === qid && Number.isFinite(Number(a.value))).sort((a, b) => b.day.localeCompare(a.day)).slice(0, 3);

  /* Gespräch über Körperwerte */
  const tQ = settingQ(TALK_KEY);
  const talk = $derived(talkOf($tQ));
  const saveT = (x) => saveSetting(TALK_KEY, x);
  const bodyQ = liveQuery(async () => ({ health: await db.healthDays.toArray(), weight: entriesOf((await db.settings.get(WEIGHT_KEY))?.value) }));
  let period = $state(30);
  const summary = $derived(bodySummary($bodyQ?.health ?? [], $bodyQ?.weight ?? [], today, period));
  const LABEL = $derived({ rhr: t('Resting pulse'), sleep: t('Sleep (Fitbit)'), steps: t('Steps'), azm: t('Active zone minutes'), kg: t('Body weight') });
  const UNIT = { rhr: '/min', sleep: 'h', steps: '', azm: 'min', kg: 'kg' };
  let note = $state('');
  let question = $state('');
  const text = $derived(talkText({ title: t('My own observations'), period: t('{from} to {to}', { from: dmy(addDays(today, -period + 1)), to: dmy(today) }), summary, labels: LABEL, units: UNIT, notes: talk.notes, questions: talk.questions, notesH: t('What I noticed'), questionsH: t('My open questions'), foot: t('Measured by my devices and written down by me. No diagnosis.') }));
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      offerDone(t('Copied.'));
    } catch {
      offerDone(t('Copying did not work. Select the text and copy it.'));
    }
  }
  function print() {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(t('My own observations'))}</title><pre style="font:14px/1.5 system-ui;white-space:pre-wrap">${esc(text)}</pre>`);
    w.document.close();
    setTimeout(() => w.print(), 200);
  }
</script>

<ul class="rh-cards">
  <Card id="roles" icon={Bike} title={t('One ride, two roles')} lead={t('Commuting and training can be the same ride, without counting it twice')} bind:open={open.roles}>
    <div class="rh-chips">{#each [30, 90, 365] as n (n)}<button type="button" class="rh-chip" aria-pressed={span === n} onclick={() => (span = n)}>{tn(n, 'last {n} day', 'last {n} days')}</button>{/each}</div>
    <ul class="rh-list" data-role-sums>
      {#each sums.per as p (p.id)}{@const k = r.kinds.find((x) => x.id === p.id)}<li><span class="rh-grow">{nm(k)}<small>{tn(p.n, '{n} ride', '{n} rides')} · {hmin(p.min)}</small></span><b class="num">{num(p.km)} km</b></li>{/each}
      <li class="rh-total"><span class="rh-grow"><b>{t('All rides, each once')}</b><small>{tn(sums.total.n, '{n} ride', '{n} rides')} · {hmin(sums.total.min)}{#if sums.both}{' '}· {tn(sums.both, '{n} with two roles', '{n} with two roles')}{/if}</small></span><b class="num">{num(sums.total.km)} km</b></li>
    </ul>
    {#if acts.length}
      <p class="rh-sub">{t('Your rides')}</p>
      <ul class="rh-list" data-role-acts>
        {#each showAll ? acts : acts.slice(0, 6) as a (a.id)}
          <li class="rh-act"><span class="rh-grow"><b>{a.name || t('Ride')}</b><small>{dmy(a.day)} · {num(Math.round(a.km))} km{#if a.commute}{' '}· {t('Strava: commute')}{/if}</small>
            <span class="rh-chips">{#each r.kinds as k (k.id)}<button type="button" class="rh-chip sm" aria-pressed={rolesOfAct(r, a).includes(k.id)} onclick={() => saveR(flipRole(r, a, k.id))}>{nm(k)}</button>{/each}</span></span></li>
        {/each}
      </ul>
      {#if !showAll && acts.length > 6}<button type="button" class="btn sm btn-link" onclick={() => (showAll = true)}>{tn(acts.length, 'Show all {n} rides', 'Show all {n} rides')}</button>{/if}
    {:else}<p class="rh-empty">{t('No Strava ride in this time. With Strava connected, your rides show here.')}</p>{/if}
    <button type="button" class="btn sm" onclick={() => (editRoles = !editRoles)} aria-expanded={editRoles}><Settings2 size={14} aria-hidden="true" />{t('Change the roles')}</button>
    {#if editRoles}
      <KindsEdit kinds={r.kinds} count={(id) => roleCount(r, id, $actsQ ?? [])} what={(n) => tn(n, '{n} ride', '{n} rides')} none={t('Without this role')} noneHint={t('The rides stay, only the role goes.')} label={t('New role, e.g. Shopping')}
        onsave={(kinds) => saveR({ ...r, kinds })} ondelete={async (id, to) => { const snap = r; await saveR(dropRole(r, id, to)); return snap; }} onundo={(snap) => saveR(snap)} />
    {/if}
  </Card>

  <Card id="scales" icon={SlidersHorizontal} title={t('What a scale meant')} lead={t('Your meaning of 1 and 10 for each scale, so an old 7 stays readable')} bind:open={open.scales}>
    <p class="rh-help">{t('A changed meaning counts from today; older answers keep the meaning of their day.')}</p>
    {#each scaleQs as q (q.id)}
      {@const now = meaningOn(scales, q.id, today)}
      <div class="rh-scale" data-scale={q.id}>
        <b>{qText(q)}</b>
        <div class="rh-row">
          <label class="rh-field"><span>{t('1 means')}</span><input class="inp" value={lo[q.id] ?? now?.lo ?? ''} oninput={(e) => (lo[q.id] = e.currentTarget.value)} placeholder={t('e.g. could not get up')} /></label>
          <label class="rh-field"><span>{t('10 means')}</span><input class="inp" value={hi[q.id] ?? now?.hi ?? ''} oninput={(e) => (hi[q.id] = e.currentTarget.value)} placeholder={t('e.g. the best day of the year')} /></label>
          <button type="button" class="btn sm" disabled={!(lo[q.id] ?? '').trim() && !(hi[q.id] ?? '').trim()} onclick={() => (saveSetting(SCALES_KEY, setScale(scales, q.id, { lo: lo[q.id] ?? now?.lo ?? '', hi: hi[q.id] ?? now?.hi ?? '' }, today)), (lo[q.id] = undefined), (hi[q.id] = undefined))}>{t('Keep')}</button>
        </div>
        {#if (scales[q.id] ?? []).length > 1}<small class="rh-help">{(scales[q.id] ?? []).slice(0, -1).map((d) => t('until then from {day}: 1 = {lo}, 10 = {hi}', { day: dmy(d.from), lo: d.lo || '–', hi: d.hi || '–' })).join(' · ')}</small>{/if}
        {#each lastAnswers(q.id) as a (a.id)}{@const m = meaningOn(scales, q.id, a.day)}<small class="rh-help">{dmy(a.day)}: {a.value}{#if m}{' '}· {t('1 = {lo}, 10 = {hi}', { lo: m.lo || '–', hi: m.hi || '–' })}{/if}</small>{/each}
      </div>
    {:else}<p class="rh-empty">{t('No scale question answered yet.')}</p>{/each}
    {#if !allScales}<button type="button" class="btn sm btn-link" onclick={() => (allScales = true)}>{t('Show all scales')}</button>{/if}
  </Card>

  <Card id="talk" icon={Stethoscope} title={t('Prepare a talk about body values')} lead={t('Your own values, notes and open questions on one page for a professional')} bind:open={open.talk}>
    <p class="rh-help">{t('Only what your devices measured and what you wrote. The app suggests no diagnosis.')}</p>
    <div class="rh-chips">{#each [30, 90] as n (n)}<button type="button" class="rh-chip" aria-pressed={period === n} onclick={() => (period = n)}>{tn(n, 'last {n} day', 'last {n} days')}</button>{/each}</div>
    {#if summary.length}
      <ul class="rh-list" data-talk-values>{#each summary as s (s.key)}<li><span class="rh-grow">{LABEL[s.key]}<small>{t('{min} to {max}, on {n} days', { min: num(s.min), max: num(s.max), n: s.days })}</small></span><b class="num">{num(s.avg)} {UNIT[s.key]}</b></li>{/each}</ul>
    {:else}<p class="rh-empty">{t('No measured values in this time. With Fitbit or your weight, they show here.')}</p>{/if}
    <p class="rh-sub">{t('What I noticed')}</p>
    {#each talk.notes as n, i (i)}<div class="rh-row"><span class="rh-grow2">{n}</span><button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => saveT({ ...talk, notes: talk.notes.filter((_, k) => k !== i) })}><X size={16} /></button></div>{/each}
    <form class="rh-row" onsubmit={(e) => (e.preventDefault(), note.trim() && saveT({ ...talk, notes: [...talk.notes, note.trim()] }), (note = ''))}><input class="inp" bind:value={note} placeholder={t('e.g. tired after the long rides in September')} aria-label={t('What I noticed')} /><button class="btn sm" type="submit" disabled={!note.trim()}><Plus size={14} aria-hidden="true" />{t('Add')}</button></form>
    <p class="rh-sub">{t('My open questions')}</p>
    {#each talk.questions as n, i (i)}<div class="rh-row"><span class="rh-grow2">{n}</span><button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => saveT({ ...talk, questions: talk.questions.filter((_, k) => k !== i) })}><X size={16} /></button></div>{/each}
    <form class="rh-row" onsubmit={(e) => (e.preventDefault(), question.trim() && saveT({ ...talk, questions: [...talk.questions, question.trim()] }), (question = ''))}><input class="inp" bind:value={question} placeholder={t('e.g. Is a resting pulse of 58 normal for me?')} aria-label={t('My open questions')} /><button class="btn sm" type="submit" disabled={!question.trim()}><Plus size={14} aria-hidden="true" />{t('Add')}</button></form>
    <div class="rh-row">
      <button type="button" class="btn" onclick={copy} data-talk-copy><Copy size={16} aria-hidden="true" />{t('Copy')}</button>
      <button type="button" class="btn" onclick={print}><Printer size={16} aria-hidden="true" />{t('Print|pdf')}</button>
    </div>
  </Card>
</ul>

<style>
  .rh-act .rh-grow {
    display: grid;
    gap: 4px;
  }
  .rh-total {
    background: var(--paper-2) !important;
  }
  .rh-chip.sm {
    min-height: 32px;
    padding: 2px 10px;
  }
  .rh-scale {
    display: grid;
    gap: 6px;
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
  }
  .rh-scale .rh-field {
    flex: 1 1 160px;
  }
  .rh-grow2 {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
</style>
