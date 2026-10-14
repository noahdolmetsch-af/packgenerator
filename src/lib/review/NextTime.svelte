<script>
  /**
   * SN2x U6 «Für nächstes Mal» (mockup SN2j-a unten; Noah 13.10.2026 20:23/20:24 «immer nur wenn relevant»,
   * «ja genau»): short points for next time, each with the situation it is for (one of the seven rules of
   * «Bausteine je nach Lage», a ride into the dark, or every trip). They come back as a reminder when a trip
   * is planned or packed that fits (ganz.js remindersFor), also beyond the comparison group.
   * A tap on a point changes or deletes it. Suggestions from what was missing and the sentence for next time;
   * nothing is added by itself. points: [{ id, text, when }]; onchange(points) stores them on the debrief.
   */
  import { t, tn } from '../i18n.svelte.js';
  import { NEXT_WHEN, WHEN_WORD, guessWhen, pointSuggestions } from './ganz.js';
  import { BellRing, Plus, Check, Trash2, X } from '@lucide/svelte';

  let { points = [], debrief = null, hits = {}, onchange = () => {} } = $props();
  const whenWord = (w) => t(WHEN_WORD[w] ?? WHEN_WORD.any);
  const sugg = $derived(pointSuggestions({ ...(debrief ?? {}), nextTime: points }, hits));
  let editing = $state(null);
  let draft = $state({ text: '', when: 'any' });
  let text = $state('');
  let when = $state(null);
  const newId = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const plain = (list) => list.map((p) => ({ id: p.id, text: p.text, when: p.when }));
  function add(e) {
    e?.preventDefault();
    const v = text.trim();
    if (!v) return;
    onchange([...plain(points), { id: newId(), text: v, when: when ?? guessWhen(v, hits) }]);
    text = '';
    when = null;
  }
  function take(s) {
    onchange([...plain(points), { id: newId(), text: s.pack ? t('Pack {item}', { item: s.name }) : s.text, when: s.when }]);
  }
  function edit(p) {
    editing = p.id;
    draft = { text: p.text, when: p.when };
  }
  function save(e) {
    e?.preventDefault();
    const v = draft.text.trim();
    onchange(v ? plain(points).map((p) => (p.id === editing ? { ...p, text: v, when: draft.when } : p)) : plain(points).filter((p) => p.id !== editing));
    editing = null;
  }
  function drop(id) {
    onchange(plain(points).filter((p) => p.id !== id));
    editing = null;
  }
</script>

<section class="rv-sec nt" aria-labelledby="nt-h" data-next-time>
  <div class="rv-h"><div><h2 id="nt-h">{t('For next time')}</h2><p class="rv-sub">{points.length ? tn(points.length, '{n} point · comes back when a fitting trip is planned', '{n} points · come back when a fitting trip is planned') : t('Comes back as a reminder when a fitting trip is planned')}</p></div></div>
  <div class="rv-box pad">
    {#if points.length}
      <ol class="pts">
        {#each points as p, i (p.id)}
          <li data-point={p.when}>
            {#if editing === p.id}
              <form class="ed" onsubmit={save}>
                <input class="inp" bind:value={draft.text} aria-label={t('Point {n}', { n: i + 1 })} />
                <select class="sel" bind:value={draft.when} aria-label={t('When it comes back')}>
                  {#each NEXT_WHEN as w (w)}<option value={w}>{whenWord(w)}</option>{/each}
                </select>
                <span class="acts">
                  <button type="submit" class="btn sm"><Check size={16} aria-hidden="true" />{t('Save')}</button>
                  <button type="button" class="btn sm" onclick={() => drop(p.id)}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
                  <button type="button" class="btn sm" onclick={() => (editing = null)} aria-label={t('Cancel')}><X size={16} aria-hidden="true" /></button>
                </span>
              </form>
            {:else}
              <button type="button" class="pt" onclick={() => edit(p)} aria-label={t('Change or delete: {text}', { text: p.text })}>
                <span class="n num">{i + 1}.</span><span class="tx">{p.text}</span><span class="w">{whenWord(p.when)}</span>
              </button>
            {/if}
          </li>
        {/each}
      </ol>
    {/if}
    {#if sugg.length}
      <div class="sg" role="group" aria-label={t('Suggestions from this debrief')}>
        {#each sugg as s (s.key)}<button type="button" class="chip" onclick={() => take(s)}><Plus size={14} aria-hidden="true" />{s.pack ? t('Pack {item}', { item: s.name }) : s.text}</button>{/each}
      </div>
    {/if}
    <form class="add" onsubmit={add}>
      <input class="inp" bind:value={text} placeholder={t('e.g. Gloves too thin')} aria-label={t('New point for next time')} />
      <select class="sel" value={when ?? (text.trim() ? guessWhen(text, hits) : 'any')} onchange={(e) => (when = e.currentTarget.value)} aria-label={t('When it comes back')}>
        {#each NEXT_WHEN as w (w)}<option value={w}>{whenWord(w)}</option>{/each}
      </select>
      <button type="submit" class="btn" disabled={!text.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
    <p class="rv-note pm"><BellRing size={16} aria-hidden="true" /><span>{t('A reminder when you plan or pack a trip it fits, e.g. «when it is cold» only on a cold trip. Tap a point to change or delete it.')}</span></p>
  </div>
</section>

<style>
  .pts {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pts li + li {
    border-top: 1px solid var(--line);
  }
  .pt {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    width: 100%;
    min-height: 48px;
    padding: 10px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .n {
    color: var(--ink-3);
  }
  .tx {
    flex: 1 1 12em;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .w {
    padding: 0 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ed,
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 0;
  }
  .ed .inp,
  .add .inp {
    flex: 1 1 14em;
    min-width: 0;
  }
  .ed select,
  .add select {
    flex: 0 1 auto;
    min-height: 44px;
    max-width: 100%;
  }
  .acts {
    display: flex;
    gap: 6px;
  }
  .acts .btn {
    min-height: 44px;
    min-width: 44px;
    gap: 4px;
  }
  .add {
    border-top: 1px solid var(--line);
  }
  .add .btn {
    min-height: 44px;
    gap: 4px;
  }
  .sg {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 0;
  }
  .sg .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px dashed var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .pm {
    margin-top: 6px;
    padding: 0;
  }
</style>
