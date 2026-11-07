# Adresse einer Quelle prüfen

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 3, Befund E3-003; Thread «Durchklicken Etappe 3: Unterwegs und Wetter»)

## Was ist neu
- Unter Ich › Hinweise und News › «Quelle hinzufügen» nahm Chrome auch ein einzelnes Wort («hallo») oder eine Adresse mit Leerzeichen als Quelle an; die Quelle stand dann mit «Gerade nicht ladbar» in der Liste. Jetzt erscheint «Das ist keine Webadresse.» und nichts wird hinzugefügt.

## Was fällt weg oder rutscht tiefer
- nichts (Adressen wie `example.org/feed` bekommen weiter selbst das `https://`)

## Selbst entschieden
- Eine Adresse braucht einen Punkt im Namen und darf kein Leerzeichen und keinen Punkt am Ende haben. Die Meldung gibt es schon auf Deutsch («Das ist keine Webadresse.»).
- Bereits gespeicherte Quellen bleiben unberührt (kein Eingriff in Daten); sie lassen sich wie bisher ändern und löschen.
- Regressionstests: `tests/news.test.js` (vorher rot bei «hallo») und `tests/e2e/hinweise-adresse.spec.js`.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Ich › Hinweise und News und tippe auf «Quelle hinzufügen».
2. Schreibe einen Namen und bei der Adresse «hallo».
3. Die Meldung «Das ist keine Webadresse.» erscheint, die Liste bleibt gleich.
