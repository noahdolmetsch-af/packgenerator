<script>
  /**
   * Hobby pages 3 «Nach dem Gong»: one session in full (mockup B5, Noah 10.10.2026).
   *   #/flow/act/meditation/s/<id>   the clock with its marks, template, sounds, place; the note with depth,
   *   mood and what helped; the star reached here. «Wieder so starten» (the same clock again), «Als Vorlage
   *   speichern» (a name, then a new template), «Bearbeiten» (the note, B3), «Löschen» with «Rückgängig».
   */
  import { ChevronLeft, Play, Copy, Pencil, Star, Check, Activity as Pulse } from '@lucide/svelte';
  import Dial from '../../lib/flow/hobby/Dial.svelte';
  import CanDo from '../../lib/flow/hobby/CanDo.svelte';
  import { db } from '../../lib/db.js';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { artsOf, sortTemplates, bowlWords, noteOf, hasNote, starsOfSession, sessionPlan, tplOf, newTplId, compareSession } from '../../lib/flowmed.js';
  import { bowlOf, marksOf } from '../../lib/flowbowl.js';
  import { SOUNDS, DEFAULT_SOUND, DEFAULT_END_SOUND, soundOk } from '../../lib/flowsounds.js';
  import { deleteSession, restoreSession, saveTemplate } from '../../lib/flowdb.js';
  import { startSession, clockState, ui, actName, toast } from '../../lib/flow/ui.svelte.js';
  import { tplName, artName, msName, stageName, placeLabel, sessionWhen, marksLine, moodLabel, helpedLabel } from '../../lib/flow/hobby/words.js';
  import { clock } from '../../lib/flowtimer.js';
  import { localDay } from '../../lib/localday.js';
  import { t } from '../../lib/i18n.svelte.js';

  let { actId = 'meditation', id = '' } = $props();
  const today = localDay();
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    seedMed(data, actId);
  });
  const base = $derived(`#/flow/act/${encodeURIComponent(actId)}`);
  const act = $derived(data?.acts.find((a) => a.id === actId) ?? null);
  const entry = $derived(data?.log.find((e) => e.id === id) ?? null);
  const sess = $derived(data?.sessions.find((s) => s.id === id) ?? null);
  const arts = $derived(artsOf(data?.arts));
  const artOf = (x) => arts.all.find((a) => a.id === x) ?? null;
  const tpls = $derived(sortTemplates(data?.tpls ?? []));
  const tpl = $derived(sess?.tplId ? tpls.find((x) => x.id === sess.tplId) : null);
  const n = $derived(noteOf(sess));
  const title = $derived(artOf(sess?.art) ? artName(artOf(sess.art)) : act ? actName(act) : t('Meditation'));
  const min = $derived(Math.round(Number(entry?.min) || 0));
  const target = $derived(Math.max(1, Number(sess?.target) || min || 1));
  const marks = $derived(marksOf(sess?.marks));
  const bowl = $derived(sess?.bowl ? bowlOf(sess.bowl) : { mode: 'marks', marks });
  const modeLine = $derived.by(() => {
    if (sess?.bowl?.mode === 'random') return t('{n} at random', { n: marks.length });
    const w = bowlWords(sess?.bowl ? bowlOf(sess.bowl) : { mode: 'marks', marks });
    return t(w.key, w.vars);
  });
  const soundName = (x) => t(SOUNDS.find((s) => s.id === x)?.name ?? '');
  const whenLine = $derived(entry ? [sessionWhen(sess ?? entry), placeLabel(sess?.place)].filter(Boolean).join(' · ') : '');
  const won = $derived(act && data && entry ? starsOfSession({ act, acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays, tune: data.tune }, id) : []);
  const cmp = $derived(data && entry ? compareSession(data.log, actId, id, today) : null);

  /* «Wieder so starten»: the same clock, sounds and kind (a random one draws its times again) */
  const running = $derived(!!clockState.tm);
  function again() {
    if (running) {
      ui.sessionOpen = true;
      return;
    }
    const plan = sessionPlan({ minutes: target, bowl, sound: sess?.sound, endSound: sess?.endSound, art: sess?.art ?? null, tplId: tpl ? tpl.id : null, name: tpl ? tplName(tpl) : null, place: sess?.place ?? null });
    plan.extra.session.artLabel = title;
    plan.extra.session.placeLabel = placeLabel(sess?.place);
    startSession(actId, plan);
  }

  /* «Als Vorlage speichern» */
  let naming = $state(false);
  let name = $state('');
  function openName() {
    name = `${title} ${target}`;
    naming = true;
  }
  async function saveTpl(e) {
    e.preventDefault();
    const nm = name.trim();
    if (!nm) return;
    const x = tplOf({ id: newTplId(), actId, name: nm, art: sess?.art ?? null, minutes: target, bowl: sess?.bowl?.mode === 'random' ? sess.bowl : { mode: 'marks', marks }, sound: soundOk(sess?.sound, DEFAULT_SOUND), endSound: soundOk(sess?.endSound, DEFAULT_END_SOUND) }, actId);
    await saveTemplate(db, x);
    naming = false;
    toast(t('Template «{name}» saved', { name: nm }));
  }

  /* «Löschen» with «Rückgängig» */
  async function remove() {
    const e = $state.snapshot(entry);
    const s = sess ? $state.snapshot(sess) : null;
    await deleteSession(db, id);
    location.hash = `${base}/log`;
    toast(t('Session deleted'), () => restoreSession(db, e, s));
  }

  const CAN = ['show a session in full: kind, duration, sounds, place', 'start exactly like this again in one tap', 'read and change the note, depth and mood', 'save it as a new template'];
</script>

<div class="ms">
  <p class="back"><a href="{base}/log"><ChevronLeft size={16} aria-hidden="true" />{t('Back to the log')}</a></p>

  {#if data && !entry}
    <section class="surf pad">
      <h1 class="h1" tabindex="-1" data-page-title>{t('Session')}</h1>
      <p class="hint">{t('This session is no longer there.')} <a href="{base}/log">{t('Open the log')}</a></p>
    </section>
  {:else if data && entry}
    <div class="cols">
      <div class="main">
        <section class="surf pad">
          <p class="when">{whenLine}</p>
          <h1 class="h1" tabindex="-1" data-page-title>{title}</h1>
          <div class="clockrow">
            <Dial total={target * 60} {marks} small>
              <b class="ct num">{clock(min * 60)}</b>
              <small class="cs">{modeLine}</small>
            </Dial>
            <dl class="facts">
              {#if tpl}<div><dt>{t('Template')}</dt><dd><b>{tplName(tpl)}</b></dd></div>{/if}
              <div><dt>{t('Duration')}</dt><dd><b class="num">{t('{n} min', { n: min })}</b>{#if target !== min}<small>{t('planned {n}', { n: target })}</small>{/if}</dd></div>
              {#if marks.length}<div><dt>{t('Sounds')}</dt><dd class="num">{marksLine(marks)}</dd></div>{/if}
              {#if sess?.sound}<div><dt>{t('Sound')}</dt><dd>{soundName(sess.sound)}</dd></div>{/if}
            </dl>
          </div>
        </section>

        <section class="note" aria-labelledby="sn-h">
          <h2 id="sn-h" class="nk">{t('Note')}</h2>
          {#if hasNote(sess)}
            {#if n.note}<p class="nt">«{n.note}»</p>{/if}
            <div class="nrow">
              {#if n.depth}<span class="dp">{t('Depth')} <b>{t('{n} of 5', { n: n.depth })}</b></span>{/if}
              {#each n.moods as m (m)}<span class="tag"><Check size={14} aria-hidden="true" />{moodLabel(m)}</span>{/each}
            </div>
            {#if n.helped.length}<p class="hp">{t('Helped: {list}', { list: n.helped.map(helpedLabel).join(' · ') })}</p>{/if}
          {:else}
            <p class="hint">{t('No note yet.')} <a href="{base}/done/{encodeURIComponent(id)}?edit=1">{t('Write one')}</a></p>
          {/if}
        </section>
      </div>

      <div class="side">
        {#if won.length || cmp?.isBest}
          <section class="surf pad">
            {#each won as w (`${w.r.id}:${w.star}`)}
              <p class="starc"><span class="si" aria-hidden="true"><Star size={22} /><b class="num">{w.star}</b></span><span><b>{t('Reached here: {name}, star {k}', { name: msName(w.r.m), k: w.star })}</b><small>{stageName(w.star)}</small></span></p>
            {/each}
            {#if cmp?.isBest && !won.length}<p class="starc"><span class="si" aria-hidden="true"><Star size={22} /></span><span><b>{t('New best time')}</b><small>{t('{n} min', { n: cmp.min })}</small></span></p>{/if}
          </section>
        {/if}
        <section class="surf pad acts">
          <button type="button" class="btn hi big" onclick={again} data-again><Play size={18} aria-hidden="true" />{running ? t('Open the running session') : t('Start like this again')}</button>
          {#if naming}
            <form class="addrow" onsubmit={saveTpl}>
              <label class="grow"><span class="sr">{t('Name of the template')}</span><input class="inp" bind:value={name} maxlength="40" data-tpl-name /></label>
              <button type="submit" class="btn">{t('Save')}</button>
            </form>
          {:else}
            <button type="button" class="btn big" onclick={openName} data-as-tpl><Copy size={18} aria-hidden="true" />{t('Save as a template')}</button>
          {/if}
          <a class="btn big" href="{base}/done/{encodeURIComponent(id)}?edit=1"><Pencil size={18} aria-hidden="true" />{t('Edit')}</a>
          <button type="button" class="lnk del" onclick={remove} data-delete>{t('Delete')}</button>
        </section>
        <p class="fitbit"><Pulse size={16} aria-hidden="true" /><span>{t('Fitbit: resting pulse, HRV and sleep as an observation')}</span><span class="pill">{t('planned')}</span></p>
      </div>
    </div>

    <CanDo items={CAN} />
  {/if}
</div>

<style>
  .ms {
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
  @media (min-width: 720px) {
    .pad {
      padding: 20px 24px;
    }
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    gap: 14px 20px;
    align-items: start;
  }
  @media (max-width: 959px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .main,
  .side {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .when {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .h1 {
    margin: 2px 0 12px;
    font: 800 var(--fs-title)/1.1 var(--font-brand);
    overflow-wrap: break-word;
  }
  .clockrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 24px;
  }
  .ct {
    font: 800 var(--fs-section)/1 var(--font-brand);
  }
  .cs {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .facts {
    flex: 1 1 220px;
    min-width: 0;
    margin: 0;
  }
  .facts div {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr);
    gap: 10px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .facts div:first-child {
    border-top: 0;
  }
  dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: break-word;
  }
  dd small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .note {
    padding: 18px;
    border: 1px solid var(--l2);
    border-radius: var(--radius-card);
    background: var(--warn-soft);
  }
  .nk {
    margin: 0 0 8px;
    color: var(--warn);
    font: 700 var(--fs-tiny)/1.3 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .nt {
    margin: 0 0 12px;
    font: italic var(--fs-sub)/1.45 var(--font-body);
    overflow-wrap: break-word;
  }
  .nrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
  }
  .dp {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .dp b {
    color: var(--ink);
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--accent);
    color: var(--paper);
    font: 600 var(--fs-small)/1.3 var(--font-body);
  }
  .hp {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--accent);
  }
  .starc {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0;
    padding: 12px 14px;
    border: 1px solid var(--l2);
    border-radius: var(--radius-card);
    background: var(--warn-soft);
    line-height: 1.35;
  }
  .starc + .starc {
    margin-top: 8px;
  }
  .starc b {
    display: block;
  }
  .starc small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .si {
    position: relative;
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    color: var(--warn);
  }
  .si b {
    position: absolute;
    padding-top: 2px;
    font-size: var(--fs-tiny);
    line-height: 1;
  }
  .acts {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .big {
    justify-content: center;
    width: 100%;
    min-height: 48px;
  }
  .addrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .grow {
    flex: 1 1 160px;
    min-width: 0;
  }
  .addrow .inp,
  .addrow .btn {
    min-height: 44px;
  }
  .lnk {
    align-self: center;
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
  .lnk.del {
    color: var(--bad);
  }
  .fitbit {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
