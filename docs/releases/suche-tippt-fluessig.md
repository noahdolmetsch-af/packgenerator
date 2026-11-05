# Die Suche im Material tippt flüssig

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «a: Gemessenes gleich beheben» (Thread «Beheben: Verzögerung bei Eingaben und Tabs»)

## Was ist neu
- Material › Suche: Die Buchstaben erscheinen sofort im Feld; die Liste baut sich 0,18 s nach dem letzten Buchstaben neu. Vorher baute jeder Buchstabe die Liste neu (gemessen: erster Buchstabe bei 4× langsamem Prozessor ca. 1,7 s).
- Das × im Feld, die Eingabetaste und «Zurücksetzen» ändern die Liste weiterhin sofort.

## Was fällt weg oder rutscht tiefer
- nichts. (Die Liste wechselt bei schnellem Tippen erst am Ende, nicht mehr bei jedem Buchstaben.)

## Selbst entschieden
- 180 ms Wartezeit: kurz genug, dass es nicht träge wirkt, lang genug für zwei Buchstaben hintereinander.
- Nur die Material-Suche in diesem PR (kleiner PR); Tagescheck und Tabs folgen als eigene PRs.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Verzögerung beheben (Weg a): PR 1 von 3. Bericht: notes/eingabe-tempo-2026-11-05/README.md.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material öffnen, ein Wort ins Suchfeld tippen: die Buchstaben erscheinen ohne Verzögerung.
2. Das × im Suchfeld tippen: die ganze Liste ist sofort wieder da.
