<script>
  /**
   * «Nacht-Stopp-Ablauf» (Noah 28.10.2026 «1a»): on the page «Rennen detailliert planen», what you do at
   * every night stop, ticked off one by one. «Next stop» clears the ticks (with Undo) and counts the stop.
   * Your own list per race (stored.stops): add, change, delete with Undo, sort with arrows and dragging.
   */
  import { Moon, RotateCcw } from '@lucide/svelte';
  import EditList from './EditList.svelte';
  import { stopsOf, stopCount, nextStop } from './stop-lib.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { ctx } = $props();
  const rows = $derived(stopsOf(ctx.stored, t));
  const n = $derived(stopCount(ctx.stored));
  const done = $derived(rows.filter((r) => r.done).length);
  const save = (list, count = n) => ctx.save({ stops: { list: list.map((r) => ({ id: r.id, text: r.text, done: r.done === true })), n: count } });
  const tick = (id, v) => save(rows.map((r) => (r.id === id ? { ...r, done: v } : r)));
  function again() {
    const before = ctx.stored.stops ?? null;
    ctx.save({ stops: nextStop(rows, n) });
    offerDone(t('Ready for the next stop: all ticks are off.'), () => ctx.save({ stops: before }));
  }
</script>

<section class="rc-box" aria-labelledby="st-h" data-race-stops>
  <h2 id="st-h" class="rc-h2"><Moon size={18} aria-hidden="true" /> {t('Night stop routine')}</h2>
  <p class="rc-note">{t('What you do at every night stop, one after the other. Tick it off, then start fresh at the next stop.')}</p>
  {#if rows.length}
    <div class="st-head">
      <p class="st-sum" role="status" data-stops-sum>{done === rows.length ? t('All done. Good night!') : t('{done} of {of} done', { done, of: rows.length })}{#if n}{' '}· <span data-stops-n>{t('stop {n}', { n: n + 1 })}</span>{/if}</p>
      <span class="st-bar" aria-hidden="true"><span style:width="{Math.round((done / Math.max(rows.length, 1)) * 100)}%"></span></span>
    </div>
    <ol class="st-list" data-stops-list>
      {#each rows as r, i (r.id)}
        <li class:st-done={r.done}>
          <label class="st-tick">
            <input type="checkbox" checked={r.done} onchange={(e) => tick(r.id, e.currentTarget.checked)} data-stops-done={r.id} />
            <span class="st-num num" aria-hidden="true">{i + 1}</span>
            <span class="st-text">{r.text}</span>
          </label>
        </li>
      {/each}
    </ol>
    <button type="button" class="btn sm" onclick={again} disabled={!done} data-stops-next><RotateCcw size={16} aria-hidden="true" />{t('Next stop: ticks off')}</button>
  {/if}
  <details class="st-more">
    <summary data-stops-edit>{t('Change the steps')}</summary>
    <EditList {rows} onchange={(list) => save(list)} label={t('Step')} addLabel={t('Add')} placeholder={t('e.g. Brush your teeth')} name={t('Step')} testid="stops" blank={{ done: false }} />
  </details>
</section>

<style>
  .st-head {
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border-radius: var(--radius-card);
    background: var(--accent-soft);
  }
  .st-sum {
    margin: 0;
    font-weight: 600;
  }
  .st-bar {
    display: block;
    height: 8px;
    border-radius: 4px;
    background: var(--paper);
    overflow: hidden;
  }
  .st-bar span {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .st-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: 8px;
  }
  .st-list li {
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .st-list li.st-done {
    border-color: transparent;
    background: var(--ok-soft);
  }
  .st-tick {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 8px 12px;
    cursor: pointer;
  }
  .st-tick input {
    flex: none;
    width: 20px;
    height: 20px;
  }
  .st-num {
    flex: none;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: var(--fs-small);
    font-weight: 700;
  }
  .st-done .st-num {
    background: var(--accent);
    color: var(--paper);
  }
  .st-done .st-text {
    color: var(--ink-2);
    text-decoration: line-through;
  }
  .st-more summary {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: 600;
  }
</style>
