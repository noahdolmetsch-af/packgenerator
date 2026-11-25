# Gleiche Namen überall

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «ja» (Thread «Navigation ohne Sackgassen», «es heisst einmal «Aktiv» und einmal «Woche > Training»»); Wahl: «Woche überall, Seite «Heute abhaken»»

## Was ist neu
- Alle deutschen Texte der App (Handbuch, Hilfe, Hinweise, Rundgang, Meldungen) schreiben den Weg wie die Seitenleiste: «Woche › Training › …» statt «Aktiv › …». Meditation steht unter «Woche › Alltag › Meditation», Meilensteine und Gipfelbuch unter «Auswerten › Fahrten».
- Die Seite zum Abhaken heisst überall «Heute abhaken»: Titel, Kachel auf Heute, Ort in den Listen, Sätze wie «in «Heute abhaken» abhaken». Zusammensetzungen: «Abhak-Verlauf», «Abhak-Serie».
- `docs/namen.md` hat dafür die Zeile 38.

## Was fällt weg oder rutscht tiefer
- Der Name «Aktiv» für den Ort fällt in den Texten weg (141 deutsche Texte in `src/lib/i18n/de`). Die Kachel auf Heute heisst jetzt «Heute abhaken» statt «Aktiv». «Aktiv» bleibt nur für aktive Kilokalorien und für das Kürzel im Tagebuch.

## Selbst entschieden
- Die alten Neuigkeiten (`src/lib/news/*.js`, `whatsnew-alt.js`) bleiben, wie sie waren: Sie erzählen, was damals neu war.
- Wo der Weg nicht mehr eindeutig war («Aktiv › Ziele», «Aktiv › Sportarten»), steht der heutige Ort («Woche › Training › Meine Aktivitäten»).
- «Mein Tag» ersetzt später Woche und Kalender; dann werden die Wegtexte dort noch einmal angepasst (ein Satz in `docs/namen.md` genügt, die Karte `src/lib/nav.js` bleibt die Quelle).

## Entscheide
- Noahs Wahl auf der Entscheidungskarte vom 23.11.2026: «Woche überall, Seite «Heute abhaken»». Keine eigene Datei: Fortsetzung von `docs/decisions/wege-waechter.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Navigation ohne Sackgassen: «gleiche Namen überall» erledigt. Folgt: Zurück am Eingang, Abschnitte in der Suche.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute: die Kachel «Heute abhaken» antippen: Titel und Pfad sagen «Woche › Training».
2. «Ich › Hilfe» öffnen und «Erholung» suchen: der Weg heisst «Woche › Training › Erholung».
