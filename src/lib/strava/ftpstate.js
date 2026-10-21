/**
 * Die eigene FTP (Strava check 21.10.2026: the app used an estimate of 180 W, Noah's FTP on Strava is 255 W, so
 * IF, TSS, the power zones and the load were all off). The FTP in use, for every page:
 *   1. own: typed in by the person (Training › FTP, or the live map's data pages), wins;
 *   2. strava: the FTP of the Strava profile, fetched with the bikes;
 *   3. otherwise the estimate from the best 20 minutes (training.js ftpEstimate).
 * Plain JS (training.js is read by the Node tests too). ftp.svelte.js puts a live $state object into
 * ftpHolder.ref when the app starts, so pages that read the FTP follow a change.
 */
export const ftpHolder = { ref: { own: null, strava: null } };

/** The FTP that is fixed (own first, then Strava's), or null: then the estimate counts. */
export const fixedFtp = () => {
  const f = ftpHolder.ref;
  const w = Number(f.own) > 0 ? Number(f.own) : Number(f.strava) > 0 ? Number(f.strava) : null;
  return w ? Math.round(w) : null;
};
/** Where the FTP comes from: 'own' | 'strava' | 'estimate'. */
export const ftpSource = () => (Number(ftpHolder.ref.own) > 0 ? 'own' : Number(ftpHolder.ref.strava) > 0 ? 'strava' : 'estimate');
/** The words for the FTP in use (English source for t()). */
export const ftpLabel = () => ({ own: 'Your FTP', strava: 'FTP from Strava', estimate: 'FTP estimated' })[ftpSource()];
