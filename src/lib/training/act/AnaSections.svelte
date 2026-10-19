<script>
  /**
   * TR7a «Abschnitte» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the ride per 5 km: time, km/h, Hm,
   * heart rate and power. A section with more than 3 % on average is tinted and says «Anstieg». Tapping
   * a section shades its minutes in «Verlauf» (focus.svelte.js); tapping it again clears it.
   */
  import AnaCard from '../AnaCard.svelte';
  import { sectionRows, mss } from './analysen.js';
  import { focus, toggleFocus } from './focus.svelte.js';
  import { t, num } from '../../i18n.svelte.js';

  let { act = null } = $props();
  const rows = $derived(sectionRows(act?.secs5));
  const power = $derived(!!act?.wDevice && rows.some((r) => r.w > 0));
  const v = (x) => (Number.isFinite(x) ? num(x) : '–');

  function tap(i) {
    toggleFocus(act.id, i);
    if (focus.id == null) return;
    const tl = document.querySelector('[data-ana="timeline"]');
    if (!tl) return;
    const r = tl.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) tl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
</script>

{#if rows.length}
  <AnaCard key="sections" sub={t('per 5 km|an')}>
    <table class="atab">
      <thead>
        <tr>
          <th scope="col" class="km">{t('km|an')}</th>
          <th scope="col">{t('Time|an')}</th>
          <th scope="col">{t('km/h|an')}</th>
          <th scope="col">{t('Hm|an')}</th>
          <th scope="col">{t('Ø HR|an')}</th>
          {#if power}<th scope="col">{t('Ø W|an')}</th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each rows as r, i (i)}
          {@const on = focus.id === act.id && focus.i === i}
          <!-- the whole row is a bigger target for the finger; the button in it is the keyboard way -->
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
          <tr class:climb={r.climb} class:on onclick={() => tap(i)} data-section-row={i}>
            <th scope="row" class="km">
              <button type="button" class="kb" aria-pressed={on} aria-label={t('Show km {from}–{to} in the course', { from: num(r.from), to: num(r.to) })} onclick={(e) => (e.stopPropagation(), tap(i))}>{num(r.from)}–{num(r.to)}</button>
              {#if r.climb}<span class="cpill">{t('Climb|an')}</span>{/if}
            </th>
            <td>{mss(r.s)}</td>
            <td>{v(r.kmh)}</td>
            <td>{v(r.hm)}</td>
            <td>{v(r.hr)}</td>
            {#if power}<td>{v(r.w)}</td>{/if}
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">{t('Yellow = climb (more than 3 % on average). Tap a section to see it in the course.')}</p>
  </AnaCard>
{/if}

<style>
  .atab {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-small);
  }
  th,
  td {
    padding: 8px 6px;
    text-align: right;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  thead th {
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .km {
    text-align: left;
    font-weight: 400;
  }
  thead .km {
    font-weight: 600;
  }
  tbody tr {
    cursor: pointer;
  }
  tr.climb > * {
    background: var(--warn-soft);
  }
  tr.on > * {
    box-shadow: inset 0 -2px 0 var(--ink-2);
  }
  .kb {
    background: none;
    border: 0;
    padding: 2px 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    min-height: 24px;
  }
  .kb[aria-pressed='true'] {
    font-weight: 600;
    text-decoration: underline;
  }
  .cpill {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--pz4) 30%, transparent);
    color: var(--warn);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  @media (max-width: 640px) {
    th,
    td {
      padding: 8px 3px;
    }
    .cpill {
      margin-left: 3px;
      padding: 1px 6px;
    }
  }
</style>
