<script>
  /**
   * Paket P4 «Aktiv», mockup E5 «Gewünscht und erlebt»: every area of the balance ring as a bar (what you
   * lived the last 7 days) with your wish as a mark, and − / + that change the wish in steps of 10 (saved at
   * once, the same wish as the ring's line). A summary line under it. Rules: lib/gutertag.js.
   * cats: balance(…).cats; wish: { key: 0–100 }; onwish(next) saves.
   */
  import { Minus, Plus } from '@lucide/svelte';
  import { CAT } from '../balance.js';
  import { mixRows, stepWish, mixSummary } from '../gutertag.js';
  import { t } from '../i18n.svelte.js';

  let { cats = [], wish = {}, onwish } = $props();

  const rows = $derived(mixRows(cats, wish));
  const sum = $derived(mixSummary(rows));
  const name = (k) => t(CAT[k]?.label ?? k);
  const list = (keys) => keys.map(name).join(', ');
</script>

<div class="mx" data-mix>
  <p class="mx-sub">{t('Wished and lived')}<small>{t('Bar: the last 7 days · mark: your wish')}</small></p>
  <ul class="mx-list">
    {#each rows as r (r.key)}
      <li class="mx-row" data-mix-row={r.key}>
        <span class="mx-n">{name(r.key)}</span>
        <span class="mx-bar" role="img" aria-label={r.wish == null ? t('{name}: lived {v}, no wish', { name: name(r.key), v: r.value ?? '–' }) : t('{name}: lived {v}, wish {w}', { name: name(r.key), v: r.value ?? '–', w: r.wish })}>
          <i class="mx-fill" style:width="{r.value ?? 0}%"></i>
          {#if r.wish != null}<i class="mx-mark" style:left="{r.wish}%" data-mix-wish={r.wish}></i>{/if}
        </span>
        <span class="mx-step">
          <button type="button" class="mx-b" aria-label={t('Wish for {name} lower', { name: name(r.key) })} disabled={r.wish === 0} onclick={() => onwish?.(stepWish(wish, r.key, -10))} data-mix-minus><Minus size={16} aria-hidden="true" /></button>
          <button type="button" class="mx-b" aria-label={t('Wish for {name} higher', { name: name(r.key) })} disabled={r.wish === 100} onclick={() => onwish?.(stepWish(wish, r.key, 10))} data-mix-plus><Plus size={16} aria-hidden="true" /></button>
        </span>
      </li>
    {/each}
  </ul>
  <p class="mx-sum" data-mix-sum>
    {#if !sum.known}{t('Set a wish with + and −: the mark shows it on each bar.')}
    {:else if sum.under.length && sum.over.length}{t('Less than you wish: {a}. More than you wish: {b}.', { a: list(sum.under), b: list(sum.over) })}
    {:else if sum.under.length}{t('Less than you wish: {a}.', { a: list(sum.under) })}
    {:else if sum.over.length}{t('More than you wish: {b}.', { b: list(sum.over) })}
    {:else}{t('Your week is close to your wish.')}{/if}
  </p>
</div>

<style>
  .mx {
    width: 100%;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    text-align: left;
  }
  .mx-sub {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
    margin: 0 0 6px;
    font-weight: 600;
  }
  .mx-sub small {
    font-weight: 400;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mx-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .mx-row {
    display: grid;
    grid-template-columns: minmax(6em, 9em) 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
  }
  .mx-n {
    min-width: 0;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .mx-bar {
    position: relative;
    height: 10px;
    border-radius: 999px;
    background: var(--paper-2);
  }
  .mx-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border-radius: 999px;
    background: var(--accent);
  }
  .mx-mark {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 3px;
    margin-left: -1px;
    border-radius: 2px;
    background: var(--ink);
  }
  .mx-step {
    display: flex;
  }
  .mx-b {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .mx-b:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .mx-sum {
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
</style>
