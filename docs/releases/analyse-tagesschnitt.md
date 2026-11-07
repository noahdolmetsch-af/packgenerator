# Analyse: Kacheln stimmen (Aktivzonen pro Tag, Velo mit Zeitraum)

PR #<offen> · 07.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5b und alle A-F» (Thread «UI-Test Analyse», Antwort 2a)

## Was ist neu
- Auswerten › Analyse › Überblick: die Kachel «Aktivzonen pro Tag» zeigt den Schnitt pro Tag (Summe geteilt durch die Tage mit Wert) statt der Summe des ganzen Zeitraums. Darunter steht «Schnitt von N Tagen».
- Die Velo-Kachel sagt, für welchen Zeitraum die Kilometer gelten: «Velo, Strava, in N Tagen».

## Was fällt weg oder rutscht tiefer
- nichts. Die alte Summe (z. B. «1'050 min») steht nicht mehr in der Kachel; die Summe steht weiter in «Alle Werte» (Kachel «Aktive Zonen-Minuten», «Summe»).

## Selbst entschieden
- Der Schnitt zählt nur Tage, an denen Fitbit einen Wert hatte (wie bei «Schlaf im Schnitt»), nicht alle Tage des Zeitraums.
- Die Velo-Kachel bleibt eine Summe, nur mit Zeitraum (Noah «2a» betrifft die Aktivzonen).
- Test: der Überblick-Test prüft, dass die Aktivzonen-Zahl zwischen den Tageswerten der erfundenen Daten (20 bis 70) liegt und die Velo-Kachel den Zeitraum nennt.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse › Überblick: «Aktivzonen pro Tag» zeigt eine Zahl in der Grössenordnung deines Tageswerts (nicht Tausende) und «Schnitt von 30 Tagen».
2. Zeitraum auf 90 Tage: die Velo-Kachel sagt «in 90 Tagen», die Aktivzonen-Zahl bleibt etwa gleich.
