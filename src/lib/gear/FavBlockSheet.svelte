<script>
  /**
   * SN5+ F4 «Als Baustein speichern» (mockup SN5p-als-baustein, Noah 13.10.2026 answer 3a): the favourites
   * of one trip kind as an own building block, a COPY. The name is suggested and can be changed; every
   * favourite is chosen, a tap leaves one out; the count and the weight below. On a phone a sheet from
   * below, on a computer a small window. «Abbrechen» leaves everything as it was.
   *
   * kind: the trip kind's name (shown); items: its favourites; onsave(name, ids): may return a text
   * (the error, e.g. the name is taken) to stay open; onclose().
   */
  import { tick } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { X, Check, Info } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { formatWeight, itemWeight, CATEGORY } from '../gear.js';
  import { catIcon } from './caticon.js';
  import '../ui/daumen.css'; // FE1: Save stays at the bottom edge of the window on a phone

  let { kind = '', items = [], onsave, onclose } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(t('Favourites {kind}', { kind }));
  // svelte-ignore state_referenced_locally
  const picked = new SvelteSet(items.map((i) => i.id));
  const chosen = $derived(items.filter((i) => picked.has(i.id)));
  const grams = $derived(chosen.reduce((g, i) => g + (itemWeight(i) ?? 0), 0));
  let error = $state('');
  let busy = false;
  let dialog;
  let input;

  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });
  const flip = (id) => (picked.has(id) ? picked.delete(id) : picked.add(id));

  async function save(e) {
    e?.preventDefault();
    if (busy) return;
    if (!name.trim()) return ((error = t('Give the building block a name.')), input?.focus());
    busy = true;
    try {
      const res = await onsave?.(name.trim(), chosen.map((i) => i.id));
      if (typeof res === 'string') return (error = res);
      dialog.close();
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet from-below favblk" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="fb-h">
  <form onsubmit={save} novalidate>
    <div class="head">
      <div>
        <h2 id="fb-h">{t('Save as building block')}</h2>
        <p class="sub">{tn(items.length, '{kind} · from your {n} favourite', '{kind} · from your {n} favourites', { kind })}</p>
      </div>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    <div class="fld">
      <label class="lbl" for="fb-in">{t('Name')}</label>
      <input id="fb-in" class="inp" bind:this={input} bind:value={name} autocomplete="off" maxlength="80" oninput={() => (error = '')} />
    </div>
    <p class="lbl parts">{t('Items')} <small>{t('all chosen, tap to leave one out')}</small></p>
    <ul class="list" aria-label={t('Items')}>
      {#each items as i (i.id)}
        {@const Icon = catIcon(i.category)}
        <li>
          <label class="row" class:off={!picked.has(i.id)}>
            <input type="checkbox" class="sr" checked={picked.has(i.id)} onchange={() => flip(i.id)} />
            <span class="ck" aria-hidden="true">{#if picked.has(i.id)}<Check size={16} strokeWidth={3} />{/if}</span>
            <span class="sib" aria-hidden="true"><Icon size={18} /></span>
            <span class="nm"><b>{nameOf(i)}</b><small>{CATEGORY[i.category] ? t(CATEGORY[i.category].name) : ''}</small></span>
            <span class="w num">{i.weightG == null ? t('not weighed') : formatWeight(itemWeight(i))}</span>
          </label>
        </li>
      {/each}
    </ul>
    <p class="sum num"><span>{tn(chosen.length, '{n} item', '{n} items')}</span><b>{formatWeight(grams)}</b></p>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <p class="hint"><Info size={15} aria-hidden="true" /><span>{t('Afterwards under Gear › Building blocks, one tap when you make a {kind} trip. Your stars stay as they are.', { kind })}</span></p>
    <div class="foot daumen-foot">
      <button type="button" class="btn btn-link" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" disabled={!chosen.length}><Check size={17} aria-hidden="true" />{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .favblk {
    width: min(560px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    cursor: pointer;
  }
  .fld {
    display: grid;
    gap: 4px;
  }
  .fld .inp {
    width: 100%;
    min-height: 48px;
  }
  .parts {
    margin: 14px 0 6px;
  }
  .parts small {
    margin-left: 6px;
    color: var(--ink-3);
    font-weight: 400;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    max-height: min(46vh, 360px);
    overflow-y: auto;
  }
  .list li + li {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 6px 12px;
    cursor: pointer;
  }
  .row.off .nm,
  .row.off .w {
    color: var(--ink-3);
  }
  .ck {
    flex: none;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 1.5px solid var(--line-strong);
    border-radius: 6px;
    color: var(--paper);
  }
  .row:not(.off) .ck {
    background: var(--brand, var(--ink));
    border-color: var(--brand, var(--ink));
  }
  .row:focus-within .ck {
    outline: 2px solid var(--focus, var(--ink));
    outline-offset: 2px;
  }
  .sib {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .nm {
    flex: 1;
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .w {
    flex: none;
    color: var(--ink-2);
  }
  .sum {
    display: flex;
    justify-content: space-between;
    margin: 8px 12px 0;
  }
  .hint,
  .err {
    display: flex;
    gap: 8px;
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .hint :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .err {
    color: var(--bad);
  }
  .foot {
    display: flex;
    justify-content: flex-end;
    align-items: center;
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
