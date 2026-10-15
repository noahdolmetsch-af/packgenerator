<script>
  /**
   * «Timer» › Zifferblatt (mockup Z3, approved 13.10.2026). #/timer/faces: six faces to choose from
   * (Digital first, Noah 3a), the sound at the end (singing bowl, Noah 4a), which timers a face is for
   * («alle Timer», «nur Pomodoro», «nur Meditation») and the digits. Kept on this device only.
   * «nur Meditation» also sets the clock of the meditation session where it has the same face.
   */
  import { Check } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import Face from '../lib/timer/Face.svelte';
  import { timer, loadPrefs, savePrefs } from '../lib/timer/run.svelte.js';
  import { FACES, SCOPES, END_SOUNDS, FORMATS } from '../lib/timer.js';
  import { CLOCK_KEY, clockPrefOf } from '../lib/flowmed.js';
  import { putSetting } from '../lib/flowdb.js';
  import { playSound, vibrate, wakeSounds } from '../lib/flowsounds.js';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';

  $effect(() => {
    loadPrefs();
  });
  // ?scope=meditation: opened from the meditation page (ME2 «Uhr»)
  const asked = typeof location === 'undefined' ? null : new URLSearchParams(location.hash.split('?')[1] ?? '').get('scope');
  let scope = $state(SCOPES.some((s) => s.id === asked) ? asked : 'all');
  const chosen = $derived(timer.prefs.faces[scope] ?? (scope === 'all' ? 'digital' : null));
  const shown = $derived(chosen ?? timer.prefs.faces.all ?? 'digital');

  async function pick(f) {
    await savePrefs({ faces: { ...timer.prefs.faces, [scope]: f.id } });
    if (scope === 'meditation' && f.med) {
      const rec = await db.settings.get(CLOCK_KEY).catch(() => null);
      await putSetting(db, CLOCK_KEY, clockPrefOf({ ...clockPrefOf(rec?.value), view: f.med }));
    }
  }
  function sound(e) {
    savePrefs({ end: e.id });
    wakeSounds();
    if (e.sound === 'vibrate') vibrate();
    else playSound(e.sound, 0, 0.45);
  }
</script>

<div class="tf">
  <Crumb path={[{ href: '#/', label: t('Today|place') }, { href: '#/timer', label: t('Timer') }]} here={t('Face')} />
  <h1 class="h1" tabindex="-1" data-page-title>{t('Face')}</h1>
  <p class="sub">{t('Choose how the time looks. Each kind can have its own.')}</p>

  <div class="cols">
    <div class="fg" role="radiogroup" aria-label={t('Face')}>
      {#each FACES as f (f.id)}
        <button type="button" role="radio" class="fc" class:on={shown === f.id} aria-checked={shown === f.id} onclick={() => pick(f)} data-face-pick={f.id}>
          <span class="fv"><Face face={f.id} sec={300} frac={0.62} fmt="auto" size="s" label={t(f.label)} /></span>
          <b>{t(f.label)}{#if shown === f.id}<Check size={16} aria-hidden="true" />{/if}</b>
          <small>{t(f.sub)}</small>
        </button>
      {/each}
    </div>

    <section class="surf pad set" aria-labelledby="tf-set">
      <div class="sh"><h2 id="tf-set" class="h2">{t('Settings')}</h2><small>{t('Only on this device')}</small></div>
      <p class="lb" id="tf-end">{t('Sound at the end')}</p>
      <div class="seg" role="radiogroup" aria-labelledby="tf-end">
        {#each END_SOUNDS as e (e.id)}<button type="button" role="radio" class:on={timer.prefs.end === e.id} aria-checked={timer.prefs.end === e.id} onclick={() => sound(e)} data-end={e.id}>{t(e.label)}</button>{/each}
      </div>
      <p class="lb" id="tf-scope">{t('Applies to')}</p>
      <div class="seg" role="radiogroup" aria-labelledby="tf-scope">
        {#each SCOPES as s (s.id)}<button type="button" role="radio" class:on={scope === s.id} aria-checked={scope === s.id} onclick={() => (scope = s.id)} data-scope={s.id}>{t(s.label)}</button>{/each}
      </div>
      {#if scope !== 'all' && !chosen}<p class="sm">{t('Not chosen yet: uses the face of all timers.')}</p>{/if}
      <p class="lb" id="tf-fmt">{t('Digits')}</p>
      <div class="seg" role="radiogroup" aria-labelledby="tf-fmt">
        {#each FORMATS as f (f.id)}<button type="button" role="radio" class:on={timer.prefs.fmt === f.id} aria-checked={timer.prefs.fmt === f.id} onclick={() => savePrefs({ fmt: f.id })} data-fmt={f.id}>{t(f.label)}</button>{/each}
      </div>
    </section>
  </div>
</div>

<style>
  .tf {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 1328px;
    margin: 0 auto;
    min-width: 0;
  }
  .h1 {
    margin: 0;
    font: 800 var(--fs-page)/1.1 var(--font-brand);
  }
  .sub {
    margin: -6px 0 0;
    color: var(--ink-2);
  }
  .h2 {
    margin: 0;
    font: 700 var(--fs-sub)/1.2 var(--font-brand);
  }
  .pad {
    padding: 16px 18px;
    min-width: 0;
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  @media (min-width: 1100px) {
    .cols {
      grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    }
  }
  .fg {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  .fc {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px;
    border: 1px solid var(--card-line);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: center;
    cursor: pointer;
    min-width: 0;
  }
  .fc.on {
    border: 2px solid var(--hi);
    background: var(--hi-soft);
  }
  .fv {
    display: grid;
    place-items: center;
    min-height: 160px;
    width: 100%;
    overflow: hidden;
  }
  .fc b {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
  }
  .fc small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sh {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .sh small,
  .sm {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lb {
    margin: 14px 0 6px;
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .seg {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .seg button {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body)/1.2 var(--font-body);
    cursor: pointer;
  }
  .seg button.on {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
</style>
