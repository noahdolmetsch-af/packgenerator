<script>
  /**
   * «Alles, was du angelegt hast» (Noah 23.11.2026, Thread «Analyse-Seite viel besser machen»): in the week review every activity of
   * Aktiv with its times, also daily habits, sports without a goal and ones with 0 times; the Strava sports without an activity of
   * their own too. It replaces the card «Erholung und Rituale» (its rows stay, now one group of this card). The numbers above
   * (hours, km, sessions) do not change. Only a look back, nothing is rated. The rules are pure (lib/flow/alle-woche.js).
   */
  import { tn, t, num } from '../i18n.svelte.js';
  import { RING_WORDS } from './auswertung/words.js';

  /** week: alleWeek() or alleRange(); names: Map id → shown name; period: a window other than a week (the words say «period»); bare: no card and no title (inside a fold) */
  let { week, names = new Map(), period = false, bare = false } = $props();
  const nameOf = (r) => names.get(r.id) ?? r.id;
  const loose = $derived(week?.loose ?? []);
  const groups = $derived([
    { ring: 'move', set: week?.move, extra: loose },
    { ring: 'rest', set: week?.rest, extra: [] },
  ]);
</script>

{#if week}
  <section class="al" class:card={!bare} class:bare data-alle={period ? 'period' : 'week'} aria-label={t('Everything you created')}>
    {#if !bare}<h2 id="al-h">{t('Everything you created')}</h2>{/if}
    {#each groups as g (g.ring)}
      {#if g.set.shown.length || g.set.quiet.length || g.extra.length}
        <div class="grp" data-alle-group={g.ring} data-rituale={g.ring === 'rest' && !period ? 'week' : undefined}>
          <h3>{g.ring === 'rest' ? t('Rest and rituals') : t(RING_WORDS.move)}</h3>
          <ul>
            {#each g.set.shown as r (r.id)}
              <li data-ritual={g.ring === 'rest' ? r.id : undefined} data-alle-row={r.id}>
                <span class="l">{nameOf(r)}</span>
                <b class="num">{tn(r.n, '{n} time', '{n} times')}</b>
                <small>
                  {#if r.n > 0}{tn(r.days, 'on {n} day', 'on {n} days')}{/if}
                  {#if r.goal != null}{r.n > 0 ? ' · ' : ''}{t('Goal: {n} a week', { n: num(r.goal) })}{/if}
                  {#if r.measuredMin > 0}{' · '}{t('{n} min measured', { n: num(r.measuredMin) })}{/if}
                  {#if r.waiting > 0}{' · '}{t('{n} only from Strava, not counted yet', { n: r.waiting })}{/if}
                </small>
              </li>
            {/each}
            {#each g.extra as r (r.key)}
              <li data-alle-row="strava:{r.key}">
                <span class="l">{t(r.label)}</span>
                <b class="num">{tn(r.n, '{n} time', '{n} times')}</b>
                <small>
                  {t('From Strava, no activity of its own in Active')}
                  {' · '}{tn(r.days, 'on {n} day', 'on {n} days')}
                  {#if r.measuredMin > 0}{' · '}{t('{n} min measured', { n: num(r.measuredMin) })}{/if}
                </small>
              </li>
            {/each}
          </ul>
          {#if g.set.quiet.length}
            <details class="quiet" data-alle-quiet={g.ring}>
              <summary>{period ? tn(g.set.quiet.length, '{n} activity without a time in this period', '{n} activities without a time in this period') : tn(g.set.quiet.length, '{n} activity without a time this week', '{n} activities without a time this week')}</summary>
              <p>{g.set.quiet.map(nameOf).join(', ')}</p>
            </details>
          {/if}
        </div>
      {/if}
    {/each}
    <p class="cap">{t('Counted as times, never as sport hours. Only a look back, nothing is rated.')}</p>
  </section>
{/if}

<style>
  .al {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
    margin: 0;
  }
  .al.card {
    padding: var(--sp-4);
  }
  .bare .cap {
    margin-top: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  h3 {
    margin: 0 0 var(--sp-2);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    color: var(--ink-2);
  }
  .grp + .grp {
    border-top: 1px solid var(--line);
    padding-top: var(--sp-3);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 var(--sp-3);
    align-items: baseline;
    font-size: var(--fs-body);
  }
  .l {
    overflow-wrap: break-word;
  }
  li small {
    grid-column: 1 / -1;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .quiet {
    margin-top: var(--sp-2);
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .quiet summary {
    cursor: pointer;
    min-height: 32px;
  }
  .quiet p {
    margin: var(--sp-2) 0 0;
    overflow-wrap: break-word;
  }
  .cap {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
</style>
