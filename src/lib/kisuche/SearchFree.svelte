<script>
  /*
   * «Kluge Suche» (Noah 14.10.2026 «alle 3 in einem schritt, ohne mockups»), parts 2 and 3, plus the
   * line of part 1 («Auch gesucht: …», «Gesucht: …»). All free:
   *  2 «Für Claude kopieren»: the question and the entries that fit as one text; the person pastes it
   *    into the Claude app (their own subscription). Nothing leaves the app by itself.
   *  3 «Chrome-KI fragen»: Chrome's own AI on the computer answers right here, on the device.
   * Only for a question («?» at the end, or starts like one). Kept in its own file so Search.svelte only
   * needs a small hook (like helper/SearchAnswer.svelte).
   */
  import { liveQuery } from 'dexie';
  import { Copy, ExternalLink, Cpu } from '@lucide/svelte';
  import { db } from '../db.js';
  import { looksLikeQuestion } from '../helper/logic.js';
  import { related, countRelated, claudeText } from './smart.js';
  import { aiStatus, askLocal } from './chromeAi.js';
  import LocalAsk from '../localai/LocalAsk.svelte'; // «KI im Gerät» (Noah 20.10.2026 «5a»)
  import { t, tn } from '../i18n.svelte.js';

  let { q = '', data = null, also = [], fixed = null, chrome = true, links = true, local = true } = $props(); // chrome, links, local: Ich › Suche (21.10.2026)
  const learnQ = liveQuery(() => db.learnings.toArray());
  const question = $derived(q.trim());
  const isQ = $derived(looksLikeQuestion(question));
  const rel = $derived(isQ && data ? related(question, { ...data, learnings: $learnQ ?? [] }) : null);
  const text = $derived(rel ? claudeText(question, rel) : '');
  const n = $derived(rel ? countRelated(rel) : 0);

  let copied = $state(''); // the question the text was copied for
  let manual = $state(false); // the clipboard refused: show the text to select
  async function copy() {
    manual = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = question;
    } catch {
      manual = true;
    }
  }

  let ai = $state('none');
  aiStatus().then((s) => (ai = s));
  let aq = $state(''); // the question the local answer belongs to
  let answer = $state('');
  let busy = $state(false);
  let load = $state(null); // 0..1 while Chrome downloads the model
  let fail = $state('');
  // Waits until the app's entries are loaded: before that the question would go out empty (CI 0.176.0).
  async function askChrome() {
    if (busy || !text) return;
    aq = question;
    answer = '';
    fail = '';
    busy = true;
    try {
      const a = await askLocal(text, (p) => (load = p));
      if (q.trim() === aq) answer = a;
    } catch {
      fail = t('Chrome could not answer. Try again later.');
    } finally {
      busy = false;
      load = null;
      ai = await aiStatus();
    }
  }
</script>

{#if fixed || also.length}
  <p class="ks-hint" data-ks="hint">{#if fixed}{t('Nothing for «{q}». Searched: «{fixed}»', { q: question, fixed })}{:else}{t('Also searched: {words}', { words: also.join(', ') })}{/if}</p>
{/if}
{#if isQ && (links || chrome || local)}
  <div class="ks" data-ks="ask">
    <p class="ks-gh">{t('Ask Claude or Chrome')}</p>
    <p class="ks-sub">{n ? tn(n, 'With {n} entry that fits. Nothing about your health.', 'With {n} entries that fit. Nothing about your health.') : t('No entry fits; only the question goes along.')}</p>
    <div class="ks-acts">
      {#if links}
        <button type="button" class="btn sm" onclick={copy}><Copy size={16} aria-hidden="true" />{t('Copy for Claude')}</button>
        <a class="btn sm" href="https://claude.ai/new" target="_blank" rel="noopener" onclick={copy}><ExternalLink size={16} aria-hidden="true" />{t('Copy and open Claude')}</a>
      {/if}
      {#if chrome && ai !== 'none'}
        <button type="button" class="btn sm" onclick={askChrome} disabled={busy || !rel}><Cpu size={16} aria-hidden="true" />{ai === 'available' ? t('Ask Chrome AI') : t('Ask Chrome AI (loads once)')}</button>
      {/if}
    </div>
    {#if local}<div class="ks-local"><LocalAsk q={question} lines={[text]} name="search" deviceOnly /></div>{/if}
    {#if copied === question && !manual}<p class="ks-ok" role="status">{t('Copied. Now paste it in the Claude app.')}</p>{/if}
    {#if manual}
      <p class="ks-sub">{t('Copying did not work here. Select the text and copy it:')}</p>
      <textarea class="ks-text" readonly rows="6" aria-label={t('Text for Claude')} onfocus={(e) => e.currentTarget.select()}>{text}</textarea>
    {/if}
    {#if aq === question && (busy || answer || fail)}
      <div class="ks-ans" role="status">
        {#if busy}{load != null && load < 1 ? t('Chrome is loading its AI: {p} %', { p: Math.round(load * 100) }) : t('Chrome AI is thinking …')}
        {:else if fail}{fail}
        {:else}<p class="ks-from">{t('Chrome AI, on this device')}</p><p class="ks-a">{answer}</p>{/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .ks-gh { margin: 8px 6px 2px; font-family: var(--font-body); font-weight: 600; font-size: var(--fs-label); color: var(--ink-3); }
  .ks-hint { margin: 6px 12px 2px; font-size: var(--fs-small); color: var(--ink-3); }
  .ks { padding: 4px 0 8px; border-bottom: 1px solid var(--line); margin-bottom: 4px; }
  .ks-sub { margin: 0 12px 8px; font-size: var(--fs-small); color: var(--ink-3); }
  .ks-acts { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 12px; }
  .ks-acts .btn { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
  .ks-local { padding: 0 12px; }
  .ks-ok { margin: 8px 12px 0; font-size: var(--fs-small); color: var(--accent); font-weight: 500; }
  .ks-text { display: block; box-sizing: border-box; width: calc(100% - 24px); margin: 0 12px; font: 400 var(--fs-small) var(--font-body); }
  .ks-ans { margin: 10px 12px 0; padding: 10px 12px; border-radius: 10px; background: var(--paper-2); font-size: var(--fs-small); color: var(--ink-2); }
  .ks-from { margin: 0 0 4px; font-size: var(--fs-small); color: var(--ink-3); }
  .ks-a { margin: 0; white-space: pre-wrap; color: var(--ink); font-size: var(--fs-body); overflow-wrap: break-word; }
</style>
