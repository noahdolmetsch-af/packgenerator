<script>
  /**
   * «Eingaben überall» (Noah 26.10.2026 «1a 2b 3 nur Ton. kein Video 4b 5a aber b möglich»): the one input
   * bar under a text, the same on ten pages. A row «Add» with what fits this place (inputs.js PLACES):
   * voice note (up to 1 minute), photo, file, place, tag, template of this page, writing prompts, AI helper.
   * Above the row what was added (InputsView, each part removable with Undo). Everything stays on this
   * device; only the AI helper sends the text to Gemini, with a tick each time (free).
   *
   * place: PLACES key; text + ontext(next): the page's text (templates, prompts and highlights go under it);
   * inputs + oninputs(next): what was added (store it as the record's `inputs`, inputs.js cleanInputs);
   * ontitle(s): offers «Suggest a title» in the AI helper; tags: suggestions [{ name }]; only: fewer tools.
   */
  import { liveQuery } from 'dexie';
  import { Mic, Camera, Paperclip, MapPin, Tag, LayoutTemplate, Lightbulb, Sparkles, Plus, Settings2 } from '@lucide/svelte';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import VoiceRec from './VoiceRec.svelte';
  import InputsView from './InputsView.svelte';
  import TemplateSheet from './TemplateSheet.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { shrinkImage } from '../photo.js';
  import { localDay } from '../localday.js';
  import { geminiError } from '../assistent/gemini.js';
  import { cleanTitle } from '../tagebuch/ai.js';
  import { db } from '../db.js';
  import { t, lang, num } from '../i18n.svelte.js';
  import { toolsOf, inputsOf, addVoice, dropVoice, setVoice, addFile, dropFile, addPhoto, dropPhoto, setPlace, addTag, dropTag, cleanTag, withBlock, templatesFor, tplName, tplText, promptsFor, aiLines, highlightsBlock, sizeText, FILE_MAX_BYTES, TEMPLATES_KEY } from './inputs.js';
  import { inputAi, voiceText } from './inputsdb.js';

  let { place, text = '', ontext = () => {}, inputs = null, oninputs = () => {}, ontitle = null, tags = [], only = null, start = '' } = $props();

  const tools = $derived(toolsOf(place, only));
  const v = $derived(inputsOf(inputs));
  // svelte-ignore state_referenced_locally
  let open = $state(start); // the tool whose part is open (`start`: e.g. «Voice note» on the diary page opens it at once)
  let msg = $state('');
  const toggle = (k) => ((open = open === k ? '' : k), (msg = ''));
  const set = (next) => oninputs($state.snapshot(next));

  const LABEL = { voice: 'Voice note', photo: 'Photo', file: 'File|input', place: 'Place|input', tag: 'Tag|input', template: 'Template', prompt: 'Writing prompts', ai: 'AI helper' };
  const ICON = { voice: Mic, photo: Camera, file: Paperclip, place: MapPin, tag: Tag, template: LayoutTemplate, prompt: Lightbulb, ai: Sparkles };

  /* ---------- remove (with Undo) ---------- */
  function drop(kind, key) {
    const before = $state.snapshot(v);
    const next = kind === 'voice' ? dropVoice(v, key) : kind === 'file' ? dropFile(v, key) : kind === 'photo' ? dropPhoto(v, key) : kind === 'place' ? setPlace(v, null) : dropTag(v, key);
    set(next);
    offerDone(t('Removed.'), () => set(before));
  }

  /* ---------- voice ---------- */
  function voiceDone(rec) {
    const r = addVoice(v, rec);
    if (r.error) return (msg = t('At most 3 voice notes here. Remove one first.'));
    set(r.inputs);
    open = '';
  }
  let busyVoice = $state('');
  async function toText(a) {
    busyVoice = a.id;
    msg = t('The words are found on this device. The first time it loads the speech model once (about 80 MB, free).');
    try {
      const said = await voiceText(a.src, { lang: lang.v === 'en' ? 'en-GB' : 'de-CH', onprogress: (p) => (msg = t('Loading the speech model … {n} %', { n: p })) });
      if (!said) msg = t('No words found in this voice note.');
      else {
        set(setVoice(v, a.id, { text: said }));
        ontext(withBlock(text, said));
        msg = t('The words are under your text now.');
      }
    } catch {
      msg = t('Turning it into text did not work here. The voice note stays.');
    } finally {
      busyVoice = '';
    }
  }

  /* ---------- photo ---------- */
  let photoBusy = $state(false);
  async function photo(file) {
    photoBusy = true;
    try {
      const r = addPhoto(v, await shrinkImage(file));
      if (r.error) msg = t('At most 6 photos here.');
      else set(r.inputs);
    } catch (e) {
      msg = e?.message || t('This photo could not be read.');
    } finally {
      photoBusy = false;
    }
  }

  /* ---------- file ---------- */
  function pickFile(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    if (f.size > FILE_MAX_BYTES) return (msg = t('This file is too big here ({size}, at most {max}). Bigger files go to the notes (up to 15 MB) or to Documents.', { size: sizeText(f.size, num), max: sizeText(FILE_MAX_BYTES, num) }));
    const fr = new FileReader();
    fr.onload = () => {
      const r = addFile(v, { name: f.name, type: f.type, bytes: f.size, src: String(fr.result) });
      if (r.error === 'many') msg = t('At most 5 files here. Remove one first.');
      else if (r.error) msg = t('This file is too big here.');
      else {
        set(r.inputs);
        msg = '';
        open = '';
      }
    };
    fr.onerror = () => (msg = t('This file could not be read.'));
    fr.readAsDataURL(f);
  }

  /* ---------- place ---------- */
  let placeName = $state('');
  $effect(() => {
    if (open === 'place') placeName = v.place?.name ?? '';
  });
  function keepPlace(e) {
    e?.preventDefault();
    set(setPlace(v, { ...(v.place ?? {}), name: placeName }));
    open = '';
  }
  function here() {
    if (!navigator.geolocation) return (msg = t('The position is not available. Type the name of the place instead.'));
    msg = t('Looking for your position …');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        set(setPlace(v, { name: placeName, lat: Math.round(p.coords.latitude * 1e4) / 1e4, lon: Math.round(p.coords.longitude * 1e4) / 1e4 }));
        msg = t('Position saved.');
      },
      () => (msg = t('The position is not available. Type the name of the place instead.')),
      { enableHighAccuracy: false, timeout: 15000 },
    );
  }

  /* ---------- tags ---------- */
  let tagIn = $state('');
  function keepTag(e) {
    e?.preventDefault();
    const s = cleanTag(tagIn);
    if (s) set(addTag(v, s));
    tagIn = '';
  }
  const suggest = $derived(tags.filter((x) => !v.tags.some((y) => y.toLowerCase() === String(x.name).toLowerCase())).slice(0, 8));

  /* ---------- templates (per page, Noah «4b») ---------- */
  const tplQ = liveQuery(async () => (await db.settings.get(TEMPLATES_KEY))?.value ?? {});
  const tpls = $derived(templatesFor(place, $tplQ));
  let managing = $state(false);
  function useTpl(x) {
    ontext(withBlock(text, tplText(x, t)));
    open = '';
    offerDone(t('«{name}» is under your text.', { name: tplName(x, t) }));
  }

  /* ---------- writing prompts (without AI) ---------- */
  const prompts = $derived(promptsFor(place, localDay()).map((s) => t(s)));
  function usePrompt(s) {
    ontext(withBlock(text, s));
    open = '';
  }

  /* ---------- AI helper (Gemini, free, a tick each time) ---------- */
  let aiOk = $state(false);
  let aiBusy = $state('');
  let aiOut = $state(null); // { mode, lines }
  async function ai(mode) {
    if (!aiOk || aiBusy) return;
    if (!String(text ?? '').trim()) return (msg = t('Write or dictate some text first.'));
    aiBusy = mode;
    msg = '';
    aiOut = null;
    const r = await inputAi(mode, { text, place, lang: lang.v === 'en' ? 'en' : 'de' });
    aiBusy = '';
    aiOk = false;
    if (!r.ok) return (msg = geminiError(r.error));
    if (mode === 'title') {
      const s = cleanTitle(r.text);
      if (s) ontitle?.(s);
      else msg = geminiError('error');
      return;
    }
    const lines = aiLines(r.text, mode === 'prompts' ? 3 : 4);
    if (!lines.length) return (msg = geminiError('error'));
    aiOut = { mode, lines };
  }
  function useHighlights() {
    ontext(withBlock(text, highlightsBlock(aiOut.lines, t('Highlights'))));
    aiOut = null;
  }
</script>

<div class="inbar" data-input-bar={place}>
  <InputsView inputs={v} edit ondrop={drop} ontotext={toText} {busyVoice} />
  <div class="in-row" role="group" aria-label={t('Add to it')}>
    <span class="in-lbl"><Plus size={14} aria-hidden="true" />{t('Add')}</span>
    {#each tools as k (k)}
      {@const Icon = ICON[k]}
      <button type="button" class="in-tool" aria-expanded={open === k} onclick={() => toggle(k)} data-in-tool={k}><Icon size={16} aria-hidden="true" />{t(LABEL[k])}</button>
    {/each}
  </div>

  {#if open === 'voice'}
    <div class="in-part">
      <p class="in-note">{t('Speak up to one minute. The sound stays on this device; «As text» turns it into words later.')}</p>
      <VoiceRec ondone={voiceDone} oncancel={() => (open = '')} />
    </div>
  {:else if open === 'photo'}
    <div class="in-part">
      <p class="in-note">{t('The photo stays on this device and in your backup.')}</p>
      <PhotoPick onfile={photo} busy={photoBusy} has={!!v.photos.length} again="Add a photo" />
    </div>
  {:else if open === 'file'}
    <div class="in-part">
      <p class="in-note">{t('A PDF, a picture or any file up to {max}. It stays on this device and in your backup.', { max: sizeText(FILE_MAX_BYTES, num) })}</p>
      <label class="btn sm in-filebtn"><Paperclip size={16} aria-hidden="true" />{t('Choose a file')}<input type="file" class="in-hidden" onchange={pickFile} data-in-file-input /></label>
    </div>
  {:else if open === 'place'}
    <div class="in-part">
      <p class="in-note">{t('Type the place, or let the device find where you are.')}</p>
      <div class="in-inline">
        <input class="inp" maxlength="80" bind:value={placeName} placeholder={t('Where were you?')} aria-label={t('Place|input')} onkeydown={(e) => e.key === 'Enter' && keepPlace(e)} data-in-place-name />
        <button type="button" class="btn sm" onclick={here} data-in-here><MapPin size={16} aria-hidden="true" />{t('Where I am')}</button>
        <button type="button" class="btn sm hi" disabled={!placeName.trim()} onclick={keepPlace} data-in-place-keep>{t('Keep')}</button>
      </div>
    </div>
  {:else if open === 'tag'}
    <div class="in-part">
      <p class="in-note">{t('A tag helps to find it again, e.g. #Tour or #Knee. The search finds it.')}</p>
      <div class="in-inline">
        <input class="inp" maxlength="30" bind:value={tagIn} placeholder={t('New tag, e.g. Tour')} aria-label={t('New tag')} onkeydown={(e) => e.key === 'Enter' && keepTag(e)} data-in-tag-in />
        <button type="button" class="btn sm" disabled={!tagIn.trim()} onclick={keepTag} data-in-tag-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
      </div>
      {#if suggest.length}<div class="in-chips">{#each suggest as x (x.name)}<button type="button" class="in-chip" onclick={() => set(addTag(v, x.name))}>#{x.name}</button>{/each}</div>{/if}
    </div>
  {:else if open === 'template'}
    <div class="in-part" data-in-template-list>
      <p class="in-note">{t('A tap puts the template under your text. You can change it afterwards.')}</p>
      {#if tpls.length}
        <div class="in-chips">{#each tpls as x (x.key)}<button type="button" class="in-chip" onclick={() => useTpl(x)} data-in-template={x.key}>{tplName(x, t)}</button>{/each}</div>
      {:else}
        <p class="in-note">{t('No templates here yet.')}</p>
      {/if}
      <button type="button" class="in-link" onclick={() => (managing = true)} data-in-template-manage><Settings2 size={14} aria-hidden="true" />{t('Change templates')}</button>
    </div>
  {:else if open === 'prompt'}
    <div class="in-part" data-in-prompts>
      <p class="in-note">{t('Stuck? A question to write on. A tap puts it under your text. Tomorrow there are others.')}</p>
      <div class="in-chips in-col">{#each prompts as s (s)}<button type="button" class="in-chip" onclick={() => usePrompt(s)}>{s}</button>{/each}</div>
    </div>
  {:else if open === 'ai'}
    <div class="in-part" data-in-ai>
      <label class="in-aiok"><input type="checkbox" bind:checked={aiOk} data-in-ai-ok /><span>{t('Send the text to Gemini (Google) for one step. Free; photos, sound, files and place stay here.')}</span></label>
      <div class="in-inline">
        {#if ontitle}<button type="button" class="btn sm" disabled={!aiOk || !!aiBusy} onclick={() => ai('title')} data-in-ai-title>{aiBusy === 'title' ? t('Gemini is thinking …') : t('Suggest a title')}</button>{/if}
        <button type="button" class="btn sm" disabled={!aiOk || !!aiBusy} onclick={() => ai('prompts')} data-in-ai-prompts>{aiBusy === 'prompts' ? t('Gemini is thinking …') : t('Prompts that fit')}</button>
        <button type="button" class="btn sm" disabled={!aiOk || !!aiBusy} onclick={() => ai('highlights')} data-in-ai-highlights>{aiBusy === 'highlights' ? t('Gemini is thinking …') : t('Highlights')}</button>
      </div>
      {#if aiOut}
        <div class="in-ai-out" data-in-ai-out>
          <span class="in-note">{aiOut.mode === 'prompts' ? t('Prompts from Gemini. A tap puts one under your text.') : t('Highlights from Gemini. Check them before you keep them.')}</span>
          {#if aiOut.mode === 'prompts'}
            <div class="in-chips in-col">{#each aiOut.lines as s (s)}<button type="button" class="in-chip" onclick={() => ((aiOut = null), usePrompt(s))}>{s}</button>{/each}</div>
          {:else}
            <ul>{#each aiOut.lines as s (s)}<li>{s}</li>{/each}</ul>
            <div class="in-inline">
              <button type="button" class="btn sm hi" onclick={useHighlights} data-in-ai-use>{t('Put under the text')}</button>
              <button type="button" class="btn sm" onclick={() => (aiOut = null)}>{t('Discard')}</button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
  {#if msg}<p class="in-note" role="status" data-in-msg>{msg}</p>{/if}
</div>

{#if managing}<TemplateSheet {place} list={tpls} onclose={() => (managing = false)} />{/if}

<style>
  .inbar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .in-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .in-lbl {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .in-tool {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .in-tool[aria-expanded='true'] {
    border-color: transparent;
    background: var(--accent-soft);
  }
  .in-part {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .in-note {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .in-inline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .in-inline .inp {
    flex: 1;
    min-width: 160px;
  }
  .in-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .in-col {
    flex-direction: column;
    align-items: flex-start;
  }
  .in-chip {
    min-height: 44px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-align: left;
    cursor: pointer;
  }
  .in-link {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
  .in-aiok {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-size: var(--fs-small);
  }
  .in-filebtn {
    align-self: flex-start;
    cursor: pointer;
  }
  .in-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  .in-ai-out ul {
    margin: 4px 0 8px;
    padding-left: 20px;
  }
</style>
