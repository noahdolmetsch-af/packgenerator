<script>
  /**
   * «Route prüfen» (Touren-Ideen 41): the hints of route/check.js before a GPX becomes the trip's route.
   * «Use anyway» stores it as it is, «Cancel» keeps the old route. Shown only when there is a hint.
   */
  import { TriangleAlert } from '@lucide/svelte';
  import { checkLines } from './check.js';
  import { t, num } from '../i18n.svelte.js';

  let { check, name = '', onuse, oncancel } = $props();
  const lines = $derived(checkLines(check, t, num));
</script>

<div class="rck" role="group" aria-labelledby="rck-h" data-route-check>
  <p class="h" id="rck-h"><TriangleAlert size={18} aria-hidden="true" /><b>{name ? t('Check «{name}» before you use it', { name }) : t('Check the route before you use it')}</b></p>
  <ul>
    {#each lines as l (l.key)}<li data-route-check-line={l.key}>{l.text}</li>{/each}
  </ul>
  <p class="tp-small tp-muted">{t('Nothing is changed. Fix it in your route planner, or use the route as it is.')}</p>
  <div class="acts">
    <button type="button" class="btn sm" onclick={onuse} data-route-check-use>{t('Use anyway')}</button>
    <button type="button" class="btn sm" onclick={oncancel}>{t('Cancel')}</button>
  </div>
</div>

<style>
  .rck {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-left: 3px solid var(--warn, var(--accent));
    border-radius: var(--radius, 10px);
    background: var(--surface, transparent);
  }
  .h {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
  .h :global(svg) {
    flex: none;
    color: var(--warn, var(--accent));
  }
  ul {
    margin: 0;
    padding-left: 20px;
    font-size: var(--fs-small);
  }
  li + li {
    margin-top: 2px;
  }
  p.tp-small {
    margin: 0;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
