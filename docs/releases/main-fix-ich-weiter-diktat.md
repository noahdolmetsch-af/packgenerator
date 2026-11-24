# Main-Fix nach «Ich aufräumen»: doppelter Link auf Erinnerungen, Test Diktat wartet

Auftrag: Bündler, Main-Fix (rot auf main seit #1681: `erinnerungen.spec.js:34`, `diktat.spec.js:48`).

## Was ist neu
- Auf Ich › Erinnerungen stand der Link «Erinnerungen aufs Handy» zweimal: als eigene Zeile der Seite (`data-push-link`) und als «Weiter zu»-Link, den ich in #1681 in `src/lib/nav/weiter.js` eingetragen hatte. Der Eintrag `#/me/reminders` führt jetzt nur noch zu «Hinweise und News»; der Weg aufs Handy bleibt die Zeile der Seite. Ein Link weniger, nichts fällt weg.
- Test `diktat.spec.js:48` (Handy): las die Zahl der Starts der Spracherkennung sofort, wenn der zweite Satz da war. Der dritte Start kommt erst nach dem Ende des zweiten Stücks, die Zahl war manchmal noch 2. Der Test wartet jetzt auf den dritten Start (`expect.poll`). Mit #1681 hat das nichts zu tun, es war ein Wettlauf im Test.

## Was fällt weg oder rutscht tiefer
- nichts. Der Link auf «Erinnerungen aufs Handy» auf Ich › Erinnerungen bleibt (als Zeile der Seite).

## Selbst entschieden
- Der Test wird nicht gelockert: derselbe Wert (mindestens 3 Starts), nur mit Warten statt sofortem Lesen.
- Keine Neuigkeit (`src/lib/news`), weil für Noah nichts Neues sichtbar ist.

## Prüfschritte
1. Ich › Erinnerungen: «Erinnerungen aufs Handy» steht einmal da (die Zeile unter «Merken»), unten «Weiter zu: Hinweise und News».
2. In der Prüfung des PR sind `erinnerungen.spec.js` und `diktat.spec.js` auf Handy und Computer grün.
