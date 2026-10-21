<script>
  /**
   * Paket VG: the head of its pages (path back to the bike and to «Verschleiss», title, one line) and the
   * bikes as chips when there are several. view: the page's address part (bikes.js), so a chip keeps the page.
   */
  import { t } from '../i18n.svelte.js';
  import { bikesHash } from '../bikes.js';
  import VeloHead from '../bikes/VeloHead.svelte';

  let { bikes = [], bike = null, view, title, sub = '' } = $props();
</script>

<VeloHead
  crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bike?.id ?? null }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care', bike: bike?.id ?? null, open: !!bike }) }, { label: t('Wear|page'), href: bikesHash({ tab: 'care', view: 'wear', bike: bike?.id ?? null }) }]}
  {title}
  {sub}
/>
{#if bikes.length > 1 && bike}
  <nav class="gchips" aria-label={t('Choose a bike')}>
    {#each bikes as b (b.id)}<a class="chip" aria-current={b.id === bike.id ? 'page' : undefined} href={bikesHash({ tab: 'care', view, bike: b.id })}>{b.name}</a>{/each}
  </nav>
{/if}

<style>
  .gchips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 14px;
  }
</style>
