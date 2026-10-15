<script>
  /**
   * AB3 / AB5 «Deine Abfragen»: the answer of one question, one tap where it can be (Noah «je ein Tipp,
   * alles überspringbar»). 1–10 as numbers or as a battery, chips (emoji as round buttons), ja / nein,
   * a number with its unit, a sentence; a scale or chips can have a sentence besides («+ 1 Satz»).
   * value and note are bindable; a second tap on the chosen answer takes it back.
   */
  import { t } from '../i18n.svelte.js';
  import { optText, unitText } from './words.js';

  let { q, value = $bindable(), note = $bindable(), id, label = '' } = $props();
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

{#if form.kind === 'scale' && form.style === 'battery'}
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
  .ab-note {
    display: block;
    margin-top: 8px;
  }
</style>
