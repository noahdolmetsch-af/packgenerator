// Google Mail (GM): the pure helpers of api/_lib/googlemail.js. Fictional addresses only.
import { describe, it, expect } from 'vitest';
import { personOf, htmlText, addresses, encodeHeader, rawMail, fromB64url, mailRow } from '../api/_lib/googlemail.js';

describe('mail helpers', () => {
  it('reads a sender', () => {
    expect(personOf('"Muster, Anna" <anna@example.test>')).toEqual({ name: 'Muster, Anna', email: 'anna@example.test' });
    expect(personOf('anna@example.test')).toEqual({ name: 'anna@example.test', email: 'anna@example.test' });
  });
  it('turns HTML into text', () => {
    expect(htmlText('<div>Hallo<br>Welt</div><script>x()</script><p>A &amp; B</p>')).toBe('Hallo\nWelt\nA & B');
  });
  it('checks addresses', () => {
    expect(addresses('a@example.test; Anna <b@example.test>')).toEqual(['a@example.test', 'Anna <b@example.test>']);
    expect(() => addresses('a@example.test, nope')).toThrow('address');
  });
  it('builds a UTF-8 message', () => {
    expect(encodeHeader('Hallo')).toBe('Hallo');
    expect(encodeHeader('Grüezi')).toMatch(/^=\?UTF-8\?B\?/);
    const raw = fromB64url(rawMail({ to: 'a@example.test', subject: 'Test', text: 'Zeile 1\nZeile 2' }));
    expect(raw.split('\r\n\r\n')[0]).toContain('Content-Type: text/plain; charset=UTF-8');
    expect(Buffer.from(raw.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString('utf8')).toBe('Zeile 1\r\nZeile 2');
    expect(() => rawMail({ to: '', text: 'x' })).toThrow('to');
  });
  it('a message without id is no row; no subject gets a placeholder', () => {
    expect(mailRow({})).toBeNull();
    expect(mailRow({ id: 'x', payload: { headers: [] } }).subject).toBe('(kein Betreff)');
  });
});
