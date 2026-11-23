<script>
  /**
   * «Kursblick» Mein Bestand (Bauplan K12, K14): one window to add a position (a share, a fund, a coin, gold in grams, or a
   * value by hand like «Mein Sparkonto») or to change one. For a position that exists, the dividends and splits are
   * kept here too: a dividend is money received (it is not in the price), a split multiplies the pieces from its day on (the
   * price service gives prices already corrected for splits). Both are typed by the person.
   *
   * posten: the position to change (live, so events show at once), or null for a new one; art: the kind a new one starts as;
   * onsave(data): saves, returns '' or the text of an error; onevent(e) adds a dividend or a split, returns '' or an error;
   * onevdel(id) deletes one. PRIVATE: nothing typed here leaves the device but the symbol, and only to check it.
   */
  import { X, Trash2 } from '@lucide/svelte';
  import DateInput from '../ui/DateInput.svelte';
  import Seg from '../ui/Seg.svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { POSTEN_ARTEN } from './bestand.js';
  import { symbolNorm, symbolOk, reihenId } from './maerkte.js';
  import { ladeReihe } from './laden.js';
  import { meldung } from './meldungen.js';
  import { zahl, anzahl, tagKurz } from './format.js';
  import '../bikes/velo-dlg.css';

  let { posten = null, art = 'titel', onsave, onevent, onevdel, onclose } = $props();

  // svelte-ignore state_referenced_locally
  const kind = posten?.art ?? art;
  // svelte-ignore state_referenced_locally
  let wahl = $state(kind);
  // svelte-ignore state_referenced_locally
  let name = $state(posten?.name ?? '');
  // svelte-ignore state_referenced_locally
  let symbol = $state(posten?.symbol ?? '');
  // svelte-ignore state_referenced_locally
  let menge = $state(posten?.menge != null ? String(posten.menge) : '');
  // svelte-ignore state_referenced_locally
  let einstand = $state(posten?.einstand != null ? String(posten.einstand) : '');
  // svelte-ignore state_referenced_locally
  let gekauft = $state(posten?.gekauft ?? '');
  // svelte-ignore state_referenced_locally
  let wert = $state(posten?.wert != null ? String(posten.wert) : '');
  // svelte-ignore state_referenced_locally
  let stand = $state(posten?.stand ?? '');
  // svelte-ignore state_referenced_locally
  let notiz = $state(posten?.notiz ?? '');
  let error = $state('');
  let ungeprueft = $state(false);
  let busy = $state(false);
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  // a dividend or a split to add
  let evTyp = $state('dividende');
  let evTag = $state('');
  let evWert = $state('');
  let evError = $state('');

  async function save(e) {
    e?.preventDefault();
    if (busy) return;
    busy = true;
    error = '';
    try {
      if (wahl === 'titel') {
        if (!symbolOk(symbol)) return (error = meldung('symbol'));
        const changed = !posten || symbolNorm(symbol) !== posten.symbol;
        if (changed && !ungeprueft) {
          try {
            await ladeReihe(reihenId(symbol), { force: true });
          } catch {
            ungeprueft = true;
            return (error = t('No prices found for this symbol. Check how it is written, or save it anyway.'));
          }
        }
      }
      const problem = await onsave?.({ art: wahl, name, symbol, menge, einstand, gekauft, wert, stand, notiz });
      if (problem) return (error = problem);
      dialog.close();
    } finally {
      busy = false;
    }
  }

  async function addEvent(e) {
    e?.preventDefault();
    evError = '';
    const r = await onevent?.(evTyp === 'dividende' ? { typ: 'dividende', tag: evTag, betrag: evWert } : { typ: 'split', tag: evTag, faktor: evWert });
    if (r) return (evError = r);
    evTag = '';
    evWert = '';
  }
  const evText = (x) => (x.typ === 'dividende' ? t('Dividend of CHF {a}', { a: zahl(x.betrag, 2) }) : t('Split, pieces × {f}', { f: anzahl(x.faktor, 6) }));
  const mengeLabel = $derived(wahl === 'gold' ? t('Grams') : t('Pieces'));
</script>

<dialog class="sheet vdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="ps-h" data-posten-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="ps-h">{posten ? t('Change position') : t('Add to my holdings')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <form onsubmit={save} novalidate>
    <div class="felder">
      {#if !posten}
        <Seg label={t('Kind')} value={wahl} options={POSTEN_ARTEN.map((a) => ({ key: a.key, name: t(a.name) }))} onchange={(k) => ((wahl = k), (error = ''))} />
      {/if}
      <label>{t('Name')} <input class="inp" bind:value={name} maxlength="80" autocomplete="off" placeholder={wahl === 'hand' ? t('For example «My savings account»') : t('Name, as it should show')} data-posten-name /></label>
      {#if wahl === 'titel'}
        <label>{t('Symbol|kurs')} <input class="inp" bind:value={symbol} maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="NESN.SW" oninput={() => ((error = ''), (ungeprueft = false))} data-posten-symbol /></label>
      {/if}
      {#if wahl === 'hand'}
        <label>{t('Value today in CHF')} <input class="inp num" type="text" inputmode="decimal" bind:value={wert} autocomplete="off" data-posten-wert /></label>
        <label>{t('Value of the day')} <DateInput bind:value={stand} aria-label={t('Value of the day')} /></label>
      {:else}
        <label>{mengeLabel} <input class="inp num" type="text" inputmode="decimal" bind:value={menge} autocomplete="off" data-posten-menge /></label>
      {/if}
      <label>{t('What it cost in total, CHF')} <input class="inp num" type="text" inputmode="decimal" bind:value={einstand} autocomplete="off" placeholder={t('Optional')} data-posten-einstand /></label>
      {#if wahl !== 'hand'}
        <label>{t('Bought on')} <DateInput bind:value={gekauft} aria-label={t('Bought on')} /></label>
      {/if}
      <label>{t('Note')} <input class="inp" bind:value={notiz} maxlength="200" autocomplete="off" placeholder={t('Optional')} /></label>
    </div>
    <p class="hint">
      {#if wahl === 'titel'}{t('The price comes from Yahoo Finance in the currency of the title and is turned into francs with the rate of the day before.')}
      {:else if wahl === 'gold'}{t('Gold is valued at the exchange price of the day before, without the dealer deduction.')}
      {:else}{t('You keep this value up to date yourself; Kursblick does not look it up.')}{/if}
      {t('What you type here stays on your devices.')}
    </p>
    {#if error}<p class="err" role="alert" data-posten-fehler>{error}</p>{/if}
    <div class="vd-foot">
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi" disabled={busy} data-posten-save>{ungeprueft ? t('Save anyway') : t('Save')}</button>
    </div>
  </form>

  {#if posten && posten.art !== 'hand'}
    <section class="ev" data-ereignisse>
      <h3>{t('Dividends and splits')}</h3>
      <p class="hint">{t('A dividend is money you received; with «With dividends» it counts to your profit. After a split of a share, add it here: the price service already shows the new price, so your pieces must grow too.')}</p>
      {#if posten.ereignisse.length}
        <ul class="ev-liste">
          {#each posten.ereignisse as x (x.id)}
            <li data-ereignis>
              <span>{tagKurz(x.tag)}{' · '}{evText(x)}</span>
              <button type="button" class="btn btn-link" onclick={() => onevdel?.(x.id)} aria-label={t('Delete «{name}»?', { name: evText(x) })}><Trash2 size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {/if}
      <form class="ev-neu" onsubmit={addEvent} novalidate>
        <Seg label={t('Kind')} value={evTyp} options={[{ key: 'dividende', name: t('Dividend') }, { key: 'split', name: t('Split') }]} onchange={(k) => ((evTyp = k), (evWert = ''), (evError = ''))} />
        <label>{t('Day')} <DateInput bind:value={evTag} aria-label={t('Day')} /></label>
        <label>{evTyp === 'dividende' ? t('Amount received, CHF') : t('Factor')} <input class="inp num" type="text" inputmode="decimal" bind:value={evWert} autocomplete="off" placeholder={evTyp === 'split' ? '2' : ''} data-ereignis-wert /></label>
        {#if evError}<p class="err" role="alert" data-ereignis-fehler>{evError}</p>{/if}
        <button type="submit" class="btn" data-ereignis-neu>{t('Add')}</button>
      </form>
    </section>
  {/if}
</dialog>

<style>
  .felder,
  .ev-neu {
    display: grid;
    gap: var(--sp-3);
  }
  .felder label,
  .ev-neu label {
    display: grid;
    gap: var(--sp-1);
    font-size: var(--fs-small);
  }
  .hint {
    margin: var(--sp-3) 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .err {
    margin: var(--sp-2) 0 0;
    color: var(--bad);
  }
  .ev {
    display: grid;
    gap: var(--sp-2);
    margin-top: var(--sp-4);
    padding-top: var(--sp-3);
    border-top: 1px solid var(--line);
  }
  .ev h3 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .ev-liste {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ev-liste li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--sp-2);
  }
</style>
