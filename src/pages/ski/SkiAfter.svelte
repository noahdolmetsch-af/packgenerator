<script>
  /**
   * v0.97.0 «Skitouren», mockup E «Nach der Tour»: peak, place / start, metres climbed, ski and skins
   * (a ski hardware item), time moving and time elapsed (h:mm); who came along (chips from before,
   * «+ Person», «allein»); three questions: what was good, what to change next time (above all the
   * clothes: chips + text), learning and notable things. «Speichern» keeps it on the trip (trip.ski)
   * and makes learnings of area ski (lib/ski.js afterLearnings): they show in the backpack check under
   * their group. «Später» leaves without saving. A Strava ski tour of the same day (kept from the
   * Strava import, Velos › Pflege › Fahrten importieren) fills metres and times: «aus Strava
   * übernommen · alles änderbar». Without Strava everything is typed in by hand.
   * #/ski/after/<trip id> (none: the last tour without notes).
   * Paket P2: «Plan und echt» puts the plan of #/ski/plan (metres, time, peak) beside what you type here,
   * and «Dein Material» lists the ski hardware that came along on this tour.
   */
  import SpeakButton from '../../lib/ui/SpeakButton.svelte'; // «Diktat» (Noah 19.10.2026 «5a»)
  import { appendSpoken } from '../../lib/speak.js';
  import { ChevronLeft, Plus } from '@lucide/svelte';
  import { skiQuery, saveAfter } from '../../lib/ski/skidb.js';
  import { pointsOf } from '../../lib/skiday.js';
  import { planVsReal } from '../../lib/skiplan.js';
  import { lastWithoutNotes, lastPastSki, companions, CHANGE_TAGS, stravaFor, skiGroupOf, parseDuration, durationText, SKI } from '../../lib/ski.js';
  import { inDomain } from '../../lib/domains.js';
  import { isInventory } from '../../lib/gear.js';
  import { localDay } from '../../lib/localday.js';
  import Empty from '../../lib/ui/Empty.svelte';
  import { t, nameOf, locale } from '../../lib/i18n.svelte.js';

  let { id = '' } = $props();
  const today = localDay();
  const q = skiQuery();
  const data = $derived($q);
  const trip = $derived(data ? (id ? (data.trips.find((x) => x.id === id) ?? null) : (lastWithoutNotes(data.trips, today) ?? lastPastSki(data.trips, today))) : null);
  const skis = $derived((data?.items ?? []).filter((i) => isInventory(i) && inDomain(i, SKI) && skiGroupOf(i) === 'hardware'));
  const people = $derived(data ? companions(data.trips) : []);
  const longDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

  /** the form, filled once from the trip (and Strava, before the first save) */
  let f = $state(null);
  let fromStrava = $state(false);
  $effect(() => {
    if (f || !trip || !data) return;
    const s = trip.ski ?? {};
    const st = s.savedAt ? null : stravaFor(trip, data.strava);
    const pick = (mine, theirs) => (mine != null && mine !== '' ? mine : theirs);
    f = {
      peak: s.peak ?? '',
      place: s.place ?? '',
      hm: String(pick(s.hm, st?.hm) ?? ''),
      skiItemId: s.skiItemId ?? '',
      active: durationText(pick(s.activeMin, st?.activeMin)),
      elapsed: durationText(pick(s.elapsedMin, st?.elapsedMin)),
      with: [...(s.with ?? [])],
      alone: !!s.alone,
      good: s.good ?? '',
      changeTags: [...(s.changeTags ?? [])],
      change: s.change ?? '',
      learning: s.learning ?? '',
      stravaId: s.stravaId ?? st?.stravaId ?? null,
    };
    fromStrava = !!st && (st.hm != null || st.activeMin != null || st.elapsedMin != null);
  });

  /* who came along */
  let addingPerson = $state(false);
  let person = $state('');
  const allPeople = $derived([...new Set([...people, ...(f?.with ?? [])])]);
  const togglePerson = (name) => {
    f.with = f.with.includes(name) ? f.with.filter((x) => x !== name) : [...f.with, name];
    if (f.with.length) f.alone = false;
  };
  const addPerson = () => {
    const name = person.trim();
    if (name && !f.with.includes(name)) f.with = [...f.with, name];
    if (name) f.alone = false;
    person = '';
    addingPerson = false;
  };
  const toggleAlone = () => {
    f.alone = !f.alone;
    if (f.alone) f.with = [];
  };

  /* what to change: the ready chips and your own */
  let addingTag = $state(false);
  let tag = $state('');
  const tags = $derived([...new Set([...CHANGE_TAGS, ...(f?.changeTags ?? [])])]);
  const tagName = (x) => (CHANGE_TAGS.includes(x) ? t(x) : x);
  const toggleTag = (x) => (f.changeTags = f.changeTags.includes(x) ? f.changeTags.filter((y) => y !== x) : [...f.changeTags, x]);
  const addTag = () => {
    const x = tag.trim();
    if (x && !f.changeTags.includes(x)) f.changeTags = [...f.changeTags, x];
    tag = '';
    addingTag = false;
  };

  let busy = $state(false);
  async function save() {
    if (!trip || !f || busy) return;
    busy = true;
    const hm = Number(String(f.hm).replace(/[^\d]/g, ''));
    await saveAfter(
      trip.id,
      {
        peak: f.peak.trim(),
        place: f.place.trim(),
        hm: String(f.hm).trim() && Number.isFinite(hm) ? hm : null,
        skiItemId: f.skiItemId || null,
        activeMin: parseDuration(f.active),
        elapsedMin: parseDuration(f.elapsed),
        with: $state.snapshot(f.with),
        alone: f.alone,
        good: f.good.trim(),
        changeTags: $state.snapshot(f.changeTags),
        change: f.change.trim(),
        learning: f.learning.trim(),
        stravaId: f.stravaId,
      },
      t,
    );
    location.hash = '#/ski';
  }
  const later = () => (location.hash = '#/ski');
  // SKB6: the decision points ticked on the way, with their time
  const pts = $derived(pointsOf(trip));
  // Paket P2: plan and reality, live with what is typed in
  const PV_NAMES = { hm: 'Metres climbed', time: 'Time moving', peak: 'At the peak' };
  const pv = $derived(trip && f ? planVsReal({ ...trip, ski: { ...(trip.ski ?? {}), hm: Number(String(f.hm).replace(/[^\d]/g, '')) || null, activeMin: parseDuration(f.active) } }) : []);
  const pvText = (r, v) => (v == null ? '–' : r.key === 'hm' ? `${v} m` : r.key === 'time' ? durationText(v) : v);
  const pvDiff = (r) => (r.diff == null ? '' : r.diff === 0 ? t('as planned') : `${r.diff > 0 ? '+' : '−'}${r.key === 'hm' ? `${Math.abs(r.diff)} m` : durationText(Math.abs(r.diff))}`);
  const gear = $derived.by(() => {
    if (!trip || !data) return [];
    const ids = new Set((trip.entries ?? []).map((e) => e.itemId));
    return data.items.filter((i) => ids.has(i.id) && skiGroupOf(i) === 'hardware');
  });
</script>

<div class="sk">
  <p class="sk-back"><a href="#/ski"><ChevronLeft size={16} aria-hidden="true" />{t('Ski tours')}</a></p>
  <div>
    <h1 class="sk-h1" tabindex="-1" data-page-title>{t('After the tour')}</h1>
    {#if trip}<p class="sk-sub">{trip.title} · {longDay(trip.startDate)}{#if fromStrava}{" "}<span class="pill ok" data-strava>{t('taken from Strava · everything changeable')}</span>{/if}</p>{/if}
  </div>
  {#if data && !trip}
    <Empty text={t('No ski tour is over yet. After your first tour: peak, metres climbed, three questions.')} action={{ label: t('Ski tours'), href: '#/ski' }} />
  {:else if f}
    <div class="sk-cols ea">
      <div>
        <section class="surf sk-pad facts" aria-label={t('The tour')}>
          <div class="sk-grid2">
            <label class="sk-field"><span>{t('Peak')}</span><input class="inp" bind:value={f.peak} placeholder={t('e.g. {x}', { x: 'Muster-Gipfel' })} /></label>
            <label class="sk-field"><span>{t('Place / start')}</span><input class="inp" bind:value={f.place} /></label>
            <label class="sk-field"><span>{t('Metres climbed')}</span><input class="inp num" inputmode="numeric" bind:value={f.hm} /></label>
            <label class="sk-field"><span>{t('Ski and skins')}</span>
              <select class="sel" bind:value={f.skiItemId}>
                <option value="">–</option>
                {#each skis as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
              </select>
            </label>
            <label class="sk-field"><span>{t('Time moving')}</span><input class="inp num" bind:value={f.active} placeholder="3:40" /></label>
            <label class="sk-field"><span>{t('Time elapsed')}</span><input class="inp num" bind:value={f.elapsed} placeholder="5:15" /></label>
          </div>
          <div class="sk-field">
            <span id="with-l">{t('Who came along')}</span>
            <div class="sk-chips" role="group" aria-labelledby="with-l">
              {#each allPeople as name (name)}<button type="button" class="sk-chip" aria-pressed={f.with.includes(name)} onclick={() => togglePerson(name)}>{name}</button>{/each}
              {#if addingPerson}
                <form class="inl" onsubmit={(e) => (e.preventDefault(), addPerson())}>
                  <!-- svelte-ignore a11y_autofocus -->
                  <input class="inp" bind:value={person} aria-label={t('Name')} autofocus onblur={addPerson} />
                </form>
              {:else}
                <button type="button" class="sk-chip add" onclick={() => (addingPerson = true)}><Plus size={16} aria-hidden="true" />{t('Person')}</button>
              {/if}
              <button type="button" class="sk-chip" aria-pressed={f.alone} onclick={toggleAlone}>{t('alone')}</button>
            </div>
          </div>
          {#if pts.length}
            <div class="sk-field" data-after-points>
              <span>{t('On the way')}{#if trip.ski?.turnAt}{' · '}{t('Turnaround {time}', { time: trip.ski.turnAt })}{/if}</span>
              <ul class="sk-list">{#each pts as p (p.id)}<li class="num">{p.name}{' · '}{p.at ? t('reached at {time}', { time: p.at }) : t('not reached')}</li>{/each}</ul>
            </div>
          {/if}
          {#if pv.length}
            <div class="sk-field" data-plan-real>
              <span>{t('Plan and reality')}</span>
              <ul class="sk-list">{#each pv as r (r.key)}<li class="num" data-pv={r.key}>{t(PV_NAMES[r.key])}{': '}{t('plan {plan}, real {real}', { plan: pvText(r, r.plan), real: pvText(r, r.real) })}{#if pvDiff(r)}{' · '}<b>{pvDiff(r)}</b>{/if}</li>{/each}</ul>
            </div>
          {/if}
          {#if gear.length}
            <div class="sk-field" data-after-gear>
              <span>{t('Your gear on this tour')}</span>
              <p class="sk-quiet">{gear.map((i) => nameOf(i)).join(' · ')}</p>
            </div>
          {/if}
          {#if !fromStrava}<p class="sk-quiet">{t('No Strava activity? Type everything in by hand.')}</p>{/if}
        </section>
        <section class="surf sk-pad info">
          <b>{t('Becomes learnings for the next ski tour')}</b>
          <p class="sk-quiet">{t('They show in the backpack check, under the matching group (e.g. clothing).')}</p>
        </section>
        <button type="button" class="btn hi sk-go sv" onclick={save} disabled={busy}>{t('Save')}</button>
        <button type="button" class="btn sk-later lt" onclick={later}>{t('Later')}</button>
      </div>
      <div>
        <section class="sk-note" aria-label={t('Three questions')}>
          <label class="sk-field"><h2>{t('What was good?')}</h2><textarea class="inp sk-text" bind:value={f.good} placeholder={t('e.g. «early start, perfect powder on the north slope»')}></textarea></label>
          <SpeakButton wrap onsaid={(w) => (f.good = appendSpoken(f.good ?? '', w))} />
          <h2 id="chg-h">{t('What do I change next time, above all with the clothes?')}</h2>
          <div class="sk-chips" role="group" aria-labelledby="chg-h">
            {#each tags as x (x)}<button type="button" class="sk-chip" aria-pressed={f.changeTags.includes(x)} onclick={() => toggleTag(x)}>{tagName(x)}</button>{/each}
            {#if addingTag}
              <form class="inl" onsubmit={(e) => (e.preventDefault(), addTag())}>
                <!-- svelte-ignore a11y_autofocus -->
                <input class="inp" bind:value={tag} aria-label={t('Own|tag')} autofocus onblur={addTag} />
              </form>
            {:else}
              <button type="button" class="sk-chip add" onclick={() => (addingTag = true)}><Plus size={16} aria-hidden="true" />{t('own|tag')}</button>
            {/if}
          </div>
          <textarea class="inp sk-text" bind:value={f.change} aria-labelledby="chg-h" placeholder={t('e.g. «put on the insulation jacket only at the peak»')}></textarea>
          <SpeakButton wrap onsaid={(w) => (f.change = appendSpoken(f.change ?? '', w))} />
          <label class="sk-field"><h2>{t('Learning and notable things')}</h2><textarea class="inp sk-text" bind:value={f.learning} placeholder={t('e.g. «ski crampons needed from 2,200 m»')}></textarea></label>
          <SpeakButton wrap onsaid={(w) => (f.learning = appendSpoken(f.learning ?? '', w))} />
        </section>
      </div>
    </div>
  {/if}
</div>

<style>
  .facts,
  .info {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .info {
    gap: 4px;
  }
  .inl {
    display: flex;
  }
  .inl .inp {
    width: 10em;
    min-height: 44px;
  }
  /* on a phone: the facts, the three questions, then «Speichern» (mockup E); two columns on a computer */
  @media (max-width: 959px) {
    .ea {
      display: flex;
      flex-direction: column;
    }
    .ea > div {
      display: contents;
    }
    .facts {
      order: 1;
    }
    .sk-note {
      order: 2;
    }
    .info {
      order: 3;
    }
    .sv {
      order: 4;
    }
    .lt {
      order: 5;
    }
  }
  @media (max-width: 359px) {
    .sk-grid2 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
