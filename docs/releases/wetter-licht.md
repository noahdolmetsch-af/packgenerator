# Sonnenauf- und -untergang und das Licht

PR · 04.11.2026 · Auftrag: Noah «5 alle» (Thread «Plane die Wetterseite neu»)

## Was ist neu
- Im Reiter «Jetzt» die Karte «Licht für die Fahrt»: für heute und morgen Sonnenaufgang, Sonnenuntergang, wie lange es hell ist und «Licht an ab …» (eine halbe Stunde vor Sonnenuntergang).
- Im Reiter «Planen»: endet das beste Zeitfenster nach Sonnenuntergang, steht darunter «Zurück … min nach Sonnenuntergang: Licht an.» (derselbe Text wie in der Tour-Karte).
- Ohne Wetterdaten zeigt die Karte, warum sie leer ist und was zu tun ist (Ort festlegen).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- 30 Minuten für «Licht an» (`LAMP_MIN` in `licht.js`) als Vorschlag, keine Dämmerungsberechnung.
- Keine neue Funktion (`f.weather`), keine neue Zeile in `app-stand.md`.
- Sonnenzeiten kommen aus den Wetterdaten der Seite (Open-Meteo), keine zweite Quelle.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetterseite neu: PR 4 von 4 (Licht). Damit sind die gewählten Ideen der Wetterseite umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wetter, Reiter «Jetzt»: Karte «Licht für die Fahrt» mit heute und morgen.
2. Reiter «Planen»: bei einem späten Fenster steht die Zeile mit dem Licht.
