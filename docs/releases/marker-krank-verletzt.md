# Marker für krank, verletzt, Stress und Ferien

21.11.2026 · Auftrag: Noah «1a dann b dann alle anderen 2a 3a 4a 5a» (Thread «Bauen: Sportjahr und Auswertung aller Sportarten», Auftrag K1)

## Was ist neu
- **Karte «Marker»** auf «Form und Erholung»: Tage oder Zeiträume festhalten, an denen du krank, verletzt, gestresst oder in den Ferien warst. «Marker setzen» fragt nach der Art und dem ersten und letzten Tag (leer = nur dieser Tag). Jeder Marker lässt sich ändern oder löschen; Löschen fragt zuerst und bietet danach «Rückgängig».
- Nur Marker, noch keine Auswertung: K2 («Form im Vergleich») und K3 («Was auffällt») lesen die Marker später, blenden diese Tage in Vergleichen aus und fragen bei Auffälligkeiten «Marker setzen?».
- Neue Dateien `src/lib/flow/marker.js` (reine Funktionen: bereinigen, Liste, setzen, entfernen, markierte Tage), `MarkerSheet.svelte`, `MarkerCard.svelte`, `markerwords.js`; Tests `tests/marker.test.js` (mit Backup-Kopie) und `tests/e2e/marker.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte steht unten auf «Form und Erholung», vor «So rechnet die App».

## Selbst entschieden
- **Speicherort `training.marker` in `db.settings`:** kein Schema-Wechsel; die Marker sind im Backup, ein altes Backup ohne sie liest sich als «keine Marker».
- **Höchstens 366 Tage pro Marker** (ein Jahr), damit ein Tippfehler im Jahr nicht alles abdeckt; längere Zeiträume lassen sich als zwei Marker setzen.
- **Neuer Marker beginnt heute**, ohne vorgewählte Art (Speichern geht erst nach der Wahl). Alles änderbar.
- **Keine eigene Seite, kein neuer Eintrag im Katalog:** Teil von «Form und Erholung» (Fertig-Regel Teil 1 bis 3 und 6: bestehende Seite, app-stand-Zeile ergänzt; Absprung folgt mit K3 («Marker setzen?» auf der Karte «Was auffällt»)).
- **Wort «Marker»** (`docs/namen.md`, Zeile 32).

## Entscheide (eigene Datei `docs/decisions/marker-krank-verletzt.md`)
- 21.11.2026: Marker krank/verletzt/Stress/Ferien, ruhig, änderbar, mit Rückgängig; Auswertungen blenden markierte Tage aus.

## Stand im Plan (roadmap.md / vorhaben.md)
- Klügere Auswertungen: K1 gebaut. Offen: K2, K3 (braucht Noahs Zeiträume), K4.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Form und Erholung nach unten scrollen zu «Marker», «Marker setzen» tippen, «Verletzt» und zwei Tage wählen, «Speichern».
2. Der Marker steht in der Liste. Papierkorb, «Löschen», dann «Rückgängig»: er ist zurück.
