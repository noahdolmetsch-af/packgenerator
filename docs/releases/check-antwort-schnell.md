# Check-Antworten ohne Ruckeln

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «a: Gemessenes gleich beheben» (Thread «Beheben: Verzögerung bei Eingaben und Tabs»)

## Was ist neu
- Morgen-Check und Abendrückblick: Jede Antwort wird gespeichert. Bisher las die Seite danach 12 Tabellen komplett neu (gemessen 23–27 Datenbank-Zugriffe pro Tippen, 0,15–0,5 s Ruckeln bei 4× langsamem Prozessor). Jetzt liest sie nur noch die Check-Zeilen der letzten 30 Tage neu.
- Aussehen und Speichern ändern sich nicht.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Check-Zeilen sind eine eigene Abfrage (`checksQuery`), die grosse Abfrage (`checkQuery`) liest sie nicht mehr. Nur die Check-Seite benutzte sie.
- Das Textfeld speichert weiter beim Verlassen (war schon unauffällig).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Verzögerung beheben (Weg a): PR 2 von 3. Bericht: notes/eingabe-tempo-2026-11-05/README.md.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Morgen-Check öffnen, nacheinander mehrere Antworten antippen: kein Ruckeln.
2. Seite neu laden: Antworten sind noch da.
