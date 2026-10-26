<script>
  /**
   * P8 «Automatischer Abgleich» (Noah 18.10.2026 «1b … 2b 3b»): the switch under Ich › Daten und
   * Backup › Handy und Computer. Off: «Switch on» makes a pairing code; «I have a code» pairs with the
   * other device. On: when it last ran, «Sync now», «Pair another device» (QR code, link, code) and
   * «Switch off» (optionally emptying the server). A link #/me/data?koppeln=<code> asks to pair once.
   * Every record is sealed with the code on the device; the server cannot read it (sync/code.js).
   * Everything here is a suggestion: the backup file way below stays.
   * Noah 19.10.2026 06:29 (pairing felt like nothing happened, then many single questions): while it
   * pairs, «Syncing …» shows in every view; an error shows in every view too.
   * Noah 24.10.2026 («im Frontend nie eine solche Meldung»): an entry changed on both devices is never a
   * question any more, also not after pairing: the newer change wins, and the replaced version waits 30
   * days in the fold «Automatisch abgeglichen», where it can be brought back.
   */
  import { onMount } from 'svelte';
  import { RefreshCw, Link2, Copy, Share2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import QrCode from '../ich/QrCode.svelte';
  import { newCode, readCode } from './code.js';
  import { startSync, stopSync, readCfg, lostVersions, bringBack, dropLost } from './engine.js';
  import { sync, runSync } from './auto.svelte.js';
  import { kindOf, titleOf } from './show.js';
  import { snapDb, takeSnapshot, hasDataIn } from '../maintenance/snapshots.js';
  import { ACCOUNT, startSignIn, readReturn, finishSignIn, signOut } from './account.js';
  import { askDelete } from '../ui/ask.js';
  import { liveQuery } from 'dexie';

  const cfgQ = liveQuery(() => readCfg(db));
  const demoQ = liveQuery(() => db.meta.get('demo'));
  // Paket R (Noah 19.10.2026 «2a oder b»): signed in with Google on this device, or null
  const acctQ = liveQuery(() => db.meta.get(ACCOUNT));
  // the versions a newer change on the other device replaced (engine.js keepLost)
  const lostQ = liveQuery(() => lostVersions(db));
  const lost = $derived($lostQ ?? []);
  let view = $state(''); // '' | 'enter' | 'pair' | 'off' | 'link'
  let typed = $state('');
  let linkCode = $state('');
  let message = $state('');
  let busy = $state(false);
  let pairing = $state(false); // begin() runs: snapshot, switch on, the first round

  const when = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const linkOf = (code) => `${location.origin}${location.pathname}#/me/data?koppeln=${code}`;
  const ERR = {
    offline: () => t('No network right now. The sync catches up later.'),
    not_ready: () => t('The sync is not ready on the server yet.'),
    storage_not_set_up: () => t('The sync is not ready on the server yet.'),
    not_set_up: () => t('Signing in with Google is not ready on the server yet. The code or the invite link works.'),
    expired: () => t('The sign-in took too long. Sign in again.'),
    denied: () => t('Google sign-in was cancelled. Nothing has changed.'),
    daily_cap: () => t('The server has done enough for today (free limit). It works again tomorrow.'),
  };
  const errText = (code) => (ERR[code] ?? (() => t('The server answered with an error. The app tries again.')))();

  // a pairing link opened on this device: ask once, then take the code out of the address
  function takeLink() {
    const m = location.hash.match(/[?&]koppeln=([0-9A-Za-z-]+)/);
    if (!m) return;
    const code = readCode(m[1]);
    history.replaceState(null, '', location.hash.replace(/[?&]koppeln=[0-9A-Za-z-]+/, '').replace(/^(#[^?]*)&/, '$1?'));
    if (code) {
      linkCode = code;
      view = 'link';
    }
  }
  // Paket R: back from Google with #/me/data?konto=<ticket> (or konto=error)
  async function takeSignIn() {
    const r = readReturn(location.hash);
    if (!r) return;
    history.replaceState(null, '', r.rest);
    if (r.error) return (message = errText(r.error));
    busy = true;
    message = '';
    try {
      const cfg = await readCfg(db);
      const mine = cfg?.on ? cfg.code : newCode();
      const got = await finishSignIn(db, r.ticket, mine);
      if (got.email) await db.meta.put({ key: 'syncAccountLast', email: got.email });
      busy = false;
      if (cfg?.on && got.code === cfg.code) return (message = t('Signed in with Google. On your other device, simply sign in with Google too.'));
      if (cfg?.on) await stopSync(db, { forget: false });
      if (got.known) await pairWith(got.code);
      else {
        await begin(got.code);
        const err = await lastError();
        message = err ? errText(err) : t('Signed in with Google. Sync is on: on your other device, simply sign in with Google too.');
      }
    } catch (e) {
      message = errText(e?.code);
    } finally {
      busy = false;
    }
  }
  // Einzelidee 28 «Anmeldung klar zeigen»: before Google, what opens and with which data
  const lastQ = liveQuery(() => db.meta.get('syncAccountLast'));
  const countQ = liveQuery(async () => ({ trips: await db.trips.count(), items: await db.items.count() }));
  function google() {
    message = '';
    view = 'google';
  }
  async function goGoogle() {
    busy = true;
    message = '';
    try {
      location.href = await startSignIn();
    } catch (e) {
      message = errText(e?.code);
      busy = false;
    }
  }
  async function leaveAccount(forget) {
    if (forget) {
      const ok = await askDelete({ title: t('Remove the Google sign-in?'), text: t('The server forgets the code of your Google account. Sync stays on with the code; your data stays on your devices.'), label: t('Remove') });
      if (ok !== 'delete') return;
    }
    busy = true;
    try {
      await signOut(db, { forget });
      message = forget ? t('The server has forgotten your Google sign-in.') : t('Signed out of Google on this device. Sync stays on.');
    } catch (e) {
      message = errText(e?.code);
    } finally {
      busy = false;
    }
  }
  // also when the link opens while this page is already shown
  onMount(() => {
    takeLink();
    takeSignIn();
    const onHash = () => {
      takeLink();
      takeSignIn();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  async function begin(code) {
    busy = true;
    pairing = true;
    message = '';
    try {
      if (await hasDataIn(db)) await takeSnapshot(db, snapDb(), { version: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : null, kind: 'sync' });
      await startSync(db, code);
      await runSync(db);
    } finally {
      busy = false;
      pairing = false;
    }
  }
  /** The error of the round just run (runSync keeps it in syncCfg), or null. */
  const lastError = async () => (await readCfg(db))?.error ?? null;
  async function switchOn() {
    try {
      await begin(newCode());
      view = 'pair';
      const err = await lastError();
      if (err) message = errText(err);
    } catch (e) {
      view = '';
      message = errText(e?.code);
    }
  }
  async function pairWith(code) {
    const c = readCode(code);
    if (!c) {
      message = t('This code is not complete. It has 32 letters and digits.');
      return;
    }
    try {
      await begin(c);
      const err = await lastError();
      view = '';
      message = err ? errText(err) : t('Paired. From now on both devices keep the same data.');
    } catch (e) {
      view = '';
      message = errText(e?.code);
    }
  }
  /** Bring a replaced version back (it then syncs to the other device as a normal change). */
  async function back(key) {
    busy = true;
    try {
      await bringBack(db, key);
      message = t('Brought back. The other device gets it with the next sync.');
      runSync(db);
    } finally {
      busy = false;
    }
  }
  async function switchOff(forget) {
    busy = true;
    try {
      await stopSync(db, { forget });
      await signOut(db).catch(() => {}); // Paket R: the Google sign-in of this device ends with the sync
      message = forget ? t('Switched off, and the data on the server is deleted.') : t('Switched off. Your data stays on this device.');
    } catch {
      message = t('Switched off here. The server could not be reached; its sealed copy is removed by itself after a year.');
      await stopSync(db, { forget: false });
    } finally {
      busy = false;
      view = '';
    }
  }
  async function share(code) {
    const url = linkOf(code);
    try {
      if (navigator.share) await navigator.share({ title: 'Pack Generator', text: t('Pair with this link:'), url });
      else {
        await navigator.clipboard.writeText(url);
        message = t('Link copied.');
      }
    } catch {
      /* cancelled */
    }
  }
  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      message = t('Code copied.');
    } catch {
      /* not allowed */
    }
  }
</script>

<div class="syncpanel" data-sync-panel data-sync-on={$cfgQ?.on ? 'on' : 'off'}>
  <h3 class="sh">{t('Sync automatically')}</h3>
  {#if view === 'link'}
    <div class="confirm" role="group" aria-label={t('Pair with this code?')}>
      <p><b>{t('Pair with this code?')}</b> {t('Both devices then keep the same data. Where the same entry differs, the newer change counts; the other version stays under «Settled by itself» for 30 days.')}</p>
      <p class="code" data-sync-code>{linkCode}</p>
      <div class="ich-acts">
        <button type="button" class="btn" onclick={() => (view = '')}>{t('Not now')}</button>
        <button type="button" class="btn hi" disabled={busy} onclick={() => pairWith(linkCode)}><Link2 size={16} aria-hidden="true" />{t('Pair')}</button>
      </div>
    </div>
  {:else if !$cfgQ?.on}
    <p class="ich-help">{t('Phone and computer keep the same data, without a file. Sealed with a code only your devices know: the server cannot read it.')}</p>
    {#if view === 'enter'}
      <label class="lab" for="sync-code">{t('Code from the other device')}</label>
      <input id="sync-code" class="codein" bind:value={typed} autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-…" />
      <div class="ich-acts">
        <button type="button" class="btn" onclick={() => (view = '')}>{t('Back')}</button>
        <button type="button" class="btn hi" disabled={busy || !typed.trim()} onclick={() => pairWith(typed)}>{t('Pair')}</button>
      </div>
    {:else}
      {#if view === 'google'}
        <div class="confirm" role="group" aria-label={t('Before you sign in')} data-sync-before>
          <p><b>{t('Before you sign in')}</b></p>
          <ul class="before">
            <li>{t('Google shows its own page. The app only gets your e-mail address, to find your code; your data stays sealed.')}</li>
            <li>{t('This device holds {trips} trips and {items} items.', { trips: $countQ?.trips ?? 0, items: $countQ?.items ?? 0 })}</li>
            <li>{t('Your Google account already has data from another device: this device joins it and gets that data. A copy of this device is kept first.')}</li>
            <li>{t('Your Google account has no data yet: the data of this device becomes the start.')}</li>
            {#if $lastQ?.email}<li><b>{t('Last time you used {email}.', { email: $lastQ.email })}</b> {t('Choose the same account at Google, otherwise a second, empty account starts.')}</li>
            {:else}<li>{t('Use the same Google account on every device, otherwise a second, empty account starts.')}</li>{/if}
          </ul>
          <div class="ich-acts">
            <button type="button" class="btn" onclick={() => (view = '')}>{t('Cancel')}</button>
            <button type="button" class="btn hi" disabled={busy} onclick={goGoogle}>{t('Go on to Google')}</button>
          </div>
        </div>
      {/if}
      <!-- Paket R (Noah 19.10.2026 «2a oder b»): two ways, you choose; without either, all stays on this device -->
      <p class="way" data-sync-way="code"><b>{t('Without an account')}</b> {t('with a code or an invite link for your other device.')}</p>
      <div class="ich-acts">
        <button type="button" class="btn hi" disabled={busy || !!$demoQ} onclick={switchOn}>{t('Switch on sync')}</button>
        <button type="button" class="btn" disabled={busy || !!$demoQ} onclick={() => (view = 'enter')}>{t('I have a code')}</button>
      </div>
      <p class="way" data-sync-way="google"><b>{t('Or with your Google account')}</b> {t('Google keeps the code for you: on the next device, simply sign in.')}</p>
      <div class="ich-acts">
        <button type="button" class="btn" disabled={busy || !!$demoQ} onclick={google} data-sync-google>{t('Sign in with Google')}</button>
      </div>
      <p class="small">{t('Without sync everything stays on this device.')} <a href="#/me/privacy">{t('Privacy and terms')}</a></p>
      {#if $demoQ}<p class="small">{t('Off while the demo runs')}</p>{/if}
    {/if}
  {:else}
    <p class="state" data-sync-state={sync.running ? 'running' : $cfgQ.error ? 'error' : 'ok'}>
      <span class="dot {$demoQ ? 'off' : $cfgQ.error ? 'warn' : 'ok'}" aria-hidden="true"></span>
      <span class="st">{#if $demoQ}{t('Paused while the demo runs.')}
      {:else if sync.running}{t('Syncing …')}
      {:else if $cfgQ.error}{errText($cfgQ.error)}
      {:else if $cfgQ.lastAt}{t('On · last synced {when}.', { when: when($cfgQ.lastAt) })}
      {:else}{t('On · not synced yet.')}{/if}</span>
    </p>
    {#if lost.length}
      <!-- Noah 24.10.2026: changes on both devices settle by themselves; the replaced versions wait here quietly -->
      <details class="lost" data-sync-history>
        <summary>{t('Settled by itself')} ({lost.length})</summary>
        <p class="small">{t('When both devices changed the same entry, the newer change counts. The other version stays here for 30 days, in case you want it back.')}</p>
        <ul class="lostlist">
          {#each lost.slice(0, 50) as l (l.key)}
            <li data-lost={l.t}>
              <span class="lt"><span class="kind">{kindOf(l.t)}</span> <b>{titleOf(l.v, l.id, l.t)}</b>
                <small>{l.del ? t('the deleted version') : l.at ? t('the version of {when}', { when: when(l.at) }) : t('the earlier version')}</small></span>
              <span class="la">
                <button type="button" class="btn sm" disabled={busy} onclick={() => back(l.key)}>{t('Bring back')}</button>
                <button type="button" class="btn sm" disabled={busy} onclick={() => dropLost(db, l.key)} aria-label={t('Forget this version')}>{t('Forget')}</button>
              </span>
            </li>
          {/each}
        </ul>
        {#if lost.length > 50}<p class="small">{t('{n} more, the newest are shown.', { n: lost.length - 50 })}</p>{/if}
      </details>
    {/if}
    {#if $cfgQ.big}<p class="small">{tn($cfgQ.big, '{n} very large entry stays only on this device.', '{n} very large entries stay only on this device.')}</p>{/if}

    {#if view === 'pair'}
      <div class="pair" data-sync-pair>
        <div class="qr"><QrCode text={linkOf($cfgQ.code)} label={t('QR code to pair')} /></div>
        <div class="pm">
          <ol class="steps">
            <li>{t('On the other device: point the camera at this code, or open the link.')}</li>
            <li>{t('There, tap «Pair». Or type the code under «I have a code».')}</li>
          </ol>
          <p class="code" data-sync-code>{$cfgQ.code}</p>
          <div class="ich-acts">
            <button type="button" class="btn sm" onclick={() => share($cfgQ.code)}><Share2 size={16} aria-hidden="true" />{t('Share link')}</button>
            <button type="button" class="btn sm" onclick={() => copyCode($cfgQ.code)}><Copy size={16} aria-hidden="true" />{t('Copy code')}</button>
            <button type="button" class="btn sm" onclick={() => (view = '')}>{t('Done')}</button>
          </div>
          <p class="small">{t('Keep the code to yourself: whoever has it can read your data.')}</p>
        </div>
      </div>
    {:else if view === 'off'}
      <div class="confirm" role="group" aria-label={t('Switch off sync?')}>
        <p><b>{t('Switch off sync?')}</b> {t('Your data stays on this device. The other device keeps syncing until you switch it off there too.')}</p>
        <div class="ich-acts">
          <button type="button" class="btn" onclick={() => (view = '')}>{t('Cancel')}</button>
          <button type="button" class="btn" disabled={busy} onclick={() => switchOff(false)}>{t('Only switch off')}</button>
          <button type="button" class="btn" disabled={busy} onclick={() => switchOff(true)}>{t('Switch off and empty the server')}</button>
        </div>
      </div>
    {:else}
      <div class="ich-acts">
        <button type="button" class="btn hi" disabled={sync.running || !!$demoQ} onclick={() => runSync(db)}><RefreshCw size={16} aria-hidden="true" />{t('Sync now')}</button>
        <button type="button" class="btn" onclick={() => (view = 'pair')}>{t('Pair another device')}</button>
        <button type="button" class="btn" onclick={() => (view = 'off')}>{t('Switch off|sync')}</button>
      </div>
      <!-- Paket R: the Google sign-in of this device -->
      {#if $acctQ}
        <p class="way" data-sync-account>{t('Signed in with Google: {email}', { email: $acctQ.email || '…' })}</p>
        <div class="ich-acts">
          <button type="button" class="btn sm" disabled={busy} onclick={() => leaveAccount(false)}>{t('Sign out of Google')}</button>
          <button type="button" class="btn sm" disabled={busy} onclick={() => leaveAccount(true)}>{t('Remove the Google sign-in')}</button>
        </div>
      {:else}
        <p class="small">{t('Sign in with Google too, then the next device needs no code.')} <button type="button" class="linkbtn" disabled={busy || !!$demoQ} onclick={google} data-sync-google>{t('Sign in with Google')}</button></p>
      {/if}
    {/if}
  {/if}
  {#if pairing && !(sync.running && $cfgQ?.on && view !== 'link')}<p class="busyline" role="status" data-sync-busy>{t('Syncing …')}</p>{/if}
  {#if message}<p class="msg" role="status">{message}</p>{/if}
  <h3 class="sh file">{t('Or with a backup file')}</h3>
</div>

<style>
  .syncpanel {
    margin-bottom: 4px;
  }
  .sh {
    margin: 0 0 6px;
    font-size: var(--fs-body);
    font-weight: 700;
  }
  .way {
    margin: 10px 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .way b {
    color: var(--ink);
  }
  .linkbtn {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent, var(--ink));
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .sh.file {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
  }
  .state {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0 0 10px;
  }
  .st {
    flex: 1;
    min-width: 0;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: none;
    background: var(--line);
  }
  .dot.ok {
    background: var(--ok);
  }
  .dot.warn {
    background: var(--warn);
  }
  .lost {
    margin: 0 0 12px;
  }
  .lost summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .lostlist {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .lostlist li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 10px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .lt {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .lt small {
    display: block;
    color: var(--ink-2);
  }
  .kind {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .la {
    display: flex;
    gap: 6px;
  }
  .lab {
    display: block;
    margin: 4px 0;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .codein {
    width: 100%;
    max-width: 420px;
    min-height: 44px;
    margin-bottom: 10px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-body);
  }
  .code {
    margin: 0 0 10px;
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-body);
    letter-spacing: 0.04em;
    overflow-wrap: break-word;
  }
  .pair {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  .qr {
    width: 168px;
    flex: none;
  }
  .pm {
    flex: 1;
    min-width: 220px;
  }
  .steps {
    margin: 0 0 10px;
    padding-left: 20px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .steps li + li {
    margin-top: 4px;
  }
  .confirm {
    margin-bottom: 10px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper-2);
  }
  .confirm p {
    margin: 0 0 10px;
  }
  .small {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .busyline {
    margin: 10px 0 0;
    color: var(--ink-2);
  }
  .msg {
    margin: 10px 0 0;
    font-weight: 600;
  }
</style>
