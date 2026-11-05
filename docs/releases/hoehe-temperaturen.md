# Temperaturen nach Höhe

PR folgt · 05.11.2026 · Auftrag: Noah «1b 2a und c 3a (mehr Orte, Gipfelliste) 4b» (Thread «Temperaturen nach Höhe anzeigen»)

Das ist der erste von drei kleinen PRs (Wetterseite, Zeile auf Heute, «Skitour planen»). Er braucht das gemeinsame Luftschichten-Modul `profil.js` aus dem Thread «Nebelgrenze».

## Was ist neu
- Wetterseite, Reiter «Jetzt», unter der Seetemperatur: Karte «Temperaturen nach Höhe» mit 3000, 2000 und 1000 m ü. M. Spalten: jetzt, 6, 12 und 18 Uhr, dazu die nächsten zwei Tage als Tiefst bis Höchst (6–21 Uhr).
- Dazu die Nullgradgrenze in der Luft («etwa 1’600 m»).
- «Orte und Gipfel wählen»: mehrere Orte gleichzeitig (der Ort der Seite, Sedrun, Andermatt, Lenzerheide, Davos, St. Moritz, Grindelwald, Zermatt, Saas-Fee, Ascona) und eigene Orte (suchen, umbenennen, löschen mit Rückgängig).
- Schweizer Gipfel statt eines Ortes, sortiert nach «um 1000 m», «um 2000 m», «um 3000 m» (Üetliberg bis Tödi, 15 Stück): dann steht dort die Temperatur auf dem Gipfel selbst, in seiner Höhe.
- Quelle: die Luftschichten des Wettermodells (Open-Meteo, gratis), zwischen zwei Schichten gerade verbunden. Keine eigene neue Abfrage: dieselbe wie die Nebelgrenze, 3 Stunden gemerkt, ohne Netz mit Uhrzeit.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Wert = Temperatur der freien Luft auf dieser Höhe über dem Ort, keine Messung am Hang in der Sonne. Die Karte sagt das. Eine Höhe unter dem Boden des Ortes (z. B. 1000 m über Davos) oder über der obersten Schicht (etwa 4000 m bei sehr kalter Luft) zeigt «–» statt zu raten.
- Anzeige auf ganze Grad gerundet; berechnet wird mit einer Nachkommastelle.
- Standard ohne Auswahl: nur der Ort der Wetterseite. Die Auswahl ist eine normale, mitgesicherte Einstellung (`hoehe.orte`, `hoehe.eigene`).
- Die Gipfelliste und die Orte habe ich von Hand zusammengestellt (Höhen auf Meter gerundet, Lage auf etwa 1 km). Nicht gegengeprüft: ein falscher Wert wird in der Datei `src/lib/wetter/hoehe.js` geändert. Gipfel höher als etwa 3700 m fehlen mit Absicht, weil die obersten Luftschichten bei etwa 4200 m enden.
- Keine neue Funktion in `features.js`: es gehört zu «Wetter für eine Fahrt» (`f.weather`). Absprung ist die Wetterseite und, im nächsten PR, die Zeile auf Heute und «Skitour planen».
- Leere Ansicht: ohne Ort und ohne Auswahl steht ein Satz, der sagt, was zu tun ist. «Gut zu wissen» steht schon auf der Wetterseite.
- Test mit erfundenen Luftschichten. Von hier ist Open-Meteo nicht erreichbar: ob die echten Werte vernünftig aussehen, siehst du auf der echten Seite (Gegenprobe: die Nullgradgrenze der Karte passt zur Nullgradgrenze der Wetterzeile).

## Entscheide (für decisions.md)
- 05.11.2026: Temperaturen nach Höhe aus den Luftschichten, auf der Wetterseite und (später) auf Heute und in «Skitour planen» (Noah «1b 2a und c 3a 4b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Temperaturen nach Höhe ergänzt (PR 1 von 3). Folgt: Zeile auf Heute, Karte mit 500–4000 m und Hinweise in «Skitour planen».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wetter › «Jetzt»: unter der Seetemperatur steht «Temperaturen nach Höhe» mit 3000, 2000 und 1000 m. Die Werte nehmen mit der Höhe ab (ausser an einem Nebeltag: dann ist es oben oft wärmer).
2. «Orte und Gipfel wählen» öffnen, «Davos» und «Piz Corvatsch» antippen: beide bekommen eine eigene Tabelle. Bei Davos fehlt die 1000-m-Zeile (der Ort liegt höher).
3. «Eigenen Ort hinzufügen»: einen Ort suchen und antippen, dann umbenennen und löschen, danach «Rückgängig».
4. Flugmodus an, Seite neu öffnen: die letzten Werte bleiben, mit «Stand» und Uhrzeit.
