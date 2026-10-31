/**
 * Velo-Idee 72: a new km reading that asks first when it jumps (kmgap.js, KmGapSheet.svelte).
 * saveReadingAsked(db, bike, total, opts) → 'saved' | 'rides' | 'again' (nothing saved: type again).
 */
import { mount, unmount } from 'svelte';
import KmGapSheet from './KmGapSheet.svelte';
import { kmGap } from '../kmgap.js';
import { setReading, addHand } from '../kmbookdb.js';
import { t } from '../i18n.svelte.js';

function askKmGap(bike, gap, total) {
  if (typeof document === 'undefined') return Promise.resolve({ how: 'reading' });
  return new Promise((resolve) => {
    const target = document.createElement('div');
    document.body.append(target);
    const comp = mount(KmGapSheet, {
      target,
      props: {
        bike,
        gap,
        total,
        ondone: (answer) => {
          resolve(answer);
          queueMicrotask(() => {
            unmount(comp);
            target.remove();
          });
        },
      },
    });
  });
}

// Enter and leaving the field can both save the same number: the second call waits for the first.
let pending = null;
export function saveReadingAsked(db, bike, total, opts = {}) {
  const key = `${bike.id}:${total}`;
  if (pending?.key === key) return pending.run;
  const run = saveOnce(db, bike, total, opts).finally(() => {
    if (pending?.run === run) pending = null;
  });
  pending = { key, run };
  return run;
}

async function saveOnce(db, bike, total, opts) {
  const entries = await db.kmBook.where('bikeId').equals(bike.id).toArray();
  const gap = kmGap(entries, bike.id, total);
  if (!gap) {
    await setReading(db, bike.id, total, opts);
    return 'saved';
  }
  const answer = await askKmGap(bike, gap, total);
  if (!answer) return 'again';
  if (answer.how === 'rides') {
    await addHand(db, { bikeId: bike.id, date: answer.date, km: gap.diff, kind: 'ride', name: t('Rides outside the app') }); // a name like one typed by hand: changeable in the ledger
    return 'rides';
  }
  await setReading(db, bike.id, total, opts);
  return 'saved';
}
