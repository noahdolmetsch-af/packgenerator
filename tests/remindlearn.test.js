// Idee A2 «Erinnerung zur Zeit, wann du es machst»: the app learns when you open the evening-before check.
import { describe, it, expect } from 'vitest';
import { learnOf, noteEve, eveOffer, declineEve, middle, MAX_SAMPLES, MIN_SAMPLES } from '../src/lib/remindlearn/learn.js';
import de from '../src/lib/i18n/de/index.js';

const at = (h, m = 0) => h * 60 + m;
const three = [noteEve, noteEve, noteEve].reduce((v, f, i) => f(v, `2026-10-2${i}`, [at(21, 20), at(21, 40), at(21, 30)][i]), null);

describe('learning the evening time', () => {
  it('keeps the first time of each evening, only from 16:00, the newest 8', () => {
    let v = noteEve(null, '2026-10-20', at(21, 30));
    v = noteEve(v, '2026-10-20', at(22, 0)); // the same evening again: not counted
    v = noteEve(v, '2026-10-21', at(9, 0)); // morning: not the evening check
    expect(v.eve).toEqual([{ day: '2026-10-20', min: at(21, 30) }]);
    for (let d = 1; d <= 12; d++) v = noteEve(v, `2026-11-${String(d).padStart(2, '0')}`, at(20));
    expect(v.eve).toHaveLength(MAX_SAMPLES);
    expect(v.eve[0].day).toBe('2026-11-05');
    expect(learnOf('broken')).toEqual({ eve: [], no: {} });
  });
  it('offers the usual time minus 15 minutes from 3 evenings, only when it is 30 minutes away', () => {
    expect(MIN_SAMPLES).toBe(3);
    expect(eveOffer(noteEve(noteEve(null, '2026-10-20', at(21, 30)), '2026-10-21', at(21, 30)), at(19))).toBe(null);
    expect(middle([at(21, 20), at(21, 40), at(21, 30)])).toBe(at(21, 30));
    expect(eveOffer(three, at(19))).toEqual({ usual: at(21, 30), at: at(21, 15) });
    expect(eveOffer(three, at(21))).toBe(null); // 15 minutes away: no offer
  });
  it('«No, thanks» stops the same offer', () => {
    const v = declineEve(three, at(21, 15));
    expect(eveOffer(v, at(19))).toBe(null);
    expect(v.eve).toHaveLength(3);
  });
  it('has German for its words', () => {
    for (const k of ['You usually do the evening check at {usual}. Move the reminder to {at}?', 'Move it', 'No, thanks', 'The evening reminder now comes at {time}.', 'Reminder at your time']) expect(de[k], k).toBeTruthy();
  });
});
