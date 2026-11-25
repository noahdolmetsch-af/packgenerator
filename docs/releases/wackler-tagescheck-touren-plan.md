# Wackel-Tests: gemeinsamer Fix für Fenster und goto, Tagescheck und Touren-Plan

25.11.2026 · Auftrag: Wackel-Wächter (Thread «Wackel-Tests zuverlässig machen»; gemeldet vom Bündler: `tages-check.spec.js:349` auf PR 1755, `touren-a2.spec.js:60` auf PR 1752 und 1733)

## Was ist neu
- Nichts Sichtbares geändert, nur Tests.
- **Gemeinsame Ursache (Bündler-Auftrag, Vorrang):** ein geschlossenes Fenster gibt seinen Verlaufsschritt eine Aufgabe später zurück (`history.back()` in `backclose.js`). Ein `goto` oder Neuladen, das genau dazwischen startet, wird abgebrochen (`net::ERR_ABORTED`) oder endet auf der alten Seite. So sahen es `tages-check:349`, früher `erinnerung`, `bedienung:31`, `haustuer:150` und die gemeldeten `au`, `termine`, `daumen`, `suche-zuletzt-seiten`. Der gemeinsame Test-Baustein `tests/e2e/clock.js` (ihn nutzen alle Specs mit festem Tag) wartet jetzt vor jedem `goto` und Neuladen auf den Zustand «kein Verlaufsschritt eines geschlossenen Fensters mehr offen». Ein Fenster, das mit Absicht offen ist, zählt nicht; bleibt der Eintrag aus irgendeinem Grund, geht der Test nach 3 s weiter und scheitert wie bisher.
- **Tagescheck, Sonntagsfrage:** «Speichern» schliesst das Fenster der Abend-Runde. Das geschlossene Fenster gibt seinen Verlaufsschritt erst eine Aufgabe später zurück (`backclose.js`); fiel das Neuladen des Tests dazwischen, brach es mit `net::ERR_ABORTED` ab. Der Test wartet jetzt (auf den Zustand, nicht auf Zeit), bis das Fenster zu ist und sein Verlaufsschritt weg ist. Mit gebremster CPU kam der Fehler in 1 von 24 Läufen; mit dem Fix 24 von 24 grün, und auch nur mit dem gemeinsamen Baustein (ohne den Einzel-Fix) 24 von 24 grün.
- **Touren-Plan, Sportart pro Tag** (zwei Ursachen, beide nur im Test behoben): jeder Tap auf «Velo», «Wandern» oder «Ruhetag» speichert die ganze Liste, gebaut aus der Tour, wie die Seite sie gerade kennt. Zwei sehr schnelle Taps (nur ein Test ist so schnell) speicherten dadurch die alte Liste noch einmal, und der erste Tap ging verloren. Der Test wartet nach dem ersten Tap, bis die Seite ihn zeigt. Mit 6-fach gebremster CPU waren davor 10 von 16 Läufen rot, danach 16 von 16 grün (auch 12-fach gebremst). Zweitens sprang einmal im 3×-Lauf auf dem Computer der frisch geöffnete Block «Grenzübertritt» wieder zu (Felder da, dann der Knopf weg, 90 s Wartezeit); die Ursache ist nicht bestätigt (Verdacht: die Karte wird nach einem Speichern neu gezeichnet). Die Schritte «Unklare Stellen» und «Grenzübertritt» beginnen deshalb bei Bedarf neu mit «Block offen».

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert, keine feste Wartezeit. Die rote Stelle im CI (`locator.tap` 90 s bei «Hinzufügen») liess sich nicht nachstellen; nachgestellt wurde ein anderer Fehler in derselben Datei. Der Eintrag in `docs/wackelliste.md` bleibt deshalb auf «beobachten».
- Die App speichert bei zwei sehr schnellen Taps die alte Liste noch einmal, und ein gerade geöffneter Block kann nach einem Speichern wieder zuspringen. Ein Mensch ist dafür meist zu langsam; nicht geändert, hier festgehalten (Befund für die Seite «Pack»).
- **Suche «Zuletzt geöffnet»** (`suche-zuletzt-seiten.spec.js:28`): zwei Ursachen, mit 6-fach gebremster CPU nachgestellt (3 von 24 rot, danach 32 von 32 grün). Die Daten-Seite des Imports kann als dritte Zeile in der Liste stehen, wenn sie kurz offen blieb; der Test prüft jetzt die ersten zwei Zeilen und dass die aktuelle Seite fehlt. Und die App schreibt eine gezählte Seite erst nach 900 ms in die Liste (lesen, ändern, schreiben): kam das nach «Liste vergessen» und «Rückgängig», überschrieb es «Rückgängig». Der Test wartet vor dem Vergessen, bis die Seite gezählt ist. (Die App-Seite, ein Wettlauf bei sehr schnellem Vergessen und Rückgängig, ist ein Befund für die Suche, nicht geändert.)
- Weitere Meldungen (`karte-skizze`, `gt20-touren:68`, `kleideranpassen:219`, `wunschanfrage:139`, `warumregeln:50`) stehen als «beobachten» in der Liste: lokal 14 von 14 grün, keine Fehlerzeile.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.
