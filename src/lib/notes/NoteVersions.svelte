<script>
  /**
   * Paket NE 1151 (Noah 20.10.2026 «10a»): the earlier versions of a note (title, text, checklist, links,
   * place, topic), newest first, at most 20. «Put back» takes one into the note; the text as it is now is
   * kept as a version first, so nothing is lost. Photos, drawings and files stay as they are.
   * note: the draft; onput(next): the note with the version.
   */
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { versionsOf, keepVersion, withVersion, versionLine, VERSION_KEEP } from './trash.js';
  import { History, Undo2 } from '@lucide/svelte';

  let { note, onput } = $props();
  let rows = $state(null);
  let shown = $state(null);

  async function load() {
    rows = await versionsOf(db, note.id).catch(() => []);
  }
  $effect(() => {
    load();
  });
  const when = (iso) => new Date(iso).toLocaleString(locale(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  async function put(r) {
    await keepVersion(db, $state.snapshot(note), null, new Date(), { force: true });
    onput?.(withVersion($state.snapshot(note), $state.snapshot(r.v)));
    shown = null;
    await load();
  }
</script>

<div class="ver" data-note-versions>
  <p class="h"><History size={16} aria-hidden="true" /> {t('Earlier versions')}</p>
  {#if rows && !rows.length}
    <p class="q">{t('No earlier version yet. When you change the note, the app keeps the text from before (at most {n}).', { n: VERSION_KEEP })}</p>
  {:else if rows}
    <ul>
      {#each rows as r (r.id)}
        {@const l = versionLine(r.v, note)}
        <li data-version>
          <button type="button" class="vo" aria-expanded={shown === r.id} onclick={() => (shown = shown === r.id ? null : r.id)}><b>{when(r.at)}</b><small>{l.first || t('Note')}{l.diff ? ` · ${l.diff > 0 ? '+' : ''}${t('{n} words', { n: l.diff })}` : ''}</small></button>
          {#if shown === r.id}
            <pre class="pv" data-version-text>{[r.v.title, r.v.text, ...(r.v.checklist ?? []).map((c) => `${c.done ? '☑' : '☐'} ${c.text}`)].filter(Boolean).join('\n')}</pre>
            <button type="button" class="btn sm" onclick={() => put(r)} data-version-put><Undo2 size={16} aria-hidden="true" />{t('Put this version back')}</button>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="q">{t('The text as it is now is kept as a version first. Photos and files stay as they are.')}</p>
  {/if}
</div>

<style>
  .ver {
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .h {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font-weight: 500;
  }
  ul {
    display: grid;
    gap: 4px;
    margin: 0 0 6px;
    padding: 0;
    list-style: none;
  }
  .vo {
    display: grid;
    width: 100%;
    min-height: 44px;
    padding: 4px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .vo b {
    font-weight: 500;
  }
  .vo small,
  .q {
    overflow-wrap: break-word;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .q {
    margin: 0;
  }
  .pv {
    max-height: 12em;
    margin: 4px 0 8px;
    overflow: auto;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    font: inherit;
    font-size: var(--fs-small);
  }
</style>
