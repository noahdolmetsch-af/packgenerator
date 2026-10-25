<script>
  /**
   * «Assistent» (Noah 15.10.2026 «1 beides 2a und b 3 a und b», thread «Claude in der App»): #/assistent.
   * Two parts: «Frag die App» (a question, the app answers from your data) and «Hilf mir planen»
   * (#/assistent/plan: four short questions, then a plan). Free first: the app's own rules, Chrome-KI on
   * a computer; Claude only with the AI helper switched on (monthly limit). Reached from its own button
   * (sidebar, phone top bar) and from the search.
   */
  import { liveQuery } from 'dexie';
  import { MessageCircle, Route } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { t } from '../lib/i18n.svelte.js';
  import { EXAMPLES } from '../lib/assistent/answers.js';
  import AskAnswer from '../lib/assistent/AskAnswer.svelte';
  import PlanHelp from '../lib/assistent/PlanHelp.svelte';
  import { planFromHash } from '../lib/suche/say.js'; // «Plane mir 3 Tage Jura» from the search
  import SearchFree from '../lib/kisuche/SearchFree.svelte';
  import SearchAnswer from '../lib/helper/SearchAnswer.svelte';
  import { isOn } from '../lib/helper/client.svelte.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import AskElsewhere from '../lib/assistent/AskElsewhere.svelte';
  import SpeakButton from '../lib/ui/SpeakButton.svelte';
  import { appendSpoken } from '../lib/speak.js';

  let { hash = '' } = $props();
  // Noah 15.10.2026 «spezifisch sollen diese beispiele in der app als beispiele angezeigt werden»: examples
  // per way. Claude: only what is built (packing list, Check the list, bike care, look back draft).
  const CHROME_EG = ['What do I take for 2 days of rain?', 'Which jacket for 5 °C?'];
  const CLAUDE_EG = ['New trip: a packing list from a few words, e.g. «3 days Jura, 5 °C, bivouac», with reasons', 'Packing: «Check the list» finds what is missing, double or heavy', 'Bike care: what is due next on chain, cassette, brake pads and tyres, with a concrete check', 'Look back: a draft and learnings from your notes on the way'];
  const plan = $derived(hash.startsWith('#/assistent/plan'));
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
  let kh = $state();
  const all = liveQuery(async () => {
    const [items, trips, bikes, notes, tpl, events] = await Promise.all([db.items.toArray(), db.trips.toArray(), db.bikes.toArray(), db.notes.toArray(), db.settings.get(TEMPLATES_KEY), db.events.toArray()]);
    return { items, trips, bikes, notes, templates: tpl?.value ?? [], events };
  });
  // Klick-Rundgang 22.10.2026 H26: «Ask» with an empty field says what to do instead of doing nothing
  let empty = $state(false);
  function submit(e) {
    e.preventDefault();
    asked = q.trim();
    empty = !asked;
    if (asked) kh?.onEnter(asked);
  }
  function example(s) {
    empty = false;
    q = s;
    asked = s;
  }
</script>

<div class="as-page">
  <VeloHead title={t('Assistant')} sub={t('Ask the app, or let it help you plan. Free, from your own data.')} />
  <div class="as-tabs" role="tablist" aria-label={t('Assistant')}>
    <a role="tab" href="#/assistent" aria-selected={!plan} class:on={!plan}><MessageCircle size={16} aria-hidden="true" />{t('Ask the app')}</a>
    <a role="tab" href="#/assistent/plan" aria-selected={plan} class:on={plan}><Route size={16} aria-hidden="true" />{t('Help me plan')}</a>
  </div>

  {#if plan}
    <PlanHelp prefill={planFromHash(hash)} />
  {:else}
    <section class="card as-card" aria-labelledby="as-ask-h">
      <h2 id="as-ask-h" class="as-h">{t('Ask the app')}</h2>
      <form class="as-row" onsubmit={submit}>
        <input class="inp" type="search" bind:value={q} oninput={() => ((asked = ''), (empty = false))} placeholder={t('e.g. How many km this month?')} aria-label={t('Your question')} autocomplete="off" />
        <button type="submit" class="btn hi">{t('Ask')}</button>
      </form>
      {#if empty}<p class="as-empty" role="status" data-as-empty>{t('Type a question first, or tap one of the examples below.')}</p>{/if}
      <p class="as-spk"><SpeakButton onsaid={spoken} /></p>
      <div class="as-ex" aria-label={t('Examples')}>
        {#each EXAMPLES as e (e)}<button type="button" class="chip" onclick={() => example(t(e))}>{t(e)}</button>{/each}
      </div>
      {#if asked}
        <div class="as-res" aria-live="polite">
          <AskAnswer q={asked} fallback here onresult={(has) => (appHas = has)} />
          {#if isOn()}<SearchAnswer bind:this={kh} q={asked} items={$all?.items ?? []} />{/if}
          <!-- one block «Weiter fragen» (Noah 22.10.2026 «3a»); Gemini asks by itself when the app has no answer («1a») -->
          <AskElsewhere q={asked} auto={!appHas}>
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
        <dd>{t('A small AI built into Chrome. It also answers free questions, with the entries from the app that fit. It runs on your computer, nothing goes to the internet. Its answers are simpler than Claude\'s.')}</dd>
        <dd><ul class="as-eg" aria-label={t('Examples')}>{#each CHROME_EG as e (e)}<li>«{t(e)}»</li>{/each}</ul></dd>
        <dt>{t('3 · Claude')} <span class="as-tag">{t('a few centimes per question')}</span></dt>
        <dd>{t('The best AI: concrete suggestions, e.g. a whole packing list from your gear with reasons. Only when the AI helper is on, and at most up to your monthly limit.')} <a href="#/helper">{t('Me › AI helper')}</a></dd>
        <dd><ul class="as-eg" aria-label={t('Examples')}>{#each CLAUDE_EG as e (e)}<li>{t(e)}</li>{/each}</ul></dd>
      </dl>
      <p class="as-hint">{t('«Help me plan» asks four things (when and how long, kind of trip, the night, the bike) and then suggests a plan: weather, packing list, what is due on the bike, your learnings.')}</p>
    </details>
    <p class="as-fine">{isOn() ? t('The app answers first, free. Claude answers too, because the AI helper is on (monthly limit).') : t('The app answers free and on this device. Claude answers only when the AI helper is on (Me › AI helper).')}</p>
  {/if}
</div>

<style>
  .as-page {
    max-width: 820px;
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
  .as-res {
    margin-top: var(--sp-2);
  }
  .as-how {
    margin-top: var(--sp-3);
  }
  .as-how summary {
    cursor: pointer;
    font-weight: 600;
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
