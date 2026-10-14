<script>
  /**
   * «Inhalte Flow» IF3 (mockup approved 14.10.2026 04:32): every tip of a page; each can be switched off,
   * tips can be switched off everywhere, own tips can be added and deleted. Also the switch for the fold
   * «What the app can do here», so a hidden fold comes back here. WD1 (approved 18:34, «1a»): on top the
   * choice «Only useful tips / Also knowledge and fun» for all pages (knowledge on at first); each tip
   * carries its tag, a «Passt zu heute» tip says when it comes.
   */
  import { X, Plus, Trash2 } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import KindTag from './KindTag.svelte';
  import { pageInfo, dayContext } from './store.svelte.js';
  import { tipOfDay, allTips, setTip, setTipsOn, setKnowOn, addTip, removeTip, setCan, canShown, PAGES } from '../pageinfo.js';
  import { backClose } from '../ui/backclose.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  let { page, name, onclose } = $props();
  const pi = pageInfo();
  const today = localDay();
  const dc = dayContext(today);
  const tip = $derived(tipOfDay(pi.info, page, today, dc.ctx));
  const tips = $derived(allTips(pi.info, page));
  const tipText = (x) => (x.own ? x.text : t(x.text));
  let dialog;
  let draft = $state('');
  $effect(() => {
    dialog.showModal();
  });
  function add(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft;
    pi.save((v) => addTip(v, page, text));
    draft = '';
  }
</script>

<dialog class="sheet from-below tips" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="tips-h" data-sheet="tips">
  <div class="head">
    <div>
      <h2 id="tips-h">{t('Tips for {page}', { page: name })}</h2>
      <p class="sub">{t('One comes onto the page each day. Own words, only suggestions.')}</p>
    </div>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="what" data-know>
    <p class="wh"><b id="tips-what">{t('What should come?')}</b><small>{t('Applies to all pages')}</small></p>
    <Seg labelledby="tips-what" value={pi.info.knowOn ? 'know' : 'tips'} options={[{ key: 'tips', name: t('Only useful tips') }, { key: 'know', name: t('Also knowledge and fun') }]} onchange={(k) => pi.save((v) => setKnowOn(v, k === 'know'))} />
  </div>
  <ul>
    {#each tips as x (x.id)}
      <li class:now={tip?.id === x.id} data-tip-row={x.id}>
        <span class="tx"><span>{#if x.kind !== 'tip' || tips.some((y) => y.kind !== 'tip')}<KindTag kind={x.kind} />{/if}{tipText(x)}</span>{#if x.kind === 'today'}<small>{t(x.note)}</small>{/if}{#if tip?.id === x.id}<small>{t('today|tip')}</small>{:else if !x.on}<small>{t('hidden|tip')}</small>{/if}</span>
        {#if x.own}<button type="button" class="ib sm" aria-label={t('Delete the own tip')} onclick={() => pi.save((v) => removeTip(v, page, x.id))}><Trash2 size={16} aria-hidden="true" /></button>{/if}
        <label class="sw"><input type="checkbox" role="switch" checked={x.on} onchange={(e) => ((on) => pi.save((v) => setTip(v, x.id, on)))(e.currentTarget.checked)} /><span class="vh">{t('Show this tip')}</span></label>
      </li>
    {/each}
    <li class="all">
      <span class="tx"><b>{t('Show tips on all pages')}</b><small>{t('Off: no tip line any more, the list stays here')}</small></span>
      <label class="sw"><input type="checkbox" role="switch" data-tips-all checked={pi.info.tipsOn} onchange={(e) => ((on) => pi.save((v) => setTipsOn(v, on)))(e.currentTarget.checked)} /><span class="vh">{t('Show tips on all pages')}</span></label>
    </li>
    {#if PAGES[page]?.can?.length}
      <li class="all">
        <span class="tx"><b>{t('Show «What the app can do here»')}</b></span>
        <label class="sw"><input type="checkbox" role="switch" data-can-show checked={canShown(pi.info, page)} onchange={(e) => ((on) => pi.save((v) => setCan(v, page, on)))(e.currentTarget.checked)} /><span class="vh">{t('Show «What the app can do here»')}</span></label>
      </li>
    {/if}
  </ul>
  <form class="own" onsubmit={add}>
    <input class="inp" bind:value={draft} maxlength="240" placeholder={t('Own tip')} aria-label={t('Own tip')} enterkeyhint="done" />
    <button type="submit" class="btn" disabled={!draft.trim()}><Plus size={16} aria-hidden="true" />{t('Add|tip')}</button>
  </form>
</dialog>

<style>
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .sub,
  .tx small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .tips {
    width: min(480px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .sub {
    margin: 4px 0 0;
  }
  .what {
    display: grid;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .wh {
    margin: 0;
    display: grid;
  }
  .wh small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  ul {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 6px;
    border-top: 1px solid var(--line);
  }
  li.now {
    background: var(--paper-2);
    border-radius: 10px;
  }
  .tx {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .sw input {
    width: 22px;
    height: 22px;
    margin: 2px 0 0;
    accent-color: var(--hi);
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .own {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .own .inp {
    flex: 1;
    min-width: 0;
  }
</style>
