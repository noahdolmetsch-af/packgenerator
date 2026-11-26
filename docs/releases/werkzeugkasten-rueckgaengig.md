# Werkzeugkasten-Test: «Rückgängig» erst nach der Lösch-Meldung

PR #1798 · 26.11.2026 · Auftrag: Wackler aus der CI (Bündler-Hinweis), Wackel-Wächter

## Was ist neu
- Nichts Sichtbares geändert, nur Test für `werkzeugkasten.spec.js:323` («Werkzeuge und Links: suggestions with the trip, switch off and back, own link, groups»).
- **Ursache:** `removeGroup` in `src/pages/WebLinks.svelte` speichert zuerst die Gruppen und die Links und zeigt erst danach die Meldung «Gruppe gelöscht» mit «Rückgängig». Die Seite zeigt die Änderung schon vorher (Live-Abfrage). Der Test sah «Alltag» weg und klickte gleich auf die neueste Meldung: war die Lösch-Meldung noch nicht da, traf er die Meldung «Gruppe umbenannt»; deren «Rückgängig» brachte «Alltag» zurück, aber der eigene Link blieb in «Ohne Gruppe» (1 von 6 Läufen am Handy rot, beobachtet auf main).
- **Fix:** Der Test wartet zuerst auf den Text der Lösch-Meldung («Gruppe «Alltag» gelöscht …»), dann klickt er «Rückgängig». Lokal 8 von 8 grün (Handy).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- App nicht geändert: die Reihenfolge (erst speichern, dann Meldung) ist richtig; nur der Test las zu früh.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: Test grün. In der App nichts zu prüfen.
