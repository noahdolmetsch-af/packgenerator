<script>
  /*
   * «Weiter fragen bei …» (Noah 19.10.2026 «a und b», «2a»): under the app's own answer. One tap on a
   * service opens it in a new tab with the question filled in (elsewhere.js); the tick «Send my gear and
   * learnings along» is off each time, so only the question goes unless you set it. Which services show:
   * Ich › Darstellung › Bedienung › Dictation and questions.
   */
  import { liveQuery } from 'dexie';
  import { ExternalLink } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, nameOf, isDe } from '../i18n.svelte.js';
  import { dict } from '../dictation.svelte.js';
  import { orderedServices, shownServices, contextFor, askText } from './elsewhere.js';

  // «Suche mit Sprache und Antworten» (Noah 21.10.2026 «3a … und b»): the top search passes its own
  // setting (Ich › Suche): `links` shows or hides the services (the dictation setting otherwise).
  // «Weiter fragen» as one block (Noah 22.10.2026 «3a»): `children` (the Chrome AI and the AI on this
  // device, SearchFree with links off) sits inside it, below the links.
  let { q = '', links = true, children = null } = $props();
  let withData = $state(false);
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

  $effect(() => {
    if (q) copiedTo = '';
  });

  // «Weiter fragen bei» (Noah 22.10.2026): the address already carries the question; it is also copied,
  // because a service can lose it (e.g. after its sign-in page). The note says where to paste it.
  function copyAlong(s) {
    copiedTo = '';
    navigator.clipboard?.writeText(sendText).then(() => (copiedTo = sname(s)), () => {});
  }
</script>

{#if q.trim().length >= 3 && list.length}
  <div class="ae" data-ask-elsewhere>
    {#if list.length}
      <p class="ae-h">{t('Ask further at')} <span class="ae-hint">{t('(your question goes along)')}</span></p>
      <textarea class="inp ae-q" rows="2" value={sendText} oninput={(e) => (edited = e.currentTarget.value)} aria-label={t('The question that goes along')} data-ask-text></textarea>
      <p class="ae-msg">{t('You can change the question here before you open a service.')}</p>
      <ul class="ae-list">
        {#each list as s, i (s.key)}
          <li><a class={i === 0 ? 'btn hi sm ae-go ae-fav' : 'chip ae-go'} href={s.url(sendText)} target="_blank" rel="noopener noreferrer" title={t(s.what)} data-service={s.key} onclick={() => copyAlong(s)}>{i === 0 ? t('Ask {name}', { name: sname(s) }) : sname(s)}<ExternalLink size={14} aria-hidden="true" /></a></li>
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
</style>
