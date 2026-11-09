# Meine Tour auf Heute

PR #1231 · 09.11.2026 · Auftrag: Noah «2 a» und «ok» (Plan «ganze App», Schritt 2a; Thread «Bauen: Karte «Meine Tour» auf Heute»)

## Was ist neu
- Auf Heute steht ganz oben (gleich unter dem Gruss) die Karte «Meine Tour», **nur bei einer geplanten Tour** (nicht beendet, nicht ausgefallen). Sie zeigt den Namen der Tour mit dem Zähler («In 6 Tagen»), eine Zeile «3 Tage · Velo · Sa 14. Nov», die vier Phasen (Planen, Vorbereiten, Unterwegs, Danach) mit ihrem Stand, «Als Nächstes: …» mit der ersten offenen Zeile der laufenden Phase als **einem** Hauptknopf («Weiter mit Packen»), die Hinweise als **eine** Zeile und «Alle Schritte ›» zum Tour-Pfad.
- Gerechnet wird mit derselben Regel wie im Tour-Pfad (`src/lib/tourpfad/stand.js`), gelesen über `src/lib/tourpfad/karte.js`. Es wird nichts gespeichert und nichts neu gerechnet.
- Die Karte ist eine Kachel wie die anderen: ausblenden, verschieben, Grösse, Katalog («Kachel hinzufügen»). Eine Wand von vorher bekommt sie einmal ganz oben (Wand v 21); wer sie wegnimmt, behält sie weg.
- **Kein «Unterwegs»-Knopf** (Entscheid 9 b): der Unterwegs-Modus kommt mit 7a und wird von Noah selbst eingeschaltet.

## Was fällt weg oder rutscht tiefer
- Die Zeile **«Eventvorbereitung: n offen (m überfällig)»** mit dem Knopf «Im Tour ankreuzen» in «Jetzt dran» fällt weg. Ihr Satz steht jetzt als Hinweiszeile auf der Karte; ein Tipp darauf öffnet wie vorher die Tour bei «Vor der Tour» (`openPrep`). Kein Inhalt geht verloren. Steht die Karte nicht auf der Wand (ausgeblendet), bleibt die Zeile in «Jetzt dran», damit der Hinweis nie verschwindet.
- Eine Karte mit dem Namen «Vorab» gibt es im Code nicht; gemeint war nach dem Bauauftrag der Block `prep`/`eventPrep` in `Home.svelte`. Gebaut wurde auf dieser Grundlage.
- Sonst nichts: «Dein Moment», die grosse Tourkarte «Nächste Tour», «Weitermachen» und das Bild oben bleiben (siehe «Selbst entschieden»).

## Selbst entschieden
- **Entwurf gegen Bild:** gleich in Aufbau und Wörtern (Name und Zähler, Zeile, vier Phasen, «Als Nächstes», ein Hauptknopf, «Alle Schritte»). Weicht ab, weil: (1) die Phasen als Pillen mit Nummer stehen, nicht als Strich mit Punkten; auf dem Handy (390 px) bricht die vierte in eine zweite Zeile um; (2) der Entwurf zeigt «Packen» als nächsten Schritt, die Regel liefert ohne Wissen über Form und Pflege zuerst «Körper» (siehe nächster Punkt).
- **Gleiche Regel wie der Tour-Pfad, mit denselben Lücken:** Heute und Tour-Pfad geben `tourStand` nur Datum und Rückblick mit; Form, Velopflege, Anreise, Verpflegung und Fahrt sind dort «unbekannt», also offen. Darum steht oft «Als Nächstes: Körper» vorn. Beides gleichzeitig zu füllen ist ein eigener kleiner PR (Vorschlag ★); hier wurde bewusst nicht anders gerechnet als der Pfad, sonst würden Heute und Pfad Verschiedenes sagen.
- **Welche Tour:** die nächste geplante (wie das Bild oben und der Spruch: `soonTrips(...)[0]`), auch wenn Noah mehrere hat. «Alle Schritte» und der Hauptknopf öffnen genau diese Tour.
- **Hinweise als eine Zeile:** zuerst die offene Eventvorbereitung (nur bei Velo-Touren, wie bisher), sonst die erste Zeile mit Hinweis aus dem Pfad (Zustand «warn»). Die Hinweise «Du könntest jetzt …» (`src/lib/hinweise/regeln.js`) sind noch nicht auf Heute verdrahtet («kommt nach den Heute-PRs»), also gibt es nichts zu übernehmen.
- **Doppelt mit der grossen Tourkarte und «Dein Moment»:** der Zähler und der nächste Schritt stehen jetzt auch dort. Der Auftrag ersetzt nur die Karte «Vorab»; «Dein Moment» wird in 2b zur Hauptkarte. Soll die grosse Karte «Nächste Tour» verschwinden, solange «Meine Tour» sie ersetzt, ist das eine Frage an Noah (a/b im Thread).
- **Wand v 21:** eine Wand ohne die Anfangs-Kacheln (Gewohnheiten, Moment, Tour, «Jetzt dran») bleibt wie sie ist, die Karte ist dann im Katalog. Kein neues Dexie-Schema, kein neues Backup-Feld: nur die vorhandene Einstellung «homeWall» bekommt eine neue Kachel-Kennung.
- **Fertig-Regel:** Seite/Katalog-Eintrag: keiner eigener, die Karte ist der Weg zu `f.tourpfad` (Katalog, Handbuch und Wörter dort stehen schon) und zählt dort als Absprung von Heute; «Gut zu wissen»: Heute steht nicht in `ON_PAGES`, hat sein eigenes «?»; Leer-Zustand: ohne geplante Tour ist die Karte weg und die Kachel «Nächste Tour» sagt «Keine Tour geplant» mit «Neue Tour»; nächster Schritt: der Hauptknopf; App-Stand: Zeile «Meine Tour».
- Tests: sieben Wand-Tests (`tiles`, `wochentraum`, `heuteneu`, `momentcard`, `vo2`, `home-sections`) kennen die neue Kachel und Wand v 21; neu `tests/meinetour.test.js`.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: Schritt 2a steht auf gebaut (#1231). Danach 2b (auf Anweisung), dann Pause für die echte Tour.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen (mit einer geplanten Tour): gleich unter dem Gruss steht «Meine Tour» mit dem Namen der Tour und den vier Phasen.
2. «Als Nächstes» lesen und den grossen Knopf tippen: die Seite dieses Schritts öffnet sich. Zurück: «Alle Schritte» öffnet den Tour-Pfad.
3. «Heute anpassen»: die Karte lässt sich ausblenden und verschieben. Eine Tour ohne Termin oder keine Tour: die Karte fehlt.
