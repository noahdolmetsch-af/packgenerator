# Rückblick pro Sportart: das Jahr einer Sportart

21.11.2026 · Auftrag: Noah «ich möchte alle entwürfe 1-3 umsetzen» (Thread «Jede Sportart durchgehen», Umsetzungsauftrag S4, Entwurf 2); gestapelt auf Sportjahr (S3)

## Was ist neu
- Neue Seite **Rückblick pro Sportart** (`#/auswerten/sportjahr/<Sportart>`): im Sportjahr öffnet ein Tipp auf eine Sportart unter «Wo ging die Zeit hin?» ihr Jahr.
- Oben der Zeitraum-Schalter des Sportjahrs; vier Zahlen mit dem Vorjahr daneben: Zeit, Einheiten, durchschnittliche Dauer (nur aus gemessener Zeit) und Strecke (nur wo es eine gibt).
- «Stunden pro Monat» (Jahr), pro Tag oder pro Jahr, im Jahr mit dem Vorjahr als gestrichelter Linie; «Als Tabelle».
- «Wo kommt es her?»: Einheiten aus Strava und von Hand.
- «Bestwerte»: längste Einheit, weiteste Strecke, meiste Einheiten in einem Monat. Eine geschätzte Zeit («ca.») ist nie ein Rekord.
- Auf der Seite einer Sportart (Aktiv › Sportart) eine Karte **«Dein Jahr»** mit Link auf diese Seite.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- **Abweichung vom Entwurf (m2):** das Diagramm zeigt Stunden statt Einheiten pro Monat, damit es wie das Sportjahr zählt; «Schnellstes Tempo (10 km)» fehlt, weil die Einheiten keine Teilstrecken kennen; der Zeitraum-Schalter ist der gleiche wie im Sportjahr (Woche, Monat, Jahr, Alles, eigener Zeitraum).
- Die Karte «Gefühl» (leicht, gut, hart) fehlt noch: das Feld kommt aus dem Thread «Training erfassen». `einheiten.js` reicht es schon durch; sobald es da ist, kommt die Karte in einem kleinen PR dazu.
- «Dauer nachtragen» im Entwurf ist S12; solange steht die Zeile «Bei N Einheiten ist die Zeit geschätzt» mit Link zur Übliche-Dauer-Einstellung da.
- Die Karte «Dein Jahr» auf der Sportseite ist nur ein Link mit einem Satz, ohne eigene Zahlen (die Zahlen stehen auf der Seite, sonst rechnet jede Sportseite alles noch einmal).
- Fertig-Regel: (1) `f.sportrueckblick` in `features.js` mit So geht's und Beispiel, (2) Absprung: Tipp auf eine Sportart im Sportjahr und die Karte «Dein Jahr», (3) «Gut zu wissen»: nicht gebaut, die Seite steht nicht in `ON_PAGES`, (4) leerer Zustand: «In diesem Zeitraum ist nichts» mit Weg zum Sportjahr, (5) nächster Schritt: «Übliche Dauer ändern» und Weg zurück zum Sportjahr, (6) Zeile im App-Stand.
- Namen: «Dein Jahr» in `docs/namen.md` Nr. 28 (Arbeitsname).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr: S4 gebaut (hängt an S1 bis S3). Danach S5 alte Auswertung ablösen (erst nach Noahs Freigabe von S3).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Sportjahr › «Jahr» › «Wo ging die Zeit hin?» › eine Sportart antippen: oben stehen Zeit, Einheiten, Dauer und Strecke mit dem Vorjahr daneben.
2. Unter dem Diagramm «Wo kommt es her?» und «Bestwerte» ansehen.
3. Aktiv › Sportart öffnen: die Karte «Dein Jahr» führt auf dieselbe Seite.
