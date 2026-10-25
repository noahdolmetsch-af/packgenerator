<script>
  /**
   * Touren › Reise-Links (#/travel; Noah 19.10.2026 «1b 2b 3a 4a 5b», answer 5b): all travel links in
   * one place, grouped. Here they open without a place or day; at a trip (Planen › Anreise und Unterkunft)
   * the same links come with the trip's place and days filled in. A flight number typed here gives the
   * Flightradar24 link at once (it is not stored). Every link opens in a new tab; «…» switches one off.
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Woanders from '../lib/sk/Woanders.svelte';
  import { bookingUrl, airbnbUrl, hostelworldUrl, HUT_URL, WARMSHOWERS_URL, flightradarUrl, googleFlightsUrl, flightNo, carUrl, rome2rioUrl, sbbUrl, edaUrl, wikivoyageUrl, meteoUrl, windyUrl, swisstopoUrl, schweizMobilUrl } from '../lib/sk/links.js';
  import { t, lang } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';
  import TravelChoices from '../lib/reise/TravelChoices.svelte'; // Paket B, UC-032-I1 + I2: options to compare

  let no = $state('');
  const fno = $derived(flightNo(no));

  const groups = $derived([
    { key: 'stay', title: t('Places to stay'), links: [
      { kind: 'xbk', href: bookingUrl(null, '', '', lang.v), icon: 'bed', sub: t('Hotels and flats') },
      { kind: 'xab', href: airbnbUrl(null), icon: 'bed', sub: t('Flats and rooms') },
      { kind: 'xhw', href: hostelworldUrl(null), icon: 'bed', sub: t('Hostels') },
      { kind: 'xsac', href: HUT_URL, icon: 'mountain', sub: t('SAC and other huts') },
      { kind: 'xws', href: WARMSHOWERS_URL, icon: 'home', sub: t('Free hosts for cyclists') },
    ] },
    { key: 'fly', title: t('Flying'), links: [
      { kind: 'xfr', href: flightradarUrl(fno), icon: 'plane', sub: fno ? fno : t('Flights live on the map') },
      { kind: 'xgf', href: googleFlightsUrl(null, '', lang.v), icon: 'plane', sub: t('Find a flight') },
    ] },
    { key: 'go', title: t('Getting there'), links: [
      { kind: 'x3s', href: sbbUrl(null, '', lang.v), icon: 'train', sub: t('Timetable') },
      { kind: 'xcar', href: carUrl(null), icon: 'car', sub: t('Route by car') },
      { kind: 'xr2r', href: rome2rioUrl(null), icon: 'route', sub: t('All ways there') },
    ] },
    { key: 'abroad', title: t('Abroad'), links: [
      { kind: 'xeda', href: edaUrl(lang.v), icon: 'shield', sub: t('Safety and entry') },
      { kind: 'xwv', href: wikivoyageUrl(null, lang.v), icon: 'book', sub: t('Free travel guide') },
    ] },
    { key: 'wx', title: t('Weather and maps'), links: [
      { kind: 'x3m', href: meteoUrl(lang.v), icon: 'cloudsun', sub: t('Forecast map') },
      { kind: 'x16', href: windyUrl(null), icon: 'wind', sub: t('Wind map') },
      { kind: 'x10', href: swisstopoUrl(null), icon: 'map', sub: t('National map') },
      { kind: 'x12', href: schweizMobilUrl(lang.v), icon: 'signpost', sub: t('Official cycling routes of Switzerland') },
    ] },
  ]);
</script>

<div class="ich-page trv" data-travel-page>
  <VeloHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} here={t('Travel links')} title={t('Travel links')} sub={t('Booking, flights, getting there and more, in one place.')} />
  <p class="trv-intro">{t('At a trip, the same links come with its place and days filled in: open the trip, «Plan», then «Getting there and staying». Here they open without a place.')}</p>
  <label class="trv-f">
    <span>{t('Follow a flight: flight number')}</span>
    <input class="inp" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" bind:value={no} placeholder={t('e.g. LX 1234')} />
  </label>
  <TravelChoices />
  {#each groups as g (g.key)}
    <section class="card trv-g" data-travel-group={g.key}>
      <h2>{g.title}</h2>
      <Woanders stack context={t('Travel links')} links={g.links} />
    </section>
  {/each}
  <p class="trv-intro">{t('Nothing goes to these sites but what stands in the link. A link switched off with «…» comes back under Me › Appearance.')}</p>
</div>

<style>
  .trv {
    max-width: 760px;
  }
  .trv-intro {
    max-width: 65ch;
    margin: 0 0 var(--sp-3);
    color: var(--ink-2);
  }
  .trv-f {
    display: grid;
    gap: 4px;
    max-width: 280px;
    margin: 0 0 var(--sp-4);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .trv-g {
    margin: 0 0 var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
  }
  .trv-g h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
</style>
