<script>
  /**
   * Hobby pages 2 «Kissenzeit»: the intervals, much simpler (mockup B2, Noah 10.10.2026, H4a, H22a).
   *   #/flow/act/meditation/timer?tpl=<id>   a template to change and start
   *   …/timer?new=1 | ?last=1 | ?min=45       a new one, like last time, or a challenge's duration
   * v0.93.0 «Meditation Wünsche» (mockup F, Noah «1-5 a» 11.10.2026): «Neue Sitzung». On top the next
   * star and the stars reached (a tap opens «Alle Sterne»). The duration 10 · 15 · 20 · 30 · 45 · 60 or
   * typed («oder frei»). «Klänge dazwischen»: keine · zufällig · eigene; «eigene» is «alle N Minuten» or
   * «an Minute 3, 7, 12», with one line when the sounds come. Tapping the ring still sets a mark (30-second
   * grid), tapping it again takes it away, drag moves it, long press gives it its own sound; on a phone the
   * ring stays away (mockup F) and «an Minute» sets the marks. The sounds fold into one line «Klang: … ·
   * ändern ›». A new session offers «Als Vorlage speichern?» with a name made from kind, duration and
   * sounds («nicht jetzt» hides it for this visit); a template keeps Save and Delete. «Starten · N Min».
   */
  import { ChevronLeft, ChevronRight, Play, X, Volume2, Trash2, Star } from '@lucide/svelte';
  import Dial from '../../lib/flow/hobby/Dial.svelte';
  import { db } from '../../lib/db.js';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { artsOf, tplOf, newTplId, lastSession, MED_DURATIONS, freeMinutes, soundsOf, bowlOfSounds, marksText, tplSuggestion } from '../../lib/flowmed.js';
  import { planMarks, setMarkSound, marksOf, parseMarks, GRID } from '../../lib/flowbowl.js';
  import { msContext, actMilestones, evaluate, isOff, newStars, recentStars } from '../../lib/flowms.js';
  import { SOUNDS, soundOk, playSound, vibrate, DEFAULT_SOUND, DEFAULT_END_SOUND } from '../../lib/flowsounds.js';
  import { saveTemplate, deleteTemplate, saveStars } from '../../lib/flowdb.js';
  import { clockState, actName, toast } from '../../lib/flow/ui.svelte.js';
  import { tplName, artName, msName, val } from '../../lib/flow/hobby/words.js';
  import { beginMed } from '../../lib/flow/hobby/medstart.js';
  import { clock } from '../../lib/flowtimer.js';
  import { localDay } from '../../lib/localday.js';
  import { phone } from '../../lib/media.svelte.js';
  import { t } from '../../lib/i18n.svelte.js';

  let { actId = 'meditation', params = new URLSearchParams() } = $props();
  const today = localDay();
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    seedMed(data, actId);
  });
  const act = $derived(data?.acts.find((a) => a.id === actId) ?? null);
  const base = $derived(`#/flow/act/${encodeURIComponent(actId)}`);
  const arts = $derived(artsOf(data?.arts));

  const MODES = [
    { key: 'none', name: 'none|bowls' },
    { key: 'random', name: 'at random' },
    { key: 'own', name: 'own|marks' },
  ];

  /* the milestones on top (the same as the meditation page's «Nächster Stern»); stars reached stay */
  const ctx = $derived(data ? msContext({ acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays }) : null);
  const stored = $derived(new Map((data?.stars ?? []).map((s) => [s.id, s.day])));
  const ms = $derived(act && ctx ? actMilestones(act).map((m) => ({ ...evaluate(m, ctx, stored, data.tune), off: isOff(m, data.tune) })) : []);
  $effect(() => {
    const fresh = newStars(ms, stored);
    if (fresh.length) saveStars(db, fresh);
  });
  const nextStar = $derived(ms.filter((r) => !r.off && !r.done).sort((a, b) => b.progress - a.progress)[0] ?? null);
  const gotStars = $derived(recentStars(ms, 3));
  const pct = (r) => Math.round((r?.progress ?? 0) * 100);

  /* the form, filled once from the address and the data */
  let ready = $state(false);
  let tplId = $state(null);
  let name = $state('');
  let named = $state(false); // the name was typed: no more suggestions
  let minutes = $state(20);
  let mode = $state('none'); // none | random | own
  let own = $state('every'); // every | marks
  let every = $state(5);
  let marks = $state([]);
  let marksIn = $state('');
  let count = $state(2);
  let sound = $state(DEFAULT_SOUND);
  let endSound = $state(DEFAULT_END_SOUND);
  let art = $state(null);
  let saved = $state(false);
  let later = $state(false); // «nicht jetzt»: the card goes for this visit
  let soundsOpen = $state(false);
  $effect(() => {
    if (ready || !data || !data.medSeeded) return;
    const id = params.get('tpl');
    const x = id ? data.tpls.find((y) => y.id === id) : null;
    const last = params.get('last') ? lastSession(data.sessions, data.log, actId) : null;
    const src = x ?? (last ? { minutes: last.target ?? last.min, bowl: last.bowl, sound: last.sound, endSound: last.endSound, art: last.art } : null);
    if (src) {
      minutes = src.minutes;
      const s = soundsOf(src.bowl);
      mode = s.mode;
      own = s.own;
      every = s.every;
      count = s.count;
      marks = s.marks;
      marksIn = marksText(s.marks);
      sound = soundOk(src.sound ?? data.sound, DEFAULT_SOUND);
      endSound = soundOk(src.endSound, DEFAULT_END_SOUND);
      art = src.art ?? null;
    } else {
      sound = soundOk(data.sound, DEFAULT_SOUND);
      art = arts.favs[0] ?? null;
    }
    if (x) {
      tplId = x.id;
      name = tplName(x);
      named = true;
    }
    const m = Number(params.get('min'));
    if (m > 0) minutes = Math.min(600, Math.round(m));
    ready = true;
  });

  const total = $derived(Math.max(60, Math.round(minutes * 60)));
  const bowl = $derived(bowlOfSounds({ mode, own, every, count, marks }, total));
  // random times are drawn at the start, so the dial shows none
  const shown = $derived(mode === 'random' ? [] : planMarks(total, bowl));
  const kindName = $derived(art ? artName(arts.all.find((a) => a.id === art)) : '');
  const suggestion = $derived.by(() => {
    const s = tplSuggestion({ kind: kindName || t('Meditation'), minutes, bowl });
    return s.key ? `${s.head} · ${t(s.key, s.vars)}` : s.head;
  });
  $effect(() => {
    if (ready && !named) name = suggestion;
  });
  const changed = () => (saved = false);
  function dialChange(list) {
    marks = marksOf(list);
    marksIn = marksText(marks);
    mode = 'own';
    own = 'marks';
    changed();
  }
  function setMode(k) {
    mode = k;
    changed();
  }
  function setOwn(k, fill = true) {
    // «an Minute» starts with the times «alle N» gave, so nothing jumps (not while typing into the field)
    if (fill && k === 'marks' && own !== 'marks' && !marksOf(marks).length) {
      marks = planMarks(total, { mode: 'every', every });
      marksIn = marksText(marks);
    }
    own = k;
    changed();
  }
  function setEvery(v) {
    const n = Math.round(Number(v));
    if (n >= 1) every = Math.min(60, n);
    own = 'every';
    changed();
  }
  function typeMarks(v) {
    marksIn = v;
    const had = new Map(marksOf(marks).map((m) => [m.sec, m]));
    marks = marksOf(parseMarks(v).map((n) => Math.round((n * 60) / GRID) * GRID).filter((sec) => sec > 0 && sec < total).map((sec) => had.get(sec) ?? { sec }));
    own = 'marks';
    changed();
  }
  function setMinutes(m) {
    minutes = Math.max(1, Math.min(600, Math.round(Number(m) || 1)));
    changed();
  }
  function typeMinutes(v) {
    const n = freeMinutes(v);
    if (n != null) setMinutes(n);
  }

  /* long press: one mark gets its own sound */
  let longMark = $state(null);
  function onlong(m) {
    if (mode !== 'own' || own !== 'marks') dialChange(shown);
    longMark = m.sec;
  }
  const longSound = $derived(longMark == null ? null : (marksOf(marks).find((m) => m.sec === longMark)?.sound ?? ''));
  function setLong(id) {
    marks = setMarkSound(marks, longMark, id || null);
    changed();
  }
  const hear = (id) => (id === 'vibrate' ? vibrate() : playSound(id, 0, 0.4));
  const soundName = (id) => t(SOUNDS.find((s) => s.id === id)?.name ?? '');

  const hintLine = $derived.by(() => {
    if (mode === 'random') return t('{n} sounds at random times, drawn at the start.', { n: count });
    if (!shown.length) return t('Only start and end. Tap the ring to set a mark.');
    return t('A sound at {list}. Tap the ring to set your own.', { list: shown.map((m) => clock(m.sec)).join(' · ') });
  });
  const whenLine = $derived(shown.length ? t('Sounds at {list} · end {end}', { list: shown.map((m) => clock(m.sec)).join(' · '), end: clock(total) }) : t('Only start and end · end {end}', { end: clock(total) }));

  /* save, start */
  const running = $derived(!!clockState.tm);
  function record() {
    const was = tplId ? data.tpls.find((y) => y.id === tplId) : null;
    const nm = name.trim() || suggestion;
    const same = was && tplName(was) === nm;
    return tplOf({ ...(was ?? {}), id: tplId ?? newTplId(), actId, name: same ? was.name : nm, nameDe: same ? was.nameDe : null, art, minutes, bowl, sound, endSound }, actId);
  }
  async function save() {
    const x = record();
    await saveTemplate(db, x);
    tplId = x.id;
    name = tplName(x);
    named = true;
    saved = true;
    toast(t('Template «{name}» saved', { name: name }));
  }
  async function remove() {
    if (!tplId) return;
    const was = data.tpls.find((y) => y.id === tplId);
    await deleteTemplate(db, tplId);
    toast(t('Template deleted'), was ? () => saveTemplate(db, was) : null);
    location.hash = base;
  }
  // v0.86.0: the one start of a session (lib/flow/hobby/medstart.js), the same as the page and the start sheet
  const start = () => beginMed(actId, data, { minutes, bowl, sound, endSound, art, tplId, name: tplId ? name : null });
</script>

<div class="mt">
  <p class="back"><a href={base}><ChevronLeft size={16} aria-hidden="true" />{act ? actName(act) : t('Meditation')}</a></p>
  <h1 class="h1" tabindex="-1" data-page-title>{tplId ? name : t('New session')}</h1>

  {#if data && ready}
    {#if nextStar || gotStars.length}
      <a class="surf msrow" href="{base}/mehr?open=stars" data-ms-row>
        <span class="msi" aria-hidden="true"><Star size={20} /></span>
        <span class="mst">
          {#if nextStar}
            <b>{t('Next star: {name}', { name: msName(nextStar.m) })}</b>
            <span class="msbar" role="progressbar" aria-label={msName(nextStar.m)} aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct(nextStar)}><i style:width="{pct(nextStar)}%"></i></span>
            <small>{t('{n} to go', { n: val(Math.max(0, Math.round((nextStar.target - nextStar.value) * 10) / 10), nextStar.m.unit) })}</small>
          {:else}
            <b>{t('All stars reached')}</b>
          {/if}
          {#if gotStars.length}
            <span class="got" aria-label={t('Stars reached')}>
              {#each gotStars as x (x.star.id)}<span class="gb" data-got={x.star.id}><Star size={12} aria-hidden="true" />{msName(x.r.m)} {x.star.star}</span>{/each}
            </span>
          {/if}
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </a>
    {/if}

    <div class="cols">
      {#if !phone.matches}
        <section class="surf pad dialbox" aria-label={t('Clock')}>
          <Dial {total} marks={shown} editable labels onchange={dialChange} {onlong} label={hintLine}>
            <b class="bigt num">{clock(total)}</b>
            <span class="dk">{kindName}</span>
            <span class="dh">{t('tap = set a mark')}</span>
          </Dial>
          <p class="hint c">{t('Tapping the ring sets a mark, tapping it again removes it. Drag to move, long press for its own sound.')}</p>
          {#if longMark != null}
            <div class="long" role="group" aria-label={t('Sound for the mark at {t}', { t: clock(longMark) })}>
              <label><span class="lbl fl">{t('Sound for the mark at {t}', { t: clock(longMark) })}</span>
                <select class="sel" value={longSound} onchange={(e) => setLong(e.currentTarget.value)}>
                  <option value="">{t('like all: {name}', { name: soundName(sound) })}</option>
                  {#each SOUNDS as s (s.id)}<option value={s.id}>{t(s.name)}</option>{/each}
                </select>
              </label>
              <button type="button" class="ib" aria-label={t('Close')} onclick={() => (longMark = null)}><X size={18} aria-hidden="true" /></button>
            </div>
          {/if}
        </section>
      {/if}

      <div class="side">
        <section class="surf pad">
          <p class="lbl fl" id="dur">{t('Duration')}</p>
          <div class="chips" role="group" aria-labelledby="dur">
            {#each MED_DURATIONS as m (m)}<button type="button" class="chip num" class:on={minutes === m} aria-pressed={minutes === m} onclick={() => setMinutes(m)} data-dur={m}>{m}</button>{/each}
          </div>
          <label class="free"><span>{t('or free:')}</span><input class="inp n num" type="number" min="1" max="600" inputmode="numeric" value={minutes} oninput={(e) => typeMinutes(e.currentTarget.value)} data-min /><span>{t('minutes')}</span></label>

          <p class="lbl fl" id="modes">{t('Sounds in between')}</p>
          <div class="chips" role="group" aria-labelledby="modes">
            {#each MODES as m (m.key)}<button type="button" class="chip" class:on={mode === m.key} aria-pressed={mode === m.key} onclick={() => setMode(m.key)} data-mode={m.key}>{t(m.name)}</button>{/each}
          </div>
          {#if mode === 'random'}
            <label class="free"><input class="inp n num" type="number" min="1" max="10" inputmode="numeric" bind:value={count} oninput={changed} /> {t('sounds at random times')}</label>
          {:else if mode === 'own'}
            <div class="ownp" role="radiogroup" aria-label={t('own|marks')}>
              <label class="orow"><input type="radio" name="own" value="every" checked={own === 'every'} onchange={() => setOwn('every')} data-own="every" /><span>{t('every|minutes')}</span><input class="inp s num" type="number" min="1" max="60" inputmode="numeric" value={every} aria-label={t('every N minutes')} onfocus={() => setOwn('every')} oninput={(e) => setEvery(e.currentTarget.value)} data-every /><span>{t('minutes')}</span></label>
              <label class="orow"><input type="radio" name="own" value="marks" checked={own === 'marks'} onchange={() => setOwn('marks')} data-own="marks" /><span>{t('at minute|marks')}</span><input class="inp m" type="text" inputmode="decimal" placeholder="3, 7, 12" value={marksIn} aria-label={t('at minute|marks')} onfocus={() => setOwn('marks', false)} oninput={(e) => typeMarks(e.currentTarget.value)} data-marks /></label>
              <p class="when num" data-when>{whenLine}</p>
            </div>
          {/if}

          <p class="sline">
            {t('Sound: {a} · start and end: {b}', { a: soundName(sound), b: soundName(endSound) })}{' · '}<button type="button" class="lk" aria-expanded={soundsOpen} onclick={() => (soundsOpen = !soundsOpen)} data-sounds>{t('change')}<ChevronRight size={14} aria-hidden="true" /></button>
          </p>
          {#if soundsOpen}
            <div class="srow">
              <Volume2 size={18} aria-hidden="true" />
              <select class="sel" aria-label={t('Sound')} bind:value={sound} onchange={changed}>{#each SOUNDS as s (s.id)}<option value={s.id}>{t(s.name)}</option>{/each}</select>
              <button type="button" class="hear" onclick={() => hear(sound)}><Play size={14} aria-hidden="true" />{t('listen')}</button>
            </div>
            <div class="srow">
              <span class="sl">{t('Start and end')}</span>
              <select class="sel" aria-label={t('Start and end')} bind:value={endSound} onchange={changed}>{#each SOUNDS as s (s.id)}<option value={s.id}>{t(s.name)}</option>{/each}</select>
              <button type="button" class="hear" onclick={() => hear(endSound)}><Play size={14} aria-hidden="true" />{t('listen')}</button>
            </div>
          {/if}
          <label class="kind"><span class="lbl">{t('Kind')}</span>
            <select class="sel" bind:value={art} onchange={changed}>
              <option value={null}>{t('no kind')}</option>
              {#each arts.all as a (a.id)}<option value={a.id}>{artName(a)}</option>{/each}
            </select>
          </label>
        </section>

        {#if tplId}
          <section class="surf pad">
            <h2 class="zlabel">{t('Template')}</h2>
            <label class="blk"><span class="lbl fl">{t('Name')}</span><input class="inp" bind:value={name} maxlength="40" oninput={changed} data-tpl-name /></label>
            <div class="acts">
              <button type="button" class="btn big" onclick={save} disabled={saved}>{saved ? t('Saved ✓') : t('Save')}</button>
              <button type="button" class="btn big" onclick={remove}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
            </div>
          </section>
        {:else if !later}
          <section class="savec" aria-labelledby="save-h" data-save-card>
            <div class="sh">
              <span class="sicon" aria-hidden="true"><Star size={20} /></span>
              <div>
                <h2 id="save-h" class="st">{t('Save as a template?')}</h2>
                <p class="ss">{t('Then you start it next time with one tap.')}</p>
              </div>
            </div>
            <input class="inp nm" bind:value={name} maxlength="40" aria-label={t('Name')} oninput={() => ((named = true), changed())} data-tpl-name />
            <p class="ss">{t('Suggested from kind, duration and sounds. You can change it.')}</p>
            <div class="sa">
              <button type="button" class="btn sv" onclick={save} data-tpl-save><Star size={16} aria-hidden="true" />{t('Save')}</button>
              <button type="button" class="later" onclick={() => (later = true)} data-tpl-later>{t('not now')}</button>
            </div>
          </section>
        {/if}

        <button type="button" class="btn hi go" onclick={start} data-start="timer"><Play size={22} aria-hidden="true" />{running ? t('Open the running session') : t('Start · {n} min', { n: minutes })}</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .mt {
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
  .h1 {
    margin: 0;
    font: 800 var(--fs-title)/1.1 var(--font-brand);
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
  .msrow {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 64px;
    padding: 12px 18px;
    color: var(--ink);
    text-decoration: none;
  }
  .msrow > :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  .msi {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .mst {
    flex: 1;
    min-width: 0;
    line-height: 1.35;
  }
  .mst b {
    display: block;
    font-weight: 600;
  }
  .mst small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .msbar {
    display: block;
    height: 6px;
    margin: 6px 0 2px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .msbar i {
    display: block;
    height: 100%;
    background: var(--l2);
  }
  .got {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .gb {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font: 600 var(--fs-tiny)/1.4 var(--font-body);
  }
  .gb :global(svg) {
    fill: var(--l2);
    color: var(--l2);
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  @media (max-width: 899px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  .dialbox {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 28px;
  }
  .bigt {
    font: 800 var(--fs-display)/1 var(--font-brand);
  }
  .dk {
    color: var(--ink-2);
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .dh {
    color: var(--accent);
    font-size: var(--fs-small);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .c {
    text-align: center;
  }
  .long {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .long label {
    flex: 1;
    min-width: 0;
  }
  .fl {
    margin: 16px 0 8px;
  }
  .fl:first-child {
    margin-top: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    min-width: 52px;
    min-height: 44px;
    padding: 0 16px;
    border: 1.5px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body)/1 var(--font-body);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--ok-soft);
    color: var(--accent);
  }
  .free {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .n {
    width: 96px;
    min-height: 48px;
    text-align: right;
    font-weight: 600;
  }
  .ownp {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--paper-2);
  }
  .orow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    cursor: pointer;
  }
  .orow input[type='radio'] {
    flex: none;
    width: 22px;
    height: 22px;
    margin: 0;
    accent-color: var(--accent);
  }
  .s {
    width: 72px;
    min-height: 44px;
    text-align: center;
  }
  .m {
    flex: 1 1 110px;
    min-width: 0;
    max-width: 180px;
    min-height: 44px;
  }
  .when {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sline {
    margin: 14px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .srow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    color: var(--ink-2);
  }
  .srow .sel {
    flex: 1 1 150px;
    min-width: 0;
    min-height: 44px;
  }
  .sl {
    flex: none;
    font-size: var(--fs-small);
  }
  .hear {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .kind {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }
  .kind .lbl {
    margin: 0;
  }
  .kind .sel {
    flex: 1 1 160px;
    min-width: 0;
    min-height: 44px;
  }
  .blk {
    display: block;
    margin-top: 6px;
  }
  .blk .inp {
    min-height: 44px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }
  .acts .btn {
    min-height: 48px;
    flex: 1 1 120px;
  }
  .savec {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px;
    border: 1.5px solid var(--accent-soft);
    border-radius: var(--radius-card);
    background: linear-gradient(135deg, var(--ok-soft), var(--paper));
  }
  .sh {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sicon {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--paper);
    color: var(--accent);
  }
  .sicon :global(svg) {
    fill: var(--accent);
  }
  .st {
    margin: 0;
    font: 700 var(--fs-sub)/1.2 var(--font-body);
  }
  .ss {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nm {
    min-height: 48px;
    font-weight: 600;
  }
  .sa {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .sv {
    flex: 1 1 160px;
    min-height: 48px;
    justify-content: center;
    gap: 8px;
    background: var(--paper);
  }
  .later {
    min-height: 48px;
    padding: 0 16px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 600 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .go {
    width: 100%;
    min-height: 64px;
    justify-content: center;
    gap: 10px;
    border-radius: 14px;
    font: 700 var(--fs-sub)/1.2 var(--font-body);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
