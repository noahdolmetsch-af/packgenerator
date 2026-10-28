<script>
  /**
   * Touren c 66 «Eine Datei, mehrere Erlebnisse» (Noah 26.10.2026 «1a 2a», mockup C66): under the preview of an
   * uploaded ride, «Aufnahme aufteilen». The app suggests cuts at long pauses and slow stretches; a tap on the
   * profile adds an own cut. Each part: a stage of the trip chosen above, or an own activity with its sport.
   * «Aufteilen» hands the parts to onsplit([{ ride, as: 'stage' | 'own', sport }]); the page saves them.
   * pts: the timed points of the file (gpx.js timedPoints); name, file: of the draft; stageOk: a trip is chosen.
   */
  import { Scissors, Clock, Footprints, X } from '@lucide/svelte';
  import { t, tn, num } from '../i18n.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import { suggestCuts, cutsOf, splitRide, kmAlong, timeAtKm, sportGuess, SPORTS } from './split.js';

  let { pts = [], name = '', file = '', stageOk = false, busy = false, onsplit } = $props();
  const sugg = $derived(suggestCuts(pts));
  let chosen = $state(new Set());
  let own = $state([]);
  let choice = $state({});
  // svelte-ignore state_referenced_locally
  let open = $state(false);
  let seeded = false;
  $effect(() => {
    if (seeded || !sugg.length) return;
    seeded = true;
    // the long pauses are chosen at the start, the slow stretches stay a suggestion
    chosen = new Set(sugg.map((s, i) => (s.kind === 'pause' ? i : -1)).filter((i) => i >= 0));
  });
  const kms = $derived(kmAlong(pts));
  const total = $derived(kms.at(-1) ?? 0);
  const parts = $derived.by(() => {
    try {
      return splitRide(pts, cutsOf(sugg, chosen, own), name, file);
    } catch {
      return [];
    }
  });
  const asOf = (i) => choice[i]?.as ?? (stageOk ? 'stage' : 'own');
  const sportOf = (i) => choice[i]?.sport ?? sportGuess(parts[i]);
  const setAs = (i, v) => (choice = { ...choice, [i]: { as: v, sport: sportOf(i) } });
  const setSport = (i, v) => (choice = { ...choice, [i]: { as: asOf(i), sport: v } });
  function toggle(i) {
    const n = new Set(chosen);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    chosen = n;
    choice = {};
  }
  // the profile: heights over the raw km, 120 points at most
  const W = 600;
  const H = 120;
  const line = $derived.by(() => {
    const e = pts.map((p) => p.ele).filter((v) => Number.isFinite(v));
    if (e.length < 2 || !total) return '';
    const lo = Math.min(...e);
    const hi = Math.max(...e, lo + 10);
    const step = Math.max(1, Math.floor(pts.length / 120));
    let d = '';
    for (let i = 0; i < pts.length; i += step) if (Number.isFinite(pts[i].ele)) d += `${d ? 'L' : 'M'}${((kms[i] / total) * W).toFixed(1)} ${(H - 8 - ((pts[i].ele - lo) / (hi - lo)) * (H - 24)).toFixed(1)}`;
    return d;
  });
  const xOfT = (ms) => {
    const i = pts.findIndex((p) => p.t >= ms);
    return total ? ((kms[i < 0 ? pts.length - 1 : i] / total) * 100).toFixed(2) : 0;
  };
  function tapProfile(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const at = timeAtKm(pts, ((e.clientX - r.left) / r.width) * total);
    if (at != null && at > pts[0].t && at < pts.at(-1).t) own = [...own, at].sort((a, b) => a - b);
    choice = {};
  }
  const hm = (ms) => new Date(ms).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
  const dur = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}` : `${min} min`);
  const ICON = { pause: Clock, slow: Footprints };
</script>

{#if pts.length > 2}
  <details class="split" bind:open data-split>
    <summary><Scissors size={18} aria-hidden="true" /><span><b>{t('Split the recording')}</b><small>{sugg.length ? tn(sugg.length, '{n} suggestion, e.g. at a long pause', '{n} suggestions, e.g. at long pauses') : t('Into stages or own activities')}</small></span></summary>
    <p class="tp-small tp-muted">{t('One file, several experiences: cut it at long pauses into stages of the trip or own activities. Tap the profile to cut anywhere.')}</p>
    <button type="button" class="prof" onclick={tapProfile} aria-label={t('Profile: tap to cut here')} data-split-profile>
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">{#if line}<path d="{line} L{W} {H} L0 {H}z" class="fill" /><path d={line} class="ln" />{/if}</svg>
      {#each sugg as s, i (i)}{#if chosen.has(i)}<span class="cut" style:left="{xOfT(s.from)}%"></span>{#if s.kind === 'slow'}<span class="cut" style:left="{xOfT(s.to)}%"></span>{/if}{/if}{/each}
      {#each own as at (at)}<span class="cut own" style:left="{xOfT(at)}%"></span>{/each}
    </button>
    {#if sugg.length || own.length}
      <ul class="sg">
        {#each sugg as s, i (i)}
          {@const Ic = ICON[s.kind]}
          <li><span class="ic" aria-hidden="true"><Ic size={18} /></span><span class="m"><b>{s.kind === 'pause' ? t('Long pause {from} – {to}', { from: hm(s.from), to: hm(s.to) }) : t('Slow {from} – {to}', { from: hm(s.from), to: hm(s.to) })}</b><small>{t('km {km}', { km: num(s.km) })} · {dur(s.min)}{s.kind === 'slow' ? ` · ${t('on foot?')}` : ''}</small></span>
            <button type="button" class="btn sm" aria-pressed={chosen.has(i)} onclick={() => toggle(i)} data-split-sugg={i}>{chosen.has(i) ? t('Remove') : t('Cut here')}</button></li>
        {/each}
        {#each own as at (at)}
          <li><span class="ic" aria-hidden="true"><Scissors size={18} /></span><span class="m"><b>{t('Your cut at {time}', { time: hm(at) })}</b></span>
            <button type="button" class="btn sm" aria-label={t('Remove')} onclick={() => ((own = own.filter((x) => x !== at)), (choice = {}))}><X size={16} aria-hidden="true" /></button></li>
        {/each}
      </ul>
    {/if}
    {#if parts.length > 1}
      <p class="rv-lbl">{tn(parts.length, '{n} part', '{n} parts')}</p>
      {#each parts as r, i (r.id)}
        <div class="part" data-split-part={i}>
          <p class="ph"><b>{t('Part {n}', { n: i + 1 })} · {hm(Date.parse(r.startAt))}</b><span class="num">{num(r.km)} km · {r.movingH} h</span></p>
          <Seg value={asOf(i)} options={[{ key: 'stage', name: t('Stage of the trip') }, { key: 'own', name: t('Own activity') }]} onchange={(v) => setAs(i, v)} label={t('Part {n}', { n: i + 1 })} />
          {#if asOf(i) === 'own'}<div class="sp"><Seg value={sportOf(i)} options={SPORTS.map((s) => ({ key: s.key, name: t(s.name) }))} onchange={(v) => setSport(i, v)} label={t('Sport')} /></div>{/if}
        </div>
      {/each}
      {#if !stageOk && parts.some((_, i) => asOf(i) === 'stage')}<p class="tp-small warn">{t('Choose a trip under «Save to» for the stages.')}</p>{/if}
      <p class="acts"><button type="button" class="btn hi" disabled={busy || (!stageOk && parts.some((_, i) => asOf(i) === 'stage'))} onclick={() => onsplit(parts.map((ride, i) => ({ ride, as: asOf(i), sport: sportOf(i) })))} data-split-go><Scissors size={18} aria-hidden="true" />{t('Split and save')}</button></p>
      <p class="tp-small tp-muted">{t('The pause at a cut is no riding time. Only the bike parts count for the bike.')}</p>
    {:else}
      <p class="tp-small tp-muted">{t('Choose a suggestion or tap the profile: then the parts show here.')}</p>
    {/if}
  </details>
{/if}

<style>
  .split { border-top: 1px solid var(--line); padding: 10px 14px; }
  .split summary { display: flex; align-items: center; gap: 10px; cursor: pointer; min-height: 44px; }
  .split summary span { display: grid; }
  .split summary small { color: var(--ink-2); font-size: var(--fs-small); }
  .prof { position: relative; display: block; width: 100%; height: 120px; padding: 0; margin: 8px 0; border: 1px solid var(--line); border-radius: 10px; background: var(--paper-2); overflow: hidden; cursor: crosshair; }
  .prof svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .fill { fill: var(--hi-soft); }
  .ln { fill: none; stroke: var(--hi); stroke-width: 2; vector-effect: non-scaling-stroke; }
  .cut { position: absolute; top: 0; bottom: 0; border-left: 2px dashed var(--warn); }
  .cut.own { border-left-color: var(--ink); }
  .sg { list-style: none; margin: 0; padding: 0; }
  .sg li { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line); }
  .sg .m { flex: 1; min-width: 0; display: grid; }
  .sg small { color: var(--ink-2); font-size: var(--fs-small); }
  .ic { color: var(--ink-2); }
  .part { border: 1px solid var(--line); border-radius: 12px; padding: 10px; margin-top: 8px; display: grid; gap: 8px; }
  .ph { margin: 0; display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .ph span { color: var(--ink-2); font-size: var(--fs-small); }
  .acts { margin: 10px 0 4px; }
  .warn { color: var(--warn); }
</style>
