<script>
  /**
   * «Garmin-Seiten» GA-A3 (Noah 14.10.2026 «GA-A1–A3 freigegeben»): one model page in detail. The
   * Edge 1040 and the Edge 850 side by side (the 850 replaced the 540, Noah 18.10.2026), why each field is
   * there and on which device it shows, and ticks «set up on the device». «Change fields» switches
   * a field on or off per device. Nothing is sent to the Edge: the ticks are only a note for you.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { Check } from '@lucide/svelte';
  import VeloHead from './VeloHead.svelte';
  import EdgeScreen from './EdgeScreen.svelte';
  import { PAGE, KIND_LABEL, DEVICES, MAX_FIELDS, garminOf, toStore, profileName, fieldRows, fieldsOf, hiddenOf, toggleField, toggleDone, removePage, doneKey } from '../garmin.js';
  import { localDay } from '../localday.js';
  import { t, dateOf } from '../i18n.svelte.js';

  let { bikeId = null, profileId = null, pageId } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? null);
  const g = $derived(bike ? garminOf(bike) : null);
  const prof = $derived(g ? g.profiles.find((p) => p.id === profileId) ?? g.profiles[0] : null);
  const page = $derived(PAGE[pageId]);
  const rows = $derived(g && page ? fieldRows(g, pageId) : []);
  const count = (d) => fieldsOf(pageId, d, g.sensors, hiddenOf(g, pageId, d)).length;
  const left850 = $derived(rows.filter((r) => r.on['1040'] && !r.on['850']).map((r) => t(r.label)));
  const done = $derived(g?.done?.[doneKey(prof?.id, pageId)] ?? {});
  const hasCiq = $derived(rows.some((r) => r.ciq && (r.on['1040'] || r.on['850'])));
  const index = $derived(prof ? prof.pages.indexOf(pageId) : -1);
  const listHref = $derived(bike && prof ? bikesHash({ tab: 'garmin', bike: bike.id, view: prof.id }) : '#/bikes');

  let editing = $state(false);
  let msg = $state('');
  async function save(next) {
    if (!next || !bike) return;
    await db.bikes.update(bike.id, { garmin: toStore(next) });
  }
  async function flip(key, device) {
    const next = toggleField(g, pageId, device, key);
    msg = next ? '' : count(device) <= 1 && rows.find((r) => r.k === key)?.on[device] ? t('A page keeps at least one field.') : t('The Edge {device} shows at most {n} fields on a page.', { device, n: MAX_FIELDS[device] });
    await save(next);
  }
  async function drop() {
    await save(removePage(g, prof.id, pageId));
    location.hash = listHref;
  }
</script>

<div class="gd">
  {#if bike && g && prof && page}
    <VeloHead
      crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup' }) }, { label: bike.name, href: bikesHash({ tab: 'setup', bike: bike.id }) }, { label: t('Garmin pages'), href: listHref }]}
      here={pageId}
      title="{pageId} {t(page.name)}"
      sub={[t(KIND_LABEL[page.kind]), t('Profile {name}', { name: profileName(prof, bike) }), index >= 0 ? t('page {i} of {n}', { i: index + 1, n: prof.pages.length }) : ''].filter(Boolean).join(' · ')}
    >
      <button type="button" class="btn" aria-pressed={editing} onclick={() => ((editing = !editing), (msg = ''))}>{editing ? t('Done') : t('Change fields')}</button>
    </VeloHead>

    <div class="two">
      <div class="devs">
        {#each DEVICES as d (d)}
          <figure>
            <EdgeScreen pageId={pageId} device={d} {g} width={180} idx={Math.max(0, index)} total={prof.pages.length} />
            <figcaption>Edge {d} · {t('{n} fields', { n: count(d) })}{#if d === '850' && left850.length}<br />{t('without «{fields}»', { fields: left850.join(', ') })}{/if}</figcaption>
          </figure>
        {/each}
      </div>

      <div class="col">
        <section class="card">
          <h2>{t('Why these values')}</h2>
          <p class="hint">{t(page.why)} · <span class="rare">{t('purple = rarely watched')}</span></p>
          <ul class="fl">
            {#each rows as r (r.k)}
              <li>
                <b class:rare={r.rare}>{t(r.label)}{#if r.ciq}{' '}<span class="badge">Connect IQ</span>{/if}</b>
                <span class="why">{t(r.why)}</span>
                <span class="on2">
                  {#each DEVICES as d (d)}
                    {#if editing}
                      <button type="button" class="dv" class:no={!r.on[d]} aria-pressed={r.on[d]} aria-label={t('{field} on the Edge {device}', { field: t(r.label), device: d })} onclick={() => flip(r.k, d)}>{d}</button>
                    {:else}
                      <i class="dv" class:no={!r.on[d]} title={r.on[d] ? t('shows on the Edge {device}', { device: d }) : t('not on the Edge {device}', { device: d })}>{d}</i>
                    {/if}
                  {/each}
                </span>
              </li>
            {/each}
          </ul>
          {#if msg}<p class="msg" role="status">{msg}</p>{/if}
          {#if editing}<p class="hint">{t('Tap 1040 or 850 to show or hide a field on that Edge.')} <button type="button" class="link" onclick={drop}>{t('Remove this page from the profile')}</button></p>{/if}
        </section>

        <section class="card">
          <h2>{t('Set up on the device?')}</h2>
          <div class="chk">
            {#each DEVICES as d (d)}
              <button type="button" class="ck" role="checkbox" aria-checked={!!done[d]} onclick={() => save(toggleDone(g, prof.id, pageId, d, localDay()))}><span class="box" class:on={done[d]}>{#if done[d]}<Check size={14} strokeWidth={3} aria-hidden="true" />{/if}</span>Edge {d}{#if done[d]}<small>· {t('ticked on {date}', { date: dateOf(done[d]) })}</small>{/if}</button>
            {/each}
            {#if hasCiq}
              <button type="button" class="ck" role="checkbox" aria-checked={!!done.ciq} onclick={() => save(toggleDone(g, prof.id, pageId, 'ciq', localDay()))}><span class="box" class:on={done.ciq}>{#if done.ciq}<Check size={14} strokeWidth={3} aria-hidden="true" />{/if}</span>{t('Connect IQ app «Time in zones» installed')}<small>· {t('free, in the Connect IQ Store')}</small></button>
            {/if}
          </div>
          <p class="hint">{t('Only to tick off. The app sends nothing to the Edge; you set up the page in Garmin Connect › Device › Activity profiles › Data screens.')}</p>
        </section>
      </div>
    </div>
  {:else if $bikesQ}
    <p class="hint">{t('This page is not there any more.')} <a href={listHref}>{t('Garmin pages')}</a></p>
  {/if}
</div>

<style>
  .gd {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .two {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  .devs {
    display: flex;
    gap: 16px;
    align-items: flex-end;
  }
  figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  figcaption {
    font-size: var(--fs-tiny);
    color: var(--ink-3);
    text-align: center;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .hint {
    margin: 4px 0 6px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.45;
  }
  .rare {
    color: var(--accent);
  }
  .fl {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
  }
  .fl li {
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr) auto;
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
    align-items: start;
  }
  .fl li:first-child {
    border-top: 0;
  }
  .why {
    color: var(--ink-2);
  }
  .badge {
    padding: 1px 6px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
    white-space: nowrap;
  }
  .on2 {
    display: flex;
    gap: 4px;
  }
  .dv {
    display: inline-grid;
    place-items: center;
    min-width: 40px;
    height: 24px;
    border: 0;
    border-radius: 6px;
    font: 600 var(--fs-tiny) / 1 var(--font-body);
    font-style: normal;
    background: var(--hi-soft, var(--paper-2));
    color: var(--hi);
  }
  button.dv {
    height: 36px;
    min-width: 48px;
    cursor: pointer;
    outline: 1px solid var(--hi);
  }
  .dv.no {
    background: var(--paper-2);
    color: var(--ink-3);
    text-decoration: line-through;
    outline-color: var(--line);
  }
  .msg {
    margin: 8px 0 0;
    color: var(--warn);
    font-size: var(--fs-small);
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    color: var(--ink-2);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .chk {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
  }
  .ck {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 10px;
    min-height: 40px;
    border: 0;
    background: none;
    padding: 0;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-align: left;
    cursor: pointer;
  }
  .ck small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .box {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 1.5px solid var(--line-strong);
    display: grid;
    place-items: center;
    flex: none;
  }
  .box.on {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--hi-ink);
  }
  @media (max-width: 700px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
    .devs {
      justify-content: center;
    }
    .fl li {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .fl li .why {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>
