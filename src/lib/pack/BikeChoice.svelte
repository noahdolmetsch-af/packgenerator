<script>
  /**
   * Which bike for this trip? (v0.19.3, N13): the bikes side by side. "Use for this trip" moves
   * the trip to that bike and its bags, like changing the bike under Edit.
   */
  import { formatWeight, knownWeight } from '../gear.js';
  import { formatVolume } from '../bikes.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { bikeCareWords } from '../readiness.js';

  let { rows, trip, onpick, onclose } = $props();
  let dialog;

  $effect(() => {
    dialog.showModal();
  });

  const pick = (r) => {
    onpick(r.bike);
    dialog.close();
  };
  const chf = (n) => `CHF ${num(Math.round(n))}`;
</script>

<dialog class="sheet wide" bind:this={dialog} onclose={onclose} aria-labelledby="choice-h">
  <p class="meta">{trip.title}</p>
  <h2 id="choice-h" class="title">{t('Which bike?')}</h2>
  <div class="grid">
    {#each rows as r (r.bike.id)}
      <section class="b" class:cur={r.current} aria-label={r.bike.name}>
        <h3>{r.bike.name}{#if r.current}<span class="tag">{t('this trip')}</span>{/if}</h3>
        <dl>
          <dt>{t('Bike + bags')}</dt>
          <!-- v0.22.0 (AP04): known part with the missing bag weights, and whether the bike is measured. -->
          <dd class="num">{r.totalG ? knownWeight(r.totalG, r.missing, (g) => `${r.bikeKind === 'estimate' ? '~' : ''}${formatWeight(g)}`) : t('not weighed')}{#if r.lightest}<span class="good">{t('lightest')}</span>{/if}{#if r.totalG && r.missing}<small>{tn(r.missing, '{n} bag not weighed', '{n} bags not weighed')}</small>{/if}{#if r.totalG}<small>{r.bikeKind === 'estimate' ? t('bike weight estimated') : t('bike weight measured')}</small>{/if}</dd>
          <dt>{t('Bags')}</dt>
          <dd class="num">
            {formatVolume(r.volumeL)}{#if r.roomiest}<span class="good">{t('most room')}</span>{/if}
            {#if r.full}<small class="warn">{t('your gear needs {vol}: tight', { vol: formatVolume(r.gearL) })}</small>{:else if r.gearL != null}<small>{t('your gear needs {vol}', { vol: formatVolume(r.gearL) })}</small>{/if}
          </dd>
          <!-- v0.22.0 (AP06): Bike care in the same words as Home, Pack and Care. -->
          <dt>{t('Bike care')}</dt>
          <dd class:warn={r.late}>{bikeCareWords(r.care).tag}{#if r.care.soon.length} · {tn(r.care.soon.length, '{n} more before or on the trip', '{n} more before or on the trip')}{/if}{#if r.care.status === 'due'}<small>{bikeCareWords(r.care).text}</small>{/if}</dd>
          <dt>{t('Per 1000 km')}</dt>
          <dd class="num">{r.per?.chf != null ? chf(r.per.chf) : '–'}</dd>
          <dt>{t('Trips before')}</dt>
          <dd class="num">{r.trips}</dd>
        </dl>
        {#if !r.current}<button type="button" class="btn sm" onclick={() => pick(r)}>{t('Use for this trip')}</button>{/if}
      </section>
    {/each}
  </div>
  <p class="hint">{t('Another bike brings its own bags. Items in a place without a bag move to the seat pack. Undo puts it back.')}</p>
  <div class="foot"><button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button></div>
</dialog>

<style>
  .wide {
    width: min(980px, calc(100vw - 24px));
  }
  .meta {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  h2 {
    font-size: var(--fs-section);
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
    font-size: var(--fs-small);
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
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .good {
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ok);
  }
  .warn,
  dd small.warn {
    color: var(--bad);
  }
  .hint {
    font-size: var(--fs-small);
    color: var(--ink-3);
    margin: 8px 0 0;
  }
  .foot {
    margin: 12px 0 4px;
  }
</style>
