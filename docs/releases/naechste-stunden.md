# Die nächsten Stunden

PR #… · 27.10.2026 · Auftrag: Noah «4a» (Thread «Analysieren Herausforderungen Ultra-Rennen», Ziel 6)

## Was ist neu
- Wetter-Seite: neue Karte «Die nächsten Stunden» direkt unter «Heute». Für in 2, 4, 6 und 8 Stunden: sind sich die Wettermodelle einig (alle trocken, alle Regen, «2 von 5 Modellen: Regen»), Regenmenge von–bis, Temperatur, stärkste Böe, Gewitter.
- «Modelle zeigen» öffnet eine Tabelle mit jedem Modell (MeteoSchweiz 1 km und 2 km, DWD ICON-D2, Météo-France AROME, ECMWF).
- Eine Anfrage an Open-Meteo für alle Modelle (gratis, ohne Schlüssel), auf dem Gerät eine Stunde gespeichert, offline bis 6 Stunden mit «älter als eine Stunde».

## Was fällt weg oder rutscht tiefer
- Die Karten unter «Heute» (Beste Zeit, Orte vergleichen, …) rutschen um eine Karte tiefer.

## Selbst entschieden
- Erster Schritt am gewählten Ort der Wetter-Seite (Zuhause, Tour-Start oder gesuchter Ort). «Entlang der Route, wo du in 2/4/6/8 h bist» (4a) kommt als nächster kleiner PR; auf der Live-Karte baut es der Thread «Live Navigation».
- Fünf Modelle; ein Modell, das den Ort nicht abdeckt, fehlt einfach.
- «Einig» heisst: alle Modelle unter bzw. über 0.3 mm Regen im Zeitfenster (gleiche Grenze wie der Wetter-Kern).

## Entscheide (für decisions.md)
- keine neuen (Noah «4a» steht schon in decisions.md, 27.10.2026 Ziel 6).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel 6, «Wetter für die nächsten 2, 4, 6 und 8 Stunden»: Teil 1 (am Ort) gebaut; Teil 2 (entlang der Route) folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wetter öffnen.
2. Unter «Heute» steht «Die nächsten Stunden» mit vier Zeilen. Vorher kam direkt «Beste Zeit für eine Fahrt».
3. «Modelle zeigen» antippen: Tabelle mit den Modellen.
