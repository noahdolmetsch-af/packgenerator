# Was ist neu: «Beispiele anpassen» sagt, wann die Zeile da ist

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «beheben» (Thread «Wackel-Tests zuverlässig machen», Test «Ausprobieren» rot, Zeile 0.1188.0)

## Was ist neu
- Die Zeile «Die Wahl, was dich interessiert, liegt jetzt unter Ich › Daten und Backup › «Beispiele anpassen»» in «Was ist neu» (erster-start-ein-fenster) führt weiter zur Seite «Daten und Backup». Die Zeile «Beispiele anpassen» steht dort aber nur, solange ein Teil der Beispiele fehlt. Wer alle Beispiele schon hat, sah beim Antippen nichts leuchten.
- Neu sagt die Zeile in diesem Fall, wo sie steht: «Die Zeile «Beispiele anpassen» steht hier, solange ein Teil der Beispiele fehlt.» Das Leuchten bleibt, wo die Zeile da ist. Der Test «Ausprobieren» (alle Zeilen, Teil 2 bis 3) war seit dem Merge von «Erster Start in einem Fenster» auf main rot, weil sein Beispielstand alle Beispiele hat.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der vorhandene Weg für Zeilen ohne festen Ort (`where` neben `steps`, wie bei «Muster-Woche»), keine neue Technik und keine Änderung am Test.
- Die App selbst bleibt: die Zeile in «Daten und Backup» soll nur erscheinen, wenn es etwas anzupassen gibt.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu: die Zeile zu «Beispiele anpassen» antippen. Fehlt ein Teil der Beispiele, leuchtet die Zeile in «Daten und Backup»; sind alle da, steht unten die erklärende Zeile.
