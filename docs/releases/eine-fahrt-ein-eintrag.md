# Eine Fahrt, ein Eintrag

PR · 27.11.2026 · Auftrag: Noah «1a 2a 3a 4a» (Thread «Wie war's? nach Fitbit-Aktivität reparieren»)

## Was ist neu
- Neue gemeinsame Regel `src/lib/flow/dieselbe.js`: wann ein Training der Uhr (Fitbit) und eine Strava-Aktivität dieselbe Einheit sind. «Wie war's?» (`healthfeel.js`) und «Zählen?» (`fitbittraining.js`) benutzen sie beide; vorher hatten sie zwei verschiedene Regeln.
- Garmin über Strava gewinnt (`coveredBy` nimmt bei mehreren Treffern zuerst die Aufzeichnung mit «Garmin» im Gerätenamen).
- Stücke einer Fahrt, die die Uhr geteilt hat (gleiche Sportart, höchstens 15 Minuten Pause), werden zu einem Training (`joinPieces`).
- Ein Spaziergang der Uhr wird nie gefragt und nie gezählt.
- Die Karte für ein Fitbit-Training verspricht nicht mehr «hilft den Trainingsplänen» (diese lesen die Fitbit-Antwort heute nicht), sondern sagt nur «Nur auf diesem Gerät.».

## Was fällt weg oder rutscht tiefer
- nichts (zwei alte Regeln werden eine; es erscheinen nur weniger doppelte Karten)

## Selbst entschieden
- Die 30 Minuten daneben gelten nur für die gleiche Sportart (Fahrt gegen Fahrt, Tennis gegen Tennis). Berühren sich die Zeiten, reicht eine unbekannte Sportart der Uhr («Sport»). So wird ein Tennis nach einer Fahrt nicht still versteckt.
- Der Test `fitbittraining.test.js` bleibt gleich; Fälle mit unbekannter Strava-Sportart zählen als gleiche Sportart.
- Pro Tag ein Haken pro Aktivität (Strava-Haken) bleibt wie es ist.

## Entscheide (eigene Datei `docs/decisions/eine-fahrt-ein-eintrag.md`)
- 27.11.2026: Garmin gewinnt, eine Regel, Gehen aus, «Zusammenlegen?» als Vorschlag (Paket 2), Vergleich Gurt gegen Handgelenk (Paket 3).

## Stand im Plan (roadmap.md / vorhaben.md)
- Klarheit: weniger doppelte Fragen. Kein Eintrag in `vorhaben.md` nötig.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf «Woche» (Aktiv): bei einer Fahrt, die Strava und Fitbit beide haben, erscheint nur eine Karte «Wie war's?», von Strava.
2. Ein von der Uhr erkannter Spaziergang zeigt keine Karte mehr.
