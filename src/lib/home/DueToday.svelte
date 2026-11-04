<script>
  /**
   * «Heute fällig» (Noah 24.10.2026 «1a», use cases 255, 257, 161): one line under the greeting with what is
   * really due today; each chip opens its place. Without anything due the line is not there.
   * Paket C idea 17 (Noah 03.11.2026 «b»): the care chip carries a small bike bell that rings (wobbles) once when
   * the line appears; «Reduce motion» switches it off. No sound.
   */
  import { CalendarCheck, Cake, Flower2, BellRing } from '@lucide/svelte';
  import { dueToday } from './duetoday.js';
  import { t, tn } from '../i18n.svelte.js';

  let { todos = [], today, care = 0 } = $props();
  const ICON = { todo: CalendarCheck, birthday: Cake, plant: Flower2, care: BellRing };
  const rows = $derived(dueToday({ todos, today, care }));
  // names the user typed (to-dos, people, plants) never go through t()
  const text = (r) =>
    r.kind === 'todo' ? (r.name ?? tn(r.n, '{n} to-do due', '{n} to-dos due'))
    : r.kind === 'birthday' ? t('Birthday: {name}', { name: r.name })
    : r.kind === 'plant' ? (r.name ? t('Water {name}', { name: r.name }) : tn(r.n, 'Water {n} plant', 'Water {n} plants'))
    : tn(r.n, '{n} care point due', '{n} care points due');
</script>

{#if rows.length}
  <section class="due" aria-labelledby="due-h" data-due-today>
    <h2 id="due-h">{t('Due today')}</h2>
    <ul>
      {#each rows as r (r.key)}
        {@const I = ICON[r.kind]}
        <li><a class="chip" href={r.href} data-due={r.kind}><I size={16} aria-hidden="true" /><span>{text(r)}</span></a></li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .due {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    margin: var(--sp-2) 0;
  }
  h2 {
    font: 600 var(--fs-label) / 1.2 var(--font-body);
    color: var(--ink-2);
    margin: 0;
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    text-decoration: none;
    max-width: 100%;
  }
  .chip span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chip:hover {
    border-color: var(--line-strong);
  }
  /* idea 17: the bell wobbles once, from its top, a moment after the line appears */
  @media (prefers-reduced-motion: no-preference) {
    .chip[data-due='care'] :global(svg) {
      transform-origin: 50% 12%;
      animation: bell-ring 700ms ease-in-out 500ms 1 both;
    }
  }
  @keyframes bell-ring {
    0%,
    100% {
      transform: rotate(0);
    }
    15% {
      transform: rotate(18deg);
    }
    35% {
      transform: rotate(-16deg);
    }
    55% {
      transform: rotate(10deg);
    }
    75% {
      transform: rotate(-6deg);
    }
  }
</style>
