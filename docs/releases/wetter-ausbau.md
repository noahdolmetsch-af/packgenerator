# Mehr aus dem Wetter

Auftrag: Noah «a» (W1a W2a W3a) und «freigabe» im Thread «Wetter besser machen», 22.11.2026; «ja» zu weniger PRs (ein PR für das Wetter, der Teil mit Daten eigenständig).

## Was ist neu
- **B Regen in 15-Minuten-Schritten:** auf der Wetterseite (Jetzt) die Karte «Regen in den nächsten Stunden»: drei Stunden in zwölf Balken, ein Satz («Trocken in den nächsten 3 Stunden», «Regen ab 14:30, bis etwa 15:15»), «Landi-Regenradar im Fenster». Am Fahrtag eine kurze Zeile auf Heute. Daten: Open-Meteo `minutely_15`, kostenlos, 10 Minuten zwischengespeichert (`src/lib/wetter/regen15.js`).
- **A und G Wetter entlang der Route:** unter dem Streifen auf der Tour-Seite der Anteil Gegenwind, die kälteste Stelle, was die Strecke zu den Packhinweisen des Starts ergänzt (nur Text, nichts kommt von selbst auf die Liste) und die Webcams aus «Meine Webcams», die auf der Strecke liegen, mit der Uhrzeit, wann du vorbeikommst (`src/lib/wetter/routewx.js`).
- **C Wetter pro Fahrtag:** bei Touren über mehrere Tage eine Zeile pro Tag (Datum, Ziel, Temperatur, trocken oder Regen ab, Wind). Sie liest nur den Streifen, der schon auf dem Gerät liegt (`EtappenWetter.svelte`).
- **D Heute:** Schnee-, Nebel- und Nachtzeile stehen in einer geschlossenen Zeile «Wetter heute» mit einer Zusammenfassung; die Sonnen-Ausfahrt bleibt wie sie war.
- **W1 Eigener Ort:** «Wetter» steht am Computer in der Seitenleiste; die Leiste am Handy bleibt bei fünf Orten. Die Seite hat vier Reiter wie vorher (Jetzt, Radar und Kameras, Planen, Rückblick).
- **F Strasse nass oder trocken:** eine Zeile unter dem Wetter von heute (`strasse.js`).
- **H Fenster teilen:** im Reiter «Planen» kopiert ein Knopf das beste Fenster als kurzen Text (`teilen.js`).
- **Absprünge:** am Ende jedes Reiters eine ruhige Zeile «Als Nächstes» (Planen, Radar, Neuland, Packen, Heatmap, Wochenrückblick).
- Vier neue Funktionen im Katalog mit Anleitung, Beispiel und «Gut zu wissen» (`featreg/wetter-ausbau.js`).

## Was fällt weg oder rutscht tiefer
- Heute: Schnee-, Nebel- und Nachtzeile (und «Temperaturen nach Höhe») stehen nicht mehr einzeln offen, sondern hinter der geschlossenen Zeile «Wetter heute» (ein Tipp öffnet sie, die Zusammenfassung zeigt, was darin steht). Der alte Weg: einzeln sichtbar auf Heute; der neue: ein Tipp mehr. Die Schalter auf der Wetterseite gelten wie vorher.
- Die Wetterseite hat keinen Pfad («Ich › Wetter») mehr oben; sie steht jetzt unter ihrem eigenen Ort.
- Sonst nichts.

## Selbst entschieden
- Die Packhinweise entlang der Strecke sind nur Text, ohne «Auf die Liste»-Knopf: dafür müsste die App jedes Hinweiswort einem deiner Teile zuordnen, und das wäre ein eigenes Stück.
- Die Sonnen-Ausfahrt bleibt ausserhalb der Falte auf Heute, weil sie ein Vorschlag zum Handeln ist.
- Der Weg zu Neuland ist ein einfacher Link: die Zahl «3 Gemeinden in 25 km» aus dem Mockup hat keine Datenquelle in der App und steht deshalb nicht da.
- Eine Tour über mehrere Tage zeigt im Streifen weiter nur den ersten Tag; die Tage danach stehen in der Zeile pro Fahrtag. Jeder Tag startet für die Rechnung um 08:00.
- Das Wetter aus dem Archiv für den Rückblick (E) speichert Daten und kommt als eigener PR mit Backup-Kopie und Einzelfreigabe.

## Entscheide (eigene Datei `docs/decisions/wetter-ausbau.md`)
- 22.11.2026: Wetter ist am Computer ein eigener Ort, am Handy nicht (Noah «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter ausbauen: A, B, C, D, F, G, H und die Absprünge fertig in diesem PR; E (erlebtes Wetter im Rückblick) folgt als eigener PR mit Daten.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wetter in der Seitenleiste öffnen: «Jetzt» zeigt «Regen in den nächsten Stunden» mit einem Satz.
2. «Planen» › «Fenster teilen (Text kopieren)» antippen; der Text steht darunter.
3. Eine Tour mit Strecke öffnen: «Wetter entlang der Route» nennt Gegenwind und kälteste Stelle; bei mehreren Tagen steht «Wetter pro Fahrtag» darunter.
4. Auf Heute die Zeile «Wetter heute» antippen: Schnee, Nebel und Nacht stehen darin.
