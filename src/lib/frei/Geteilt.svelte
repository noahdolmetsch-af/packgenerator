<script>
  /**
   * «Meine Sammlungen» shared as a page (Noah 05.11.2026 «Touren 2a und b»): #/share/sammlung/<code>.
   * Read only: the collection (name and entries as text) travels in the address itself, nothing is
   * read from or written to this device's data. Photos and positions never go into the link.
   */
  import { Printer } from '@lucide/svelte';
  import { decodeShare } from '../share.js';
  import { isCollShare } from '../frei.js';
  import { t, tn } from '../i18n.svelte.js';

  let { code = '' } = $props();
  let coll = $state(undefined);
  $effect(() => {
    decodeShare(code, isCollShare).then((x) => (coll = x));
  });
</script>

<div class="gs" data-shared-coll>
  {#if coll === undefined}
    <p class="gs-muted">{t('Opening the collection…')}</p>
  {:else if !coll}
    <h1 class="gs-h1">{t('Link broken')}</h1>
    <p>{t('This collection could not be read. Ask for the link again.')}</p>
  {:else}
    <p class="gs-lbl">{t('Shared collection')}</p>
    <h1 class="gs-h1" data-page-title>{coll.n}</h1>
    <p class="gs-muted">{tn(coll.e.length, '{n} entry', '{n} entries')}</p>
    <p class="gs-acts no-print">
      <button type="button" class="btn" onclick={() => window.print()} data-print><Printer size={16} aria-hidden="true" />{t('Print or save as PDF')}</button>
      <a class="gs-link" href="#/">{t('Open Pack Generator')}</a>
    </p>
    {#each coll.e as e, n (n)}
      <article class="gs-card" data-shared-entry>
        <h2 class="gs-h2">{e.t}</h2>
        {#each e.f ?? [] as [label, value], k (k)}
          <p class="gs-field"><b>{label}</b><span>{value}</span></p>
        {/each}
      </article>
    {/each}
  {/if}
</div>

<style>
  .gs {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 640px;
    margin: 0 auto;
    padding: 16px var(--gut, 16px) 40px;
  }
  .gs-h1 {
    margin: 0;
    font-size: var(--fs-page);
  }
  .gs-h2 {
    margin: 0 0 4px;
    font-size: var(--fs-sub);
  }
  .gs-lbl,
  .gs-muted {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .gs-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin: 0;
  }
  .gs-link {
    color: var(--ink);
  }
  .gs-card {
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    break-inside: avoid;
  }
  .gs-field {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin: 6px 0 0;
    white-space: pre-line;
  }
  .gs-field b {
    font-size: var(--fs-label);
    color: var(--ink-3);
    font-weight: 600;
  }
  @media print {
    .no-print {
      display: none !important;
    }
  }
</style>
