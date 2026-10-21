/**
 * Hosts the app may ask without anything of yours: the weather (Open-Meteo) and, since 0.171 on Heute,
 * the Zürisee value (our own /api/lake, else the public sources). Tests that check «nothing sent» leave
 * these out. Read from the app source, not copied.
 */
import { LAKE_URL } from '../../src/lib/lake.js';
import { TECDOTTIR_BASES, ALPLAKES_BASE } from '../../api/_lib/lake.js';

export const PUBLIC_DATA = ['https://api.open-meteo.com/', new URL(LAKE_URL).origin + new URL(LAKE_URL).pathname, ...TECDOTTIR_BASES.map((b) => `${b}/`), `${ALPLAKES_BASE}/`];

/** The requests that are not public weather or lake data. */
export const sentOut = (out) => out.filter((u) => !PUBLIC_DATA.some((p) => u.startsWith(p)));
