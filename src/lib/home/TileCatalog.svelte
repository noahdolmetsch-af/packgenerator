<script>
  /**
   * v0.94.0 «Kachel-Wand» (mockup C, Noah 3a): «Add a tile»: every tile of the app by area, with a
   * search. A tap puts it at the end of the wall; ✓ says it is there already (a tap takes it away again).
   * From below on a phone, a centred dialog on a computer.
   * on: Set of the ids on the wall; ontoggle(id); onclose.
   */
  import { X, Check, Plus, Search } from '@lucide/svelte';
  import { AREAS, catalog } from './tiles.js';
  import { ICON } from './SmallTile.svelte';
  import { backClose } from '../ui/backclose.js';
  import { phone } from '../media.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { on = new Set(), ontoggle, onclose } = $props();
  let dlg = $state();
  let query = $state('');
  let area = $state('all');
  $effect(() => {
    if (dlg && !dlg.open) dlg.showModal();
  });
  const groups = $derived(catalog(query, t).filter((g) => area === 'all' || g.key === area));
</script>

<dialog class="sheet cat" class:phone={phone.matches} bind:this={dlg} use:backClose onclose={() => onclose?.()} onclick={(e) => e.target === dlg && dlg.close()} aria-labelledby="cat-h">
  <div class="sh">
    <h2 id="cat-h" class="title">{t('Add a tile')}</h2>
    <button type="button" class="btn sm ic" onclick={() => dlg.close()} aria-label={t('Close')}><X size={18} aria-hidden="true" /></button>
  </div>
  <p class="lead">{t('Every tile can go on your start page, as often as you like to change it.')}</p>
  <label class="srch"><Search size={18} aria-hidden="true" /><input class="inp" type="search" bind:value={query} placeholder={t('Search tiles')} aria-label={t('Search tiles')} /></label>
  <div class="chips" role="group" aria-label={t('Areas')}>
    <button type="button" class="chip" aria-pressed={area === 'all'} onclick={() => (area = 'all')}>{t('All|tiles')}</button>
    {#each AREAS as a (a.key)}<button type="button" class="chip" aria-pressed={area === a.key} onclick={() => (area = a.key)}>{t(a.name)}</button>{/each}
  </div>
  {#each groups as g (g.key)}
    <h3 class="cg">{t(g.name)}</h3>
    <ul class="cl">
      {#each g.tiles as x (x.id)}
        {@const Icon = ICON[x.icon] ?? Plus}
        {@const there = on.has(x.id)}
        <li>
          <button type="button" class="ci" class:there data-add={x.id} aria-pressed={there} onclick={() => ontoggle?.(x.id)}>
            <span class="cic"><Icon size={18} aria-hidden="true" /></span>
            <span class="cm"><b>{t(x.label)}</b><small>{t(x.pitch)}</small></span>
            <span class="cs">{#if there}<Check size={18} aria-hidden="true" /><span class="sr">{t('On the start page')}</span>{:else}<Plus size={18} aria-hidden="true" /><span class="sr">{t('Add')}</span>{/if}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="muted">{t('No tile with this word.')}</p>
  {/each}
</dialog>

<style>
  .cat {
    width: min(960px, calc(100vw - 24px));
  }
  .cat.phone {
    margin: auto 0 0;
    width: 100vw;
    max-width: 100vw;
    max-height: 90vh;
    border-radius: 16px 16px 0 0;
    padding: 14px var(--gut) calc(16px + env(safe-area-inset-bottom));
  }
  .sh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .sh h2 {
    font-size: var(--fs-sub);
  }
  .ic {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
  }
  .lead,
  .muted {
    margin: 4px 0 10px;
    color: var(--ink-2);
  }
  .srch {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-3);
  }
  .srch input {
    flex: 1;
    min-width: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0 4px;
  }
  .chip {
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .cg {
    margin: 14px 0 6px;
    color: var(--ink-3);
    font: 600 var(--fs-small)/1.3 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .cl {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  @media (min-width: 720px) {
    .cl {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .ci {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 56px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .ci:hover {
    background: var(--paper-2);
  }
  .ci.there {
    border-color: var(--accent);
  }
  .cic {
    display: grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .cm {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .cm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.3;
  }
  .cs {
    flex: none;
    color: var(--accent);
  }
</style>
