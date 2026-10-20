<script>
  /**
   * Paket Q #340: one thing of your own on an empty place (spark.js): a learning from an earlier trip
   * or one of your inspiration links. Nothing when you have none yet.
   */
  import { liveQuery } from 'dexie';
  import { Sparkles } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { INSPO_KEY } from '../inspiration.js';
  import { sparkOf } from './spark.js';

  let { place = '' } = $props();
  const q = liveQuery(async () => {
    const [learnings, links] = await Promise.all([db.learnings.toArray(), db.settings.get(INSPO_KEY)]);
    return { learnings, links: Array.isArray(links?.value) ? links.value : [] };
  });
  const s = $derived($q ? sparkOf($q, localDay(), place) : null);
</script>

{#if s}
  <p class="spark" data-spark={s.kind}>
    <Sparkles size={16} aria-hidden="true" />
    {#if s.kind === 'learning'}
      <span>{t('From your trips:')} «{s.text}»{#if s.from}{' '}<small>({s.from})</small>{/if}</span>
    {:else}
      <span>{t('From your inspiration:')} <a href={s.href} target="_blank" rel="noopener">{s.text}</a></span>
    {/if}
  </p>
{/if}

<style>
  .spark {
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin: var(--sp-2) 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: left;
  }
  .spark :global(svg) {
    flex: none;
    align-self: center;
  }
</style>
