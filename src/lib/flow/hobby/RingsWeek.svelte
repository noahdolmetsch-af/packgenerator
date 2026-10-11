<script>
  /**
   * Hobby pages (mockup A «Drei Ringe»): Achtsam · Bewegen · Erholen, each a small ring with its stand
   * (flow.js rings, the rolling 7 days) and the activities that fill it, then this week Monday to Sunday
   * with one dot per ring and day, and a short legend.
   * rings: flow.js rings(); week: flowtiles.js ringWeek(); names: { mind, move, rest } → [names].
   */
  import { ringFill } from '../../flow.js';
  import { wd } from '../words.js';
  import { t } from '../../i18n.svelte.js';

  let { rings, week = [], names = {} } = $props();
  const ROWS = [
    { key: 'mind', name: 'Mindful|ring' },
    { key: 'move', name: 'Move|ring' },
    { key: 'rest', name: 'Recover|ring' },
  ];
  const C = 2 * Math.PI * 16;
  const list = (l = []) => (l.length > 3 ? `${l.slice(0, 3).join(', ')} …` : l.join(', '));
</script>

<div class="rw3">
  <ul class="three">
    {#each ROWS as r (r.key)}
      {@const f = ringFill(rings[r.key])}
      <li class={r.key}>
        <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><circle cx="22" cy="22" r="16" class="bg" /><circle cx="22" cy="22" r="16" class="fg" stroke-dasharray="{Math.max(0.01, f * C)} {C}" transform="rotate(-90 22 22)" /></svg>
        <span><b>{t(r.name)}</b><small>{rings[r.key].of ? t('{n} of {m}', { n: rings[r.key].n, m: rings[r.key].of }) : '–'}{#if names[r.key]?.length}{' · '}{list(names[r.key])}{/if}</small></span>
      </li>
    {/each}
  </ul>
  <ol class="week" aria-label={t('This week')}>
    {#each week as d (d.day)}
      <li class:future={d.future} class:today={d.today}>
        <span class="dots" role="img" aria-label={`${wd(d.day)}: ${ROWS.filter((r) => d[r.key]).map((r) => t(r.name)).join(', ') || t('nothing yet')}`}>{#each ROWS as r (r.key)}<i class="{r.key}" class:on={d[r.key]}></i>{/each}</span>
        <small>{wd(d.day)}</small>
      </li>
    {/each}
  </ol>
  <p class="lg">{t('Mindful = meditation, breathing. Move = sport. Recover = sauna, walk, rest breaks.')}</p>
</div>

<style>
  .three {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px 20px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .three li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    line-height: 1.3;
  }
  .three svg {
    flex: none;
  }
  .three b {
    display: block;
    font-weight: 600;
  }
  .three small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bg,
  .fg {
    fill: none;
    stroke-width: 6;
  }
  .fg {
    stroke-linecap: round;
  }
  .mind .bg {
    stroke: var(--accent-soft);
  }
  .move .bg {
    stroke: var(--hi-soft);
  }
  .rest .bg {
    stroke: var(--l3-soft);
  }
  .mind .fg {
    stroke: var(--accent);
  }
  .move .fg {
    stroke: var(--hi);
  }
  .rest .fg {
    stroke: var(--l3);
  }
  .week {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
    text-align: center;
  }
  .week li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px 0;
    border-radius: 8px;
  }
  .week li.today {
    background: var(--paper-2);
  }
  .week small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .dots {
    display: flex;
    gap: 3px;
  }
  .dots i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--paper-2);
    border: 1px solid var(--line);
  }
  .dots i.on.mind {
    background: var(--accent);
    border-color: var(--accent);
  }
  .dots i.on.move {
    background: var(--hi);
    border-color: var(--hi);
  }
  .dots i.on.rest {
    background: var(--l3);
    border-color: var(--l3);
  }
  .future .dots {
    opacity: 0.5;
  }
  .lg {
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
