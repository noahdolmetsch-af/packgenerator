<script>
  /**
   * «Tempo-Messer» (Noah 02.11.2026 «a»): a switch under Ich › Daten. On, the app measures on this device how the start
   * and scrolling feel and which file holds the screen up; one line to copy. Nothing leaves the device by itself.
   */
  import { Gauge } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { isOn, setOn, begin, end, snapshot, reportLine } from './messer.js';

  let on = $state(isOn());
  let snap = $state(snapshot());
  let counts = $state(null);

  async function countRows() {
    const c = {};
    for (const k of ['items', 'trips', 'rides', 'notes']) c[k] = db[k] ? await db[k].count() : 0;
    counts = c;
  }
  onMount(() => {
    if (on) begin();
    countRows().catch(() => {});
    const id = setInterval(() => (snap = snapshot()), 1500);
    return () => clearInterval(id);
  });
  function toggle(v) {
    on = v;
    setOn(v);
    if (v) begin();
    else end();
    snap = snapshot();
  }
  const line = $derived(reportLine({ ...snap, counts }, (x) => t(x)));
  async function copy() {
    try {
      await navigator.clipboard.writeText(line);
      offerDone(t('Copied.'), () => {});
    } catch {
      offerDone(t('Copying did not work. Select the line and copy it by hand.'), () => {});
    }
  }
</script>

<section class="ich-sec" aria-labelledby="tm-h" data-section="tempo">
  <div class="ich-h"><div><h2 id="tm-h">{t('Speed meter')}</h2></div></div>
  <ul class="card ich-list">
    <li>
      <label class="ich-row tm-row">
        <span class="ich-ib"><Gauge size={18} aria-hidden="true" /></span>
        <span class="ich-m"><b>{t('Measure how fast the app feels')}</b><small>{t('Only on this device. Nothing is sent. Switch it on, use the app for a while (scroll Today), come back here.')}</small></span>
        <input type="checkbox" role="switch" checked={on} onchange={(e) => toggle(e.currentTarget.checked)} data-tempo-switch />
      </label>
    </li>
    {#if on}
      <li class="tm-out" data-tempo-out>
        <p class="num">{line || t('Nothing measured yet. Scroll a page for a moment.')}</p>
        <button type="button" class="tm-copy" onclick={copy} data-tempo-copy>{t('Copy the line')}</button>
      </li>
    {/if}
  </ul>
</section>

<style>
  .tm-row {
    cursor: pointer;
  }
  .tm-out {
    padding: 10px 0 12px;
  }
  .tm-out p {
    margin: 0 0 8px;
    font-size: 0.9rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .tm-copy {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: none;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
</style>
