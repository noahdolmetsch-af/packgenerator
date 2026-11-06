<script>
  /**
   * Spielerplus-Kalender (Noah 06.11.2026 «2a»): on the page of a sport (Eishockey) the next team dates from
   * Spielerplus, each with «In Spielerplus anmelden ›» (opens Spielerplus; nothing is sent from here).
   * Without a link on this device the card says why it is empty and leads to Ich › Verbindungen.
   */
  import { liveQuery } from 'dexie';
  import { ExternalLink, Users } from '@lucide/svelte';
  import { db } from '../db.js';
  import { SP_KEY, DEFAULT_ACT, prefsOf, allEvents, upcoming, signupHref } from '../spielerplus.js';
  import Empty from '../ui/Empty.svelte';
  import { dayShort, wd } from '../flow/words.js';
  import { t } from '../i18n.svelte.js';

  let { actId, today } = $props();
  const q = liveQuery(() => db.settings.get(SP_KEY));
  const prefs = $derived(prefsOf($q?.value));
  const mine = $derived(prefs.cals.filter((c) => c.act === actId));
  const list = $derived(upcoming(allEvents(prefs, { act: actId }), today, 6, new Date().toTimeString().slice(0, 5)));
  const named = $derived(mine.length > 1);
  const show = $derived($q !== undefined && (mine.length > 0 || (actId === DEFAULT_ACT && prefs.cals.length === 0)));
  const dayLine = (e) => (e.day === today ? t('today') : `${wd(e.day)} ${dayShort(e.day)}`);
</script>

{#if show}
  <section class="card blk" aria-labelledby="bl-spielerplus" data-block="spielerplus">
    <div class="hl"><h2 id="bl-spielerplus">{t('From Spielerplus')}</h2><a class="lnk" href="#/me/connections">{t('Change')}</a></div>
    {#if !mine.length}
      <Empty icon={Users} text={t('No Spielerplus calendar here yet. Add your team link under Me › Connections and the training dates show up here.')} action={{ label: t('Add Spielerplus link'), href: '#/me/connections' }} />
    {:else if !list.length}
      <p class="none">{t('No team dates in the next 90 days.')}</p>
    {:else}
      <ul class="ilist">
        {#each list as e (e.id)}
          <li data-sp-date={e.id}>
            <span class="ent">
              <b><span class="num">{dayLine(e)}{e.from ? ` · ${e.from}` : ''}</span> {e.title}</b>
              <span class="small">{[named ? e.calName : '', e.where].filter(Boolean).join(' · ')}</span>
            </span>
            <a class="btn" href={signupHref(e)} target="_blank" rel="noopener noreferrer" data-sp-signup><ExternalLink size={16} aria-hidden="true" />{t('Sign up in Spielerplus ›')}</a>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

<style>
  .ilist li {
    flex-wrap: wrap;
    justify-content: space-between;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  .ent {
    flex: 1 1 200px;
    min-width: 0;
    display: grid;
    gap: 2px;
  }
</style>
