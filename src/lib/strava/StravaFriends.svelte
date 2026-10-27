<script>
  /**
   * «Freunde mit eigenem Strava» (Noah 27.10.2026 «ich möchte jetzt bauen, dass wir in zukunft jederzeit
   * umstellen können», answers ★ 1a 2a 3a): on the owner's Strava page. «Freund einladen» makes a link
   * (7 days, once) that a friend opens to connect their own Strava; the list shows who is in, each with
   * «Entfernen» (asks first, then «Undo» before the server forgets them). A friend's device sees nothing
   * here (the server answers 401 for the list). Strava's own limit (one person until Strava allows more,
   * free request) is named next to the invite.
   */
  import { onMount } from 'svelte';
  import { UserPlus, Users, Copy, Share2, ExternalLink } from '@lucide/svelte';
  import { loadFriends, makeInvite, removeFriend } from './client.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { UNDO_MS } from '../ui/undo.js';
  import { t, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';

  const STRAVA_LIMIT = 'https://developers.strava.com/docs/getting-started/';

  let friends = $state(null); // null: not loaded or not the owner's device
  let hidden = $state([]); // ids waiting for «Undo» before they go
  let invite = $state(null);
  let busy = $state(false);
  let error = $state('');
  let copied = $state(false);
  const shown = $derived((friends ?? []).filter((f) => !hidden.includes(f.id)));

  async function load() {
    try {
      friends = await loadFriends();
    } catch {
      friends = null;
    }
  }
  onMount(load);

  async function newInvite() {
    busy = true;
    error = '';
    copied = false;
    try {
      invite = await makeInvite();
    } catch {
      error = t('The invite could not be made. Try again later.');
    }
    busy = false;
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(invite.link);
      copied = true;
    } catch {
      copied = false;
    }
  }
  async function share() {
    try {
      await navigator.share({ title: t('Invite to the Pack Generator'), text: t('Connect your own Strava with this link (works once, 7 days).'), url: invite.link });
    } catch {
      /* closed or not possible: the link stays to copy */
    }
  }

  const nameOf = (f) => f.name || t('Strava person {id}', { id: f.id });
  const lineOf = (f) => [f.connected ? (f.since ? t('connected since {date}', { date: dateOf(f.since) }) : t('connected')) : t('not connected (any more)'), f.inVercel ? t('also listed in Vercel') : ''].filter(Boolean).join(' · ');

  async function remove(f) {
    const answer = await askDelete({
      title: t('Remove «{name}»?', { name: nameOf(f) }),
      text: t('Their Strava and Fitbit accesses on the server go, and every device of theirs is disconnected. Their own data in their app stays with them.'),
      label: t('Remove'),
    });
    if (answer !== 'delete') return;
    let timer;
    await deleteWithUndo({
      name: nameOf(f),
      text: t('«{name}» removed.', { name: nameOf(f) }),
      run: () => {
        hidden = [...hidden, f.id];
        // the server forgets only after the «Undo» time
        timer = setTimeout(async () => {
          try {
            await removeFriend(f.id);
          } catch {
            error = t('Removing did not work. Try again.');
          }
          hidden = hidden.filter((x) => x !== f.id);
          await load();
        }, UNDO_MS + 300);
        return f.id;
      },
      undo: (id) => {
        clearTimeout(timer);
        hidden = hidden.filter((x) => x !== id);
      },
    });
  }
</script>

{#if friends}
  <section class="vsec" aria-labelledby="sfr-h" data-section="strava-friends">
    <div class="vh"><h2 id="sfr-h">{t('Friends with their own Strava')}</h2><p class="vh-s">{t('you decide who may connect · changeable at any time')}</p></div>
    {#if shown.length}
      <ul class="card vlist" data-friends>
        {#each shown as f (f.id)}
          <li class="orow" data-friend={f.id}>
            <span class="ib" aria-hidden="true"><Users size={18} /></span>
            <span class="m"><b>{nameOf(f)}</b><small>{lineOf(f)}</small></span>
            <button type="button" class="btn sm" onclick={() => remove(f)}>{t('Remove')}</button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="card pad quiet">{t('Only you are connected. Invite a friend to let them connect their own Strava.')}</p>
    {/if}
    <div class="card pad inv">
      <button type="button" class="btn" disabled={busy} onclick={newInvite} data-invite><UserPlus size={16} aria-hidden="true" />{invite ? t('New invite link') : t('Invite a friend')}</button>
      {#if invite}
        <input class="lnk" type="text" readonly value={invite.link} aria-label={t('Invite link')} data-invite-link onfocus={(e) => e.currentTarget.select()} />
        <p class="quiet">{t('Works once, until {date}. Your friend opens it on their own phone and taps «Connect with Strava».', { date: dateOf(localDay(new Date(invite.until))) })}</p>
        <div class="acts">
          <button type="button" class="btn sm" onclick={copy}><Copy size={16} aria-hidden="true" />{copied ? t('Copied') : t('Copy link')}</button>
          {#if typeof navigator !== 'undefined' && navigator.share}<button type="button" class="btn sm" onclick={share}><Share2 size={16} aria-hidden="true" />{t('Share')}</button>{/if}
        </div>
        <p class="hint" data-strava-limit>{t('Good to know: Strava lets a new app connect only one person until Strava allows more. The request is free.')} <a href={STRAVA_LIMIT} target="_blank" rel="noopener">{t('How to ask Strava')}<ExternalLink size={12} aria-hidden="true" /></a></p>
      {/if}
      {#if error}<p class="err" role="alert">{error}</p>{/if}
    </div>
  </section>
{/if}

<style>
  .vsec {
    margin: 0;
    display: grid;
    gap: 10px;
  }
  .vh {
    margin: 0 2px;
  }
  .vh h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .vh-s {
    margin: 2px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .vlist {
    list-style: none;
    margin: 0;
    padding: 4px 16px;
  }
  .vlist > :global(* + *) {
    border-top: 1px solid var(--line);
  }
  .orow {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 8px 0;
  }
  .ib {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .m {
    flex: 1 1 10em;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .m b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .m small,
  .quiet {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pad {
    padding: 12px 16px;
  }
  .quiet {
    margin: 0;
  }
  .inv {
    display: grid;
    gap: 8px;
    justify-items: start;
  }
  .inv > :global(*) {
    min-width: 0;
    max-width: 100%;
  }
  .lnk {
    box-sizing: border-box;
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    font: 400 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .hint {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint a {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .err {
    margin: 0;
    color: var(--warn);
    font-size: var(--fs-small);
  }
</style>
