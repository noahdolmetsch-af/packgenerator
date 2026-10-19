<script>
  /**
   * «Bausteine» (Noah 15.10.2026, B3 a+b; mockups BS1, BS2): the page of the building blocks of the
   * Bike pass and the Workshop order. Chips for the sheet, «For all bikes» or «Only for {bike}», the
   * blocks on the sheet left (arrows, drag, switch, «…»), «More building blocks» right (one column on
   * a phone), «New own block», back to the standard. Everything here is a suggestion.
   * views(sheet): { [id]: { summary, empty } } of this bike; onnotice(text, undo).
   */
  import { Eye, RotateCcw } from '@lucide/svelte';
  import { t } from '../../i18n.svelte.js';
  import { bikesHash } from '../../bikes.js';
  import { hasOwnLayout } from '../../sheetblocks.js';
  import { setScope, resetAll, lastSheet } from './blockstore.js';
  import BlockArrange from './BlockArrange.svelte';
  import BlockAsk from './BlockAsk.svelte';

  let { bike, bikes = [], glob, views, from = null, onnotice } = $props();

  let sheet = $state(lastSheet.v);
  $effect(() => {
    lastSheet.v = sheet;
  });
  const mine = $derived(hasOwnLayout(bike, sheet));
  let asking = $state(false);

  async function scope(s) {
    if ((s === 'bike') === mine) return;
    const undo = await setScope(bike.id, sheet, s);
    onnotice?.(s === 'bike' ? t('{bike} has its own order now.', { bike: bike.name }) : t('Standard set again.'), undo);
  }
  async function reset(v) {
    if (v !== 'reset') return;
    const undo = mine ? await setScope(bike.id, sheet, 'all') : await resetAll(sheet);
    onnotice?.(t('Standard set again.'), undo);
  }
</script>

<div class="bpage" data-testid="blocks-page">
  <p class="lead">{t('Choose what each sheet shows and in which order.')}</p>
  <a class="btn view" href={bikesHash({ tab: 'setup', bike: bike.id, sheet, from })}><Eye size={16} aria-hidden="true" />{t('View the sheet')}</a>

  <div class="chips" role="group" aria-label={t('Sheet')}>
    <button type="button" class="chip" aria-pressed={sheet === 'pass'} onclick={() => (sheet = 'pass')}>{t('Bike pass')}</button>
    <button type="button" class="chip" aria-pressed={sheet === 'order'} onclick={() => (sheet = 'order')}>{t('Workshop order|sheet')}</button>
  </div>

  <div class="seg" role="group" aria-label={t('For which bikes')}>
    <button type="button" aria-pressed={!mine} onclick={() => scope('all')}>{t('For all bikes')}</button>
    <button type="button" aria-pressed={mine} onclick={() => scope('bike')}>{t('Only for {bike}', { bike: bike.name })}</button>
  </div>
  <p class="hint">{mine ? t('{bike} has its own order. The others keep the standard.', { bike: bike.name }) : t('Applies to every bike without its own order.')}</p>

  <div class="cols">
    <section class="bcard" aria-labelledby="bp-on">
      <h2 id="bp-on">{t('On the sheet')}</h2>
      <p class="hint">{t('Move with the arrows or drag. The switch hides a block in the PDF and the text too.')}</p>
      {#key sheet}<BlockArrange {bike} {bikes} {glob} {sheet} views={views(sheet)} part="list" variant="page" {onnotice} />{/key}
      <button type="button" class="btn reset" onclick={() => (asking = true)}><RotateCcw size={16} aria-hidden="true" />{mine ? t('Use the standard again') : t('Back to the standard')}</button>
    </section>
    <section class="bcard" aria-labelledby="bp-lib">
      <h2 id="bp-lib">{t('More building blocks')}</h2>
      <p class="hint">{t('Tap + to put a block on the sheet.')}</p>
      {#key sheet}<BlockArrange {bike} {bikes} {glob} {sheet} views={views(sheet)} part="library" variant="page" {onnotice} />{/key}
    </section>
  </div>
  <p class="foot">{t('Everything here is a suggestion and can be changed.')}</p>
</div>

{#if asking}
  <BlockAsk
    title={mine ? t('{bike} takes the standard order again.', { bike: bike.name }) : t('Back to the standard?')}
    text={mine ? t('Its texts stay.') : t('Order and switches of all bikes without their own order. Own blocks stay.')}
    options={[
      { value: 'reset', label: mine ? t('Take the standard') : t('Reset') },
      { value: 'keep', label: t('Cancel') },
    ]}
    onpick={reset}
    onclose={() => (asking = false)}
  />
{/if}

<style>
  .bpage {
    min-width: 0;
  }
  .lead {
    margin: -8px 0 12px;
    color: var(--ink-2);
  }
  .view,
  .reset {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    text-decoration: none;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 18px 0 12px;
  }
  .chip {
    min-height: 44px;
    padding: 6px 16px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .seg {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 3px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .seg button {
    min-height: 44px;
    padding: 6px 14px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
  }
  .seg button[aria-pressed='true'] {
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 1px 2px var(--shadow);
  }
  .hint {
    margin: 6px 2px 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .cols {
    display: grid;
    gap: 20px;
    margin-top: 18px;
  }
  @media (min-width: 1000px) {
    .cols {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      align-items: start;
    }
  }
  .bcard {
    padding: 18px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    min-width: 0;
  }
  .bcard h2 {
    margin: 0;
    font: 600 var(--fs-section) / 1.3 var(--font-body);
  }
  .bcard .hint {
    margin: 4px 0 12px;
  }
  .reset {
    margin-top: 14px;
  }
  .foot {
    margin: 16px 2px 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
