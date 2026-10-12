<script>
  /**
   * v0.111.0 «Checks pro Reiseart» (mockup V4, Noah «v1-v4 ok» 12.10.2026 22:34): Ich › Checks pro
   * Reiseart (#/me/checks, #/me/checks?ski). Each trip type has its own evening-before and after-trip
   * check; new trips start with it. The chips choose the type (with its number of rows), the main
   * column shows both lists with how often each row was ticked on earlier trips of the type (only when
   * there are such trips), «Anpassen» opens the editor (CheckEdit) for the type's standard. On the side:
   * what was missing on earlier trips (from the debriefs), the other types, and that all is a suggestion.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { TRIP_DOMAINS, DOMAIN, domainName, lastDomain } from '../lib/domains.js';
  import { checkKey, freshCheck, checkStats, lastWithOwn, missedBefore, addCheck, asStandard } from '../lib/checks.js';
  import { checkIcon, typeIcon } from '../lib/trip/checkicons.js';
  import { checkHint, checkLink, shortDay } from '../lib/trip/checkhints.js';
  import { localDay } from '../lib/localday.js';
  import CheckEdit from '../lib/trip/CheckEdit.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { t, tn } from '../lib/i18n.svelte.js';
  import { ChevronRight, ArrowUpRight, Plus, Info } from '@lucide/svelte';
  import '../lib/ich/ich.css';
  import '../lib/trip/trip.css';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const stdQ = liveQuery(() => db.settings.where('key').startsWithAnyOf(['eveStandard', 'afterStandard']).toArray());

  const asked = location.hash.split('?')[1] ?? '';
  let sel = $state(DOMAIN[asked] && DOMAIN[asked].trip !== false ? asked : lastDomain());
  let edit = $state(null); // 'eve' | 'after' | null

  const trips = $derived($tripsQ ?? []);
  const today = localDay();
  const stdOf = (kind, d) => ($stdQ ?? []).find((r) => r.key === checkKey(kind, d))?.value ?? null;
  const listOf = (kind, d) => freshCheck(kind, d, stdOf(kind, d));
  const area = $derived(t(domainName(sel)));
  const KINDS = [
    { kind: 'eve', title: 'The evening before' },
    { kind: 'after', title: 'After the trip' },
  ];
  const headLine = (kind) => {
    const list = listOf(kind, sel);
    const last = lastWithOwn(trips, kind, sel, today);
    return [area, tn(list.length, '{n} row', '{n} rows'), stdOf(kind, sel) ? t('your own list') : t('suggestion of the app'), last ? t('last: {trip}', { trip: last.title }) : null].filter(Boolean).join(' · ');
  };
  const missed = $derived(missedBefore(trips, $debriefsQ ?? [], sel, listOf('eve', sel)));
  const others = $derived(TRIP_DOMAINS.filter((d) => d.key !== sel));
  async function take(name) {
    await db.settings.put({ key: checkKey('eve', sel), value: asStandard(addCheck(listOf('eve', sel), t('Pack {name}', { name }))) });
  }
</script>

<div class="ckpage ich-page">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Checks per trip type')} sub={t('Every trip type has its own evening-before and after-trip check. New trips start with it. Adjust it here or right in the trip.')} />

  <div class="types">
    <Seg chips full={false} label={t('Trip type')} value={sel} onchange={(k) => (sel = k)} options={TRIP_DOMAINS.map((d) => ({ key: d.key, name: t(d.name), n: listOf('eve', d.key).length }))} />
  </div>

  <div class="ich-cols">
    <div class="ich-main">
      {#each KINDS as k (k.kind)}
        {@const stats = checkStats(trips, k.kind, sel, { before: today })}
        <section class="ich-sec" aria-labelledby="ck-{k.kind}-h" data-kind={k.kind}>
          <div class="ich-h">
            <div><h2 id="ck-{k.kind}-h">{t(k.title)}</h2><p class="ich-hs">{headLine(k.kind)}</p></div>
            <button type="button" class="tp-link adj" aria-haspopup="dialog" aria-label={t('Adjust: {name}', { name: t(k.title) })} onclick={() => (edit = k.kind)}>{t('Adjust')}<ChevronRight size={14} aria-hidden="true" /></button>
          </div>
          <ul class="card ich-list">
            {#each listOf(k.kind, sel) as r (r.id)}
              {@const I = checkIcon(r.id, k.kind)}
              {@const s = stats[r.id]}
              {@const link = checkLink(r, k.kind)}
              {@const line = s?.n ? t('ticked on {done} of {n} trips', { done: s.done, n: s.n }) : checkHint(r, k.kind)}
              <li class="ich-row" class:ich-wrap={!!link?.out}>
                <span class="ich-ib" aria-hidden="true"><I size={18} /></span>
                <span class="ich-m"><b>{t(r.label)}</b>{#if line}<small>{line}</small>{/if}</span>
                {#if link?.out}<a class="lnk" href={link.href} target="_blank" rel="noopener noreferrer"><span class="pl">{t(link.label)}<ArrowUpRight size={13} aria-hidden="true" /></span></a>{/if}
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>

    <div class="ich-side">
      {#if missed.length}
        <section class="ich-sec" aria-labelledby="ck-learn-h">
          <div class="ich-h"><div><h2 id="ck-learn-h">{t('From your debriefs')}</h2><p class="ich-hs">{t('{area} · suggestions, you decide', { area })}</p></div></div>
          <ul class="card ich-list">
            {#each missed.slice(0, 5) as m (m.name)}
              <li class="ich-row">
                <span class="ich-ib" aria-hidden="true"><Plus size={18} /></span>
                <span class="ich-m"><b>{t('Pack {name}', { name: m.name })}</b><small>{tn(m.n, 'missing {n} time · debrief of {day}', 'missing {n} times · last debrief {day}', { day: shortDay(m.at) })}</small></span>
                <button type="button" class="btn" aria-label={t('Add {name}', { name: t('Pack {name}', { name: m.name }) })} onclick={() => take(m.name)}>{t('Add|row')}</button>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <section class="ich-sec" aria-labelledby="ck-other-h">
        <div class="ich-h"><div><h2 id="ck-other-h">{t('The other trip types')}</h2><p class="ich-hs">{t('each with its own list')}</p></div></div>
        <ul class="card ich-list">
          {#each others as d (d.key)}
            {@const I = typeIcon(d.key)}
            {@const l = listOf('eve', d.key)}
            <li>
              <button type="button" class="ich-row" onclick={() => (sel = d.key)}>
                <span class="ich-ib" aria-hidden="true"><I size={18} /></span>
                <span class="ich-m"><b>{t(d.name)}</b><small>{l.slice(0, 2).map((r) => t(r.label)).join(' · ')}{l.length > 2 ? ' …' : ''}</small></span>
                <span class="cnt num">{l.length}</span>
              </button>
            </li>
          {/each}
        </ul>
      </section>
      <p class="ich-fine"><Info size={15} aria-hidden="true" /><span>{t('All are suggestions: every row can be removed, and a trip can have its own list.')}</span></p>
    </div>
  </div>

  {#if edit}
    {#key `${edit}-${sel}`}
      <CheckEdit kind={edit} domain={sel} list={listOf(edit, sel)} trips={trips} debriefs={$debriefsQ ?? []} onclose={() => (edit = null)} />
    {/key}
  {/if}
</div>

<style>
  .ckpage {
    max-width: 1100px;
  }
  .types {
    margin: 0 0 20px;
  }
  .adj {
    flex: none;
    gap: 2px;
    font-size: var(--fs-small);
    text-decoration: none;
  }
  .lnk {
    flex: none;
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    min-width: 44px;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
  }
  .pl {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid var(--line);
    border-radius: 99px;
    font-size: var(--fs-small);
    font-weight: 500;
    white-space: nowrap;
  }
  .cnt {
    flex: none;
    color: var(--ink-2);
    font-weight: 600;
  }
  .ich-row .btn {
    flex: none;
  }
</style>
