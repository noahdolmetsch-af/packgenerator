<script>
  /**
   * Tour-Seite, answer 4 «beides» (Noah 19.10.2026): «Abgeschlossene Touren» on one map: the line of each
   * tour and a dot at its start; a tap on the dot opens the tour. At most MAX tours (the newest) show.
   * rows: list rows; lineOf(row): its map lines.
   */
  import { t, tn } from '../i18n.svelte.js';
  import TourMap from '../spur/TourMap.svelte';
  import { phone } from '../media.svelte.js';

  let { rows = [], lineOf = () => [] } = $props();
  const MAX = 150;
  const shown = $derived(rows.slice(0, MAX).map((r, i) => ({ r, lines: lineOf(r).map((l) => ({ ...l, id: `${r.id}-${l.id}`, n: (i % 6) + 1 })) })).filter((x) => x.lines.length));
  const lines = $derived(shown.flatMap((x) => x.lines));
  const points = $derived(shown.map((x, i) => ({ id: x.r.id, kind: 'tour', pos: x.lines[0].pts[0], text: x.r.name, n: i + 1, href: x.r.href })));
</script>

<div class="amap" data-act-map>
  {#if lines.length}
    <TourMap {lines} {points} height={phone.matches ? 360 : 480} onpick={(p) => (location.hash = p.href)} label={t('Map of the completed trips: drag to move, pinch or wheel to zoom')} />
    <p class="tp-muted tp-small">{tn(shown.length, '{n} tour with a line. A tap on a number opens it.', '{n} tours with a line. A tap on a number opens it.')}{#if rows.length > MAX}{' '}{t('The newest {n} show.', { n: MAX })}{/if}</p>
  {:else}
    <p class="card none">{t('No tour of this list has a line yet. Strava sends the lines with the next fetch.')}</p>
  {/if}
</div>

<style>
  .amap p {
    margin: 6px 0 0;
  }
  .none {
    padding: 14px 16px;
    color: var(--ink-2);
  }
</style>
