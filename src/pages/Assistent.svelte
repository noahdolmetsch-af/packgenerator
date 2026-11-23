<script>
  /**
   * «Assistent» (Noah 15.10.2026 «1 beides 2a und b 3 a und b», thread «Claude in der App»): #/assistent.
   * Two parts: «Frag die App» (a question, the app answers from your data) and «Hilf mir planen»
   * (#/assistent/plan: four short questions, then a plan). Free first: the app's own rules, Chrome-KI on
   * a computer. Reached from its own button
   * (sidebar, phone top bar) and from the search.
   */
  import { liveQuery } from 'dexie';
  import { ChevronLeft, MessageCircle, Route, Sparkles } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { t, tn } from '../lib/i18n.svelte.js';
  import { EXAMPLES } from '../lib/assistent/answers.js';
  import AskAnswer from '../lib/assistent/AskAnswer.svelte';
  import FragenDaten from '../lib/fragen/FragenDaten.svelte';
  import FrageKarte from '../lib/fragen/FrageKarte.svelte';
  import { QUESTIONS } from '../lib/fragen/fragen.js';
  import { ASK } from '../lib/fragen/saetze.js';
  import PlanHelp from '../lib/assistent/PlanHelp.svelte';
  import { planFromHash } from '../lib/suche/say.js'; // «Plane mir 3 Tage Jura» from the search
  import SearchFree from '../lib/kisuche/SearchFree.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import AskElsewhere from '../lib/assistent/AskElsewhere.svelte';
  import SpeakButton from '../lib/ui/SpeakButton.svelte';
  import AskGemini from '../lib/gemini/AskGemini.svelte'; // «Frag Gemini» (Noah 23.11.2026 «1a 2a 3a 4b»)
  import { dict } from '../lib/dictation.svelte.js';
  import { appendSpoken } from '../lib/speak.js';
  import { loadOpen, saveOpen, noteOpen, dropOpen, hasOpen, keyOf } from '../lib/assistent/offen.js';
  import { toast } from '../lib/flow/ui.svelte.js';
  import { localDay } from '../lib/localday.js';

  let { hash = '' } = $props();
  // Noah 15.10.2026 «spezifisch sollen diese beispiele in der app als beispiele angezeigt werden»: examples
  // per way.
  const CHROME_EG = ['What do I take for 2 days of rain?', 'Which jacket for 5 °C?'];
  const plan = $derived(hash.startsWith('#/assistent/plan'));
  const gemini = $derived(hash.startsWith('#/assistent/gemini'));
  // «Eigene Frage stellen» (Noah 23.11.2026 «1-5a», 5a): opened from «Fragen» (`?von=fragen`) the place stays «Auswerten» and a link
  // leads back; the field has the cursor; the six questions of «Fragen» are buttons that show the same answer (FragenDaten, no second count)
  const von = $derived(/[?&]von=fragen(&|$)/.test(hash));
  let field = $state(null);
  let focused = false;
  $effect(() => {
    if (field && !plan && !gemini && !focused && !asked) {
      focused = true;
      field.focus({ preventScroll: true });
    }
  });
  let pick = $state(''); // the key of the question of «Fragen» that is shown
  let q = $state('');
  let asked = $state('');
  let appHas = $state(false); // the app's own answer has something for `asked`
  // «Diktat» (Noah 19.10.2026): a question from a dictated note comes as #/assistent?q=…
  let fromHash = '';
  $effect(() => {
    const m = /[?&]q=([^&]*)/.exec(hash);
    const v = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    if (v && v !== fromHash) (fromHash = v), (q = v), (asked = v);
  });
  function spoken(w) {
    q = appendSpoken(q, w);
    asked = q.trim();
  }
  const all = liveQuery(async () => {
    const [items, trips, bikes, notes, tpl, events] = await Promise.all([db.items.toArray(), db.trips.toArray(), db.bikes.toArray(), db.notes.toArray(), db.settings.get(TEMPLATES_KEY), db.events.toArray()]);
    return { items, trips, bikes, notes, templates: tpl?.value ?? [], events };
  });
  // Klick-Rundgang 22.10.2026 H26: «Ask» with an empty field says what to do instead of doing nothing
  let empty = $state(false);
  function submit(e) {
    e.preventDefault();
    pick = '';
    asked = q.trim();
    noted = '';
    empty = !asked;
  }
  function example(s) {
    pick = '';
    empty = false;
    noted = '';
    q = s;
    asked = s;
  }
  // S6 «Frag die App merkt sich Fragen» (Noah 21.11.2026 «5a»): a question the app could not answer is kept on this
  // device only (offen.js), with Undo to remove it; a question it can answer later leaves the list by itself
  let openQs = $state(loadOpen());
  let noted = '';
  function done(has, qq) {
    if (has) {
      if (hasOpen(openQs, qq)) (openQs = dropOpen(openQs, keyOf(qq))), saveOpen(openQs);
      return;
    }
    if (noted === qq) return;
    noted = qq;
    openQs = noteOpen(openQs, qq, localDay());
    saveOpen(openQs);
  }
  function drop(e) {
    const before = openQs;
    openQs = dropOpen(openQs, e.key);
    saveOpen(openQs);
    toast(t('Question removed'), () => ((openQs = before), saveOpen(before)));
  }
</script>

<div class="as-page">
  {#if von}<a class="as-back" href="#/auswerten/fragen" data-as-back><ChevronLeft size={16} aria-hidden="true" />{t('Back to «Ask your data»')}</a>{/if}
  <VeloHead title={t('Assistant')} sub={t('Ask the app, ask Gemini, or let it help you plan. Free.')} />
  <div class="as-tabs" role="tablist" aria-label={t('Assistant')}>
    <a role="tab" href="#/assistent" aria-selected={!plan && !gemini} class:on={!plan && !gemini}><MessageCircle size={16} aria-hidden="true" />{t('Ask the app')}</a>
    <a role="tab" href="#/assistent/plan" aria-selected={plan} class:on={plan}><Route size={16} aria-hidden="true" />{t('Help me plan')}</a>
    <a role="tab" href="#/assistent/gemini" aria-selected={gemini} class:on={gemini} data-as-tab="gemini"><Sparkles size={16} aria-hidden="true" />{t('Ask Gemini')}</a>
  </div>

  {#if gemini}
    <AskGemini />
  {:else if plan}
    <PlanHelp prefill={planFromHash(hash)} />
  {:else}
    <section class="card as-card" aria-labelledby="as-ask-h">
      <h2 id="as-ask-h" class="as-h">{t('Ask the app')}</h2>
      <form class="as-row" onsubmit={submit}>
        <input class="inp" type="search" bind:this={field} bind:value={q} oninput={() => ((asked = ''), (pick = ''), (empty = false))} placeholder={t('e.g. How many km this month?')} aria-label={t('Your question')} autocomplete="off" />
        <button type="submit" class="btn hi">{t('Ask')}</button>
      </form>
      {#if empty}<p class="as-empty" role="status" data-as-empty>{t('Type a question first, or tap one of the examples below.')}</p>{/if}
      <p class="as-spk"><SpeakButton onsaid={spoken} /></p>
      <div class="as-ex" aria-label={t('Examples')}>
        {#each EXAMPLES as e (e)}<button type="button" class="chip" onclick={() => example(t(e))}>{t(e)}</button>{/each}
      </div>
      <!-- the six questions of «Fragen»: a tap shows the same answer as there -->
      <div class="as-q" data-as="fragen" role="group" aria-label={t('Ask your data')}>
        <p class="as-qh">{t('Ask your data')}</p>
        <div class="as-ex">
          {#each QUESTIONS as fq (fq.key)}<button type="button" class="chip" class:on={pick === fq.key} aria-pressed={pick === fq.key} data-as-frage={fq.key} onclick={() => ((pick = pick === fq.key ? '' : fq.key), (asked = ''), (q = ''), (empty = false))}>{ASK[fq.key]()}</button>{/each}
        </div>
        {#if pick}
          <div class="as-res" aria-live="polite" data-as-frage-antwort>
            <FragenDaten>
              {#snippet children({ ready, answers, stand })}
                {#if !ready}<p class="as-hint" role="status">{t('Counting …')}</p>{:else}<FrageKarte q={QUESTIONS.find((x) => x.key === pick)} a={answers[pick]} stand={stand(pick)} slim={answers[pick].state === 'few'} />{/if}
              {/snippet}
            </FragenDaten>
          </div>
        {/if}
      </div>
      {#if asked}
        <div class="as-res" aria-live="polite">
          <AskAnswer q={asked} fallback here tools autoread={dict.read} onresult={(has) => (appHas = has)} ondone={done} />
          <!-- one block «Weiter fragen» (Noah 22.10.2026 «3a») -->
          <AskElsewhere q={asked}>
            {#snippet children()}<SearchFree q={asked} data={$all} inside />{/snippet}
          </AskElsewhere>
        </div>
      {/if}
      <!-- Paket C «Assistent mit Belegen» (996 Ideen): sources, own no-gos, question a plan -->
      <a class="as-belege" href="#/me/ruhig/belege" data-as="belege">{t('With sources, your no-gos and «Question my plan» ›')}</a>
    </section>
    <!-- Noah 15.10.2026 «ich möchte diese info im front end ersichtlich machen»: the three ways it answers -->
    <details class="card as-card as-how" data-as="how">
      <summary>{t('How the assistant answers')}</summary>
      <dl>
        <dt>{t('1 · The app itself')} <span class="as-tag">{t('free, always there')}</span></dt>
        <dd>{t('It knows set questions and works out the answer from your data: km of a period, what is due on your bikes, what is still to pack, your next and last trip, the weight of an item, your learnings. Each answer has a link to the right place. Nothing leaves your device.')}</dd>
        <dd><ul class="as-eg" aria-label={t('Examples')}>{#each [...EXAMPLES, 'What did I learn about rain?'] as e (e)}<li><button type="button" class="as-egb" onclick={() => example(t(e))}>«{t(e)}»</button></li>{/each}</ul></dd>
        <dt>{t('2 · Chrome AI')} <span class="as-tag">{t('free, only on a computer in Chrome')}</span></dt>
        <dd>{t('A small AI built into Chrome. It also answers free questions, with the entries from the app that fit. It runs on your computer, nothing goes to the internet.')}</dd>
        <dd><ul class="as-eg" aria-label={t('Examples')}>{#each CHROME_EG as e (e)}<li>«{t(e)}»</li>{/each}</ul></dd>
        <dt>{t('3 · Gemini')} <span class="as-tag">{t('free, needs internet')}</span></dt>
        <dd>{t('Simple questions by text, voice or photo, from Google’s free Gemini. It does not know your data; only the question and the photo go out. The answer can be read aloud.')}</dd>
      </dl>
      <p class="as-hint">{t('«Help me plan» asks four things (when and how long, kind of trip, the night, the bike) and then suggests a plan: weather, packing list, what is due on the bike, your learnings.')}</p>
    </details>
    {#if openQs.length}
      <details class="card as-card as-how" data-as="open">
        <summary>{tn(openQs.length, 'One question without an answer', '{n} questions without an answer')}</summary>
        <p class="as-hint">{t('The app could not answer these. They stay only on this device, not in the backup. When the app can answer one, it leaves this list by itself.')}</p>
        <ul class="as-eg as-openl">
          {#each openQs as e (e.key)}
            <li>
              <button type="button" class="as-egb" onclick={() => example(e.q)} data-open-ask>«{e.q}»</button>
              {#if e.n > 1}<small>{t('asked {n} times', { n: e.n })}</small>{/if}
              <button type="button" class="btn sm" onclick={() => drop(e)} data-open-del aria-label={t('Remove this question')}>{t('Remove')}</button>
            </li>
          {/each}
        </ul>
      </details>
    {/if}
    <p class="as-fine">{t('The app answers free and on this device.')}</p>
  {/if}
</div>

<style>
  .as-page {
    max-width: 820px;
  }
  .as-back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-decoration: none;
  }
  .as-q {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin-top: var(--sp-3);
  }
  .as-qh {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .as-tabs {
    display: flex;
    gap: 6px;
    margin: 0 0 var(--sp-3);
    flex-wrap: wrap;
  }
  .as-tabs a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-2);
    text-decoration: none;
    font-weight: 500;
  }
  .as-tabs a.on {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--hi-ink);
  }
  .as-card {
    padding: var(--sp-3);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .as-h {
    margin: 0 0 var(--sp-2);
    font-size: var(--fs-section);
  }
  .as-row {
    display: flex;
    gap: 8px;
  }
  .as-empty {
    margin: 6px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .as-spk {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 6px 0 0;
  }
  .as-row .inp {
    flex: 1;
    min-width: 0;
  }
  .as-ex {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: var(--sp-2);
  }
  .chip {
    padding: 7px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .as-q .chip {
    min-height: 44px;
    text-align: left;
  }
  .chip.on {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--hi-ink);
  }
  .as-res {
    margin-top: var(--sp-2);
  }
  .as-how {
    margin-top: var(--sp-3);
  }
  .as-how summary {
    cursor: pointer;
    font-weight: 600;
    /* Klick-Rundgang 2: a 44 px tap height */
    padding-block: 10px;
  }
  .as-how dl {
    margin: var(--sp-2) 0 0;
  }
  .as-how dt {
    margin-top: var(--sp-2);
    font-weight: 600;
  }
  .as-how dd {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .as-eg {
    margin: 4px 0 0;
    padding-left: 1.1em;
  }
  .as-eg li {
    margin: 2px 0;
  }
  .as-egb {
    padding: 0;
    border: 0;
    background: none;
    color: var(--hi, var(--accent));
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .as-tag {
    margin-left: 4px;
    font-weight: 400;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .as-hint {
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .as-openl {
    list-style: none;
    padding: 0;
    margin: var(--sp-2) 0 0;
  }
  .as-openl li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    padding: 6px 0;
  }
  .as-openl small {
    color: var(--ink-3);
    white-space: nowrap;
  }
  .as-openl .btn {
    margin-left: auto;
  }
  .as-fine {
    margin: var(--sp-3) 4px 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .as-belege {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-top: 8px;
    font-size: var(--fs-small);
  }
</style>
