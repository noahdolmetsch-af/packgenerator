<script>
  /**
   * «Heute als Begleiter» PR 4 (Noah 28.10.2026 «1a 2a 3a»): «Your moment». Names the moment you are in (packing, on
   * the way, back home …), the trip it is about, the five steps of the trip loop and one next step. Only a suggestion:
   * move it, resize it or take it away under «Customise the start page». The logic is in moment.js and momentcard.js.
   */
  import { Route, Check } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { momentOf } from '../moment.js';
  import { momentName, stepFor, whenOf, stripOf } from './momentcard.js';
  import { switchTrip } from '../nav.js';
  import TileHead from './TileHead.svelte';

  let { today, hour = 12, weekday = 3, trips = [], debriefDone = () => false, careDue = 0, inbox = 0, isnew = false } = $props();
  const now = $derived(momentOf({ today, hour, weekday, trips, debriefDone, careDue, inbox }));
  const step = $derived(stepFor(now.key, now.trip, { inbox }));
  const when = $derived(whenOf(now.trip, today));
  const strip = $derived(stripOf(now.key));
  function go(e) {
    // a step that needs its trip makes it the current one first
    if (!step.trip) return;
    e.preventDefault();
    switchTrip(step.trip, step.href);
  }
</script>

<section class="mo surf" aria-labelledby="mo-h" data-section="moment" data-moment={now.key}>
  <TileHead icon={Route} id="mo-h" title={t('Your moment: {name}', { name: t(momentName(now.key)) })} {isnew} />
  {#if now.trip}
    <p class="trip" data-moment-trip><b>{now.trip.title}</b>{#if when}{" "}<span class="when">· {t(when.key, when.vars)}</span>{/if}</p>
  {/if}
  {#if strip}
    <ol class="strip" aria-label={t('The steps of a trip')}>
      {#each strip as s (s.key)}
        <li class={s.state} aria-current={s.state === 'now' ? 'step' : undefined}>{#if s.state === 'done'}<Check size={12} aria-hidden="true" />{/if}{t(s.name)}</li>
      {/each}
    </ol>
  {/if}
  <p class="act"><a class="btn hi" href={step.href} onclick={go} data-moment-step>{t(step.label)}</a></p>
  <p class="why">{t('Today shows the moment you are in. Move or remove this card under «Customise the start page».')}</p>
</section>

<style>
  .mo {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .trip {
    margin: 0;
    color: var(--ink);
    font-size: var(--fs-body);
  }
  .when {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .strip {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .strip li {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: var(--fs-small);
    background: var(--line);
    color: var(--ink-2);
  }
  .strip li.done {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .strip li.now {
    background: var(--hi);
    color: var(--hi-ink);
    font-weight: 600;
  }
  .act {
    margin: 4px 0 0;
  }
  .why {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
