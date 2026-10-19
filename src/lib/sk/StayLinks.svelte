<script>
  /**
   * «Reise-Links» for one night (Noah 19.10.2026 «1b»): Booking.com, Airbnb and Hostelworld at a sleep place
   * with its night filled in. For the race plan (Paket U: a bed POI { kind: 'sleep', name, lat, lon, km })
   * or any other place to sleep. Only the name and the night go into the links.
   *
   * place: { name, lat?, lon? }; night: YYYY-MM-DD (check-in; check-out is the next day); stack: one per line
   */
  import Woanders from './Woanders.svelte';
  import { bookingUrl, airbnbUrl, hostelworldUrl, plusDays } from './links.js';
  import { t, lang, locale } from '../i18n.svelte.js';

  let { place, night = '', stack = true } = $props();

  const out = $derived(night ? plusDays(night, 1) : '');
  const sub = $derived(night ? new Date(`${night}T00:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) : t('Hotels nearby'));
  const links = $derived(
    place?.name
      ? [
          { kind: 'xbk', href: bookingUrl(place, night, out, lang.v), icon: 'bed', sub },
          { kind: 'xab', href: airbnbUrl(place, night, out), icon: 'bed', sub },
          { kind: 'xhw', href: hostelworldUrl(place, night, out), icon: 'bed', sub },
        ]
      : [],
  );
</script>

<Woanders {stack} context={place?.name ?? ''} {links} />
