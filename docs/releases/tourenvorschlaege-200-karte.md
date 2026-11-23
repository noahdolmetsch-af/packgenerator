# Tourenvorschläge: 200 Touren und Karte

PR (Nummer nach dem Öffnen) · 23.11.2026 · Auftrag: Noah «alles umsetzen mit 100 strecken, davon auch ein paar verteilt in allen kantonen. was näher ist hat vorrang. aber nur schwere touren was kondition angeht», «1a 2b 3a 4a 5a», «die karte unbedingt 1:1 so übernehmen», «100 weitere routen» (Thread «100 kluge MTB-Touren vorschlagen»). Das ist Schritt 1 von 6.

## Was ist neu
- **200 statt 5 Touren** aus «Mountainbikeland Schweiz» (swisstopo/ASTRA, © swisstopo, SchweizMobil): alle 131 offiziell konditionell schweren Etappen (in 17 Kantonen), die 5 Pilot-Touren (gleiche Nummern), die stärkste «mittlere» Tour jedes Kantons ohne schwere Tour (ZG, BL, SO, LU, BS, AG, NW) und 59 mittlere Touren mit mindestens 900 m Aufstieg (höchstens 8 je Kanton), die nächsten zuerst. Gebaut von `scripts/vorschlaege/build-netz.py`, Daten `src/lib/vorschlaege/data/netz.js` (lädt erst mit der Seite, rund 1 MB).
- **Kanton-Filter** statt «Zürich/Graubünden»: 23 Kantone (die mit Touren), Kürzel als Knopf mit dem Namen als Hilfetext. Der Kanton ist der Kanton des Starts.
- **Kondition und Technik getrennt:** Kondition «Schwierig» ist am Anfang an (Noah: nur schwere), Technik zeigt alles und engt nur ein. «Mittel» und «Leicht» lassen sich einschalten. Die stärkste Tour eines gewählten Kantons ohne schwere Tour zeigt sich auch bei «Schwierig» und sagt es unter «Warum dieser Vorschlag?».
- **Nähe zuerst:** sortiert nach dem Abstand des Starts vom Wohnort, ohne Wohnort vom Zürcher Hauptbahnhof (`dz` in den Daten); «Warum» nennt den Abstand auch ohne Wohnort.
- **Karte** (Liste | Karte): die Schweiz in 1440 × 900 (Kantone aus swissBOUNDARIES3D, `data/kantone.js`, `build-kantone.py`), jede Tour der Liste mit Linie und Startpunkt (schwer orange, mittel blau, Schnee grau), Zürich als schwarzer Punkt, die Zahl der Touren je Kanton. Tippen auf einen Punkt öffnet die Tour, Tippen auf einen Kanton filtert (auch mit Tastatur). Am Computer ist die Karte beim ersten Besuch die Ansicht, am Handy die Liste; die Wahl bleibt auf dem Gerät.

## Was fällt weg oder rutscht tiefer
- Die Pilot-Touren «Flims», «Arosa, Route 636» (Kondition mittel) und «Uetliberg → Triemli» (Abfahrt, keine Kondition) stehen nicht mehr am Anfang: sie zeigen sich, sobald «Mittel» bzw. «Leicht» bei Kondition eingeschaltet ist (alt: «Mittel und Schwierig» zählte Kondition oder Technik; neu: Noah «nur schwere Touren was Kondition angeht»). Ihre Nummern, gemerkten Träume und «Nicht für mich» bleiben.
- Die Gruppe «Schwierigkeit» heisst jetzt «Kondition» und «Technik» (zwei Gruppen).

## Selbst entschieden
- Noah sagte «100 weitere»: offiziell gibt es nur 131 Etappen mit schwerer Kondition. Die zweiten 100 sind darum zum Teil mittlere Touren mit viel Aufstieg (ab 900 m). Sie sind bei «Mittel» sichtbar und tragen ihre offizielle Stufe.
- Graubünden hat mit 68 von 200 die meisten Touren, weil dort die meisten offiziell schweren Etappen liegen; die «Nähe zuerst»-Reihenfolge hält Zürcher Touren oben.
- Thurgau, Genf und Appenzell Ausserrhoden bleiben ohne Tour (Noah «2b»): sie haben keine offiziellen Routen mit schwerer Kondition.
- Die Karte zeichnet die echten Linien der Touren im Landesnetz (LV95, Näherungsformel von swisstopo), nicht nur Start zu Ziel wie die Skizze.
- Handy: die Filter stehen wie bisher über dem Ergebnis; ein Einklappen der Filter ist ein möglicher späterer Schritt.
- Fertig-Regel: Seite (Eintrag `f.tourvorschlag` aktualisiert), Absprung (Knopf auf Träume, unverändert), «Gut zu wissen» (Seite nicht in `ON_PAGES`), leerer Zustand (bleibt), nächster Schritt (bleibt), App-Stand (Zeile angepasst).

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-200-karte.md`)
- 23.11.2026: Auswahl der Touren, Kondition schwer als Standard, Nähe zuerst, Karte, Kantone ohne Tour.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tourenvorschläge: Schritt 1 von 6 (Daten, Kantone, Karte). Folgen: Anreise, «Passt zu dir», Wetter, Lernen und Neuland, Untergrund und «Als Tour planen».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume › «Tourenvorschläge» › «Karte»: die Schweiz mit Punkten und Linien, Zahlen in den Kantonen.
2. Auf der Karte SG antippen: nur Touren aus St. Gallen bleiben; nochmals antippen: wieder alle.
3. Einen Punkt antippen: die Tour öffnet sich; bei «Warum dieser Vorschlag?» steht «Etwa … km vom Zürcher Hauptbahnhof».
4. «Liste» antippen, unter Kondition «Mittel» einschalten: die Zahl der Touren steigt.
