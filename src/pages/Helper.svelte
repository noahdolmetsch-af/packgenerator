<script>
  /**
   * v0.77.0 «KI-Helfer» (answers 7a, 8a): the helper's settings (#/helper, Ich › Helfer, K1a).
   * Status, the Helfer-Code (only on this device, never in a backup or an export), the switch, the
   * monthly limit (default CHF 5) with this month's spend, and «Was geht an Claude?».
   */
  import { Sparkles, Check, ChevronRight } from '@lucide/svelte';
  import { t, num } from '../lib/i18n.svelte.js';
  import { helper, saveSettings, ask, errorText, isPaused, thisMonth, DEFAULT_CAP } from '../lib/helper/client.svelte.js';
  import HelperNotice from '../lib/helper/HelperNotice.svelte';
  import '../lib/helper/helper.css';
  import '../lib/ich/ich.css';
  import VeloHead from '../lib/bikes/VeloHead.svelte';

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

<!-- Design-Refresh P9 (I8, Noah 12.10.2026 «Runde 19 freigegeben»): the path back to Ich; left Status (with
     this month's spend as a bar), Monthly limit and Helper code (before it is set up the code comes first),
     right «What goes to Claude?» with «Never» open, and the promise. The same settings as before. -->
<div class="kh helper-page ich-page">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Helper')} sub={t('Suggestions from Claude for packing lists, learnings and bike care. Everything stays changeable.')} />

  {#snippet codeSec()}
    <!-- no region name: «Helper code» names the field below, once -->
    <section class="ich-sec">
      <div class="ich-h"><div><h2 id="hp-code-h">{t('Helper code')}</h2><p class="ich-hs">{t('Stored only on this device. It never goes into a backup, an export or a shared list.')}</p></div></div>
      <div class="card ich-body">
        {#if !setUp}<div class="hp-notice"><HelperNotice onsetup={() => codeEl?.focus()} /></div>{/if}
        <form class="hp-row" onsubmit={saveCode}>
          <label class="hp-field"><span class="lbl">{t('Helper code')}</span>
            <input class="inp" bind:this={codeEl} type={show ? 'text' : 'password'} bind:value={code} autocomplete="off" spellcheck="false" placeholder={t('the long code from Vercel (HELPER_TOKEN)')} /></label>
          <button type="button" class="btn" onclick={() => (show = !show)} aria-pressed={show}>{show ? t('Hide') : t('Show')}</button>
          <button type="submit" class="btn">{t('Save')}</button>
          {#if setUp}<button type="button" class="btn" onclick={() => ((code = ''), saveCode())}>{t('Remove')}</button>{/if}
        </form>
      </div>
    </section>
  {/snippet}

  <div class="ich-cols">
    <div class="ich-main">
      {#if !setUp}{@render codeSec()}{/if}

      <section class="ich-sec" aria-labelledby="hp-status-h">
        <div class="ich-h"><div><h2 id="hp-status-h">{t('Status')}</h2></div></div>
        <div class="card ich-body">
          <div class="hp-st">
            <span class="hp-dot" class:on={setUp && helper.on && !isPaused()} class:warn={setUp && isPaused()} aria-hidden="true"></span>
            <span class="ich-m"><b>{#if setUp}{helper.on ? (isPaused() ? t('paused until next month') : t('set up')) : t('switched off')}{:else}{t('not set up')}{/if}</b><small><span class="num">{t('this month: {chf}', { chf: chf(spentChf) })}</span> · {t('of {chf}', { chf: chf(helper.capChf ?? DEFAULT_CAP) })} · {t('A request costs a few centimes.')}</small></span>
            {#if setUp}<button type="button" class="btn" disabled={testing} onclick={test}>{testing ? t('Checking …') : t('Check the connection')}</button>{/if}
          </div>
          <div class="hp-bar" aria-hidden="true"><i style:width="{Math.min(100, Math.round((spentChf / (helper.capChf || DEFAULT_CAP)) * 100))}%"></i></div>
          {#if setUp}<label class="hp-switch"><input type="checkbox" checked={helper.on} onchange={(e) => saveSettings({ on: e.currentTarget.checked })} /> {t('Helper switched on')}</label>{/if}
          {#if testMsg}<p class="kh-msg" role="status">{testMsg}</p>{/if}
        </div>
      </section>

      <section class="ich-sec" aria-labelledby="hp-cap-h">
        <div class="ich-h"><div><h2 id="hp-cap-h">{t('Monthly limit')}</h2><p class="ich-hs">{t('When the limit is reached, the helper pauses until next month. The server has its own limit as well.')}</p></div></div>
        <div class="card ich-body">
          <div class="hp-row">
            <label class="hp-field hp-cap"><span class="lbl">{t('Limit per month (CHF)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={cap} placeholder={String(DEFAULT_CAP)} /></label>
            <button type="button" class="btn" onclick={saveCap}>{t('Save')}</button>
          </div>
          {#if isPaused()}<p class="kh-msg" role="status">{errorText('paused', { capChf: helper.capChf })}</p>{/if}
        </div>
      </section>

      {#if setUp}{@render codeSec()}{/if}
      {#if msg}<p class="kh-msg" role="status"><Check size={14} aria-hidden="true" /> {msg}</p>{/if}
    </div>

    <div class="ich-side">
      <section class="ich-sec" aria-labelledby="hp-what-h">
        <div class="ich-h"><div><h2 id="hp-what-h">{t('What goes to Claude?')}</h2></div></div>
        <div class="card ich-list">
          <details class="hp-fold">
            <summary><b>{t('Per request only what is needed')}</b><ChevronRight class="ich-chev" size={16} aria-hidden="true" /></summary>
            <p>{t('Per request only what that task needs: names, categories and weights of your items, building blocks, temperature ranges, the trip conditions, your learnings and notes, and for bike care the parts with their km, intervals and last service dates. No money amounts, no shop names, no documents, never the helper code.')}</p>
          </details>
          <details class="hp-fold" open>
            <summary><b>{t('Never|claude')}</b><small>{t('never to Claude')}</small><ChevronRight class="ich-chev" size={16} aria-hidden="true" /></summary>
            <p>{t('Only your question and the names it needs from the list and your gear, plus your notes. Never photos, receipts or health data.')}</p>
          </details>
        </div>
      </section>
      <p class="ich-fine"><Sparkles size={16} aria-hidden="true" /><span>{t('The helper only suggests when you ask.')}</span></p>
    </div>
  </div>
</div>

<style>
  .helper-page {
    max-width: 1100px;
  }
  .hp-notice {
    margin: 0 0 12px;
  }
  .hp-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
  }
  .hp-field {
    flex: 1 1 240px;
    min-width: 0;
  }
  .hp-cap {
    flex: 0 1 200px;
  }
  .hp-st {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .hp-dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--line);
  }
  .hp-dot.on {
    background: var(--ok);
  }
  .hp-dot.warn {
    background: var(--warn);
  }
  .hp-bar {
    height: 8px;
    margin: 12px 0 0;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .hp-bar i {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--accent);
  }
  .hp-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    margin-top: 8px;
  }
  .hp-fold + .hp-fold {
    border-top: 1px solid var(--line);
  }
  .hp-fold summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 10px;
    min-height: 52px;
    padding: 8px 0;
    box-sizing: border-box;
    list-style: none;
    cursor: pointer;
  }
  .hp-fold summary::-webkit-details-marker {
    display: none;
  }
  .hp-fold summary b {
    font-weight: 600;
  }
  .hp-fold summary small {
    flex: 1;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hp-fold summary :global(.ich-chev) {
    margin-left: auto;
    color: var(--ink-3);
  }
  .hp-fold[open] summary :global(.ich-chev) {
    transform: rotate(90deg);
  }
  .hp-fold p {
    margin: 0 0 14px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.5;
  }
</style>
