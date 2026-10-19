<script>
  /** Paket U «Rennen», Race mode · 14 Kontaktpunkte: after a stage, 0–3 per part and a setup note. Observation only. */
  import { Trash2 } from '@lucide/svelte';
  import Box from './Box.svelte';
  import { CONTACT_PARTS, CONTACT_LEVELS, contactSummary, newId, hhmm } from '../race.js';
  import { stageOf } from '../ride-lib.js';
  import { putRace } from '../store.js';
  import { askDelete, deleteWithUndo } from '../../ui/ask.js';
  import { offerDone } from '../../ui/rename.svelte.js';
  import { t } from '../../i18n.svelte.js';

  let { ctx, now } = $props();
  const list = $derived(ctx.race.contacts);
  const sum = $derived(contactSummary(list));
  let parts = $state({});
  let setup = $state('');
  const stage = $derived(stageOf(ctx.plan?.start, now));

  async function add() {
    const before = await ctx.save({ contacts: [...list, { id: newId('c'), at: new Date().toISOString(), stage, parts: { ...parts }, setup: setup.trim() }] });
    parts = {};
    setup = '';
    offerDone(t('Contact points of day {n} saved.', { n: stage }), () => putRace(ctx.trip.id, before));
  }
  async function drop(c) {
    if ((await askDelete({ title: t('Delete the entry of day {n}?', { n: c.stage }) })) !== 'delete') return;
    const before = list;
    await deleteWithUndo({ run: () => ctx.save({ contacts: list.filter((x) => x.id !== c.id) }), undo: () => ctx.save({ contacts: before }), text: t('Entry deleted.'), name: t('Day {n}', { n: c.stage }) });
  }
</script>

<Box id="ride-contacts" title={t('Contact points')} what="After a stage: how saddle, hands, feet, neck and knees feel, from nothing to painful, and what you changed on the bike." why="Shows early where it starts to hurt and which change helped. An observation, not a diagnosis." from="What you tick here, kept in this race.">
  {#each CONTACT_PARTS as p (p.key)}
    <div class="rc-lab">
      {t(p.name)}
      <div class="rc-chips" role="group" aria-label={t(p.name)}>
        {#each CONTACT_LEVELS as l, v (l)}
          <button type="button" class="rc-chip" aria-pressed={(parts[p.key] ?? 0) === v} onclick={() => (parts = { ...parts, [p.key]: v })} data-race-contact="{p.key}-{v}">{t(l)}</button>
        {/each}
      </div>
    </div>
  {/each}
  <label class="rc-lab">{t('What I changed on the bike (optional)')}<input class="inp" bind:value={setup} maxlength="200" placeholder={t('e.g. saddle 3 mm lower')} /></label>
  <button type="button" class="btn hi" onclick={add} data-race-contact-save>{t('Save for day {n}', { n: stage })}</button>
  {#if list.length}
    <p class="rc-note">{sum.filter((s) => s.max > 0).map((s) => `${t(s.name)}: ${t(CONTACT_LEVELS[s.max])}`).join(' · ') || t('Nothing hurt so far.')}</p>
    <ul class="rc-list">
      {#each [...list].reverse() as c (c.id)}
        <li class="rc-row">
          <span class="rc-row-main">
            <b>{t('Day {n}', { n: c.stage })} · {hhmm(Date.parse(c.at))}</b>
            <small>{CONTACT_PARTS.filter((p) => Number(c.parts?.[p.key]) > 0).map((p) => `${t(p.name)} ${c.parts[p.key]}`).join(' · ') || t('Nothing')}{c.setup ? ` · ${c.setup}` : ''}</small>
          </span>
          <button type="button" class="rc-icon" aria-label={t('Delete the entry of day {n}?', { n: c.stage })} onclick={() => drop(c)}><Trash2 size={18} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}
</Box>
