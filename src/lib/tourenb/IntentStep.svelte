<script>
  /**
   * Idee 52 «Tour aus einer Absicht» (Touren b, mockup B52, answer a): the first step at the top of «Neue Tour».
   * Pick an intent, answer its few questions (all chips, preset), see the proposal, then «Create trip» or
   * «Change in the form» (fills the window below) or «Without an intent» (folds this away). absicht.js.
   */
  import { Eye, House, Tent, Activity, Bike, Check, CalendarDays, Clock, Moon, MessageCircleQuestion, Plus } from '@lucide/svelte';
  import { INTENTS, intentOf, startAnswers, pickAnswer, proposal, whenChoices } from './absicht.js';
  import { shortDay } from '../trip/checkhints.js';
  import { t, num } from '../i18n.svelte.js';

  /** onapply(p, intentKey, answers, create): fill the window (create: and make the trip at once). */
  let { onapply } = $props();
  const ICONS = { eye: Eye, home: House, tent: Tent, act: Activity, bike: Bike };
  let open = $state(true);
  let key = $state(null);
  let answers = $state({});
  let ownOpen = $state(false);
  const intent = $derived(intentOf(key));
  const whens = whenChoices();
  const p = $derived(key ? proposal(key, answers) : null);
  const nightName = (p) => (p.overnight === 'outdoor' ? (p.tent ? t('Bivouac + tent') : t('Bivouac')) : p.overnight === 'lodging' ? t('Hotel/hut') : '');
  const askText = (a) => (a.own ? t('How did «{name}» go?', { name: a.own }) : t(a.text));

  function choose(k) {
    key = key === k ? null : k;
    answers = key ? startAnswers(intentOf(key)) : {};
    ownOpen = false;
  }
  const isOn = (q, c) => (q.multi ? (answers[q.id] ?? []).includes(c) : answers[q.id] === c);
  function apply(create) {
    onapply?.($state.snapshot(p), key, $state.snapshot(answers), create);
    if (!create) open = false;
  }
</script>

{#if open}
  <section class="ia" aria-labelledby="ia-h" data-intent-step>
    <p class="ia-kick">{t('Tour from an intent')}</p>
    <h3 id="ia-h">{t('What do you have in mind?')}</h3>
    <p class="ia-sub">{t('Pick an intent. The app then asks only the questions that fit and proposes the tour. Everything stays changeable.')}</p>
    <div class="ia-grid" role="group" aria-label={t('Intent')}>
      {#each INTENTS as i (i.key)}{@const Icon = ICONS[i.icon]}
        <button type="button" class="ia-int" aria-pressed={key === i.key} onclick={() => choose(i.key)} data-intent={i.key}><Icon size={22} aria-hidden="true" /><b>{t(i.name)}</b><small>{t(i.sub)}</small></button>
      {/each}
    </div>
    {#if intent && p}
      <div class="ia-qs">
        <p class="ia-k">{t('{name}: {n} questions', { name: t(intent.name), n: num(intent.questions.length) })} · {t('all preset, change what does not fit')}</p>
        {#each intent.questions as q (q.id)}
          <fieldset class="ia-q">
            <legend>{t(q.q)}</legend>
            <div class="tp-chips">
              {#if q.when}
                {#each whens as w (w.key)}<button type="button" class="tp-chip" aria-pressed={answers.when === w.day} onclick={() => (answers = { ...answers, when: w.day })}>{t(w.name)} · {shortDay(w.day)}</button>{/each}
              {:else}
                {#each q.choices as c (c.key)}<button type="button" class="tp-chip" aria-pressed={isOn(q, c.key)} onclick={() => (answers = pickAnswer(answers, q, c.key))}>{t(c.name)}</button>{/each}
                {#if q.own}
                  {#if ownOpen}<input class="inp ia-own" bind:value={answers.own} placeholder={t('e.g. new rain jacket')} aria-label={t('Your own test')} />
                  {:else}<button type="button" class="tp-chip" onclick={() => (ownOpen = true)}><Plus size={14} aria-hidden="true" />{t('Own|test')}</button>{/if}
                {/if}
              {/if}
            </div>
            {#if q.hint}<p class="tp-small tp-muted">{t(q.hint)}</p>{/if}
          </fieldset>
        {/each}
      </div>
      <div class="ia-prop" data-intent-proposal>
        <p class="ia-k"><Check size={16} aria-hidden="true" /> {t('This becomes your tour')} · {t('a proposal, all changeable')}</p>
        <p class="ia-row"><CalendarDays size={18} aria-hidden="true" /><span><b>{t(p.title)}</b><small>{p.startDate ? shortDay(p.startDate) : ''}{p.days > 1 ? ` · ${t('{n} days', { n: p.days })}` : ''}</small></span></p>
        {#if p.hours}<p class="ia-row"><Clock size={18} aria-hidden="true" /><span>{t('About {n} h on the bike', { n: num(p.hours) })}</span></p>{/if}
        {#if p.overnight !== 'none'}<p class="ia-row"><Moon size={18} aria-hidden="true" /><span>{nightName(p)}{p.cook ? ` · ${t('Cooking')}` : ''}</span></p>{/if}
        <p class="ia-row"><MessageCircleQuestion size={18} aria-hidden="true" /><span><b>{t('The look back asks afterwards')}</b><small>{p.asks.map((a) => `«${askText(a)}»`).join(' · ')}</small></span></p>
        <div class="ia-btns">
          <button type="button" class="btn hi" onclick={() => apply(true)} data-intent-create>{t('Create trip')}</button>
          <button type="button" class="btn" onclick={() => apply(false)} data-intent-form>{t('Change in the form')}</button>
        </div>
      </div>
    {/if}
    <button type="button" class="tp-link" onclick={() => ((open = false), (key = null))} data-intent-skip>{t('Go on without an intent')}</button>
  </section>
{:else}
  <button type="button" class="tp-link ia-again" onclick={() => (open = true)} data-intent-again>{t('Start from an intent')}</button>
{/if}

<style>
  .ia {
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px;
    margin: 0 0 12px;
    background: var(--paper);
  }
  .ia-kick {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .ia h3 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .ia-sub {
    margin: 2px 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ia-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
    gap: 8px;
  }
  .ia-int {
    display: grid;
    justify-items: start;
    gap: 2px;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    font: inherit;
  }
  .ia-int[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .ia-int small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ia-qs,
  .ia-prop {
    margin-top: 12px;
  }
  .ia-k {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin: 0 0 6px;
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .ia-q {
    border: 0;
    margin: 0 0 8px;
    padding: 0;
  }
  .ia-q legend {
    font-weight: 600;
    margin-bottom: 4px;
  }
  .ia-own {
    max-width: 220px;
  }
  .ia-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 6px 0;
  }
  .ia-row span {
    display: grid;
  }
  .ia-row small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ia-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 10px 0 6px;
  }
  .ia-again {
    margin: 0 0 8px;
  }
</style>
