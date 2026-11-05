<script>
  /**
   * HG1d (2b) «Wi gaht's? / Was häsch vor?»: the quiet line under the greeting on Today and the small
   * sheet it opens (from below on a phone, in the middle on a computer). Everything optional: five calm
   * faces in one neutral colour (observation only), «Mehr» with more buttons in groups, and the plan as a
   * text field with chips. Gruss A (Noah 05.11.2026 «alle umsetzen»): every tap is saved at once into the ONE history
   * of «Deine Abfragen» (hallo-save.js), no «Speichern»; yesterday's answer is marked quietly.
   * The Swiss German words are constants in hallo.js (HG1 1a), the rest goes through t().
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { ChevronRight, X, Plus, Clock3, FaceSlightlyFrowning, FaceExpressionless, FaceNeutral, FaceSlightlySmiling, FaceGrinning } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { HELLO_TAP, HELLO_MOOD, HELLO_PLAN, HELLO_OWN, HELLO_FEEL, MOODS, PLANS, FEELING_GROUPS, helloTitle } from './hallo.js';
  import { saveHello } from './hallo-save.js';
  import { stampOf } from '../abfragen.js';
  import { db } from '../db.js';
  import '../bikes/velo-dlg.css';
  import '../abfragen/ab.css';

  // UI-Ziele #15 (Noah 20.10.2026 «freigabe»): with `label` the greeting itself is the button (no «antippen» line)
  let { name = '', label = '', headId = 'hello-h' } = $props();
  const FACE = { muede: FaceSlightlyFrowning, gahtso: FaceExpressionless, okay: FaceNeutral, guet: FaceSlightlySmiling, super: FaceGrinning };

  let open = $state(false);
  let dialog = $state();
  let field = $state();
  let mood = $state(null);
  let feelings = $state([]);
  let plans = $state([]);
  let text = $state('');
  let more = $state(false);
  let saved = $state(0);
  // yesterday's answer, marked quietly (the same dashed mark as the five steps)
  let ydMood = $state(null);
  let ydFeelings = $state([]);
  let at = '';
  let touched = false;
  let timer;
  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
  });
  async function yesterday() {
    const d = new Date(`${stampOf().slice(0, 10)}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    const rows = await db.abAnswers.where('day').equals(d.toISOString().slice(0, 10)).toArray();
    const last = (qid) => rows.filter((r) => r.qid === qid).sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))[0]?.value ?? null;
    ydMood = typeof last('hallo.gaht') === 'string' ? last('hallo.gaht') : null;
    const f = last('hallo.gefuehl');
    ydFeelings = Array.isArray(f) ? f : [];
  }
  function start() {
    mood = null;
    feelings = [];
    plans = [];
    text = '';
    more = false;
    saved = 0;
    touched = false;
    at = stampOf();
    ydMood = null;
    ydFeelings = [];
    open = true;
    yesterday();
  }
  const toggle = (list, k) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);
  // every tap is saved after a short moment (the rows have fixed ids, so a changed answer replaces the old one)
  const sig = () => JSON.stringify([mood, feelings, plans, text.trim()]);
  $effect(() => {
    sig();
    if (!open || !touched) return;
    clearTimeout(timer);
    timer = setTimeout(flush, 300);
    return () => clearTimeout(timer);
  });
  async function flush() {
    clearTimeout(timer);
    if (!touched) return;
    saved = await saveHello({ mood, feelings, plans, text }, at);
  }
  const touch = () => (touched = true);
  async function done() {
    await flush();
    dialog.close();
  }
</script>

{#if label}<h1 id={headId} class="hello"><button type="button" class="hello-tap as-title" onclick={start} data-hello-tap aria-description={HELLO_TAP}>{label}<ChevronRight size={22} strokeWidth={2.4} aria-hidden="true" /></button></h1>
{:else}<button type="button" class="hello-tap" onclick={start} data-hello-tap>{HELLO_TAP}<ChevronRight size={14} aria-hidden="true" /></button>{/if}
{#if saved > 0}<p class="done" role="status" data-hello-saved>{t('Saved in the history of «Your questions».')}</p>{/if}

{#if open}
  <dialog use:keepTyped={'hello'} class="sheet vdlg from-below hs" bind:this={dialog} use:backClose onclose={() => { flush(); open = false; }} aria-labelledby="hs-h" data-hello-sheet>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="hs-h">{helloTitle(name)}</h2>
        <p class="vd-sub">{t('Everything optional, saved as you tap')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <span class="lbl" id="hs-mood">{HELLO_MOOD}</span>
    <div class="faces" role="group" aria-labelledby="hs-mood">
      {#each MOODS as m (m.key)}
        {@const F = FACE[m.key]}
        <button type="button" class="face" class:yd={ydMood === m.key} aria-pressed={mood === m.key} onclick={() => { touch(); mood = mood === m.key ? null : m.key; }} data-mood={m.key}><F size={26} aria-hidden="true" /><span>{m.label}</span>{#if ydMood === m.key}<em>{t('yesterday|hello')}</em>{/if}</button>
      {/each}
    </div>
    <p class="obs">{t('Only an observation, no judgement.')}</p>
    <button type="button" class="more" aria-expanded={more} onclick={() => (more = !more)} data-hello-more>{more ? t('Fewer|hello') : t('More|hello')}{feelings.length && !more ? ` · ${feelings.length}` : ''}</button>
    {#if more}
      <div class="feel" data-hello-feel>
        <span class="lbl">{HELLO_FEEL}</span>
        {#each FEELING_GROUPS as g (g.key)}
          <div class="ab-opts chips" role="group" aria-label={t(g.name)} data-feel-group={g.key}>
            <span class="gn">{t(g.name)}</span>
            {#each g.items as f (f.key)}
              <button type="button" class="ab-opt" class:yd={ydFeelings.includes(f.key)} aria-pressed={feelings.includes(f.key)} onclick={() => { touch(); feelings = toggle(feelings, f.key); }} data-feel={f.key}><span aria-hidden="true">{f.emoji}</span> {f.label}</button>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
    <label class="lbl plan-l" for="hs-plan">{HELLO_PLAN}</label>
    <input id="hs-plan" class="inp" type="text" maxlength="200" bind:this={field} bind:value={text} oninput={touch} placeholder={t('In a few words')} />
    <div class="ab-opts chips" role="group" aria-label={HELLO_PLAN}>
      {#each PLANS as p (p.key)}<button type="button" class="ab-opt" aria-pressed={plans.includes(p.key)} onclick={() => { touch(); plans = toggle(plans, p.key); }} data-plan={p.key}>{p.label}</button>{/each}
      <!-- HG1 (selbst entschieden): «+ eigener» puts the cursor into the field, an own plan is written there -->
      <button type="button" class="ab-opt own" onclick={() => field?.focus()}><Plus size={15} aria-hidden="true" />{HELLO_OWN}</button>
    </div>
    <div class="vd-foot">
      <small class="where"><Clock3 size={15} aria-hidden="true" />{t('Saved as you tap, in the history of «Your questions»')}</small>
      <button type="button" class="btn hi" onclick={done} data-hello-save data-hello-done>{t('Done|hello')}</button>
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
  .hello-tap.as-title {
    display: inline;
    margin: 0;
    min-height: 0;
    /* a 44 px tap target: inline padding grows the button, not the line */
    padding: 8px 0;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-align: left;
    cursor: pointer;
  }
  .hello-tap.as-title :global(svg) {
    vertical-align: -0.12em;
    color: var(--ink-3);
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
  .face em {
    font: 400 var(--fs-tiny) / 1 var(--font-body);
    font-style: normal;
    color: var(--ink-3);
  }
  .face.yd {
    border-style: dashed;
  }
  .more {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin: 0 0 4px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .feel {
    margin: 0 0 12px;
  }
  .gn {
    flex: 1 0 100%;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  :global(.hs .ab-opt.yd) {
    border-style: dashed;
  }
  .plan-l {
    margin-top: 8px;
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
