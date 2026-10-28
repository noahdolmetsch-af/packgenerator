# Die neue Version kommt schneller

PR #… · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Beheben alte Version auf Geräten»), Fragen 3 und 4

## Was ist neu
- 30 Sekunden nach dem Start fragt die App `version.json`. Ist dort eine neuere Version und sie ist noch nicht
  angekommen, lädt die App sich einmal frisch aus dem Internet (`src/lib/autofresh.js`, `freshreload.js`).
  Die Daten bleiben auf dem Gerät.
- Höchstens einmal pro Version (Merker `pg-autofresh`), damit ein Server, der kurz noch alte Dateien liefert,
  nie ein Dauer-Neuladen auslöst. Nie beim Tippen, nie während einer Fahrt (`holdreload.js`), nie im Hintergrund.
- Klappt es auch so nicht, kommt der Balken «Version … ist online» nach 2 statt nach 15 Minuten (`behind.js`).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- 30 Sekunden statt sofort: so hat das normale Update zuerst Zeit, und der Start wird nicht gestört.
- Ohne lokalen Speicher (privates Fenster) lädt die App nicht von selbst, nur der Balken kommt.

## Entscheide (für decisions.md)
- 27.10.2026: siehe `neueste-version.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Neueste Version auf Geräten: Schritt 2 von 3.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne nach dem nächsten «Online: …» die App auf dem Handy und warte eine halbe Minute: Sie lädt einmal von selbst neu.
2. Ich › Hilfe zeigt danach «dieses Gerät ist aktuell».
