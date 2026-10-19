<script>
  /**
   * Paket L «Werkzeugkasten» (#8 Währungen umrechnen, Noah «2a»): type an amount, choose its currency,
   * see it in Franken and the other main currencies. The rates come once a day by themselves; offline
   * the last ones count, with their date.
   */
  import { db } from '../db.js';
  import { loadRates, convertMoney, parseAmount, currenciesOf, fmtMoney, MAIN_CURRENCIES } from './money.js';
  import { loadTool, saveTool } from './toolstore.js';
  import { t, locale } from '../i18n.svelte.js';
  import './tools.css';

  let rates = $state(null);
  let loaded = $state(false);
  let amount = $state('');
  let from = $state('EUR');
  loadRates(db).then((r) => ((rates = r), (loaded = true)));
  loadTool('money', null).then((m) => m?.from && (from = m.from));
  const list = $derived(currenciesOf(rates?.rates));
  const v = $derived(parseAmount(amount));
  const others = $derived(['CHF', ...MAIN_CURRENCIES.filter((c) => c !== 'CHF')].filter((c) => c !== from && list.includes(c)));
  const money = (x) => fmtMoney(x, locale());
  const dateText = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
</script>

<section class="tool-card money">
  <div class="tool-row">
    <label class="tool-field m-val"><span>{t('Amount|money')}</span><input class="tool-input" inputmode="decimal" autocomplete="off" placeholder="0.00" bind:value={amount} /></label>
    <label class="tool-field"><span>{t('Currency')}</span>
      <select class="tool-input" bind:value={from} onchange={() => saveTool('money', { from }).catch(() => {})}>
        {#each list.length ? list : MAIN_CURRENCIES as c (c)}<option value={c}>{c}</option>{/each}
      </select>
    </label>
  </div>
  {#if rates}
    <ul class="tool-list" aria-live="polite">
      {#each others as c (c)}
        <li data-cur={c}><b class="m-num">{money(convertMoney(v, from, c, rates.rates))}</b> <span>{c}</span></li>
      {/each}
    </ul>
    <p class="tool-muted">{t('Rates of the European Central Bank from {date}; they come once a day by themselves.', { date: dateText(rates.date) })}</p>
  {:else if loaded}
    <p class="tool-status err">{t('No rates yet. They come by themselves as soon as the device is online.')}</p>
  {:else}
    <p class="tool-status">{t('Loading rates …')}</p>
  {/if}
</section>

<style>
  .m-val {
    flex: 1 1 140px;
    max-width: 220px;
  }
  .m-num {
    font-size: var(--fs-section);
    font-variant-numeric: tabular-nums;
  }
</style>
