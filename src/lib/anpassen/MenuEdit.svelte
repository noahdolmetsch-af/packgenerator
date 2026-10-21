<script>
  /**
   * «Anpassen» 2a + 3a (Noah 20.10.2026): the menu (the bar at the bottom of a phone, the sidebar of a
   * computer): show, hide, rename and sort the places. Heute always stays. A hidden place is still there:
   * the search and Ich › Darstellung lead to it.
   */
  import { t } from '../i18n.svelte.js';
  import { PLACES } from '../nav.js';
  import { menuPlaces, setPlaceHidden, setPlaceOrder, setPlaceName, moved, ALWAYS_SHOWN } from '../anpassen.js';
  import { anp, change, placeLabel } from '../anpassen.svelte.js';
  import EditRows from './EditRows.svelte';

  const all = $derived((void anp.v, menuPlaces(anp.cfg, PLACES, { all: true })));
  const rows = $derived(
    all.map((p) => ({ key: p.key, label: placeLabel(p), orig: t(p.label), hidden: anp.cfg.menu.hide.includes(p.key), locked: ALWAYS_SHOWN.includes(p.key) })),
  );
</script>

<EditRows
  {rows}
  label={t('Menu')}
  onmove={(from, to) => change((c) => setPlaceOrder(c, moved(all.map((p) => p.key), from, to)))}
  onhide={(key, hidden) => change((c) => setPlaceHidden(c, key, hidden))}
  onrename={(key, name, orig) => change((c) => setPlaceName(c, key, name, orig))}
/>
