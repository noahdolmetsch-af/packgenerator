<script>
  /**
   * Paket B part 3, UC-162-I2 «Kostenrahmen»: in the workshop order, how much the shop may spend and
   * whether it should call first. Kept per bike (settings 'werkstatt'), so the next order has it again.
   * The order message gets one line (werkstatt.js withLimit); it is a wish, not a contract.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { changeSetting } from '../griffdb.js';
  import { t } from '../i18n.svelte.js';
  import { WERKSTATT_KEY, chfOf } from './werkstatt.js';

  let { bikeId, wish = $bindable({}) } = $props();
  const q = liveQuery(() => db.settings.get(WERKSTATT_KEY));
  $effect(() => {
    wish = $q?.value?.[bikeId] ?? {};
  });
  let err = $state('');
  const save = (patch) => changeSetting(WERKSTATT_KEY, {}, (all) => ({ ...(all ?? {}), [bikeId]: { ...((all ?? {})[bikeId] ?? {}), ...patch } }));
  function setLimit(text) {
    const s = text.trim();
    if (s && chfOf(s) == null) return (err = t('Type the francs as a number, e.g. 250.'));
    err = '';
    save({ limit: s ? chfOf(s) : null });
  }
</script>

<div class="cl" data-cost-limit>
  <label class="cl-n"><span>{t('At most CHF')}</span><input class="inp num" type="text" inputmode="decimal" maxlength="8" placeholder={t('no limit')} value={wish.limit ?? ''} onchange={(e) => setLimit(e.currentTarget.value)} data-cost-limit-chf /></label>
  <label class="cl-c"><input type="checkbox" checked={!!wish.call} onchange={(e) => save({ call: e.currentTarget.checked })} data-cost-limit-call /><span>{t('Call me first if it costs more or something comes up')}</span></label>
  {#if err}<p class="cl-err" role="alert">{err}</p>{:else}<p class="cl-hint">{t('Goes into the message as a wish. The shop decides with you, not the app.')}</p>{/if}
</div>

<style>
  .cl {
    display: grid;
    gap: 6px;
    margin: 12px 0 0;
  }
  .cl label {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .cl-n .inp {
    width: 110px;
  }
  .cl-c input {
    width: 20px;
    height: 20px;
    margin: 0;
    flex: none;
  }
  .cl-hint,
  .cl-err {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .cl-err {
    color: var(--bad);
  }
</style>
