<script>
  /**
   * «The app also reacts in Packen» (ideas C2 and C3 of «App denkt mit», Noah 03.11.2026 «unbedingt»): two hints show only in
   * their situation in Packen (the forecast turned; one bike fits the trip clearly better). This card on «How the app
   * decides» names them all the time, says when they show, and jumps to Packen.
   */
  import { CloudSun, Bike } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  const ROWS = [
    { id: 'f.wxturn', Icon: CloudSun, title: 'Weather turned: what changes', text: 'When the forecast says something else than the list is packed for, the notice in Packen says what to add and what can stay at home.' },
    { id: 'f.bikefit', Icon: Bike, title: 'Which bike fits the trip', text: 'The bike comparison names the bike that fits this trip best: bags with room, no care due before the start, the lightest on a climbing route.' },
  ];
</script>

<section class="card dm" aria-labelledby="dm-h" data-denkt-mit>
  <h2 id="dm-h">{t('The app also reacts in Packen')}</h2>
  <p class="quiet">{t('These two hints show only when they apply. Both are only suggestions; nothing changes until you tap.')}</p>
  <ul>
    {#each ROWS as r (r.id)}
      <li data-denkt-row={r.id}>
        <span class="ic"><r.Icon size={18} aria-hidden="true" /></span>
        <span><b>{t(r.title)}</b><small>{t(r.text)}</small></span>
      </li>
    {/each}
  </ul>
  <a class="btn sm quiet" href="#/pack">{t('Open Packen')}</a>
</section>

<style>
  .dm {
    margin: 0 0 14px;
    padding: 14px 16px;
  }
  h2 {
    margin: 0 0 6px;
    font-size: var(--fs-section);
  }
  .quiet {
    color: var(--ink-2);
    font-size: var(--fs-small);
    margin: 0 0 8px;
  }
  ul {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
  }
  li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  li:first-child {
    border-top: 0;
  }
  small {
    display: block;
    color: var(--ink-2);
  }
  .ic {
    color: var(--ink-2);
  }
</style>
