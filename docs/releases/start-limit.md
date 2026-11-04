# Start-Limit 4.6 MB

PR (offen) · 04.11.2026 · Auftrag: Noah «a» (Thread «Umsetzen: Sieben Cockpit-Ideen», Frage «Start-Budget von 4.5 auf 4.6 MB anheben?»)

## Was ist neu
- Nichts Sichtbares. Das Start-Limit (`MAX_START_JS_BYTES` in `scripts/size-guard.mjs`) steht jetzt auf 4.6 MB statt 4.5 MB. Der Start der App lud nach der Belastungslandschaft 4.50 MB JavaScript, deshalb brach der Aufbau auf `main` ab und die Seite wurde nicht mehr neu veröffentlicht.
- Die Kern-Grenze von 3 MB pro Datei bleibt, wie sie ist.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur die Zahl und ihr Test (`tests/size-guard.test.js`) ändern sich, kein Umbau der Textladung (Noah wählte «a», nicht «b»).
- Keine «Was ist neu»-Datei, weil die App nichts Neues zeigt.

## Entscheide (für decisions.md)
- 04.11.2026: Start-Limit 4.6 MB statt 4.5 MB (Noah «a»; Texte nachladen bleibt eine spätere Option).

## Stand im Plan (roadmap.md / vorhaben.md)
- Tempo: Start-Limit angehoben, Nachladen der deutschen Texte bleibt offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf GitHub unter «Actions» zeigt «Build and deploy» für den Merge ein grünes Häkchen.
2. Die Seite öffnen: Sie lädt wie vorher, unter Ich › Was ist neu erscheint der Stand mit der Belastungslandschaft (Aktiv › Form).
