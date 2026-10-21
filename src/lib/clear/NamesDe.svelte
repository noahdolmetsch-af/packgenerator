<script>
  /**
   * «Englische Namen auf Deutsch» (Noah 21.10.2026 «1a»): Ich › Daten shows the English item names from
   * the import with a German suggestion (namesde.js, offline). «Übernehmen» sets the German name (nameDe;
   * the original name stays), «Nicht vorschlagen» remembers the item in settings (SKIP_KEY, in backups),
   * «Alle übernehmen» takes every open one. Each step offers «Rückgängig». Ten rows first, then «n weitere».
   * Shown only while there are names to suggest (or when the link #/me/data?names asks for it).
   */
  import { liveQuery } from 'dexie';
  import { ArrowRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { openNames, SKIP_KEY, NAMES_HASH, NAMES_ROWS } from '../namesde.js';

  const itemsQ = liveQuery(() => db.items.toArray());
  const skipQ = liveQuery(() => db.settings.get(SKIP_KEY));
  const skip = $derived(Array.isArray($skipQ?.value) ? $skipQ.value : []);
  const rows = $derived($itemsQ ? openNames($itemsQ, skip) : null);
  let edits = $state({});
  let all = $state(false);
  let sec = $state(null);
  const asked = typeof location !== 'undefined' && location.hash.startsWith(NAMES_HASH);
  const shown = $derived(rows ? (all ? rows : rows.slice(0, NAMES_ROWS)) : []);
  const valueOf = (r) => edits[r.id] ?? r.suggestion;

  // the link from Material › ••• leads here
  $effect(() => {
    if (asked && sec && rows) sec.scrollIntoView({ block: 'start' });
  });

  const now = () => new Date().toISOString();
  async function setDe(list) {
    const back = [];
    await db.transaction('rw', db.items, async () => {
      for (const { id, nameDe } of list) {
        const live = await db.items.get(id);
        if (!live) continue;
        back.push({ id, nameDe: live.nameDe, updatedAt: live.updatedAt });
        await db.items.update(id, { nameDe, updatedAt: now() });
      }
    });
    return back;
  }
  const undoDe = (back) => async () => {
    await db.transaction('rw', db.items, async () => {
      for (const b of back) await db.items.update(b.id, { nameDe: b.nameDe, updatedAt: b.updatedAt });
    });
  };

  async function take(r) {
    const nameDe = String(valueOf(r)).trim();
    if (!nameDe) return;
    const back = await setDe([{ id: r.id, nameDe }]);
    delete edits[r.id];
    offerDone(t('German name «{name}» saved.', { name: nameDe }), undoDe(back));
  }
  async function takeAll() {
    const list = (rows ?? []).map((r) => ({ id: r.id, nameDe: String(valueOf(r)).trim() })).filter((x) => x.nameDe);
    if (!list.length) return;
    const back = await setDe(list);
    edits = {};
    offerDone(tn(list.length, '{n} German name saved.', '{n} German names saved.'), undoDe(back));
  }
  async function dismiss(r) {
    const before = [...skip];
    await db.settings.put({ key: SKIP_KEY, value: [...new Set([...before, r.id])] });
    offerDone(t('No suggestion for «{name}» any more.', { name: r.name }), async () => {
      await db.settings.put({ key: SKIP_KEY, value: before });
    });
  }
</script>

{#if rows && (rows.length || asked)}
  <section class="ich-sec" aria-labelledby="names-h" data-section="names" bind:this={sec}>
    <div class="ich-h">
      <div>
        <h2 id="names-h">{t('English names')}</h2>
        <p class="ich-hs">{t('Names from your import that are English. Take over the German suggestion or leave it.')}</p>
      </div>
    </div>
    {#if rows.length}
      <div class="card nd-card">
        {#if rows.length > 1}
          <div class="nd-top">
            <span class="nd-count">{tn(rows.length, '{n} name with a suggestion', '{n} names with a suggestion')}</span>
            <button type="button" class="btn sm" onclick={takeAll} data-names-all>{t('Take over all')}</button>
          </div>
        {/if}
        <ul class="nd-list">
          {#each shown as r (r.id)}
            <li class="nd-row" data-name-row={r.id}>
              <div class="nd-pair">
                <span class="nd-en" data-name-en>{r.name}</span>
                <ArrowRight class="nd-arrow" size={16} aria-hidden="true" />
                <label class="nd-field">
                  <span class="sr">{t('German name for «{name}»', { name: r.name })}</span>
                  <input class="inp" type="text" value={valueOf(r)} oninput={(e) => (edits[r.id] = e.currentTarget.value)} data-name-de />
                </label>
              </div>
              <div class="nd-acts">
                <button type="button" class="btn sm hi" onclick={() => take(r)} data-name-take>{t('Take over')}</button>
                <button type="button" class="btn sm" onclick={() => dismiss(r)} data-name-skip>{t('Do not suggest')}</button>
              </div>
            </li>
          {/each}
        </ul>
        {#if !all && rows.length > NAMES_ROWS}
          <button type="button" class="btn sm nd-more" onclick={() => (all = true)} data-names-more>{t('Show {n} more', { n: rows.length - NAMES_ROWS })}</button>
        {/if}
      </div>
    {:else}
      <p class="card nd-none" data-names-none>{t('No English names left.')}</p>
    {/if}
  </section>
{/if}

<style>
  .nd-card {
    padding: 8px 16px 12px;
  }
  .nd-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 4px 0 8px;
  }
  .nd-count {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nd-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .nd-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 10px 0;
  }
  .nd-row + .nd-row {
    border-top: 1px solid var(--line);
  }
  .nd-pair {
    display: flex;
    flex: 1 1 22em;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    min-width: 0;
  }
  .nd-en {
    color: var(--ink-2);
    overflow-wrap: break-word;
    min-width: 0;
  }
  .nd-pair :global(.nd-arrow) {
    flex: none;
    color: var(--ink-3);
  }
  .nd-field {
    flex: 1 1 12em;
    min-width: 0;
  }
  .nd-field input {
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
  }
  .nd-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .nd-acts .btn,
  .nd-top .btn,
  .nd-more {
    min-height: 44px;
  }
  .nd-more {
    margin-top: 8px;
  }
  .nd-none {
    margin: 0;
    padding: 12px 16px;
    color: var(--ink-3);
  }
</style>
