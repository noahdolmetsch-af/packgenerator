# Ein Spruch hinter dem Logo

PR (diese Änderung) · 03.11.2026 · Noah 03.11. «H1 H2 H6 H7 H8 H9» (Thread «Sammeln: Geheimmenü-Ideen fürs Logo»), H6 «Velo-Weisheit»; Ziel 5 «Alltag», Entscheid 26.10. «Bewegung überall sanft»

Baut auf PR «Geheimnis im Logo» (Velo, Idee 29) auf: gleiche fünf Tipps, gleicher Code (`src/lib/logo/`).

## Was ist neu
- Fünfmal schnell auf «PG» tippen zeigt jetzt mal das Velo, mal eine Sprechblase am Logo mit einem kurzen Spruch in Mundart, z. B. «Gägewind isch Gratis-Training.» (etwa viereinhalb Sekunden).
- Zwanzig Sprüche als Anfang. Nie derselbe Spruch zweimal hintereinander.
- Die Überraschung wird zufällig gewählt, nie dieselbe zweimal hintereinander (Koordinator 03.11. «a»). Neue Überraschungen kommen später nur in `SURPRISES` (`src/lib/logo/surprises.js`) und bekommen einen eigenen Block in `LogoRide.svelte`.
- Die Sprüche sind eine Liste unter Ich › Listen und Typen › Kleine Überraschungen › «Sprüche im Logo»: ändern, ausblenden, löschen, eigene dazuschreiben, mit «Rückgängig» und «Auf Standard zurücksetzen» (die vorhandene Technik der Listen, deshalb auch im Backup). Sind alle ausgeblendet oder gelöscht, kommt nur noch das Velo.
- Mit «Bewegung reduzieren» blendet die Blase nicht ein, sie steht einfach da.

## Was fällt weg oder rutscht tiefer
- nichts. Das Velo kommt jetzt nicht mehr bei jedem fünften Tipp, sondern im Wechsel mit dem Spruch (Zufall).

## Selbst entschieden
- Die Sprüche sind eine App-Liste (`applists.js` 'sayings', `standard.js`), nicht eine neue Datenstruktur: Umbenennen, Löschen, Rückgängig und Backup kommen so mit, ohne Änderung am Datenspeicher (kein neues Schema).
- Pfeile und Ziehen gibt es wie in jeder Liste, auch wenn die Reihenfolge hier keine Rolle spielt (der Zufall wählt).
- Eingabefeld für Sprüche 120 statt 40 Zeichen (`maxlen` im Fenster der Liste); die anderen Listen bleiben bei 40.
- Mundart-Sprüche sind ein Entwurf von mir, Noah ändert sie in der Liste, wie er will. Die englischen Texte (Quelle) sind frei übersetzt.
- Der Spruch ist nicht abschaltbar und nicht im Funktionskatalog (wie das Velo: ein Geheimnis). Verraten nur im «Neu»-Eintrag mit Sprung zur Liste.
- Die deutsche Datei des Velos (`logo-geheimnis.js`) war nirgends in `de/index.js` eingebunden; ich habe sie dort mit eingetragen, sonst blieb «Have a good ride!» englisch.
- Die E2E-Tests setzen den Zufall nach dem Laden fest (`Math.random`), damit sie nicht flackern. Das bestehende Velo-Spec tut das jetzt auch.
- Nur eine «Neu»-Datei pro PR: zwei Dateien in einem PR bekommen dieselbe Version (doppelte Versionsnummer, `tests/whatsnew.test.js` wird rot). Der «Neu»-Eintrag des Velos (aus #759) steckt deshalb in `logo-spruch.js`; die Release-Datei `logo-geheimnis.md` bleibt.
- `docs/app-stand.md`: die Zeile «Listen und Typen» nennt jetzt auch die Sprüche im Logo.

## Entscheide (für decisions.md)
- 03.11.2026: Mehrere Logo-Überraschungen teilen die fünf Tipps; Auswahl zufällig, nie dieselbe zweimal hintereinander (Koordinator «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- `vorhaben-liste.md`: Abschnitt «Geheimmenü» mit H6 (in Arbeit), H2 (gewählt, wartet auf den Murmeltier-Baustein aus Idee 28), H9, H8, H7, H1 (gewählt) und H5 Pass-Sprint (Idee für später).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute oben links fünfmal schnell auf «PG» tippen: mal fährt das Velo, mal erscheint eine Sprechblase mit einem Spruch.
2. Ich › Listen und Typen › Kleine Überraschungen › «Sprüche im Logo» öffnen: einen eigenen Spruch dazuschreiben, einen löschen, «Rückgängig» antippen.
3. Nur dreimal tippen: nichts passiert.
