# Klare Zahlen auf der Live-Karte

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah, Handy-Test 28.10 (Timer «a ★ Gesamtzeit seit Start», Distanz in m und km mit 2 Stellen) und Mockup Extra-Runde (Namen «Distanz», «Zeit verstrichen», «Geschwindigkeit»), Thread «Live Navigation»

## Was ist neu
- Distanz: unter 1 km in Metern, ab 1 km mit 2 Stellen (ab 100 km mit 1 Stelle).
- Zeit verstrichen: läuft wie ein Timer jede Sekunde (0:05, 12:34, 1:02:03).
- Eine Fahrt ohne Route zeigt oben Distanz, Zeit verstrichen und Geschwindigkeit.
- Neue Namen der Zahlen: «Distanz» (statt «km gefahren»), «Zeit verstrichen» (statt «Gesamtzeit»), «Geschwindigkeit» (statt «Tempo (GPS)»).

## Was fällt weg oder rutscht tiefer
- Ohne Route stehen «Fahrtzeit» und «Zeit» (Uhr) nicht mehr von selbst oben (alt: km gefahren, Fahrtzeit, Uhrzeit; neu: Distanz, Zeit verstrichen, Geschwindigkeit). Beide bleiben über ⚙ › Zahlen wählbar. Wer seine Zahlen schon gewählt hat, behält sie.

## Selbst entschieden
- Ab 100 km zeigt die Distanz 1 Stelle, damit die Zahl in die Kachel passt.
- Mit Stromsparen zählt der Timer alle 10 s statt jede Sekunde.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Live Navigation: Rückmeldung vom Handy-Test 28.10, Punkte «Timer» und «Distanz» erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Fahrt ohne Route starten: oben Distanz, Zeit verstrichen, Geschwindigkeit.
2. Ein paar Meter fahren: Distanz in m, Zeit zählt jede Sekunde.
