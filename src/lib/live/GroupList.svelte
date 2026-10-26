<script>
  /**
   * Gruppen-Live-Karte (Noah 25.10.2026 «b»): the members of a group ride as a list: name, km along the
   * route (or «off the route»), «last seen X min ago» and «waiting» while someone waits. rows: memberRows() of group.js.
   * Shared by the live map (GroupPanel) and the friends' page (#/gruppe/…).
   */
  import { t, num } from '../i18n.svelte.js';
  import { initials } from './group.js';

  let { rows = [], hasRoute = false } = $props();
  const seen = (r) => (r.ago < 1 ? t('seen just now') : t('seen {n} min ago', { n: r.ago }));
</script>

{#if rows.length}
  <ul class="grp-list" data-group-list>
    {#each rows as r (r.m)}
      <li class:stale={r.stale} data-group-row={r.me ? 'me' : 'friend'}>
        <span class="grp-dot" class:me={r.me} class:wait={r.wait} aria-hidden="true">{initials(r.name)}</span>
        <span class="grp-txt">
          <b>{r.name || t('Without a name')}{r.me ? ` (${t('you')})` : ''}</b>
          <small>
            {#if hasRoute}{r.km != null ? t('km {km} of the route', { km: num(r.km) }) : t('off the route')}{' '}·{' '}{/if}<span data-group-seen>{seen(r)}</span>
          </small>
        </span>
        {#if r.wait}<span class="grp-tag" data-group-wait>{t('waiting')}</span>{/if}
      </li>
    {/each}
  </ul>
{:else}
  <p class="rc-empty" data-group-empty>{t('Nobody shares a location yet.')}</p>
{/if}

<style>
  .grp-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .grp-list li {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
  }
  .grp-list li.stale {
    opacity: 0.6;
  }
  .grp-dot {
    flex: none;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--l3);
    color: var(--brand-ink);
    font-weight: 700;
    font-size: var(--fs-small);
  }
  .grp-dot.me {
    background: var(--brand);
  }
  /* «I am waiting here»: the dot and a small tag in the warning colour */
  .grp-dot.wait {
    background: var(--warn);
  }
  .grp-tag {
    flex: none;
    margin-left: auto;
    padding: 2px var(--sp-2);
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font-size: var(--fs-tiny);
    font-weight: 700;
  }
  .grp-txt {
    display: grid;
    min-width: 0;
  }
  .grp-txt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
