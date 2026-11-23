# Analyse übersichtlicher

PR folgt · 23.11.2026 · Auftrag: Noah «ja» (Thread «Analyse-Seite viel besser machen»)

## Was ist neu
- **Was auffällt** ganz oben auf der Übersicht: bis zu drei Sätze aus den Zahlen (am meisten dazugekommen, am meisten weniger als im Zeitraum davor, die laufende Woche gegen die Woche davor zur gleichen Zeit). Nur zum Anschauen, nicht wertend.
- **Kacheln mit Vergleich**: jede Kachel sagt, wie sie gegen die gleich langen Tage davor steht («−40 % gegen die 30 Tage davor»). Ein Tipp öffnet die Seite des Werts mit ihrem Verlauf (Haken und längste Serie springen zum Verlauf darunter).
- **Jeder Tag ein Feld** füllt die ganze Breite der Karte, mindestens 12 Wochen, immer ganze Wochen (Montag zuerst). Eine längere Zeitspanne scrollt seitwärts.
- **Verlauf** nutzt den gemeinsamen Diagramm-Baukasten (`BarChart`): Zahlen beim Zeigen, «Als Tabelle». Die **laufende Woche** ist gestrichelt mit «läuft» und zählt nicht im Schnitt (die Linie bricht dort ab).
- **Rangliste** in Gruppen (Bewegen, Achtsam, Erholung, die drei Ringe der App). Einträge mit 0× stehen in einem Aufklapper «Diesmal nichts». Eine Zeile antippen zeigt die genauen Zahlen.
- **Alle Sportarten**: Analyse (Übersicht, Eigenes Diagramm, Vergleiche …) zählt dieselben Einheiten wie Heute › Diese Woche: die Haken aus Aktiv plus Strava-Sportarten ohne Haken (Laufen, Wandern, Schwimmen …; Velofahrten zählen weiter über ihre Haken und die Fahrtenliste). Eine Strava-Aktivität mit Haken zählt einmal (`src/lib/analyse/alle.js`, gleiche Rechnung wie `stravaOthers` in `src/lib/flow/tickfokus.js`).
- **Fehler «Gym» doppelt**: zwei Einträge mit gleichem Namen (ohne Rücksicht auf Gross-/Kleinschreibung und Leerzeichen) sind eine Zeile. Die Daten bleiben unverändert, nur die Anzeige führt zusammen.
- **Fehler Seitenleiste**: der letzte Punkt unter Auswerten hiess «Eigenes Diagramm», öffnete aber die ganze Analyse (Übersicht zuerst). Er heisst jetzt «Analyse».
- **Eigenes Diagramm**: Was, Wie lange und Filter stehen über dem Diagramm. Die Namensliste aller Touren unter dem Diagramm ist weg: die Touren sind ein ruhiges Band (überlappende Touren zu einem Band zusammengefasst), der Name steht beim Antippen eines Tages und als Titel am Band. Zeigen auf einen Tag zeigt eine Zeile über dem Diagramm mit allen Werten. Einzelne sehr hohe Balken stauchen die übrigen nicht mehr (Achse endet etwas über den üblichen hohen Tagen, ein Strich am Balken und die Zeile «Achse endet bei …, höchster Tag …» sagen es). «Was auffällt» ist offen.
- **Was hängt zusammen?**: selbstverständliche Paare (Pulszonen und Zeit in Bewegung, Belastung und Velo, Schlaf und Schlafwert, …) sind aus der Liste der stärksten Zusammenhänge raus, damit echte Funde oben stehen. «keiner Zusammenhang (0.09)» heisst jetzt «Kein Zusammenhang» ohne Zahl.

## Was fällt weg oder rutscht tiefer
- Die Textzeile mit allen Tourennamen unter dem Diagramm: jetzt beim Antippen eines Tages (Tagesfenster) und als Titel am Band.
- Die Auswahl (Was, Wie lange, Filter) stand unter dem Diagramm, steht jetzt darüber (Noah 23.11.2026).
- Die Zahl «(0.09)» beim Zusammenhang: weg, die Stärke steht als Wort.
- Der Verlauf (Haken pro Woche) ist jetzt der gemeinsame Baukasten: Balken, Linie «Mittel aus 4 Wochen» und die Zahl beim Zeigen bleiben; «Als Tabelle» ist neu dazu.
- Sonst nichts.

## Selbst entschieden
- Die Gruppen der Rangliste sind die drei Ringe der App (Bewegen, Achtsam, Erholung). «Alltag» gibt es bei den Einträgen nicht als Eigenschaft; ein neues Feld dafür wäre ein Eingriff in die Daten.
- Zusammenführen nach Namen nur in der Anzeige. Welche zwei Einträge «Gym» heissen, steht in Aktiv und kann dort umbenannt oder gelöscht werden.
- Die laufende Woche zählt auch im Verlauf nicht im Schnitt, ihre Balkenhöhe bleibt sichtbar.
- Verlauf und Kalender zeigen mindestens 12 Wochen, auch wenn der Zeitraum «7 Tage» oder «30 Tage» ist; Rangliste und Kacheln folgen weiter dem Zeitraum.
- Die Selbstverständlich-Liste (`FAMILIES` in `src/lib/analyse/links.js`) ist ein Vorschlag und leicht zu ändern; zwei Werte frei zu wählen bleibt möglich.
- Strava-Sportarten ohne Haken erscheinen in der Rangliste unter dem Namen der Sportart (z. B. «Laufen») im Ring «Bewegen», wenn die Strava-Tabelle sie keiner Aktiv-Sportart zuordnet. Der Hinweis kam vom Wochenrückblick-Thread (Projektleitung), nicht direkt von Noah; er folgt Noahs Entscheid vom 22.11.2026 «alle Sportarten».
- Neue kleine Ergänzung im Baukasten `BarChart`: `cols[].dashed` (gestrichelte Säule für einen Zeitraum, der noch läuft). Abgestimmt mit dem Kursblick-Thread.
- Testeinträge in den Touren (test3, Test7, 202610240953 …) werden hier nicht gelöscht: Noah bekommt eine Liste zum Entscheiden (Thread «Touren-Liste aufräumen»).
- Fertig-Regel: Seite (`docs/app-stand.md` angepasst), Absprung und Hilfetext bestehen schon für Analyse (nichts Neues nötig), leerer Zustand und nächster Schritt unverändert.

## Entscheide (eigene Datei `docs/decisions/analyse-besser.md`)
- 23.11.2026: Analyse-Verbesserungen in einem PR (Noah «ja»), Auswahl über das Diagramm.

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung am Plan.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse › Übersicht: oben «Was auffällt» mit bis zu drei Sätzen; «Gym» steht in der Rangliste nur einmal.
2. Die Kacheln sagen «… gegen die 30 Tage davor»; tippe «79 Haken» (springt zum Verlauf) und «Schlaf» (öffnet die Seite des Werts).
3. «Jeder Tag ein Feld» füllt die Breite; im Verlauf ist die laufende Woche gestrichelt mit «läuft».
4. Reiter «Eigenes Diagramm»: Auswahl oben, keine Namensliste, Maus über das Diagramm zeigt die Werte des Tages; in der Seitenleiste ist «Analyse» markiert.
5. Darunter «Was hängt zusammen?»: keine Paare wie «Pulszonen ↔ Zeit in Bewegung»; bei keinem Zusammenhang steht «Kein Zusammenhang».
