<script>
  /**
   * «Pfad» (Pfad-Baustein, Tour von A bis Z, Schritt 1): a path of phases with rows. Each row is a link to a page that
   * exists, with its state (✓ done, ◐ begun, ○ open, ! a note, a clock for «later») and one quiet line. The current phase
   * is open, the others fold. One main button leads to the first open row of the current phase. The tour uses it first;
   * the other paths of the app (bike year, material, day, week) use the same block with their own rows.
   *
   * phases: [{ key, title, count, state: 'done'|'past'|'now'|'next', rows: [{ key, title, line, href, state, hint }] }]
   * next: { href, label } | null, the one main button.
   */
  import { Check, Circle, CircleDot, TriangleAlert, Clock3, ChevronRight, ChevronDown } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { phases = [], next = null } = $props();
  // the phases the user opened or closed by hand; the others follow their state
  let hand = $state({});
  const isOpen = (p) => hand[p.key] ?? p.state === 'now';
  const icon = { done: Check, part: CircleDot, open: Circle, warn: TriangleAlert, later: Clock3 };
</script>

<div class="pfad" data-pfad>
  {#each phases as p, n (p.key)}
    <section class="ph {p.state}" data-pfad-phase={p.key} data-state={p.state}>
      <button type="button" class="ph-head" aria-expanded={isOpen(p)} onclick={() => (hand = { ...hand, [p.key]: !isOpen(p) })}>
        <span class="no" aria-hidden="true">{#if p.state === 'done'}<Check size={14} strokeWidth={2.6} />{:else}{n + 1}{/if}</span>
        <span class="pt">{p.title}</span>
        {#if p.count}<small>{p.count}</small>{/if}
        <ChevronDown class="chev" size={18} aria-hidden="true" />
      </button>
      {#if isOpen(p)}
        <ul class="rows">
          {#each p.rows as r (r.key)}
            {@const Ic = icon[r.state] ?? Circle}
            <li class="row {r.state}" class:hint={r.hint} data-pfad-row={r.key} data-state={r.state}>
              <a href={r.href}>
                <span class="ic" aria-hidden="true"><Ic size={r.hint ? 16 : 18} strokeWidth={2.2} /></span>
                <span class="tx"><b>{r.title}</b>{#if r.line}<small>{r.line}</small>{/if}</span>
                <ChevronRight size={16} aria-hidden="true" />
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/each}
  {#if next}
    <p class="go"><a class="btn hi" href={next.href} data-pfad-next>{next.label}</a></p>
  {/if}
</div>

<style>
  .pfad {
    display: grid;
    gap: var(--sp-3);
  }
  .ph {
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
    overflow: hidden;
  }
  .ph.now {
    border-color: var(--ink);
  }
  .ph-head {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 52px;
    padding: var(--sp-3) var(--sp-4);
    border: 0;
    background: none;
    color: var(--ink);
    font: 600 var(--fs-body)/1.2 var(--font-body);
    text-align: left;
  }
  .no {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1.5px solid var(--ink-3);
    font-size: var(--fs-small);
  }
  .ph.done .no {
    background: var(--ok);
    border-color: var(--ok);
    color: var(--paper);
  }
  .ph.now .no {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .pt {
    flex: 1;
    min-width: 0;
  }
  .ph-head small {
    color: var(--ink-3);
    font-weight: 400;
  }
  .ph-head :global(.chev) {
    transition: transform 0.15s;
  }
  .ph-head[aria-expanded='true'] :global(.chev) {
    transform: rotate(180deg);
  }
  .rows {
    margin: 0;
    padding: 0 0 var(--sp-2);
    list-style: none;
  }
  .row a {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 48px;
    padding: var(--sp-2) var(--sp-4);
    color: var(--ink);
    text-decoration: none;
  }
  .row a:hover {
    background: var(--paper-2);
  }
  .ic {
    display: inline-flex;
    flex: none;
    color: var(--ink-3);
  }
  .row.done .ic {
    color: var(--ok);
  }
  .row.warn .ic {
    color: var(--warn);
  }
  .tx {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .tx b {
    font-weight: 500;
  }
  .tx small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .row.hint .tx b {
    font-weight: 400;
    font-size: var(--fs-small);
  }
  .row.later {
    opacity: 0.7;
  }
  .go {
    margin: var(--sp-2) 0 0;
  }
  .go .btn {
    width: 100%;
    justify-content: center;
  }
  @media (min-width: 900px) {
    .go .btn {
      width: auto;
    }
  }
</style>
