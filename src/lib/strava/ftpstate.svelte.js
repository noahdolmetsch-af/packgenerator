/**
 * Die eigene FTP (Strava check 21.10.2026: the app used an estimate of 180 W, Noah's FTP on Strava is 255 W, so
 * IF, TSS, the power zones and the load were all off). The FTP in use, live for every page:
 *   1. own: typed in by the person (Training › FTP), wins;
 *   2. strava: the FTP of the Strava profile, fetched with the bikes;
 *   3. otherwise the estimate from the best 20 minutes (training.js ftpEstimate).
 * No imports here, so training.js and review/power.js can read it without a loop.
 */
export const ftpFixed = $state({ own: null, strava: null });

/** The FTP that is fixed (own first, then Strava's), or null: then the estimate counts. */
export const fixedFtp = () => {
  const w = Number(ftpFixed.own) > 0 ? Number(ftpFixed.own) : Number(ftpFixed.strava) > 0 ? Number(ftpFixed.strava) : null;
  return w ? Math.round(w) : null;
};
/** Where the FTP comes from: 'own' | 'strava' | 'estimate'. */
export const ftpSource = () => (Number(ftpFixed.own) > 0 ? 'own' : Number(ftpFixed.strava) > 0 ? 'strava' : 'estimate');
/** The words for the FTP in use (English source for t()). */
export const ftpLabel = () => ({ own: 'Your FTP', strava: 'FTP from Strava', estimate: 'FTP estimated' })[ftpSource()];
