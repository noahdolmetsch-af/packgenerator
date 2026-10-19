<script>
  /**
   * Mockup G1 (approved by Noah 13.10.2026 17:03 «g1-g2 freigeben», built in today's look): the page
   * «Fitbit» under Ich › Daten und Backup (#/me/fitbit). How the values come into the app (three steps),
   * «Mit Google verbinden», which values, and the past from the Fitbit file. Once connected, the card
   * «Gesundheitsdaten» (G2) takes the place of the button. Observation only, everything can be switched off.
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import HealthCard from '../lib/health/HealthCard.svelte';
  import { health, connect, DATA_HASH, STRAVA_HASH } from '../lib/health/client.svelte.js';
  import { readKey } from '../lib/strava/client.svelte.js';
  import { Link, Lock, Moon, HeartPulse, Footprints, Activity, FileText, ChevronRight, ArrowRight } from '@lucide/svelte';
  import { phone } from '../lib/media.svelte.js';
  import '../lib/ich/ich.css';
  import { t } from '../lib/i18n.svelte.js';

  const hasKey = readKey();
  const STEPS = [
    ['Your Fitbit watch', 'Measures as always. You change nothing.'],
    ['Google', 'Keeps the values of your watch. The app only reads them.'],
    ['Pack Generator', 'Fetches what is new when it opens. Stored only on your device.'],
  ];
  const VALUES = [
    [Moon, 'Sleep|fitbit', 'Duration, deep and REM sleep, falling asleep and waking up'],
    [HeartPulse, 'Resting heart rate and HRV', 'every morning, beside your normal (30 days)'],
    [Footprints, 'Steps', 'only from the watch, not twice with the phone'],
    [Activity, 'Active zone minutes', 'per day and per week'],
  ];
  const errorText = (code) =>
    ({
      denied: t('The Google login was cancelled. Nothing changed.'),
      expired: t('The login took too long. Try again.'),
      scope: t('Google gave no access to the values. Try again and tick the values.'),
      unauthorized: t('This device has no key yet: connect Strava on this device first.'),
      not_set_up: t('Google is not set up on the server yet.'),
      network: t('No connection. Try again later.'),
    })[code] ?? t('Google answered with an error. Try again later.');
</script>

<div class="fitbitpage">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Data and backup'), href: DATA_HASH }]} here="Fitbit" title={t('Connect Fitbit')} sub={t('So that sleep, resting heart rate, HRV, steps and active zones come into the app every day by themselves. Voluntary, you can disconnect at any time.')} />
  <div class="ich-cols">
    <div class="ich-main">
      {#if health.prefs.connected}
        <HealthCard />
      {:else}
        <section class="ich-sec" aria-labelledby="how-h">
          <div class="ich-h"><div><h2 id="how-h">{t('How your values come into the app')}</h2><p class="ich-hs">{t('three steps, you tap only once')}</p></div></div>
          <ol class="card ich-body steps" class:col={phone.matches}>
            {#each STEPS as [name, line], i (name)}
              {#if i}<li class="arrow" aria-hidden="true"><ArrowRight size={16} /></li>{/if}
              <li class="step"><span class="n">{i + 1}</span><b>{name === 'Pack Generator' ? name : t(name)}</b><span>{t(line)}</span></li>
            {/each}
          </ol>
        </section>
        <div class="card ich-body">
          {#if hasKey}
            <button type="button" class="btn hi big wide" onclick={() => connect()}><Link size={16} aria-hidden="true" />{t('Connect with Google')}</button>
          {:else}
            <p class="ich-help">{t('First connect Strava on this device: Strava gives this device the key the Fitbit connection uses too.')}</p>
            <a class="btn hi big wide" href={STRAVA_HASH}>{t('Connect Strava first')}</a>
          {/if}
          {#if health.error}<p class="err" role="status">{errorText(health.error)}</p>{/if}
          <p class="note"><Lock size={14} aria-hidden="true" /><span><b>{t('Only these 5 values, read only. Disconnect at any time.')}</b> {t('The server stores no values. The first time Google says «unverified app»: that is normal and free.')}</span></p>
        </div>
      {/if}
    </div>
    <div class="ich-side">
      <section class="ich-sec" aria-labelledby="which-h">
        <div class="ich-h"><div><h2 id="which-h">{t('Which values')}</h2><p class="ich-hs">{t('as observation only, each one can be switched off')}</p></div></div>
        <ul class="card ich-list">
          {#each VALUES as [Icon, name, line] (name)}
            <li class="ich-row"><span class="ich-ib"><Icon size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(name)}</b><small>{t(line)}</small></span></li>
          {/each}
        </ul>
      </section>
      <section class="ich-sec" aria-labelledby="more-h">
        <div class="ich-h"><div><h2 id="more-h">{t('More|fitbit')}</h2></div></div>
        <ul class="card ich-list">
          <li><a class="ich-row" href={DATA_HASH}><span class="ich-ib"><FileText size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('The past from your Fitbit file')}</b><small>{health.first?.src === 'file' ? t('imported: from {year}', { year: health.first.date.slice(0, 4) }) : t('once: Data and backup › Import backup › Merge')}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></a></li>
        </ul>
      </section>
    </div>
  </div>
</div>

<style>
  .fitbitpage {
    max-width: 1100px;
    min-width: 0;
  }
  .steps {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    align-items: stretch;
    gap: 8px;
    margin: 0;
    list-style: none;
  }
  .steps.col {
    grid-template-columns: 1fr;
  }
  .steps.col .arrow {
    transform: rotate(90deg);
  }
  .step {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .step b {
    color: var(--ink);
    font-size: var(--fs-body);
  }
  .n {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--hi);
    color: var(--hi-ink);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .arrow {
    display: grid;
    place-items: center;
    color: var(--ink-3);
  }
  .wide {
    width: 100%;
    justify-content: center;
  }
  .note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .note :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  .note b {
    color: var(--ink);
  }
  .err {
    margin: 10px 0 0;
    font-size: var(--fs-small);
  }
</style>
