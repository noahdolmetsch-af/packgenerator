<script>
  /**
   * «Tagebuch»: write or change one entry. A big writing field with the microphone right under it (Noah
   * «diktierfunktion integrieren. wichtig»), the day and time, photos, tags, place, weather, a star, and
   * «From the app» (Noah «1b … mit inhalten aus app ergänzt»): the rides, Fitbit values, notes, tours, ticks
   * and appointments of that day, chosen with a tick and added as lines. What was typed stays when the
   * window closes without saving (keepTyped), until «Discard».
   */
  import { X, Trash2, Check, Star, MapPin, Tag, Plus, CloudSun, LayoutGrid, Sparkles } from '@lucide/svelte';
  import SpeakButton from '../ui/SpeakButton.svelte';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import DrawOn from '../draw/DrawOn.svelte'; // Paket NE 1146 (Noah 20.10.2026 «1b»): draw on a photo of the entry
  import DateInput from '../ui/DateInput.svelte';
  import { backClose } from '../ui/backclose.js';
  import { keepTyped } from '../ui/keeptyped.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { appendSpoken } from '../speak.js';
  import { shrinkImage } from '../photo.js';
  import { localDay } from '../localday.js';
  import { cleanTag, cleanTags, isEmpty, WEATHER_WORDS, weatherKind, wordCount } from './journal.js';
  import { saveEntry, deleteEntry, restoreEntry, dayThings, weatherPlace, weatherNow } from './journaldb.js';
  import { questionText } from './fragen.js';
  import { MOODS, moodName } from './insights.js';
  import { diaryAi, cleanTitle } from './ai.js';
  import { geminiError } from '../assistent/gemini.js';
  import InputBar from '../eingabe/InputBar.svelte'; // «Eingaben überall» (Noah 26.10.2026): voice note, file, templates, prompts
  import { inputAi } from '../eingabe/inputsdb.js';
  import { aiLines, highlightsBlock, withBlock } from '../eingabe/inputs.js';
  import { t, tn, lang } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  /** entry: the entry to change, or a new one ({ day, time, q, … }); tags: all tags (suggestions); dictate: start listening at once. */
  let { entry, tags = [], dictate = false, onclose, onsaved = () => {} } = $props();
  let dialog;
  // a copy to edit (the saved row only changes on «Save»)
  // svelte-ignore state_referenced_locally
  let e = $state(JSON.parse(JSON.stringify({ title: '', text: '', photos: [], tags: [], place: null, weather: null, star: false, mood: null, refs: [], inputs: null, ...entry })));
  // svelte-ignore state_referenced_locally
  const isNew = !entry.id;
  let error = $state('');
  let busy = $state(false);
  let photoBusy = $state(false);
  let tagIn = $state('');
  let textEl = $state(null);
  const question = $derived(questionText(e.q, t) || null); // already in the language (a typed one as it is)
  const words = $derived(wordCount(e.text));

  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  // a new entry of today gets the weather of the moment by itself (quiet when offline or no place is known)
  $effect(() => {
    if (!isNew || e.weather || e.day !== localDay()) return;
    weatherPlace(e.place).then(weatherNow).then((w) => {
      if (w && !e.weather) e.weather = w;
    });
  });

  async function save(ev) {
    ev?.preventDefault();
    if (busy) return;
    if (isEmpty(e)) return (error = t('Write something, speak or add a photo first.'));
    busy = true;
    try {
      const rec = await saveEntry({ ...e, tags: cleanTags([...e.tags, tagIn]) });
      onsaved(rec);
      offerDone(isNew ? t('Saved in your diary.') : t('Saved.'));
      dialog.close();
    } catch (err) {
      error = saveFailed(err);
    } finally {
      busy = false;
    }
  }
  async function remove() {
    const name = e.title?.trim() || t('this entry');
    const a = await askDelete({ title: t('Delete «{name}»?', { name }), text: t('The entry and its photos go. You can undo this for a few seconds.') });
    if (a !== 'delete') return;
    dialog.close();
    await deleteWithUndo({ run: () => deleteEntry(entry.id), undo: (rec) => restoreEntry(rec), text: t('"{name}" deleted.', { name }), name });
  }

  /* ---------- dictation ---------- */
  const said = (w) => (e.text = appendSpoken(e.text, w));

  /* ---------- photos ---------- */
  async function addPhoto(file) {
    photoBusy = true;
    try {
      e.photos = [...e.photos, { src: await shrinkImage(file) }];
    } catch (err) {
      offerDone(err.message);
    } finally {
      photoBusy = false;
    }
  }
  const dropPhoto = (n) => (e.photos = e.photos.filter((_, i) => i !== n));
  // the drawn photo takes the place of the old one; the drawing stays editable (e.inks, cleaned on save)
  function drawn({ list, inks }) {
    e.photos = list.map((src) => ({ src }));
    e.inks = inks;
  }

  /* ---------- tags ---------- */
  function addTag(ev) {
    ev?.preventDefault();
    const s = cleanTag(tagIn);
    if (s) e.tags = cleanTags([...e.tags, s]);
    tagIn = '';
  }
  const dropTag = (x) => (e.tags = e.tags.filter((y) => y !== x));
  const suggest = $derived(tags.filter((x) => !e.tags.some((y) => y.toLowerCase() === x.name.toLowerCase())).slice(0, 8));

  /* ---------- place and weather ---------- */
  let placeMsg = $state('');
  function here() {
    if (!navigator.geolocation) return (placeMsg = t('The position is not available. Type the name of the place instead.'));
    placeMsg = t('Looking for your position …');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        e.place = { name: e.place?.name ?? '', lat: Math.round(p.coords.latitude * 1e4) / 1e4, lon: Math.round(p.coords.longitude * 1e4) / 1e4 };
        placeMsg = '';
      },
      () => (placeMsg = t('The position is not available. Type the name of the place instead.')),
      { enableHighAccuracy: false, timeout: 15000 },
    );
  }
  let wxBusy = $state(false);
  async function addWeather() {
    wxBusy = true;
    const w = await weatherNow(await weatherPlace(e.place));
    wxBusy = false;
    if (w) e.weather = w;
    else offerDone(t('No weather right now: offline, or no place known. Set your home place under Me › Settings, or add the position.'));
  }

  /* ---------- from the app ---------- */
  let things = $state(null); // null: closed; [] loaded
  let picked = $state([]);
  async function openThings() {
    things = await dayThings(e.day, t);
    picked = things.filter((x) => !(e.refs ?? []).some((r) => r.key === x.key)).map((x) => x.key);
  }
  function insertThings() {
    const add = things.filter((x) => picked.includes(x.key) && !(e.refs ?? []).some((r) => r.key === x.key));
    if (add.length) {
      const lines = add.map((x) => `• ${x.text}`).join('\n');
      e.text = e.text.trim() ? `${e.text.replace(/\s+$/, '')}\n\n${lines}` : lines;
      e.refs = [...(e.refs ?? []), ...add.map((x) => ({ key: x.key, text: x.text }))];
    }
    things = null;
  }
  /* ---------- Gemini (Noah «1a»: only with a tick, each time) ---------- */
  let aiOk = $state(false);
  let aiBusy = $state('');
  let aiMsg = $state('');
  let tidy = $state(null); // the tidied text waiting for «Use it» or «Discard»
  async function ai(mode) {
    if (!aiOk || aiBusy) return;
    if (!String(e.text ?? '').trim()) return (aiMsg = t('Write or dictate some text first.'));
    aiBusy = mode;
    aiMsg = '';
    aiOut = null;
    const r = mode === 'prompts' || mode === 'highlights' ? await inputAi(mode, { text: e.text, place: 'diary', lang: lang.v === 'en' ? 'en' : 'de' }) : await diaryAi(mode, { context: String(e.text).slice(0, 11000), lang: lang.v === 'en' ? 'en' : 'de' });
    aiBusy = '';
    aiOk = false;
    if (!r.ok) return (aiMsg = geminiError(r.error));
    if (mode === 'prompts' || mode === 'highlights') {
      const lines = aiLines(r.text, mode === 'prompts' ? 3 : 4);
      if (lines.length) aiOut = { mode, lines };
      else aiMsg = geminiError('error');
    } else if (mode === 'title') {
      const s = cleanTitle(r.text);
      if (s) e.title = s;
      else aiMsg = geminiError('error');
    } else tidy = r.text.trim();
  }
  // «Eingaben überall»: writing prompts and highlights from Gemini (the same tick)
  let aiOut = $state(null); // { mode: 'prompts' | 'highlights', lines }
  function usePrompt(s) {
    e.text = withBlock(e.text, s);
    aiOut = null;
    textEl?.focus();
  }
  function useHighlights() {
    e.text = withBlock(e.text, highlightsBlock(aiOut.lines, t('Highlights')));
    aiOut = null;
  }
  function useTidy() {
    e.text = tidy;
    tidy = null;
  }

  const GROUPS = { Activities: 'Activities', Body: 'Body', Tours: 'Tours', Notes: 'Notes', Active: 'Active', Calendar: 'Calendar', Weather: 'Weather' };
</script>

<dialog use:keepTyped={'tagebuch:' + (entry.id ?? 'new')} class="sheet vdlg from-below tbe" bind:this={dialog} use:backClose {onclose} aria-labelledby="tbe-h" data-tb-editor>
  <form class="tbe-form" onsubmit={save}>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="tbe-h">{isNew ? t('New entry') : t('Change entry')}</h2>
        {#if question}<p class="vd-sub tbe-q" data-tb-question-in>{question}</p>{/if}
      </div>
      <button type="button" class="tbe-star" aria-pressed={e.star} aria-label={t('Favourite')} title={t('Favourite')} onclick={() => (e.star = !e.star)} data-tb-star><Star size={20} aria-hidden="true" fill={e.star ? 'currentColor' : 'none'} /></button>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <div class="tbe-body">
      <div class="tbe-when">
        <label class="tbe-lab">{t('Day')}<DateInput bind:value={e.day} required data-tb-day /></label>
        <label class="tbe-lab">{t('Time')}<input class="inp" type="time" bind:value={e.time} data-tb-time /></label>
      </div>
      <div class="tbe-moods" role="group" aria-label={t('How was your day?')}>
        <span class="tbe-mood-q">{t('How was your day?')}</span>
        {#each MOODS as m (m.v)}
          <button type="button" class="tbe-mood" aria-pressed={e.mood === m.v} aria-label={moodName(m.v, t)} title={moodName(m.v, t)} onclick={() => (e.mood = e.mood === m.v ? null : m.v)} data-tb-mood={m.v}><span aria-hidden="true">{m.emoji}</span></button>
        {/each}
      </div>
      <input class="inp tbe-title" maxlength="140" bind:value={e.title} placeholder={t('Title (optional)')} aria-label={t('Title')} data-tb-title />
      <textarea class="inp tbe-text" bind:this={textEl} bind:value={e.text} rows="9" placeholder={question ? t('Your answer …') : t('What happened today? What is on your mind?')} aria-label={t('Text')} data-tb-text></textarea>
      <div class="tbe-tools">
        <SpeakButton onsaid={said} wrap always autostart={dictate} />
        <span class="tbe-count" aria-live="polite">{tn(words, '{n} word', '{n} words')}</span>
      </div>
      <InputBar place="diary" text={e.text} ontext={(s) => (e.text = s)} inputs={e.inputs} oninputs={(x) => (e.inputs = x)} />

      <div class="tbe-ai" data-tb-ai>
        <label class="tbe-aiok"><input type="checkbox" bind:checked={aiOk} data-tb-ai-ok /><span><Sparkles size={16} aria-hidden="true" /> {t('Send the text of this entry to Gemini (Google) for one step. Free; photos and place stay here.')}</span></label>
        <div class="tbe-inline">
          <button type="button" class="btn sm" disabled={!aiOk || !!aiBusy} onclick={() => ai('title')} data-tb-ai-title>{aiBusy === 'title' ? t('Gemini is thinking …') : t('Suggest a title')}</button>
          <button type="button" class="btn sm" disabled={!aiOk || !!aiBusy} onclick={() => ai('tidy')} data-tb-ai-tidy>{aiBusy === 'tidy' ? t('Gemini is thinking …') : t('Tidy up the text')}</button>
          <button type="button" class="btn sm" disabled={!aiOk || !!aiBusy} onclick={() => ai('prompts')} data-tb-ai-prompts>{aiBusy === 'prompts' ? t('Gemini is thinking …') : t('Prompts that fit')}</button>
          <button type="button" class="btn sm" disabled={!aiOk || !!aiBusy} onclick={() => ai('highlights')} data-tb-ai-highlights>{aiBusy === 'highlights' ? t('Gemini is thinking …') : t('Highlights')}</button>
        </div>
        {#if aiOut}
          <div class="tbe-tidy" data-tb-ai-out>
            <span class="tbe-note">{aiOut.mode === 'prompts' ? t('Prompts from Gemini. A tap puts one under your text.') : t('Highlights from Gemini. Check them before you keep them.')}</span>
            {#if aiOut.mode === 'prompts'}
              <div class="tbe-chips">{#each aiOut.lines as s (s)}<button type="button" class="tbe-chip" onclick={() => usePrompt(s)}>{s}</button>{/each}</div>
            {:else}
              <ul class="tbe-hl">{#each aiOut.lines as s (s)}<li>{s}</li>{/each}</ul>
              <div class="tbe-inline">
                <button type="button" class="btn sm hi" onclick={useHighlights} data-tb-ai-hl-use>{t('Put under the text')}</button>
                <button type="button" class="btn sm" onclick={() => (aiOut = null)}>{t('Discard')}</button>
              </div>
            {/if}
          </div>
        {/if}
        {#if aiMsg}<p class="tbe-note" role="status" data-tb-ai-msg>{aiMsg}</p>{/if}
        {#if tidy !== null}
          <div class="tbe-tidy" data-tb-ai-tidied>
            <span class="tbe-note">{t('Tidied up by Gemini. Check it before you use it.')}</span>
            <p>{tidy}</p>
            <div class="tbe-inline">
              <button type="button" class="btn sm hi" onclick={useTidy} data-tb-ai-use>{t('Use it')}</button>
              <button type="button" class="btn sm" onclick={() => (tidy = null)}>{t('Discard')}</button>
            </div>
          </div>
        {/if}
      </div>

      <div class="tbe-sec">
        <span class="tbe-h3">{t('Photos')}</span>
        {#if e.photos.length}
          <div class="tbe-thumbs">
            {#each e.photos as p, n (p.src.slice(-40) + n)}
              <span class="tbe-ph"><img src={p.src} alt="" /><DrawOn src={p.src} list={e.photos.map((x) => x.src)} inks={e.inks} icon cls="tbe-phd" onsave={drawn} data-tb-draw /><button type="button" class="tbe-phx" aria-label={t('Remove photo {i}', { i: n + 1 })} onclick={() => dropPhoto(n)}><X size={14} aria-hidden="true" /></button></span>
            {/each}
          </div>
        {/if}
        <PhotoPick onfile={addPhoto} busy={photoBusy} has={!!e.photos.length} again="Add a photo" />
      </div>

      <div class="tbe-sec">
        <span class="tbe-h3"><Tag size={16} aria-hidden="true" />{t('Tags')}</span>
        {#if e.tags.length}
          <div class="tbe-chips">
            {#each e.tags as x (x)}<span class="tbe-chip on" data-tb-tag-on={x}>#{x}<button type="button" aria-label={t('Remove tag {name}', { name: x })} onclick={() => dropTag(x)}><X size={14} aria-hidden="true" /></button></span>{/each}
          </div>
        {/if}
        <div class="tbe-inline">
          <input class="inp" maxlength="30" bind:value={tagIn} placeholder={t('New tag, e.g. Tour')} aria-label={t('New tag')} onkeydown={(ev) => ev.key === 'Enter' && addTag(ev)} data-tb-tag-in />
          <button type="button" class="btn sm" onclick={addTag} data-tb-tag-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
        </div>
        {#if suggest.length}
          <div class="tbe-chips">{#each suggest as x (x.name)}<button type="button" class="tbe-chip" onclick={() => (e.tags = cleanTags([...e.tags, x.name]))} data-tb-tag-suggest={x.name}>#{x.name}</button>{/each}</div>
        {/if}
      </div>

      <div class="tbe-sec">
        <span class="tbe-h3"><MapPin size={16} aria-hidden="true" />{t('Place')}</span>
        <div class="tbe-inline">
          <input class="inp" maxlength="80" value={e.place?.name ?? ''} oninput={(ev) => (e.place = { ...(e.place ?? {}), name: ev.currentTarget.value })} placeholder={t('Where were you?')} aria-label={t('Place')} data-tb-place />
          <button type="button" class="btn sm" onclick={here} data-tb-here><MapPin size={16} aria-hidden="true" />{t('Where I am')}</button>
        </div>
        {#if e.place?.lat}<p class="tbe-note">{t('Position saved')} ({e.place.lat}, {e.place.lon}) <button type="button" class="tbe-link" onclick={() => (e.place = e.place?.name ? { name: e.place.name } : null)}>{t('Remove the position')}</button></p>{/if}
        {#if placeMsg}<p class="tbe-note" role="status">{placeMsg}</p>{/if}
      </div>

      <div class="tbe-sec">
        <span class="tbe-h3"><CloudSun size={16} aria-hidden="true" />{t('Weather')}</span>
        {#if e.weather}
          <div class="tbe-chips"><span class="tbe-chip on" data-tb-weather>{e.weather.temp} °C · {t(WEATHER_WORDS[weatherKind(e.weather.code)])}<button type="button" aria-label={t('Remove the weather')} onclick={() => (e.weather = null)}><X size={14} aria-hidden="true" /></button></span></div>
        {:else}
          <button type="button" class="btn sm" onclick={addWeather} disabled={wxBusy} data-tb-weather-add><CloudSun size={16} aria-hidden="true" />{t('Add the weather now')}</button>
        {/if}
      </div>

      <div class="tbe-sec">
        <span class="tbe-h3"><LayoutGrid size={16} aria-hidden="true" />{t('From the app')}</span>
        <p class="tbe-note">{t('Add what the app knows about this day: rides, sleep, notes, tours, appointments. You choose what goes in.')}</p>
        {#if things === null}
          <button type="button" class="btn sm" onclick={openThings} data-tb-things><Plus size={16} aria-hidden="true" />{t('Choose from this day')}</button>
        {:else if !things.length}
          <p class="tbe-note" data-tb-things-none>{t('The app has nothing for this day yet.')}</p>
        {:else}
          <ul class="tbe-things" data-tb-things-list>
            {#each things as x (x.key)}
              {@const done = (e.refs ?? []).some((r) => r.key === x.key)}
              <li>
                <label class="tbe-thing">
                  <input type="checkbox" value={x.key} bind:group={picked} disabled={done} />
                  <span><small>{t(GROUPS[x.group] ?? x.group)}</small>{x.text}{#if done}<em> · {t('already in the entry')}</em>{/if}</span>
                </label>
              </li>
            {/each}
          </ul>
          <div class="tbe-inline">
            <button type="button" class="btn sm hi" onclick={insertThings} disabled={!picked.length} data-tb-things-add>{t('Add to the entry')}</button>
            <button type="button" class="btn sm" onclick={() => (things = null)}>{t('Cancel')}</button>
          </div>
        {/if}
      </div>
    </div>
    {#if error}<p class="tbe-err" role="alert">{error}</p>{/if}
    <div class="vd-foot">
      {#if !isNew}<button type="button" class="btn del" onclick={remove} data-keeps data-tb-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>{/if}
      <button type="button" class="btn" onclick={() => dialog.close()} data-keeps>{t('Cancel')}</button>
      <button type="submit" class="btn hi" disabled={busy} data-tb-save><Check size={16} aria-hidden="true" />{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  dialog.sheet.vdlg.tbe {
    width: min(760px, calc(100vw - 24px));
  }
  .tbe-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .tbe-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-height: 66vh;
    overflow-y: auto;
    padding: 2px;
  }
  .tbe-q {
    color: var(--accent);
    font-weight: 600;
  }
  .tbe-star {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-3);
    cursor: pointer;
  }
  .tbe-star[aria-pressed='true'] {
    color: var(--warn);
  }
  .tbe-when {
    display: flex;
    gap: 10px;
  }
  .tbe-when .tbe-lab:first-child {
    flex: 1;
  }
  .tbe-lab {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .tbe-moods {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .tbe-mood-q {
    margin-right: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tbe-mood {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    font-size: var(--fs-section);
    cursor: pointer;
    filter: grayscale(0.7);
    opacity: 0.75;
  }
  .tbe-mood[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
    filter: none;
    opacity: 1;
  }
  .tbe-ai {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--paper-2);
  }
  .tbe-aiok {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: var(--fs-small);
    color: var(--ink-2);
    cursor: pointer;
  }
  .tbe-aiok input {
    width: 20px;
    height: 20px;
    margin-top: 1px;
    flex: none;
  }
  .tbe-tidy p {
    margin: 6px 0 8px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  .tbe-title {
    font-weight: 600;
    font-size: var(--fs-sub);
  }
  .tbe-text {
    min-height: 200px;
    font-size: var(--fs-sub);
    line-height: 1.6;
    resize: vertical;
  }
  .tbe-tools {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .tbe-count {
    flex: none;
    padding-top: 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
  }
  .tbe-hl {
    margin: 0;
    padding-left: 20px;
  }
  .tbe-sec {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .tbe-h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
  .tbe-note {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tbe-link {
    border: 0;
    background: none;
    padding: 0;
    color: var(--ink-2);
    text-decoration: underline;
    cursor: pointer;
    font: inherit;
  }
  .tbe-inline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tbe-inline .inp {
    flex: 1;
    min-width: 160px;
  }
  .tbe-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tbe-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .tbe-chip.on {
    background: var(--accent-soft);
    border-color: transparent;
    color: var(--ink);
    cursor: default;
  }
  .tbe-chip button {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    margin-right: -8px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: none;
    color: inherit;
    cursor: pointer;
  }
  .tbe-thumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tbe-ph {
    position: relative;
  }
  .tbe-ph img {
    display: block;
    width: 88px;
    height: 88px;
    border-radius: 12px;
    object-fit: cover;
  }
  .tbe-ph :global(.tbe-phd) {
    position: absolute;
    bottom: 2px;
    right: 2px;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .tbe-phx {
    position: absolute;
    top: 2px;
    right: 2px;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .tbe-things {
    list-style: none;
    margin: 0;
    padding: 4px 12px;
    border-radius: 14px;
    background: var(--paper-2);
  }
  .tbe-things li + li {
    border-top: 1px solid var(--line);
  }
  .tbe-thing {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    cursor: pointer;
  }
  .tbe-thing input {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    flex: none;
  }
  .tbe-thing small {
    display: block;
    color: var(--ink-3);
  }
  .tbe-thing em {
    color: var(--ink-3);
    font-style: normal;
  }
  .tbe-err {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
</style>
