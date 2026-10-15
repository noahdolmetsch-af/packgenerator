<script>
  /**
   * v0.127.0 «Tages-Check» 2 (mockup T3, Noah 13.10.2026 «T1–T4 freigegeben», «ring gross auf Heute»):
   * «Deine Balance» on Heute. A ring of the 9 categories for the last 7 days (balance.js): each
   * segment as deep as its value 0–100, a light one where nothing is known yet. The mean in the middle,
   * the legend with the values, and the category with the lowest value with a gentle suggestion
   * (never a task). Nothing is invented: an empty category shows «–».
   * WG: the answers of «Wi gaht's?» count too (balance.js answerSignals).
   */
  import { balanceQuery } from '../flow/data.svelte.js';
  import { balance, ringPaths, CATS, CAT } from '../balance.js';
  import { phone } from '../media.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { today, size = 'l', isnew = false } = $props();
  const q = $derived(balanceQuery(today));
  const data = $derived($q);
  const b = $derived(data ? balance({ ...data, today }) : null);
  const R = $derived(phone.matches ? 220 : 196);
  const paths = $derived(b ? ringPaths(b.cats, R) : []);
  /** The colour of each category: tokens only, so every colour world and dark mode keeps them apart. */
  const COLOR = {
    fun: 'var(--l2)',
    rest: 'var(--l3)',
    sport: 'color-mix(in srgb, var(--l2) 50%, var(--bad))',
    mind: 'var(--l4)',
    friends: 'color-mix(in srgb, var(--bad) 55%, var(--paper))',
    nature: 'var(--l1)',
    vision: 'color-mix(in srgb, var(--l2) 55%, var(--l1))',
    goals: 'color-mix(in srgb, var(--l3) 55%, var(--l1))',
    done: 'color-mix(in srgb, var(--l2) 40%, var(--ink-3))',
  };
  const val = (v) => (v == null ? '–' : String(v));
  const said = $derived(b ? b.cats.map((c) => `${t(CAT[c.key].label)} ${val(c.value)}`).join(', ') : '');
</script>

<section class="bl surf {size}" aria-labelledby="bl-h" data-section="balance">
  {#if b}
    <svg class="ring" viewBox="0 0 {R} {R}" width={R} height={R} role="img" aria-label={t('Balance of the last 7 days: {list}', { list: said })}>
      {#each paths as p (p.key)}
        <path d={p.bg} style:fill="color-mix(in srgb, {COLOR[p.key]} 16%, var(--paper))" />
        {#if p.fg}<path d={p.fg} style:fill={COLOR[p.key]} data-seg={p.key} />{/if}
      {/each}
      <circle cx={R / 2} cy={R / 2} r={R * 0.22} class="mid" />
      <text x={R / 2} y={R / 2 + 2} class="mn num" text-anchor="middle">{val(b.mean)}</text>
      <text x={R / 2} y={R / 2 + 22} class="ml" text-anchor="middle">{t('7 days|ring')}</text>
    </svg>
    <div class="tx">
      <div class="hd">
        <h2 id="bl-h">{t('Your balance')}</h2>
        {#if isnew}<span class="nw">{t('new|tile')}</span>{/if}
      </div>
      <p class="sub">{t('last 7 days · from questions and your data')}</p>
      <ul class="lg">
        {#each CATS as c (c.key)}
          {@const v = b.cats.find((x) => x.key === c.key)?.value ?? null}
          <li data-cat={c.key}><i style:background={COLOR[c.key]} aria-hidden="true"></i><span>{t(c.label)}</span><em class="num">{val(v)}</em></li>
        {/each}
      </ul>
      {#if b.least}
        <p class="least" data-least={b.least}>{t('Least:')} <b>{t(CAT[b.least].label)}</b> · {t('Suggestion: {tip}', { tip: t(CAT[b.least].tip) })}</p>
      {:else if b.mean == null}
        <p class="least">{t('Answer your questions or tick something in Aktiv: the ring fills by itself.')}</p>
      {/if}
    </div>
  {/if}
</section>

<style>
  .bl {
    display: flex;
    gap: var(--sp-4);
    align-items: center;
    height: 100%;
    padding: 16px 20px;
    box-sizing: border-box;
  }
  .ring {
    flex: none;
    max-width: 100%;
    height: auto;
  }
  .mid {
    fill: var(--paper);
  }
  .mn {
    fill: var(--ink);
    font: 700 var(--fs-title) / 1 var(--font-body);
  }
  .ml {
    fill: var(--ink-3);
    font: 400 var(--fs-tiny) / 1 var(--font-body);
  }
  .tx {
    flex: 1;
    min-width: 0;
  }
  .hd {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
  }
  h2 {
    flex: 1 1 0;
    min-width: min-content;
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .nw {
    padding: 0 8px;
    border-radius: 10px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .sub {
    margin: 4px 0 var(--sp-3);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lg {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
  }
  .lg li {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .lg i {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
  .lg span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .lg em {
    margin-left: auto;
    color: var(--ink-3);
    font-style: normal;
  }
  .least {
    margin: var(--sp-3) 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* a phone (and a narrow tile): the ring on top, the words under it */
  @media (max-width: 719px) {
    .bl {
      flex-direction: column;
      align-items: stretch;
    }
    .ring {
      align-self: center;
    }
  }
</style>
