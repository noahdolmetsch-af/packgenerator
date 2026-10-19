<script>
  /**
   * Paket K #1052 «komoot-Tour direkt auf Unterwegs»: one tap opens this trip's tour in komoot (the app
   * on the phone when installed). The link comes from a tour shared from komoot (route.komoot) or is
   * pasted here once (kept on the trip; change or remove it any time).
   */
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { touched } from '../trips.js';
  import { komootLink } from '../komoot.js';
  import { Route, ExternalLink, Pencil } from '@lucide/svelte';
  import './unterwegs.css';

  let { trip } = $props();
  const href = $derived(komootLink(trip?.route?.komoot) ?? komootLink(trip?.komootLink));
  let edit = $state(false);
  let link = $state('');
  let msg = $state('');
  async function save(e) {
    e.preventDefault();
    const raw = link.trim();
    const ok = raw ? komootLink(raw) : null;
    if (raw && !ok) return (msg = t('This is not a komoot link.'));
    const fields = trip.route ? { route: { ...$state.snapshot(trip.route), komoot: ok } } : { komootLink: ok };
    await db.trips.update(trip.id, touched(fields));
    edit = false;
    msg = '';
  }
</script>

<div class="uw-km" data-komoot-tour>
  {#if href && !edit}
    <div class="uw-row">
      <a class="btn uw-bigbtn grow" href={href} target="_blank" rel="noopener noreferrer" data-komoot-open><Route size={20} aria-hidden="true" /><span><b>{t('Open the tour in komoot')}</b><small>{t('the route of this trip')}</small></span><ExternalLink size={14} aria-hidden="true" /><span class="sr">{t('(opens elsewhere)')}</span></a>
      <button type="button" class="tp-icon-btn" aria-label={t('Change komoot link')} onclick={() => ((edit = true), (link = href))}><Pencil size={16} aria-hidden="true" /></button>
    </div>
  {:else if edit}
    <form class="uw-row" onsubmit={save}>
      <input class="inp grow" bind:value={link} type="url" inputmode="url" placeholder="https://www.komoot.com/tour/…" aria-label={t('komoot link')} />
      <button type="submit" class="btn sm">{t('Save')}</button>
      <button type="button" class="btn sm" onclick={() => (edit = false)}>{t('Cancel')}</button>
    </form>
    <p class="uw-fine">{t('Empty and Save removes the link.')}</p>
  {:else}
    <button type="button" class="tp-link" onclick={() => (edit = true)}>{t('Add the komoot link of this tour')}</button>
  {/if}
  {#if msg}<p class="tp-small" role="alert">{msg}</p>{/if}
</div>

<style>
  .uw-km .uw-bigbtn {
    flex-direction: row;
    justify-content: flex-start;
    gap: 10px;
    text-align: left;
  }
  .uw-km small {
    display: block;
    color: var(--ink-3);
    font-weight: 400;
  }
</style>
