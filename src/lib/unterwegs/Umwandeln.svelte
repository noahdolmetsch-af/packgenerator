<script>
  /**
   * Paket K #312 «GPX in FIT oder KML umwandeln»: the fold in «Mehr» on Unterwegs. Choose a GPX file
   * (all its points) or take the route of this trip (the app keeps a shorter line of 200 points), then
   * save it as FIT (a course for Garmin), KML (Google Earth, maps) or GPX. Everything on the device.
   */
  import { t, num } from '../i18n.svelte.js';
  import { parseGpx, GPX_MAX_MB } from '../route.js';
  import { pointsOf, toKml, toGpx, toFit, fileName } from './umwandeln.js';
  import { FileUp, Download } from '@lucide/svelte';

  let { route = null } = $props();
  let file = $state(null); // { name, points }
  let msg = $state('');
  const src = $derived(file ?? (route?.line?.length >= 2 ? { name: route.name || t('Route'), points: pointsOf(route), short: true } : null));

  async function pick(e) {
    msg = '';
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    if (f.size > GPX_MAX_MB * 1024 * 1024) return (msg = t('This file is too big for a GPX route (more than {mb} MB).', { mb: GPX_MAX_MB }));
    try {
      const g = parseGpx(await f.text());
      if ((g.points?.length ?? 0) < 2) throw new Error('few');
      file = { name: g.name || f.name.replace(/\.gpx$/i, ''), points: g.points };
    } catch {
      msg = t('This is not a GPX file with a route.');
    }
  }
  function save(kind) {
    const s = src;
    if (!s) return;
    const data = kind === 'fit' ? toFit(s.points, s.name) : kind === 'kml' ? toKml(s.points, s.name) : toGpx(s.points, s.name);
    const type = kind === 'fit' ? 'application/vnd.ant.fit' : kind === 'kml' ? 'application/vnd.google-earth.kml+xml' : 'application/gpx+xml';
    const url = URL.createObjectURL(new Blob([data], { type }));
    const a = Object.assign(document.createElement('a'), { href: url, download: fileName(s.name, kind) });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    msg = t('Saved: {file}', { file: fileName(s.name, kind) });
  }
</script>

<div class="uw-conv" data-umwandeln>
  <label class="btn sm pickf"><FileUp size={16} aria-hidden="true" />{t('Choose GPX file')}<input type="file" accept=".gpx,application/gpx+xml" onchange={pick} /></label>
  {#if src}
    <p class="tp-small">{t('{name} · {n} points', { name: src.name, n: num(src.points.length) })}{#if src.short}<br /><span class="tp-muted">{t('The route of this trip, as the app keeps it (shortened). For all points choose the GPX file.')}</span>{/if}</p>
    <div class="uw-row">
      <button type="button" class="btn" onclick={() => save('fit')} data-conv="fit"><Download size={16} aria-hidden="true" />FIT</button>
      <button type="button" class="btn" onclick={() => save('kml')} data-conv="kml"><Download size={16} aria-hidden="true" />KML</button>
      <button type="button" class="btn" onclick={() => save('gpx')} data-conv="gpx"><Download size={16} aria-hidden="true" />GPX</button>
    </div>
    <p class="uw-fine">{t('FIT: a course for Garmin (copy it to the device or open it in Garmin Connect). KML: Google Earth and many maps.')}</p>
  {:else}
    <p class="tp-small tp-muted">{t('Choose a GPX file; it is converted on this device.')}</p>
  {/if}
  {#if msg}<p class="tp-small" role="status">{msg}</p>{/if}
</div>

<style>
  .uw-conv {
    display: grid;
    gap: 8px;
  }
  .pickf {
    position: relative;
    justify-self: start;
    cursor: pointer;
  }
  .pickf input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
</style>
