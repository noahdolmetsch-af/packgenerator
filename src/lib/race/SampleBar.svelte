<script>
  /**
   * Paket U › Muster-Rennen (Noah «1-5 ok 6a 7b 8a»): the line on top of the sample race: everything is
   * made up, the pencil marks what you can change, the tour (6a), «Reset» and «Delete».
   */
  import { Pencil, RotateCcw, Trash2, Play } from '@lucide/svelte';
  import { db } from '../db.js';
  import { newTrip } from '../trips.js';
  import { putRace } from './store.js';
  import { makeSample, SAMPLE_ID } from './sample.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { startTour } from '../tour/run.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  let { stored } = $props();
  async function snapshot() {
    return { trip: await db.trips.get(SAMPLE_ID), race: structuredClone($state.snapshot(stored)) };
  }
  async function restore(b) {
    if (b.trip) await db.trips.put(b.trip);
    await putRace(SAMPLE_ID, b.race);
  }
  async function reset() {
    const before = await snapshot();
    await deleteWithUndo({ run: () => makeSample({ db, newTrip, putRace, today: localDay(), title: t('Sample race 1000') }), undo: () => restore(before), text: t('The sample race is as new again.'), name: t('Sample race 1000') });
  }
  async function remove() {
    if ((await askDelete({ title: t('Delete the sample race?'), text: t('Your own races stay. You can make the sample again under Trips › Races.') })) !== 'delete') return;
    const before = await snapshot();
    await deleteWithUndo({
      run: async () => {
        location.hash = '#/race';
        await db.trips.delete(SAMPLE_ID);
        await putRace(SAMPLE_ID, null);
      },
      undo: () => restore(before),
      text: t('Sample race deleted.'),
      name: t('Sample race 1000'),
    });
  }
</script>

<div class="rc-sample" data-race-sample>
  <p><b>{t('Sample race')}</b>: {t('every place and number is made up, to try things out. Change anything: Reset makes it new again.')}</p>
  <p class="rc-note"><Pencil size={14} aria-hidden="true" /> {t('The pencil marks what you can change.')}</p>
  <div class="rc-acts">
    <button type="button" class="btn sm hi" onclick={() => startTour('race')} data-sample-tour><Play size={16} aria-hidden="true" />{t('Show me around')}</button>
    <button type="button" class="btn sm" onclick={reset} data-sample-reset><RotateCcw size={16} aria-hidden="true" />{t('Reset the sample')}</button>
    <button type="button" class="btn sm del" onclick={remove} data-sample-delete><Trash2 size={16} aria-hidden="true" />{t('Delete the sample')}</button>
  </div>
</div>

<style>
  .rc-sample {
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--hi-soft);
    border: 2px solid var(--hi);
  }
  .rc-sample p {
    margin: 0;
  }
</style>
