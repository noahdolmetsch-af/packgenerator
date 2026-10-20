<script>
  /**
   * «Einstieg» on top of a page (plan notes/bereich-einstieg, Noah 15.10.2026 «1a 2a 3a 4a»; first used by
   * GPX-Weg «Dein Tempo», Noah 15.10.2026 «1-5 a»): the same parts everywhere. A kicker («So funktioniert
   * …»), one title line and one sentence what the page is for, exactly the steps it gives (3), one tip,
   * one «Gut zu wissen» sentence with its source, and the links (Handbuch, Einklappen).
   *
   * Open on the first visit, then the quiet line «ⓘ So geht's ›» that opens with a tap (Gesamttest
   * 20.10.2026 «2a», phone and computer; before: phone 3 visits, computer always). Folded is remembered per page on this device; nothing is ever mandatory.
   * All texts arrive translated (t() at the caller).
   */
  import { onMount } from 'svelte';
  import { t } from '../i18n.svelte.js';
  import { ChevronRight, ChevronUp, Lightbulb, BookOpen, Info } from '@lucide/svelte';

  let { key, kicker, title, sub = '', steps = [], tip = '', know = '', links = [] } = $props();

  const store = () => `intro.${key}`;
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(store()) ?? 'null') ?? { visits: 0, folded: null };
    } catch {
      return { visits: 0, folded: null };
    }
  };
  let seen = $state(read());
  // the visits before this opening (onMount counts this one)
  // svelte-ignore state_referenced_locally
  const before = seen.visits ?? 0;
  onMount(() => {
    seen = { ...seen, visits: (seen.visits ?? 0) + 1 };
    save();
  });
  function save() {
    try {
      localStorage.setItem(store(), JSON.stringify(seen));
    } catch {
      /* private mode: open for this visit */
    }
  }
  // your own choice wins; without one: open on the first visit only (2a)
  const open = $derived(seen.folded != null ? !seen.folded : before < 1);
  const toggle = () => {
    seen = { ...seen, folded: open };
    save();
  };
  const id = $derived(`intro-${key}`);
</script>

<section class="intro" class:shut={!open} aria-labelledby={`${id}-h`} data-intro={key}>
  {#if open}
    <p class="k">{kicker}</p>
    <h2 id={`${id}-h`} class="ttl">{title}</h2>
    {#if sub}<p class="sub">{sub}</p>{/if}
    <ol class="steps">
      {#each steps as s, i (i)}<li><span class="n" aria-hidden="true">{i + 1}</span><span><b>{s.name}</b> · {s.text}</span></li>{/each}
    </ol>
    {#if tip}<p class="tip"><Lightbulb size={16} aria-hidden="true" /><span><b>{t('Tip')}:</b> {tip}</span></p>{/if}
    {#if know}<p class="know"><span><b>{t('Good to know')}:</b> {know}</span></p>{/if}
    <p class="links">
      {#each links as l (l.href)}<a href={l.href}><BookOpen size={16} aria-hidden="true" />{l.label}</a>{/each}
      <button type="button" class="fold" onclick={toggle} aria-expanded="true"><ChevronUp size={16} aria-hidden="true" />{t('Fold up')}</button>
    </p>
  {:else}
    <button type="button" class="line" onclick={toggle} aria-expanded="false" id={`${id}-h`}>
      <Info size={18} aria-hidden="true" /><span>{t('How it works|help')}</span><ChevronRight size={16} aria-hidden="true" />
    </button>
  {/if}
</section>

<style>
  .intro {
    display: grid;
    gap: 8px;
    margin: 0 0 16px;
    padding: 16px 18px;
    /* Gesamttest 20.10 Design 2: one look for help */
    border: 1px solid var(--help-line);
    border-radius: var(--help-r);
    background: var(--help-bg);
    color: var(--ink);
  }
  .intro.shut {
    padding: 0;
  }
  .k {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .ttl {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    text-wrap: balance;
  }
  .sub {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .steps {
    display: grid;
    gap: 8px;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }
  .steps li {
    display: grid;
    grid-template-columns: 26px 1fr;
    gap: 8px;
    align-items: start;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .steps b,
  .tip b,
  .know b {
    color: var(--ink);
  }
  .n {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--paper);
    font-size: var(--fs-tiny);
    font-weight: 600;
    color: var(--ink);
  }
  .tip,
  .know {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl, 10px);
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .tip :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--help-icon);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
  }
  .links a,
  .fold {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 8px 14px;
    border: 0;
    border-radius: inherit;
    background: none;
    color: var(--ink-2);
    font: 400 var(--fs-small) / 1.4 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .line span {
    flex: 1;
  }
  .line :global(svg) {
    flex: none;
  }
  .line > :global(svg:first-child) {
    color: var(--help-icon);
  }
</style>
