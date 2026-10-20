<script>
  /**
   * Paket N idea 4 / N15 (Noah 19.10.2026 «1-5 a»): a note to read like an article. Big calm type, one
   * column, the photos full width, the formatting shown (mdToHtml escapes everything first), the
   * checklist, the links and the place. Only reading: «Edit» goes back to the note.
   */
  import { backClose } from '../ui/backclose.js';
  import { noteTitle } from '../notebook.js';
  import { photosOf, linksOf, placeLinks, placeText, mdToHtml } from '../noteformats.js';
  import { t, locale } from '../i18n.svelte.js';
  import { X, Pencil, MapPin } from '@lucide/svelte';

  let { note, onclose } = $props();
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const when = $derived(note.at ? new Date(note.at).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const cl = $derived(note.checklist ?? []);
  const pl = $derived(note.place ? placeLinks(note.place) : null);
</script>

<dialog use:backClose class="reader" bind:this={dialog} {onclose} aria-labelledby="rd-h" data-note-reader>
  <div class="bar">
    <button type="button" class="btn sm" onclick={() => dialog.close()}><Pencil size={16} aria-hidden="true" />{t('Edit the note')}</button>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <article>
    <h1 id="rd-h">{noteTitle(note)}</h1>
    {#if when}<p class="meta">{when}</p>{/if}
    {#each photosOf(note) as ph, i (i)}<img src={ph} alt={t('Photo of the note')} />{/each}
    {#if note.text?.trim()}<div class="md">{@html mdToHtml(note.text)}</div>{/if}
    {#if cl.length}
      <ul class="cl">
        {#each cl as c, i (i)}<li class:done={c.done}><span aria-hidden="true">{c.done ? '☑' : '☐'}</span> {c.text}</li>{/each}
      </ul>
    {/if}
    {#if note.place}
      <p class="pl"><MapPin size={16} aria-hidden="true" /> {placeText(note.place)}{#if pl}{' '}· <a href={pl.maps} target="_blank" rel="noopener noreferrer">Google Maps</a> · <a href={pl.swisstopo} target="_blank" rel="noopener noreferrer">swisstopo</a>{/if}</p>
    {/if}
    {#each linksOf(note) as l, i (i)}<p class="lk"><a href={l.url} target="_blank" rel="noopener noreferrer">{l.title || l.url}</a></p>{/each}
  </article>
</dialog>

<style>
  .reader {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--paper);
    color: var(--ink);
  }
  .bar {
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }
  article {
    max-width: 38em;
    margin: 0 auto;
    padding: 24px 20px 48px;
    font-size: var(--fs-sub);
    line-height: 1.65;
  }
  h1 {
    font-size: var(--fs-page);
    line-height: 1.2;
    margin: 0 0 4px;
    overflow-wrap: break-word;
  }
  .meta {
    color: var(--ink-3);
    margin: 0 0 20px;
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 10px;
    margin: 0 0 16px;
  }
  .md {
    overflow-wrap: break-word;
  }
  .md :global(table) {
    border-collapse: collapse;
    margin: 8px 0;
    display: block;
    overflow-x: auto;
  }
  .md :global(th),
  .md :global(td) {
    border: 1px solid var(--line);
    padding: 4px 8px;
  }
  .cl {
    list-style: none;
    padding: 0;
  }
  .cl .done {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .pl,
  .lk {
    overflow-wrap: break-word;
  }
</style>
