<script>
  /**
   * SN2+ SN2i «Deine Pulszonen» (mockup approved 13.10.2026): the five zones as one bar and one row each,
   * where they come from, and «Zonen ändern» (four upper bounds, or back to the standard from your highest
   * heart rate). zones: actdata.js zonesOf(); onsave(bounds | null).
   */
  import { t, num } from '../i18n.svelte.js';
  import { zoneRows, validBounds } from '../review/werte.js';
  import '../review/zones.css';

  let { zones = null, onsave } = $props();
  const rows = $derived(zones ? zoneRows(zones.bounds) : []);
  let edit = $state(false);
  let draft = $state(['', '', '', '']);
  let err = $state('');
  function open() {
    draft = zones ? zones.bounds.map(String) : ['', '', '', ''];
    err = '';
    edit = true;
  }
  async function save(event) {
    event.preventDefault();
    const b = draft.map((v) => Number(v));
    if (!validBounds(b)) return (err = t('Four rising numbers, one for the top of Z1 to Z4.'));
    await onsave?.(b);
    edit = false;
  }
  async function standard() {
    await onsave?.(null);
    edit = false;
  }
  const range = (r) => (r.from == null ? t('up to {n} bpm', { n: num(r.to) }) : r.to == null ? t('from {n} bpm', { n: num(r.from) }) : `${num(r.from)}–${num(r.to)} ${t('bpm')}`);
</script>

<section class="rv-sec hz" aria-labelledby="hz-h" data-zones>
  <div class="rv-h"><div><h2 id="hz-h">{t('Your heart rate zones')}</h2><p class="rv-sub">{zones?.source === 'own' ? t('entered by you') : zones ? t('standard from your highest heart rate, {n} bpm', { n: num(zones.max) }) : t('from Strava, or you enter them yourself')}</p></div></div>
  <div class="rv-box pad">
    {#if rows.length}
      <div class="zb" aria-hidden="true">{#each rows as r (r.z)}<i class="zc-{r.z}"></i>{/each}</div>
      <ul class="zr">
        {#each rows as r (r.z)}<li><i class="zc-{r.z}" aria-hidden="true"></i><b>Z{r.z}</b><span class="num">{range(r)}</span></li>{/each}
      </ul>
    {:else if !edit}
      <p class="none">{t('No heart rate yet. Rides from Strava bring it.')}</p>
    {/if}
    {#if edit}
      <form class="ze" onsubmit={save}>
        {#each [0, 1, 2, 3] as i (i)}
          <label><span>{t('Z{n} up to', { n: i + 1 })}</span><input class="inp num" type="number" inputmode="numeric" min="60" max="230" bind:value={draft[i]} /></label>
        {/each}
        {#if err}<p class="err" role="alert">{err}</p>{/if}
        <div class="za">
          <button type="submit" class="btn hi">{t('Save')}</button>
          <button type="button" class="btn" onclick={() => (edit = false)}>{t('Cancel')}</button>
          {#if zones?.source === 'own'}<button type="button" class="btn quiet" onclick={standard}>{t('Back to the standard zones')}</button>{/if}
        </div>
      </form>
    {:else}
      <button type="button" class="btn ch" onclick={open}>{t('Change zones')}</button>
    {/if}
  </div>
</section>

<style>
  .zb {
    display: flex;
    gap: 2px;
    height: 14px;
    border-radius: 7px;
    overflow: hidden;
  }
  .zb i {
    flex: 1;
  }
  .zr {
    list-style: none;
    margin: 8px 0 12px;
    padding: 0;
  }
  .zr li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 36px;
  }
  .zr li + li {
    border-top: 1px solid var(--line);
  }
  .zr i {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  .zr b {
    width: 2em;
  }
  .none {
    margin: 0 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ze {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .ze label {
    display: grid;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .ze .inp {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .za {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .err {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .quiet {
    border-color: transparent;
    background: none;
    text-decoration: underline;
  }
</style>
