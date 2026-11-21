# Ein kaputter Eintrag stoppt den Abgleich nicht mehr

PR #1364 · 21.11.2026 · Auftrag: Noah «1-5a» (Punkt 5, Thread «Fix Abhaken-Sync zwischen Computer und Handy»)

## Was ist neu
- Konnte ein Gerät einen einzelnen Eintrag vom anderen Gerät nicht speichern (nicht wegen Platzmangel), brach die ganze Runde ab. Der Zeiger rückte nicht weiter, jede neue Runde stolperte über denselben Eintrag, und alles dahinter kam nie an (`src/lib/sync/engine.js`, `applyPackage`). Jetzt wird dieser Eintrag übersprungen und unter `syncskip|…` vermerkt; die Runde läuft weiter, alles danach kommt an.
- Ich › Daten und Backup zeigt eine Zeile «N Einträge vom anderen Gerät konnten hier nicht gespeichert werden und wurden übersprungen» (nur wenn es welche gibt). Die Zähl-Probe (PR «Abgleich prüft sich selbst») sucht übersprungene Einträge wieder; «Mit dem Server vergleichen» listet sie.
- Auch «Mit dem Server vergleichen» und die Zähl-Probe nehmen die Einträge einzeln auf: ein Eintrag, den das Gerät nicht speichern kann, hält die anderen nicht mehr auf (`compare.js`, `fixMissing`).
- Kein Platz mehr auf dem Gerät hält die Runde weiter an, mit der eigenen Meldung: dann passt ohnehin nichts mehr.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Ein übersprungener Eintrag wird nicht automatisch wiederholt, bis die Zähl-Probe oder «Fehlendes ergänzen» ihn wieder aufgreift (sonst würde er jede Runde erneut Fehler machen).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Absicherung des Abgleichs (Noah «1-5a»), Punkt 5 von 5.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup bei eingeschaltetem Abgleich: keine Zeile über übersprungene Einträge, solange alles gut ist.
2. «Jetzt abgleichen»: «zuletzt abgeglichen» wie bisher.
