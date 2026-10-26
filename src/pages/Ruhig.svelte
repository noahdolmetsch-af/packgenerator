<script>
  /**
   * Paket C «Ruhig und persönlich» (Noah 24.10.2026, 996 Ideen «1b 2a 3b 4b 5a»: the whole package):
   * Ich › Ruhig und persönlich (#/me/ruhig) and its sub-pages #/me/ruhig/<key> (lib/ruhig/subs.js).
   * Everything is a suggestion: nothing is switched on by itself, everything can be changed and deleted.
   */
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import { t } from '../lib/i18n.svelte.js';
  import { subKeyOf, subOf, RUHIG_HASH } from '../lib/ruhig/subs.js';
  import Hub from '../lib/ruhig/Hub.svelte';
  import '../lib/ruhig/ruhig.css';

  let { hash = '' } = $props();
  const key = $derived(subKeyOf(hash));
  const sub = $derived(subOf(key));
  const LOAD = {
    weniger: () => import('../lib/ruhig/Weniger.svelte'),
    versuche: () => import('../lib/ruhig/Versuche.svelte'),
    herkunft: () => import('../lib/ruhig/Herkunft.svelte'),
    spaeter: () => import('../lib/ruhig/Spaeter.svelte'),
    bedeutung: () => import('../lib/ruhig/Bedeutung.svelte'),
    koennen: () => import('../lib/ruhig/Koennen.svelte'),
    teilen: () => import('../lib/ruhig/Teilen.svelte'),
    zahlen: () => import('../lib/ruhig/Zahlen.svelte'),
    belege: () => import('../lib/ruhig/Belege.svelte'),
    aus: () => import('../lib/ruhig/Aus.svelte'), // Einzelideen 33 und 36
  };
</script>

<div class="rh-page" data-ruhig={key || 'hub'}>
  {#if sub}
    <Crumbs crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Calm and personal'), href: RUHIG_HASH }]} here={t(sub.title)} />
    <PageHead title={t(sub.title)} text={t(sub.sub)} />
    {#await LOAD[key]() then m}
      <m.default {hash} />
    {/await}
  {:else}
    <Crumbs crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Calm and personal')} />
    <PageHead title={t('Calm and personal')} text={t('Small things that make the app quieter and more your own. Nothing here is switched on by itself.')} />
    <Hub />
  {/if}
</div>

<style>
  .rh-page {
    max-width: 760px;
  }
</style>
