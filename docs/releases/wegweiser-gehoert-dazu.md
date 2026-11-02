# Gehört dazu auf Velos, Material und Aktiv (Wegweiser 10)

PR #… · 01.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» und Plan «freigabe» Schritt 1–26 (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Velos und Material: oben die Zeile «Gehört zu: Velo und Material» mit bis zu fünf kleinen Links und «alle n ›».
- Aktiv: oben die Zeile «Gehört zu: Körper und Training».
- Wie bei Packen, Touren und Ich: zuerst Funktionen, die du noch nie benutzt hast; «Nicht für mich» bleibt draussen.

## Was fällt weg oder rutscht tiefer
- nichts fällt weg. Der Inhalt von Velos, Material und Aktiv rutscht um die Höhe der Zeile (eine bis zwei Zeilen Knöpfe) tiefer.

## Selbst entschieden
- Die Zeile erscheint nur auf der Hauptseite (`#/bikes`, `#/gear`, `#/flow`), nicht auf Unterseiten wie einem Formular unter Aktiv (`HUB_ONLY`, `showsRow` in `src/lib/know/gehoert.js`).
- Auf diesen drei Seiten fehlen Funktionen, die schon auf einer Unterseite der Seite selbst liegen (z. B. `#/flow/sports` auf Aktiv): die Seite führt schon dorthin.
- Velos und Material zeigen beide den Moment «Velo und Material», weil beide im selben Menüpunkt stehen.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 10 von 26.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos öffnen: oben steht «Gehört zu: Velo und Material» mit bis zu fünf kleinen Links.
2. Aktiv öffnen: oben steht «Gehört zu: Körper und Training»; ein Link öffnet die Funktion.
3. «alle …›» antippen: «Was die App kann» öffnet sich nach Moment.
