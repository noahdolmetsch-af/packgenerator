<script>
  /**
   * «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe»), step 1: #/me/logbuch. What Noah notices in the app, kept in the app:
   * thirteen kinds in four groups, an urgency, the page and the block, a state. The list, the filter by group, a new entry,
   * change, delete with Undo. The button «Verbessern» on every page, the photo and «Auftrag kopieren» follow as steps 2–4.
   * Everything stays on this device and goes into the backup; nothing is sent, nothing is synced.
   */
  import { liveQuery } from 'dexie';
  import { NotebookPen, Plus, Check, Pencil, ClipboardCopy, Images } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import LogEntrySheet from '../lib/logbuch/LogEntrySheet.svelte';
  import Lightbox from '../lib/ui/Lightbox.svelte';
  import { db } from '../lib/db.js';
  import { GROUPS, filterEntries, counts, isOpen, groupOf } from '../lib/logbuch/logbuch.js';
  import { addEntry, updateEntry, removeEntry, restoreEntry } from '../lib/logbuch/logbuchdb.js';
  import { buildOrder, orderSize, images } from '../lib/logbuch/auftrag.js';
  import { copyText, savePictures } from '../lib/logbuch/export.js';
  import { artLabel, groupLabel, stateLabel } from '../lib/logbuch/words.js';
  import { deleteWithUndo, askDelete, saveFailed } from '../lib/ui/ask.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';

  const q = liveQuery(() => db.logbuch.toArray());
  const all = $derived($q ?? []);
  let group = $state('all');
  const shown = $derived(filterEntries(all, group));
  const n = $derived(counts(all));
  let look = $state(null); // { list, start } while a photo is shown big
  let sheet = $state(null); // { entry } while the window is open (entry null = new)

  const when = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const widthNow = () => globalThis.innerWidth ?? 390;

  async function save(v) {
    try {
      if (sheet?.entry) await updateEntry(sheet.entry.id, v);
      else await addEntry({ ...v, device: widthNow() >= 900 ? 'computer' : 'phone', width: widthNow() });
    } catch (err) {
      offerDone(saveFailed(err));
    }
  }
  async function remove(e) {
    const answer = await askDelete({ title: t('Delete this entry?'), text: t('Only the entry goes. The app itself stays as it is.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({ run: () => removeEntry(e.id), undo: (saved) => restoreEntry(saved), text: t('Entry deleted.'), name: artLabel(e.art) });
  }
  const photoList = $derived(shown.filter((e) => e.photo).map((e) => ({ src: e.photo, name: e.block || e.pageTitle || e.page, sub: e.text, id: e.id, scroll: true })));
  const size = $derived(orderSize(all));
  const pics = $derived(images(all));
  async function copyOrder() {
    const day = new Date().toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
    const ok = size.items + size.notes > 0 && (await copyText(buildOrder(all, day)));
    offerDone(size.items + size.notes === 0 ? t('Nothing open to copy.') : ok ? t('Order copied: {n} entries.', { n: size.items + size.notes }) : t('The order could not be copied. Select the text and copy it by hand.'));
  }
  async function savePics() {
    if (!pics.length) return offerDone(t('No pictures to save yet.'));
    const n = await savePictures(pics);
    if (n) offerDone(t('Pictures saved: {n}. Attach them in the chat.', { n }));
  }
  const done = (e) => updateEntry(e.id, { state: e.state === 'done' ? 'open' : 'done' });
</script>

<div class="lb" data-logbuch>
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Improvement log')} title={t('Improvement log')} sub={t('Write down what bothers you or is missing, right when you see it. Stays on this device and goes into your backup. Nothing is sent.')}>
    <button type="button" class="btn hi" data-lb-new onclick={() => (sheet = { entry: null })}><Plus size={16} aria-hidden="true" />{t('New entry')}</button>
  </VeloHead>

  {#if $q && !all.length}
    <Empty icon={NotebookPen} title={t('Nothing written down yet')} text={t('The log collects what you notice in the app: a wrong text, a missing hint, a block in the wrong place. One sentence is enough. Small things get changed in one small step, bigger ones get a picture first.')} action={{ label: t('Write the first entry'), onclick: () => (sheet = { entry: null }) }} />
  {:else if $q}
    <section class="ich-sec" aria-labelledby="lb-h">
      <div class="ich-h"><div><h2 id="lb-h">{tn(n.open, '{n} entry open', '{n} entries open')}</h2><p class="ich-hs">{n.now ? tn(n.now, '{n} bothers you now', '{n} bother you now') : t('None bothers you right now')}</p></div></div>
      <div class="lb-chips" role="group" aria-label={t('Group|logbuch')}>
        <button type="button" class="fchip" aria-pressed={group === 'all'} data-lb-group="all" onclick={() => (group = 'all')}>{t('All|logbuch')} {n.all}</button>
        {#each GROUPS as g (g.key)}
          <button type="button" class="fchip" aria-pressed={group === g.key} data-lb-group={g.key} onclick={() => (group = g.key)}>{groupLabel(g.key)} {n[g.key]}</button>
        {/each}
      </div>
      <ul class="card ich-list lb-list">
        {#each shown as e (e.id)}
          <li class="lb-item" data-lb-entry={e.id} data-art={e.art} class:finished={!isOpen(e)}>
            <div class="lb-top">
              <span class="pill">{artLabel(e.art)}</span>
              {#if e.urgent === 'now' && isOpen(e)}<span class="pill lb-now" data-lb-now>{t('Bothers me now')}</span>{/if}
              <span class="pill lb-st" data-lb-state={e.state}>{stateLabel(e.state)}</span>
            </div>
            <p class="lb-text">{#if e.block}<b>{e.block}:</b> {/if}{e.text}</p>
            {#if e.photo}
              <button type="button" class="lb-thumb" data-lb-photo onclick={() => (look = { list: photoList, start: Math.max(0, photoList.findIndex((p) => p.id === e.id)) })} aria-label={t('Show the photo big')}><img src={e.photo} alt={t('Photo of the page')} /></button>
            {:else if e.photoNote}
              <small class="lb-meta" data-lb-nophoto>{t('Photo not possible')}</small>
            {/if}
            <small class="lb-meta">{[e.page, when(e.at), e.device === 'computer' ? t('Computer|logbuch') : t('Phone|logbuch')].filter(Boolean).join(' · ')}</small>
            <div class="lb-acts">
              {#if groupOf(e.art) !== 'new' || e.art === 'idee'}
                <button type="button" class="btn" data-lb-done onclick={() => done(e)}><Check size={16} aria-hidden="true" />{e.state === 'done' ? t('Open again') : t('Done|logbuch')}</button>
              {/if}
              <button type="button" class="btn" data-lb-edit onclick={() => (sheet = { entry: e })}><Pencil size={16} aria-hidden="true" />{t('Change|logbuch')}</button>
            </div>
          </li>
        {:else}
          <li class="lb-none">{t('No entry in this group.')}</li>
        {/each}
      </ul>
    </section>

    <section class="ich-sec" aria-labelledby="lb-order-h">
      <div class="ich-h"><div><h2 id="lb-order-h">{t('Order for the chat')}</h2><p class="ich-hs">{t('Copy the open entries as one text, sorted by page, and save their pictures. You paste it in the chat. Nothing is sent from here.')}</p></div></div>
      <div class="lb-acts">
        <button type="button" class="btn hi" data-lb-copy onclick={copyOrder}><ClipboardCopy size={16} aria-hidden="true" />{t('Copy the order')}</button>
        {#if pics.length}<button type="button" class="btn" data-lb-images onclick={savePics}><Images size={16} aria-hidden="true" />{t('Save the pictures')} {pics.length}</button>{/if}
      </div>
    </section>

    <section class="ich-sec" aria-labelledby="lb-next-h">
      <div class="ich-h"><div><h2 id="lb-next-h">{t('What happens with it?')}</h2></div></div>
      <ul class="card ich-list lb-next">
        <li><b>{t('Small things|logbuch')}</b> <span>{t('Change text, hint missing, explanation, error, number wrong, too slow: one small step with a before and after picture. You say ok.')}</span></li>
        <li><b>{t('Needs a picture first')}</b> <span>{t('Order, layout, handling, away with it, can\'t find it, missing / idea: first a picture of how it could look, then the change.')}</span></li>
        <li><b>{t('Good as it is')}</b> <span>{t('Only a note, so it is kept when the app is rebuilt.')}</span></li>
      </ul>
    </section>
  {/if}
</div>

{#if look}<Lightbox list={look.list} start={look.start} onclose={() => (look = null)} />{/if}
{#if sheet}
  <LogEntrySheet entry={sheet.entry} onsave={save} onremove={sheet.entry ? () => remove(sheet.entry) : null} onclose={() => (sheet = null)} />
{/if}

<style>
  .lb-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }
  .fchip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .fchip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
    font-weight: 600;
  }
  .lb-list {
    padding: 0;
  }
  .lb-item {
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border-top: 1px solid var(--line);
  }
  .lb-item:first-child {
    border-top: 0;
  }
  .lb-item.finished {
    opacity: 0.75;
  }
  .lb-top {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .lb-now {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .lb-text {
    margin: 0;
    overflow-wrap: break-word;
  }
  .lb-text b,
  .lb-next b {
    margin-inline-end: 0.35em;
  }
  .lb-meta {
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .lb-thumb {
    display: block;
    width: 120px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
    background: var(--paper-2);
    cursor: pointer;
  }
  .lb-thumb img {
    display: block;
    width: 100%;
    height: 120px;
    object-fit: cover;
    object-position: top;
  }
  .lb-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lb-none {
    padding: 14px;
    color: var(--ink-2);
  }
  .lb-next {
    padding: 4px 14px;
    list-style: none;
  }
  .lb-next li {
    padding: 8px 0;
    border-top: 1px solid var(--line);
    color: var(--ink-2);
  }
  .lb-next li:first-child {
    border-top: 0;
  }
</style>
