<script>
  /**
   * SN2+ SN2h T1 «Pro Velo und Untergrund» (mockup approved 13.10.2026, answer 4b): per bike Strasse,
   * Gravel and Trail with km/h and the number of rides. From CELL_MIN rides that value is used for the
   * riding time of a new trip with that bike, below it the rule. grid: werte.js paceGrid(); rule: the
   * km/h of the rule in use.
   */
  import { t, tn, num } from '../i18n.svelte.js';
  import { n1 } from '../review/fmt.js';
  import { SURFACES, CELL_MIN } from '../review/werte.js';
  import { Bike, Info } from '@lucide/svelte';

  let { grid = [], rule = null } = $props();
  const example = $derived.by(() => {
    for (const g of grid) for (const s of SURFACES) if (g.cells[s.key]?.counts) return { bike: g.bike.name, surface: t(s.name), kmh: g.cells[s.key].kmh };
    return null;
  });
</script>

<section class="rv-sec pg" aria-labelledby="pg-h" data-pace-grid>
  <div class="rv-h"><div><h2 id="pg-h">{t('Per bike and surface')}</h2><p class="rv-sub">{t('from {n} rides the own value counts, else your rule', { n: CELL_MIN })}</p></div></div>
  <div class="rv-box pad">
    {#if grid.length}
      <div class="gh" aria-hidden="true"><span></span>{#each SURFACES as s (s.key)}<span>{t(s.name)}</span>{/each}</div>
      <ul class="gl">
        {#each grid as g (g.bike.id)}
          <li class="gr" data-bike={g.bike.id}>
            <span class="gb"><Bike size={16} aria-hidden="true" />{g.bike.name}</span>
            {#each SURFACES as s (s.key)}
              {@const c = g.cells[s.key]}
              <span class="gc" data-surface={s.key} data-counts={c.counts ? '1' : '0'}>
                <span class="gs">{t(s.name)}</span>
                {#if c.counts}<b class="num">{n1(c.kmh)}</b><small class="num">{tn(c.n, 'km/h · {n} ride', 'km/h · {n} rides')}</small>
                {:else if c.n}<span class="rl">{t('Rule|pace')}</span><small class="num">{tn(c.n, 'only {n} ride', 'only {n} rides')}</small>
                {:else}<span class="rl">–</span><small>{t('no ride')}</small>{/if}
              </span>
            {/each}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="none">{t('Rides with a bike and a moving time show up here: from Strava, or a GPX file on the same day as a ride of the bike.')}</p>
    {/if}
  </div>
  <p class="rv-note"><Info size={16} aria-hidden="true" /><span>{t('The surface comes from the Strava sport type (Ride, Gravel, Mountain bike) and can be changed per ride.')}{#if example && rule}{' '}{t('A new trip with {bike} on {surface}: {kmh} km/h instead of {rule}.', { bike: example.bike, surface: example.surface, kmh: n1(example.kmh), rule: num(rule) })}{/if}</span></p>
</section>

<style>
  .gh,
  .gr {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) repeat(3, minmax(0, 1fr));
    gap: 8px 12px;
    align-items: center;
  }
  .gh {
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .gl {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .gr {
    min-height: 64px;
    padding: 10px 0;
  }
  .gr + .gr {
    border-top: 1px solid var(--line);
  }
  .gb {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .gb :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .gc {
    display: grid;
    gap: 1px;
    min-width: 0;
  }
  .gc b {
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
  }
  .gc small,
  .gs {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .gs {
    display: none;
  }
  .rl {
    color: var(--ink-2);
  }
  .none {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pg .rv-note {
    margin-top: 10px;
  }
  @media (max-width: 559px) {
    .gh {
      display: none;
    }
    .gr {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .gb {
      grid-column: 1 / -1;
    }
    .gs {
      display: block;
    }
  }
</style>
