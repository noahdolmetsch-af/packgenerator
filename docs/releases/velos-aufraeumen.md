# Velos aufräumen

PR #1508 · 23.11.2026 · Auftrag: Noah «ja» auf den Vorschlag des Koordinators (Thread «Velos und Material aufräumen»)

## Was ist neu
- **Die Velos stehen einmal.** Die drei grossen Karten oben sind die Auswahl; die zweite Reihe kleiner Kacheln («3 Velos») ist weg. «Details zeigen» wählt das Velo und führt zu seiner Seite weiter unten. «Velo hinzufügen» ist die letzte Karte (gestrichelt).
- **Keine alten Reiter mehr** unter «Velos» (Übersicht, Teile, Mein Setup). «Teile» war schon eine Zeile («Pflege und Teile»); neu ist eine Zeile **«Mein Setup»** unter «Mehr» auf der Velo-Seite. Die Adressen `#/bikes?tab=compare` und `#/bikes?tab=rig` bleiben.
- **Hilfe nur einmal.** Die Zeile «So geht's» ist weg; ihr Inhalt (was man hier tut, was zu erwarten ist, die kurze Tour) steht im «?»-Fenster. Auf der Seite bleibt die eine Zeile «Was du hier tun kannst» und am Ende «Alle Funktionen von Velos».
- **Deutsch.** Aus dem ersten Import stammende Namen werden auf Deutsch gezeigt: «Bottle cage (down tube)» → «Flaschenhalter (Unterrohr)», «Tool bag» → «Werkzeugtasche», «Newly ordered (October 2026)» → «Neu bestellt (Oktober 2026)», «Canyon (maker photo)» → «Canyon (Herstellerfoto)». Nur die bekannten Wörter, nur in der Anzeige; gespeichert bleibt der Text, wie er war. Ein selbst getippter Name bleibt, wie er ist.
- **Schuhe und Cleats gehören zum Material.** Eine Arbeit, die Schuhe oder Cleats nennt («Cleat linker Schuh»), zählt nicht mehr als Arbeit am Velo («2 fällig» beim Canyon). Sie steht im Material unter «Arbeit am Material» (Seitenende von «Alle»), mit «Erledigt» und «Zum Velo» (gibt sie dem Velo zurück), beides mit Rückgängig.
- **Doppelte Kacheln am Seitenende.** Werkstatt, Velopflege und Velos vergleichen sind keine Kacheln mehr (Reiter «Pflege» mit Chip «Werkstatt» und eine Zeile unter «Mehr»). Eine eigene Link-Kachel nennt unter ihrem Namen, wohin sie führt (zum Beispiel «example.ch»), statt «dein Link».

## Was fällt weg oder rutscht tiefer
- Chips «Übersicht, Teile, Mein Setup» unter «Velos»: weg. «Teile»: Zeile «Teile» in «Pflege und Teile»; «Mein Setup»: neue Zeile unter «Mehr».
- Zweite Reihe kleiner Velo-Kacheln: weg (die grossen Karten wählen das Velo). Das Wechseln mit den Pfeiltasten der Kachelreihe fällt weg.
- Zeile «So geht's» oben: weg, steht im «?»-Fenster.
- Kacheln «Werkstatt», «Velopflege», «Velos vergleichen» am Seitenende: weg, auch aus «Kachel hinzufügen». «Fahrten-Buch» und die anderen bleiben.
- Arbeit an Schuhen und Cleats: nicht mehr in «fällig» der Velos, nicht mehr in der Problemliste eines Velos; sie steht im Material.

## Selbst entschieden
- Die englischen Namen werden nur in der Anzeige übersetzt (bekannte Wörter wie in `bagName`), nicht in den Daten geändert: keine Datenänderung, kein Backup nötig, Rückgängig nicht nötig.
- Ob eine Arbeit zum Material gehört, entscheidet ein Wort im Text (Cleat, Schuh, Schuhplatte, shoe; nicht bei Bremsschuh und Belägen) oder das Feld `gear` der Arbeit. «Zum Velo» setzt `gear: false`, das gewinnt immer. Ein Feld, das sonst nicht gebraucht wird, kommt nur mit dem Klick in die Daten.
- Die Karte «Arbeit am Material» nennt das Velo, bei dem die Arbeit eingetragen wurde («bei Canyon Lux eingetragen»), damit nichts ohne Spur verschwindet.
- Fertig-Regel: Absprung (Zeile «Mein Setup», Zeile «Teile» auf der Velo-Seite), Inhalt («?»-Fenster der Seite Velos), leerer Zustand (die Karte «Arbeit am Material» steht nur, wenn es so eine Arbeit gibt) und Seitenzustand sind erfüllt; keine neue Funktion in `features.js` (die Karte gehört zur Seite Material).
- Die Testzeilen in `ausstattung.spec.js`, `taschen-setups.spec.js` und `setup-rig.spec.js` (nach PR 1500 auf «Mein Setup» als Chip) prüfen hier «Reiter Velos leuchtet, keine Chips». Nichts gelockert.

## Entscheide
- 23.11.2026: Velos ohne Chips, die Velos einmal, Schuhe und Cleats im Material (siehe `docs/decisions/velos-aufraeumen.md`).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Velos und Material aufräumen», PR 1 von 2; PR 2 ist «Material aufräumen» (Liste nach oben, Werkzeuge in «⋯»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Velos und Material» öffnen: jedes Velo steht einmal als Karte, darunter keine zweite Reihe; oben keine Chips mehr.
2. Bei einem anderen Velo «Details zeigen» tippen: die Seite darunter wechselt, die Karte hat einen Rahmen.
3. «?» tippen: «Hier stehen deine Velos …» und die Tour stehen dort; auf der Seite keine Zeile «So geht's».
4. Beim Canyon steht «Cleat linker Schuh» nicht mehr bei «fällig»; unter «Material» ganz unten steht «Arbeit am Material» mit den zwei Cleats.
