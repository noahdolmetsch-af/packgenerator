# Höhenprofil wird abgefahren

PR (noch offen) · 03.11.2026 · Auftrag: Noah «E und F» (Paket E, Idee 13, Thread «Bauen: Touren als Sammlung»)

## Was ist neu
- Tour-Seite: beim Öffnen fährt ein kleiner Punkt einmal das Höhenprofil ab (rund 1,6 Sekunden, am Ende langsamer); die Fläche zeichnet sich hinter ihm. Gilt für das Profil der Strecke (`TourProfile`) und für das feine Profil der Fahrt (`ProfileStrip` mit `ride`, nur auf der Tour-Seite).
- Eine Berührung des Profils beendet die Fahrt sofort.
- `src/lib/touren/abfahren.js` (reine Hilfen), `abfahren.svelte.js` (der Ablauf).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Aus bei «Bewegung reduzieren» am Gerät und bei Bewegung «Aus» in der App (`motionStill()`); dann steht das Profil sofort da.
- Einmal pro Öffnen der Seite, nicht bei jedem Wechsel zwischen «Diagramm» und «Tabelle».
- Die Rennseiten (Karte, Anstiege) bekommen die Fahrt nicht: `ride` ist dort aus.
- Kein neuer Eintrag in `features.js`: Bewegung an einer bestehenden Ansicht.
- Zeile in `docs/vorhaben-liste.md` folgt gesammelt für alle fünf Ideen von Paket E.

## Entscheide (für decisions.md)
- nichts

## Stand im Plan
- Ideen Bewegung: Idee 13 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Fahrten › eine abgeschlossene Tour öffnen, zum Höhenprofil scrollen: ein Punkt fährt es einmal ab.
2. Bewegung auf «Aus» stellen (Ich › Darstellung), Tour nochmals öffnen: kein Punkt, das Profil steht sofort da.
