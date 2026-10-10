<script>
  /**
   * v0.72.0 «Feinschliff» (Umbenennen 1a–5a, Noah 10.10.2026): ONE sheet to rename a thing, the same
   * everywhere (bike, bag, gear item, building block, Im Flow activity). On a phone it comes from
   * below and sits right above the keyboard (visualViewport), on a computer it is a small window.
   * Only the name: the field has the cursor, ✕ empties it, the keyboard's key says «Done» and saves
   * (enterkeyhint), Android back and Escape save too (like notes), ✕ and «Cancel» leave it as it was.
   * After a save the caller offers «Renamed to … · Undo» for 10 s (rename.svelte.js).
   *
   * kicker: what it is («Bike»); title: «Rename bike»; value: the name now; hint: one sentence where
   * the name counts; empty: what an empty name means (a built-in block goes back to its own name),
   * or '' when a name is needed; onsave(name): saves, may return false to stay open or a text to show as the error; extra: an
   * optional snippet under the hint (e.g. a link to the other details).
   */
  import { tick } from 'svelte';
  import { X } from '@lucide/svelte';
  import { backClose } from './backclose.js';
  import { t } from '../i18n.svelte.js';

  let { kicker = '', title, value = '', hint = '', empty = '', max = 80, onsave, onclose, extra = null } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(value ?? '');
  let error = $state('');
  let busy = false;
  let dialog;
  let input;
  let lift = $state(0); // px the keyboard covers at the bottom (phone)

  $effect(() => {
    dialog.showModal();
    tick().then(() => {
      input?.focus();
      input?.select();
    });
    // the keyboard makes the visual viewport smaller but not the page: lift the sheet above it
    const vv = window.visualViewport;
    if (!vv) return;
    const fit = () => (lift = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    fit();
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
    return () => {
      vv.removeEventListener('resize', fit);
      vv.removeEventListener('scroll', fit);
    };
  });

  async function save(e) {
    e?.preventDefault();
    if (busy) return;
    const next = name.trim();
    if (!next && !empty) {
      error = t('Give it a name.');
      input?.focus();
      return;
    }
    if (next === String(value ?? '').trim()) return dialog.close();
    busy = true;
    try {
      const ok = await onsave?.(next);
      if (ok === false) return;
      if (typeof ok === 'string') return (error = ok); // e.g. the name is taken
      dialog.close();
    } finally {
      busy = false;
    }
  }

  // Android back and Escape keep the typed name (saved like «Save»); a needed name that is empty: close.
  const keep = () => (name.trim() || empty ? save() : dialog.close());
</script>

<dialog class="sheet from-below rename" bind:this={dialog} use:backClose={keep} onclose={() => onclose?.()} style:margin-bottom={lift ? `${lift}px` : null} aria-labelledby="rn-h">
  <form onsubmit={save} novalidate>
    <div class="head">
      <div>
        {#if kicker}<p class="kick">{kicker}</p>{/if}
        <h2 id="rn-h">{title}</h2>
      </div>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <div class="fld">
      <label class="lbl" for="rn-in">{t('Name')}</label>
      <span class="box">
        <input id="rn-in" class="inp" bind:this={input} bind:value={name} enterkeyhint="done" autocomplete="off" maxlength={max} oninput={() => (error = '')} placeholder={empty} />
        {#if name}<button type="button" class="clr" aria-label={t('Clear the name')} onclick={() => ((name = ''), input?.focus())}><span class="dot"><X size={16} aria-hidden="true" /></span></button>{/if}
      </span>
    </div>
    {#if error}<p class="err" role="alert">{error}</p>{:else if hint}<p class="hint">{hint}</p>{/if}
    {#if extra}{@render extra()}{/if}
    <div class="foot">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  .rename {
    width: min(440px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  .kick {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .fld {
    display: grid;
    gap: 4px;
  }
  .box {
    position: relative;
    display: block;
  }
  .box .inp {
    width: 100%;
    min-height: 48px;
    padding-right: 52px;
    font-size: var(--fs-sub);
  }
  .clr {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .dot {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: var(--paper-2);
  }
  .hint,
  .err {
    margin: 6px 0 0;
    font-size: var(--fs-small);
    line-height: 1.4;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .err {
    color: var(--bad);
  }
  .foot {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 719px) {
    .foot .btn.hi {
      flex: 1;
    }
  }
</style>
