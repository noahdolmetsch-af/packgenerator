// Flyer für Tennisstunden (Noah 07.11.2026 «ok Flyer», «modular ja»): Bausteine, Texte aus dem Angebot, Stufen, Foto, Mail.
import { describe, it, expect } from 'vitest';
import { DEVICE_SETTINGS } from '../src/lib/db.js';
import {
  PHOTO_KEY, cleanQrUrl, ARTS, BLOCKS, FORMATS, newConfig, normalizeConfig, step, stepBlock, dragBlock, movable, levelFromOffer, weekdayOf, addMinutes, parsePrice, priceText, rangeText, WORDS,
  buildModel, variantsOf, countImages, fileNameOf, mailText, mailtoHref, emailsOf, photoRect, emptyPhotos, addPhoto, removePhoto, currentPhoto, templateFrom, applyTemplate, MAX_PHOTOS,
} from '../src/lib/booking/flyer.js';

const offer = (o = {}) => ({
  id: 'abc123',
  offer: {
    id: 'abc123', kind: 'tennis', title: 'Unterstufe', place: 'Tennisplätze Musterdorf', venues: [], minutes: 90,
    types: [{ key: 'g', label: 'Gruppe', places: 6, price: 14000 }],
    slots: [{ id: 's1', at: '2026-08-20T15:45' }, { id: 's2', at: '2026-08-27T15:45' }, { id: 's3', at: '2026-09-10T15:45' }],
    ...o,
  },
});
const TODAY = '2026-08-01';

describe('flyer config', () => {
  it('has the four kinds and three formats', () => {
    expect(ARTS.map((a) => a.key)).toEqual(['group', 'trial', 'holiday', 'single']);
    expect(FORMATS.map((f) => f.key)).toEqual(['169', 'a4', 'sq']);
  });
  it('a new config has all blocks, only the first ones on', () => {
    const c = newConfig('single');
    expect(c.blocks.map((b) => b.id)).toEqual(BLOCKS.map((b) => b.id));
    expect(c.blocks.find((b) => b.id === 'levels').on).toBe(false);
    expect(c.blocks.find((b) => b.id === 'cta').on).toBe(true);
  });
  it('normalizeConfig fills up what is missing and keeps what is there', () => {
    const c = normalizeConfig({ art: 'trial', blocks: [{ id: 'cta', on: false }, { id: 'title', on: true }], langs: ['xx'] });
    expect(c.blocks.map((b) => b.id).slice(0, 2)).toEqual(['cta', 'title']);
    expect(c.blocks).toHaveLength(BLOCKS.length);
    expect(c.langs).toEqual(['de']);
    expect(normalizeConfig(null).art).toBe('group');
  });
});

describe('moving blocks', () => {
  it('step moves one place and stops at the ends', () => {
    const l = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(step(l, 'a', 1).map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(step(l, 'a', -1)).toBe(l);
    expect(step(l, 'c', 1)).toBe(l);
  });
  it('the header, photo and band keep their place; the others move', () => {
    const c = newConfig('group');
    const next = stepBlock(c.blocks, 'table', 1);
    expect(next.map((b) => b.id)).toEqual(['top', 'photo', 'title', 'levels', 'table', 'cards', 'trainer', 'free', 'cta']);
    const dragged = dragBlock(c.blocks, 0, 3);
    expect(dragged[0].id).toBe('top');
    expect(dragged[8].id).toBe('cta');
    expect(movable(c.blocks).map((b) => b.id)).toEqual(['title', 'table', 'levels', 'cards', 'trainer', 'free']);
    expect(dragged.filter((b) => movable([b]).length).map((b) => b.id)).toEqual(['table', 'levels', 'cards', 'title', 'trainer', 'free']);
  });
});

describe('levels from an offer', () => {
  it('takes weekday, time, place and price from the next time', () => {
    const l = levelFromOffer(offer(), TODAY);
    expect(l.name).toBe('Unterstufe');
    expect(l.day).toBe(weekdayOf('2026-08-20')); // Thursday
    expect(l.day).toBe(3);
    expect(l.time).toBe('15:45–17:15');
    expect(l.place).toBe('Tennisplätze Musterdorf');
    expect(l.price).toBe('140');
    expect(l.offerId).toBe('abc123');
  });
  it('a slot with its own place wins', () => {
    expect(levelFromOffer(offer({ slots: [{ id: 'x', at: '2026-08-20T16:00', venue: 'Halle' }] }), TODAY).place).toBe('Halle');
  });
  it('an offer without times gives empty day and time', () => {
    const l = levelFromOffer(offer({ slots: [] }), TODAY);
    expect(l.day).toBe('');
    expect(l.time).toBe('');
  });
  it('small helpers', () => {
    expect(addMinutes('23:30', 90)).toBe('23:59');
    expect(parsePrice('62,5')).toBe(62.5);
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(priceText([{ price: '140' }, { price: '160' }], WORDS.de)).toBe('CHF 140–160');
    expect(priceText([{ price: '0' }], WORDS.en)).toBe('free');
    expect(rangeText(['2026-08-20', '2026-09-10'], WORDS.de)).toMatch(/20\. Aug.* – 10\. Sept.* 2026/);
    expect(rangeText([], WORDS.de)).toBe('');
  });
});

describe('the content of one picture', () => {
  const entries = [offer()];
  const cfg = () => {
    const c = newConfig('group');
    c.offerId = 'abc123';
    c.levels = [levelFromOffer(entries[0], TODAY)];
    return c;
  };
  it('fills the table from the offer and the title from the kind', () => {
    const m = buildModel(cfg(), entries, 'de', { today: TODAY });
    expect(m.title).toBe('Tennis Unterricht');
    expect(m.rows.map((r) => r[0])).toEqual(['Wann', 'Uhrzeit', 'Wo', 'Dauer']);
    expect(m.rows[0][1]).toBe('Donnerstag');
    expect(m.rows[1][1]).toBe('15:45–17:15');
    expect(m.cards.find((c) => c.label === 'Kosten').text).toBe('CHF 140');
    expect(m.url).toBe('https://noahdolmetsch-af.github.io/packgenerator/buchen/#abc123');
    expect(m.shortUrl.startsWith('noahdolmetsch-af.github.io')).toBe(true);
  });
  it('English has its own words and title', () => {
    const m = buildModel(cfg(), entries, 'en', { today: TODAY });
    expect(m.title).toBe('Tennis Lessons');
    expect(m.rows[0][0]).toBe('When');
    expect(m.rows[0][1]).toBe('Thursday');
    expect(m.button).toBe('Register now');
  });
  it('texts the person wrote win over the offer, per language', () => {
    const c = cfg();
    c.texts.de.title = 'Tennis für Kinder';
    c.texts.de.where = 'Platz 3';
    expect(buildModel(c, entries, 'de', { today: TODAY }).title).toBe('Tennis für Kinder');
    expect(buildModel(c, entries, 'de', { today: TODAY }).rows.find((r) => r[0] === 'Wo')[1]).toBe('Platz 3');
    expect(buildModel(c, entries, 'en', { today: TODAY }).title).toBe('Tennis Lessons');
  });
  it('a switched-off block or row does not appear', () => {
    const c = cfg();
    c.rows.time = false;
    c.blocks = c.blocks.map((b) => (b.id === 'cards' ? { ...b, on: false } : b));
    const m = buildModel(c, entries, 'de', { today: TODAY });
    expect(m.rows.map((r) => r[0])).toEqual(['Wann', 'Wo', 'Dauer']);
    expect(m.order).not.toContain('cards');
  });
  it('blocks without content stay out (no trainer text, no deadline)', () => {
    const c = cfg();
    c.blocks = c.blocks.map((b) => (b.id === 'trainer' ? { ...b, on: true } : b));
    expect(buildModel(c, entries, 'de', { today: TODAY }).order).not.toContain('trainer');
    c.texts.de.trainerText = 'Seit 10 Jahren auf dem Platz.';
    expect(buildModel(c, entries, 'de', { today: TODAY }).order).toContain('trainer');
    expect(buildModel(c, entries, 'de', { today: TODAY }).order).not.toContain('free');
    c.deadline = '2026-07-31';
    c.spots = '4';
    const m = buildModel(c, entries, 'de', { today: TODAY });
    expect(m.chips.map((x) => x.text)).toEqual(['Anmeldeschluss 31. Juli', 'Noch 4 Plätze']);
  });
  it('own cards and own texts come along', () => {
    const c = cfg();
    c.ownCards = [{ id: 'k', label: 'Parkplatz', text: 'Beim Tor', on: true }, { id: 'j', label: 'Aus', text: 'x', on: false }];
    c.custom = [{ id: 't', title: 'Hinweis', text: 'Bitte pünktlich.', on: true }];
    const m = buildModel(c, entries, 'de', { today: TODAY });
    expect(m.cards.map((x) => x.label)).toContain('Parkplatz');
    expect(m.cards.map((x) => x.label)).not.toContain('Aus');
    expect(m.extra).toHaveLength(1);
  });
  it('one flyer per level: each picture has only its level and its own link', () => {
    const entries2 = [offer(), offer({ title: 'Mittelstufe', id: 'zzz999' })];
    entries2[1].id = 'zzz999';
    const c = cfg();
    c.levels = entries2.map((e) => levelFromOffer(e, TODAY));
    c.oneEach = true;
    const vs = variantsOf(c);
    expect(vs.map((v) => v.name)).toEqual(['Unterstufe', 'Mittelstufe']);
    const m = buildModel(c, entries2, 'de', { variant: c.levels[1].id, today: TODAY });
    expect(m.url.endsWith('#zzz999')).toBe(true);
    expect(buildModel(c, entries2, 'de', { today: TODAY }).url.endsWith('#abc123')).toBe(true);
    expect(countImages({ ...c, langs: ['de', 'en'] })).toBe(2 * 2 * 3);
    expect(countImages({ ...c, oneEach: false })).toBe(3);
  });
  it('file names', () => {
    const m = buildModel(cfg(), entries, 'de', { today: TODAY });
    expect(fileNameOf(m, 'a4', 'Unterstufe')).toBe('tennis-unterricht-unterstufe-a4-de.png');
    expect(fileNameOf(m, 'sq')).toBe('tennis-unterricht-sq-de.png');
  });
});

describe('the prepared mail', () => {
  const entries = [offer()];
  const c = newConfig('group');
  c.offerId = 'abc123';
  c.levels = [levelFromOffer(entries[0], TODAY)];
  const m = buildModel(c, entries, 'de', { today: TODAY });
  it('has a subject and the sign-up link, and puts everybody in Bcc', () => {
    const mt = mailText(m);
    expect(mt.subject).toBe('Tennis Unterricht: Anmeldung');
    expect(mt.body).toContain('Hier kannst du dich anmelden: https://noahdolmetsch-af.github.io/packgenerator/buchen/#abc123');
    expect(mt.body).toContain('Wann: Donnerstag');
    const href = mailtoHref(mt, ['a@example.org', 'b@example.org', 'a@example.org']);
    expect(href.startsWith('mailto:?subject=')).toBe(true);
    expect(decodeURIComponent(href.split('bcc=')[1])).toBe('a@example.org,b@example.org');
    expect(mailtoHref(mt, [])).not.toContain('bcc=');
  });
  it('takes only real e-mail addresses from the customers', () => {
    expect(emailsOf([{ contact: 'a@example.org' }, { contact: '079 123 45 67' }, { contact: ' b@example.org ' }, {}])).toEqual(['a@example.org', 'b@example.org']);
  });
});

describe('the photo', () => {
  it('cuts out the part that fills the box, around the focus', () => {
    const full = photoRect(4000, 3000, 1600, 900);
    expect(full.sw / full.sh).toBeCloseTo(1600 / 900, 3);
    expect(full.sw).toBeCloseTo(4000, 0);
    const zoom = photoRect(4000, 3000, 1600, 900, 0.5, 0.5, 2);
    expect(zoom.sw).toBeCloseTo(2000, 0);
    expect(photoRect(4000, 3000, 1600, 900, 0, 0, 2).sx).toBe(0);
    expect(photoRect(4000, 3000, 1600, 900, 1, 1, 2).sx + photoRect(4000, 3000, 1600, 900, 1, 1, 2).sw).toBeCloseTo(4000, 0);
  });
  it('keeps at most six photos, the newest is current, removing works', () => {
    let s = emptyPhotos();
    for (let i = 0; i < 8; i++) s = addPhoto(s, `data:${i}`);
    expect(s.items).toHaveLength(MAX_PHOTOS);
    expect(currentPhoto(s).src).toBe('data:7');
    const first = s.items[0];
    s = removePhoto(s, currentPhoto(s).id);
    expect(currentPhoto(s).src).toBe('data:6');
    expect(removePhoto(s, first.id).items).toHaveLength(MAX_PHOTOS - 2);
    expect(currentPhoto(emptyPhotos())).toBeNull();
  });
});

describe('templates', () => {
  it('keeps blocks and texts, but not the offer links; applying keeps the levels', () => {
    const c = newConfig('group');
    c.levels = [levelFromOffer(offer(), TODAY)];
    c.texts.de.audience = 'Primarschule';
    c.blocks = c.blocks.map((b) => (b.id === 'trainer' ? { ...b, on: true } : b));
    const tpl = templateFrom('Standard', c);
    expect(tpl.config.levels[0].offerId).toBeNull();
    const target = newConfig('trial');
    target.levels = [levelFromOffer(offer({ title: 'Andere' }), TODAY)];
    target.deadline = '2026-07-01';
    const applied = applyTemplate(target, tpl);
    expect(applied.texts.de.audience).toBe('Primarschule');
    expect(applied.blocks.find((b) => b.id === 'trainer').on).toBe(true);
    expect(applied.levels[0].name).toBe('Andere');
    expect(applied.deadline).toBe('2026-07-01');
  });
});

describe('the photo stays on this device', () => {
  it('is a device setting: not in a backup and not synced', () => {
    expect(DEVICE_SETTINGS).toContain(PHOTO_KEY);
  });
});

describe('where the QR code leads (Noah 10.11.2026)', () => {
  const entries = [offer()];
  const cfg = (qrUrl) => {
    const c = newConfig('group');
    c.offerId = 'abc123';
    c.levels = [levelFromOffer(entries[0], TODAY)];
    if (qrUrl !== undefined) c.qrUrl = qrUrl;
    return c;
  };
  it('turns what the user typed into a web address, or into nothing', () => {
    expect(cleanQrUrl('tennisnoah.pages.dev/f')).toBe('https://tennisnoah.pages.dev/f');
    expect(cleanQrUrl('  https://example.ch/f?x=1 ')).toBe('https://example.ch/f?x=1');
    expect(cleanQrUrl('http://example.ch')).toBe('http://example.ch/');
    for (const bad of ['', '   ', 'kein link', 'javascript:alert(1)', 'ftp://example.ch', 'localhost', 'https://x', null, undefined]) expect(cleanQrUrl(bad)).toBe('');
    expect(cleanQrUrl(`https://example.ch/${'a'.repeat(300)}`)).toBe('');
  });
  it('leads to the sign-up page of the offer unless an own address is set', () => {
    expect(buildModel(cfg(), entries, 'de', { today: TODAY }).url).toContain('/buchen/#abc123');
    const m = buildModel(cfg('tennisnoah.pages.dev/f'), entries, 'de', { today: TODAY });
    expect(m.url).toBe('https://tennisnoah.pages.dev/f');
    expect(m.shortUrl).toBe('tennisnoah.pages.dev/f');
    expect(buildModel(cfg('kein link'), entries, 'de', { today: TODAY }).url).toContain('/buchen/#abc123');
  });
  it('keeps the address in a saved configuration and gives an old one an empty address', () => {
    expect(normalizeConfig({ art: 'group', qrUrl: 'a.ch/x' }).qrUrl).toBe('a.ch/x');
    expect(normalizeConfig({ art: 'group' }).qrUrl).toBe('');
    expect(newConfig().qrUrl).toBe('');
  });
});
