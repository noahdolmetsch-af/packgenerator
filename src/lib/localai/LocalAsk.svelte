<script>
  /*
   * «KI fragen» (Noah 20.10.2026 «4b 5a und b»): one button in the search, the Assistent and beside
   * «Mit Claude besprechen» (Packliste, Velo-Pflege, Rückblick). With internet and the AI helper set up,
   * Gemini answers (as «Ask Gemini here»; `online` lines go along only if the page allows it);
   * without internet, or without the helper, the AI on this device answers with all `lines` (they stay
   * on the device). If the device has no model yet, a link leads to the place to load it.
   */
  import { Cpu, Sparkles } from '@lucide/svelte';
  import { t, isDe, lang } from '../i18n.svelte.js';
  import { dict } from '../dictation.svelte.js';
  import { helper } from '../helper/client.svelte.js';
  import { askGemini } from '../assistent/gemini.js';
  import { canRunLocal, chatFor, modelOf } from './models.js';
  import { askModel } from './engine.js';
  import { local, refreshLocal } from './localai.svelte.js';

  // deviceOnly: the top search asks Gemini itself (Ich › Suche, 21.10.2026), so here only the device AI
  let { q = '', lines = [], online = [], name = '', deviceOnly = false } = $props();
  const able = canRunLocal();
  let net = $state(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
  $effect(() => {
    const on = () => (net = true);
    const off = () => (net = false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  });
  if (able && !local.checked) refreshLocal();

  const gemini = $derived(!deviceOnly && net && dict.gemini && !!helper.code);
  const shown = $derived(able && String(q).trim().length >= 3);

  let busy = $state(false);
  let pct = $state(null);
  let text = $state('');
  let from = $state(''); // 'gemini' | 'device'
  let fail = $state('');
  let asked = $state('');
  $effect(() => {
    if (q !== asked) (text = ''), (fail = ''), (from = '');
  });

  async function onDevice(question) {
    from = 'device';
    const r = await askModel(local.model, chatFor(question, lines, { de: isDe() }), { onText: (s) => q === question && (text = s), onprogress: (p) => (pct = p) });
    if (q === question) text = r.text;
  }
  async function ask() {
    if (busy) return;
    busy = true;
    fail = '';
    text = '';
    pct = null;
    const question = q;
    asked = question;
    try {
      if (gemini) {
        const r = await askGemini(question, { context: online.filter(Boolean).join('\n'), lang: lang.v === 'en' ? 'en' : 'de' });
        if (r.ok) {
          from = 'gemini';
          if (q === question) text = r.text;
          return;
        }
        if (!local.ready) throw new Error('gemini');
      }
      await onDevice(question);
    } catch {
      if (q === question) fail = t('No answer this time. Try again later.');
    } finally {
      busy = false;
      pct = null;
    }
  }
</script>

{#if shown}
  <div class="lk" data-local-ask={name}>
    {#if gemini || local.ready}
      <button type="button" class="btn sm" onclick={ask} disabled={busy} data-local-go>
        {#if gemini}<Sparkles size={16} aria-hidden="true" />{t('Ask the AI (Gemini, online)')}{:else}<Cpu size={16} aria-hidden="true" />{t('Ask the AI on this device')}{/if}
      </button>
      <span class="lk-note">{gemini ? t('Without internet the AI on this device answers.') : t('{model}, works without internet; nothing leaves the device.', { model: modelOf(local.model).name })}</span>
    {:else if local.checked}
      <a class="lk-set" href="#/me/look" data-local-setup><Cpu size={14} aria-hidden="true" />{t('AI without internet: load it once (Me › Appearance › Handling)')}</a>
    {/if}
    {#if asked === q && (busy || text || fail)}
      <div class="lk-ans" role="status">
        {#if busy && !text}{pct != null && pct < 100 ? t('Loading the AI: {p} %', { p: pct }) : t('The AI is thinking …')}
        {:else if fail}{fail}
        {:else}
          <p class="lk-from">{from === 'gemini' ? t('Gemini answers (free AI from Google; check what matters)') : t('AI on this device (small; check what matters)')}</p>
          <p class="lk-a">{text}</p>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .lk {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 8px 0;
  }
  .lk .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lk-note,
  .lk-set {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .lk-set {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px; /* a tap target on the phone */
  }
  .lk-ans {
    flex: 1 1 100%;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .lk-from {
    margin: 0 0 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .lk-a {
    margin: 0;
    white-space: pre-wrap;
    color: var(--ink);
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
</style>
