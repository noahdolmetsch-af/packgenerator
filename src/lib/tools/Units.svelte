<script>
  /**
   * Paket L «Werkzeugkasten» (#7 Masse umrechnen ohne Internet): choose the kind, type a value, see it
   * in every unit of the kind at once. Fixed factors, works offline. The last kind is remembered.
   */
  import Seg from '../ui/Seg.svelte';
  import { UNIT_KINDS, kindOf, convert, roundUnit } from './units.js';
  import { loadTool, saveTool } from './toolstore.js';
  import { t, num } from '../i18n.svelte.js';
  import './tools.css';

  let kind = $state('length');
  let from = $state('km');
  let value = $state('');
  loadTool('units', null).then((u) => u && kindOf(u.kind).units.some((x) => x[0] === u.from) && ((kind = u.kind), (from = u.from)));
  const k = $derived(kindOf(kind));
  function setKind(key) {
    kind = key;
    from = kindOf(key).units[0][0];
    value = '';
    saveTool('units', { kind, from }).catch(() => {});
  }
  function setFrom(u) {
    from = u;
    saveTool('units', { kind, from }).catch(() => {});
  }
</script>

<section class="tool-card units">
  <Seg chips label={t('Kind')} value={kind} options={UNIT_KINDS.map((x) => ({ key: x.key, name: t(x.label) }))} onchange={setKind} />
  <div class="tool-row">
    <label class="tool-field u-val">
      <span>{t('Value')}</span>
      <input class="tool-input" inputmode="decimal" autocomplete="off" bind:value placeholder="0" />
    </label>
    <Seg small label={t('Unit')} value={from} options={k.units.map(([u]) => ({ key: u, name: u }))} onchange={setFrom} />
  </div>
  <ul class="tool-list" aria-live="polite">
    {#each k.units.filter(([u]) => u !== from) as [u] (u)}
      {@const r = roundUnit(convert(kind, value, from, u))}
      <li data-unit={u}><b class="u-num">{r == null ? '–' : num(r)}</b> <span>{u}</span></li>
    {/each}
  </ul>
  {#if kind === 'speed'}<p class="tool-help">{t('min/km is the pace: minutes for one kilometre.')}</p>{/if}
</section>

<style>
  .u-val {
    flex: 1 1 140px;
    max-width: 220px;
  }
  .u-num {
    font-size: var(--fs-section);
    font-variant-numeric: tabular-nums;
  }
</style>
