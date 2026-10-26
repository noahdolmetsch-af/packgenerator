<script>
  /**
   * Erinnerungskarte (996 Ideen UC-271-I3, Noah 25.10.2026 «bauen 15»): text, sound, picture and place of
   * a note as one small scene, chosen on purpose instead of many attachments. edit: choose the picture
   * and record a sound of up to one minute (the voice note of «Mit Freunden»), then «Keep the card»;
   * without edit it only shows the scene. onsave(card | undefined): undefined takes the card away
   * (the note stays as it is).
   */
  import { backClose } from '../ui/backclose.js';
  import { askDelete } from '../ui/ask.js';
  import { t } from '../i18n.svelte.js';
  import { photosOf } from '../noteformats.js';
  import { cardOf, newCard, cardParts } from './context.js';
  import VoiceNote from '../freunde/VoiceNote.svelte';
  import { X, MapPin, Volume2, Trash2 } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { note, edit = false, onsave, onclose } = $props();
  let dialog;
  // svelte-ignore state_referenced_locally
  let photo = $state(note.card?.photo ?? 0);
  // svelte-ignore state_referenced_locally
  let voice = $state(note.card?.voice ?? '');
  // svelte-ignore state_referenced_locally
  let voiceS = $state(note.card?.voiceS ?? 0);
  const photos = $derived(photosOf(note));
  const scene = $derived(cardOf({ ...note, card: { photo, voice, voiceS } }));
  const parts = $derived(cardParts(scene));
  $effect(() => {
    dialog.showModal();
  });
  function keep() {
    onsave?.(newCard({ photo, voice, voiceS }));
    dialog.close();
  }
  async function drop() {
    // the note stays; only the card goes (saved with the note's «Done»)
    if ((await askDelete({ title: t('Remove the card?'), text: t('The note, its photos and its place stay.') })) !== 'delete') return;
    onsave?.(undefined);
    dialog.close();
  }
</script>

<dialog use:backClose class="sheet vdlg mcard-dlg" bind:this={dialog} onclose={onclose} aria-labelledby="mc-h" data-memory-card>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="mc-h" class="title">{t('Memory card')}</h2>
      <p class="vd-sub">{t('Text, sound, picture and place as one small scene.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <figure class="scene" data-card-scene>
    {#if scene.photo}<img src={scene.photo} alt="" />{:else}<div class="nopic">{t('No picture yet: add a photo to the note.')}</div>{/if}
    <figcaption>
      <b>{scene.title || t('Note')}</b>
      {#if scene.text && scene.text !== scene.title}<span>{scene.text}</span>{/if}
      {#if scene.place}<small><MapPin size={14} aria-hidden="true" /> {scene.place}</small>{/if}
      {#if scene.voice && !edit}<small><Volume2 size={14} aria-hidden="true" /> {t('{n} s', { n: scene.voiceS })}</small><audio controls src={scene.voice}></audio>{/if}
    </figcaption>
  </figure>

  {#if edit}
    <p class="q">{t('{n} of 4 parts: text, sound, picture, place. Place and text come from the note.', { n: parts })}</p>
    {#if photos.length > 1}
      <p class="mc-l">{t('Which picture')}</p>
      <div class="pics" role="group" aria-label={t('Which picture')}>
        {#each photos as p, i (i)}<button type="button" class="pic" aria-pressed={photo === i} aria-label={t('Picture {n}', { n: i + 1 })} onclick={() => (photo = i)}><img src={p} alt="" /></button>{/each}
      </div>
    {/if}
    <p class="mc-l">{t('Sound|card')}</p>
    <VoiceNote {voice} {voiceS} onchange={(v) => ((voice = v.voice), (voiceS = v.voiceS))} />
    <div class="vd-foot">
      {#if note.card}<button type="button" class="btn" onclick={drop} data-card-drop><Trash2 size={16} aria-hidden="true" />{t('Remove the card')}</button>{/if}
      <button type="button" class="btn hi" onclick={keep} data-card-keep>{t('Keep the card')}</button>
    </div>
  {/if}
</dialog>

<style>
  .scene {
    display: grid;
    margin: 0 0 12px;
    overflow: hidden;
    border-radius: var(--r-card, 12px);
    background: var(--paper-2);
  }
  .scene img {
    width: 100%;
    max-height: 46vh;
    object-fit: cover;
  }
  .nopic {
    padding: 28px 16px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: center;
  }
  figcaption {
    display: grid;
    gap: 4px;
    padding: 12px 14px 14px;
  }
  figcaption b {
    font-size: var(--fs-body);
  }
  figcaption small {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  figcaption audio {
    width: 100%;
  }
  .q,
  .mc-l {
    margin: 0 0 8px;
  }
  .q {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pics {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 12px;
  }
  .pic {
    width: 64px;
    height: 64px;
    padding: 0;
    overflow: hidden;
    border: 2px solid transparent;
    border-radius: var(--r-ctl);
    background: none;
    cursor: pointer;
  }
  .pic[aria-pressed='true'] {
    border-color: var(--accent);
  }
  .pic img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
