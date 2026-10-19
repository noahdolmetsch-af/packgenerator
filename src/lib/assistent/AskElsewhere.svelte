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
  import { SERVICES, shownServices, contextFor, askText } from './elsewhere.js';
  import { askGemini, geminiError } from './gemini.js';
  import { readAloud, stopReading, speechLang, voiceApi } from '../speak.js';

  let { q = '' } = $props();
  let withData = $state(false);
  let gAns = $state('');
  let gMsg = $state('');
  let gBusy = $state(false);
  let gFor = $state('');
  let reading = $state(false);
  const src = liveQuery(async () => ({ items: await db.items.toArray(), learnings: await db.learnings.toArray() }));
  const ctx = $derived(withData && $src ? contextFor(q, { items: $src.items, learnings: $src.learnings, name: nameOf, de: isDe() }) : '');
  const list = $derived(SERVICES.filter((s) => shownServices(dict.others).includes(s.key)));
  const gShown = $derived(dict.gemini && !!helper.code);
  const canRead = !!voiceApi();

  $effect(() => {
    if (q !== gFor) (gAns = ''), (gMsg = ''), (gFor = '');
  });

  async function gemini() {
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
      if (dict.read) read();
    } else gMsg = geminiError(r.error);
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
        <button type="button" class="btn sm" onclick={gemini} disabled={gBusy} data-ask-gemini><Sparkles size={14} aria-hidden="true" />{gBusy ? t('Gemini is thinking …') : t('Ask Gemini here (free)')}</button>
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
      <p class="ae-h">{t('Ask further at')}</p>
      <ul class="ae-list">
        {#each list as s (s.key)}
          <li><a class="chip ae-go" href={s.url(askText(q, ctx))} target="_blank" rel="noopener noreferrer" title={t(s.what)} data-service={s.key}>{s.key === 'google' ? t(s.name) : s.name}<ExternalLink size={12} aria-hidden="true" /></a></li>
        {/each}
      </ul>
    {/if}
    <label class="ae-tick"><input type="checkbox" bind:checked={withData} data-ask-with-data />{t('Send my gear and learnings that fit along')}</label>
    {#if withData}<p class="ae-msg">{ctx ? t('Goes along: {n} lines from your gear and learnings.', { n: ctx.split('\n').filter((l) => l.startsWith('- ')).length }) : t('Nothing in your gear or learnings fits this question; only the question goes along.')}</p>{/if}
  </div>
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
