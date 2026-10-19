<script>
  /**
   * Trello in Kalender › Merken (Noah 19.10.2026 «1a 2a 3b 4a 5a», «1a 2a»): connect, the to-dos in Trello
   * on or off, «Jetzt abgleichen», «Trennen». Each own list chooses its place in its own window (ListSheet).
   * Explained right here, so nobody gets lost (rule 15): which board, what moves, what never.
   */
  import { RefreshCw, Link, Unlink, ExternalLink } from '@lucide/svelte';
  import { t, locale } from '../i18n.svelte.js';
  import { readKey, STRAVA_HASH } from '../strava/client.svelte.js';
  import { trello, connect, syncNow, disconnect, setTodosSync } from './client.svelte.js';

  const hasKey = readKey();
  const p = $derived(trello.prefs ?? {});
  let ask = $state(false);
  const when = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const errorText = (code) =>
    ({
      denied: t('The Trello permission was cancelled. Nothing changed.'),
      expired: t('That took too long. Try again.'),
      unauthorized: t('This device has no key yet: connect Strava on this device first.'),
      not_set_up: t('Trello is not set up on the server yet.'),
      not_connected: t('Trello is not connected (any more). Connect it again.'),
      network: t('No connection. What is on this device stays; it syncs later.'),
      trello_login_needed: t('Trello needs a new permission. Connect it again.'),
      trello_no_workspace: t('In Trello, make a workspace «Packgenerator» first. The app puts its board there.'),
      trello_board_limit: t('Trello allowed no new board in the workspace «Packgenerator».'),
      trello_busy: t('Trello is busy right now. It syncs again later.'),
    })[code] ?? t('Trello answered with an error. Try again later.');
  async function cut() {
    ask = false;
    await disconnect();
  }
</script>

<section class="tb" aria-labelledby="tb-h">
  <div class="lh"><h2 id="tb-h">{t('Trello')}</h2></div>
  <div class="card body">
    {#if trello.error}<p class="err" role="status">{errorText(trello.error)}</p>{/if}
    {#if !p.on}
      <p>{t('Your to-dos and lists you choose also in Trello, on your own board «Packgenerator». A tick in Trello is a tick here, and back. Your other boards stay untouched.')}</p>
      {#if hasKey}
        <button type="button" class="btn hi" onclick={() => connect()}><Link size={16} aria-hidden="true" />{t('Connect Trello')}</button>
        <p class="hint">{t('Needed once: a workspace «Packgenerator» in Trello. The app makes the board itself.')}</p>
      {:else}
        <p class="hint">{t('First connect Strava on this device: it gives this device the key the Trello connection uses too.')}</p>
        <a class="btn" href={STRAVA_HASH}>{t('Connect Strava first')}</a>
      {/if}
    {:else}
      <p class="row">
        <span>{t('Connected with the board «{name}».', { name: p.board?.name ?? 'Packgenerator' })}</span>
        {#if p.board?.url}<a href={p.board.url} target="_blank" rel="noopener"><ExternalLink size={14} aria-hidden="true" />{t('Open in Trello')}</a>{/if}
      </p>
      <label class="tsw"><input type="checkbox" checked={!!p.todos?.sync} onchange={(e) => setTodosSync(e.currentTarget.checked)} /><span><b>{t('To-dos also in Trello')}</b><small>{t('As the list «To-dos» on the board. Birthdays and plants stay in the app.')}</small></span></label>
      <p class="hint">{t('Each list chooses its place in its settings: only in the app, or also in Trello. Google Tasks keeps its own lists; nothing is copied between Trello and Google.')}</p>
      <div class="acts">
        <button type="button" class="btn sm" disabled={trello.busy} onclick={() => syncNow()}><RefreshCw size={15} aria-hidden="true" />{trello.busy ? t('Syncing …') : t('Sync now')}</button>
        {#if p.lastSync}<small>{t('Last synced {when}', { when: when(p.lastSync) })}</small>{/if}
      </div>
      {#if ask}
        <p class="ask">{t('Disconnect Trello? Your to-dos and lists stay in the app, the board stays in Trello; they just stop syncing.')}</p>
        <div class="acts"><button type="button" class="btn sm" onclick={cut}>{t('Disconnect')}</button><button type="button" class="lkb" onclick={() => (ask = false)}>{t('Cancel')}</button></div>
      {:else}
        <button type="button" class="lkb" onclick={() => (ask = true)}><Unlink size={15} aria-hidden="true" />{t('Disconnect Trello')}</button>
      {/if}
    {/if}
  </div>
</section>

<style>
  .tb {
    margin-top: 18px;
  }
  .lh h2 {
    font-size: var(--fs-section);
    margin: 0 0 8px;
  }
  .body {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
  }
  .body p {
    margin: 0;
  }
  .hint,
  .acts small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .err {
    color: var(--bad);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    align-items: center;
  }
  .row a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
  }
  .tsw {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    min-height: 44px;
  }
  .tsw input {
    margin-top: 4px;
    width: 20px;
    height: 20px;
  }
  .tsw span {
    display: grid;
  }
  .tsw small {
    color: var(--ink-3);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    align-items: center;
  }
  .lkb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-self: start;
    min-height: 44px;
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-body);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .body > .btn {
    justify-self: start;
  }
</style>
