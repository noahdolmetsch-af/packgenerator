<script>
  /**
   * «Eigene Werte anpassbar» (Noah 21.10.2026 «1 a und b 2 a»): the window of one value on Ich › Eigene Werte.
   * A built-in value (field): its name (empty = the Standard name) and «Delete» (hidden; the app counts with
   * its Standard; «Deleted values» brings it back). An own reminder (mine, or null for a new one): name,
   * «every N km / N days» and for which bike; «Delete» with Undo (OwnValues.svelte).
   * onsave(patch): { name } for a field, { name, every, unit, bike } for a reminder.
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { MINE_RANGE } from '../ownvalues.js';
  import Seg from '../ui/Seg.svelte';
  import { t } from '../i18n.svelte.js';
  import { X, Check, Trash2, Lightbulb } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { field = null, mine = null, name: nameIn = '', bikes = [], onsave, onremove = null, onclose } = $props();
  const isField = $derived(!!field);

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  // svelte-ignore state_referenced_locally
  let name = $state(field ? nameIn : (mine?.name ?? ''));
  // svelte-ignore state_referenced_locally
  let every = $state(String(mine?.every ?? 14));
  // svelte-ignore state_referenced_locally
  let unit = $state(mine?.unit ?? 'days');
  // svelte-ignore state_referenced_locally
  let bike = $state(mine?.bike ?? '');
  let msg = $state('');

  function save(event) {
    event.preventDefault();
    const n = name.trim();
    if (isField) {
      onsave?.({ name: n === t(field.name) ? '' : n });
      return dialog.close();
    }
    if (!n) return (msg = t('Give the reminder a name.'));
    const [lo, hi] = MINE_RANGE[unit];
    const v = Math.round(Number(String(every).trim().replace(/['’\s]/g, '').replace(',', '.')));
    if (!Number.isFinite(v) || v < lo || v > hi) return (msg = t('A number from {lo} to {hi}.', { lo, hi }));
    onsave?.({ name: n, every: v, unit, bike: bike || null });
    dialog.close();
  }
  function remove() {
    onremove?.();
    dialog.close();
  }
</script>

<dialog use:keepTyped={'ownvalue:' + (field?.key ?? mine?.id ?? 'new')} class="sheet vdlg ovs" bind:this={dialog} use:backClose {onclose} aria-labelledby="ovs-h">
  <div class="vd-head">
    <div class="vd-t"><h2 id="ovs-h">{isField ? t('Edit value') : mine ? t('Edit reminder') : t('Own reminder')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <form onsubmit={save}>
    <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={name} autocomplete="off" maxlength="60" placeholder={isField ? t(field.name) : t('e.g. Check the tyre pressure')} data-ovs-name /></label>
    {#if isField}
      <p class="vd-note"><Lightbulb size={16} aria-hidden="true" /><span>{t('Standard name: «{name}». Empty brings it back.', { name: t(field.name) })}</span></p>
    {:else}
      <div class="fld">
        <span class="lbl" id="ovs-every">{t('Every')}</span>
        <div class="row">
          <input class="inp num ev" inputmode="numeric" aria-labelledby="ovs-every" bind:value={every} data-ovs-every />
          <Seg options={[{ key: 'days', name: t('days') }, { key: 'km', name: 'km' }]} value={unit} onchange={(u) => (unit = u)} label={t('Unit')} />
        </div>
      </div>
      <label class="fld">
        <span class="lbl">{t('For which bike')}</span>
        <select class="sel" bind:value={bike} data-ovs-bike>
          <option value="">{t('All bikes, each on its own')}</option>
          {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
        </select>
      </label>
      <p class="hint">{t('The reminder shows in Bikes › Care on the page of the bike. «Done» starts it again.')}</p>
    {/if}
    {#if msg}<p class="msg" role="alert">{msg}</p>{/if}

    <div class="vd-foot">
      {#if onremove}<button type="button" class="btn del" onclick={remove} data-ovs-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>{/if}
      <button type="submit" class="btn hi" data-ovs-save><Check size={16} aria-hidden="true" />{t('Save')}</button>
    </div>
    {#if isField && onremove}<p class="warn">{t('Delete: the app then counts with the Standard again. «Deleted values» at the end of the page brings it back.')}</p>{/if}
  </form>
</dialog>

<style>
  .fld {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 12px;
  }
  .fld:first-child {
    margin-top: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .ev {
    width: 7em;
  }
  .hint {
    margin: 8px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .msg {
    margin: 10px 0 0;
    font-size: var(--fs-small);
  }
  .del {
    color: var(--bad);
  }
  .warn {
    margin: 12px 0 0;
    padding: 10px 14px;
    border-radius: var(--r-ctl);
    background: var(--bad-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
</style>
