# Wie fährst du?

PR # · 06.11.2026 · Auftrag: Noah «3a» (Thread «Verbessern: Routing und Navigation»)

## Was ist neu
- Im Fenster «Neu planen zu …» steht über den Orten die Frage «Wie fährst du?» mit vier Arten: ruhige Strassen und gute Wege (wie bisher), kurz und asphaltiert (Rennvelo), **Gravel und Feldwege** und **Pfade (Mountainbike)**. Gravel und Mountainbike sind die Profile `gravel` und `mtb` von brouter.de.
- Die Art, die zu deinem Velo passt, ist schon gewählt: Rennvelo → kurz und asphaltiert, Gravel → Gravel, Mountainbike → Pfade. Das Velo ist das der Tour, sonst das der letzten Live-Fahrt, sonst das erste. Eine Zeile sagt «Vorgeschlagen für …». Ein Tipp auf eine andere Art gilt sofort, die Zeile verschwindet.
- Ohne Velo in der App beginnt das Fenster wie bisher mit «Ruhige Strassen und gute Wege».
- Die Reserve-Router (Valhalla, OSRM) bekommen die Art als Velo-Typ (Rennvelo, Gravel, Mountainbike); der Weg ändert sich dort kaum, die Warnzeile bei der Wegkarte bleibt.

## Was fällt weg oder rutscht tiefer
- Das Fenster beginnt bei einem Gravel- oder Mountainbike nicht mehr mit «Ruhige Strassen und gute Wege», sondern mit der passenden Art. Ein Tipp bringt die alte Art zurück.

## Selbst entschieden
- Rennvelo → «kurz und asphaltiert» (fastbike), nicht «ruhige Strasse mit wenig Verkehr»: das Profil `fastbike-lowtraffic` gibt es zwar, aber «ruhige Strassen und gute Wege» bleibt als Standard sichtbar und ist einen Tipp entfernt. Soll es das Rennvelo-Standard-Profil werden, ist das eine kleine Änderung.
- Nur das Fenster «Neu planen zu …» fragt «Wie fährst du?». Überraschungsrunde und Runde durch einen Ort behalten ihre Stufen (Entspannt, Neugierig, Wild).
- Die Wahl wird nicht gespeichert: Beim nächsten Öffnen schlägt die App wieder nach dem Velo vor.
- Keine neue Funktion im Sinn der Fertig-Regel (Erweiterung eines bestehenden Fensters), darum kein Eintrag in `features.js` und `app-stand.md`.

## Entscheide (für decisions.md)
- 05.11.2026: «Wie fährst du?» schlägt die Art des Wegs nach der Art des Velos vor (Noah «3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Routing und Navigation: Schritt 3 von 4 gebaut; geplant sind Belag und Schwierigkeit aus den Wegdaten (Warnung), dann der Funkloch-Notausstieg.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live › «⋯ › Neu planen zu …»: über den Orten steht «Wie fährst du?» mit vier Arten und «Vorgeschlagen für …».
2. Eine andere Art antippen: die Zeile verschwindet, ein Ort mit «Planen» nimmt die gewählte Art.
