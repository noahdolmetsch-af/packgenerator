<script>
  /**
   * Workshop order (v0.19.3, N15, answer 8a): everything the bike needs before the next trip as
   * one order, with a price from the receipts where one is known. Tick what the shop should do,
   * then send the message or print it.
   */
  import { orderSum, orderText } from '../workshop.js';
  import { t, locale } from '../i18n.svelte.js';

  let { order, bike, trip = null, bikeNames = {}, onclose } = $props();
  let dialog;
  // svelte-ignore state_referenced_locally
  let off = $state(new Set());
  let note = $state('');

  $effect(() => {
    dialog.showModal();
  });

  const picked = $derived(order.rows.filter((r) => !off.has(r.key)));
  const sum = $derived(orderSum(picked));
  const text = $derived(orderText(picked, { bike, trip }));
  const toggle = (key) => {
    const s = new Set(off);
    s.has(key) ? s.delete(key) : s.add(key);
    off = s;
  };
  const day = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const from = (r) => (r.from ? `${t('like on {date}', { date: day(r.from.date) })}${r.from.bikeId !== bike.id ? ` (${bikeNames[r.from.bikeId] ?? t('other bike')})` : ''}` : t('no price on your receipts'));

  async function send() {
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title: t('Service {bike}', { bike: bike.name }), text });
      else {
        await navigator.clipboard.writeText(text);
        note = t('Copied. Paste it into an email or a message to the shop.');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') note = t('Could not copy. Select the text below and copy it.');
    }
  }

  /** Print only the order: a hidden frame with a plain page, so the app around it stays out. */
  function print() {
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    const rows = picked.map((r) => `<tr><td>☐</td><td>${esc(r.de)}<br><small>${esc(r.name)} · ${esc(r.detail)}</small></td><td class="c">${r.chf == null ? '–' : `CHF ${Math.round(r.chf)}`}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(t('Service {bike}', { bike: bike.name }))}</title><style>
      body{font:12pt system-ui,sans-serif;margin:16mm;color:#000}h1{font-size:20pt;margin:0}p{margin:4pt 0}
      table{width:100%;border-collapse:collapse;margin-top:10pt}td{border-top:1pt solid #999;padding:5pt 4pt;vertical-align:top}
      td.c{text-align:right;white-space:nowrap}small{color:#555}.t td{border-top:2pt solid #000;font-weight:700}
    </style></head><body>
      <h1>${esc(t('Service {bike}', { bike: bike.name }))}</h1>
      <p>${trip?.startDate ? esc(t('Before {trip}, {date}', { trip: trip.title, date: day(trip.startDate) })) : esc(t('Due now'))}${order.shop ? ` · ${esc(order.shop)}` : ''}</p>
      <table>${rows}<tr class="t"><td></td><td>${esc(t('Estimate from my receipts'))}${sum.unknown ? ` (${esc(t('{n} without a price', { n: sum.unknown }))})` : ''}</td><td class="c">CHF ${sum.total}</td></tr></table>
    </body></html>`;
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
    document.body.append(frame);
    frame.contentDocument.open();
    frame.contentDocument.write(html);
    frame.contentDocument.close();
    setTimeout(() => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 1000);
    }, 100);
  }
</script>

<dialog class="sheet" bind:this={dialog} onclose={onclose} aria-labelledby="order-h">
  <p class="meta">{bike.name} · {t('Workshop order')}</p>
  <h2 id="order-h" class="title">{trip?.startDate ? t('Before {trip}', { trip: trip.title }) : t('Due now')}</h2>
  <p class="facts num"><b>{t('about CHF {chf}', { chf: sum.total })}</b>{#if sum.unknown}{` · ${t('{n} without a price', { n: sum.unknown })}`}{/if}{#if order.shop}{` · ${order.shop}`}{/if}</p>

  <ul class="jobs">
    {#each order.rows as r (r.key)}
      <li class:off={off.has(r.key)}>
        <label>
          <input type="checkbox" checked={!off.has(r.key)} onchange={() => toggle(r.key)} />
          <span class="j"><b>{r.name}</b><small>{r.when === 'during' ? `${t('due on the trip')} · ` : ''}{r.detail}</small><small>{from(r)}</small></span>
        </label>
        <span class="num c">{r.chf == null ? '–' : `CHF ${Math.round(r.chf)}`}</span>
      </li>
    {/each}
  </ul>
  <p class="hint">{t('Untick what you do yourself. The prices are what you paid last time, not a quote.')}</p>

  <h3>{t('Message to the shop')}</h3>
  <textarea class="inp msg" readonly rows="8" value={text}></textarea>
  {#if note}<p class="hint" role="status">{note}</p>{/if}

  <div class="foot">
    <button type="button" class="btn hi" onclick={send} disabled={!picked.length}>{t('Send or copy')}</button>
    <button type="button" class="btn" onclick={print} disabled={!picked.length}>{t('Print')}</button>
    <button type="button" class="link" onclick={() => dialog.close()}>{t('Close')}</button>
  </div>
</dialog>

<style>
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
    margin: 4px 0 4px;
  }
  h3 {
    margin: 16px 0 6px;
    font-size: 16px;
  }
  .facts {
    margin: 0 0 10px;
    font-size: 15px;
  }
  .hint {
    font-size: 13px;
    color: var(--ink-3);
    margin: 6px 0 0;
  }
  .jobs {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .jobs li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
    font-size: 14px;
  }
  .jobs li.off {
    opacity: 0.5;
  }
  label {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    min-width: 0;
    cursor: pointer;
  }
  input[type='checkbox'] {
    width: 20px;
    height: 20px;
    margin: 2px 0 0;
    flex: none;
  }
  .j {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .j small {
    color: var(--ink-3);
    font-size: 13px;
  }
  .c {
    flex: none;
  }
  .msg {
    width: 100%;
    box-sizing: border-box;
    font: 14px/1.4 var(--font-body);
    resize: vertical;
  }
  .foot {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    margin: 12px 0 4px;
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
