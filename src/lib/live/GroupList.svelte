<script>
  /**
   * Gruppen-Live-Karte (Noah 25.10.2026 «b»): the members of a group ride as a list: name, km along the
   * route (or «off the route»), «last seen X min ago» and «waiting» while someone waits. rows: memberRows() of group.js.
   * Shared by the live map (GroupPanel) and the friends' page (#/gruppe/…).
   * Für Events (Noah 26.10.2026): the distance to you along the route («8 km ahead of you»), and tags for
   * a help call, ready / in camp today and the last checkpoint reached (rows with .gap and .part, event.js).
   */
  import { t, num } from '../i18n.svelte.js';
  import { initials } from './group.js';
  import { statusToday, lastCp, HELP_MIN } from './event.js';

  let { rows = [], hasRoute = false, cps = [], now = Date.now() } = $props();
  const seen = (r) => (r.ago < 1 ? t('seen just now') : t('seen {n} min ago', { n: r.ago }));
  const gapText = (g) => (g > 0 ? t('{km} km ahead of you', { km: num(g) }) : g < 0 ? t('{km} km behind you', { km: num(-g) }) : t('with you'));
  const helpOn = (r) => !!r.part?.help && now - Date.parse(r.part.help.at) <= HELP_MIN * 60_000;
  const cpText = (c) => (c.cp.finish ? t('at the finish') : c.cp.name || t('CP {n}', { n: c.cp.i + 1 }));
</script>

{#if rows.length}
  <ul class="grp-list" data-group-list>
    {#each rows as r (r.m)}
      {@const st = statusToday(r.part?.status, now)}
      {@const cp = cps.length ? lastCp(cps, r.part?.cps ?? {}) : null}
      <li class:stale={r.stale} data-group-row={r.me ? 'me' : 'friend'}>
        <span class="grp-dot" class:me={r.me} class:wait={r.wait} class:help={helpOn(r)} aria-hidden="true">{initials(r.name)}</span>
        <span class="grp-txt">
          <b>{r.name || t('Without a name')}{r.me ? ` (${t('you')})` : ''}</b>
          <small>
            {#if !r.pos}{t('shares no location')}{' · '}{:else if hasRoute}{r.km != null ? t('km {km} of the route', { km: num(r.km) }) : t('off the route')}{' · '}{#if r.gap != null}<span data-group-gap>{gapText(r.gap)}</span>{' · '}{/if}{/if}<span data-group-seen>{seen(r)}</span>
          </small>
        </span>
        <span class="grp-tags">
          {#if helpOn(r)}<span class="grp-tag bad" data-group-helptag>{t('Help')}</span>{/if}
          {#if r.wait}<span class="grp-tag" data-group-wait>{t('waiting')}</span>{/if}
          {#if st}<span class="grp-tag ok" data-group-status={st.kind}>{st.kind === 'ready' ? t('ready') : t('in camp')}</span>{/if}
          {#if cp}<span class="grp-tag ok" data-group-cp>{cpText(cp)}</span>{/if}
        </span>
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
  .grp-dot.help {
    background: var(--bad);
  }
  .grp-tags {
    flex: none;
    margin-left: auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sp-1);
  }
  .grp-tag {
    flex: none;
    padding: 2px var(--sp-2);
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font-size: var(--fs-tiny);
    font-weight: 700;
  }
  .grp-tag.bad {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .grp-tag.ok {
    background: var(--ok-soft);
    color: var(--ok);
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
