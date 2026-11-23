<script>
  /**
   * «Kursblick» Gold real (Bauplan K15, Noah 22.11.2026 «Teuerung (Jahr frei)»): the gold price in the francs of a year the person
   * chooses, with the rise of consumer prices taken out, and what that means for the change since then. The index is one
   * value a year (api/lake.js ?action=kurse&id=lik); the last days use the last known value, and the screen says so.
   * goldChf: [[day, francs per kg]] as Kursblick has it. Only numbers, no advice.
   */
  import { onMount } from 'svelte';
  import Verlauf from './Verlauf.svelte';
  import { t } from '../i18n.svelte.js';
  import { ladeReihe } from './laden.js';
  import { realReihe, jahre, standardJahr } from './teuerung.js';
  import { zahl, vorzeichen, tagKurz } from './format.js';
  import { localDay } from '../localday.js';

  let { goldChf = [] } = $props();
  let index = $state.raw(null); // the answer, null while loading, false when it did not come
  let jahr = $state(0);
  const heuteJahr = Number(localDay().slice(0, 4));
  const liste = $derived(jahre(goldChf, heuteJahr));
  const wahl = $derived(jahr && liste.includes(jahr) ? jahr : standardJahr(liste, heuteJahr));
  const r = $derived(index && goldChf.length ? realReihe(goldChf, index.points, wahl) : null);
  const tone = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');

  onMount(async () => {
    try {
      index = await ladeReihe('lik');
    } catch {
      index = false;
    }
  });
</script>

<section class="card g-real" data-gold-real aria-labelledby="gr-h">
  <h2 id="gr-h">{t('Gold after inflation')}</h2>
  {#if index === null}
    <p class="muted" role="status">{t('Fetching prices …')}</p>
  {:else if index === false}
    <p class="muted" data-real-fehlt>{t('The consumer price index is not reachable right now, so gold cannot be shown in the francs of an earlier year. Try again later.')}</p>
  {:else if !liste.length}
    <p class="muted">{t('The gold history is too short for this.')}</p>
  {:else}
    <label class="g-jahr">{t('In the francs of the year')}
      <select class="inp" value={String(wahl)} onchange={(e) => (jahr = Number(e.currentTarget.value))} data-real-jahr>
        {#each liste as y (y)}<option value={String(y)}>{y}</option>{/each}
      </select>
    </label>
    {#if r}
      <p class="row"><span>{t('Change since {day}, in francs of the day', { day: tagKurz(r.von) })}</span> <b class="num {tone(r.nominal)}" data-real-nominal>{vorzeichen(r.nominal, 1)} %</b></p>
      <p class="row"><span>{t('Change since {day}, after inflation', { day: tagKurz(r.von) })}</span> <b class="num {tone(r.real)}" data-real-real>{vorzeichen(r.real, 1)} %</b></p>
      <p class="muted small">{t('After inflation means: what the gold buys now compared with what the same gold bought then. A franc of {y} is worth more than a franc of today.', { y: wahl })}</p>
      {#if r.geschaetzt}<p class="muted small" data-real-schaetzung>{t('The price index is known up to {y}; for later days its last value is used, so the last months are an estimate.', { y: r.bisJahr })}</p>{/if}
      <Verlauf points={r.punkte} label={t('Gold in CHF per kg, in francs of {y}', { y: wahl })} dec={0} />
    {/if}
    <p class="muted small">{t('Source of the index: World Bank, consumer prices of Switzerland, one value a year.')}</p>
  {/if}
</section>

<style>
  .g-real {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4);
  }
  .g-real h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .g-jahr {
    display: grid;
    gap: var(--sp-1);
    font-size: var(--fs-small);
    max-width: 14em;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-3);
    margin: 0;
    flex-wrap: wrap;
  }
  .muted {
    margin: 0;
    color: var(--ink-2);
  }
  .small {
    font-size: var(--fs-small);
  }
  .up {
    color: var(--ok);
  }
  .down {
    color: var(--bad);
  }
</style>
