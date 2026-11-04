<script>
  /**
   * «Neuland» › Alpine passes › «Maybe ridden» (Entdecken und Sammeln, Noah 04.11.2026 «1a 3a»): a pass the line passed
   * between 600 m and 1.2 km from its top. Nothing counts by itself: «Yes, I was there» ticks it, «Not there» sends it
   * away (the same as «I was not there» on a found pass). list: maybeOf(); the page saves.
   */
  import { Check, X, HelpCircle } from '@lucide/svelte';
  import { dayLong } from '../review/fmt.js';
  import { t } from '../i18n.svelte.js';

  let { list = [], what = '', onyes, onno, onopen } = $props();
</script>

{#if list.length}
  <section class="nl-maybe" data-nl-maybe aria-labelledby="nlm-h">
    <h3 id="nlm-h"><HelpCircle size={16} aria-hidden="true" />{t('{n} maybe ridden: please confirm', { n: list.length })}</h3>
    <p class="q">{t('The line passed these between 600 m and 1.2 km from the top. They do not count until you say so.')}</p>
    <ul>
      {#each list as m (m.id)}
        <li data-maybe={m.id}>
          <button type="button" class="nm" onclick={() => onopen?.(m)} aria-haspopup="dialog">
            <b>{m.item.name}{Number.isFinite(m.item.alt) ? ` · ${m.item.alt} m` : ''}</b>
            <small>{t('{n} m from the top', { n: Math.round(m.km * 1000) })} · {dayLong(m.day)}</small>
          </button>
          <span class="a">
            <button type="button" class="btn hi" onclick={() => onyes?.(m)} aria-label={t('I was there: {name}', { name: m.item.name })} data-maybe-yes><Check size={16} aria-hidden="true" />{t('Yes, I was there')}</button>
            <button type="button" class="btn" onclick={() => onno?.(m)} aria-label={t('Not there: {name}', { name: m.item.name })} data-maybe-no><X size={16} aria-hidden="true" />{t('Not there')}</button>
          </span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .nl-maybe {
    margin: 0 0 12px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 4px;
    font-size: var(--fs-body);
    font-weight: 650;
  }
  .q {
    margin: 0 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  ul {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
  }
  .nm {
    display: grid;
    gap: 2px;
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
  }
  .nm small {
    color: var(--ink-3);
  }
  .a {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
