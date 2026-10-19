<script>
  /**
   * Paket M «Aus Touren lernen»: what the debrief of one trip gets from this package, in one place
   * (so Debrief.svelte only mounts this): the Tour-Tagebuch, «Was war neu?», the extra questions and
   * the message to your future self.
   */
  import Tagebuch from './Tagebuch.svelte';

  /** trip, d (the debrief state), persist (saves d), notes (tripNotes), rides (db.rides of the trip) */
  let { trip, d, persist, notes = [], rides = [] } = $props();
</script>

<div class="m-lernen" data-lernen>
  <Tagebuch {trip} {d} {persist} {notes} {rides} />
</div>
