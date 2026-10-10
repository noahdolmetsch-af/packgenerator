<script>
  /**
   * v0.67.0 «KI-Helfer» (answers 7a, 8a): the helper's settings (#/helper, More › App › Helper).
   * Status, the Helfer-Code (only on this device, never in a backup or an export), the switch, the
   * monthly limit (default CHF 5) with this month's spend, and «Was geht an Claude?».
   */
  import { Sparkles, Check, ChevronRight } from '@lucide/svelte';
  import { t, num } from '../lib/i18n.svelte.js';
  import { helper, saveSettings, ask, errorText, isPaused, thisMonth, DEFAULT_CAP } from '../lib/helper/client.svelte.js';
  import HelperNotice from '../lib/helper/HelperNotice.svelte';
  import '../lib/helper/helper.css';

  let code = $state('');
  let show = $state(false);
  let cap = $state('');
  let msg = $state('');
  let testMsg = $state('');
  let testing = $state(false);
  let codeEl = $state();
  let seeded = false;
  $effect(() => {
    if (helper.loaded && !seeded) {
      seeded = true;
      code = helper.code;
      cap = String(helper.capChf);
    }
  });
  const setUp = $derived(!!helper.code);
  const spentChf = $derived(helper.spend?.month === thisMonth() ? helper.spend.chf : 0);
  const chf = (n) => `CHF ${Number(n).toFixed(2)}`;

  async function saveCode(e) {
    e?.preventDefault();
    const c = code.trim();
    await saveSettings({ code: c, ...(c && !helper.code ? { on: true } : {}) });
    msg = c ? t('Saved on this device.') : t('Helper code removed.');
    testMsg = '';
  }
  async function saveCap() {
    const n = Number(String(cap).replace(',', '.'));
    if (!(n > 0 && n <= 500)) return (msg = t('Monthly limit: a number of francs from 0.50 to 500.'));
    await saveSettings({ capChf: Math.round(n * 100) / 100 });
    msg = t('Saved on this device.');
  }
  async function test() {
    testing = true;
    testMsg = '';
    const r = await ask('status', {});
    testing = false;
    testMsg = r.ok ? t('Connected. This month: {chf}.', { chf: chf(r.spend?.chf ?? 0) }) : errorText(r.error, { capChf: helper.capChf });
  }
</script>

<section class="kh helper-page" aria-labelledby="helper-h">
  <h1 class="title" id="helper-h">{t('Helper')}</h1>
  <p class="page-sub">{t('Suggestions from Claude for packing lists, learnings and bike care. Everything stays changeable.')}</p>

  <div class="kh-card">
    <p class="kh-head"><span class="kh-ic"><Sparkles size={20} aria-hidden="true" /></span>{t('Status')}<span class="kh-r">{#if setUp}{helper.on ? (isPaused() ? t('paused until next month') : t('set up')) : t('switched off')}{:else}{t('not set up')}{/if}</span></p>
    {#if !setUp}
      <HelperNotice onsetup={() => codeEl?.focus()} />
    {/if}
    <form class="hp-row" onsubmit={saveCode}>
      <label class="hp-field"><span class="lbl">{t('Helper code')}</span>
        <input class="inp" bind:this={codeEl} type={show ? 'text' : 'password'} bind:value={code} autocomplete="off" spellcheck="false" placeholder={t('the long code from Vercel (HELPER_TOKEN)')} /></label>
      <button type="button" class="btn" onclick={() => (show = !show)} aria-pressed={show}>{show ? t('Hide') : t('Show')}</button>
      <button type="submit" class="btn">{t('Save')}</button>
    </form>
    <p class="kh-quiet">{t('Stored only on this device. It never goes into a backup, an export or a shared list.')}</p>
    {#if setUp}
      <label class="hp-switch"><input type="checkbox" checked={helper.on} onchange={(e) => saveSettings({ on: e.currentTarget.checked })} /> {t('Helper switched on')}</label>
      <p><button type="button" class="btn sm" disabled={testing} onclick={test}>{testing ? t('Checking …') : t('Check the connection')}</button></p>
      {#if testMsg}<p class="kh-msg" role="status">{testMsg}</p>{/if}
    {/if}
  </div>

  <div class="kh-card">
    <p class="kh-head">{t('Monthly limit')}<span class="kh-r num">{t('this month: {chf}', { chf: chf(spentChf) })}</span></p>
    <div class="hp-row">
      <label class="hp-field hp-cap"><span class="lbl">{t('Limit per month (CHF)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={cap} placeholder={String(DEFAULT_CAP)} /></label>
      <button type="button" class="btn" onclick={saveCap}>{t('Save')}</button>
    </div>
    <p class="kh-quiet">{t('When the limit is reached, the helper pauses until next month. The server has its own limit as well.')}</p>
    {#if isPaused()}<p class="kh-msg" role="status">{errorText('paused', { capChf: helper.capChf })}</p>{/if}
  </div>

  {#if msg}<p class="kh-msg" role="status"><Check size={14} aria-hidden="true" /> {msg}</p>{/if}

  <div class="kh-card">
    <details class="kh-fold hp-what" open>
      <summary><span class="kh-chev"><ChevronRight size={16} aria-hidden="true" /></span>{t('What goes to Claude?')}</summary>
      <p>{t('Only your question and the names it needs from the list and your gear, plus your notes. Never photos, receipts or health data.')}</p>
      <p>{t('Per request only what that task needs: names, categories and weights of your items, building blocks, temperature ranges, the trip conditions, your learnings and notes, and for bike care the parts with their km, intervals and last service dates. No money amounts, no shop names, no documents, never the helper code.')}</p>
      <p>{t('A request costs a few centimes.')}</p>
    </details>
  </div>
</section>

<style>
  .helper-page {
    max-width: 760px;
    display: grid;
    gap: 14px;
  }
  .helper-page > .page-sub {
    margin: -6px 0 0;
  }
  .hp-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    margin-top: 12px;
  }
  .hp-field {
    flex: 1 1 260px;
    min-width: 0;
  }
  .hp-cap {
    flex: 0 1 200px;
  }
  .hp-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    margin-top: 8px;
  }
  /* the status and this month's spend stay visible on a phone too (elsewhere .kh-r hides there) */
  .helper-page .kh-head {
    flex-wrap: wrap;
  }
  .helper-page .kh-head .kh-r {
    display: inline;
    white-space: normal;
  }
  .hp-what {
    margin-top: 0;
    border-top: 0;
    padding-top: 0;
  }
</style>
