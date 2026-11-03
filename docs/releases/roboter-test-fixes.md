# Kleine Anzeigefehler behoben

PR #512 (Roboter-Test) · 01.11.2026 · Auftrag: Noah «mache einen kompletten UI-Test … kleinere Dinge behebst du gleich», dann «1a 2a 3a 4a 5a» (Thread «Prüfen: kompletter Roboter-UI-Test»)

## Was ist neu
- F01 Analyse: «höchster ({day})» zeigte den Platzhalter, wenn der höchste Tag in einer Tour lag. Touren haben `title`, der Code las `name`. Jetzt `title`, sonst `name` (`AnalyseWert.svelte`, `detail.js tripBands`).
- F02 Heute, «Schnell öffnen» (Handy): lange Namen brechen in zwei Zeilen um statt mit «…» zu enden (`Wall.svelte`).
- F03 Ein paar kleine Einzel-Links (Analyse «Auch in der bisherigen Ansicht», Aktiv «Eigene Körperwerte ›», Heute «Mehr Impulse») haben eine 44-px-Tippfläche, ohne dass sich das Bild ändert. Die Pfad-Links, «?»-Knöpfe und «Mehr zu …» hatten sie schon; der Roboter hatte sie nur zu klein gemessen.
- F04 Analyse: Die zwei Chips «+ Velo» heissen jetzt «+ Velo» und «+ Velo (km)».
- F05 Wetter › Meine Webcams: der Hinweistext hatte die Browser-Schrift, weil `race.css` fehlte. Jetzt dieselbe Grösse wie überall.
- F06 Ozon und Pollen: «Nochmals» zeigt «Lädt …» und danach «Immer noch nicht erreichbar» (`AirCard.svelte`).
- F07 Karten (Tour, Heatmap): Laden 3 Kacheln fehl und keine gelingt, sagt eine Zeile «Das Kartenbild lädt gerade nicht. Deine Linien und Orte sind trotzdem da.» (`map/TileNote.svelte`).
- F08 «Was ist neu»: doppelte Versionsnummern lassen die Seite nicht mehr abstürzen (Schlüssel mit Position).
- F09 Englische Tourennamen sind deine eigenen Namen: nichts geändert.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Zwei Zeilen statt einer Kürzung bei den Schnellzugriffen.
- F03 nur für Einzel-Links, nicht für Links mitten im Satz (die brauchen keine 44 px).
- Die Kartenzeile erscheint erst nach 3 Fehlern ohne einen Erfolg, damit sie nicht bei einer einzelnen Kachel aufblitzt.

## Entscheide (für decisions.md)
- Keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Analyse › SpO2: bei «höchster» steht ein Tag oder Tourname, nie «{day}».
2. Handy, Heute › «Schnell öffnen»: «Was ziehe ich an?» ist lesbar.
3. Eine Tour mit Karte im Flugmodus öffnen: Die Zeile zum Kartenbild erscheint.
