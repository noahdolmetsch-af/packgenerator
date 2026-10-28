# Online-Gehen in einem Schritt

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «bitte prüfe auf github, ob alles in ordnung ist» und «mach einfach das beste» (Thread «Verbessern Weg von gebaut zu online»)

## Was ist neu
- Nichts in der App. Auf GitHub ist das Online-Gehen von `main` jetzt **ein** Schritt: Bauen, Kurztests, Online stellen und der Eintrag unter Releases laufen nacheinander auf demselben Prüf-Computer.
- Grund: GitHub kennt keinen Vorrang. Am 27.10.2026 abends wartete das Bauen 25 Minuten auf einen freien Computer. Danach stellte sich das Online-Stellen als eigener Schritt noch einmal hinten an und wartete über 25 Minuten weiter, hinter allen PR-Tests. Jetzt wartet `main` nur noch einmal.

## Was fällt weg oder rutscht tiefer
- nichts. Die Schritte «deploy» und «release» heissen jetzt zusammen «online». Der Eintrag unter Releases kommt weiter direkt nach dem Online-Gehen. Klappt er nicht, ist die App trotzdem online.

## Selbst entschieden
- Die Prüfung «build» bleibt für PRs mit gleichem Namen, damit die Branch-Regel nicht geändert werden muss.
- Der Eintrag unter Releases darf scheitern, ohne den Lauf rot zu machen (`continue-on-error`).

## Entscheide (für decisions.md)
- keine neuen. Wie PR-Tests künftig laufen, entscheidet Noah gerade auf der Karte im Thread.

## Stand im Plan (roadmap.md / vorhaben.md)
- Verschlanken (Tests und Tempo): `main` wartet nur noch einmal auf einen Prüf-Computer.

## Prüfschritte (nach dem Merge)
1. Unter github.com/noahdolmetsch-af/packgenerator/actions hat der nächste Lauf auf `main` nur noch den Schritt «online».
2. Nach dem Lauf steht unter github.com/noahdolmetsch-af/packgenerator/releases ein Eintrag «Online: v…».
3. Im Thread kommt «Online: …».
