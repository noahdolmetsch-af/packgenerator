<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, Ü1 a, rule U4): the four steps of a trip, Plan · Pack · On the way ·
   * Debrief, on every trip page and interstitial, each a link with its short state («✓ 52/52», «ab Sa»).
   * tone 'dark': inside the trip band; 'light': on an interstitial (a coloured rule above each step:
   * done green, the current one orange). current: the step shown (aria-current), or null.
   * status: tabStatus() of tabs.js; onpick(key): before the link opens (the trip becomes the open one).
   */
  import { Check } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { TAB_NAMES, tabHref } from '../tabs.js';

  let { trip, tabs, status, current = null, tone = 'dark', onpick = () => {} } = $props();
</script>

<nav class="stepbar {tone}" aria-label={t('Steps of this trip')} style:--n={tabs.length}>
  {#each tabs as key (key)}
    {@const s = status[key] ?? { text: '', done: false }}
    <a href={tabHref(key, trip)} class:done={s.done} aria-current={key === current ? 'page' : undefined} onclick={() => onpick(key)}>
      <span class="tn">{t(TAB_NAMES[key])}</span>
      {#if s.text || s.done}<small>{#if s.done}<Check size={13} aria-hidden="true" />{/if}{#if s.text}{s.text}{:else}<span class="sr">{t('done|step')}</span>{/if}</small>{/if}
    </a>
  {/each}
</nav>

<style>
  .stepbar {
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

  /* dark: inside the trip band, the current step underlined in orange */
  .dark {
    border-top: 1px solid color-mix(in srgb, var(--brand-ink) 12%, transparent);
  }
  .dark a {
    align-items: center;
    justify-content: center;
    padding: 6px 2px 8px;
    color: var(--brand-ink-2);
    text-align: center;
  }
  .dark a[aria-current='page'] {
    color: var(--brand-ink);
  }
  .dark a[aria-current='page']::after {
    content: '';
    position: absolute;
    left: 14%;
    right: 14%;
    bottom: 0;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: var(--hi-bright);
  }
  .dark small {
    color: var(--brand-ink-2);
  }
  .dark a:focus-visible {
    outline-color: var(--focus-on-dark);
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
  /* a 320 px phone: «Unterwegs» must not break inside the word (test HD12.4) */
  @media (max-width: 360px) {
    a {
      font-size: var(--fs-label);
    }
    .light {
      gap: 3px;
    }
    .light a {
      font-size: var(--fs-tiny);
    }
  }
  @media (min-width: 720px) {
    .dark {
      padding: 0 10px;
      grid-template-columns: repeat(var(--n), minmax(0, 200px));
    }
    .dark a {
      flex-direction: row;
      gap: 8px;
      min-height: 52px;
    }
    .dark small {
      margin: 0;
    }
  }
  @media (max-height: 500px) {
    .dark {
      padding: 0 4px;
      grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    }
    .dark a {
      min-height: 44px;
      padding: 2px 4px;
    }
  }
</style>
