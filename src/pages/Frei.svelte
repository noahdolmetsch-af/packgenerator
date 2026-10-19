<script>
  /**
   * Paket T «Freie Zeit» (Noah 19.10.2026, «alle bauen»): Ich › Freie Zeit (#/me/frei) and its eight
   * pages. One entry in App.svelte (the hot file stays small); each page loads on its first visit.
   * «Impulse» is also the tab «Impulse» of Aktiv (#/flow/impulse, Noah «1a und b»).
   */
  import { ChevronRight, Sparkles, Library, Dices, Moon, Heart, Plane, Tent, Repeat } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import LazyPage from '../lib/nav/LazyPage.svelte';
  import { PAGES as FREI_PAGES, freiPart, pageHref } from '../lib/frei.js';
  import { t } from '../lib/i18n.svelte.js';
  import '../lib/frei/frei.css';

  let { hash = '' } = $props();
  const PARTS = {
    impulse: () => import('../lib/frei/Impulse.svelte'),
    sammlungen: () => import('../lib/frei/Sammlungen.svelte'),
    sammlung: () => import('../lib/frei/Sammlungen.svelte'),
    lust: () => import('../lib/frei/Lust.svelte'),
    abend: () => import('../lib/frei/Abend.svelte'),
    wesentlich: () => import('../lib/frei/Wesentlich.svelte'),
    reise: () => import('../lib/frei/Reise.svelte'),
    nacht: () => import('../lib/frei/Nacht.svelte'),
    naechstes: () => import('../lib/frei/Naechstes.svelte'),
  };
  const ICONS = { sparkles: Sparkles, library: Library, dice: Dices, moon: Moon, heart: Heart, plane: Plane, tent: Tent, repeat: Repeat };
  const part = $derived(freiPart(hash));
  const fromActive = $derived(hash.startsWith('#/flow/impulse'));
</script>

{#if part}
  {#key part}<LazyPage load={PARTS[part]} {hash} {fromActive} />{/key}
{:else}
  <div class="fz" data-page="frei">
    <Crumb path={[{ href: '#/me', label: t('Me|place') }]} here={t('Free time')} />
    <h1 class="fz-h1" tabindex="-1" data-page-title>{t('Free time')}</h1>
    <p class="fz-intro">{t('Ideas for the hours between trips: small adventures, good evenings, things worth keeping. Everything is a suggestion; change it, hide it or add your own.')}</p>
    <ul class="fz-box fz-list" aria-label={t('Free time')}>
      {#each FREI_PAGES as p (p.key)}
        {@const Icon = ICONS[p.icon]}
        <li>
          <a class="fz-row" href={pageHref(p.key)} data-frei-page={p.key}>
            <span class="fz-icon" aria-hidden="true"><Icon size={20} /></span>
            <span class="fz-row-main"><b>{t(p.title)}</b><small>{t(p.sub)}</small></span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  a.fz-row {
    color: var(--ink);
    text-decoration: none;
  }
</style>
