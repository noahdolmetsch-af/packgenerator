# Drei kleine Verbesserungen: Woche und Verbindungen

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «F3, F4, F6 auf die Warteliste» (Thread «Warteliste fertig bauen, online später»)

## Was ist neu
- **F3:** Ein eigenes To-do ohne Tag steht unter «Noch einplanen» als «Dein To-do, noch ohne Tag · passt auf …» und hat «Entfernen» statt «Nie mehr vorschlagen». Ideen der App (Saison, Google, Velo) behalten «Nie mehr vorschlagen».
- **F4:** «Entfernen» (das × an einem eigenen To-do oder Termin und der neue Knopf) fragt zuerst in einem Fenster; danach bietet die Meldung wie bisher «Rückgängig».
- **F6:** In Ich › Verbindungen zeigt die Zeile «Mail» «an» oder «aus» (an, sobald Mail einmal erlaubt und geladen wurde).

## Was fällt weg oder rutscht tiefer
- Bei eigenen To-dos ohne Tag fällt «Nie mehr vorschlagen» weg (es passt nicht zu einer eigenen Aufgabe); «Entfernen» (mit Frage und Rückgängig) ersetzt es.
- Das × fragt jetzt zuerst; vorher löschte es sofort.

## Selbst entschieden
- «Nicht diese Woche» und «Übernehmen» bleiben bei eigenen To-dos wie bisher.
- Mail zeigt «aus», solange `mail.allowed` nicht gesetzt ist (Google noch nicht für Mail erlaubt); es wird nichts neu gespeichert, die Zeile liest nur die bestehende Einstellung.

## Entscheide
- Kein neuer Entscheid.

## Stand im Plan
- Warteliste: F3, F4, F6 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Woche › «Noch einplanen»: ein To-do ohne Tag sagt «Dein To-do», hat «Entfernen».
2. «Entfernen» antippen: Frage; «Abbrechen» behält es, «Löschen» entfernt es mit «Rückgängig».
3. Ich › Verbindungen: die Zeile «Mail» zeigt «an» oder «aus».

Keine Datenänderung.
