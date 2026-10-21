<script>
  /**
   * Training › «FTP» (Strava check 21.10.2026: the estimate of 180 W was far from the 255 W on Strava): which FTP
   * the app uses for IF, TSS, the power zones and the load, where it comes from, and a field to type an own one.
   * Own first, then the FTP of the Strava profile, else the estimate from the best 20 minutes.
   * est: the estimate (watts or null), to show what it would be.
   */
  import { t } from '../i18n.svelte.js';
  import { fixedFtp, ftpSource } from './ftpstate.js';
  import { ftpFixed, saveOwnFtp, FTP_MIN, FTP_MAX } from './ftp.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import Sec from '../flow/kit/Sec.svelte';

  let { est = null } = $props();
  let editing = $state(false);
  let draft = $state('');
  let err = $state('');

  const used = $derived(fixedFtp() ?? est);
  const src = $derived(ftpSource());
  const sub = $derived(src === 'own' ? t('your own FTP') : src === 'strava' ? t('from your Strava profile') : est ? t('estimated: 95 % of your best 20 minutes') : t('no FTP yet'));
  function start() {
    draft = String(used ?? '');
    err = '';
    editing = true;
  }
  async function keep(e) {
    e.preventDefault();
    const before = ftpFixed.own;
    if (!(await saveOwnFtp(draft))) {
      err = t('A whole number of watts between {a} and {b}.', { a: FTP_MIN, b: FTP_MAX });
      return;
    }
    editing = false;
    offerDone(t('FTP saved.'), () => saveOwnFtp(before ?? null));
  }
  async function back() {
    const before = ftpFixed.own;
    await saveOwnFtp(null);
    editing = false;
    offerDone(t('Own FTP removed.'), () => saveOwnFtp(before ?? null));
  }
</script>

<Sec id="ftp-h" title={t('FTP')} {sub} more={editing ? null : { label: t('change'), onclick: start }}>
  <div class="card fc" data-section="ftp">
    {#if editing}
      <form onsubmit={keep}>
        <p class="hint">{t('The power you can hold for about an hour, in watts. IF, TSS, the power zones and the load use it.')}</p>
        <label class="fl"><span>{t('FTP (W)')}</span><input class="inp num" type="number" inputmode="numeric" min={FTP_MIN} max={FTP_MAX} bind:value={draft} data-ftp-input /></label>
        {#if err}<p class="err" role="alert">{err}</p>{/if}
        <div class="acts">
          <button type="submit" class="btn hi" data-ftp-save>{t('Save')}</button>
          {#if ftpFixed.own}<button type="button" class="btn" onclick={back} data-ftp-back>{ftpFixed.strava ? t('As in Strava') : t('Estimate again')}</button>{/if}
          <button type="button" class="btn btn-link" onclick={() => (editing = false)}>{t('Cancel')}</button>
        </div>
      </form>
    {:else}
      <p class="fv"><b class="num" data-ftp-used>{used ? `${used} W` : '–'}</b>{#if src !== 'estimate' && est}<small>{t('estimate from your rides: {n} W', { n: est })}</small>{/if}{#if src === 'own' && ftpFixed.strava}<small>{t('Strava: {n} W', { n: ftpFixed.strava })}</small>{/if}</p>
    {/if}
  </div>
</Sec>

<style>
  .fc {
    padding: 14px 20px;
  }
  .fv {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 16px;
    margin: 0;
  }
  .fv b {
    font-size: var(--fs-section);
  }
  .fv small,
  .hint {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint {
    margin: 0 0 10px;
  }
  .fl {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 200px;
    margin-bottom: 12px;
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .err {
    color: var(--bad);
  }
</style>
