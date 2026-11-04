# Warnung, bevor die Start-Grenze erreicht ist

PR (diese Änderung) · 04.11.2026 · Auftrag: Noah «Test-Plan 4 1 2», Punkt 1 (Thread «Prüfen: Warum die Tests langsam sind»)

## Was ist neu
- Ab 90 % der Start-Grenze (aktuell 5.0 MB JavaScript, 90 % sind 4.5 MB) zeigt jeder Aufbau eine gelbe Notiz «Start-Grenze fast erreicht» mit der Prozentzahl, auf der Prüfung «build» und in der Zusammenfassung des Laufs.
- Die Prüfung wird davon nie rot. Rot wird sie weiter erst über der Grenze selbst.
- So entscheidet Noah vorher (Texte hinter `import()` verschieben oder die Grenze mit Begründung anheben), bevor der nächste PR abbricht wie bei #798.
- In der App ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Schwelle ist ein fester Anteil (90 %) der Grenze, damit sie mitwandert, wenn die Grenze angehoben wird.
- Der Start liegt heute bei 4.50 MB (98 %): die Warnung erscheint also ab dem Merge sofort. Das ist gewollt, es ist der wahre Stand.
- `docs/app-stand.md` bleibt unverändert: keine App-Funktion. Keine «Was ist neu»-Datei, weil die App nichts Neues zeigt.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan
- Verschlanken (Tests und Tempo): Test-Plan Punkt 1. Punkt 4 und 2 liegen als eigene PRs vor.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. GitHub > Actions > «Build and deploy» für diesen Merge: bei «build» steht unter Annotations die gelbe Notiz «Start-Grenze fast erreicht».
2. Der Lauf ist trotzdem grün.
