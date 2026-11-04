# Langsame Seiten blenden sanft ein

PR folgt · 03.11.2026 · Auftrag: Noah «b» (Thread «Durchgehen: offene Fragen einzeln», Paket A Seitenwechsel, Idee 4 von 5)

Ziel 5 «Alltag» (Entscheid 26.10.2026 «Bewegung überall sanft»), Idee aus `notes/ideen-bewegung-2026-11-03`.

## Was ist neu
- Lädt eine Seite zum ersten Mal und braucht länger als 0,3 s, zeigt die App weiter die grauen Platzhalter (die schimmern schon seit «Neuer Schwung» Laden, B8). Neu: der Inhalt blendet jetzt in etwa 0,26 s darüber ein, statt auf einen Schlag zu erscheinen (`src/lib/nav/fadein.js`, eingebaut in `LazyPage.svelte`).
- Eine Seite, die schnell lädt oder schon geladen ist, bleibt wie sie war: nichts blendet ein.
- Aus bei «Bewegung reduzieren» am Gerät und bei Ich › Darstellung › Bewegung «Aus».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Platzhalter schimmern schon (B8, `Skeleton.svelte`), dort habe ich nichts geändert; neu ist nur das Einblenden des Inhalts.
- Kein Hüllelement um die Seite: ihre Teile stehen direkt in `<main>` und die Stile verlassen sich darauf. Die eingeblendeten Teile werden an ihrem Platz gefunden (zwischen den beiden Nachbarn des Platzhalters). Haben sich die Nachbarn bewegt, blendet nichts ein, statt etwas Falsches.
- Gleichmässiges «ease-out» (nicht die steile Kurve der Fenster): so liest sich das Einblenden als Einblenden und nicht als Aufblitzen.
- Bei Seitenwechsel in der App (ohne Laden) bleibt das Gleiten aus #784; beides kann zusammen laufen.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket A Seitenwechsel, Idee 4: gebaut. Folgen: 2 Titel fliegt mit, 5 grosser Titel wird klein.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Bei langsamer Verbindung (oder nach einem Update beim ersten Öffnen einer Seite): graue Balken, dann blendet der Inhalt darüber ein.
2. Eine Seite, die du schon geöffnet hast: erscheint sofort wie bisher.
