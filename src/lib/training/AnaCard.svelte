<script>
  /**
   * TR5b–TR7g: one analysis card: the heading, a quiet line and «…» with Ausblenden (Rückgängig in the
   * toast), Nach oben, Nach unten and Analysen anpassen. The page puts the cards in their order
   * (analyses.js keysOf). groups: which groups «Analysen anpassen» shows from here.
   */
  import { EyeOff, ChevronUp, ChevronDown, ListChecks } from '@lucide/svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import { ana, hideAna, moveAna, openAnaSheet } from './analyses.svelte.js';
  import { anaOf, groupOf, keysOf } from './analyses.js';
  import { t } from '../i18n.svelte.js';

  let { key, sub = '', groups = null, wide = false, children } = $props();
  const a = $derived(anaOf(key));
  const title = $derived(t(a?.title ?? key));
  const shown = $derived(keysOf(ana, groupOf(key)));
  const actions = $derived([
    { name: t('Hide|ana'), icon: EyeOff, run: () => hideAna(key) },
    ...(shown.indexOf(key) > 0 ? [{ name: t('Move up|ana'), icon: ChevronUp, run: () => moveAna(key, -1) }] : []),
    ...(shown.indexOf(key) < shown.length - 1 ? [{ name: t('Move down|ana'), icon: ChevronDown, run: () => moveAna(key, 1) }] : []),
    { name: t('Adjust analyses'), icon: ListChecks, run: () => openAnaSheet(groups ?? [groupOf(key)]) },
  ]);
</script>

<section class="card ana" class:wide data-ana={key} aria-labelledby="ana-{key}">
  <div class="ah">
    <h3 id="ana-{key}">{title}</h3>
    {#if sub}<p class="as">{sub}</p>{/if}
    <MoreActions {title} label={t('More for {title}', { title })} {actions} small />
  </div>
  {@render children()}
</section>

<style>
  .ana {
    min-width: 0;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ah {
    display: flex;
    align-items: flex-start;
    gap: 6px 12px;
    flex-wrap: wrap;
  }
  h3 {
    flex: 1 1 auto;
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .as {
    margin: 3px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
    flex: 0 1 auto;
  }
  .ah :global(.ma) {
    margin: -6px -8px 0 0;
  }
  .ana :global(.cap) {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
