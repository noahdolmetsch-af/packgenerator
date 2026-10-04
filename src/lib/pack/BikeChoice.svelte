<script>
  /**
   * Which bike for this trip? (v0.19.3, N13): the bikes side by side. "Use for this trip" moves
   * the trip to that bike and its bags, like changing the bike under Edit.
   */
  import { formatWeight } from '../gear.js';
  import { formatVolume } from '../bikes.js';

  let { rows, trip, onpick, onclose } = $props();
  let dialog;

  $effect(() => {
    dialog.showModal();
  });

  const pick = (r) => {
    onpick(r.bike);
    dialog.close();
  };
  const chf = (n) => `CHF ${Math.round(n).toLocaleString('de-CH')}`;
</script>

<dialog class="sheet wide" bind:this={dialog} onclose={onclose} aria-labelledby="choice-h">
  <p class="meta">{trip.title}</p>
  <h2 id="choice-h" class="title">Which bike?</h2>
  <div class="grid">
    {#each rows as r (r.bike.id)}
      <section class="b" class:cur={r.current} aria-label={r.bike.name}>
        <h3>{r.bike.name}{#if r.current}<span class="tag">this trip</span>{/if}</h3>
        <dl>
          <dt>Bike + bags</dt>
          <dd class="num">{r.totalG ? formatWeight(r.totalG) : 'not weighed'}{#if r.lightest}<span class="good">lightest</span>{/if}</dd>
          <dt>Bags</dt>
          <dd class="num">
            {formatVolume(r.volumeL)}{#if r.roomiest}<span class="good">most room</span>{/if}
            {#if r.full}<small class="warn">your gear needs {formatVolume(r.gearL)}: tight</small>{:else if r.gearL != null}<small>your gear needs {formatVolume(r.gearL)}</small>{/if}
          </dd>
          <dt>Before the start</dt>
          <dd class:warn={r.late}>{r.due ? `${r.due} to do${r.late ? `, ${r.late} overdue` : ''}` : 'nothing due'}</dd>
          <dt>Per 1000 km</dt>
          <dd class="num">{r.per?.chf != null ? chf(r.per.chf) : '–'}</dd>
          <dt>Trips before</dt>
          <dd class="num">{r.trips}</dd>
        </dl>
        {#if !r.current}<button type="button" class="btn sm" onclick={() => pick(r)}>Use for this trip</button>{/if}
      </section>
    {/each}
  </div>
  <p class="hint">Another bike brings its own bags. Items in a place without a bag move to the seat pack. Undo puts it back.</p>
  <div class="foot"><button type="button" class="btn" onclick={() => dialog.close()}>Close</button></div>
</dialog>

<style>
  .wide {
    width: min(980px, calc(100vw - 24px));
  }
  .meta {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  h2 {
    font-size: 30px;
    margin: 4px 0 10px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }
  .b {
    border: 1.5px solid var(--line);
    border-radius: 8px;
    padding: 10px 12px;
    min-width: 0;
  }
  .b.cur {
    border-color: var(--ink);
  }
  h3 {
    margin: 0 0 6px;
    font-size: 17px;
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .tag {
    font-size: 12px;
    font-weight: 700;
    background: var(--ink);
    color: var(--paper);
    border-radius: 999px;
    padding: 1px 8px;
  }
  dl {
    margin: 0 0 8px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 10px;
    font-size: 14px;
  }
  dt {
    color: var(--ink-3);
  }
  dd {
    margin: 0;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  dd small {
    font-weight: 400;
    font-size: 13px;
    color: var(--ink-3);
  }
  .good {
    font-size: 12px;
    font-weight: 700;
    color: #1f7a3d;
  }
  .warn,
  dd small.warn {
    color: #b42318;
  }
  .hint {
    font-size: 13px;
    color: var(--ink-3);
    margin: 8px 0 0;
  }
  .foot {
    margin: 12px 0 4px;
  }
</style>
