<script>
  /**
   * Garmin-Übersicht «Aktivitäten von heute» (screenshot 1): one card per activity of today with its
   * name, the distance big, the time and the mean power (or pulse), the small route shape. A tap opens
   * the activity (Aktiv › Training).
   */
  import RouteShape from './RouteShape.svelte';
  import { SPORT_ICON, hms, km2 } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { acts = [] } = $props();
  const line = (a) =>
    [a.movingS ? hms(a.movingS) : '', a.wDevice && a.wAvg ? t('{n} W avg power', { n: num(Math.round(a.wAvg)) }) : a.hrAvg ? t('{n} bpm avg pulse', { n: num(Math.round(a.hrAvg)) }) : ''].filter(Boolean).join(' · ');
</script>

<ul class="ta" data-today-acts>
  {#each acts as a (a.id)}
    {@const I = SPORT_ICON[a.kind] ?? SPORT_ICON.other}
    <li>
      <a class="card tc" href="#/flow/training/a/{encodeURIComponent(a.id)}" data-today-act={a.id}>
        <span class="tx">
          <span class="nm">{a.name || t('Activity')}</span>
          <span class="row">
            <span class="ic k-{a.kind}" aria-hidden="true"><I size={22} /></span>
            <span class="vals">
              <b class="num">{a.km ? `${km2(a.km)} km` : hms(a.movingS)}</b>
              {#if line(a)}<small class="num">{line(a)}</small>{/if}
            </span>
          </span>
        </span>
        <RouteShape line={a.line} />
      </a>
    </li>
  {/each}
</ul>

<style>
  .ta {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tc {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    color: var(--ink);
    text-decoration: none;
  }
  .tc:hover {
    background: var(--paper-2);
  }
  .tx {
    display: grid;
    flex: 1;
    gap: 8px;
    min-width: 0;
  }
  .nm {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--hi);
    color: var(--hi-ink);
  }
  .vals {
    display: grid;
    min-width: 0;
  }
  .vals b {
    font: 700 var(--fs-title) / 1.15 var(--font-body);
  }
  .vals small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
