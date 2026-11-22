<script>
  /**
   * «Meilensteine motivierender» PR 3 (Noah 21.11.2026 «1-5 a», Idee 2): «Pro Aktivität · dein Weg»: per sport its next
   * star as a path of stars: the reached ones gold, the next one fills with the progress, the rest empty. A row is a link
   * to the sport's milestones. rows: [{ key, title, sub, href, r }] (r: the evaluated milestone).
   */
  import { ChevronRight } from '@lucide/svelte';
  import { t } from '../../i18n.svelte.js';

  let { rows = [], label = '' } = $props();
  /** One star of the path: 'full' (reached), 'part' (the next, with its progress), 'empty'. */
  const stateOf = (r, i) => (r.done || r.reached.some((s) => s.star === i + 1) ? 'full' : r.next === i + 1 ? 'part' : 'empty');
</script>

<ul class="path card" aria-label={label || undefined}>
  {#each rows as x (x.key)}
    {@const r = x.r}
    <li data-row={x.key} data-path={x.key}>
      <a href={x.href}>
        <span class="tx"><b>{x.title}</b><small>{x.sub}</small></span>
        <span class="pc num">{r.next ? `${Math.round(r.progress * 100)} %` : ''}</span>
        <ChevronRight class="cv" size={18} aria-hidden="true" />
        <span class="stars" role="img" aria-label={r.done ? t('All stars reached') : t('{n} of {m} stars reached, {p} percent to the next', { n: r.reached.length, m: r.steps.length, p: Math.round(r.progress * 100) })}>
          {#each r.steps as _, i (i)}
            {@const st = stateOf(r, i)}
            <svg viewBox="0 0 24 24" class={st} aria-hidden="true">
              {#if st === 'part'}
                <defs><clipPath id="cp-{x.key}"><rect x="0" y="0" width={24 * r.progress} height="24" /></clipPath></defs>
                <polygon class="out" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                <polygon class="fill" clip-path="url(#cp-{x.key})" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              {:else}
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              {/if}
            </svg>
          {/each}
        </span>
      </a>
    </li>
  {/each}
</ul>

<style>
  .path {
    margin: 0;
    padding: 0 var(--sp-4);
    list-style: none;
  }
  li + li {
    border-top: 1px solid var(--line);
  }
  a {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: var(--sp-1) var(--sp-3);
    align-items: center;
    min-height: 56px;
    padding: var(--sp-2) 0;
    color: var(--ink);
    text-decoration: none;
  }
  .tx {
    min-width: 0;
    line-height: 1.3;
  }
  .tx b {
    display: block;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .tx small {
    color: var(--warn);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .pc {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  a :global(.cv) {
    color: var(--ink-3);
  }
  .stars {
    grid-column: 1 / -1;
    display: flex;
    gap: 3px;
  }
  svg {
    width: 26px;
    height: 26px;
    flex: none;
    stroke-width: 1.6;
    stroke-linejoin: round;
  }
  svg polygon {
    fill: var(--paper);
    stroke: var(--line-strong);
    stroke-dasharray: 2.5 2;
  }
  svg.full polygon {
    fill: var(--l2);
    stroke: var(--l2);
    stroke-dasharray: none;
  }
  svg.part polygon.out {
    stroke: var(--l2);
    stroke-dasharray: none;
  }
  svg.part polygon.fill {
    fill: var(--l2);
    stroke: none;
  }
</style>
