<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, Ü1 a, rule U4): the four steps of a trip, Plan · Pack · On the way ·
   * Debrief, on every trip page and interstitial, each a link with its short state («✓ 52/52», «ab Sa»).
   * tone 'dark': inside the trip band; 'light': on an interstitial (a coloured rule above each step:
   * done green, the current one orange). current: the step shown (aria-current), or null.
   * status: tabStatus() of tabs.js; onpick(key): before the link opens (the trip becomes the open one).
   * v0.100.0 Design-Refresh P1 (G7 «Schritte der Tour»): tone 'steps' (the trip pages, was the dark
   * band): on a computer four white steps in one card, each with its number in a circle (done: a tick),
   * the current one softly tinted; on a phone the name under a line, the current line in ink.
   */
  import { Check } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { tabHref } from '../tabs.js';
  // Noah 26.10.2026 «1b»: the bar shows the short names Plan · Pack · Live · Review · Analyse
  import { STEP_BAR } from '../stepbar.js';

  let { trip, tabs, status, current = null, tone = 'steps', onpick = () => {} } = $props();
  // 0.174: on a narrow phone the bar may scroll sideways; the current step is always in view
  let bar = $state();
  $effect(() => {
    void current;
    void status;
    const el = bar;
    const id = requestAnimationFrame(() => {
      const a = el?.querySelector('[aria-current="page"]');
      if (a && el.scrollWidth > el.clientWidth) el.scrollLeft = Math.max(0, a.offsetLeft + a.offsetWidth - el.clientWidth);
    });
    return () => cancelAnimationFrame(id);
  });
</script>

<nav bind:this={bar} class="stepbar {tone}" aria-label={t('Steps of this trip')} style:--n={tabs.length}>
  {#each tabs as key (key)}
    {@const s = status[key] ?? { text: '', done: false }}
    <a href={tabHref(key, trip)} class:done={s.done} class:past={s.past} aria-current={key === current ? 'page' : undefined} onclick={() => onpick(key)}>
      {#if tone === 'steps'}<span class="no" class:tick={s.done && key !== current} aria-hidden="true">{#if s.done && key !== current}<Check size={14} strokeWidth={2.6} />{/if}</span>{/if}<span class="tn">{t(STEP_BAR[key])}</span>
      {#if s.text || s.done}<small>{#if s.done}<Check size={13} aria-hidden="true" />{/if}{#if s.text}{s.text}{:else}<span class="sr">{t('done|step')}</span>{/if}</small>{/if}
    </a>
  {/each}
</nav>

<style>
  .stepbar {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  }
  a {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 56px;
    text-decoration: none;
    font: 500 var(--fs-body)/1.15 var(--font-body);
    overflow-wrap: break-word;
  }
  small {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    margin-top: 2px;
    font-size: var(--fs-tiny);
    font-weight: 400;
  }
  a[aria-current='page'] {
    font-weight: 600;
  }
  /* tour critique 5a: a step that is over without being finished (Packen after the tour): grey, no tick */
  a.past small {
    color: var(--ink-3);
  }

  /* steps (G7): on a phone the name under a line, the current line in ink */
  .steps {
    gap: 6px;
    counter-reset: step;
  }
  .steps a {
    counter-increment: step;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    column-gap: 4px;
    padding: 8px 0 4px;
    border-top: 3px solid var(--line);
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .steps a[aria-current='page'] {
    border-top-color: var(--ink);
    color: var(--ink);
  }
  .steps a.done {
    color: var(--ink-2);
  }
  /* on a phone the number would break «Unterwegs» (test HD12.4): the line above says where you are */
  .steps .no {
    display: none;
  }
  .steps small {
    color: var(--ink-3);
  }
  /* light: on an interstitial, a rule above each step (done green, current orange) */
  .light {
    gap: 6px;
  }
  .light a {
    justify-content: flex-start;
    padding: 8px 0 4px;
    border-top: 4px solid var(--line);
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .light a.done {
    border-top-color: var(--ok);
    color: var(--ink);
  }
  .light a[aria-current='page'] {
    border-top-color: var(--hi);
    color: var(--ink);
  }
  .light small {
    color: var(--ink-3);
  }
  /* 0.174 «Eine Tour, eine Seite»: five steps on a phone; each step at least as wide as its name (no word
     breaks inside «Unterwegs» or «Auswertung»), the rest shared; on a very narrow phone the bar scrolls sideways */
  @media (max-width: 719px) {
    .light,
    .steps {
      grid-template-columns: none;
      grid-auto-flow: column;
      grid-auto-columns: minmax(max-content, 1fr);
      overflow-x: auto;
      scrollbar-width: none;
    }
    .light a,
    .steps a {
      min-width: 48px;
      overflow-wrap: normal;
    }
  }
  /* a 320 px phone: «Unterwegs» must not break inside the word (test HD12.4) */
  @media (max-width: 360px) {
    a {
      font-size: var(--fs-label);
    }
    .light,
    .steps {
      gap: 3px;
    }
    .light a,
    .steps a {
      font-size: var(--fs-tiny);
    }
  }
  /* a computer: one white card, four steps with a number in a circle, the current one tinted */
  @media (min-width: 720px) {
    .steps {
      gap: 0;
      overflow: hidden;
      border-radius: var(--radius-card);
      background: var(--paper);
      box-shadow: var(--card-shadow);
    }
    .steps a {
      grid-template-columns: 28px minmax(0, 1fr);
      align-items: center;
      column-gap: 12px;
      min-height: 64px;
      padding: 10px 16px;
      border-top: 0;
      border-left: 1px solid var(--line);
      font-size: var(--fs-body);
    }
    .steps a:first-child {
      border-left: 0;
    }
    .steps a:hover {
      background: var(--paper-2);
    }
    .steps a[aria-current='page'] {
      background: var(--hi-soft);
    }
    .steps .no {
      grid-row: span 2;
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--paper-2);
      color: var(--ink-2);
      font-size: var(--fs-small);
      font-weight: 600;
    }
    /* the number comes from the order (a counter), so the link's text stays the step's name */
    .steps .no:not(.tick)::before {
      content: counter(step);
    }
    .steps a.done .no {
      background: var(--ok-soft);
      color: var(--ok);
    }
    .steps a[aria-current='page'] .no {
      background: var(--hi);
      color: var(--hi-ink);
    }
    .steps small {
      grid-column: 2;
      margin: 0;
    }
  }
  /* a phone turned sideways: the steps in one low row */
  @media (max-height: 500px) {
    .steps a {
      min-height: 44px;
      padding: 2px 8px;
    }
  }
</style>
