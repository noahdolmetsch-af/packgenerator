<script>
  /**
   * Paket M «Aus Touren lernen»: what the debrief of one trip gets from this package, in one place
   * (so Debrief.svelte only mounts this): the Tour-Tagebuch, «Was war neu?», the extra questions and
   * the message to your future self.
   */
  import Tagebuch from './Tagebuch.svelte';
  import Zusatzfragen from './Zusatzfragen.svelte';
  import Zukunft from './Zukunft.svelte';

  /** trip, d (the debrief state), persist (saves d), notes (tripNotes), rides (db.rides of the trip) */
  let { trip, d, persist, notes = [], rides = [] } = $props();

  // «Was war neu?» for the diary draft: loaded lazily (the Neuland data stays out of the main file);
  // null while loading, so the draft waits for it.
  let neu = $state.raw(null);
  $effect(() => {
    const id = trip?.id;
    let live = true;
    neu = null;
    Promise.all([import('../db.js'), import('../neuland/store.js'), import('../neuland/neuland.js')])
      .then(([{ db }, store, nl]) => store.computeNeuland(db).then((r) => nl.newOnTrip(id, r)))
      .then((list) => live && (neu = list.map((x) => x.label)))
      .catch(() => live && (neu = []));
    return () => (live = false);
  });
</script>

<div class="m-lernen" data-lernen>
  <Tagebuch {trip} {d} {persist} {notes} {rides} {neu} />
  {#await import('../neuland/WasNeu.svelte') then m}<m.default tripId={trip.id} />{/await}
  <Zusatzfragen {trip} {d} {persist} {rides} />
  <Zukunft {d} {persist} />
</div>
