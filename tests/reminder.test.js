import { describe, it, expect } from 'vitest';
import { reminderSetting, fillReminder, reminderMessage, reminderSubject } from '../src/lib/booking/reminder.js';
import { contactHref } from '../src/lib/booking/model.js';

const tr = (s, p = {}) => s.replace(/\{(\w+)\}/g, (a, k) => (k in p ? p[k] : a));
const v = { name: 'Mia', title: 'Tennis lesson', day: 'tomorrow', time: '17:00', place: 'Mythenquai', hours: 24 };

describe('Erinnerung: Einstellung und Text', () => {
  it('is on by default, with the ready text', () => {
    expect(reminderSetting()).toEqual({ on: true, text: '' });
    expect(reminderSetting({ on: false, text: 'x' })).toEqual({ on: false, text: 'x' });
    expect(reminderSetting({ text: 5 })).toEqual({ on: true, text: '' });
  });
  it('the ready text names the lesson, the place and the cancel rule', () => {
    const m = reminderMessage(v, tr);
    expect(m).toContain('Hello Mia! A reminder: Tennis lesson tomorrow at 17:00.');
    expect(m).toContain('Place: Mythenquai.');
    expect(m).toContain('up to 24 h before');
    expect(m.endsWith('See you then!')).toBe(true);
  });
  it('leaves out the place and the rule when there are none', () => {
    const m = reminderMessage({ ...v, place: '', hours: null }, tr);
    expect(m).not.toContain('Place:');
    expect(m).not.toContain('cancel');
    expect(m).not.toContain('up to');
  });
  it('an own text is filled in, English or German words, unknown words stay', () => {
    expect(fillReminder('Hi {name}, {title} {day} {time} at {place}, {hours} h', v)).toBe('Hi Mia, Tennis lesson tomorrow 17:00 at Mythenquai, 24 h');
    expect(fillReminder('Hoi {Name}, {Angebot} {Tag} {Zeit} {ORT} {stunden} {foo}', v)).toBe('Hoi Mia, Tennis lesson tomorrow 17:00 Mythenquai 24 {foo}');
    expect(reminderMessage({ ...v, text: ' Hi {name}! ' })).toBe('Hi Mia!');
    expect(reminderMessage({ ...v, text: '   ' }, tr)).toContain('A reminder');
  });
  it('the e-mail has a subject, an SMS none', () => {
    expect(reminderSubject(v, tr)).toBe('Reminder: Tennis lesson tomorrow at 17:00');
    const mail = contactHref('mia@example.test', 'Hi there', 'Reminder: x');
    expect(mail).toBe('mailto:mia@example.test?subject=Reminder%3A%20x&body=Hi%20there');
    expect(contactHref('mia@example.test', 'Hi')).toBe('mailto:mia@example.test?body=Hi');
    expect(contactHref('079 000 00 00', 'Hi', 'S')).toBe('sms:0790000000?body=Hi');
  });
});
