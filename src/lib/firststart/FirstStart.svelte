<script>
  /**
   * «Erster Start» (Noah 14.10.2026 decision 5 «passt», 20.10.2026 «2a sofort und wir machen b auch»): a
   * new, empty app asks once «Start with examples» or «Start empty» (firststart.js). «Decide later», ×,
   * Escape or back close it; then it asks again on the next start. Mounted by main.js after the start-up
   * tidy-up, so it only ever sees a finished database.
   * Noah 20.10.2026 «1-4 alle»: the language can be switched right here (the examples are written in it),
   * and after the choice a second step offers the short tour of the app (tour/run.js), never by itself.
   */
  import { onMount } from 'svelte';
  import { Sparkles, Square } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, lang, setLang } from '../i18n.svelte.js';
  import { startTour, askTour } from '../tour/run.js';
  import { localDay } from '../localday.js';
  import { settling } from '../settled.js';
  import { tidyData } from '../tidy.js';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { isFresh, chooseStart, INTERESTS, ALL_INTERESTS } from '../firststart.js';
  import '../bikes/velo-dlg.css';

  let show = $state(false);
  let dialog = $state();
  let busy = $state(false);
  /** 'choose' first, then 'tour' (the offer of the short tour) with the answer given. */
  let step = $state('choose');
  let chosen = $state(null);
  // Einzelidee Heute 7: a short interest check before the examples (all on as a suggestion, one stays on)
  let interests = $state([...ALL_INTERESTS]);
  const flip = (k) => (interests = interests.includes(k) ? (interests.length > 1 ? interests.filter((x) => x !== k) : interests) : [...interests, k]);

  onMount(async () => {
    show = await isFresh(db);
  });
  $effect(() => {
    if (show && dialog && !dialog.open) dialog.showModal();
  });

  async function choose(choice) {
    busy = true;
    try {
      await settling(async () => {
        await chooseStart(db, choice, localDay(), $state.snapshot(interests));
        if (choice === 'examples') await tidyData(db);
      });
      chosen = choice;
      step = 'tour';
      busy = false;
    } catch (err) {
      console.error(err);
      busy = false;
      offerDone(t("That didn't work. Nothing was changed. Try again."));
    }
  }
  function closeWith(note = true) {
    dialog?.close();
    if (note) offerDone(chosen === 'examples' ? (interests.length < ALL_INTERESTS.length ? t('The examples you chose are in. Me › Data and backup › «Remove the examples» takes them away again.') : t('The examples are in: two trips, a bike and some gear. Me › Data and backup › «Remove the examples» takes them away again.')) : t('Empty start: everything you add is your own.'), null, 8000);
  }
  async function tour() {
    closeWith(false);
    // with the examples the tour shows them; after an empty start it asks «example trip or own data»
    if (chosen === 'examples') await startTour('app');
    else await askTour('app');
  }
</script>

{#if show}
  <dialog class="sheet vdlg firststart" bind:this={dialog} use:backClose onclose={() => (show = false)} aria-labelledby="fs-h" data-testid="first-start">
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="fs-h">{t('Welcome to the Pack Generator')}</h2>
        <p class="vd-sub">{step === 'choose' ? t('How do you want to start?') : step === 'interest' ? t('Your interests') : t('One more thing')}</p>
      </div>
    </div>
    {#if step === 'choose'}
    <div class="lang" role="group" aria-label={t('Language')}>
      <button type="button" class="btn sm" aria-pressed={lang.v === 'de'} onclick={() => setLang('de')} data-lang="de" lang="de">Deutsch</button>
      <button type="button" class="btn sm" aria-pressed={lang.v === 'en'} onclick={() => setLang('en')} data-lang="en" lang="en">English</button>
    </div>
    <p class="lead">{t('The app plans, packs and debriefs your bike trips and keeps your gear and bikes in order. Your data stays on this device.')}</p>
    <div class="opts">
      <button type="button" class="opt" disabled={busy} onclick={() => (step = 'interest')} data-choice="examples">
        <span class="ic" aria-hidden="true"><Sparkles size={20} /></span>
        <span class="tx">
          <b>{t('Start with examples')}</b>
          <small>{t('Two made-up trips (one ahead, one ridden), a bike, bags, gear and twelve activities: every page shows something right away. You can change or delete all of it.')}</small>
        </span>
      </button>
      <button type="button" class="opt" disabled={busy} onclick={() => choose('empty')} data-choice="empty">
        <span class="ic" aria-hidden="true"><Square size={20} /></span>
        <span class="tx">
          <b>{t('Start empty|first')}</b>
          <small>{t('Empty lists, you add your own. Best if you bring a backup or connect a second device.')}</small>
        </span>
      </button>
    </div>
    <p class="hint">{t('Just looking? Me › Try it out › Playground shows an example trip any time, without changing your data.')}</p>
    <div class="vd-foot">
      <button type="button" class="btn" disabled={busy} onclick={() => dialog?.close()} data-choice="later">{t('Decide later')}</button>
    </div>
    {:else if step === 'interest'}
    <p class="lead">{t('Which examples fit you? A few that fit are better than a full app. You can get the rest later.')}</p>
    <div class="opts" role="group" aria-label={t('Your interests')}>
      {#each INTERESTS as x (x.key)}
        <button type="button" class="opt" aria-pressed={interests.includes(x.key)} onclick={() => flip(x.key)} data-interest={x.key}>
          <span class="ic" aria-hidden="true">{interests.includes(x.key) ? '✓' : '○'}</span>
          <span class="tx"><b>{t(x.name)}</b><small>{t(x.sub)}</small></span>
        </button>
      {/each}
    </div>
    <div class="vd-foot two">
      <button type="button" class="btn" disabled={busy} onclick={() => (step = 'choose')} data-choice="back">{t('Back')}</button>
      <button type="button" class="btn hi" disabled={busy} onclick={() => choose('examples')} data-choice="examples-go">{t('Put the examples in')}</button>
    </div>
    {:else}
    <p class="lead" role="status">{chosen === 'examples' ? (interests.length < ALL_INTERESTS.length ? t('The examples you chose are in.') : t('The examples are in: two trips, a bike and some gear.')) : t('Your app is ready and empty.')}</p>
    <p class="lead">{t('A short tour shows where you plan, pack and look back: 6 steps, about 2 minutes. You only watch and tap «Next».')}</p>
    <div class="vd-foot two">
      <button type="button" class="btn" onclick={() => closeWith()} data-choice="notour">{t('No thanks, I will look myself')}</button>
      <button type="button" class="btn hi" onclick={tour} data-choice="tour">{t('Start the tour')}</button>
    </div>
    {/if}
  </dialog>
{/if}

<style>
  .lead {
    margin: 0 0 12px;
    color: var(--ink-2);
  }
  .opts {
    display: grid;
    gap: 10px;
  }
  .opt {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    text-align: left;
    padding: 12px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .opt[aria-pressed='true'] {
    border-color: var(--hi);
  }
  .opt:hover,
  .opt:focus-visible {
    border-color: var(--hi);
  }
  .ic {
    flex: none;
    color: var(--hi);
    padding-top: 2px;
  }
  .tx {
    display: grid;
    gap: 2px;
  }
  .opt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint {
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .vd-foot {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
  }
  .vd-foot.two {
    flex-wrap: wrap;
    gap: 8px;
  }
  .lang {
    display: flex;
    gap: 6px;
    margin: 0 0 12px;
  }
  .lang [aria-pressed='true'] {
    border-color: var(--hi);
    color: var(--hi);
    font-weight: 600;
  }
</style>
