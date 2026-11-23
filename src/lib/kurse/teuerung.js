/**
 * «Kursblick» Teuerung (Noah 22.11.2026 «alles davon»; Bauplan K15): gold in the francs of another year. The series «lik» comes
 * from the server (api/lake.js ?action=kurse&id=lik): one value a year of the Swiss consumer prices, put on 1 July of the year
 * (a year's average lies in its middle). Between two years the index is drawn as a straight line; after the last year it stays
 * at the last value, and the screen says so (an estimate). Pure, tested in tests/kurse-teuerung.test.js.
 * Days are calendar days (YYYY-MM-DD), counted with Date.UTC, never with milliseconds from the clock.
 */

const utc = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));

/** The index on a day. points: [[day, index], …] ascending. → { wert, geschaetzt } (geschaetzt: the day lies after the last value) or null. */
export function indexAm(points, day) {
  if (!points?.length) return null;
  const first = points[0];
  const last = points[points.length - 1];
  if (day <= first[0]) return { wert: first[1], geschaetzt: false };
  if (day >= last[0]) return { wert: last[1], geschaetzt: day > last[0] };
  let i = 1;
  while (points[i][0] < day) i++;
  const [d0, v0] = points[i - 1];
  const [d1, v1] = points[i];
  const f = (utc(day) - utc(d0)) / (utc(d1) - utc(d0));
  return { wert: v0 + (v1 - v0) * f, geschaetzt: false };
}

/**
 * A price series in the francs of a year: every price × (index of the year's middle ÷ index of its day), from 1 January of the
 * year on. → { punkte: [[day, real]], von: first day, real: change in % from the first to the last, nominal: the same without
 * the rise of prices, bisJahr: the year of the last index value, geschaetzt: the last days use the last index value } or null
 * when the series starts after the year or no index is known.
 */
export function realReihe(points, index, jahr) {
  if (!points?.length || !index?.length) return null;
  const start = `${jahr}-01-01`;
  const ab = points.filter((p) => p[0] >= start);
  if (ab.length < 2) return null;
  const basis = indexAm(index, `${jahr}-07-01`)?.wert;
  if (!(basis > 0)) return null;
  const punkte = ab.map(([d, v]) => [d, Math.round(((v * basis) / indexAm(index, d).wert) * 100) / 100]);
  const pct = (a, b) => (a ? (b / a - 1) * 100 : 0);
  const lastIdx = index[index.length - 1][0];
  return {
    punkte,
    von: ab[0][0],
    real: pct(punkte[0][1], punkte[punkte.length - 1][1]),
    nominal: pct(ab[0][1], ab[ab.length - 1][1]),
    bisJahr: Number(lastIdx.slice(0, 4)),
    geschaetzt: ab[ab.length - 1][0] > lastIdx,
  };
}

/** The years the person can choose: from the first year of the series (a year it starts in is whole only if it starts on 1 January) up to last year. */
export function jahre(points, heuteJahr) {
  if (!points?.length) return [];
  const first = Number(points[0][0].slice(0, 4));
  const from = points[0][0] > `${first}-01-10` ? first + 1 : first;
  const out = [];
  for (let y = from; y < heuteJahr; y++) out.push(y);
  return out;
}

/** The year offered first: twenty years back, but not before the series. */
export const standardJahr = (liste, heuteJahr) => (liste.length ? Math.max(liste[0], Math.min(liste[liste.length - 1], heuteJahr - 20)) : heuteJahr - 1);
