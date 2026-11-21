# Strava-IDs als Text vom Server

Auftrag: Noah «a» (Thread «Strava-IDs für 64 Bit prüfen»), nach der Strava-Mail «API Update - 64-bit Identifiers» vom 17.11.2026.

## Was ist neu
- Der Server (`api/strava.js`) liest die ID einer Aktivität und eines Athleten aus dem neuen Feld `id_str` (Text), sonst wie bisher aus `id`. Neue Funktion `idOf`.
- Grund: Ab 1. Juni 2027 können diese IDs 64-Bit-Zahlen sein. Das Einlesen der Antwort (`JSON.parse`) rundet Zahlen über 2^53, mit dem Text bleibt die ID genau.
- Tests in `tests/strava-server.test.js`: eine erfundene ID über 2^53 bleibt in der Fahrtenliste und beim Verbinden (Besitzer-Sperre) genau; eine alte Antwort ohne `id_str` läuft weiter.
- Sichtbar ändert sich nichts. Die App speichert Strava-IDs schon als Text (Aktivitäten, Fahrtenbuch, Backup, CSV-Import), deshalb ist keine Migration nötig und das Backup-Format bleibt gleich.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Eine `id_str`, die keine reine Zahl bis 20 Stellen ist, wird ignoriert; dann gilt `id`.
- Die Velo-IDs («b123») sind Text und gehören nicht zur Strava-Änderung; unverändert.
- Keine «Was ist neu»-Datei, weil nichts Sichtbares ändert.

## Stand im Plan (roadmap.md / vorhaben.md)
- Nichts verschoben. Dient dem Ziel «Eine App, die mich im Alltag unterstützt» (Strava-Anbindung bleibt nach der Frist 1. Juni 2027 verlässlich).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Der Vercel-Server «packgen» ist nach dem Merge READY (api/ hat sich geändert).
2. Velos › Pflege › Strava: «Jetzt abgleichen» läuft wie vorher, die Fahrten sind dieselben (keine Doppelten).
3. Training: eine Fahrt öffnen, die Details laden wie vorher.
