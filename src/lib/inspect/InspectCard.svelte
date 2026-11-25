<script>
  /**
   * «Velo-Inspektion» on a bike's care page (above the parts) and on top of the inspections page:
   * the monthly check and the full inspection, each with its state (when last, when next, why sooner:
   * rain and trail rides, 3a), the hint after a rainy ride, an open draft to continue, and the three
   * starts (5a). bike: as stored; page: on the inspections page (no link to itself).
   */
  import { ClipboardCheck, CloudRain, ChevronRight, Play } from '@lucide/svelte';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { bikesHash } from '../bikes.js';
  import { LEVELS, LEVEL } from './items.js';
  import { insp } from './live.svelte.js';
  import { levelName } from './names.js';
  import { levelInfo } from './levelinfo.js';

  let { bike, page = false } = $props();

  const st = $derived(insp.byBike[bike.id] ?? null);
  const fmtKm = (n) => num(Math.max(0, Math.round(n)));

  function line(s) {
    if (!s) return { text: t('not known yet'), tone: '' };
    if (s.off) return { text: t('off: no reminder'), tone: 'off' };
    if (s.due && s.by === 'season') return { text: t('Due: start of the season'), tone: 'due' };
    if (s.never) return { text: t('Not done yet: start the first one when it suits you.'), tone: '' };
    if (s.due) return { text: s.by === 'km' ? t('Due: {km} km since {date}', { km: fmtKm(s.load.load), date: dateOf(s.last.date) }) : t('Due: last one {date}', { date: dateOf(s.last.date) }), tone: 'due' };
    const parts = [];
    if (s.kmLeft != null) parts.push(t('in {km} km', { km: fmtKm(s.kmLeft) }));
    if (s.next) parts.push(t('by {date}', { date: dateOf(s.next) }));
    return { text: `${t('Next')}: ${parts.join(` ${t('or|either')} `)}`, tone: s.soon ? 'soon' : '' };
  }
  function why(s) {
    if (!s?.load || s.extra <= 0) return '';
    const bits = [];
    if (s.load.wet) bits.push(tn(s.load.wet, '{n} ride in the rain', '{n} rides in the rain'));
    if (s.load.trail) bits.push(tn(s.load.trail, '{n} trail ride', '{n} trail rides'));
    if (s.load.gravel) bits.push(tn(s.load.gravel, '{n} gravel ride', '{n} gravel rides'));
    return t('Sooner because of {what}: +{km} km', { what: bits.join(', '), km: fmtKm(s.extra) });
  }
  // Schritt B: three cards, the monthly check in the middle (what usually comes next), each with its points and its tools
  const cards = $derived(['quick', 'monthly', 'full'].map((key) => ({ key, s: key === 'quick' ? null : st?.[key] ?? null, info: levelInfo(bike, key, insp.list) })));
  /** «You need: a, b and 2 more» (the first two tools). */
  const need = (tools) => (tools.length <= 2 ? tools.map((x) => t(x)).join(', ') : `${tools.slice(0, 2).map((x) => t(x)).join(', ')} ${tn(tools.length - 2, 'and {n} more', 'and {n} more')}`);
</script>

<section class="ic" aria-labelledby="ic-h-{bike.id}" data-inspect-card>
  <h3 id="ic-h-{bike.id}"><ClipboardCheck size={20} aria-hidden="true" />{t('Inspection')}</h3>
  <p class="lead">{t('Check the bike point by point, with tools, steps and when the bike shop is better.')}</p>

  {#if st?.rain}
    <p class="rain" data-inspect-rain><CloudRain size={16} aria-hidden="true" /><span>{t('Rain on {date}: dry and lube the chain, wipe the stanchions.', { date: dateOf(st.rain.day) })} <a href={bikesHash({ tab: 'care', view: 'inspect', bike: bike.id, level: 'quick' })}>{t('Quick check')}</a></span></p>
  {/if}

  <div class="cards">
    {#each cards as r (r.key)}
      {@const l = r.key === 'quick' ? { text: t(LEVELS[0].text), tone: '' } : line(r.s)}
      <div class="lv {l.tone}" class:hi={r.s?.due} data-inspect-level={r.key}>
        <b>{levelName(r.key)}</b>
        <small class="mins">{tn(LEVEL[r.key].mins, '{n} minute', '{n} minutes')} · {tn(r.info.points, '{n} point', '{n} points')}</small>
        <small class="state">{l.text}</small>
        {#if why(r.s)}<small class="why" data-inspect-why>{why(r.s)}</small>{/if}
        <small class="need" data-inspect-need={r.key}>{r.info.tools.length ? `${t('You need')}: ${need(r.info.tools)}` : t('No special tools needed.')}</small>
        <a class="btn ibtn {r.s?.due ? 'hi' : ''}" href={bikesHash({ tab: 'care', view: 'inspect', bike: bike.id, level: r.key })} data-inspect-start={r.key}><Play size={16} aria-hidden="true" />{st?.draft?.level === r.key ? t('Continue') : t('Start')}</a>
      </div>
    {/each}
  </div>
  {#if !insp.rain}<p class="hint">{t('Rain counts once your home place is set (Me › Home place). Strava rides count the rain where they started, other rides the rain at home: an estimate.')} <a href="#/me">{t('Set home place')}</a></p>{/if}

  {#if !page}
    <nav class="links" aria-label={t('More for the inspection')}>
      <a href={bikesHash({ tab: 'care', view: 'inspect', bike: bike.id })} data-link-inspect><ClipboardCheck size={16} aria-hidden="true" /><span>{t('Inspections')}<small>{t('History with photos, checklist, intervals')}</small></span><ChevronRight size={16} aria-hidden="true" /></a>
    </nav>
  {/if}
</section>

<style>
  .ic {
    margin: 0 0 14px;
    padding: 14px 16px 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .lead,
  .hint {
    margin: 4px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .rain {
    display: flex;
    gap: 8px;
    margin: 0 0 8px;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--warn-soft);
    overflow-wrap: break-word;
  }
  .cards {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    margin: 0 0 8px;
  }
  @media (min-width: 760px) {
    .cards {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .lv {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper-2);
  }
  .lv.hi {
    border-color: var(--warn);
  }
  .lv b {
    font-size: var(--fs-body);
  }
  .lv.due .state {
    color: var(--warn);
    font-weight: 500;
  }
  .lv.off .state {
    color: var(--ink-2);
  }
  .lv .ibtn {
    margin-top: auto;
    align-self: flex-start;
  }
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ibtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .links {
    display: grid;
    border-top: 1px solid var(--line);
  }
  .links a {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 6px 0;
    color: var(--ink);
    text-decoration: none;
  }
  .links a span {
    display: grid;
    min-width: 0;
  }
</style>
