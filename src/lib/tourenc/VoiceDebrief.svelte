<script>
  /**
   * Touren c 68 «Rückblick als Sprachnachricht» (Noah 26.10.2026 «3a 4b, a zuschaltbar», mockup C68): in the debrief
   * form a fold «Rückblick sprechen». Tell up to a minute (the dictation writes it; typing works too), then
   * «Gliedern»: Gemini (free) or, without it, the app itself makes key points. Each point: ✓ keep or ✗ leave, its
   * kind can change. «Übernehmen» puts the kept ones where you would tap them (voicepoints.js applyPoints).
   * The sound: by default nothing is recorded (only the text stays); «Keep the sound» (a switch, on this device)
   * records it as well and keeps it with the debrief (d.voice) to listen to again.
   * Props: trip, d (the debrief, changed in place), items, persist().
   */
  import { liveQuery } from 'dexie';
  import { Mic, Check, X, Sparkles, Play } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, isDe } from '../i18n.svelte.js';
  import SpeakButton from '../ui/SpeakButton.svelte';
  import VoiceRec from '../eingabe/VoiceRec.svelte';
  import Seg from '../ui/Seg.svelte';
  import { appendSpoken } from '../speak.js';
  import { askGemini, geminiError } from '../assistent/gemini.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { KINDS, GEMINI_ASK, MAX_TEXT, parseLines, localPoints, withItems, applyPoints } from './voicepoints.js';

  let { trip, d, items = [], persist } = $props();
  const KEEP_KEY = 'tourenc.voiceKeep';
  const keepQ = liveQuery(() => db.settings.get(KEEP_KEY));
  const keepSound = $derived($keepQ?.value === true);
  let text = $state('');
  let points = $state(null);
  let busy = $state(false);
  let note = $state('');
  let recOpen = $state(false);

  async function sort() {
    const body = text.trim().slice(0, MAX_TEXT);
    if (!body || busy) return;
    busy = true;
    note = '';
    let list = null;
    const r = await askGemini(GEMINI_ASK[isDe() ? 'de' : 'en'], { context: body, lang: isDe() ? 'de' : 'en' });
    if (r.ok) list = parseLines(r.text);
    if (!list?.length) {
      list = localPoints(body);
      note = r.ok || r.error === 'off' ? t('Sorted by the app itself (sentence by sentence).') : `${geminiError(r.error)} ${t('Sorted by the app itself (sentence by sentence).')}`;
    }
    points = withItems(list, trip, items);
    busy = false;
  }
  const kept = $derived((points ?? []).filter((p) => p.keep).length);

  async function take() {
    if (!points || busy) return;
    busy = true;
    const now = new Date().toISOString();
    const out = applyPoints($state.snapshot(points), { trip, learnings: await db.learnings.toArray(), now });
    const before = { items: { ...d.items }, missing: [...d.missing] };
    for (const [id, v] of Object.entries(out.items)) d.items[id] = v;
    d.missing.push(...out.missing);
    await db.transaction('rw', [db.learnings, db.notes], async () => {
      if (out.learnings.length) await db.learnings.bulkPut(out.learnings);
      if (out.notes.length) await db.notes.bulkPut(out.notes);
    });
    await persist();
    const n = kept;
    points = null;
    text = '';
    busy = false;
    offerDone(tn(n, '{n} point taken over.', '{n} points taken over.'), async () => {
      d.items = before.items;
      d.missing = before.missing;
      await db.learnings.bulkDelete(out.learnings.map((l) => l.id));
      await db.notes.bulkDelete(out.notes.map((x) => x.id));
      await persist();
    });
  }
  async function asNote() {
    const body = text.trim();
    if (!body) return;
    const now = new Date().toISOString();
    const rec = { id: `note-v${Date.now().toString(36)}`, kind: 'note', status: 'kept', at: now, editedAt: now, title: trip?.title ?? '', text: body, topic: 'trip', pinned: false, photo: null, tripId: trip?.id ?? null };
    await db.notes.put(rec);
    points = null;
    text = '';
    offerDone(t('Saved as a note of the trip.'), () => db.notes.delete(rec.id));
  }
  const setKeep = (on) => db.settings.put({ key: KEEP_KEY, value: !!on });
  async function soundDone({ src, s }) {
    recOpen = false;
    d.voice = { src, s, at: new Date().toISOString() };
    await persist();
  }
  async function dropSound() {
    delete d.voice;
    await persist();
  }
</script>

<section class="rv-sec" aria-labelledby="vd-h" data-voice-debrief>
  <details class="vd" open={!!points}>
    <summary class="rv-h"><div><h2 id="vd-h"><Mic size={18} aria-hidden="true" /> {t('Speak your look back')}</h2><p class="rv-sub">{t('Up to a minute; the app makes key points you confirm')}</p></div></summary>
    <div class="rv-box pad">
      {#if !points}
        <textarea class="inp" rows="4" bind:value={text} maxlength={MAX_TEXT} placeholder={t('e.g. The rain jacket was too warm, the stove was never used, I missed a second rear light …')} aria-label={t('What you tell about the trip')} data-voice-text></textarea>
        <div class="row"><SpeakButton always wrap onsaid={(w) => (text = appendSpoken(text, w))} /></div>
        <label class="keep"><input type="checkbox" checked={keepSound} onchange={(e) => setKeep(e.currentTarget.checked)} data-voice-keep /><span>{t('Also keep the sound to listen to again')}<small>{t('Off: only the text stays, no sound is kept. On this device.')}</small></span></label>
        {#if keepSound}
          {#if d.voice?.src}
            <p class="snd"><audio controls src={d.voice.src}></audio><button type="button" class="btn sm" onclick={dropSound}>{t('Delete the sound')}</button></p>
          {:else if recOpen}
            <VoiceRec ondone={soundDone} oncancel={() => (recOpen = false)} />
          {:else}
            <button type="button" class="btn sm" onclick={() => (recOpen = true)} data-voice-rec><Play size={16} aria-hidden="true" />{t('Record the sound (1 min)')}</button>
          {/if}
        {/if}
        <p class="acts"><button type="button" class="btn hi" disabled={busy || text.trim().length < 6} onclick={sort} data-voice-sort><Sparkles size={18} aria-hidden="true" />{busy ? t('Sorting …') : t('Make key points')}</button>
          <button type="button" class="btn" disabled={!text.trim()} onclick={asNote} data-voice-note>{t('Only save as a note')}</button></p>
        <p class="tp-small tp-muted">{t('With the helper code the free Gemini sorts the text; without it the app goes sentence by sentence. Nothing is kept without your tap.')}</p>
      {:else}
        {#if note}<p class="tp-small tp-muted" role="status">{note}</p>{/if}
        <ul class="kp">
          {#each points as p, i (i)}
            <li data-voice-point={i}>
              <div class="kt"><b>{p.text}</b>
                <Seg small value={p.kind} options={KINDS.map((k) => ({ key: k.key, name: t(k.name) }))} onchange={(v) => (points[i].kind = v)} label={t('Where it goes')} />
                {#if p.itemName}<small>{t('Item: {name}', { name: p.itemName })}</small>{/if}
              </div>
              <span class="yn">
                <button type="button" class="sq" class:y={p.keep} aria-pressed={p.keep} aria-label={t('Keep')} onclick={() => (points[i].keep = true)} data-voice-yes><Check size={16} aria-hidden="true" /></button>
                <button type="button" class="sq" class:y={!p.keep} aria-pressed={!p.keep} aria-label={t('Leave out')} onclick={() => (points[i].keep = false)} data-voice-no><X size={16} aria-hidden="true" /></button>
              </span>
            </li>
          {/each}
        </ul>
        <p class="acts"><button type="button" class="btn hi" disabled={busy || !kept} onclick={take} data-voice-take>{tn(kept, 'Take over {n}', 'Take over {n}')}</button>
          <button type="button" class="btn" onclick={() => (points = null)}>{t('Back to the text')}</button></p>
        <p class="tp-small tp-muted">{t('Taken over, a point lands where you would tap it: not needed, was missing, Learned, a note of the trip, or a bike note in the Inbox.')}</p>
      {/if}
    </div>
  </details>
</section>

<style>
  .vd summary { cursor: pointer; list-style: none; }
  .vd summary::-webkit-details-marker { display: none; }
  .vd h2 { display: flex; align-items: center; gap: 6px; }
  textarea { width: 100%; }
  .row { margin: 6px 0; }
  .keep { display: flex; gap: 8px; align-items: flex-start; margin: 8px 0; }
  .keep span { display: grid; }
  .keep small { color: var(--ink-2); font-size: var(--fs-small); }
  .snd { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 6px 0; }
  .snd audio { max-width: 100%; }
  .acts { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 6px; }
  .kp { list-style: none; margin: 0; padding: 0; }
  .kp li { display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-top: 1px solid var(--line); }
  .kp li:first-child { border-top: 0; }
  .kt { flex: 1; min-width: 0; display: grid; gap: 6px; }
  .kt small { color: var(--ink-2); font-size: var(--fs-small); }
  .yn { display: flex; gap: 6px; flex: none; }
  .sq { width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); display: grid; place-items: center; cursor: pointer; }
  .sq.y { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
</style>
