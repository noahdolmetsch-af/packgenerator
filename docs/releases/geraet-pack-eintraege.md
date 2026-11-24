# Geräte-Karte: drei Pack-Dateien ergänzt (Main wieder grün)

PR (offen) · 24.11.2026 · Reparatur zu #1514 «Warteliste ohne Datenänderung» und #1632 (Abgleich Handy/Computer)

## Was ist neu
- Nichts Sichtbares. `CalmPack.svelte`, `PackKarten.svelte` und `PackVorschlag.svelte` merken sich im Browser-Speicher einen Wunsch zwischen zwei Seiten (der Packschritt) und die zuletzt geöffnete Tour. Sie stehen jetzt in `GERAET_DATEIEN` (`src/lib/sync/geraet.js`), damit `tests/abgleich-karte.test.js` wieder grün ist.

## Was fällt weg oder rutscht tiefer
- nichts

## Beitrag zu den Hauptzielen
- **Klarheit und Auffindbarkeit:** main bleibt grün, damit die Änderungen ohne Stau online gehen.

## Selbst entschieden
- Art `laufend` für den Packschritt (ein Wunsch zwischen zwei Seiten) und für die Dateien, die ihn lesen oder setzen. Die zuletzt geöffnete Tour bleibt auf dem Gerät, wie «zuletzt geöffnet» bei den anderen Seiten; für sie gibt es in der Karte nur eine Art pro Datei, darum steht `PackVorschlag.svelte` ebenfalls als `laufend`.
- Die Tests bleiben, wie sie sind; geändert ist nur die Liste.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
