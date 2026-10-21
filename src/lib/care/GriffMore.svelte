<script>
  /**
   * Paket VG «Das Velo im Griff» on the page «Verschleiss»: what lasts longest (1133, km per brand from the
   * own used-up parts), the ways to the pages (wear photos, sale listing, pack the bike, spare parts), and the
   * switches: the evening reminder after a wet ride (1128), a new wear photo every X km (1129), the month of
   * the spring service (1134, a to-do in Kalender › Merken).
   * bike: the shown bike; stats: brandStats of all bikes.
   */
  import { liveQuery } from 'dexie';
  import { Award, Camera, Tag, Luggage, Package, ChevronRight, Bell } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { bikesHash } from '../bikes.js';
  import { PREFS_KEY, prefsOf, BRAND_PARTS } from '../griff.js';
  import { changeSetting, syncSpringTodo } from '../griffdb.js';

  let { bike, stats } = $props();
  const prefsQ = liveQuery(() => db.settings.get(PREFS_KEY));
  const prefs = $derived(prefsOf($prefsQ?.value));
  const GROUP = { chain: 'Chains', tyres: 'Tyres', pads: 'Brake pads' };
  const monthName = (m) => new Date(Date.UTC(2026, m - 1, 1)).toLocaleDateString(locale(), { month: 'long', timeZone: 'UTC' });
  const set = async (patch) => {
    await changeSetting(PREFS_KEY, {}, (old) => ({ ...(old ?? {}), ...patch }));
    if ('springMonth' in patch) await syncSpringTodo();
  };
  $effect(() => {
    syncSpringTodo().catch(() => {}); // the to-do follows what is due now
  });
  const PAGES = [
    { view: 'photos', icon: Camera, title: 'Wear photos', sub: 'Chain, chainring and tyre: old next to new' },
    { view: 'sell', icon: Tag, title: 'Sale listing', sub: 'A text from km, services and parts' },
    { view: 'bikepack', icon: Luggage, title: 'Pack the bike', sub: 'Checklist and photos for train or plane' },
    { view: 'stock', icon: Package, title: 'Spare parts at home', sub: 'What is in stock, what is missing' },
  ];
</script>

<section class="gcard" aria-labelledby="gm-brand" data-brands>
  <h2 id="gm-brand"><Award size={18} aria-hidden="true" />{t('What lasts longest')}</h2>
  {#if Object.values(stats).some((l) => l.length)}
    <p class="quiet">{t('From your own parts that were used up, on all bikes. A help when you buy new ones.')}</p>
    {#each Object.keys(BRAND_PARTS) as g (g)}
      {#if stats[g]?.length}
        <p data-brand-group={g}><b>{t(GROUP[g])}:</b> {stats[g].slice(0, 3).map((x) => `${x.brand} ${t('{km} km', { km: num(x.km) })} (${tn(x.n, '{n} part', '{n} parts')})`).join(' · ')}</p>
      {/if}
    {/each}
  {:else}
    <p class="quiet">{t('Once a chain, tyre or brake pad with a model name is replaced, the app shows here which brand lasted longest.')}</p>
  {/if}
</section>

<section class="gcard" aria-labelledby="gm-more">
  <h2 id="gm-more">{t('More for the bike')}</h2>
  <ul class="list">
    {#each PAGES as p (p.view)}
      <li><a class="go" href={bikesHash({ tab: 'care', view: p.view, bike: bike.id })} data-griff-page={p.view}><p.icon size={18} aria-hidden="true" /><span class="grow"><b>{t(p.title)}</b><br /><small class="quiet">{t(p.sub)}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li>
    {/each}
  </ul>
</section>

<section class="gcard" aria-labelledby="gm-rem" data-griff-prefs>
  <h2 id="gm-rem"><Bell size={18} aria-hidden="true" />{t('Reminders')}</h2>
  <label class="gsw"><input type="checkbox" checked={prefs.wetChain} onchange={(e) => set({ wetChain: e.currentTarget.checked })} data-pref-wet /> <span>{t('After a ride in the rain: «Dry and oil the chain» here and at 19:00 on the phone')}</span></label>
  <label class="gsw"><input type="checkbox" checked={prefs.shotEveryKm != null} onchange={(e) => set({ shotEveryKm: e.currentTarget.checked ? 1000 : null })} data-pref-shot /> <span>{t('A new wear photo every')}</span>
    {#if prefs.shotEveryKm != null}<input class="inp ev" type="number" min="100" max="20000" step="100" value={prefs.shotEveryKm} onchange={(e) => set({ shotEveryKm: Math.max(100, Math.round(Number(e.currentTarget.value) || 1000)) })} aria-label={t('km between two wear photos')} /> km{:else}<span class="quiet">{t('off')}</span>{/if}
  </label>
  <label class="gsw"><span>{t('Spring service: a reminder in')}</span>
    <select class="sel" value={prefs.springMonth ?? ''} onchange={(e) => set({ springMonth: e.currentTarget.value ? Number(e.currentTarget.value) : null })} data-pref-spring>
      <option value="">{t('off')}</option>
      {#each Array.from({ length: 12 }, (_, i) => i + 1) as m (m)}<option value={m}>{monthName(m)}</option>{/each}
    </select>
  </label>
  <p class="quiet">{t('The spring reminder is a to-do in Kalender › Merken, with what is due on each bike. On the phone: Me › Reminders on the phone.')}</p>
</section>

<style>
  .go {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    color: inherit;
    text-decoration: none;
  }
  .gsw {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    min-height: 44px;
  }
  .ev {
    width: 6rem;
    min-height: 40px;
  }
</style>
