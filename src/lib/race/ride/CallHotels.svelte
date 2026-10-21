<script>
  /**
   * Paket U4 · 1139 Hotels spät erreichen: in the afternoon the hotels where you will be in the evening
   * (the next planned night, else 21:00 at your pace), with phone, mail and what the opening hours say
   * when you arrive, plus a ready sentence in the language of the place to call or write. The app never
   * calls or writes by itself: a tap opens your phone or mail app.
   */
  import { Phone, Mail, Copy } from '@lucide/svelte';
  import { eveningTarget, isAfternoon, hotelsToCall, langAt, lateText, telOf, LANG_NAME } from '../sleep.js';
  import { pointAt, hhmm } from '../race.js';
  import { t, num } from '../../i18n.svelte.js';

  let { ctx, now, km, eta = null, kmh = 18 } = $props();
  let early = $state(false);
  let lang = $state('');
  let copied = $state(false);

  const target = $derived(eveningTarget({ plan: ctx.plan, km, now, kmh }));
  const list = $derived(hotelsToCall({ pois: ctx.pois, target, eta, now, kmh, km }));
  const show = $derived(early || isAfternoon(now));
  const spot = $derived(list[0] ?? (ctx.pts.length > 1 ? pointAt(ctx.pts, target.km) : null));
  const local = $derived(spot ? langAt(spot.lat, spot.lon, spot.country) : 'en');
  const use = $derived(lang || local);
  const text = $derived(lateText(use, hhmm(list[0]?.at ?? target.at)));
  const nameOf = (p) => p.name || t('Hotel and hostel');
  const stateText = (p) => (p.open === true ? (p.closes ? t('open when you arrive, closes {time}', { time: p.closes }) : t('open when you arrive')) : p.open === false ? t('probably closed when you arrive: call before') : t('reception hours unknown: call before'));
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = false;
    }
  }
</script>

<div class="ch" data-sleep-call>
  {#if !show}
    <p class="rc-note">{t('From 12:00 the hotels at your evening target show here, so you can call before the reception closes.')}</p>
    <button type="button" class="btn sm" onclick={() => (early = true)} data-sleep-call-now>{t('Show now')}</button>
  {:else}
    <p class="rc-text" data-sleep-target>{target.planned ? t('Your planned night: km {km}, about {time}', { km: num(target.km), time: hhmm(target.at) }) : t('At your pace you are at about km {km} at {time}', { km: num(target.km), time: hhmm(target.at) })}</p>
    {#if list.length}
      <ul class="rc-list">
        {#each list as p (p.id ?? p.km)}
          <li class="rc-row" data-sleep-hotel>
            <span class="rc-row-main">
              <b>{nameOf(p)}</b>
              <small>{t('km {km}', { km: num(Math.round(p.km)) })} · {t('there about {at}', { at: hhmm(p.at) })}</small>
              <small class:rc-warn={p.open !== true} class:rc-ok={p.open === true}>{stateText(p)}</small>
            </span>
            {#if p.phone}<a class="rc-icon" href="tel:{telOf(p.phone)}" aria-label={t('Call {name}', { name: nameOf(p) })} data-sleep-tel><Phone size={18} aria-hidden="true" /></a>{/if}
            {#if p.mail}<a class="rc-icon" href="mailto:{p.mail}?subject={encodeURIComponent('Room tonight / Zimmer heute')}&body={encodeURIComponent(text)}" aria-label={t('Write to {name}', { name: nameOf(p) })}><Mail size={18} aria-hidden="true" /></a>{/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="rc-empty" data-sleep-nohotel>{ctx.pois.length ? t('No hotel known within 15 km of your evening target. Look at the roofs above or move your night.') : t('No places loaded yet. Load them under «Along the route».')}</p>
    {/if}
    <div class="ch-say">
      <p class="rc-note">{t('A sentence for the phone or a message ({lang}):', { lang: LANG_NAME[use] })}</p>
      <blockquote class="ch-text" lang={use} data-sleep-text={use}>{text}</blockquote>
      <div class="rc-acts">
        <button type="button" class="btn sm" onclick={copy} data-sleep-copy><Copy size={16} aria-hidden="true" />{copied ? t('Copied') : t('Copy')}</button>
        {#each Object.keys(LANG_NAME) as l (l)}
          {#if l !== use}<button type="button" class="btn sm" onclick={() => ((lang = l), (copied = false))} data-sleep-lang={l}>{LANG_NAME[l]}</button>{/if}
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .ch {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .ch-say {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .ch-text {
    margin: 0;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
</style>
