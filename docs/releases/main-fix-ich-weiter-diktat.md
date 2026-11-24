# Main-Fix nach «Ich aufräumen»: doppelter Link, vier Tests folgen der neuen Ich-Seite, zwei Tests warten

Auftrag: Bündler, Main-Fix (rot auf main seit #1681: `erinnerungen.spec.js:34`, `diktat.spec.js:48`, `checks.spec.js:148`, `ich-vier-gruppen.spec.js:14`, `bilder.spec.js:123`, die Push-Specs `push`, `nacht-push`, `nebel-push`).

## Was ist neu
- Auf Ich › Erinnerungen stand der Link «Erinnerungen aufs Handy» zweimal: als eigene Zeile der Seite (`data-push-link`) und als «Weiter zu»-Link, den ich in #1681 in `src/lib/nav/weiter.js` eingetragen hatte. Der Eintrag `#/me/reminders` führt jetzt nur noch zu «Hinweise und News»; der Weg aufs Handy bleibt die Zeile der Seite. Ein Link weniger, nichts fällt weg.
- Test `diktat.spec.js:48` (Handy): las die Zahl der Starts der Spracherkennung sofort, wenn der zweite Satz da war. Der dritte Start kommt erst nach dem Ende des zweiten Stücks, die Zahl war manchmal noch 2. Der Test wartet jetzt auf den dritten Start (`expect.poll`). Mit #1681 hat das nichts zu tun, es war ein Wettlauf im Test.

- Vier Tests suchten Zeilen, die «Ich aufräumen» (#1681) absichtlich verschoben hat, und sind jetzt an die neue Seite angepasst (gleiche Prüfungen, neuer Weg): `push.spec.js`, `nacht-push.spec.js`, `nebel-push.spec.js` öffnen «Erinnerungen aufs Handy» über Ich › «Erinnerungen und Hinweise» › «Erinnerungen aufs Handy»; `checks.spec.js` geht über die Zeile «Listen und Typen» (hiess «Listen und Checks»); `ich-vier-gruppen.spec.js` kennt fünf Gruppen (mit «Erinnerungen») und findet Tennis unter «Mehr».
- `bilder.spec.js:123`: die Seite zeigt den Stern sofort und schreibt die Wahl einen Moment später. Der Test lud schon vorher neu und wurde unter Last rot (auf dem Stand vor #1681 war er grün, auf dem neuen 1 von 3). Er wartet jetzt, bis die Wahl gespeichert ist, dann lädt er neu (6 von 6 grün).

## Nicht von #1681
- `gt20-touren.spec.js:67` (Handy, sehr langer Tourname) wackelt auch auf dem Stand vor #1681 (1 von 3 rot); das Titelfeld ist 6 px zu breit. Das geht an den Wackel-Test-Besitzer, nicht in diesen PR. `ich-ideen.spec.js:59` und `heute-einzeln.spec.js:225` liefen lokal grün.

## Was fällt weg oder rutscht tiefer
- nichts. Der Link auf «Erinnerungen aufs Handy» auf Ich › Erinnerungen bleibt (als Zeile der Seite).

## Selbst entschieden
- Der Test wird nicht gelockert: derselbe Wert (mindestens 3 Starts), nur mit Warten statt sofortem Lesen.
- Keine Neuigkeit (`src/lib/news`), weil für Noah nichts Neues sichtbar ist.

## Prüfschritte
1. Ich › Erinnerungen: «Erinnerungen aufs Handy» steht einmal da (die Zeile unter «Merken»), unten «Weiter zu: Hinweise und News».
2. In der Prüfung des PR sind `erinnerungen.spec.js` und `diktat.spec.js` auf Handy und Computer grün.
