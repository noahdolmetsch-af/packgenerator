// «Das Logo zieht sich der Jahreszeit an» (Noah 03.11.2026, Idee 30, umgebaut nach «D und C nachdem das geheime Menü
// aktiviert wurde»): the logo stays plain «PG» until the secret of the logo (five quick taps, Idee 29) was found. Then
// it becomes the bike sign with a bit of the season (C), and Ich › Darstellung offers three logos: «PG», «PG with a
// seasonal extra» (D) and the bike sign (C). Pure part, tested in tests/logo.test.js.

export const LOGO_KEY = 'pg.logo';
export const UNLOCK_KEY = 'pg.logo.unlocked';

/** The logos to choose from (names are English keys for t()). */
export const LOGOS = [
  { key: 'plain', name: 'PG|logo' },
  { key: 'hat', name: 'PG with a seasonal extra' },
  { key: 'bike', name: 'Bike sign' },
];
export const DEFAULT_LOGO = 'plain';
export const logoOf = (v) => (LOGOS.some((l) => l.key === v) ? v : DEFAULT_LOGO);

/**
 * What happens when the secret is found: { unlocked, pick, first } from the stored values.
 * The first time the new logo is the bike sign (C); later the choice stays as it is.
 */
export function afterSecret(unlockedStored, pickStored) {
  const first = unlockedStored !== '1';
  return { unlocked: true, pick: first ? 'bike' : logoOf(pickStored), first };
}
