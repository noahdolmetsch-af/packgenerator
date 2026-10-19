<script>
  /**
   * «Mehr Inhalt» T2 «Harte Stücke dieser Fahrt» (Noah 15.10.2026 «1-5 a»): the hard pieces found in
   * the power of the course (at least 3 minutes at 90 % of the estimated FTP or more, inside an easier
   * minute allowed), one summary line («4 × 5 Min in Z4, Ø 262 W, Pause Ø 3 Min») and a table. Tapping
   * a piece shades it in «Verlauf» (focus.svelte.js, like a section); tapping it again clears it.
   * No power meter, no FTP or no piece: the card draws nothing.
   */
  import AnaCard from '../AnaCard.svelte';
  import { hardPieces, piecesSummary } from './inhalt-fahrt.js';
  import { mss } from '../act/analysen.js';
  import { focus, toggleFocus } from '../act/focus.svelte.js';
  import { ftpEstimate } from '../../training.js';
  import { t, tn, num } from '../../i18n.svelte.js';

  let { act = null, all = [], today = '' } = $props();
  const ftp = $derived(act?.wDevice ? ftpEstimate(all ?? [], today) : null);
  const pieces = $derived(ftp ? hardPieces(act?.prof, ftp) : []);
  const sum = $derived(piecesSummary(pieces, ftp, act?.prof?.breaks));
  const v = (x) => (Number.isFinite(x) ? num(x) : '–');
  const key = (i) => `int${i}`;

  const line = $derived.by(() => {
    if (!sum) return '';
    if (!sum.same) {
      return tn(sum.n, '{n} hard piece, {m} min, Ø {w} W|hp', '{n} hard pieces, together {m} min, Ø {w} W|hp', { m: num(sum.mins), w: num(sum.w) });
    }
    const head = t('{n} × {m} min in Z{z}, Ø {w} W, rest Ø {p} min|hp', { n: sum.n, m: num(sum.mins), z: sum.zone, w: num(sum.w), p: num(sum.pause) });
    const more = pieces.length - sum.n;
    return more > 0 ? `${head} · ${tn(more, 'plus {n} more piece|hp', 'plus {n} more pieces|hp')}` : head;
  });

  function tap(p) {
    toggleFocus(act.id, key(p.i), [p.from, p.to]);
    if (focus.id == null) return;
    const tl = document.querySelector('[data-ana="timeline"]');
    if (!tl) return;
    const r = tl.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) tl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
</script>

{#if pieces.length}
  <AnaCard key="intervals" sub={t('from 90 % of your FTP, at least 3 minutes|hp')}>
    <p class="hpsum" data-pieces-summary>{line}</p>
    <table class="hptab">
      <thead>
        <tr>
          <th scope="col" class="st">{t('Start|hp')}</th>
          <th scope="col">{t('Length|hp')}</th>
          <th scope="col">{t('Ø W|an')}</th>
          <th scope="col">{t('Ø HR|an')}</th>
          <th scope="col">{t('Zone|hp')}</th>
        </tr>
      </thead>
      <tbody>
        {#each pieces as p (p.i)}
          {@const on = focus.id === act.id && focus.i === key(p.i)}
          <!-- the whole row is a bigger target for the finger; the button in it is the keyboard way -->
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
          <tr class:on class:grp={sum?.same && pieces.length > sum.n && sum.ids.includes(p.i)} onclick={() => tap(p)} data-piece-row={p.i}>
            <th scope="row" class="st">
              <button type="button" class="kb" aria-pressed={on} aria-label={t('Show the hard piece from minute {m} in the course', { m: num(Math.round(p.from)) })} onclick={(e) => (e.stopPropagation(), tap(p))}>{t('min {m}|hp', { m: num(Math.round(p.from)) })}</button>
            </th>
            <td>{mss(p.mins * 60)}</td>
            <td>{v(p.w)}</td>
            <td>{v(p.hr)}</td>
            <td>{p.zone ? `Z${p.zone}` : '–'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">{t('Hard = from 90 % of your estimated FTP ({ftp} W), at least 3 minutes in a row. Minutes on the course. Tap a piece to see it in the course.', { ftp: num(ftp) })}</p>
  </AnaCard>
{/if}

<style>
  .hpsum {
    margin: 0;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .hptab {
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
  .st {
    text-align: left;
    font-weight: 400;
  }
  thead .st {
    font-weight: 600;
  }
  tbody tr {
    cursor: pointer;
  }
  tr.grp > * {
    background: color-mix(in srgb, var(--pz4) 14%, transparent);
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
  @media (max-width: 640px) {
    th,
    td {
      padding: 8px 3px;
    }
  }
</style>
