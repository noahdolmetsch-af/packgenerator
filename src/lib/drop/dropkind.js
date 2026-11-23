/**
 * «Datei auf das Fenster ziehen» (Noah 23.11.2026 «3a»): which kind of file was dropped on the window of the app, and where it goes.
 * The same split as the share target of the phone (public/share-target.js): a GPX/TCX with times is a ride, a GPX without times a planned
 * route (komoot), a backup (.json) goes to «Check import», photos and PDFs go to Documents. Pure apart from reading the text of a GPX
 * (the reader is passed in, so the tests need no browser).
 */
import { sharedKind } from '../komoot.js';

export const DROP_MAX_MB = 40; // the same limit as the ride upload (gpx.js RIDE_MAX_MB)
export const DOCS_MAX = 30; // the same as the share target

const ext = (f) => (String(f?.name ?? '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '');
const isDoc = (f) => /^image\//.test(f?.type ?? '') || ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext(f)) || f?.type === 'application/pdf';
const isBackup = (f) => ext(f) === 'json' || f?.type === 'application/json';
const isRide = (f) => ['gpx', 'tcx'].includes(ext(f)) || /gpx|tcx/.test(f?.type ?? '');

/** 'ride' | 'route' | 'backup' | 'doc' | 'none' for one file. */
export async function kindOf(file, read = (f) => f.text()) {
  if (isBackup(file)) return 'backup';
  if (isRide(file)) {
    if (ext(file) === 'tcx' || (file.size ?? 0) > DROP_MAX_MB * 1024 * 1024) return 'ride'; // too big to look into: the ride upload says why
    try {
      return sharedKind(await read(file)) === 'route' ? 'route' : 'ride';
    } catch {
      return 'ride';
    }
  }
  if (isDoc(file)) return 'doc';
  return 'none';
}

/**
 * What the sheet offers for a drop: { kind, files, left } with kind 'ride' | 'route' | 'backup' | 'doc' | 'none'.
 * Photos and PDFs together go to Documents (up to 30); otherwise only the first file that fits is taken, `left` counts the others.
 */
export async function planDrop(files = [], read) {
  const list = [...files];
  if (!list.length) return { kind: 'none', files: [], left: 0 };
  const kinds = [];
  for (const f of list) kinds.push(await kindOf(f, read));
  if (kinds.every((k) => k === 'doc')) {
    const take = list.slice(0, DOCS_MAX);
    return { kind: 'doc', files: take, left: list.length - take.length };
  }
  const at = kinds.findIndex((k) => k !== 'none');
  if (at < 0) return { kind: 'none', files: [list[0]], left: list.length - 1 };
  return { kind: kinds[at], files: [list[at]], left: list.length - 1 };
}

/** Where the choice leads (the same addresses as the share target of the phone). */
export const DROP_GO = { ride: '#/debrief/ride/shared', route: '#/komoot/shared', backup: '#/me/data?shared=backup', doc: '#/me/docs/scan?shared=1' };

/** The page part of an address (no «?…»), to see whether the target page is the one already open. */
export const pageOfHash = (h) => String(h ?? '').split('?')[0];
