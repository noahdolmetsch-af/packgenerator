<script>
  /**
   * Idee 55 «Notiz an einen späteren Ort» (Touren b, answer a): on the live map, AHEAD_M before the point of a note,
   * the note shows with a short tone and a vibration (once per note). «Erledigt» ends it, «Später nochmals» waits
   * LATER_MIN minutes. Live.svelte mounts it among its alerts with the position (me) and the tour.
   */
  import { liveQuery } from 'dexie';
  import { NotebookPen } from '@lucide/svelte';
  import { db } from '../db.js';
  import { softTone } from '../unterwegs/ton.js';
  import { notesHere, LATER_MIN } from './placenote.js';
  import { t, num } from '../i18n.svelte.js';

  let { me = null, tripId = null } = $props();
  const notesQ = liveQuery(() => db.notes.toArray());
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 15000);
    return () => clearInterval(id);
  });
  const here = $derived(notesHere($notesQ ?? [], tripId, me, now));
  const top = $derived(here[0] ?? null);
  const rang = new Set();
  $effect(() => {
    const id = top?.note.id;
    if (!id || rang.has(id)) return;
    rang.add(id);
    try {
      navigator.vibrate?.([200, 100, 200]);
    } catch {
      /* no vibration */
    }
    softTone();
  });
  const patch = (fields) => top && db.notes.update(top.note.id, { at2: { ...top.note.at2, ...fields } });
</script>

{#if top}
  <div class="lvf-alert lpn" role="alert" data-live-place-note>
    <NotebookPen size={18} aria-hidden="true" />
    <span class="lpn-t"><b>{top.m > 50 ? t('In {m} m: your note', { m: num(Math.round(top.m / 10) * 10) }) : t('Here: your note')}</b><small>{top.note.text}</small></span>
    <button type="button" class="btn sm" onclick={() => patch({ done: true })} data-place-note-done>{t('Done|placenote')}</button>
    <button type="button" class="btn sm" onclick={() => patch({ later: Date.now() + LATER_MIN * 60000 })}>{t('Later again')}</button>
  </div>
{/if}

<style>
  .lpn {
    flex-wrap: wrap;
  }
  .lpn-t {
    display: grid;
    flex: 1 1 160px;
    min-width: 0;
  }
  .lpn-t small {
    overflow-wrap: break-word;
  }
</style>
