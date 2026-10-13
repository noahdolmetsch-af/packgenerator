<script>
  /**
   * SN1b «Tour aus komoot» (Noah 13.10.2026, answers 1a and 4a): the quiet row that opens komoot's tour
   * suggestions near you, in a new tab with the «opens elsewhere» sign. On Unterwegs it is the last row
   * of the card «Mehr», in «Neue Tour» a row next to the templates. Never a main button.
   * The location is asked for only when the row is tapped; it goes only into the link (komoot.js,
   * rounded to about 1 km) and is never stored. Without a location komoot opens anyway. Offline the
   * row opens nothing and says so quietly (taking over a shared GPX works offline).
   *
   * sport: komootSport(…) ({ key, name } or null); hint: the line about the location under the row;
   * framed: the row with its own frame (in «Neue Tour»; in «Mehr» the card is the frame).
   */
  import { Compass, ExternalLink, MapPin } from '@lucide/svelte';
  import { komootFindUrl } from '../komoot.js';
  import { t } from '../i18n.svelte.js';

  let { sport = null, hint = true, framed = false } = $props();

  let note = $state('');
  const sub = $derived(sport ? t('Suggestions near you, {sport} · opens komoot', { sport: t(sport.name) }) : t('Suggestions near you · opens komoot'));

  function go(e) {
    e.preventDefault();
    note = '';
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      note = t('Offline, komoot does not open. A tour shared as GPX is taken over offline too.');
      return;
    }
    // the new tab is opened now (in the tap), the address follows once the location is known or refused
    const w = window.open('about:blank', '_blank');
    if (w) w.opener = null;
    const open = (pos) => {
      const url = komootFindUrl(pos, sport);
      if (w) w.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    };
    if (!navigator.geolocation) return open(null);
    navigator.geolocation.getCurrentPosition(
      (p) => open({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => open(null),
      { timeout: 8000, maximumAge: 300000 },
    );
  }
</script>

<div class="km" class:framed data-komoot-row>
  <a class="km-row" href={komootFindUrl(null, sport)} target="_blank" rel="noopener noreferrer" onclick={go} data-komoot-find>
    <span class="km-ib" aria-hidden="true"><Compass size={18} /></span>
    <span class="km-tw"><b>{t('Tour from komoot')}</b><small>{sub}</small></span>
    <ExternalLink class="km-ext" size={18} aria-hidden="true" /><span class="sr">{t('(opens elsewhere)')}</span>
  </a>
  {#if note}<p class="km-note" role="status">{note}</p>{/if}
</div>
{#if hint}<p class="km-hint"><MapPin size={16} aria-hidden="true" /><span>{t('The app asks for your location only when you tap. It goes only in the link to komoot and is not stored.')}</span></p>{/if}

<style>
  .km {
    min-width: 0;
  }
  .km.framed {
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .km-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 10px 16px;
    color: var(--ink);
    text-decoration: none;
  }
  .km-row:hover {
    background: var(--paper-2);
  }
  .km-ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .km-tw {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .km-tw b {
    font-weight: 600;
  }
  .km-tw small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .km-row :global(.km-ext) {
    flex: none;
    color: var(--ink-3);
  }
  .km-note {
    margin: 0;
    padding: 0 16px 12px 64px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .km-hint {
    display: flex;
    gap: 8px;
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .km-hint :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
