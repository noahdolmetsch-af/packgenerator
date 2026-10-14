<script>
  /**
   * HG1d (2b) «Wie gaht's? / Was häsch vor?»: the quiet line under the greeting on Today and the small
   * sheet it opens (from below on a phone, in the middle on a computer). Two short questions, both
   * optional: five calm faces in one neutral colour (observation only) and the plan as a text field with
   * chips. «Speichern» puts the answer into the ONE history of «Deine Abfragen» (hallo-save.js).
   * The Swiss German words are constants in hallo.js (HG1 1a), the rest goes through t().
   */
  import { ChevronRight, X, Plus, Clock3, FaceSlightlyFrowning, FaceExpressionless, FaceNeutral, FaceSlightlySmiling, FaceGrinning } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { HELLO_TAP, HELLO_MOOD, HELLO_PLAN, HELLO_OWN, MOODS, PLANS, helloTitle } from './hallo.js';
  import { saveHello } from './hallo-save.js';
  import '../bikes/velo-dlg.css';
  import '../abfragen/ab.css';

  let { name = '' } = $props();
  const FACE = { muede: FaceSlightlyFrowning, gahtso: FaceExpressionless, okay: FaceNeutral, guet: FaceSlightlySmiling, super: FaceGrinning };

  let open = $state(false);
  let dialog = $state();
  let field = $state();
  let mood = $state(null);
  let plans = $state([]);
  let text = $state('');
  let saved = $state(false);
  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
  });
  function start() {
    mood = null;
    plans = [];
    text = '';
    saved = false;
    open = true;
  }
  const togglePlan = (k) => (plans = plans.includes(k) ? plans.filter((x) => x !== k) : [...plans, k]);
  async function save() {
    const n = await saveHello({ mood, plans, text });
    saved = n > 0;
    dialog.close();
  }
</script>

<button type="button" class="hello-tap" onclick={start} data-hello-tap>{HELLO_TAP}<ChevronRight size={14} aria-hidden="true" /></button>
{#if saved}<p class="done" role="status" data-hello-saved>{t('Saved in the history of «Your questions».')}</p>{/if}

{#if open}
  <dialog class="sheet vdlg from-below hs" bind:this={dialog} use:backClose onclose={() => (open = false)} aria-labelledby="hs-h" data-hello-sheet>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="hs-h">{helloTitle(name)}</h2>
        <p class="vd-sub">{t('Two short questions, both optional')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <span class="lbl" id="hs-mood">{HELLO_MOOD}</span>
    <div class="faces" role="group" aria-labelledby="hs-mood">
      {#each MOODS as m (m.key)}
        {@const F = FACE[m.key]}
        <button type="button" class="face" aria-pressed={mood === m.key} onclick={() => (mood = mood === m.key ? null : m.key)} data-mood={m.key}><F size={26} aria-hidden="true" /><span>{m.label}</span></button>
      {/each}
    </div>
    <p class="obs">{t('Only an observation, no judgement.')}</p>
    <label class="lbl" for="hs-plan">{HELLO_PLAN}</label>
    <input id="hs-plan" class="inp" type="text" maxlength="200" bind:this={field} bind:value={text} placeholder={t('In a few words')} />
    <div class="ab-opts chips" role="group" aria-label={HELLO_PLAN}>
      {#each PLANS as p (p.key)}<button type="button" class="ab-opt" aria-pressed={plans.includes(p.key)} onclick={() => togglePlan(p.key)} data-plan={p.key}>{p.label}</button>{/each}
      <!-- HG1 (selbst entschieden): «+ eigener» puts the cursor into the field, an own plan is written there -->
      <button type="button" class="ab-opt own" onclick={() => field?.focus()}><Plus size={15} aria-hidden="true" />{HELLO_OWN}</button>
    </div>
    <div class="vd-foot">
      <small class="where"><Clock3 size={15} aria-hidden="true" />{t('lands in the history of «Your questions»')}</small>
      <button type="button" class="btn" onclick={() => dialog.close()} data-hello-later>{t('Not now|hello')}</button>
      <button type="button" class="btn hi" onclick={save} data-hello-save>{t('Save')}</button>
    </div>
  </dialog>
{/if}

<style>
  .hello-tap {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    align-self: flex-start;
    max-width: 100%;
    /* a 44 px tap area that does not move the quiet line away from the greeting */
    min-height: 44px;
    margin: -10px 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-3);
    font: 400 var(--fs-small) / 1.3 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .hello-tap:hover {
    color: var(--ink-2);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .done {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hs .lbl {
    display: block;
    margin: 0 0 8px;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink);
  }
  .faces {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
  }
  /* one neutral colour for all five: observation only, no colour for good or bad */
  .face {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
    min-height: 72px;
    padding: 8px 4px;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink-2);
    font: 500 var(--fs-label) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .face[aria-pressed='true'] {
    border: 2px solid var(--ink);
    padding: 7px 3px;
    color: var(--ink);
    background: var(--paper-2);
  }
  .obs {
    margin: 6px 2px 14px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .chips {
    margin-top: 10px;
  }
  .own {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .where {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: auto;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (max-width: 719px) {
    .faces {
      gap: 6px;
    }
    .face {
      min-height: 66px;
      font-size: var(--fs-tiny);
    }
    .where {
      flex: 1 0 100%;
      margin: 0 0 4px;
    }
  }
</style>
