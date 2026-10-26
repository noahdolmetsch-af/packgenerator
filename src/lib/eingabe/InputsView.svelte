<script>
  /**
   * «Eingaben überall»: what was added to a record (inputs.js): voice notes to listen to, photos, files to
   * open, the place and the tags. `edit`: each part has «Remove» (with Undo, by the caller) and a voice note
   * «As text» (Whisper on this device). Shows nothing when nothing was added.
   * ondrop(kind, key): kind 'voice' | 'file' | 'photo' | 'place' | 'tag'; ontotext(voice).
   */
  import { Mic, FileText, MapPin, X, Type, Download } from '@lucide/svelte';
  import Lightbox from '../ui/Lightbox.svelte';
  import { t, num } from '../i18n.svelte.js';
  import { inputsOf, hasInputs, sizeText } from './inputs.js';

  let { inputs = null, edit = false, ondrop = () => {}, ontotext = null, busyVoice = '', small = false } = $props();
  const v = $derived(inputsOf(inputs));
  let lightbox = $state(null);
</script>

{#if hasInputs(v)}
  <div class="inv" class:small data-inputs-view>
    {#each v.voices as a, i (a.id)}
      <div class="inv-voice" data-in-voice>
        <Mic size={16} aria-hidden="true" />
        <audio controls preload="none" src={a.src} aria-label={t('Voice note {i}', { i: i + 1 })}></audio>
        <span class="inv-fine num">{t('{n} s', { n: a.s })}</span>
        {#if edit && ontotext && !a.text}<button type="button" class="btn sm" disabled={!!busyVoice} onclick={() => ontotext(a)} data-in-voice-text><Type size={16} aria-hidden="true" />{busyVoice === a.id ? t('Listening …') : t('As text')}</button>{/if}
        {#if edit}<button type="button" class="inv-x" aria-label={t('Remove voice note {i}', { i: i + 1 })} onclick={() => ondrop('voice', a.id)}><X size={16} aria-hidden="true" /></button>{/if}
        {#if a.text}<p class="inv-said">«{a.text}»</p>{/if}
      </div>
    {/each}
    {#if v.photos.length}
      <div class="inv-photos">
        {#each v.photos as p, i (p.src.slice(-40) + i)}
          <span class="inv-ph">
            <button type="button" class="inv-phb" onclick={() => (lightbox = i)} aria-label={t('Show photo {i} big', { i: i + 1 })}><img src={p.src} alt="" /></button>
            {#if edit}<button type="button" class="inv-x inv-phx" aria-label={t('Remove photo {i}', { i: i + 1 })} onclick={() => ondrop('photo', i)}><X size={14} aria-hidden="true" /></button>{/if}
          </span>
        {/each}
      </div>
    {/if}
    {#each v.files as f (f.id)}
      <div class="inv-file" data-in-file>
        <FileText size={16} aria-hidden="true" />
        <a href={f.src} download={f.name} class="inv-name">{f.name}</a>
        <span class="inv-fine">{sizeText(f.bytes, num)}</span>
        <a class="inv-x" href={f.src} download={f.name} aria-label={t('Download {name}', { name: f.name })}><Download size={16} aria-hidden="true" /></a>
        {#if edit}<button type="button" class="inv-x" aria-label={t('Remove {name}', { name: f.name })} onclick={() => ondrop('file', f.id)}><X size={16} aria-hidden="true" /></button>{/if}
      </div>
    {/each}
    {#if v.place || v.tags.length}
      <div class="inv-chips">
        {#if v.place}
          <span class="inv-chip" data-in-place>
            <MapPin size={14} aria-hidden="true" />
            {#if v.place.lat}<a href={`https://www.google.com/maps/search/?api=1&query=${v.place.lat},${v.place.lon}`} target="_blank" rel="noopener">{v.place.name || t('On the map')}</a>{:else}{v.place.name}{/if}
            {#if edit}<button type="button" aria-label={t('Remove the place')} onclick={() => ondrop('place')}><X size={14} aria-hidden="true" /></button>{/if}
          </span>
        {/if}
        {#each v.tags as s (s)}
          <span class="inv-chip" data-in-tag={s}>#{s}{#if edit}<button type="button" aria-label={t('Remove tag {name}', { name: s })} onclick={() => ondrop('tag', s)}><X size={14} aria-hidden="true" /></button>{/if}</span>
        {/each}
      </div>
    {/if}
  </div>
{/if}
{#if lightbox !== null}
  <Lightbox list={v.photos.map((p, i) => ({ src: p.src, name: t('Photo {i} of {n}', { i: i + 1, n: v.photos.length }) }))} start={lightbox} onclose={() => (lightbox = null)} />
{/if}

<style>
  .inv {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .inv-voice,
  .inv-file {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .inv-voice audio {
    height: 36px;
    max-width: 100%;
    flex: 1 1 180px;
  }
  .small .inv-voice audio {
    height: 32px;
  }
  .inv-said {
    flex-basis: 100%;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .inv-name {
    min-width: 0;
    overflow-wrap: break-word;
    color: var(--ink);
  }
  .inv-fine {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .inv-x {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .inv-x:hover {
    background: var(--tint);
  }
  .inv-photos {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .inv-ph {
    position: relative;
  }
  .inv-phb {
    display: block;
    padding: 0;
    border: 0;
    background: none;
    cursor: zoom-in;
  }
  .inv-ph img {
    display: block;
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 8px;
  }
  .inv-phx {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 28px;
    height: 28px;
    background: var(--paper);
    box-shadow: var(--shadow);
  }
  .inv-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .inv-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .inv-chip a {
    color: inherit;
  }
  .inv-chip button {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    margin-right: -6px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
