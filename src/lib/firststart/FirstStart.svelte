<script>
  /**
   * «Erster Start» (Noah 14.10.2026 decision 5 «passt», 20.10.2026 «2a sofort und wir machen b auch»): a new, empty
   * app asks once. Noah 23.11.2026 «1-5a» (V1): one window, no second and third step. The main button puts the
   * examples in (all interests on), «Start empty» and «I already use the app on another device» are quiet, and
   * «Later» closes it (it then asks again on the next start; × / Escape / back do the same). The choice of the
   * interests moved to Me › Data and backup › «Adjust the examples»; the short tour is offered on Heute (Neu hier)
   * and in the handbook, not here. Mounted by main.js after the start-up tidy-up, so it only ever sees a finished
   * database. The language can be switched right here (the examples are written in it).
   */
  import { onMount } from 'svelte';
  import { Bike, Check, Wrench } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, lang, setLang } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { settling } from '../settled.js';
  import { tidyData } from '../tidy.js';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { isFresh, chooseStart } from '../firststart.js';
  import '../bikes/velo-dlg.css';

  let show = $state(false);
  let dialog = $state();
  let busy = $state(false);

  onMount(async () => {
    show = await isFresh(db);
  });
  $effect(() => {
    if (show && dialog && !dialog.open) dialog.showModal();
  });

  async function choose(choice) {
    busy = true;
    try {
      await settling(async () => {
        await chooseStart(db, choice, localDay());
        if (choice === 'examples') await tidyData(db);
      });
      dialog?.close();
      busy = false;
      offerDone(choice === 'examples' ? t('The examples are in: two trips, a bike and some gear. Me › Data and backup › «Remove the examples» takes them away again.') : t('Empty start: everything you add is your own.'), null, 8000);
    } catch (err) {
      console.error(err);
      busy = false;
      offerDone(t("That didn't work. Nothing was changed. Try again."));
    }
  }
  // «Ich habe die App schon auf einem anderen Gerät» (Noah 22.11.2026 «2a», a phone that started empty): the window closes and the
  // pairing window of Me › Data and backup opens on «I have a code»; nothing is chosen here, so the data comes from the other device
  function connect() {
    dialog?.close();
    location.hash = '#/me/data?verbinden=1';
  }
</script>

{#if show}
  <dialog class="sheet vdlg firststart" bind:this={dialog} use:backClose onclose={() => (show = false)} aria-labelledby="fs-h" data-testid="first-start">
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="fs-h">{t('Welcome to the Pack Generator')}</h2>
      </div>
      <div class="lang" role="group" aria-label={t('Language')}>
        <button type="button" aria-pressed={lang.v === 'de'} onclick={() => setLang('de')} data-lang="de" lang="de">DE</button>
        <button type="button" aria-pressed={lang.v === 'en'} onclick={() => setLang('en')} data-lang="en" lang="en">EN</button>
      </div>
    </div>
    <p class="lead">{t('Plan and pack your bike trips, tick off your training and keep bikes and gear in order. Your data stays on this device.')}</p>
    <div class="can">
      <b>{t('Here you can')}</b>
      <ul>
        <li><Bike size={16} aria-hidden="true" />{t('Plan and pack trips')}</li>
        <li><Check size={16} aria-hidden="true" />{t('Tick off every day')}</li>
        <li><Wrench size={16} aria-hidden="true" />{t('Look after bike and gear')}</li>
      </ul>
    </div>
    <button type="button" class="btn hi big" disabled={busy} onclick={() => choose('examples')} data-choice="examples">{t('Go, start with examples')}</button>
    <p class="hint">{t('Two made-up trips, a bike and gear. You can change or delete all of it.')}</p>
    <button type="button" class="btn big" disabled={busy} onclick={() => choose('empty')} data-choice="empty">{t('Start empty|first')}</button>
    <div class="fs-foot">
      <button type="button" class="lnk" disabled={busy} onclick={connect} data-choice="connect">{t('I already use the app on another device')}</button>
      <button type="button" class="lnk" disabled={busy} onclick={() => dialog?.close()} data-choice="later">{t('Later|start')}</button>
    </div>
  </dialog>
{/if}

<style>
  .lead {
    margin: 0 0 12px;
    color: var(--ink-2);
  }
  .can {
    margin: 0 0 14px;
    padding: 12px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    background: var(--hi-soft, var(--paper));
  }
  .can ul {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .can li {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .big {
    width: 100%;
    justify-content: center;
    min-height: 48px;
  }
  .hint {
    margin: 6px 0 12px;
    text-align: center;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fs-foot {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-top: 14px;
  }
  .lnk {
    background: none;
    border: 0;
    padding: 4px 0;
    font: inherit;
    font-size: var(--fs-small);
    color: var(--ink);
    text-decoration: underline;
    text-align: left;
    cursor: pointer;
  }
  .lnk:last-child {
    text-align: right;
    flex: none;
  }
  .lang {
    display: flex;
    flex: none;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    overflow: hidden;
  }
  .lang button {
    border: 0;
    background: none;
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 600;
    padding: 6px 10px;
    color: var(--ink-2);
    cursor: pointer;
  }
  .lang [aria-pressed='true'] {
    background: var(--hi);
    color: var(--hi-ink);
  }
</style>
