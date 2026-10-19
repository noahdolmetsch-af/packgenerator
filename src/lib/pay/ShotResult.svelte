<script>
  /**
   * «Bild gelesen» (mockup QR6, way B, Noah 14.10.2026 approved 04:00 «a»): a TWINT screenshot chosen
   * in Rechnungen (Noah 19.10.2026 «2b») is read on the phone; the app suggests the open invoice (by the number in the message,
   * else the only one with that amount): «Ja, bezahlt» or «Andere Rechnung». The picture is not kept.
   */
  import { untrack } from 'svelte';
  import { t } from '../i18n.svelte.js';
  import { Check, LoaderCircle } from '@lucide/svelte';
  import { readShotText, parseTwintText, matchShot } from './twintshot.js';
  import { markPaid } from './invoices.js';
  import { formatAmount } from './qrbill.js';

  /** file: the picture; invoices: the list now; onchange(): reload; ondone(text): close with a line */
  let { file, invoices, onchange, ondone, read = readShotText } = $props();
  let state = $state('reading'); // reading | done | error
  let got = $state(null);
  let fit = $state(null);
  let picking = $state(false);
  let choice = $state('');
  const open = $derived(invoices.filter((x) => x.status === 'open'));

  untrack(() => read(file))
    .then((text) => {
      got = parseTwintText(text);
      fit = matchShot(got, untrack(() => invoices));
      picking = !fit.inv;
      choice = fit.inv?.id ?? fit.choices?.[0]?.id ?? '';
      state = 'done';
    })
    .catch(() => (state = 'error'));

  async function paid(id) {
    const inv = invoices.find((x) => x.id === id);
    if (!inv) return;
    await markPaid(id, 'twint');
    onchange?.();
    ondone?.(t('{no} is marked as paid.', { no: inv.no }));
  }
</script>

<section class="card shot" aria-label={t('Picture from TWINT')} data-testid="shot-result">
  {#if state === 'reading'}
    <p class="shot-wait" role="status"><LoaderCircle size={18} aria-hidden="true" /> {t('Reading the picture on your phone… The first time, the app loads its text reader (about 5 MB).')}</p>
  {:else if state === 'error'}
    <p class="shot-err" role="alert">{t('The picture could not be read. Mark the invoice by hand below.')}</p>
    <button class="btn" type="button" onclick={() => ondone?.('')}>{t('Close')}</button>
  {:else}
    <p class="shot-res"><Check size={18} aria-hidden="true" /> <b>{t('Picture read:')}</b>&nbsp;{[got.amount ? `${formatAmount(got.amount)} CHF` : '', got.no ?? '', got.from].filter(Boolean).join(' · ') || t('nothing found')}</p>
    {#if fit.inv && !picking}
      <div class="shot-fit">
        <b>{fit.inv.name} · {formatAmount(fit.inv.amount)} CHF</b>
        <small>{fit.inv.purpose} · {fit.inv.no} · {fit.how === 'no' ? t('fits exactly') : t('amount fits')}</small>
      </div>
      <div class="shot-btns">
        <button class="btn hi" type="button" onclick={() => paid(fit.inv.id)}><Check size={18} aria-hidden="true" />{t('Yes, paid')}</button>
        <button class="btn" type="button" onclick={() => (picking = true)}>{t('Another invoice')}</button>
      </div>
    {:else if open.length}
      {#if !fit.inv}<p class="ich-fine">{fit.how === 'many' ? t('Several open invoices have this amount. Which one?') : t('No open invoice fits exactly. Which one?')}</p>{/if}
      <label class="shot-pick"><span class="lbl">{t('Which invoice?')}</span>
        <select class="sel" bind:value={choice}>
          {#each open as o (o.id)}<option value={o.id}>{o.name} · {o.purpose} · {o.no} · {formatAmount(o.amount)} CHF</option>{/each}
        </select>
      </label>
      <div class="shot-btns">
        <button class="btn hi" type="button" disabled={!choice} onclick={() => paid(choice)}><Check size={18} aria-hidden="true" />{t('This one is paid')}</button>
        <button class="btn" type="button" onclick={() => ondone?.('')}>{t('Cancel')}</button>
      </div>
    {:else}
      <p class="ich-fine">{t('There are no open invoices.')}</p>
      <button class="btn" type="button" onclick={() => ondone?.('')}>{t('Close')}</button>
    {/if}
  {/if}
  <p class="ich-fine">{t('The picture is read only on your phone and not kept.')}</p>
</section>

<style>
  .shot {
    padding: 16px 18px;
    margin-bottom: 14px;
    max-width: 820px;
  }
  .shot-wait,
  .shot-res {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    margin: 0 0 12px;
  }
  .shot-res {
    background: var(--ok-soft);
    border-radius: 12px;
    padding: 10px 14px;
  }
  .shot-err {
    color: var(--bad);
    font-weight: 600;
  }
  .shot-fit {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px 14px;
    overflow-wrap: break-word;
  }
  .shot-fit b {
    font-weight: 600;
  }
  .shot-fit small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .shot-pick {
    display: flex;
    flex-direction: column;
    min-width: 0;
    margin-bottom: 10px;
  }
  .shot-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 12px 0 0;
  }
</style>
