# Schrittbalken: bei grosser Schrift brechen die Wörter nicht mehr

PR #? · 21.11.2026 · Auftrag: Noah «a» (Thread «Prüfungen so einrichten, dass main grün bleibt»)

## Was ist neu
- Bei 200 % Zoom auf einem Computer (oder einem Fenster von 720 bis 1099 px Breite) standen die fünf Schritte einer Tour mit Zahlenkreis in einer Karte. Für den Namen blieb zu wenig Platz: «Vorbereiten», «Unterwegs» und «Auswertung» brachen mitten im Wort. Jetzt entfällt in diesem Bereich der Zahlenkreis (wie am Handy) und der Name bekommt den Platz. Ab 1100 px bleibt alles wie bisher. Gefunden hat es der Nachtlauf (`zoom-tourkopf.spec.js`).

## Was fällt weg oder rutscht tiefer
- Bei Fenstern von 720 bis 1099 px Breite (und 200 % Zoom auf einem grossen Bildschirm) steht kein Zahlenkreis mehr vor jedem Schritt; die Reihenfolge ergibt sich aus der Reihe. Ab 1100 px und am Handy unverändert.

## Selbst entschieden
- Zahlenkreis weglassen statt kleinere Schrift, weil Schrift bei Zoom ohnehin gross sein soll.
- Keine neue Seite und keine neue Funktion: Fertig-Regel und `docs/app-stand.md` bleiben unberührt.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- main bleibt grün: `zoom-tourkopf.spec.js` wieder grün.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour öffnen, Seite auf 200 % zoomen: die fünf Schritte stehen in einer Reihe, jeder Name ganz.
2. Fenster wieder gross (über 1100 px): die Zahlenkreise sind wieder da.
