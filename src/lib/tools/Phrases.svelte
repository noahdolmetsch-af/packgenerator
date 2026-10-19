<script>
  /**
   * Paket L «Werkzeugkasten» (#317 Wichtige Sätze offline, Noah 19.10.2026: fixed list, 0 Kosten): the
   * sentence in your language and in the chosen language, big enough to show someone. «Read out» uses the
   * voice of the device (offline where the device has the voice). The last language is remembered.
   */
  import { Volume2 } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { PHRASE_LANGS, PHRASE_GROUPS, findPhrases } from './phrases.js';
  import { loadTool, saveTool } from './toolstore.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let to = $state('fr');
  let group = $state('');
  let q = $state('');
  loadTool('phrases', null).then((v) => v && PHRASE_LANGS.some((l) => l.key === v) && (to = v));
  const lang = $derived(PHRASE_LANGS.find((l) => l.key === to) ?? PHRASE_LANGS[0]);
  const rows = $derived(findPhrases(q, t, group));
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  function speak(text) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang.speak;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  function setTo(k) {
    to = k;
    saveTool('phrases', k).catch(() => {});
  }
</script>

<section class="tool-card phrases">
  <Seg label={t('Language')} value={to} options={PHRASE_LANGS.map((l) => ({ key: l.key, name: l.name }))} onchange={setTo} />
  <Seg chips small label={t('Group')} value={group} options={[{ key: '', name: t('All') }, ...PHRASE_GROUPS.map((g) => ({ key: g.key, name: t(g.label) }))]} onchange={(k) => (group = k)} />
  <label class="tool-field">
    <span>{t('Search')}</span>
    <input class="tool-input" type="search" bind:value={q} autocomplete="off" />
  </label>
  <ul class="tool-list">
    {#each rows as p (p.en)}
      <li>
        <span class="ph-m"><small class="tool-muted">{t(p.en)}</small><b lang={lang.key}>{p[lang.key]}</b></span>
        {#if canSpeak}<button type="button" class="btn sm" aria-label={t('Read out «{text}»', { text: p[lang.key] })} onclick={() => speak(p[lang.key])}><Volume2 size={16} aria-hidden="true" /></button>{/if}
      </li>
    {:else}
      <li class="tool-muted">{t('No sentence fits the search.')}</li>
    {/each}
  </ul>
</section>

<style>
  .ph-m {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
  }
  .ph-m b {
    font-size: var(--fs-sub);
    overflow-wrap: break-word;
  }
</style>
