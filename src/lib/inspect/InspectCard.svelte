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
  import { LEVELS } from './items.js';
  import { insp } from './live.svelte.js';
  import { levelName } from './names.js';

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
  const rows = $derived(st ? [{ key: 'monthly', s: st.monthly }, { key: 'full', s: st.full }] : []);
</script>

<section class="ic" aria-labelledby="ic-h-{bike.id}" data-inspect-card>
  <h3 id="ic-h-{bike.id}"><ClipboardCheck size={18} aria-hidden="true" />{t('Inspection')}</h3>
  <p class="lead">{t('Check the bike point by point, with tools, steps and when the bike shop is better.')}</p>

  {#if st?.rain}
    <p class="rain" data-inspect-rain><CloudRain size={16} aria-hidden="true" /><span>{t('Rain on {date}: dry and lube the chain, wipe the stanchions.', { date: dateOf(st.rain.day) })} <a href={bikesHash({ tab: 'care', view: 'inspect', bike: bike.id, level: 'quick' })}>{t('Quick check')}</a></span></p>
  {/if}

  {#each rows as r (r.key)}
    {@const l = line(r.s)}
    <div class="lv {l.tone}" data-inspect-level={r.key}>
      <div class="st">
        <b>{levelName(r.key)}</b>
        <small>{l.text}</small>
        {#if why(r.s)}<small class="why" data-inspect-why>{why(r.s)}</small>{/if}
      </div>
      <a class="btn ibtn {r.s?.due ? 'hi' : ''}" href={bikesHash({ tab: 'care', view: 'inspect', bike: bike.id, level: r.key })} data-inspect-start={r.key}><Play size={16} aria-hidden="true" />{st?.draft?.level === r.key ? t('Continue') : t('Start')}</a>
    </div>
  {/each}
  <div class="lv" data-inspect-level="quick">
    <div class="st"><b>{levelName('quick')}</b><small>{t(LEVELS[0].text)}</small></div>
    <a class="btn ibtn" href={bikesHash({ tab: 'care', view: 'inspect', bike: bike.id, level: 'quick' })} data-inspect-start="quick"><Play size={16} aria-hidden="true" />{st?.draft?.level === 'quick' ? t('Continue') : t('Start')}</a>
  </div>
  {#if !insp.rain}<p class="hint">{t('Rain counts once your home place is set (Me › Home place). It is the rain at home, an estimate.')} <a href="#/me">{t('Set home place')}</a></p>{/if}

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
  .lv {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .st {
    display: grid;
    flex: 1 1 14rem;
    min-width: 0;
  }
  .st b {
    font-weight: 500;
  }
  .lv.due .st small:first-of-type {
    color: var(--warn);
    font-weight: 500;
  }
  .lv.off .st small {
    color: var(--ink-2);
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
