# Tourenvorschläge (Pilot)

Auftrag: Noah «a b, Mockup ja», «1a 2a 3a» (Thread «Planen: Mountainbike-Tourenvorschläge aus offenen Daten»)

## Was ist neu
- Neue Seite «Tourenvorschläge» (`#/trips/vorschlaege`), erreichbar über einen Knopf auf Touren › Träume. Reiter bleibt «Träume».
- Fünf Pilot-Touren aus dem offenen Datensatz «Mountainbikeland Schweiz» (swisstopo/ASTRA, SchweizMobil): Winterthur → Hulftegg, Uetliberg → Triemli (Abfahrt), Flims, Arosa 636, Davos Platz 332. Linie, Länge, Aufstieg, Kondition, Technik und Untergrund sind die echten Werte (gebaut von `scripts/vorschlaege/build-pilot.py`).
- Filter: Region (Zürich, Graubünden), Schwierigkeit (am Anfang nur «Mittel» und «Schwierig»; eine Tour zeigt sich, wenn Kondition **oder** Technik gewählt ist; «Leicht» einschaltbar) und Zeit (aus «Dein Tempo», sonst Standardtempo). Die Filter bleiben auf dem Gerät.
- «Warum dieser Vorschlag?»: Zeit, Schnee, Schwierigkeit, «neu für dich» (aus eigenen Fahrten, 150 m) und Abstand zum Wohnort.
- Touren, bei denen im Monat oben wahrscheinlich Schnee liegt, stehen grau in der Gruppe «Heute nicht», mit Grund.
- Tourseite mit echter swisstopo-Karte (TourMap), Höhenprofil mit Untergrundstreifen und Regler (der Punkt wandert auf der Karte), Warnung bei schwierig/Schnee, «Als Traum merken», «GPX speichern», «Nicht für mich» (mit Rückgängig, «Alle wieder zeigen»).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Schnee ist eine Faustregel nach Monat und Höhe (`SNOW_LINE`), keine Wetterdaten; sie warnt nur.
- Regionen und Stufen sind feste Datenfakten, keine eigenen Gruppen des Nutzers (die Art-Gruppe kommt mit dem Art-Filter).
- Noch nicht dabei (nächste PRs): Art-Filter, «Frei berechnen», Start-Filter (Zuhause/Bahnhof), Schalter pro «Warum»-Zeile, das ganze Netz offline nach Region, Veloland.
- Fertig-Regel: kein «Gut zu wissen» (Seite nicht in `ON_PAGES`); Absprung ist der Knopf auf Träume.
- Daten laden erst mit der Seite (eigener Chunk, 23 KB).

## Entscheide (für decisions.md)
- 05.11.2026: Schwierigkeit «mittel/schwer» = Kondition oder Technik; Rennrad gar nicht; Veloland nach dem Pilot (Noah «1a 2b 3a 4b»).
- 05.11.2026: nicht passende Touren grau in eigener Gruppe, Dauer aus «Dein Tempo», erster PR mit Seite, Filtern, «Warum» und Profil (Noah «1a 2a 3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Tourenvorschläge: Pilot gebaut, danach Art-Filter, «Frei berechnen», Netz offline nach Region.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume › «Tourenvorschläge»: fünf Touren, im November «Heute nicht» mit Davos und Arosa.
2. «Davos Platz, Route 332» öffnen: Karte, Profil, Regler, «Warum dieser Vorschlag?».
3. «Nicht für mich» tippen, dann «Rückgängig».
