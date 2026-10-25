<script>
  /**
   * «Meilensteine als Belohnung» (Noah 22.10.2026 «5a»): the box «So funktionieren Meilensteine» in three
   * steps (tick, count, star), foldable. Open at first on the milestones page, folded on a sport page; the
   * choice is kept on this device. sport: the sport's name for step 1, or '' for every sport.
   */
  import { t } from '../../i18n.svelte.js';

  let { sport = '', start = true } = $props();
  const KEY = 'ms.how.open';
  const read = () => {
    try {
      const v = localStorage.getItem(KEY);
      return v == null ? start : v === '1';
    } catch {
      return start;
    }
  };
  let open = $state(read());
  const keep = () => {
    try {
      localStorage.setItem(KEY, open ? '1' : '0');
    } catch {
      /* private mode: only for this page */
    }
  };
</script>

<details class="ms-how" bind:open ontoggle={keep} data-ms-how>
  <summary>{t('How milestones work')}</summary>
  <ol>
    <li><b>{t('1. Tick')}</b><span>{sport ? t('You tick «{sport}» on Heute or in Aktiv.', { sport }) : t('You tick a sport on Heute or in Aktiv.')}</span></li>
    <li><b>{t('2. Count')}</b><span>{t('Every tick counts 1 in the counters of that sport, also a second one on the same day.')}</span></li>
    <li><b>{t('3. Star')}</b><span>{t('At each step there is a star, right after the tick. It stays, even when a series breaks.')}</span></li>
  </ol>
  <p>{t('Every card says what counts. Challenges count the same ticks. All numbers are suggestions: «Change stages» sets your own or hides a counter.')}</p>
</details>

<style>
  .ms-how {
    padding: 0 14px 4px;
    border-radius: 10px;
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    cursor: pointer;
    font-weight: 600;
    font-size: var(--fs-body);
  }
  ol {
    margin: 10px 0 6px;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
  }
  li {
    display: grid;
    gap: 2px;
  }
  p {
    margin: 0;
    color: var(--ink-2);
  }
</style>
