# Gewitter mit Uhrzeit

PR · 04.11.2026 · Auftrag: Noah «5 alle» (Thread «Plane die Wetterseite neu»)

## Was ist neu
- Auf der Wetterseite, in der Karte «Heute» (Reiter «Jetzt»), steht bei Gewitterrisiko eine Zeile mit Zeitspanne: «Gewitter möglich heute, 15:00 bis 18:00. Regenchance bis 70 %.» Auch für morgen (und später, innerhalb von 36 Stunden).
- Stunden nebeneinander (oder mit einer Stunde Lücke) werden zu einer Spanne. Es gilt dieselbe Gewitter-Regel wie bisher (`thundery` in `kern.js`).

## Was fällt weg oder rutscht tiefer
- Die Zeile «Gewitter möglich ab 15:00» in «Heute» wird durch die neue Zeile mit Spanne ersetzt. Nichts anderes fällt weg.

## Selbst entschieden
- Nur Hinweis, keine Bewertung der Gefahr (wie bei allen Warnungen).
- Keine neue Funktion (`f.weather`), keine neue Zeile in `app-stand.md`.
- Die Push-Erinnerungen und die Wetterzeile auf «Heute» bleiben, wie sie sind (später möglich).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetterseite neu: PR 3 von 4 (Gewitter mit Uhrzeit).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wetter öffnen, Reiter «Jetzt»: bei Gewitterrisiko steht unter «Heute» eine Zeile mit Zeitspanne.
2. An einem ruhigen Tag fehlt sie.
