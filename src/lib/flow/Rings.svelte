<script>
  /**
   * v0.51.0 «Im Flow»: the three rings, rolling over the last 7 days: Bewegen (outside, orange),
   * Achtsam (teal), Erholung (inside, blue). legend: the three rows with the numbers beside them.
   * v0.105.0 Design-Refresh P8 «Aktiv» (A1): `quiet` writes the numbers as a quiet line under the name
   * («2 von 4 Ziele im Soll · letzte 7 Tage») instead of the big numbers.
   */
  import { ringFill } from '../flow.js';
  import { ChevronRight, ChevronDown, ChevronUp } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  // hrefs: { move, mind, rest } → where a tap on that row leads (Aktiv, «Zahl mit Weg»); without it the rows are plain text
  // parts: { move, mind, rest } → the sports of that ring (ringweg.js ringParts); a row with several folds open and lists them, each a way (Noah «2a»)
  // nameOf: a sport's name in the current language; fallback links lead to «Ticks evaluated»
  let { rings, size = 136, legend = true, compact = false, quiet = false, hrefs = null, parts = null, nameOf = (a) => a.name, allHref = '#/flow/auswertung' } = $props();
  let open = $state({});

  const ROWS = [
    { key: 'move', name: 'Move|ring', unit: 'goals on track' },
    { key: 'mind', name: 'Mindful|ring', unit: 'days' },
    { key: 'rest', name: 'Recovery|ring', unit: 'units' },
  ];
  const W = 14;
  const radius = (i) => 68 - W / 2 - i * (W + 5);
  const label = $derived(ROWS.map((r) => `${t(r.name)} ${rings[r.key].n} / ${rings[r.key].of}`).join(', '));
</script>

<div class="rings" class:compact class:quiet>
  <svg width={size} height={size} viewBox="0 0 136 136" role="img" aria-label={label}>
    {#each ROWS as r, i (r.key)}
      {@const rad = radius(i)}
      {@const c = 2 * Math.PI * rad}
      {@const f = ringFill(rings[r.key])}
      <circle cx="68" cy="68" r={rad} fill="none" class="soft {r.key}" stroke-width={W} />
      {#if f > 0}<circle cx="68" cy="68" r={rad} fill="none" class="arc {r.key}" stroke-width={W} stroke-linecap="round" stroke-dasharray="{Math.max(0.01, f * c)} {c}" transform="rotate(-90 68 68)" />{/if}
    {/each}
  </svg>
  {#if legend}
    <ul class="lg">
      {#each ROWS as r (r.key)}
        <li>
          <span class="dot {r.key}" aria-hidden="true"></span>
          {#if quiet}
            {#if parts?.[r.key]?.length > 1}
              <button type="button" class="nm way fold-btn" aria-expanded={!!open[r.key]} aria-controls="ring-parts-{r.key}" data-ring-fold={r.key} onclick={() => (open[r.key] = !open[r.key])}><span class="wt"><b>{t(r.name)}</b><small class="num">{rings[r.key].of ? `${t('{n} of {m}', { n: rings[r.key].n, m: rings[r.key].of })} ${t(r.unit)}` : '–'} · {t('last 7 days')}</small></span>{#if open[r.key]}<ChevronUp size={16} strokeWidth={2.5} class="wc" aria-hidden="true" />{:else}<ChevronDown size={16} strokeWidth={2.5} class="wc" aria-hidden="true" />{/if}</button>
              {#if open[r.key]}
                <ul class="parts" id="ring-parts-{r.key}" data-ring-parts={r.key}>
                  {#each parts[r.key] as p (p.act.id)}
                    <li><a class="part" href={p.href} data-ring-part={p.act.id}><span class="pn">{nameOf(p.act)}</span><small class="num">{p.met ? t('Reached') : p.of ? t('{n} of {m}', { n: p.n, m: p.of }) : '–'}</small><ChevronRight size={16} strokeWidth={2.5} class="wc" aria-hidden="true" /></a></li>
                  {/each}
                  <li><a class="part all" href={allHref} data-ring-all={r.key}><span class="pn">{t('All in «Ticks evaluated»')}</span><ChevronRight size={16} strokeWidth={2.5} class="wc" aria-hidden="true" /></a></li>
                </ul>
              {/if}
            {:else if hrefs?.[r.key]}
              <a class="nm way" href={hrefs[r.key]} data-ring-way={r.key}><span class="wt"><b>{t(r.name)}</b><small class="num">{rings[r.key].of ? `${t('{n} of {m}', { n: rings[r.key].n, m: rings[r.key].of })} ${t(r.unit)}` : '–'} · {t('last 7 days')}</small></span><ChevronRight size={16} strokeWidth={2.5} class="wc" aria-hidden="true" /><span class="sr">{t('Open «{what}» in Analyse', { what: t(r.name) })}</span></a>
            {:else}
            <span class="nm"><b>{t(r.name)}</b><small class="num">{rings[r.key].of ? `${t('{n} of {m}', { n: rings[r.key].n, m: rings[r.key].of })} ${t(r.unit)}` : '–'} · {t('last 7 days')}</small></span>
            {/if}
          {:else}
          <span class="nm"><b>{t(r.name)}</b>{#if !compact}<small>{t(r.unit)}</small>{/if}</span>
          <span class="v {r.key} num">{rings[r.key].of ? rings[r.key].n : '–'}<span class="of">/{rings[r.key].of || '–'}</span></span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .rings {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }
  svg {
    flex: none;
    display: block;
    max-width: 34vw;
    height: auto;
  }
  @media (max-width: 359px) {
    .rings {
      gap: 10px;
    }
    svg {
      max-width: 28vw; /* room for the arrow of a way row (the word «Bewegen» must not break) */
    }
    .nm small {
      display: none;
    }
    .v {
      font-size: var(--fs-section);
    }
  }
  .soft.move {
    stroke: var(--hi-soft);
  }
  .soft.mind {
    stroke: var(--l4-soft);
  }
  .soft.rest {
    stroke: var(--l3-soft);
  }
  .arc.move {
    stroke: var(--hi);
  }
  .arc.mind {
    stroke: var(--l4);
  }
  .arc.rest {
    stroke: var(--l3);
  }
  .lg {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .lg li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 50px;
    border-top: 1px solid var(--line);
  }
  .lg li:first-child {
    border-top: 0;
  }
  .quiet {
    gap: var(--sp-5);
  }
  .quiet .lg li {
    flex-wrap: wrap;
    min-height: 0;
    padding: 6px 0;
    border-top: 0;
  }
  .quiet .nm small {
    display: block;
    color: var(--ink-3);
  }
  .way {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    color: inherit;
    text-decoration: none;
  }
  .way:hover .wt b {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .way .wt {
    flex: 1;
    min-width: 0;
  }
  .way :global(.wc) {
    flex: none;
    color: var(--ink-3);
  }
  .fold-btn {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .parts {
    flex-basis: 100%;
    margin: 0 0 6px;
    padding: 0;
    list-style: none;
  }
  .parts li {
    display: block;
    min-height: 0;
    padding: 0;
    border-top: 1px solid var(--line);
  }
  .part {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 6px;
    padding-block: 6px;
    min-height: 44px;
    color: var(--accent);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  .part .pn {
    grid-column: 1;
    min-width: 0;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .part small {
    grid-column: 1;
    color: var(--ink-3);
    text-decoration: none;
  }
  .part :global(.wc) {
    grid-column: 2;
    grid-row: 1 / span 2;
    color: var(--ink);
  }
  .part.all :global(.wc) {
    grid-row: 1;
  }
  .compact .lg li {
    min-height: 34px;
    border-top: 0;
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .dot.move {
    background: var(--hi);
  }
  .dot.mind {
    background: var(--l4);
  }
  .dot.rest {
    background: var(--l3);
  }
  .nm {
    flex: 1;
    min-width: 0;
    line-height: 1.25;
  }
  .nm b {
    display: block;
    font-weight: 500;
  }
  .nm small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .v {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: var(--fs-page);
    line-height: 1;
  }
  .compact .v {
    font-size: var(--fs-section);
  }
  .v.move {
    color: var(--hi);
  }
  .v.mind {
    color: var(--l4);
  }
  .v.rest {
    color: var(--l3);
  }
  .of {
    color: var(--ink-3);
  }
</style>
