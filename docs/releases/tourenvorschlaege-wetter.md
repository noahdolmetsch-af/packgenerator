# Tourenvorschläge: das Wetter

PR folgt · 24.11.2026 · Auftrag: Noah «a» (Thread «Mehr schwere MTB-Touren», Punkt 4 der klugen Vorschläge)

## Was ist neu
- Jede Tour zeigt eine Ampel für Heute, Morgen und Übermorgen (passt, mit Vorsicht, lieber nicht), mit dem Grund (Gewitter, Regen, Wind, kalt oben, heiss).
- Der beste Tag der nächsten zehn («Bester Tag: Sa. 28.11.»), wenn heute nicht passt.
- «Nasse Wege»: nach mindestens 5 mm Regen in den zwei Tagen davor sind Trail und technische Touren rutschig, Schotter und Wege bleiben gut fahrbar.
- Filter «Wetter» (Egal, Heute, Morgen, Übermorgen, Wochenende): rote Tage fallen weg, gute Touren stehen zuerst.
- Auf der Tour: «Wetter für diese Tour» mit den nächsten 7 Tagen (Temperatur bis zum höchsten Punkt gerechnet, Regen, Böen) und eine Zeile «Wetter» in «Warum dieser Vorschlag?» (abschaltbar).
- Startzeit: für heute, morgen und übermorgen die beste Startzeit für die Fahrzeit der Tour («Start 08:00, zurück etwa 13:00»), mit Warnungen wie «Gewitter möglich ab 15:00» (der Stundenwetter-Kern der App, wie auf der Tour-Seite).
- Anziehen: was für die beste Startzeit mitgenommen wird (zum Beispiel lange Handschuhe, Windjacke, Regenjacke), mit Link zum Kleiderschrank.
- Karte: ein Ring um jeden Startpunkt zeigt die Ampel des gewählten Tages (heute, oder der Tag aus dem Filter): grün, gelb, rot gestrichelt; die Karte erklärt die Ringe; die Hover-Karte nennt das Wetter.

## Was fällt weg oder rutscht tiefer
- nichts (eine neue Filtergruppe «Wetter» unter «Für dich»; ohne Verbindung fehlen die Wetterzeilen und der Filter tut nichts).

## Selbst entschieden
- Eine Anfrage für alle Touren: Der Startpunkt jeder Tour fällt in eine Zelle von 0,25° (etwa 20 km, 66 Zellen für 200 Touren); Open-Meteo antwortet für alle Zellen auf einmal (2 Tage zurück, 16 voraus). Es gehen nur Koordinaten öffentlicher Touren hinaus, nie dein Wohnort. Die Antwort wird 3 Stunden gemerkt (`db.meta`, wie der Wetterkern), bei Ausfall bis zu einem Tag.
- Grenzen der Ampel (ein Vorschlag, in `wetter.js` änderbar): rot bei Gewitter, ab 8 mm Regen, Böen ab 70 km/h, oben unter −3 °C; gelb ab 2 mm Regen (oder 50 % Regenchance und etwas Regen), Böen ab 45 km/h, oben unter 3 °C, ab 32 °C.
- Die Temperatur oben ist die Tageshöchsttemperatur des Orts minus 0,65 °C je 100 m bis zum höchsten Punkt der Tour.
- Der beste Tag wird nur in den nächsten zehn Tagen gesucht: weiter draussen ist eine Vorhersage nur geraten.
- Noah wollte «die anderen drei ebenfalls in diesen PR»: Startzeit, Anziehen und Ringe auf der Karte sind drin (01:44). Startzeit und Anziehen nutzen den vorhandenen Stundenwetter-Kern (`bestWindows`, `packHints` in `src/lib/wetter/kern.js`), kein neuer Dienst; nur für die geöffnete Tour wird der Kern für ihren Startpunkt geladen (nur Tourkoordinaten).
- Der Ring auf der Karte ist ein Ring (Rand, rot gestrichelt) und keine Füllung: die Füllung der Punkte zeigt weiter die Kondition.

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-wetter.md`)
- 24.11.2026: Wetter in den Tourenvorschlägen, erster Schritt mit Ampel, bestem Tag, nassen Wegen und Filter (Noah «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.
