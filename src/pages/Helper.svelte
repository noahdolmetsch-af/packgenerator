<script>
  /**
   * v0.77.0 «KI-Helfer» (answers 7a, 8a): the helper's settings (#/helper, Ich › Helfer, K1a).
   * v0.118.0 «KI-Helfer ausblenden» (mockup K4, Noah 12.10.2026 «k1-k4 ok», answer a ★): Ich › KI-Helfer.
   * On top ONE switch «Show the AI helper in the app» (default off): off, the helper shows nowhere; on,
   * every place comes back at once. Below the six places with «on»/«off». Beside it «Setup», which stays
   * when it is off: the key (code, check), the monthly limit with this month's spend, «What goes to Claude?».
   * The code is only on this device, never in a backup or an export.
   * 15.10.2026 (Noah «1b 2a, wobei nutzer dies ändern kann im frontend»): limit CHF 2 by default, and a
   * «Model» fold: Sonnet 5.5 (default) or Haiku 5.5; saved on this device, sent with every request.
   * Noah «3b» then «erstelle selber einen vorschlag»: the fold «Usage and costs» explains when it costs,
   * what a request costs (estimate), how the limit, the switch and the model keep the costs low.
   * Impeccable Runde 2: first set up, then switch on. Without a key a card on top says «Set up in 2 steps»
   * (copy the code from Vercel, paste it here and «Save code»), then «Check the connection» in the same card;
   * the switch and the places follow below. The second «What goes to Claude?» (in the notice) is gone; the one
   * in the setup stays.
   */
  import { Sparkles, Check, ChevronRight, Route, Backpack, BookOpen, Bike, Search, Sun, Scale, TriangleAlert, KeyRound, Cpu, Coins } from '@lucide/svelte';
  import { t } from '../lib/i18n.svelte.js';
  import { helper, saveSettings, ask, errorText, isPaused, noCredit, thisMonth, DEFAULT_CAP, MODELS } from '../lib/helper/client.svelte.js';
  import { HELPER_PLACES } from '../lib/helper/places.js';
  import '../lib/helper/helper.css';
  import '../lib/ich/ich.css';
  import VeloHead from '../lib/bikes/VeloHead.svelte';

  const PLACE_ICON = { route: Route, backpack: Backpack, book: BookOpen, bike: Bike, search: Search, sun: Sun };
  let code = $state('');
  let reveal = $state(false);
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
  // Impeccable Runde 2: the card «Set up in 2 steps» stays after saving in this visit, for «Check the connection»
  let justSaved = $state(false);
  const steps = $derived(helper.loaded && (!setUp || justSaved));
  const shown = $derived(helper.show);
  const spentChf = $derived(helper.spend?.month === thisMonth() ? helper.spend.chf : 0);
  const chf = (n) => `CHF ${Number(n).toFixed(2)}`;
  const capLine = $derived(isPaused() ? t('paused until next month') : spentChf > 0 ? t('{chf} used this month', { chf: chf(spentChf) }) : t('as set · nothing used this month'));

  async function saveCode(e) {
    e?.preventDefault();
    const c = code.trim();
    await saveSettings({ code: c });
    msg = c ? t('Saved on this device.') : t('Helper code removed.');
    testMsg = '';
    if (c && steps) justSaved = true;
  }
  async function saveCap() {
    const n = Number(String(cap).replace(',', '.'));
    if (!(n > 0 && n <= 500)) return (msg = t('Monthly limit: a number of francs from 0.50 to 500.'));
    await saveSettings({ capChf: Math.round(n * 100) / 100 });
    msg = t('Saved on this device.');
  }
  const modelName = $derived(MODELS.find((m) => m.id === helper.model)?.name ?? MODELS[0].name);
  async function saveModel(id) {
    await saveSettings({ model: id });
    msg = t('Saved on this device.');
  }
  async function test() {
    testing = true;
    testMsg = '';
    const r = await ask('status', {}, { probe: noCredit() });
    testing = false;
    testMsg = r.ok && noCredit() ? errorText('no_credit') : r.ok ? t('Connected. This month: {chf}.', { chf: chf(r.spend?.chf ?? 0) }) : errorText(r.error, { capChf: helper.capChf });
  }
</script>

<div class="kh helper-page ich-page">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('AI helper')} sub={t('Suggestions from Claude, only if you want them. Without it everything works as before.')} />

  <div class="ich-cols">
    <div class="ich-main">
      {#if steps}
        <!-- Impeccable Runde 2: first set up (2 steps), then switch on -->
        <section class="ich-sec" aria-labelledby="hp-steps-h" data-setup-steps>
          <div class="ich-h"><div><h2 id="hp-steps-h">{t('Set up in 2 steps')}</h2><p class="ich-hs">{t('once; the code stays only on this device')}</p></div></div>
          <div class="card hp-card hp-steps">
            <ol class="hp-ol">
              <li>{t('Copy the helper code from your Vercel project (Settings › Environment Variables › HELPER_TOKEN).')}</li>
              <li>{t('Paste it here and tap «Save code».')}</li>
            </ol>
            {#if setUp}
              <p class="hp-done"><Check size={18} aria-hidden="true" /><b>{t('Key saved')}</b></p>
              <div class="ich-acts"><button type="button" class="btn hi" disabled={testing} onclick={test}>{testing ? t('Checking …') : t('Check the connection')}</button></div>
              {#if testMsg}<p class="kh-msg" role="status">{testMsg}</p>{/if}
            {:else}
              <form class="hp-row" onsubmit={saveCode}>
                <label class="hp-field"><span class="lbl">{t('Helper code')}</span>
                  <input class="inp" bind:this={codeEl} type={reveal ? 'text' : 'password'} bind:value={code} autocomplete="off" spellcheck="false" placeholder={t('the long code from Vercel (HELPER_TOKEN)')} /></label>
                <button type="button" class="btn" onclick={() => (reveal = !reveal)} aria-pressed={reveal}>{reveal ? t('Hide') : t('Show')}</button>
                <button type="submit" class="btn hi">{t('Save code')}</button>
              </form>
            {/if}
          </div>
        </section>
      {/if}

      <!-- K4: the one switch -->
      <section class="ich-sec" aria-labelledby="hp-show-h">
        <div class="ich-h"><div><h2 id="hp-show-h">{t('AI helper')}</h2></div></div>
        <div class="card hp-card ich-list">
          <label class="ich-row hp-show">
            <span class="ich-ib hp-spark"><Sparkles size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{t('Show the AI helper in the app')}</b><small>{shown ? (setUp ? t('On: it shows in the places below.') : t('On: it shows as soon as the key is saved.')) : t('Off: it shows nowhere. Your key and your settings stay stored.')}</small></span>
            <input type="checkbox" role="switch" class="hp-sw" checked={shown} disabled={!helper.loaded} onchange={(e) => saveSettings({ show: e.currentTarget.checked })} />
          </label>
          {#if noCredit()}<p class="kh-msg hp-credit" role="status" data-hp="credit">{t('The AI credit is used up. Everything else works as usual.')} {t('The helper is hidden everywhere until the credit is topped up; it comes back by itself.')}</p>{/if}
        </div>
      </section>

      <!-- K4: the places, all at once -->
      <section class="ich-sec" aria-labelledby="hp-where-h">
        <div class="ich-h"><div><h2 id="hp-where-h">{t('Where it shows when it is on')}</h2><p class="ich-hs">{shown ? t('{n} places · all shown', { n: HELPER_PLACES.length }) : t('{n} places · all hidden now', { n: HELPER_PLACES.length })}</p></div></div>
        <ul class="card hp-card ich-list hp-places" class:off={!shown}>
          {#each HELPER_PLACES as p (p.key)}
            {@const Icon = PLACE_ICON[p.icon]}
            <li class="ich-row" data-helper-place={p.key}>
              <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t(p.name)}</b><small>{t(p.what)}</small></span>
              <span class="pill hp-pill" class:on={shown}>{shown ? t('on|helper') : t('off|helper')}</span>
            </li>
          {/each}
        </ul>
      </section>
      {#if msg}<p class="kh-msg" role="status"><Check size={14} aria-hidden="true" /> {msg}</p>{/if}
    </div>

    <div class="ich-side">
      <!-- K4: the setup stays, also when it is off -->
      <section class="ich-sec" aria-labelledby="hp-setup-h">
        <div class="ich-h"><div><h2 id="hp-setup-h">{t('Setup|helper')}</h2><p class="ich-hs">{t('stays, even when it is off')}</p></div></div>
        <div class="card hp-card ich-list">
          {#if !steps}
          <details class="hp-fold">
            <summary class="ich-row">
              <span class="ich-ib">{#if setUp}<Check size={18} aria-hidden="true" />{:else}<KeyRound size={18} aria-hidden="true" />{/if}</span>
              <span class="ich-m"><b>{setUp ? t('Key saved') : t('No key yet')}</b><small>{setUp ? t('set up') : t('not set up')}</small></span>
              <ChevronRight class="ich-chev hp-tri" size={18} aria-hidden="true" />
            </summary>
            <div class="hp-in">
              <p class="hp-help">{t('Stored only on this device. It never goes into a backup, an export or a shared list.')}</p>
              <form class="hp-row" onsubmit={saveCode}>
                <label class="hp-field"><span class="lbl">{t('Helper code')}</span>
                  <input class="inp" bind:this={codeEl} type={reveal ? 'text' : 'password'} bind:value={code} autocomplete="off" spellcheck="false" placeholder={t('the long code from Vercel (HELPER_TOKEN)')} /></label>
                <button type="button" class="btn" onclick={() => (reveal = !reveal)} aria-pressed={reveal}>{reveal ? t('Hide') : t('Show')}</button>
                <button type="submit" class="btn">{t('Save')}</button>
                {#if setUp}<button type="button" class="btn" onclick={() => ((code = ''), saveCode())}>{t('Remove')}</button>{/if}
              </form>
              {#if setUp}<div class="ich-acts hp-check"><button type="button" class="btn" disabled={testing} onclick={test}>{testing ? t('Checking …') : t('Check the connection')}</button></div>{/if}
              {#if testMsg}<p class="kh-msg" role="status">{testMsg}</p>{/if}
            </div>
          </details>
          {/if}
          <details class="hp-fold" open={isPaused()}>
            <summary class="ich-row">
              <span class="ich-ib"><Scale size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Monthly limit')}</b><small>{capLine}</small></span>
              <ChevronRight class="ich-chev hp-tri" size={18} aria-hidden="true" />
            </summary>
            <div class="hp-in">
              <p class="hp-help"><span class="num">{t('this month: {chf}', { chf: chf(spentChf) })}</span> · {t('of {chf}', { chf: chf(helper.capChf ?? DEFAULT_CAP) })} · {t('A request costs a few centimes.')}</p>
              <div class="hp-bar" aria-hidden="true"><i style:width="{Math.min(100, Math.round((spentChf / (helper.capChf || DEFAULT_CAP)) * 100))}%"></i></div>
              <p class="hp-help">{t('When the limit is reached, the helper pauses until next month. The server has its own limit as well.')}</p>
              <div class="hp-row">
                <label class="hp-field hp-cap"><span class="lbl">{t('Limit per month (CHF)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={cap} placeholder={String(DEFAULT_CAP)} /></label>
                <button type="button" class="btn" onclick={saveCap}>{t('Save')}</button>
              </div>
              {#if isPaused()}<p class="kh-msg" role="status">{errorText('paused', { capChf: helper.capChf })}</p>{/if}
            </div>
          </details>
          <details class="hp-fold" data-hp="costs">
            <summary class="ich-row">
              <span class="ich-ib"><Coins size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Usage and costs')}</b><small>{t('a few centimes per request, estimate')}</small></span>
              <ChevronRight class="ich-chev hp-tri" size={18} aria-hidden="true" />
            </summary>
            <div class="hp-in">
              <p class="hp-help"><b>{t('When it costs|helper')}</b> · {t('Only when the helper asks Claude: when you tap a helper button, ask a question in the search that ends with «?», or open bike care (at most once a day per bike, and only when something changed).')}</p>
              <p class="hp-help"><b>{t('How much|helper')}</b> · {t('A request usually costs 1 to 5 centimes, at most about 11. About 100 requests a month: CHF 1.50 to 4 with Sonnet 5.5, CHF 0.10 to 0.20 with Haiku 5.5.')}</p>
              <p class="hp-help"><b>{t('Who pays|helper')}</b> · {t('Your credit at Anthropic. When it is used up, the helper stops answering and nothing more is charged.')}</p>
              <p class="hp-help"><b>{t('Your limit|helper')}</b> · {t('At {cap} a month the helper pauses until next month. This month: about {chf}.', { cap: chf(helper.capChf ?? DEFAULT_CAP), chf: chf(spentChf) })}</p>
              <p class="hp-help"><b>{t('Free|helper')}</b> · {t('Switched off, offline or paused, the app never asks Claude. Everything else in the app stays free.')}</p>
              <p class="hp-help"><b>{t('Tip|helper')}</b> · {t('Haiku 5.5 is enough for short questions and is about 20 times cheaper. You can switch under «Model».')}</p>
              <p class="hp-help">{t('All amounts are estimates. The exact bill is in the Anthropic console.')}</p>
            </div>
          </details>
          <details class="hp-fold" data-hp="model">
            <summary class="ich-row">
              <span class="ich-ib"><Cpu size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('Model')}</b><small>{modelName}</small></span>
              <ChevronRight class="ich-chev hp-tri" size={18} aria-hidden="true" />
            </summary>
            <div class="hp-in">
              <fieldset class="hp-models">
                <legend class="hp-help">{t('Which Claude answers. You can switch any time.')}</legend>
                {#each MODELS as m (m.id)}
                  <label class="hp-model">
                    <input type="radio" name="hp-model" value={m.id} checked={helper.model === m.id} disabled={!helper.loaded} onchange={() => saveModel(m.id)} />
                    <span class="ich-m"><b>{m.name}</b><small>{t(m.what)}</small></span>
                  </label>
                {/each}
              </fieldset>
            </div>
          </details>
          <details class="hp-fold">
            <summary class="ich-row">
              <span class="ich-ib"><TriangleAlert size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t('What goes to Claude?')}</b><small>{t('only your question and the names it needs')}</small></span>
              <ChevronRight class="ich-chev hp-tri" size={18} aria-hidden="true" />
            </summary>
            <div class="hp-in">
              <p class="hp-help">{t('Per request only what that task needs: names, categories and weights of your items, building blocks, temperature ranges, the trip conditions, your learnings and notes, and for bike care the parts with their km, intervals and last service dates. No money amounts, no shop names, no documents, never the helper code.')}</p>
              <p class="hp-help"><b>{t('Never|claude')}</b> · {t('Only your question and the names it needs from the list and your gear, plus your notes. Never photos, receipts or health data.')}</p>
            </div>
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
  .hp-card {
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
  }
  .hp-show {
    cursor: pointer;
  }
  .hp-models {
    margin: 0;
    padding: 0;
    border: 0;
    display: grid;
    gap: 8px;
  }
  .hp-model {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
  }
  .hp-model input {
    margin-top: 3px;
    accent-color: var(--hi);
  }
  .hp-spark {
    background: var(--hi-soft);
    color: var(--hi);
  }
  .hp-sw {
    appearance: none;
    flex: none;
    position: relative;
    width: 44px;
    height: 26px;
    margin: 0;
    border-radius: 999px;
    background: var(--line);
    cursor: pointer;
    transition: background 0.15s;
  }
  .hp-sw::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: transform 0.15s;
  }
  .hp-sw:checked {
    background: var(--hi);
  }
  .hp-sw:checked::after {
    transform: translateX(18px);
  }
  .hp-sw:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .hp-places.off .ich-m,
  .hp-places.off .ich-ib {
    opacity: 0.72;
  }
  .hp-pill {
    flex: none;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .hp-pill.on {
    background: var(--hi-soft);
    color: var(--hi);
  }
  .hp-fold[open] > summary :global(.hp-tri) {
    transform: rotate(90deg);
  }
  .hp-in {
    padding: 0 0 14px;
  }
  .hp-help {
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.5;
    overflow-wrap: break-word;
  }
  /* Impeccable Runde 2: «Set up in 2 steps» */
  .hp-steps {
    padding: 16px 18px;
  }
  .hp-ol {
    margin: 0 0 14px;
    padding-left: 1.4em;
    color: var(--ink);
    line-height: 1.5;
  }
  .hp-ol li + li {
    margin-top: 6px;
  }
  .hp-ol li {
    overflow-wrap: break-word;
  }
  .hp-done {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    color: var(--ok);
  }
  .hp-check {
    margin-top: 10px;
  }
  .hp-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
  }
  .hp-field {
    flex: 1 1 200px;
    min-width: 0;
  }
  .hp-cap {
    flex: 0 1 200px;
  }
  .hp-bar {
    height: 8px;
    margin: 0 0 12px;
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
</style>
