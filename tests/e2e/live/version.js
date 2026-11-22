// 21.11.2026: the check runs minutes after a merge, and the next merge may already be online by then («Ich zeigt die Version 0.975.1»,
// live showed 0.976.0 and 0.977.0: three false alarms with a mail in one day). A NEWER version than the one this run was started for is fine.
const parts = (v) => String(v).split('.').map(Number);
export const isNewerOrSame = (a, b) => {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  return true;
};
/** The version «Ich» shows («Version 0.976.0»), or '' when none is there yet. */
export const shownVersion = (text) => text.match(/Version v?(\d+\.\d+\.\d+)/)?.[1] ?? '';

