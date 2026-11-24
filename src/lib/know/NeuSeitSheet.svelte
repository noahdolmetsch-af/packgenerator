<script>
  /**
   * «Bilder bei jeder Neuheit» PR 3 (Noah 23.11.2026 «1b 2a 3a 4b 5a»): the window of the card «N Neuheiten seit …»: the news since
   * `from` grouped by place (neuseitOrte.js), a group opens to one picture (with the slider before/after) and the line, each with
   * «Try it». The whole list stays under Ich › Was ist neu (the link at the end). It loads on the tap (home/NeuSeitCard.svelte),
   * so Today stays light.
   */
  import { backClose } from '../ui/backclose.js';
  import { t, locale } from '../i18n.svelte.js';
  import { X, ChevronRight } from '@lucide/svelte';
  import NewsBild from './NewsBild.svelte';
  import { goNews } from './newsRun.js';
  import { goOf } from './newsgo.js';
  import { NEWS_HREF } from './wasneu.js';
  import { groupByPlace } from './neuseitOrte.js';
  import { localDay } from '../localday.js';
  import { dayWord } from './neuseit.js';
  import '../ui/daumen.css';

  let { from = null, onclose } = $props();
  let dialog;
  let groups = $state(null); // null while the whole list loads
  const day = (iso) => {
    const w = dayWord(iso, localDay());
    return w ? (w === 'today' ? t('today|news') : t('yesterday|news')) : new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  };

  $effect(() => {
    dialog.showModal();
    import('../whatsnew-all.js').then((m) => (groups = groupByPlace(m.WHATS_NEW, from)));
  });
  function go(p, ev) {
    dialog.close();
    goNews(p, ev);
  }
</script>

<dialog class="sheet from-below nss" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="nss-h" data-neu-seit-sheet>
  <div class="head">
    <h2 id="nss-h">{t('News by place')}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if !groups}
    <p class="muted">{t('Loading…')}</p>
  {:else}
    {#each groups as g, i (g.key)}
      <details class="grp" data-group={g.key} open={i === 0}>
        <summary><b>{t(g.label)}</b><span class="cnt">{g.items.length}</span></summary>
        <ul>
          {#each g.items as it (it.id + '/' + it.line + it.version)}
            <li>
              {#if it.bild}<NewsBild id={it.id} line={it.line} vorher={it.bild.vorher} text={it.p.text} />{:else}<p class="tx">{t(it.p.text)}</p>{/if}
              <p class="meta">{day(it.date)}
                {#if goOf(it.p)}<a class="try" href={NEWS_HREF} onclick={(ev) => go(it.p, ev)}>{t('Try it')}<ChevronRight size={14} aria-hidden="true" /></a>{/if}
              </p>
            </li>
          {/each}
        </ul>
      </details>
    {/each}
    <p class="all"><a href={NEWS_HREF} onclick={() => dialog.close()}>{t('Everything under Me › What is new')}</a></p>
  {/if}
</dialog>

<style>
  .nss {
    width: min(480px, calc(100vw - 24px));
    max-height: 86dvh;
    overflow-y: auto;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .grp {
    border-bottom: 1px solid var(--line);
  }
  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 48px;
    cursor: pointer;
  }
  .cnt {
    min-width: 28px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: center;
  }
  ul {
    margin: 0;
    padding: 0 0 8px;
    list-style: none;
  }
  li {
    margin: 0 0 10px;
  }
  .tx {
    margin: 0;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .try {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-left: auto;
    color: var(--ink);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .all {
    margin: 12px 0 0;
    font-size: var(--fs-small);
  }
</style>
