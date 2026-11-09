import { describe, it, expect } from 'vitest';
import { confirmSetting, confirmMessage, confirmSubject, CONFIRM_MAX } from '../src/lib/booking/confirm.js';
import { contactHref } from '../src/lib/booking/model.js';

const tr = (s, p = {}) => s.replace(/\{(\w+)\}/g, (a, k) => (k in p ? p[k] : a));
const v = { name: 'Mia', title: 'Tennis lesson', when: 'Mon 12 Nov · 17:00', place: 'Mythenquai', hours: 24, meet: 'at the club house', pickup: 'at the court', rain: 'I write you by 14:00' };

describe('Bestätigung: Einstellung und Text', () => {
  it('has three empty lines by default and keeps them short and trimmed', () => {
    expect(confirmSetting()).toEqual({ meet: '', pickup: '', rain: '' });
    expect(confirmSetting({ meet: '  a  ', pickup: 5, rain: null })).toEqual({ meet: 'a', pickup: '', rain: '' });
    expect(confirmSetting({ meet: 'x'.repeat(500) }).meet).toHaveLength(CONFIRM_MAX);
  });
  it('names the lesson, the place, the three lines and the cancel rule, in that order', () => {
    const m = confirmMessage(v, tr);
    const order = ['Hello Mia! The lesson is booked: Tennis lesson on Mon 12 Nov · 17:00.', 'Place: Mythenquai.', 'Meeting point: at the club house.', 'Pick-up: at the court.', 'If it rains: I write you by 14:00.', 'up to 24 h before', 'See you then!'];
    let at = -1;
    for (const part of order) {
      const i = m.indexOf(part);
      expect(i, part).toBeGreaterThan(at);
      at = i;
    }
  });
  it('leaves out every line that is empty', () => {
    const m = confirmMessage({ ...v, place: '', hours: null, meet: '', pickup: '', rain: '' }, tr);
    expect(m).toBe('Hello Mia! The lesson is booked: Tennis lesson on Mon 12 Nov · 17:00. See you then!');
    expect(confirmMessage({ ...v, meet: '', pickup: '' }, tr)).toContain('If it rains');
    expect(confirmMessage({ ...v, meet: '', pickup: '' }, tr)).not.toContain('Meeting point');
  });
  it('a wish request with a price table names the price per child right after the lesson', () => {
    const m = confirmMessage({ ...v, perKid: '72.-' }, tr);
    expect(m).toContain('on Mon 12 Nov · 17:00. Price: CHF 72.- per child. Place: Mythenquai.');
    expect(confirmMessage({ ...v, perKid: '' }, tr)).not.toContain('Price');
  });
  it('the e-mail has a subject, an SMS none', () => {
    expect(confirmSubject(v, tr)).toBe('Confirmed: Tennis lesson, Mon 12 Nov · 17:00');
    expect(contactHref('mia@example.test', 'Hi', confirmSubject({ title: 'T', when: 'W' }, tr))).toBe('mailto:mia@example.test?subject=Confirmed%3A%20T%2C%20W&body=Hi');
    expect(contactHref('079 000 00 00', 'Hi', 'S')).toBe('sms:0790000000?body=Hi');
  });
});
