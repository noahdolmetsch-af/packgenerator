<script>
  /**
   * «Kursblick» (Noah 22.11.2026 «ja»; plan: docs/releases/kursblick.md): the small app for the daily prices of gold,
   * the SMI and more. Six views: Today (#/kurse), Gold (#/kurse/gold, with gold after inflation), Decision (#/kurse/entscheidung: trend, position and an own buying rule for gold, src/lib/kurse/Entscheidung.svelte), Markets (#/kurse/maerkte: the titles the person
   * follows, src/lib/kurse/Maerkte.svelte), My numbers (#/kurse/bestand: holdings with profit or loss and goals, private, src/lib/kurse/Meins.svelte)
   * and Sources (#/kurse/quellen).
   * The closing price of the day before comes from the server (api/lake.js ?action=kurse), the last answer stays on the
   * device (src/lib/kurse/laden.js). Gold is shown in francs per kilogram against the reference day (1 Nov 2026, a
   * Sunday: the last close before it) and with what a sale would bring (price minus the dealer's deduction, 2 % as a
   * suggestion). Every number says which day it is from and when it was fetched. No advice: only numbers.
   */
  import { onMount } from 'svelte';
  import { TrendingUp, RefreshCw } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import DateInput from '../lib/ui/DateInput.svelte';
  import Verlauf from '../lib/kurse/Verlauf.svelte';
  import Zeitraum from '../lib/kurse/Zeitraum.svelte';
  import Maerkte from '../lib/kurse/Maerkte.svelte';
  import Meins from '../lib/kurse/Meins.svelte';
  import GoldReal from '../lib/kurse/GoldReal.svelte';
  import Entscheidung from '../lib/kurse/Entscheidung.svelte';
  import Portfolio from '../lib/kurse/Portfolio.svelte';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';
  import { miniAppOf } from '../lib/miniapps.js';
  import { ladeReihe } from '../lib/kurse/laden.js';
  import { PERIODS, REFERENZ_STANDARD, ABSCHLAG_STANDARD, FORMEN, goldChfKg, verkaufswert, vergleich, verglichenMit, backBy, ab, closeOnOrBefore } from '../lib/kurse/rechnen.js';
  import { zahl, vorzeichen, tagText, tagKurz, stundeText } from '../lib/kurse/format.js';
  import '../lib/ich/ich.css';

  let { sub = '' } = $props();
  const view = $derived(sub === 'gold' ? 'gold' : sub === 'quellen' ? 'quellen' : sub === 'maerkte' ? 'maerkte' : sub === 'bestand' ? 'bestand' : sub === 'entscheidung' ? 'entscheidung' : sub === 'portfolio' ? 'portfolio' : 'heute');
  const inMini = typeof location !== 'undefined' && !!miniAppOf(location.pathname);
  const NAMES = { gold: 'Gold', smi: 'SMI', usdchf: 'USD/CHF' };

  let reihen = $state({}); // id → answer
  let fehler = $state(false);
  let laedt = $state(true);
  let zeitraum = $state(PERIODS[0]);
  let chart = $state('gold');
  let referenz = $state(REFERENZ_STANDARD);
  let abschlag = $state(ABSCHLAG_STANDARD);
  let form = $state('bar');
  let menge = $state(1000); // grams
  let gebuehr = $state(0);

  async function lade(force = false) {
    laedt = true;
    fehler = false;
    const ids = ['gold', 'usdchf', 'smi'];
    const res = await Promise.allSettled(ids.map((id) => ladeReihe(id, { force })));
    const next = {};
    res.forEach((r, i) => {
      if (r.status === 'fulfilled') next[ids[i]] = r.value;
    });
    reihen = next;
    fehler = !next.gold || !next.usdchf;
    laedt = false;
  }
  onMount(() => {
    db.settings.get('kurse.referenz').then((r) => r?.value && (referenz = r.value)).catch(() => {});
    db.settings.get('kurse.abschlag').then((r) => r?.value != null && (abschlag = Number(r.value))).catch(() => {});
    lade();
  });

  const saveSetting = (key, value) => db.settings.put({ key, value }).catch(() => {});
  const goldChf = $derived(reihen.gold && reihen.usdchf ? goldChfKg(reihen.gold.points, reihen.usdchf.points) : []);
  const smi = $derived(reihen.smi?.points ?? []);
  const wert = $derived(goldChf.length ? goldChf[goldChf.length - 1] : null);
  const refV = $derived(goldChf.length ? vergleich(goldChf, referenz) : null);
  const goldP = $derived(goldChf.length ? verglichenMit(goldChf, zeitraum) : null);
  const smiP = $derived(smi.length ? verglichenMit(smi, zeitraum) : null);
  const smiR = $derived(smi.length ? vergleich(smi, referenz) : null);
  const stand = $derived(reihen.gold ? stundeText(reihen.gold.fetchedAt) : '');
  const alt = $derived(Object.values(reihen).some((r) => r.alt));
  // the line shows the period that is chosen, not more (a week is a week)
  const von = (last) => backBy(last, zeitraum);
  const periodStart = $derived(wert ? von(wert[0]) : '');
  const chartPoints = $derived(chart === 'gold' ? ab(goldChf, periodStart) : ab(smi, smi.length ? von(smi[smi.length - 1][0]) : ''));
  const menge1 = $derived(Math.max(0, Number(menge) || 0));
  const boerse = $derived(wert ? (wert[1] * menge1) / 1000 : 0);
  const netto = $derived(wert ? verkaufswert(boerse, abschlag, gebuehr) : 0);
  const refTag = $derived(goldChf.length ? closeOnOrBefore(goldChf, referenz) : null);

  const UNIT = { d: ['{n} day', '{n} days'], w: ['{n} week', '{n} weeks'], m: ['{n} month', '{n} months'], y: ['{n} year', '{n} years'] };
  const pName = $derived(zeitraum.label ? t(zeitraum.label) : t(UNIT[zeitraum.unit][zeitraum.n === 1 ? 0 : 1], { n: zeitraum.n }));
  const pctText = (v) => (v ? `${vorzeichen(v.pct, 1)} %` : '–');
  const tone = (v) => (!v || !v.abs ? '' : v.abs > 0 ? 'up' : 'down');
  const go = (h) => (location.hash = h);
  function setForm(k) {
    form = k;
    const f = FORMEN.find((x) => x.key === k);
    if (f) setAbschlag(f.abschlag);
  }
  function setAbschlag(v) {
    abschlag = Math.min(50, Math.max(0, Number(v) || 0));
    saveSetting('kurse.abschlag', abschlag);
  }
  function setReferenz(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    referenz = v;
    saveSetting('kurse.referenz', v);
  }
</script>

<div class="ich-page kurse" data-kurse>
  <VeloHead crumbs={inMini ? [] : [{ label: t('Me|place'), href: '#/me/apps' }]} title={t('Kursblick')} here={t('Kursblick')} sub={t('Prices of the day before, nothing more')} />

  {#if !inMini}
    <div class="kseg">
      <Seg label={t('View')} value={view} options={[{ key: 'heute', name: t('Today|kurs') }, { key: 'gold', name: t('Gold') }, { key: 'entscheidung', name: t('Decision|kurs') }, { key: 'maerkte', name: t('Markets|kurs') }, { key: 'portfolio', name: t('Portfolio|kurs') }, { key: 'bestand', name: t('My numbers|kurs') }, { key: 'quellen', name: t('Sources|kurs') }]} onchange={(k) => go(k === 'heute' ? '#/kurse' : `#/kurse/${k}`)} />
    </div>
  {/if}

  {#if view === 'maerkte'}
    <Maerkte {zeitraum} onzeitraum={(p) => (zeitraum = p)} />
  {:else if view === 'portfolio'}
    <Portfolio {reihen} />
  {:else if view === 'bestand'}
    <Meins {reihen} />
  {:else if laedt && !wert}
    <p class="muted" role="status">{t('Fetching prices …')}</p>
  {:else if fehler && !wert}
    <Empty icon={TrendingUp} title={t('No prices right now')} text={t('The price service does not answer and nothing is saved on this device yet. Try again in a moment.')} action={{ label: t('Try again'), onclick: () => lade(true) }} />
  {:else if view === 'heute'}
    <section class="card k-card" data-gold>
      <h2>{t('Gold')}</h2>
      <p class="big num" data-gold-preis>CHF {zahl(wert[1], 0)} <small>{t('per kg')}</small></p>
      <p class="muted">{t('Close of {day}', { day: tagText(wert[0]) })}</p>
      {#if refV}
        <p class="row"><span>{t('Since the reference {day}', { day: tagKurz(referenz) })}</span> <b class={tone(refV)} data-gold-ref>{vorzeichen(refV.abs, 0)} CHF · {pctText(refV)}</b></p>
        {#if refTag && refTag[0] !== referenz}<p class="muted small">{t('The reference day had no trading, so the close of {day} counts.', { day: tagText(refTag[0]) })}</p>{/if}
      {/if}
      <p class="row"><span>{t('{p}: change', { p: pName })}</span> <b class={tone(goldP)}>{goldP ? `${vorzeichen(goldP.abs, 0)} CHF · ${pctText(goldP)}` : '–'}</b></p>
      {#if goldP?.kurz}<p class="muted small">{t('Data since {day}', { day: tagKurz(goldP.from[0]) })}</p>{/if}
      <p class="sale" data-verkauf>
        <span>{t('A sale of 1 kg would bring')}</span>
        <b class="num">CHF {zahl(verkaufswert(wert[1], abschlag), 0)}</b>
        <small>{t('after {p} % dealer deduction', { p: zahl(abschlag, 1) })} · <a href="#/kurse/gold">{t('Change in Gold')}</a></small>
      </p>
    </section>

    {#if smi.length}
      <section class="card k-card" data-smi>
        <h2>{t('SMI')}</h2>
        <p class="big num">{zahl(smi[smi.length - 1][1], 0)} <small>{t('points')}</small></p>
        <p class="muted">{t('Close of {day}', { day: tagText(smi[smi.length - 1][0]) })}</p>
        <p class="row"><span>{t('{p}: change', { p: pName })}</span> <b class={tone(smiP)}>{smiP ? `${vorzeichen(smiP.abs, 0)} · ${pctText(smiP)}` : '–'}</b></p>
        {#if smiP?.kurz}<p class="muted small">{t('Data since {day}', { day: tagKurz(smiP.from[0]) })}</p>{/if}
        {#if smiR}<p class="row"><span>{t('Since the reference {day}', { day: tagKurz(referenz) })}</span> <b class={tone(smiR)}>{pctText(smiR)}</b></p>{/if}
      </section>
    {:else}
      <p class="muted small" data-smi-fehlt>{t('The SMI is not reachable right now.')}</p>
    {/if}

    <Meins modus="heute" {reihen} />

    <section class="k-zeit">
      <h2 class="h2">{t('Compare with')}</h2>
      <Zeitraum value={zeitraum} onchange={(p) => (zeitraum = p)} />
      <div class="kseg">
        <Seg label={t('Chart')} value={chart} options={[{ key: 'gold', name: t('Gold') }, { key: 'smi', name: t('SMI') }]} onchange={(k) => (chart = k)} />
      </div>
      <Verlauf points={chartPoints} label={chart === 'gold' ? t('Gold in CHF per kg') : t('SMI')} dec={0} />
    </section>
  {:else if view === 'entscheidung'}
    <Entscheidung {goldChf} />
  {:else if view === 'gold'}
    <section class="card k-card" data-rechner>
      <h2>{t('What a sale brings')}</h2>
      <p class="big num" data-netto>CHF {zahl(netto, 0)}</p>
      <p class="muted">{t('Gold at the close of {day}: CHF {p} per kg', { day: tagText(wert[0]), p: zahl(wert[1], 0) })}</p>
      <div class="kseg">
        <Seg label={t('Form')} value={form} options={[{ key: 'bar', name: t('Bar') }, { key: 'coin', name: t('Coins') }, { key: 'scrap', name: t('Scrap gold') }]} onchange={setForm} />
      </div>
      <p class="muted small">{t('The deduction is a suggestion for the form; change it to what your dealer says.')}</p>
      <div class="felder">
        <label>{t('Amount in grams')} <input class="inp num" type="number" inputmode="decimal" min="0" bind:value={menge} /></label>
        <label>{t('Dealer deduction in %')} <input class="inp num" type="number" inputmode="decimal" min="0" max="50" step="0.5" value={abschlag} onchange={(e) => setAbschlag(e.currentTarget.value)} data-abschlag /></label>
        <label>{t('Fee in CHF')} <input class="inp num" type="number" inputmode="decimal" min="0" bind:value={gebuehr} /></label>
      </div>
      <dl class="rech">
        <div><dt>{t('Value at the exchange')}</dt><dd class="num">CHF {zahl(boerse, 0)}</dd></div>
        <div><dt>{t('Dealer deduction')}</dt><dd class="num">− CHF {zahl(boerse * (abschlag / 100), 0)}</dd></div>
        {#if Number(gebuehr) > 0}<div><dt>{t('Fee')}</dt><dd class="num">− CHF {zahl(Number(gebuehr), 0)}</dd></div>{/if}
        <div class="sum"><dt>{t('A sale brings')}</dt><dd class="num">CHF {zahl(netto, 0)}</dd></div>
      </dl>
    </section>

    <section class="card k-card">
      <h2>{t('Reference day')}</h2>
      <DateInput value={referenz} onchange={setReferenz} aria-label={t('Reference day')} />
      {#if refTag && refV}<p class="muted small" data-ref-text>{t('Close of {day}: CHF {p} per kg. Since then {c} CHF ({pc}).', { day: tagText(refTag[0]), p: zahl(refTag[1], 0), c: vorzeichen(refV.abs, 0), pc: pctText(refV) })}</p>{:else}<p class="muted small">{t('The history starts later than this day.')}</p>{/if}
    </section>

    <section class="card k-card" data-alle>
      <h2>{t('All periods at a glance')}</h2>
      <table class="tab">
        <thead><tr><th>{t('Period')}</th><th class="r">{t('CHF per kg then')}</th><th class="r">{t('Change|kurs')}</th></tr></thead>
        <tbody>
          {#each PERIODS as p (p.key)}
            {@const v = verglichenMit(goldChf, p)}
            <tr>
              <th scope="row">{t(p.label)}</th>
              <td class="r num">{v ? zahl(v.from[1], 0) : '–'}{#if v?.kurz}<span class="muted small"> · {t('since {day}', { day: tagKurz(v.from[0]) })}</span>{/if}</td>
              <td class="r num {tone(v)}">{pctText(v)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section class="k-zeit">
      <Zeitraum value={zeitraum} onchange={(p) => (zeitraum = p)} />
      <Verlauf points={ab(goldChf, periodStart)} label={t('Gold in CHF per kg')} />
    </section>

    <GoldReal {goldChf} />
  {:else}
    <section class="card k-card" data-quellen>
      <h2>{t('Where the prices come from')}</h2>
      <p>{t('Stooq and Yahoo Finance, free and unofficial. They are meant for private use and can change or stop without notice; that is why every price has two sources and says which day it is from.')}</p>
      <p>{t('The prices are fetched by the small server of the app (not by your phone), once a day is enough: you see the close of the day before.')}</p>
      <p>{t('The consumer price index for «Gold after inflation» comes from the World Bank, one value a year.')}</p>
      <ul class="stand">
        {#each Object.keys(NAMES) as id (id)}
          {@const r = reihen[id]}
          <li data-stand={id}>
            <b>{NAMES[id]}</b>
            {#if r}<span>{t('Close of {day}', { day: tagText(r.last.day) })} · {t('fetched {at}', { at: stundeText(r.fetchedAt) })} · {r.source === 'stooq' ? 'Stooq' : 'Yahoo'} · {t('Data since {day}', { day: tagKurz(r.since) })}{r.alt ? ` · ${t('older, the server did not answer')}` : ''}</span>
            {:else}<span class="muted">{t('not loaded')}</span>{/if}
          </li>
        {/each}
      </ul>
      <button type="button" class="btn hi" onclick={() => lade(true)} disabled={laedt}><RefreshCw size={16} aria-hidden="true" /> {t('Fetch prices again')}</button>
      <p class="muted small">{t('Only numbers, no advice. Gold is turned from dollars per ounce into francs per kilogram with the dollar rate of the same day.')}</p>
    </section>
  {/if}

  {#if stand && view !== 'quellen'}
    <p class="muted small stand-line" data-stand-zeit>{t('Fetched {at}', { at: stand })}{alt ? ` · ${t('older, the server did not answer')}` : ''} · <a href="#/kurse/quellen">{t('Sources|kurs')}</a></p>
  {/if}
</div>

<style>
  .kurse {
    display: grid;
    gap: var(--sp-4);
    max-width: 720px;
  }
  .kseg {
    margin: var(--sp-2) 0;
  }
  .k-card {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4);
  }
  .k-card h2,
  .h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .big {
    margin: 0;
    font-size: var(--fs-num);
    font-weight: 700;
    line-height: 1.1;
  }
  .big small {
    font-size: var(--fs-small);
    font-weight: 400;
    color: var(--ink-2);
  }
  .muted {
    margin: 0;
    color: var(--ink-2);
  }
  .small {
    font-size: var(--fs-small);
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-3);
    margin: 0;
    flex-wrap: wrap;
  }
  .up {
    color: var(--ok);
  }
  .down {
    color: var(--bad);
  }
  .sale {
    display: grid;
    gap: 2px;
    margin: var(--sp-2) 0 0;
    padding: var(--sp-3);
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
  }
  .sale b {
    font-size: var(--fs-title);
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
  .rech {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
  }
  .rech div {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-3);
  }
  .rech dt,
  .rech dd {
    margin: 0;
  }
  .rech .sum {
    border-top: 1px solid var(--line);
    padding-top: var(--sp-1);
    font-weight: 700;
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
  .k-zeit {
    display: grid;
    gap: var(--sp-2);
  }
  .stand {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .stand li {
    display: grid;
    gap: 2px;
    font-size: var(--fs-small);
  }
  .stand-line {
    margin: 0;
  }
</style>
