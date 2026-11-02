# Was als Nächstes passt, gleich danach (Wegweiser 9: «Als Nächstes» nach einer Handlung)

PR #… · 01.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (3a: «Als Nächstes» in der Bestätigung) und Plan «freigabe» Schritt 1–26 (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Neuer Baustein «Als Nächstes» (`src/lib/alsnaechstes.js`, `src/lib/ui/AlsNaechstes.svelte`): eine ruhige Zeile mit 1–2 Knöpfen in der Bestätigung gleich nach einer Handlung. Ein Tipp springt zur Funktion und lässt sie leuchten, wie «Passt hier».
- Fahrt gespeichert (Karte «Fahrt gespeichert»): Verschleiss und Logbuch.
- «Alles gepackt» (Meldung auf Packen): Wetter für eine Fahrt und Tourtag-Blatt.
- Velopflege, Arbeit erledigt (Meldung «Gespeichert: …»): Setup-Logbuch und Ersatzteile zu Hause.

## Was fällt weg oder rutscht tiefer
- nichts. Die Meldungen «Alles gepackt» und «Gespeichert» nach einer erledigten Pflege bleiben 12 statt 8 Sekunden, damit man die Zeile lesen kann.

## Selbst entschieden
- In die bestehenden Bestätigungen eingebaut, keine neue Meldung.
- Nach «Geprüft, OK» und «Arbeit nötig» kommt keine Zeile, nur nach einer erledigten Arbeit.
- «Nicht für mich» markierte Funktionen erscheinen nicht.
- Das Ende einer Live-Aufzeichnung bekommt noch keine Zeile (eigener dunkler Vollbild-Schirm, gehört dem Thread Live-Navigation).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 9 von 26.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Fahrt hochladen (Touren › Rückblick › Fahrt hochladen): die Karte «Fahrt gespeichert» hat unten «Als Nächstes» mit Verschleiss und Logbuch.
2. In der Velopflege bei einer fälligen Arbeit «Erledigt» tippen: die Meldung unten hat «Als Nächstes» mit Setup-Logbuch und Ersatzteile zu Hause.
3. Eine Tagestour ohne Velo fertig packen: die Meldung «Alles gepackt» hat «Als Nächstes» mit Wetter und Tourtag-Blatt.
