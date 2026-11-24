<script>
  /*
   * «Frag Gemini» (Noah 23.11.2026 «1a 2a 3a 4b»): the third way of the Assistant, next to «Frag die App». A free question
   * to Gemini by text, voice (the microphone of the browser) or photo; the answer can be read aloud (a button on every
   * answer, and the switch «read at once»). «Mach es für mich» turns a sentence into a to-do, list, note or value: the page
   * shows «Ich würde das tun» first and writes only after the tap, with one Undo (suche/act.js).
   * Only the question and the photo go out (client.js), never your data. Without internet or when the free limit is used
   * up, the page says so and «Weiter fragen bei …» is there.
   */
  import { Volume2, VolumeX, Camera, X, Sparkles, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, lang } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { dict, setDict } from '../dictation.svelte.js';
  import { appendSpoken, readAloud, stopReading, speechLang, voiceApi } from '../speak.js';
  import SpeakButton from '../ui/SpeakButton.svelte';
  import AskElsewhere from '../assistent/AskElsewhere.svelte';
  import { toast } from '../flow/ui.svelte.js';
  import { actionLabel, runActions } from '../suche/act.js';
  import { askGemini } from './client.js';
  import { shrink } from './photo.js';
  import { toActions } from './befehl.js';

  const ASK_EG = ['What do I wear at 5 °C in light rain?', 'How do I stop my chain from squeaking?'];
  const DO_EG = ['Remind me on Friday to pump the tyres', 'Create a list for the weekend: sunscreen, snacks, lights'];
  const canRead = !!voiceApi();
  const today = localDay();

  let q = $state('');
  let photo = $state(null); // { mime, data, preview }
  let busy = $state(false);
  let reason = $state(''); // why the last call failed
  let answer = $state(''); // the last answer
  let askedText = $state(''); // the question it belongs to
  let plan = $state(null); // { actions, text } the preview of «Mach es für mich»
  let planNone = $state(false);
  let reading = $state(false);
  let fileEl = $state(null);

  const ERR = {
    offline: 'No internet. Gemini needs it. Ask the app, or write the question down for later.',
    busy: 'Gemini is busy or its free limit is used up for now. Try again later, or ask further below.',
    not_set_up: 'Gemini is not set up on the server yet.',
    too_big: 'The question or the photo is too big. Make it shorter or take a smaller photo.',
    failed: 'Gemini did not answer. Try again, or ask further below.',
  };

  function reset() {
    stopRead();
    reason = '';
    answer = '';
    plan = null;
    planNone = false;
  }
  function stopRead() {
    if (reading) stopReading();
    reading = false;
  }
  function read() {
    if (reading) return stopRead();
    reading = true;
    readAloud(answer, { lang: speechLang(lang.v), onend: () => (reading = false) });
  }

  async function ask(e) {
    e?.preventDefault();
    const text = q.trim();
    if (!text || busy) return;
    reset();
    busy = true;
    askedText = text;
    const r = await askGemini({ mode: 'ask', text, image: photo, lang: lang.v, today });
    busy = false;
    if (!r.ok) return (reason = r.reason);
    answer = r.text ?? '';
    if (!answer) return (reason = 'failed');
    if (dict.read && canRead) read();
  }

  async function doIt() {
    const text = q.trim();
    if (!text || busy) return;
    reset();
    busy = true;
    askedText = text;
    const r = await askGemini({ mode: 'command', text, lang: lang.v, today });
    busy = false;
    if (!r.ok) return (reason = r.reason);
    const actions = toActions(r.actions);
    if (!actions.length) return (planNone = true);
    plan = { actions, text };
  }

  async function confirm() {
    if (!plan || busy) return;
    busy = true;
    const [bikes, trips] = await Promise.all([db.bikes.toArray(), db.trips.toArray()]);
    const r = await runActions(plan.actions, { today, bikes, trips });
    busy = false;
    plan = null;
    if (!r.lines.length) return (reason = 'failed');
    q = '';
    toast(r.lines.join(' · '), r.undo);
  }

  async function pickPhoto(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    const p = await shrink(f);
    if (!p) return (reason = 'too_big');
    reason = '';
    photo = p;
  }
  const spoken = (w) => (q = appendSpoken(q, w));
  $effect(() => () => reading && stopReading());
</script>

<section class="card ag" aria-labelledby="ag-h" data-gemini>
  <h2 id="ag-h" class="ag-h">{t('Ask Gemini')}</h2>
  <form class="ag-row" onsubmit={ask}>
    <input class="inp" type="search" bind:value={q} placeholder={t('e.g. What do I wear at 5 °C in light rain?')} aria-label={t('Your question for Gemini')} autocomplete="off" data-gemini-q />
    <button type="submit" class="btn hi" disabled={busy || !q.trim()} data-gemini-ask><Sparkles size={16} aria-hidden="true" />{busy ? t('Asking …') : t('Ask Gemini')}</button>
  </form>
  <p class="ag-tools">
    <SpeakButton always onsaid={spoken} />
    <input type="file" accept="image/*" class="ag-file" bind:this={fileEl} onchange={pickPhoto} data-gemini-file tabindex="-1" aria-hidden="true" />
    <button type="button" class="btn sm" onclick={() => fileEl?.click()} data-gemini-photo><Camera size={14} aria-hidden="true" />{t('Add a photo')}</button>
    <button type="button" class="btn sm" disabled={busy || !q.trim()} onclick={doIt} data-gemini-do>{t('Do it for me')}</button>
  </p>
  {#if photo}
    <p class="ag-photo" data-gemini-thumb><img src={photo.preview} alt={t('Your photo')} /><button type="button" class="btn sm" onclick={() => (photo = null)} aria-label={t('Remove the photo')}><X size={14} aria-hidden="true" />{t('Remove')}</button></p>
  {/if}

  {#if !answer && !plan && !reason && !planNone && !busy}
    <div class="ag-eg" data-gemini-empty>
      <p class="ag-hint">{t('Ask something simple, with your voice, text or a photo. Gemini answers; you can have the answer read aloud.')}</p>
      <div class="ag-chips">
        {#each ASK_EG as e (e)}<button type="button" class="chip" onclick={() => (q = t(e))}>{t(e)}</button>{/each}
      </div>
      <p class="ag-hint">{t('«Do it for me» turns a sentence into a to-do, a list, a note or a value. You see what it would do first.')}</p>
      <div class="ag-chips">
        {#each DO_EG as e (e)}<button type="button" class="chip" onclick={() => (q = t(e))}>{t(e)}</button>{/each}
      </div>
    </div>
  {/if}

  {#if reason}
    <div class="ag-res" role="status" data-gemini-error={reason}>
      <p>{t(ERR[reason] ?? ERR.failed)}</p>
      {#if askedText && reason !== 'not_set_up'}<AskElsewhere q={askedText} />{/if}
    </div>
  {/if}

  {#if answer}
    <div class="ag-res" aria-live="polite" data-gemini-answer>
      <p class="ag-from"><Sparkles size={14} aria-hidden="true" />{t('Gemini answers (from Google, not from your data)')}</p>
      <p class="ag-a">{answer}</p>
      <p class="ag-tools">
        {#if canRead}<button type="button" class="btn sm" aria-pressed={reading} onclick={read} data-gemini-read>{#if reading}<VolumeX size={14} aria-hidden="true" />{t('Stop reading')}{:else}<Volume2 size={14} aria-hidden="true" />{t('Read aloud')}{/if}</button>{/if}
      </p>
      <AskElsewhere q={askedText} />
    </div>
  {/if}

  {#if plan}
    <div class="ag-res" data-gemini-plan>
      <p class="ag-from"><Sparkles size={14} aria-hidden="true" />{t('I would do this:')}</p>
      <ul class="ag-plan">{#each plan.actions as a, i (i)}<li>{actionLabel(a, today)}</li>{/each}</ul>
      <p class="ag-tools">
        <button type="button" class="btn hi sm" disabled={busy} onclick={confirm} data-gemini-ok><Check size={14} aria-hidden="true" />{t('Yes, do it')}</button>
        <button type="button" class="btn sm" onclick={() => (plan = null)} data-gemini-no>{t('No')}</button>
      </p>
      <p class="ag-hint">{t('Nothing is written before your tap. Afterwards «Undo» takes it all back.')}</p>
    </div>
  {/if}
  {#if planNone}
    <div class="ag-res" role="status" data-gemini-none>
      <p>{t('Gemini found nothing it can do from this. It can add a to-do, a list, a note or a value (weight, resting heart rate, sleep).')}</p>
    </div>
  {/if}

  {#if canRead}
    <label class="ag-tick"><input type="checkbox" checked={dict.read} onchange={(e) => setDict('read', e.currentTarget.checked)} data-gemini-autoread />{t('Read answers aloud at once')}</label>
  {/if}
  <p class="ag-priv" data-gemini-privacy>{t('Only your question{photo} goes to Gemini (Google, free). Google may use free questions to improve its products: send nothing private. Your data stays on this device.', { photo: photo ? ` ${t('and your photo')}` : '' })}</p>
</section>

<style>
  .ag {
    padding: var(--sp-3);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .ag-h {
    margin: 0 0 var(--sp-2);
    font-size: var(--fs-section);
  }
  .ag-row {
    display: flex;
    gap: 8px;
  }
  .ag-row .inp {
    flex: 1;
    min-width: 0;
  }
  /* Phone (Noah 24.11.2026 «bild neu mit impeccable»): a question is a sentence, so the field gets the whole row and the button sits under it. */
  @media (max-width: 520px) {
    .ag-row {
      flex-direction: column;
    }
    .ag-row .btn {
      justify-content: center;
    }
  }
  .ag-tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 6px 0 0;
  }
  .ag-file {
    display: none;
  }
  .ag-photo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 8px 0 0;
  }
  .ag-photo img {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 10px;
  }
  .ag-eg,
  .ag-res {
    margin-top: var(--sp-3);
  }
  .ag-res {
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--hi-soft, var(--paper-2));
    overflow-wrap: break-word;
  }
  .ag-res p {
    margin: 0 0 4px;
  }
  .ag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: var(--sp-2);
  }
  .ag-from {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ag-a {
    white-space: pre-wrap;
  }
  .ag-plan {
    margin: 0 0 6px;
    padding-left: 20px;
  }
  .ag-hint,
  .ag-priv {
    margin: 6px 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ag-tick {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    margin-top: 6px;
    font-size: var(--fs-small);
  }
</style>
