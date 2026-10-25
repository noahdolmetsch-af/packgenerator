<script>
  /*
   * «Weiter fragen bei …» and «Gemini in der App» (Noah 19.10.2026 «a und b», «2a»): under the app's own
   * answer. One tap on a service opens it in a new tab with the question filled in (elsewhere.js); the
   * tick «Send my gear and learnings along» is off each time, so only the question goes unless you set
   * it. «Ask Gemini here» answers inside the app (free, through the app's server, gemini.js), with
   * «Read aloud». Which services show: Ich › Darstellung › Bedienung › Dictation and questions.
   */
  import { liveQuery } from 'dexie';
  import { ExternalLink, Sparkles, Volume2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, lang, nameOf, isDe } from '../i18n.svelte.js';
  import { dict } from '../dictation.svelte.js';
  import { helper } from '../helper/client.svelte.js';
  import { orderedServices, shownServices, contextFor, askText } from './elsewhere.js';
  import { askGemini, geminiError } from './gemini.js';
  import { readAloud, stopReading, speechLang, voiceApi } from '../speak.js';

  // «Suche mit Sprache und Antworten» (Noah 21.10.2026 «3a … und b»): the top search passes its own
  // settings (Ich › Suche): `gemini` and `links` show or hide the two parts (null: the dictation setting),
  // `auto` asks Gemini by itself (a spoken question the app has no answer for), `autoread` reads it aloud.
  // «Weiter fragen» as one block (Noah 22.10.2026 «3a»): `children` (the Chrome AI and the AI on this
  // device, SearchFree with links off) sits inside it, below the links.
  let { q = '', gemini = null, links = true, auto = false, autoread = null, children = null } = $props();
  let withData = $state(false);
  let gAns = $state('');
  let gMsg = $state('');
  let gBusy = $state(false);
  let gFor = $state('');
  let reading = $state(false);
  let copiedTo = $state('');
  const src = liveQuery(async () => ({ items: await db.items.toArray(), learnings: await db.learnings.toArray() }));
  const ctx = $derived(withData && $src ? contextFor(q, { items: $src.items, learnings: $src.learnings, name: nameOf, de: isDe() }) : '');
  // your order, your favourite first and big (Noah 22.10.2026 «4a»; Ich › Darstellung › Bedienung)
  const list = $derived(links ? orderedServices(dict.order).filter((s) => shownServices(dict.others).includes(s.key)) : []);
  const sname = (s) => (s.key === 'google' ? t(s.name) : s.name);
  // the question that goes along, changeable before the jump (Noah 22.10.2026 «2a»); a new question or
  // the tick starts it fresh
  const base = $derived(askText(q, ctx));
  let edited = $state(null);
  let editedFor = '';
  $effect(() => {
    if (base !== editedFor) (editedFor = base), (edited = null);
  });
  const sendText = $derived(edited ?? base);
  const gShown = $derived((gemini ?? dict.gemini) && !!helper.code);
  const canRead = !!voiceApi();

  $effect(() => {
    if (q !== gFor) (gAns = ''), (gMsg = ''), (gFor = ''), (copiedTo = '');
  });

  async function askG() {
    if (gBusy) return;
    gBusy = true;
    gMsg = '';
    gAns = '';
    const asked = q;
    const r = await askGemini(asked, { context: ctx, lang: lang.v === 'en' ? 'en' : 'de' });
    gBusy = false;
    if (q !== asked) return;
    gFor = asked;
    if (r.ok) {
      gAns = r.text;
      if (autoread ?? dict.read) read();
    } else gMsg = geminiError(r.error);
  }
  // a moment later, so the app's own answer has loaded first (the search then says auto = false)
  let autoFor = '';
  $effect(() => {
    if (!auto || !gShown || q.trim().length < 3 || autoFor === q) return;
    const asked = q;
    const timer = setTimeout(() => {
      if (auto && q === asked && autoFor !== asked) (autoFor = asked), askG();
    }, 700);
    return () => clearTimeout(timer);
  });
  // «Weiter fragen bei» (Noah 22.10.2026): the address already carries the question; it is also copied,
  // because a service can lose it (e.g. after its sign-in page). The note says where to paste it.
  function copyAlong(s) {
    copiedTo = '';
    navigator.clipboard?.writeText(sendText).then(() => (copiedTo = sname(s)), () => {});
  }
  function read() {
    if (reading) return stopReading(), (reading = false);
    reading = true;
    readAloud(gAns, { lang: speechLang(lang.v), onend: () => (reading = false) });
  }
  $effect(() => () => reading && stopReading());
</script>

{#if q.trim().length >= 3 && (list.length || gShown)}
  <div class="ae" data-ask-elsewhere>
    {#if gShown}
      <p class="ae-row">
        <button type="button" class="btn sm" onclick={askG} disabled={gBusy} data-ask-gemini><Sparkles size={14} aria-hidden="true" />{gBusy ? t('Gemini is thinking …') : t('Ask Gemini here (free)')}</button>
      </p>
      {#if gAns}
        <div class="ae-ans" role="status" data-gemini-answer>
          <p class="ae-from"><Sparkles size={14} aria-hidden="true" />{t('Gemini answers (free AI from Google; check what matters)')}</p>
          {#each gAns.split(/\n+/) as l, i (i)}<p class="ae-l">{l}</p>{/each}
          {#if canRead}<p class="ae-row"><button type="button" class="btn sm" aria-pressed={reading} onclick={read}><Volume2 size={14} aria-hidden="true" />{reading ? t('Stop reading') : t('Read aloud')}</button></p>{/if}
        </div>
      {/if}
      {#if gMsg}<p class="ae-msg" role="status">{gMsg}</p>{/if}
    {/if}
    {#if list.length}
      <p class="ae-h">{t('Ask further at')} <span class="ae-hint">{t('(your question goes along)')}</span></p>
      <textarea class="inp ae-q" rows="2" value={sendText} oninput={(e) => (edited = e.currentTarget.value)} aria-label={t('The question that goes along')} data-ask-text></textarea>
      <p class="ae-msg">{t('You can change the question here before you open a service.')}</p>
      <ul class="ae-list">
        {#each list as s, i (s.key)}
          <li><a class={i === 0 ? 'btn hi sm ae-go ae-fav' : 'chip ae-go'} href={s.url(sendText)} target="_blank" rel="noopener noreferrer" title={t(s.what)} data-service={s.key} onclick={() => copyAlong(s)}>{i === 0 ? t('Ask {name}', { name: sname(s) }) : sname(s)}<ExternalLink size={12} aria-hidden="true" /></a></li>
        {/each}
      </ul>
      {#if copiedTo}<p class="ae-msg" role="status" data-ask-copied>{t('{name} opens with your question. It is also copied: if it is missing there (e.g. after signing in), paste it.', { name: copiedTo })}</p>{/if}
    {/if}
    <label class="ae-tick"><input type="checkbox" bind:checked={withData} data-ask-with-data />{t('Send my gear and learnings that fit along')}</label>
    {#if withData}<p class="ae-msg">{ctx ? t('Goes along: {n} lines from your gear and learnings.', { n: ctx.split('\n').filter((l) => l.startsWith('- ')).length }) : t('Nothing in your gear or learnings fits this question; only the question goes along.')}</p>{/if}
    {#if children}<div class="ae-more">{@render children()}</div>{/if}
  </div>
{:else if children}
  {@render children()}
{/if}

<style>
  .ae {
    margin: 0 6px 8px;
    display: grid;
    gap: 6px;
  }
  .ae-row {
    margin: 0;
  }
  .ae-row .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .ae-h {
    margin: 2px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ae-hint {
    color: var(--ink-3);
  }
  .ae-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ae-go {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
  }
  .ae-q {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    font: inherit;
  }
  .ae-fav {
    font-weight: 600;
  }
  .ae-more {
    margin-top: 4px;
  }
  .ae-tick {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .ae-msg {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ae-ans {
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
    overflow-wrap: break-word;
  }
  .ae-from {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ae-l {
    margin: 2px 0 0;
    color: var(--ink);
  }
</style>
