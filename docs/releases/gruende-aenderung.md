# Gründe für Planänderungen

PR folgt · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Plane Persönliches Lernen für Touren»), Idee 4 von 6

## Was ist neu
- Setzt du eine Tour auf «Nicht fahren», fragt eine Karte in Planen: «Warum fährst du nicht?». Ein Tipp auf einen Grund (keine Zeit, müde Beine, Wetter, keine Lust, Material, nicht fit) genügt. «Jetzt nicht» legt die Frage weg.
- Weicht die gefahrene Strecke um mindestens ein Viertel von der geplanten ab, fragt die Tour-Seite dasselbe («Warum war es anders?»).
- Die Gründe sind eine App-Liste (Ich › Listen und Typen): umbenennen, ergänzen, ausblenden. Der Grund steht im Feld `changeWhy` der Tour, ohne neue Tabelle.
- Ab drei Antworten sagt eine Zeile, welcher Grund am häufigsten vorkam. Nur zählen, nie erklären.
- Regeln in `src/lib/gruende.js`, Test `tests/gruende.test.js`, Karte `src/lib/pack/ReasonPick.svelte`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Schwelle «ein Viertel» (`DEVIATION = 0.25`) und die Mindestzahl 3 für die Zeile sind Vorschläge im Code.
- Ein zweiter Tipp auf den gewählten Grund nimmt die Antwort weg (mit Rückgängig), wie bei der Schätzung.
- Fertig-Regel: Seite (`f.changewhy` in `src/lib/featreg/gruende-aenderung.js`), Absprung (die Karte steht dort, wo die Änderung passiert), Gut zu wissen (`wissen/app.js`), leerer Zustand (ohne Änderung keine Karte), Als Nächstes (nicht nötig: ein Tipp, fertig), Zeile in `docs/app-stand.md`.

## Stand im Plan
- Persönliches Lernen: Idee 4 von 6 gebaut. Reihenfolge nach Runde 1: 1, 4, 6, 3, 5, 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In Planen eine Tour auf «Nicht fahren» setzen (⋯-Menü): die Karte fragt nach dem Grund, ein Tipp markiert ihn.
2. Denselben Grund noch einmal tippen: die Antwort ist weg, Rückgängig holt sie zurück.
3. Ich › Listen und Typen: «Gründe für eine andere Tour» ändern oder ergänzen.
