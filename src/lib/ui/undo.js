/**
 * «Rückgängig» stays the same 8 seconds everywhere (Noah 23.11.2026 «1-5a», before: 4 s, Ü4a 15.10.2026).
 * One place for every note with «Undo»: ui/rename.svelte.js (offerDone), the notes of the flow pages (flow/ui.svelte.js),
 * review, trip, gear and search notes all read this constant. A note stops its time while a finger or the mouse is on it or
 * it has the focus (rename.svelte.js pauseToast / resumeToast). A note without «Undo» may stay longer.
 */
export const UNDO_MS = 8000;
