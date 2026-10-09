<script>
  /**
   * v0.39.0 (AP28): days, overnight stay (with cooking) and, by bike, riding hours of a template; the
   * New trip dialog takes them as defaults (templateDefaults). onchange(fn) changes the template.
   */
  import { t } from '../i18n.svelte.js';
  import { NIGHT_CHOICES, nightChoice, nightFields } from '../context.js';

  let { tpl, byBike = true, onchange } = $props();
  // v0.66.0 (Noah 8a): the night as one choice: none, Bivouac, Bivouac + tent, Hotel/hut.
  const NIGHTS = NIGHT_CHOICES;
  function typedDays(value) {
    const n = Math.round(Number(value));
    if (n >= 1 && n <= 60) onchange?.((x) => ({ ...x, days: n }));
  }
  function typedHours(value) {
    const n = value.trim() === '' ? null : Number(value.replace(',', '.'));
    if (n === null || (n > 0 && n <= 24)) onchange?.((x) => ({ ...x, hours: n }));
  }
  const night = (key) => onchange?.((x) => {
    const f = nightFields(key);
    return { ...x, ...f, cook: f.overnight === 'outdoor' ? !!x.cook : false };
  });
</script>

<div class="df">
  <div class="two">
    <label><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="60" value={tpl.days ?? 1} onchange={(e) => typedDays(e.currentTarget.value)} /></label>
    {#if byBike}<label><span class="lbl">{t('Riding hours per day')}</span><input class="inp num" type="text" inputmode="decimal" value={tpl.hours ?? ''} placeholder={t('e.g. 2')} onchange={(e) => typedHours(e.currentTarget.value)} /></label>{/if}
  </div>
  <span class="lbl">{t('Overnight')}</span>
  <div class="seg" role="group" aria-label={t('Overnight')}>
    {#each NIGHTS as o (o.key)}<button type="button" aria-pressed={(nightChoice(tpl) ?? 'none') === o.key} onclick={() => night(o.key)}>{t(o.name)}</button>{/each}
  </div>
  {#if tpl.overnight === 'outdoor'}<label class="ck"><input type="checkbox" checked={!!tpl.cook} onchange={(e) => onchange?.((x) => ({ ...x, cook: e.currentTarget.checked }))} /> {t('Cooking')}</label>{/if}
</div>

<style>
  .df {
    display: grid;
    gap: 6px;
    padding: 8px 0 12px;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px 12px;
    margin-bottom: 6px;
  }
  .two label {
    display: grid;
  }
  .seg {
    display: inline-flex;
    flex-wrap: wrap;
    max-width: 100%;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    overflow: hidden;
    justify-self: start;
  }
  .seg button {
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-right: 1.5px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink);
    font: 600 15px var(--font-body);
    cursor: pointer;
  }
  .seg button:last-child {
    border-right: 0;
  }
  .seg button[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .ck {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
</style>
