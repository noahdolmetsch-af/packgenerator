# Tippfehler-Frage: die Regel und das Gewicht

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «1-5 a» (Warteliste 6, PR 1 von 4)

## Was ist neu
- Eine gemeinsame Regel `askTypo` (`src/lib/typo/frage.js`) beurteilt eine Zahl: normal oder ungewöhnlich. Sie vergleicht mit deinen eigenen Werten (ab drei) und mit groben Aussengrenzen; ein verschobenes Komma (÷10, ÷100, ×10, ×100), das in den üblichen Bereich fällt, wird als Vorschlag genannt. Sie kennt Körpergewicht, Material-Gewicht, Kilometer und Dauer.
- Auf **Ich › Gewicht** steht unter dem Feld, sobald du es verlässt, eine leise Zeile: «Meintest du 70 kg?» mit «Ja, 70 kg» und «Stimmt so». Bei einem ungewöhnlichen Wert ohne Vorschlag fragt sie «… sieht ungewöhnlich aus. Stimmt das?».
- «Stimmt so» merkt sich den Wert; für diesen Wert fragt die App nicht wieder.

## Was fällt weg oder rutscht tiefer
- Die Fehlermeldung «Bitte ein Gewicht zwischen 30 und 250 kg» und damit die harte Grenze (Noah «5a»): der Wert wird jetzt nur noch gefragt. Ungültig bleibt, was keine Zahl ist («Bitte ein Gewicht in kg eingeben»).

## Selbst entschieden
- Keine neue Funktion in `features.js`: es sind Felder von «Gewicht»; ein Absprung entfällt.
- Die Aussengrenzen und typischen Werte stehen in `KINDS` (Körpergewicht 35–200 kg, Material 1–20 000 g, Kilometer 0,5–600, Dauer 1–1440 min); Grenzen von sehr alten oder sehr schweren Personen werden mit «Stimmt so» einmal bestätigt.
- Das Weight-Gewicht gilt nur bis 1000 kg als Zahl (alles darüber ist Unsinn).

## Entscheide (eigene Datei `docs/decisions/tippfehler-gewicht.md`)
- 22.11.2026: Noah «1-5 a».

## Stand im Plan
- Warteliste 6: Funktion und Gewicht gebaut; Material-Gewicht, Kilometer und Dauer, Beträge und Daten folgen als eigene PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Gewicht › Gewicht eintragen: 700 tippen, Feld verlassen: «Meintest du 70 kg?».
2. «Ja, 70 kg»: das Feld zeigt 70, Speichern geht.
3. 300 tippen, «Stimmt so»: die Zeile geht und kommt für 300 nicht wieder.

**Daten:** neue Einstellung `typo.ok` (Liste, höchstens 200 Werte): Test mit einer Backup-Kopie im alten Format vor dem Merge (ohne die Einstellung liest die App eine leere Liste, `tests/typo-frage.test.js`).
