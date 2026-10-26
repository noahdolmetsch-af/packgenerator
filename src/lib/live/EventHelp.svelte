<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «4», mockup G5, «3a»): «I need help» in the group. The whole
   * group sees at once who needs help, what is wrong, where (km, the way there) and since when; a new call
   * rings and vibrates on every phone of the group (as long as the page is open). «It is sorted» takes it away.
   * In an emergency the SOS button of the live map (112, Rega 1414) comes first; this is for the group.
   * calls: helpCalls() of event.js; mine: my own call or null; onsend(help | null).
   */
  import { untrack } from 'svelte';
  import { LifeBuoy, Check, Navigation } from '@lucide/svelte';
  import { t, num } from '../i18n.svelte.js';
  import { HELP_KINDS, kindOf, helpKey, TEXT_MAX } from './event.js';
  import { minutesAgo } from './group.js';
  import { navLinks } from './live-lib.js';
  import './event.css';

  let { calls = [], mine = null, now = Date.now(), onsend = null, canSend = true, show = 'both' } = $props();
  // show: 'alerts' (the calls of the others, on top of a page), 'form' (my own call) or 'both'

  /* a new call of someone else: a sound and a vibration, once per call */
  const heard = new Set();
  $effect(() => {
    if (show === 'form') return;
    const keys = calls.map(helpKey);
    untrack(() => {
      const fresh = keys.filter((k) => !heard.has(k));
      keys.forEach((k) => heard.add(k));
      // what was already there when the page opened rings too: someone needs help now
      if (fresh.length) ring();
    });
  });
  function ring() {
    try {
      navigator.vibrate?.([400, 200, 400, 200, 400]);
    } catch {
      /* no vibration */
    }
    try {
      const A = window.AudioContext ?? window.webkitAudioContext;
      if (!A) return;
      const ctx = new A();
      [0, 0.35, 0.7].forEach((at) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.25, ctx.currentTime + at);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.3);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + at);
        o.stop(ctx.currentTime + at + 0.3);
      });
      setTimeout(() => ctx.close?.(), 1500);
    } catch {
      /* no sound in this browser */
    }
  }

  let open = $state(false);
  let kind = $state('flat');
  let text = $state('');
  let busy = $state(false);
  async function send() {
    busy = true;
    await onsend?.({ kind, text: text.trim().slice(0, TEXT_MAX), at: new Date().toISOString() });
    busy = false;
    open = false;
    text = '';
  }
  async function sorted() {
    busy = true;
    await onsend?.(null);
    busy = false;
  }
  const ago = (at) => {
    const n = minutesAgo(at, now);
    return n < 1 ? t('just now') : t('{n} min ago', { n });
  };
  const where = (c) => [c.km != null ? t('km {km}', { km: num(c.km) }) : '', c.gap != null ? (c.gap > 0 ? t('{km} km ahead of you', { km: num(c.gap) }) : t('{km} km behind you', { km: num(-c.gap) })) : '', ago(c.at)].filter(Boolean).join(' · ');
</script>

{#if show !== 'form'}
{#each calls as c (helpKey(c))}
  {@const k = kindOf(HELP_KINDS, c.kind)}
  <div class="ev-alert" role="alert" data-event-help-alert>
    <LifeBuoy size={22} aria-hidden="true" />
    <span class="ev-txt">
      <b class="ev-bad-t">{t('{name} needs help', { name: c.name || t('Without a name') })}</b>
      <small>{k.icon} {t(k.label)}{c.text ? ` · «${c.text}»` : ''} · {where(c)}</small>
    </span>
    {#if c.pos}<a class="btn sm" href={navLinks({ lat: c.pos[0], lon: c.pos[1] }).google} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" />{t('Navigate')}</a>{/if}
  </div>
{/each}

{/if}

{#if show !== 'alerts'}
<section class="card ev-box" aria-labelledby="eh-h" data-event-help>
  <h2 id="eh-h">{t('I need help')}</h2>
  {#if mine}
    {@const k = kindOf(HELP_KINDS, mine.kind)}
    <p class="ev-strong" role="status" data-event-help-mine>{t('The group sees your call: {what}', { what: `${k.icon} ${t(k.label)}${mine.text ? ` · «${mine.text}»` : ''}` })} · {ago(mine.at)}</p>
    <div><button type="button" class="btn" onclick={sorted} disabled={busy} data-event-help-done><Check size={18} aria-hidden="true" />{t('It is sorted')}</button></div>
  {:else if open}
    <p class="ev-muted">{t('The whole group sees your location and your message at once, with a sound.')}</p>
    <div class="ev-chips" role="group" aria-label={t('What is wrong?')}>
      {#each HELP_KINDS as k (k.key)}
        <button type="button" class="ev-chip" aria-pressed={kind === k.key} onclick={() => (kind = k.key)} data-event-help-kind={k.key}>{k.icon} {t(k.label)}</button>
      {/each}
    </div>
    <label class="ev-fld"><span>{t('Short message (optional)')}</span><input type="text" bind:value={text} maxlength={TEXT_MAX} data-event-help-text /></label>
    <div class="ev-acts">
      <button type="button" class="btn ev-bad" onclick={send} disabled={busy || !canSend} data-event-help-send><LifeBuoy size={18} aria-hidden="true" />{t('Send to the group')}</button>
      <button type="button" class="btn" onclick={() => (open = false)}>{t('Cancel')}</button>
    </div>
    <p class="ev-muted">{t('In an emergency call 112 or the Rega 1414 first: the «SOS» button on the live map.')}</p>
  {:else}
    <p class="ev-muted">{t('A flat without a tube, a broken part, a fall: the others see where you are and who has what you need.')}</p>
    <div><button type="button" class="btn" onclick={() => (open = true)} disabled={!canSend} data-event-help-open><LifeBuoy size={18} aria-hidden="true" />{t('I need help')}</button></div>
    {#if !canSend}<p class="ev-muted">{t('Write your name and share first, so the others know who needs help.')}</p>{/if}
  {/if}
</section>
{/if}
