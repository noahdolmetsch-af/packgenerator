<script>
  /**
   * Your trips compared (v0.19.2, Noah 5a): per debriefed trip the gear you took, split into
   * used and not used, with the trend of the last trip against the ones before.
   */
  import { formatWeight } from '../gear.js';
  import { tripRows, trend } from '../insights.js';

  let { trips, debriefs, items } = $props();
  const rows = $derived(tripRows(trips, debriefs, items));
  const tr = $derived(trend(rows));
  const max = $derived(Math.max(1, ...rows.map((r) => r.packedG)));
  const pct = (g) => `${(g / max) * 100}%`;
  const kg = (g) => `${(Math.abs(g) / 1000).toFixed(1)} kg`;
  const fmtDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '');
</script>

{#if rows.length}
  <section id="compare" aria-labelledby="cmp-h">
    <h2 id="cmp-h" class="title h">Your trips compared <small class="muted">{rows.length} debriefs</small></h2>
    <div class="card">
      {#if tr}
        <p class="lead">
          {tr.last}: {tr.packedDiffG <= -100 ? `${kg(tr.packedDiffG)} lighter than` : tr.packedDiffG >= 100 ? `${kg(tr.packedDiffG)} heavier than` : 'about as heavy as'} the trips before on average,
          with {tr.unusedDiffG <= -50 ? `${formatWeight(-tr.unusedDiffG)} less` : tr.unusedDiffG >= 50 ? `${formatWeight(tr.unusedDiffG)} more` : 'about as much'} gear not used ({tr.unusedShare} % of what you took).
        </p>
      {:else}
        <p class="lead">After the next debrief you see here whether you pack better from trip to trip.</p>
      {/if}
      <ul class="bars" aria-label="Gear per trip, used and not used">
        {#each rows as r (r.id)}
          <li>
            <span class="t"><b>{r.title}</b> <small>{fmtDate(r.date)}{r.km ? ` · ${Math.round(r.km)} km` : ''}{r.missingN ? ` · ${r.missingN} missing` : ''}</small></span>
            <span class="bar" role="img" aria-label="{formatWeight(r.packedG)} gear, {formatWeight(r.unusedG)} not used">
              <i class="used" style:width={pct(r.packedG - r.unusedG)}></i><i class="un" style:width={pct(r.unusedG)}></i>
            </span>
            <span class="v num">{formatWeight(r.packedG)}<small>{r.unusedG ? ` · ${formatWeight(r.unusedG)} not used` : ' · all used'}</small></span>
          </li>
        {/each}
      </ul>
      <p class="key small"><i class="used"></i> used <i class="un"></i> not used · gear with a known weight, food and water left out</p>
    </div>
  </section>
{/if}

<style>
  .lead {
    margin: 0 0 12px;
    font-size: 1.05rem;
  }
  .bars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 12px;
  }
  .bars li {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
  }
  .t small,
  .v small {
    color: var(--ink-3);
  }
  .bar {
    display: flex;
    height: 14px;
    background: var(--paper-2);
    border-radius: 3px;
    overflow: hidden;
  }
  .used {
    background: var(--ink);
  }
  .un {
    background: #d9822b;
  }
  .key {
    margin: 12px 0 0;
    color: var(--ink-3);
  }
  .key i {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    vertical-align: -1px;
  }
</style>
