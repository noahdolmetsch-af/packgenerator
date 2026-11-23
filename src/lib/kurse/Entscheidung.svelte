<script>
  /**
   * «Kursblick» Entscheidung, Teil 3 (Noah 23.11.2026 «1, 3 und 4 zusammen», «ok freigabe»): the tab «Decision» for gold, which
   * helps to decide «buy more, wait or sell» by the person's OWN rules. Three cards: the trend (the price against the mean of
   * its last 50 and 200 closes), where the price stands in the last five years, and the own buying rule (a monthly amount,
   * a factor when the trend is red, a factor when the price is very expensive) with its look back over 60 months against
   * «always the same amount». Observations and the result of the person's own rule: nothing predicts a price, nothing is advice.
   * goldChf: the gold series in francs per kilogram. The rule lives in the setting `kurse.regeln` (private, on the devices,
   * in the backup file and sealed in the sync); the price service hears nothing of it.
   */
  import { onMount } from 'svelte';
  import { TrendingUp } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { ampel, lage, regelVorschlag, rueckblick, liesRegeln, liesRegel, REGELN_KEY, FAKTOREN, MITTEL_KURZ, MITTEL_LANG } from './signale.js';
  import { zahl, anzahl, vorzeichen, tagKurz } from './format.js';

  let { goldChf = [] } = $props();

  const ID = 'gold';
  let regeln = $state.raw({});
  let geladen = $state(false);
  const regel = $derived(liesRegel(regeln[ID]));

  onMount(async () => {
    try {
      regeln = liesRegeln((await db.settings.get(REGELN_KEY))?.value);
    } catch {
      /* nothing saved: no rule yet */
    }
    geladen = true;
  });

  async function speichere(teil) {
    const next = { ...regeln, [ID]: liesRegel({ ...regel, ...teil }) };
    regeln = next;
    await db.settings.put({ key: REGELN_KEY, value: JSON.parse(JSON.stringify(next)) }).catch(() => {});
  }
  // saved while typing, so the suggestion follows at once; a comma counts as a point
  const setBetrag = (v) => speichere({ grundbetrag: Math.max(0, Number(String(v).replace(',', '.')) || 0) });
  const setFaktor = (feld, v) => speichere({ [feld]: Number(v) });

  const letzter = $derived(goldChf.length - 1);
  const trend = $derived(ampel(goldChf));
  const stand = $derived(lage(goldChf));
  const vorschlag = $derived(goldChf.length ? regelVorschlag(goldChf, letzter, regel) : null);
  const rueck = $derived(rueckblick(goldChf, regel));
  const tag = $derived(goldChf.length ? goldChf[letzter][0] : '');

  const SATZ = {
    gruen: 'The price is above both averages: the trend points up.',
    gelb: 'The price is between the two averages: the trend is not clear.',
    rot: 'The price is below both averages: the trend points down.',
  };
  const FARBE = { gruen: 'Green', gelb: 'Yellow', rot: 'Red' };
  const FAKTOR_NAME = { 0: 'Nothing', 0.5: 'Half', 1: 'As usual', 1.5: 'One and a half', 2: 'Double' };
  const STUFE = {
    guenstig: 'In the lowest fifth of the last five years: cheap.',
    mitte: 'In the middle of the last five years.',
    teuer: 'In the highest fifth of the last five years: very expensive.',
  };
  const GRUND = { rot: 'The trend is red', teuer: 'The price is very expensive' };
  const chf = (v, dec = 0) => `CHF ${zahl(v, dec)}`;
  const pct = (v) => `${vorzeichen(v, 1)} %`;
  const gramm = (kg) => anzahl(kg * 1000, 2);
</script>

<section class="card e-card" data-trend>
  <h2>{t('Trend')}</h2>
  {#if trend}
    <p class="ampel">
      <span class="punkt {trend.farbe}" aria-hidden="true"></span>
      <b data-ampel={trend.farbe}>{t(FARBE[trend.farbe])}</b>
      <span>{t(SATZ[trend.farbe])}</span>
    </p>
    <dl class="rech">
      <div><dt>{t('Gold now')}</dt><dd class="num">{chf(trend.preis)} {t('per kg')}</dd></div>
      <div><dt>{t('Average of {n} days', { n: MITTEL_KURZ })}</dt><dd class="num">{chf(trend.m50)} · <span class={trend.ueber50 >= 0 ? 'up' : 'down'}>{pct(trend.ueber50)}</span></dd></div>
      <div><dt>{t('Average of {n} days', { n: MITTEL_LANG })}</dt><dd class="num">{chf(trend.m200)} · <span class={trend.ueber200 >= 0 ? 'up' : 'down'}>{pct(trend.ueber200)}</span></dd></div>
    </dl>
    <p class="muted small">{t('Green: the price is above both averages. Red: below both. Yellow: in between. The average is the mean of the closes of that many trading days.')}</p>
  {:else}
    <p class="muted" data-trend-leer>{t('There are not enough prices yet for the averages: they need {n} closes.', { n: MITTEL_LANG })}</p>
  {/if}
</section>

<section class="card e-card" data-lage>
  <h2>{t('Where the price stands')}</h2>
  {#if stand}
    <p data-stufe={stand.stufe}><b>{t(STUFE[stand.stufe])}</b></p>
    <div class="band" role="img" aria-label={t('{p} % of the way from the lowest to the highest close of the last five years', { p: zahl(stand.p * 100, 0) })}>
      <span class="marke" style:left={`${Math.round(stand.p * 100)}%`}></span>
    </div>
    <p class="row small muted"><span>{t('Lowest close')} {chf(stand.tief)}</span><span>{t('Highest close')} {chf(stand.hoch)}</span></p>
    <p class="muted small">{t('Compared with the lowest and the highest close of the last {n} trading days (about five years). The lowest fifth counts as cheap, the highest fifth as very expensive.', { n: zahl(stand.tage, 0) })}</p>
  {:else}
    <p class="muted" data-lage-leer>{t('There are not enough prices yet to say where the price stands: that needs about a year of closes.')}</p>
  {/if}
</section>

<section class="card e-card" data-regel>
  <h2>{t('My buying rule')}</h2>
  <p class="muted small">{t('Your own rule, only a suggestion: an amount a month, and what it does when the trend is red or the price is very expensive. If both apply, the factors are multiplied.')}</p>
  <div class="felder">
    <label>{t('Amount a month in CHF')} <input class="inp num" type="number" inputmode="decimal" min="0" step="50" value={regel.grundbetrag || ''} placeholder="0" oninput={(e) => setBetrag(e.currentTarget.value)} data-betrag /></label>
    <label>{t('When the trend is red')}
      <select class="inp" value={regel.rot} onchange={(e) => setFaktor('rot', e.currentTarget.value)} data-faktor-rot>
        {#each FAKTOREN as f (f)}<option value={f}>{t(FAKTOR_NAME[f])}</option>{/each}
      </select>
    </label>
    <label>{t('When the price is very expensive')}
      <select class="inp" value={regel.teuer} onchange={(e) => setFaktor('teuer', e.currentTarget.value)} data-faktor-teuer>
        {#each FAKTOREN as f (f)}<option value={f}>{t(FAKTOR_NAME[f])}</option>{/each}
      </select>
    </label>
  </div>

  {#if geladen && !(regel.grundbetrag > 0)}
    <div class="leer" data-regel-leer>
      <TrendingUp size={20} aria-hidden="true" />
      <p>{t('Write an amount a month and the rule makes a suggestion for today and looks back over the last five years.')}</p>
    </div>
  {:else if vorschlag}
    <p class="sale" data-vorschlag>
      <span>{t('Suggestion for this month')}</span>
      <b class="num">{chf(vorschlag.betrag)}</b>
      <small>
        {#if vorschlag.menge != null}≈ {gramm(vorschlag.menge)} {t('grams')}{' · '}{/if}{t('price of {day}', { day: tagKurz(tag) })}
        {#if vorschlag.gruende.length}<br />{vorschlag.gruende.map((g) => t(GRUND[g])).join(' · ')}{:else}<br />{t('Neither the trend nor the price asks for a change: the usual amount.')}{/if}
      </small>
    </p>
  {/if}
</section>

{#if rueck}
  <section class="card e-card" data-rueckblick>
    <h2>{t('Looking back')}</h2>
    <p class="muted small">{t('The same rule on the first trading day of each of the last {n} months, against paying the same amount every month.', { n: rueck.monate.length })}</p>
    <table class="tab">
      <thead><tr><th></th><th class="r">{t('My rule')}</th><th class="r">{t('Always the same')}</th></tr></thead>
      <tbody>
        <tr><th scope="row">{t('Paid in')}</th><td class="r num">{chf(rueck.regel.einbezahlt)}</td><td class="r num">{chf(rueck.gleich.einbezahlt)}</td></tr>
        <tr><th scope="row">{t('Gold bought')}</th><td class="r num">{gramm(rueck.regel.menge)} g</td><td class="r num">{gramm(rueck.gleich.menge)} g</td></tr>
        <tr><th scope="row">{t('Average price per kg')}</th><td class="r num">{rueck.regel.schnitt != null ? chf(rueck.regel.schnitt) : '–'}</td><td class="r num">{rueck.gleich.schnitt != null ? chf(rueck.gleich.schnitt) : '–'}</td></tr>
        <tr><th scope="row">{t('Worth today')}</th><td class="r num">{chf(rueck.regel.wert)}</td><td class="r num">{chf(rueck.gleich.wert)}</td></tr>
      </tbody>
    </table>
    {#if rueck.unterschied != null}
      <p data-unterschied>
        {#if Math.abs(rueck.unterschied) < 1}{t('On average both paid the same price per kilogram.')}
        {:else if rueck.unterschied > 0}{t('The rule paid {d} less per kilogram on average.', { d: chf(rueck.unterschied) })}
        {:else}{t('The rule paid {d} more per kilogram on average.', { d: chf(-rueck.unterschied) })}{/if}
      </p>
    {/if}
    <details class="monate">
      <summary>{t('Month by month')}</summary>
      <table class="tab">
        <thead><tr><th>{t('Day|kurs')}</th><th class="r">{t('CHF per kg')}</th><th class="r">{t('Bought for')}</th></tr></thead>
        <tbody>
          {#each rueck.monate as z (z.tag)}
            <tr><th scope="row">{tagKurz(z.tag)}</th><td class="r num">{zahl(z.preis, 0)}</td><td class="r num">{zahl(z.betrag, 0)}{#if z.gruende.length}<span class="muted small"> · ×{zahl(z.faktor, 2)}</span>{/if}</td></tr>
          {/each}
        </tbody>
      </table>
    </details>
  </section>
{/if}

<p class="muted small hinweis" data-hinweis>{t('These are observations from past prices and the result of your own rule. Nothing here predicts a price and nothing is investment advice. Everything stays on your devices.')}</p>

<style>
  .e-card {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4);
  }
  .e-card h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  p {
    margin: 0;
  }
  .muted {
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
  .ampel {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    flex-wrap: wrap;
  }
  .punkt {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex: none;
    background: var(--ink-2);
  }
  .punkt.gruen {
    background: var(--ok);
  }
  .punkt.gelb {
    background: var(--warn);
  }
  .punkt.rot {
    background: var(--bad);
  }
  .rech {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-3);
    flex-wrap: wrap;
  }
  .rech div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--sp-3);
  }
  .rech dt,
  .rech dd {
    margin: 0;
  }
  .rech dd {
    text-align: right;
    white-space: nowrap;
  }
  .band {
    position: relative;
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(90deg, var(--ok), var(--line) 20%, var(--line) 80%, var(--bad));
  }
  .marke {
    position: absolute;
    top: -4px;
    width: 4px;
    height: 18px;
    margin-left: -2px;
    border-radius: 2px;
    background: var(--ink);
  }
  .felder {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--sp-3);
  }
  .felder label {
    display: grid;
    gap: var(--sp-1);
    font-size: var(--fs-small);
  }
  .leer {
    display: flex;
    gap: var(--sp-2);
    align-items: flex-start;
    padding: var(--sp-3);
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
  }
  .sale {
    display: grid;
    gap: 2px;
    padding: var(--sp-3);
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
  }
  .sale b {
    font-size: var(--fs-title);
  }
  .tab {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .tab th,
  .tab td {
    padding: var(--sp-2) var(--sp-1);
    border-bottom: 1px solid var(--line);
    text-align: left;
    font-weight: 400;
  }
  .tab thead th {
    font-weight: 600;
  }
  .tab .r {
    text-align: right;
  }
  .monate summary {
    cursor: pointer;
    padding: var(--sp-2) 0;
  }
  .hinweis {
    padding: 0 var(--sp-1);
  }
</style>
