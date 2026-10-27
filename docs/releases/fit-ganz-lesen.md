# FIT-Dateien mit allen Werten

PR #? · 27.10.2026 · Auftrag: Noah «2a» und «alles online bringen» (Thread «Geräte und Datenquellen»)

## Was ist neu
- Touren › Rückblick › Fahrten › «Datei wählen» nimmt neben GPX, TCX und CSV auch **.fit** (eine oder mehrere). Die Fahrt bekommt dieselben Zahlen wie ein GPX: km, Höhenmeter, Fahrzeit, Pausen, Profil, Puls, Trittfrequenz, Leistung, Temperatur.
- Neu auf der Fahrt-Seite: Abschnitt **«Vom Gerät»**, nur mit den Werten, die in der Datei stehen: Normleistung, IF / TSS, Trainingseffekt aerob / anaerob, Links / rechts, Runden, Schaltvorgänge, Akku am Ende (Gerät und Sensoren).
- Neuer Leser `src/lib/fit.js` (lädt erst beim ersten FIT). Die Datei verlässt das Gerät nicht.

## Was fällt weg oder rutscht tiefer
- nichts. Texte auf der Seite Fahrten nennen jetzt «GPX, TCX oder FIT» statt «GPX oder TCX».

## Selbst entschieden
- Gespeichert als `ride.device = { np, ifac, tss, lr: { left, right }, te, teAn, laps, gears, battery: [{ kind, status, volt }] }` und `ride.source = 'fit'`; Felder fehlen, wenn die Datei sie nicht hat.
- Erholungszeit liest die App nicht: sie steht nicht im öffentlichen FIT-Format.
- Fahrten drinnen (ohne Positionen) werden mit einer klaren Meldung abgelehnt; die km-Zuordnung (Velo › Pflege › Fahrten importieren) liest FIT wie bisher.
- Garmin «Export Original» gibt eine ZIP-Datei; die App liest die .fit darin noch nicht selbst, der Hilfetext sagt «öffnen, dann .fit wählen».
- Teilen an die App (Android) bleibt bei GPX/TCX.

## Entscheide (für decisions.md)
- 27.10.2026: Geräte und Datenquellen «1a 2a 3 nur Noah verbunden, vorbereiten 4a 5b»; zuerst FIT ganz lesen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Geräte und Datenquellen: Schritt 1 von 5 (FIT ganz lesen). Danach Strava pro Person vorbereiten, Apple-Health-Export, Google pro Person, Plan Samsung/Polar/Oura/Garmin Connect.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In Garmin Connect eine Fahrt öffnen, ⚙ → Export Original, ZIP öffnen.
2. In der App Touren › Rückblick › Fahrten › «Datei wählen», die .fit wählen und speichern.
3. Auf der Fahrt-Seite: km, Puls, Leistung und unter «Vom Gerät» Normleistung, Trainingseffekt, Akku.
