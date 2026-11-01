<script>
  /**
   * «Heute als Begleiter» PR 12 (Noah 28.10.2026 «1a 2a 3a», answer «a» on 29.10.2026): the gestures, keys, search
   * commands and «⋯» actions in one folded list at the end of «Help and functions». The search field of the
   * page narrows it and opens it when it finds something.
   */
  import { ChevronRight, ChevronDown, Hand } from '@lucide/svelte';
  import { t, tn } from '../i18n.svelte.js';
  import { TRICKS, findTricks } from './gesten.js';

  let { q = '' } = $props();
  let open = $state(false);
  const hits = $derived(findTricks(q, t));
  const groups = $derived(TRICKS.map((g) => ({ ...g, rows: hits ? g.items.filter((x) => hits.has(x.id)) : g.items })).filter((g) => g.rows.length));
  const total = TRICKS.reduce((n, g) => n + g.items.length, 0);
  const shown = $derived(open || !!hits);
</script>

{#if !hits || groups.length}
  <section class="tricks" data-tricks-block aria-labelledby="tricks-h">
    <button type="button" class="thead" aria-expanded={shown} aria-controls="tricks-body" onclick={() => (open = !open)} disabled={!!hits}>
      <span class="tic" aria-hidden="true"><Hand size={18} /></span>
      <span class="tm"><b id="tricks-h">{t('Gestures and tricks')}</b><small>{t('Gestures, keys, search commands and «⋯» actions, each in one line.')} · {total}</small></span>
      {#if shown}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}
    </button>
    {#if shown}
      <div id="tricks-body" class="tbody">
        {#each groups as g (g.key)}
          <h3 data-tricks-group={g.key}>{t(g.label)} <span class="tn num">{tn(g.rows.length, '{n} entry', '{n} entries')}</span></h3>
          <ul>
            {#each g.rows as x (x.id)}
              <li data-trick={x.id}>
                <span class="tt">{t(x.title)}</span>
                <span class="ts">{t(x.text)}</span>
                {#if x.go}<a class="tgo" href={x.go}>{t('Take me there')}<ChevronRight size={14} aria-hidden="true" /></a>{/if}
              </li>
            {/each}
          </ul>
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
  .tricks {
    background: var(--paper);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    overflow: hidden;
  }
  .thead {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 44px;
    padding: var(--sp-3) var(--sp-4);
    background: none;
    border: 0;
    text-align: left;
    color: inherit;
    cursor: pointer;
  }
  .thead:disabled {
    cursor: default;
  }
  .tm {
    flex: 1;
    display: grid;
    gap: 2px;
  }
  .tm b {
    font-size: var(--fs-sub);
  }
  .tm small {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .tbody {
    padding: 0 var(--sp-4) var(--sp-4);
  }
  h3 {
    font-size: var(--fs-label);
    margin: var(--sp-4) 0 var(--sp-2);
  }
  .tn {
    font-weight: normal;
    color: var(--ink-2);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: grid;
    gap: 2px;
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .tt {
    font-size: var(--fs-body);
    font-weight: 600;
  }
  .ts {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .tgo {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    font-size: var(--fs-small);
    color: var(--accent);
  }
</style>
