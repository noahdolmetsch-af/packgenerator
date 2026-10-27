<script>
  /**
   * Kontakt-QR-Code step 3 (Noah 27.10.2026 «3a»): the payment details on a contact card, apart from the
   * rest and closed at first. One tap shows TWINT (number to copy) and a Swiss QR bill without an amount,
   * which any Swiss banking app reads; the payer types the amount there.
   */
  import { Wallet, Copy, Check, ChevronDown } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { qrMatrix, modulesPath, swissCross } from '../pay/qrmatrix.js';
  import { payload, formatIban } from '../pay/qrbill.js';

  /** pay: { t?: TWINT number, q?: { iban, name, street, house, zip, town } }; name: the card's first name */
  let { pay, name } = $props();
  let open = $state(false);
  let copied = $state(false);
  let code = $state(null);
  let failed = $state(false);
  $effect(() => {
    if (!open || !pay.q) return;
    let gone = false;
    qrMatrix(payload(pay.q, { refType: 'NON', message: '' }))
      .then((m) => !gone && (code = { n: m.n, d: modulesPath(m), x: swissCross(m.n) }))
      .catch(() => !gone && (failed = true));
    return () => (gone = true);
  });
  const place = $derived(pay.q ? [[pay.q.street, pay.q.house].filter(Boolean).join(' '), [pay.q.zip, pay.q.town].filter(Boolean).join(' ')].filter(Boolean).join(', ') : '');
  async function copyTwint() {
    try {
      await navigator.clipboard.writeText(pay.t.replace(/\s+/g, ''));
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      copied = false;
    }
  }
</script>

<section class="card ev-box cp" aria-labelledby="cp-h" data-card-paybox>
  <h2 id="cp-h"><Wallet size={20} aria-hidden="true" />{t('Payment|card')}</h2>
  <p class="ev-muted">{t('{name} added payment details, for example to share costs after a ride.', { name })}</p>
  <div>
    <button type="button" class="btn" aria-expanded={open} aria-controls="cp-body" onclick={() => (open = !open)} data-card-payopen>
      <ChevronDown size={18} aria-hidden="true" class={open ? 'cp-up' : ''} />{open ? t('Hide payment details') : t('Show payment details')}
    </button>
  </div>
  {#if open}
    <div id="cp-body" class="cp-body">
      {#if pay.t}
        <div class="cp-row" data-card-twint>
          <span class="cp-tw" aria-hidden="true">TWINT</span>
          <span class="cp-tx"><b>{t('Pay with TWINT')}</b><small class="num">{pay.t}</small></span>
          <button type="button" class="btn sm" onclick={copyTwint} aria-label={t('Copy TWINT number')}>
            {#if copied}<Check size={18} aria-hidden="true" />{t('Copied')}{:else}<Copy size={18} aria-hidden="true" />{t('Copy')}{/if}
          </button>
        </div>
      {/if}
      {#if pay.q}
        <div class="cp-bill" data-card-bill>
          {#if code}
            <svg class="cp-qr" viewBox="-1 -1 {code.n + 2} {code.n + 2}" role="img" aria-label={t('QR bill for {name}', { name })} shape-rendering="crispEdges">
              <rect x="-1" y="-1" width={code.n + 2} height={code.n + 2} fill="white" />
              <path d={code.d} fill="black" />
              <rect x={code.x.edge.x} y={code.x.edge.y} width={code.x.edge.w} height={code.x.edge.w} fill="white" />
              <rect x={code.x.box.x} y={code.x.box.y} width={code.x.box.w} height={code.x.box.w} fill="black" />
              <rect x={code.x.crossV.x} y={code.x.crossV.y} width={code.x.crossV.w} height={code.x.crossV.h} fill="white" />
              <rect x={code.x.crossH.x} y={code.x.crossH.y} width={code.x.crossH.w} height={code.x.crossH.h} fill="white" />
            </svg>
          {:else if failed}
            <p class="ev-muted">{t('The code could not be drawn.')}</p>
          {:else}
            <div class="cp-qr cp-wait" aria-hidden="true"></div>
          {/if}
          <div class="cp-tx">
            <b>{t('QR bill')}</b>
            <small class="num">{formatIban(pay.q.iban)}</small>
            <small>{pay.q.name}{#if place}, {place}{/if}</small>
            <small>{t('Scan it with your banking app and type the amount there.')}</small>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</section>

<style>
  .cp h2 {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .cp :global(.cp-up) {
    transform: rotate(180deg);
  }
  .cp-body {
    display: grid;
    gap: var(--sp-3);
  }
  .cp-row,
  .cp-bill {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    flex-wrap: wrap;
  }
  .cp-tx {
    display: grid;
    gap: 2px;
    flex: 1 1 180px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .cp-tx small {
    color: var(--ink-2);
  }
  .cp-tw {
    display: grid;
    place-items: center;
    min-width: 64px;
    height: 36px;
    padding: 0 var(--sp-2);
    border-radius: var(--r-ctl);
    background: var(--ink);
    color: var(--paper);
    font-weight: 700;
    font-size: var(--fs-small);
  }
  .cp-qr {
    display: block;
    width: 180px;
    height: 180px;
    flex: none;
  }
  .cp-wait {
    background: var(--paper-2);
  }
</style>
