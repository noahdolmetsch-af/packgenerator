<script>
  /**
   * «Bilder bei jeder Neuheit» PR 3 (Noah 23.11.2026 «1b 2a 3a 4b 5a»): the card «N Neuheiten seit Freitag» at the end of Today.
   * It counts every line of the news since the last time you looked (not only the newest version), shows up to three of
   * their pictures and opens a window that groups the news by place (know/NeuSeitSheet.svelte). «Close» or closing the window
   * counts them as seen (CARD_KEY, only on this device). Under Ich › Was ist neu everything stays, as before.
   * Content first: the card sits under the content of Today, not above it.
   */
  import { NEWS_INDEX_ALL, WHATS_NEW } from '../whatsnew.js';
  import { readUpdate } from '../know/wasneuStore.js';
  import { CARD_KEY, fromOf, sinceInfo, sinceFormat, dayWord } from '../know/neuseit.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { Sparkles, X } from '@lucide/svelte';

  let { today } = $props();
  const current = WHATS_NEW[0]?.version ?? null;
  const stored = () => {
    try {
      return localStorage.getItem(CARD_KEY);
    } catch {
      return null;
    }
  };
  let card = $state(stored());
  let open = $state(false);
  const info = $derived(sinceInfo(NEWS_INDEX_ALL, fromOf(card, readUpdate())));
  const when = $derived.by(() => {
    const w = dayWord(info.since, today);
    if (w) return w === 'today' ? t('today|news') : t('yesterday|news');
    const f = sinceFormat(info.since, today);
    return f ? new Date(`${info.since}T12:00:00`).toLocaleDateString(locale(), f) : '';
  });
  const url = (p) => `${import.meta.env.BASE_URL}news/${p.id}/${p.line}-nachher.webp`;
  let broken = $state({});
  const pics = $derived(info.pics.filter((p) => !broken[`${p.id}/${p.line}`]));

  /** Counts everything up to the newest version as seen. */
  function seen() {
    card = current;
    try {
      if (current) localStorage.setItem(CARD_KEY, current);
    } catch {
      /* private window: it shows again next time */
    }
  }
  async function view() {
    open = true;
  }
  function closed() {
    open = false;
    seen();
  }
</script>

{#if info.n > 0}
  <section class="nsc" aria-labelledby="nsc-h" data-neu-seit>
    <div class="top">
      <span class="ic" aria-hidden="true"><Sparkles size={20} /></span>
      <h2 id="nsc-h">{when ? tn(info.n, '{n} news item since {when}', '{n} news items since {when}', { when }) : tn(info.n, '{n} news item|card', '{n} news items|card')}</h2>
      <button type="button" class="x" aria-label={t('Close the hint')} onclick={seen} data-neu-seit-close><X size={20} aria-hidden="true" /></button>
    </div>
    {#if pics.length}
      <button type="button" class="strip" onclick={view} aria-label={t('See the news by place')}>
        {#each pics as p (p.id + p.line)}
          <img src={url(p)} alt="" loading="lazy" decoding="async" onerror={() => (broken[`${p.id}/${p.line}`] = true)} />
        {/each}
      </button>
    {/if}
    <div class="acts">
      <button type="button" class="btn sm hi" onclick={view} data-neu-seit-open>{t('See the news by place')}</button>
    </div>
  </section>
{/if}
{#if open}
  {#await import('../know/NeuSeitSheet.svelte') then m}<m.default from={fromOf(card, readUpdate())} onclose={closed} />{/await}
{/if}

<style>
  .nsc {
    margin: var(--sp-4) 0;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--hi-soft);
    box-shadow: var(--card-shadow);
    color: var(--ink);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ic {
    flex: none;
    display: grid;
    place-items: center;
    color: var(--ink-2);
  }
  h2 {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 600;
  }
  .x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -8px -10px -8px 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .strip {
    display: flex;
    gap: 8px;
    width: 100%;
    margin: 8px 0 0;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .strip img {
    flex: 1 1 0;
    min-width: 0;
    height: 72px;
    object-fit: cover;
    object-position: top;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl, 10px);
    background: var(--paper-2);
  }
  .acts {
    margin-top: 10px;
  }
</style>
