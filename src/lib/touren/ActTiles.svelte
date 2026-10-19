<script>
  /**
   * Tour-Seite, answer 4 «beides» (Noah 19.10.2026): «Abgeschlossene Touren» as tiles: a small still line
   * of the tour, the name, the date and three numbers. The whole tile opens the tour. In «Auswählen» a
   * tap chooses it instead (5a).
   * rows: list rows; lineOf(row): the map lines of a row; picking: choose mode; picked: Set of row ids; onpick(row).
   */
  import { t, tn } from '../i18n.svelte.js';
  import KindIcon from '../strava/KindIcon.svelte';
  import TripState from '../ui/TripState.svelte';
  import { n0, n1, hours, dates, DASH } from '../review/fmt.js';
  import { miniPath } from './tour.js';
  import { typeKey } from '../training.js';
  import { Check } from '@lucide/svelte';

  let { rows = [], lineOf = () => [], picking = false, picked = new Set(), onpick } = $props();
  const secs = (s) => hours(s ? s / 3600 : null);
  const when = (r) => (r.n > 1 ? `${dates(r.day, r.endDay)} · ${tn(r.n, '{n} activity', '{n} activities')}` : dates(r.day));
</script>

<ul class="tiles" data-act-tiles>
  {#each rows as r (r.id)}
    {@const d = miniPath(lineOf(r), 160, 90)}
    <li class="tile" class:on={picked.has(r.id)} data-act-tile={r.id}>
      {#if picking}
        <button type="button" class="hit" aria-pressed={picked.has(r.id)} onclick={() => onpick?.(r)} aria-label={t('Choose {name}', { name: r.name || t(typeKey(r.type)) })}></button>
      {:else}
        <a class="hit" href={r.href} aria-label={r.name || t(typeKey(r.type))}></a>
      {/if}
      <svg class="mini" viewBox="0 0 160 90" aria-hidden="true">
        {#if d}<path {d} />{:else}<text x="80" y="50" text-anchor="middle">{t('no line')}</text>{/if}
      </svg>
      <div class="tb">
        <p class="tn"><KindIcon kind={r.kind} size={15} /><span>{r.name || t(typeKey(r.type))}</span>{#if picking}<span class="ck" aria-hidden="true">{#if picked.has(r.id)}<Check size={14} />{/if}</span>{/if}</p>
        <p class="tw">{when(r)}{#if r.changed?.length} · {t('changed')}{/if}</p>
        {#if r.pm}<p class="tpm"><TripState state={r.pm.state} /></p>{/if}
        <p class="tv num"><span><b>{r.km > 0 ? n1(r.km) : DASH}</b> km</span><span><b>{n0(r.hm)}</b> {t('Hm|col')}</span><span><b>{secs(r.dauer)}</b></span></p>
      </div>
    </li>
  {/each}
</ul>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tile {
    position: relative;
    display: grid;
    overflow: hidden;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .tile:hover {
    border-color: var(--line-strong);
  }
  .tile.on {
    outline: 3px solid var(--ink);
    outline-offset: -3px;
  }
  .hit {
    position: absolute;
    inset: 0;
    z-index: 1;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .hit:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
  .mini {
    display: block;
    width: 100%;
    height: 90px;
    background: var(--paper-2);
  }
  .mini path {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .mini text {
    fill: var(--ink-3);
    font: 400 var(--fs-tiny) var(--font-body);
  }
  .tb {
    display: grid;
    gap: 4px;
    padding: 10px 12px 12px;
  }
  .tn {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .tn span:nth-child(2) {
    flex: 1;
    min-width: 0;
  }
  .ck {
    display: grid;
    flex: none;
    place-items: center;
    width: 22px;
    height: 22px;
    border: 2px solid var(--ink);
    border-radius: 6px;
  }
  .tile.on .ck {
    background: var(--ink);
    color: var(--paper);
  }
  .tw,
  .tpm {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tv {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tv b {
    color: var(--ink);
  }
</style>
