# Eine klarere Tourenseite

PR #1799 · 25.11.2026 · Auftrag: Noah «1-5a» (Thread «Touren-Seite klarer machen»)

Noah schickte einen Ganzseiten-Screenshot von Touren › Übersicht (Computer). Die Seite ist etwa 4000 Pixel hoch, die erste gefahrene Tour steht erst nach rund 1050 Pixeln, fünf gleiche Zeilen «Scott Scale Tagestour 8.10.» und eine Testfahrt («testnavigation», 1 min) stehen in der Liste. Die wiederholten Symbole am rechten Rand des Screenshots sind kein Fehler der App (Browser-Erweiterung im Screenshot).

## Was ist neu
- **Karte «Aufräumen»** über der Liste (`src/lib/touren/AufraeumKarte.svelte`): «Zusammenlegen» legt alle Gruppen gleicher Touren so zusammen, wie das Fenster «Doppelte prüfen» es vorschlägt (mit Rückgängig 8 s); «Erst ansehen» öffnet das Fenster. Dazu «Als Test markieren» für Touren, deren Name wie ein Test beginnt (setzt den Schalter «Testtour», mit Rückgängig; nach Rückgängig wird nicht noch einmal vorgeschlagen). Nichts wird gelöscht.
- **«Meine Touren»** statt «Mit Packliste» (die Liste enthält auch Fahrten aus GPX); Zeilen mit vergangenem Datum sagen «Datum vorbei, gefahren?».
- **Ein Knopf «Als Tabelle bearbeiten»**; die Tabelle aller vergangenen Touren ist ein Link darunter.
- **Ein Rennen nur einmal oben:** die Pack-Karte eines Rennens trägt «Zum Rennen»; die Zeile «Dein Rennen» und der zweite «Packen öffnen» bei «Geplant» fehlen dann. «Weiter: Kleider» statt «Weiter mit Kleider».
- **Erklärungen im «?»-Fenster:** «So liest du die Liste» (Farben, woher die Werte kommen) steht dort, nicht mehr unter der Liste. «Auf dieser Seite» springt zu allen vier Teilen. Die Sprungleiste bei «In Zahlen» erscheint nur, solange eine Gruppe offen ist.
- «Beste Tage: Do, Fr und So»; Karte aller Touren etwas niedriger; weicher Schatten am unteren Rand der rechten Spalte; «Kommt später, wenn es passt» mit einem erklärenden Satz.
- Neu: `touren-klarer.js` (Texte), `tests/touren-klarer.test.js`; geändert unter anderem `Trips.svelte`, `PackKarten.svelte`, `NextRaceRow.svelte`, `hints.js` (Absatz «So liest du die Liste» als `read`), `HintCard.svelte`.

## Was fällt weg oder rutscht tiefer
- Die Legende der Farben und die Fussnote unter der Liste (alter Weg: unter der Liste; neuer Weg: «?» oben, «So liest du die Liste»).
- Die Zeile «n Touren sehen doppelt aus · Doppelte prüfen» (jetzt die Karte «Aufräumen»; die Zeile «n ausgeblendet · Wieder trennen» bleibt).
- Der Link «Als Tabelle ›» neben der Liste (jetzt unter der Tabelle: «Alle vergangenen Touren als Tabelle»).
- Die Zeile «Dein Rennen: …» oben, wenn das Rennen schon eine Pack-Karte hat; der zweite Knopf «Packen öffnen» in der Karte bei «Geplant».
- Die zweite Chip-Leiste unter «In Zahlen», solange alle Gruppen zu sind.

## Selbst entschieden
- «Zusammenlegen» auf der Karte wendet für jede Gruppe den Vorschlag an (Rückblick zuerst, dann am meisten gepackt). Weil es nur archiviert und mit Rückgängig sowie «Wieder trennen» zurückkommt, ist kein zusätzliches Fragefenster davor (Löschregel in `CLAUDE.md`: schnell wieder herstellbar, darum sofort mit Rückgängig).
- «Wie ein Test» wird nur am Namen erkannt (`isTestName`), nicht an kurzen Fahrten: eine kurze Fahrt kann echt sein. «Fahrt Fr., 23.10.» (0 km, 14 min) wird darum nicht vorgeschlagen.
- Frage 1a/Tabelle: statt eines Auswahlpunkts «Ansehen / Bearbeiten» bleibt ein Knopf («Als Tabelle bearbeiten» wie auf Notizen, Fahrten, Dokumenten) und der Link zur Seite der vergangenen Touren steht unter der Tabelle. Ein Knopf weniger, gleiche Wörter wie auf den anderen Seiten.
- Die zwei Filter (Suche mit Jahr/Velo/Art/Distanz oben, rechter Kasten) sind **nicht** zu einem Filter verschmolzen: das berührt die «Suche am Ort» (anderer Thread, Entscheid Noahs vom 22.11.). Der rechte Kasten heisst «Liste filtern». Offen als Frage an Noah.
- «Gehört zu …» und «Tipps für diese Seite ›» bleiben (siehe Entscheid): sie sind Bausteine aller Seiten.
- Karte aller Touren: nur niedriger (Zeichnung 600×240, höchstens 300 px), weil sie sich schon an die Strecken anpasst; die Leere kommt von weit auseinanderliegenden Strecken.
- Der Satz bei «Kommt später, wenn es passt» gilt für alle Seiten (ein gemeinsamer Baustein).
- Fertig-Regel: kein neuer Eintrag in `features.js`; die Karte ist ein Hilfsmittel der Seite Touren (wie das Fenster «Doppelte prüfen»). Einstieg: die Karte selbst; Beschreibung: `docs/app-stand.md`; leere Ansicht: die Karte fehlt, wenn nichts aufzuräumen ist. Name: `docs/namen.md` Zeile 56.
- Alte Tests angepasst, nicht gelockert: Überschrift («Meine Touren»), Etikett «Datum vorbei, gefahren?», keine Legende mehr, Sprungleiste nur bei offener Gruppe, Doppelte als Karte; neu: Zusammenlegen mit Rückgängig, Als Test markieren mit Rückgängig.

## Entscheide (eigene Datei `docs/decisions/touren-klarer.md`)
- 25.11.2026: Noah «1-5a» (alle a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Dient «Klarheit» und «Auffindbarkeit» (Block 1) und dem Leitfaden («Eine App, die mich im Alltag unterstützt»). Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Übersicht: über «Meine Touren» steht eine Karte «Aufräumen» (wenn doppelte oder wie Test benannte Touren da sind). «Zusammenlegen» tippen: die gleichen Touren sind eine, «Rückgängig» bringt sie zurück.
2. «Als Test markieren» tippen: die Testtour verschwindet aus der Liste, «Rückgängig» bringt sie zurück.
3. Oben steht das Rennen nur einmal (Pack-Karte mit «Zum Rennen»), nicht noch als Zeile «Dein Rennen».
4. Das «?» oben öffnen: «So liest du die Liste» erklärt Farben und Werte; unter der Liste steht keine Legende mehr.
