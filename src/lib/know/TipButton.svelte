<script>
  /**
   * v0.30.0 (Noah 1a, 3a): the ONE button of a tip, on Today and in the overview. It starts the thing
   * right away (a page, the day ride, a note, the km, the backup …) and marks the tip as used.
   * Two tips open something right here: the home place search and, without the browser's own
   * install question, where the browser keeps "Add to home screen".
   */
  import { db } from '../db.js';
  import { downloadBackup } from '../backup.js';
  import { TIP, tapTip, updateTips } from '../tips.js';
  import { dayRide, openNew, openNote, openData, openTrip } from '../nav.js';
  import { install } from '../install.js';
  import { localDay } from '../localday.js';
  import { t, lang, setLang } from '../i18n.svelte.js';
  import HomePlaceForm from './HomePlaceForm.svelte';

  // v0.40.0: children = the whole row as the button (#/features); without it the tile's short label.
  let { id, next = null, cls = 'btn sm go', children = null } = $props();

  const tip = $derived(TIP[id]);
  let extra = $state(null); // 'place' | 'install'
  let busy = $state(false);
  // the trip pages open the next trip, when there is one
  const TRIP_PAGES = ['gpx', 'wxsuggest', 'bags', 'share'];

  const tap = () => updateTips(db, (s) => tapTip(s, id, localDay()));
  function follow() {
    if (next && TRIP_PAGES.includes(id)) openTrip(next.id);
    tap();
  }
  async function run() {
    tap();
    const what = tip.go.run;
    if (what === 'dayRide') dayRide();
    else if (what === 'note') openNote('');
    else if (what === 'receipt') openNote(t('Workshop receipt: '));
    else if (what === 'km') openNew('km');
    else if (what === 'data') openData();
    else if (what === 'lang') setLang(lang.v === 'de' ? 'en' : 'de');
    else if (what === 'homePlace') extra = extra === 'place' ? null : 'place';
    else if (what === 'install') extra = (await install()) ? null : extra === 'install' ? null : 'install';
    else if (what === 'backup') {
      busy = true;
      try {
        await downloadBackup(db);
      } finally {
        busy = false;
      }
    }
  }
  const label = $derived(id === 'lang' ? (lang.v === 'de' ? t('Switch to English') : t('Switch to German')) : t(tip.button));
</script>

{#if tip.go.href}
  <a class={cls} href={tip.go.href} onclick={follow}>{#if children}{@render children()}{:else}{label}{/if}</a>
{:else}
  <button type="button" class={cls} disabled={busy} onclick={run} aria-expanded={tip.go.run === 'homePlace' || tip.go.run === 'install' ? extra != null : undefined}>{#if children}{@render children()}{:else}{label}{/if}</button>
{/if}
{#if extra === 'place'}
  <div class="extra"><HomePlaceForm onchosen={() => (extra = null)} /></div>
{:else if extra === 'install'}
  <p class="extra hint" role="status">{t('Your browser has no install button here: in its menu choose "Add to Home screen" (Safari: Share, then "Add to Home Screen").')}</p>
{/if}

<style>
  .go {
    min-height: 44px;
  }
  /* below the buttons, the whole width of the tile */
  .extra {
    order: 2;
    flex: 1 1 100%;
    min-width: 0;
    display: grid;
    gap: 6px;
  }
  .hint {
    margin: 0;
    font-size: 14px;
    color: var(--ink-2);
  }
</style>
