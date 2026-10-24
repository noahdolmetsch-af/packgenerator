<script>
  /**
   * «Alles finden» (Noah 22.10.2026 «1a»): «Not seen for a while» showed up only in Planen › Mehr › Alltag.
   * Now the people you want to see again this week stand as one row in the week (names as you typed them).
   * Shows nothing when nobody is due or the reminders are off.
   */
  import { alltagQuery } from '../alltagdb.js';
  import { dueOf, ALLTAG_HASH } from '../alltag.js';
  import { shiftDay } from '../training.js';
  import { t } from '../i18n.svelte.js';
  import { Users, ChevronRight } from '@lucide/svelte';

  let { monday, today } = $props();
  const q = alltagQuery();
  const due = $derived(
    $q && $q.prefs.peopleOn ? ($q.people ?? []).filter((p) => p && !p.off && p.name && dueOf(p, today) <= shiftDay(monday, 6)) : [],
  );
</script>

{#if due.length}
  <a class="wp" href="{ALLTAG_HASH}/menschen" data-week-people>
    <Users size={18} aria-hidden="true" />
    <span><b>{t('Not seen for a while')}</b><small>{due.map((p) => p.name).join(', ')}</small></span>
    <ChevronRight size={16} aria-hidden="true" />
  </a>
{/if}

<style>
  .wp {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px 16px;
    color: var(--ink);
    text-decoration: none;
  }
  span {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
