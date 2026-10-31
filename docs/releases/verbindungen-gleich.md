# Verbindungen überall gleich

PR #447 · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «1a» alle B-Fehler aus dem UI-Test 0.205 (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- Google (Termine, Mail), Trello und Fitbit nennen den Geräte-Schlüssel gleich: «Dieses Gerät braucht einmal den App-Schlüssel … Gerät freischalten (einmal)» statt «Zuerst Strava verbinden».
- Ich › Verbindungen: Strava ohne Schlüssel sagt «auf diesem Gerät nicht verbunden · zuletzt geholt …»; Fitbit sagt, wenn zum Holen der Schlüssel fehlt; «Strava hakt Aktiv ab» sagt «Gilt, sobald Strava auf diesem Gerät verbunden ist».
- Woche planen sagt «Aus deinem Google Kalender: N Termine diese Woche» oder «keine Termine», und nur ohne Verbindung den alten Satz mit «Google verbinden ›».
- Die Strava-Kachel auf Heute zeigt die letzte Fahrt aus der App auch ohne Schlüssel; unten steht dann «Auf diesem Gerät nicht verbunden ›». Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- Auf Heute fällt die Zeile «Fahrten aus Strava von selbst · Verbinden ›» weg, wenn schon Fahrten in der App sind (alt: Verbinden-Kachel → neu: letzte Fahrt, unten «Auf diesem Gerät nicht verbunden ›»).

## Selbst entschieden
- Der Schlüssel selbst bleibt, wie er ist; nur die Wörter sind überall gleich (Strava pro Person plant ein anderer Thread).
- «Strava» bleibt als Name im Knopf weg, weil der Schlüssel für Google und Trello gilt.

## Entscheide (für decisions.md)
- 27.10.2026: Verbindungen überall gleich (UI-Test 0.205 T9), Noah «1a» alle B-Fehler.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Alltag): T9 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbindungen: Strava und Fitbit sagen dasselbe wie auf ihren eigenen Seiten.
2. Woche planen, Schritt 1: Ist der Google Kalender an, steht «Aus deinem Google Kalender: …».
