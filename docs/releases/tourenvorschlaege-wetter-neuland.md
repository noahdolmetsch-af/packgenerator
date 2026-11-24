# Tourenvorschläge: Wetter und Neuland

PR folgt · 24.11.2026 · Auftrag: Noah «a» (Wetter) und «1, 2, 3, 4 (wichtig, lieblingsfeature), 5» (Neuland), Thread «Mehr schwere MTB-Touren». Beide Teile ändern dieselbe Seite und gehen darum in einem PR (Regel von Noah 24.11.2026 06:29: kleine Änderungen derselben Seite bündeln).

## Was ist neu
### Wetter
- Jede Tour zeigt eine Ampel für Heute, Morgen und Übermorgen (passt, mit Vorsicht, lieber nicht), mit dem Grund (Gewitter, Regen, Wind, kalt oben, heiss).
- Der beste Tag der nächsten zehn («Bester Tag: Sa. 28.11.»), wenn heute nicht passt.
- «Nasse Wege»: nach mindestens 5 mm Regen in den zwei Tagen davor sind Trail und technische Touren rutschig, Schotter und Wege bleiben gut fahrbar.
- Filter «Wetter» (Egal, Heute, Morgen, Übermorgen, Wochenende): rote Tage fallen weg, gute Touren stehen zuerst.
- Auf der Tour: «Wetter für diese Tour» mit den nächsten 7 Tagen (Temperatur bis zum höchsten Punkt gerechnet, Regen, Böen) und eine Zeile «Wetter» in «Warum dieser Vorschlag?» (abschaltbar).
- Startzeit: für heute, morgen und übermorgen die beste Startzeit für die Fahrzeit der Tour («Start 08:00, zurück etwa 13:00»), mit Warnungen wie «Gewitter möglich ab 15:00» (der Stundenwetter-Kern der App, wie auf der Tour-Seite).
- Anziehen: was für die beste Startzeit mitgenommen wird (zum Beispiel lange Handschuhe, Windjacke, Regenjacke), mit Link zum Kleiderschrank.
- Karte: ein Ring um jeden Startpunkt zeigt die Ampel des gewählten Tages (heute, oder der Tag aus dem Filter): grün, gelb, rot gestrichelt; die Karte erklärt die Ringe; die Hover-Karte nennt das Wetter.

### Neuland
- Filter «Neuland» (Egal, Neuestes zuerst, Mindestens zur Hälfte neu, Mit neuem Pass oder Gipfel, Neuer Kanton). «Neuestes zuerst» sortiert nach dem Anteil neuer Strecke (`newShare`); die anderen lassen Touren weg, die nicht passen.
- Auf der Karte der Tour sind die Stücke, die du schon gefahren bist (innerhalb von 150 m deiner eigenen Fahrten), grau; die neuen behalten die Farbe der Tour. Eine Zeile unter der Karte erklärt es.
- Neue Kantone: die Karte sagt «Ein neuer Kanton für dich: …», wenn du in diesem Kanton noch nie gefahren bist (Neuland › Kantone zählt).
- Pässe und Gipfel auf dem Weg (Lieblingsfunktion): alle Pässe und Gipfel von Neuland (über 3000 m), die höchstens 500 m neben der Linie liegen, mit Höhe, km auf der Tour und «Neu für dich» oder «Schon erreicht». Auf der Karte als Raute (Pass) und Dreieck (Gipfel) mit Namen; farbig = neu. In der Liste sagt die Zeile der Tour «Neu für dich: …».
- Monatsziel («3 Touren mit über 60 % neu»): bei der Tour von Hand abhaken; Zeile «Ziel im November: 1 von 3 …» unter «Neuland» in den Filtern; «Ziel ändern» (1 bis 5 Touren, über 40/60/80 %) oder ganz ausschalten. Ruhig: nichts passiert, wenn du es nicht schaffst.
- Neu für andere Seiten: `toursNear(tours, lat, lon)` in `src/lib/vorschlaege/neuland.js` liefert die Touren an einem Punkt (das Gipfelbuch kann damit zu einem Gipfel eine Tour zeigen).

## Was fällt weg oder rutscht tiefer
- nichts (zwei neue Filtergruppen «Wetter» und «Neuland» unter «Für dich» und ein Abschnitt «Neuland auf dieser Tour»; ohne Verbindung fehlen die Wetterzeilen und der Filter tut nichts).

## Selbst entschieden
### Wetter
- Eine Anfrage für alle Touren: Der Startpunkt jeder Tour fällt in eine Zelle von 0,25° (etwa 20 km, 66 Zellen für 200 Touren); Open-Meteo antwortet für alle Zellen auf einmal (2 Tage zurück, 16 voraus). Es gehen nur Koordinaten öffentlicher Touren hinaus, nie dein Wohnort. Die Antwort wird 3 Stunden gemerkt (`db.meta`, wie der Wetterkern), bei Ausfall bis zu einem Tag.
- Grenzen der Ampel (ein Vorschlag, in `wetter.js` änderbar): rot bei Gewitter, ab 8 mm Regen, Böen ab 70 km/h, oben unter −3 °C; gelb ab 2 mm Regen (oder 50 % Regenchance und etwas Regen), Böen ab 45 km/h, oben unter 3 °C, ab 32 °C.
- Die Temperatur oben ist die Tageshöchsttemperatur des Orts minus 0,65 °C je 100 m bis zum höchsten Punkt der Tour.
- Der beste Tag wird nur in den nächsten zehn Tagen gesucht: weiter draussen ist eine Vorhersage nur geraten.
- Noah wollte «die anderen drei ebenfalls in diesen PR»: Startzeit, Anziehen und Ringe auf der Karte sind drin (01:44). Startzeit und Anziehen nutzen den vorhandenen Stundenwetter-Kern (`bestWindows`, `packHints` in `src/lib/wetter/kern.js`), kein neuer Dienst; nur für die geöffnete Tour wird der Kern für ihren Startpunkt geladen (nur Tourkoordinaten).
- Der Ring auf der Karte ist ein Ring (Rand, rot gestrichelt) und keine Füllung: die Füllung der Punkte zeigt weiter die Kondition.

### Neuland
- Neuland wird nur gelesen (`computeNeuland` mit Kantonen, Pässen und Gipfeln, samt Gipfelbuch-Besuchen): nichts wird doppelt gezählt, und die Seite schreibt nicht ins Gipfelbuch. Ein Pass wird von Neuland selbst gezählt, sobald eine Fahrt ihn berührt.
- Das einzige Neue, das gespeichert wird, ist das Monatsziel (`settings` «vorschlaege.neuziel»: an/aus, Anzahl, Anteil, abgehakte Touren je Monat). Es ist neu und nur dazugekommen: das Backup enthält es mit allen Einstellungen, kein altes Format ändert sich.
- Das Ziel wird von Hand abgehakt, nicht automatisch: eine Tour aus dem Vorschlag ist nicht zwingend die Fahrt, die man danach macht.
- Ohne eigene Fahrten (kein `grid`) fehlen die Anteile und die graue Strecke, der Text sagt es; «Mindestens zur Hälfte neu» lässt dann alle stehen.
- «Neuestes zuerst» geht vor der Wetter-Sortierung (wer beides wählt, bekommt die neuesten zuerst; das Wetter filtert weiter).

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-wetter-neuland.md`)
- 24.11.2026: Wetter (Noah «a») und Neuland (Noah «1, 2, 3, 4, 5») in den Tourenvorschlägen, in einem PR.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.
