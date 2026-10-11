<script>
  /**
   * Hobby pages 2 «Kissenzeit»: the intervals, much simpler (mockup B2, Noah 10.10.2026, H4a, H22a).
   *   #/flow/act/meditation/timer?tpl=<id>   a template to change and start
   *   …/timer?new=1 | ?last=1 | ?min=45       a new one, like last time, or a challenge's duration
   * The duration in one tap, one row «keine · alle 5 · alle 10 · zufällig · eigene», «eigene» = tap the
   * ring to set a mark (30-second grid), tap it again to take it away, drag to move it, long press for
   * its own sound. One sound for all, start and end their own. Save as a named template, or just start.
   */
  import { ChevronLeft, Play, X, Volume2, Trash2 } from '@lucide/svelte';
  import Dial from '../../lib/flow/hobby/Dial.svelte';
  import { db } from '../../lib/db.js';
  import { medQuery, seedMed } from '../../lib/flow/data.svelte.js';
  import { artsOf, tplOf, newTplId, lastSession } from '../../lib/flowmed.js';
  import { planMarks, setMarkSound, marksOf, toggleMark, GRID } from '../../lib/flowbowl.js';
  import { SOUNDS, soundOk, playSound, vibrate, DEFAULT_SOUND, DEFAULT_END_SOUND } from '../../lib/flowsounds.js';
  import { saveTemplate, deleteTemplate } from '../../lib/flowdb.js';
  import { clockState, actName, toast } from '../../lib/flow/ui.svelte.js';
  import { tplName, artName } from '../../lib/flow/hobby/words.js';
  import { beginMed } from '../../lib/flow/hobby/medstart.js';
  import { clock } from '../../lib/flowtimer.js';
  import { localDay } from '../../lib/localday.js';
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

  const DURATIONS = [15, 20, 30, 45, 60];
  const MODES = [
    { key: 'none', name: 'none|bowls' },
    { key: 'every5', name: 'every 5 min' },
    { key: 'every10', name: 'every 10 min' },
    { key: 'random', name: 'at random' },
    { key: 'marks', name: 'own|marks' },
  ];

  /* the form, filled once from the address and the data */
  let ready = $state(false);
  let tplId = $state(null);
  let name = $state('');
  let minutes = $state(20);
  let custom = $state(false);
  let mode = $state('none'); // none | every5 | every10 | random | marks
  let marks = $state([]);
  let count = $state(2);
  let sound = $state(DEFAULT_SOUND);
  let endSound = $state(DEFAULT_END_SOUND);
  let art = $state(null);
  let saved = $state(false);
  const modeOf = (b) => (b.mode === 'every' ? (b.every === 10 ? 'every10' : b.every === 5 ? 'every5' : 'marks') : b.mode);
  $effect(() => {
    if (ready || !data || !data.medSeeded) return;
    const id = params.get('tpl');
    const x = id ? data.tpls.find((y) => y.id === id) : null;
    const last = params.get('last') ? lastSession(data.sessions, data.log, actId) : null;
    const src = x ?? (last ? { minutes: last.target ?? last.min, bowl: last.bowl, sound: last.sound, endSound: last.endSound, art: last.art } : null);
    if (src) {
      minutes = src.minutes;
      mode = modeOf(src.bowl);
      // «alle 7» (not on the row) becomes own marks with the same times
      marks = mode === 'marks' ? planMarks(src.minutes * 60, src.bowl) : [];
      count = src.bowl.count ?? 2;
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
    }
    const m = Number(params.get('min'));
    if (m > 0) minutes = Math.round(m);
    custom = !DURATIONS.includes(minutes);
    ready = true;
  });

  const total = $derived(Math.max(60, Math.round(minutes * 60)));
  const bowl = $derived(mode === 'every5' ? { mode: 'every', every: 5 } : mode === 'every10' ? { mode: 'every', every: 10 } : mode === 'random' ? { mode: 'random', count } : mode === 'marks' ? { mode: 'marks', marks: marksOf(marks).filter((m) => m.sec < total) } : { mode: 'none' });
  // random times are drawn at the start, so the dial shows none
  const shown = $derived(mode === 'random' ? [] : planMarks(total, bowl));
  function dialChange(list) {
    marks = list;
    mode = 'marks';
    saved = false;
  }
  function setMode(k) {
    if (k === 'marks' && mode !== 'marks' && mode !== 'random') marks = shown;
    mode = k;
    saved = false;
  }
  function setMinutes(m) {
    minutes = Math.max(1, Math.min(600, Math.round(Number(m) || 1)));
    saved = false;
  }

  /* long press: one mark gets its own sound */
  let longMark = $state(null);
  function onlong(m) {
    if (mode !== 'marks') {
      marks = shown;
      mode = 'marks';
    }
    longMark = m.sec;
  }
  const longSound = $derived(longMark == null ? null : (marksOf(marks).find((m) => m.sec === longMark)?.sound ?? ''));
  function setLong(id) {
    marks = setMarkSound(marks, longMark, id || null);
    saved = false;
  }
  /* the same by keyboard: a mark at a minute */
  let atMin = $state('');
  function addAt(e) {
    e.preventDefault();
    const sec = Math.round((Number(String(atMin).replace(',', '.')) * 60) / GRID) * GRID;
    if (!(sec > 0 && sec < total)) return;
    marks = toggleMark(mode === 'marks' ? marks : shown, sec);
    mode = 'marks';
    atMin = '';
  }
  const hear = (id) => (id === 'vibrate' ? vibrate() : playSound(id, 0, 0.4));
  const soundName = (id) => t(SOUNDS.find((s) => s.id === id)?.name ?? '');

  const hintLine = $derived.by(() => {
    if (mode === 'marks') return shown.length ? t('«own»: set the marks right on the clock. Set now: {list}', { list: shown.map((m) => clock(m.sec)).join(' · ') }) : t('«own»: set the marks right on the clock. Tap the ring.');
    if (mode === 'random') return t('{n} sounds at random times, drawn at the start.', { n: count });
    if (mode === 'none') return t('Only start and end. Tap the ring to set a mark.');
    return t('A sound at {list}. Tap the ring to set your own.', { list: shown.map((m) => clock(m.sec)).join(' · ') || '–' });
  });

  /* save, start */
  const running = $derived(!!clockState.tm);
  function record() {
    const was = tplId ? data.tpls.find((y) => y.id === tplId) : null;
    const nm = name.trim() || `${artName(arts.all.find((a) => a.id === art)) || t('Meditation')} ${minutes}`;
    const same = was && tplName(was) === nm;
    return tplOf({ ...(was ?? {}), id: tplId ?? newTplId(), actId, name: same ? was.name : nm, nameDe: same ? was.nameDe : null, art, minutes, bowl, sound, endSound }, actId);
  }
  async function save() {
    const x = record();
    await saveTemplate(db, x);
    tplId = x.id;
    name = tplName(x);
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
  <p class="back"><a href={base}><ChevronLeft size={16} aria-hidden="true" />{t('Back to {name}', { name: act ? actName(act) : t('Meditation') })}</a></p>
  <h1 class="h1" tabindex="-1" data-page-title>{tplId ? name : t('Intervals')}</h1>

  {#if data && ready}
    <div class="cols">
      <section class="surf pad dialbox" aria-label={t('Clock')}>
        <Dial {total} marks={shown} editable labels onchange={dialChange} {onlong} label={hintLine}>
          <b class="bigt num">{clock(total)}</b>
          <span class="dk">{art ? artName(arts.all.find((a) => a.id === art)) : ''}</span>
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

      <div class="side">
        <section class="surf pad">
          <p class="lbl fl" id="dur">{t('Duration')}</p>
          <div class="seg" role="group" aria-labelledby="dur">
            {#each DURATIONS as m (m)}<button type="button" class="sb num" class:on={!custom && minutes === m} aria-pressed={!custom && minutes === m} onclick={() => ((custom = false), setMinutes(m))}>{m}</button>{/each}
            <button type="button" class="sb" class:on={custom} aria-pressed={custom} aria-label={t('Other duration')} onclick={() => (custom = true)}>…</button>
          </div>
          {#if custom}
            <label class="inl">{t('minutes')} <input class="inp n" type="number" min="1" max="600" inputmode="numeric" value={minutes} oninput={(e) => setMinutes(e.currentTarget.value)} data-min /></label>
          {/if}

          <p class="lbl fl" id="modes">{t('Sounds in between')}</p>
          <div class="pillrow" role="group" aria-labelledby="modes">
            {#each MODES as m (m.key)}<button type="button" class="pb" class:on={mode === m.key} aria-pressed={mode === m.key} onclick={() => setMode(m.key)}>{t(m.name)}</button>{/each}
          </div>
          {#if mode === 'random'}
            <label class="inl"><input class="inp n" type="number" min="1" max="10" inputmode="numeric" bind:value={count} /> {t('sounds at random times')}</label>
          {/if}
          <p class="box">{hintLine}</p>
          {#if mode === 'marks' && shown.length}
            <div class="marks">
              {#each shown as m (m.sec)}<button type="button" class="mchip num" aria-label={t('Remove the mark at {t}', { t: clock(m.sec) })} onclick={() => dialChange(marksOf(marks).filter((x) => x.sec !== m.sec))}>{clock(m.sec)}{#if m.sound}{' · '}{soundName(m.sound)}{/if}<X size={14} aria-hidden="true" /></button>{/each}
            </div>
          {/if}
          <form class="inl" onsubmit={addAt}>
            <label>{t('Mark at minute')} <input class="inp n" type="text" inputmode="decimal" bind:value={atMin} placeholder="7,5" /></label>
            <button type="submit" class="btn">{t('Set')}</button>
          </form>

          <p class="lbl fl" id="snd">{t('Sound')}</p>
          <div class="srow">
            <Volume2 size={18} aria-hidden="true" />
            <select class="sel" aria-labelledby="snd" bind:value={sound}>{#each SOUNDS as s (s.id)}<option value={s.id}>{t(s.name)}</option>{/each}</select>
            <button type="button" class="hear" onclick={() => hear(sound)}><Play size={14} aria-hidden="true" />{t('listen')}</button>
          </div>
          <div class="srow">
            <span class="sl">{t('Start and end')}</span>
            <select class="sel" aria-label={t('Start and end')} bind:value={endSound}>{#each SOUNDS as s (s.id)}<option value={s.id}>{t(s.name)}</option>{/each}</select>
            <button type="button" class="hear" onclick={() => hear(endSound)}><Play size={14} aria-hidden="true" />{t('listen')}</button>
          </div>
          <label class="blk"><span class="lbl fl">{t('Kind')}</span>
            <select class="sel" bind:value={art}>
              <option value={null}>{t('no kind')}</option>
              {#each arts.all as a (a.id)}<option value={a.id}>{artName(a)}</option>{/each}
            </select>
          </label>
        </section>

        <section class="surf pad">
          <h2 class="zlabel">{t('As a template')}</h2>
          <label class="blk"><span class="lbl fl">{t('Name')}</span><input class="inp" bind:value={name} maxlength="40" oninput={() => (saved = false)} data-tpl-name /></label>
          <div class="acts">
            <button type="button" class="btn hi big" onclick={start} data-start="timer"><Play size={18} aria-hidden="true" />{running ? t('Open the running session') : t('Start|session')}</button>
            <button type="button" class="btn big" onclick={save} disabled={saved}>{saved ? t('Saved ✓') : t('Save')}</button>
            {#if tplId}<button type="button" class="btn big" onclick={remove}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>{/if}
          </div>
        </section>
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
    color: var(--ink-3);
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
    margin: 14px 0 6px;
  }
  .fl:first-child {
    margin-top: 0;
  }
  .seg {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
    gap: 6px;
  }
  .sb {
    min-height: 48px;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .sb.on {
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }
  .pillrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pb {
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .pb.on {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .inl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    color: var(--ink-2);
  }
  .inl label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .n {
    width: 90px;
    min-height: 44px;
  }
  .inl .btn {
    min-height: 44px;
  }
  .box {
    margin: 10px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--ok-soft);
    color: var(--ok);
    font-size: var(--fs-small);
  }
  .marks {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .mchip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
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
  .blk {
    display: block;
    margin-top: 6px;
  }
  .blk .sel,
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
