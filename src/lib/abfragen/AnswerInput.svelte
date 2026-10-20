<script>
  /**
   * AB3 / AB5 «Deine Abfragen»: the answer of one question, one tap where it can be (Noah «je ein Tipp,
   * alles überspringbar»). 1–10 as numbers or as a battery, chips (emoji as round buttons), ja / nein,
   * a number with its unit, a sentence; a scale or chips can have a sentence besides («+ 1 Satz»).
   * value and note are bindable; a second tap on the chosen answer takes it back.
   */
  import { t } from '../i18n.svelte.js';
  import { optText, unitText } from './words.js';

  // UI-Ziele #12 (Noah 20.10.2026 «freigabe»): `quick` draws a scale as 5 steps with words (stored as 2, 4 … 10 of the
  // 1–10 scale), `last` (yesterday's value) is marked quietly, `onanswer` runs after a pick (the check moves on)
  let { q, value = $bindable(), note = $bindable(), id, label = '', quick = false, last = null, onanswer = null } = $props();
  const STEPS = [
    { v: 2, w: 'bad|step' },
    { v: 4, w: 'rather bad|step' },
    { v: 6, w: 'okay|step' },
    { v: 8, w: 'good|step' },
    { v: 10, w: 'very good|step' },
  ];
  // an older answer of the 10 steps marks its nearest word
  const lastStep = $derived(last == null ? null : Math.min(10, Math.max(2, Math.round(Number(last) / 2) * 2)));
  function pickStep(v) {
    pick(v);
    if (value != null) onanswer?.();
  }
  const form = $derived(q.form);
  const EMOJI = { laugh: 'laughing', cool: 'cool', crazy: 'crazy', sleepy: 'sleepy', upsideDown: 'upside down', starstruck: 'star-struck' };

  const pick = (v) => (value = value === v ? null : v);
  function toggle(k) {
    const list = Array.isArray(value) ? value : [];
    const next = list.includes(k) ? list.filter((x) => x !== k) : [...list, k];
    value = next.length ? next : null;
  }
  const pressed = (k) => (form.multi ? Array.isArray(value) && value.includes(k) : value === k);
</script>

{#if form.kind === 'scale' && quick}
  <div class="ab-five" role="group" aria-label={label} data-quick-scale>
    {#each STEPS as st (st.v)}
      <button type="button" aria-pressed={value === st.v} class:yd={lastStep === st.v} onclick={() => pickStep(st.v)} data-step={st.v}>
        <span>{t(st.w)}</span>{#if lastStep === st.v}<small>{t('yesterday|step')}</small>{/if}
      </button>
    {/each}
  </div>
{:else if form.kind === 'scale' && form.style === 'battery'}
  <div class="ab-bat" role="group" aria-label={label}>
    {#each Array.from({ length: 10 }, (_, i) => i + 1) as v (v)}
      <button type="button" class:on={value != null && v <= value} aria-pressed={value === v} aria-label={String(v)} onclick={() => pick(v)}><span class="num">{v}</span></button>
    {/each}
  </div>
  {#if value != null}<small class="ab-cap num">{t('{n} of 10 · the number is saved', { n: value })}</small>{/if}
{:else if form.kind === 'scale'}
  <div class="ab-scale" role="group" aria-label={label}>
    {#each Array.from({ length: 10 }, (_, i) => i + 1) as v (v)}
      <button type="button" class="num" aria-pressed={value === v} onclick={() => pick(v)}>{v}</button>
    {/each}
  </div>
{:else if form.kind === 'chips' && form.style === 'emoji'}
  <div class="ab-emo" role="group" aria-label={label}>
    {#each form.options as o (o.key)}
      <button type="button" aria-pressed={pressed(o.key)} aria-label={t(EMOJI[o.key] ?? o.key)} onclick={() => (form.multi ? toggle(o.key) : pick(o.key))}>{o.label}</button>
    {/each}
  </div>
{:else if form.kind === 'chips' || form.kind === 'yesno'}
  <div class="ab-opts" role="group" aria-label={label}>
    {#each form.options as o (o.key)}
      <button type="button" class="ab-opt" aria-pressed={pressed(o.key)} onclick={() => (form.multi ? toggle(o.key) : pick(o.key))}>{optText(o)}</button>
    {/each}
  </div>
{:else if form.kind === 'number'}
  <label class="ab-num">
    <span class="sr">{label}</span>
    <input class="inp num" type="text" inputmode="decimal" autocomplete="off" {id} value={value ?? ''} oninput={(e) => (value = e.currentTarget.value.trim() === '' ? null : e.currentTarget.value)} />
    {#if form.unit}<span>{unitText(form.unit)}</span>{/if}
  </label>
{:else}
  <label>
    <span class="sr">{label}</span>
    <input class="inp ab-txt" type="text" maxlength="500" {id} value={value ?? ''} oninput={(e) => (value = e.currentTarget.value)} />
  </label>
{/if}
{#if form.note}
  <label class="ab-note">
    <span class="sr">{t('A sentence (if you like)')}</span>
    <input class="inp ab-txt" type="text" maxlength="500" placeholder={t('A sentence (if you like)')} bind:value={note} />
  </label>
{/if}

<style>
  .ab-five {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
    max-width: 560px;
  }
  .ab-five button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    min-height: 52px;
    padding: 4px 2px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-2);
    font: 600 var(--fs-small) / 1.15 var(--font-body);
    text-align: center;
    overflow-wrap: break-word;
    hyphens: auto;
    cursor: pointer;
  }
  .ab-five button.yd {
    border-style: dashed;
  }
  .ab-five small {
    color: var(--ink-3);
    font-weight: 400;
    font-size: var(--fs-label);
  }
  .ab-five button[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .ab-five button[aria-pressed='true'] small {
    color: inherit;
  }
  .ab-note {
    display: block;
    margin-top: 8px;
  }
</style>
