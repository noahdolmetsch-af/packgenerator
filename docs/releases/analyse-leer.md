# Analyse: leere Reiter erklären sich

PR #<Nummer> · 07.11.2026 · Auftrag: Noah «3 ja» (Thread «UI-Test Analyse-Seite: Design und Verständlichkeit»)

## Was ist neu
- **Übersicht ohne Daten:** statt Nullen (0 Tage, 0 Haken) steht ein Satz, warum sie leer ist, mit «Aktiv öffnen» und «Fitbit verbinden». Ohne eingeschaltete Quelle sagt sie, dass man oben eine Quelle einschalten soll.
- **Velos ohne Velo:** früher blieb der Reiter leer. Jetzt steht, was man hier sehen wird, mit «Velo anlegen» und «Strava verbinden».
- **Alle Werte ohne Daten:** zusätzlich zu «Aktiv öffnen» die Knöpfe «Fitbit verbinden» und «Strava verbinden».

## Was fällt weg oder rutscht tiefer
- nichts (die Übersicht zeigt bei leerem Zeitraum nicht mehr die Kacheln mit Nullen, sondern den Hinweis; sobald ein Wert oder ein Haken da ist, sieht alles aus wie vorher)

## Selbst entschieden
- «Leer» heisst bei der Übersicht: kein Wert einer eingeschalteten Quelle und kein Haken im Zeitraum.
- Die Verbinden-Knöpfe führen zu den bestehenden Seiten (Me › Fitbit, Velos › Pflege › Strava), keine neue Seite.
- Fertig-Regel: Absprung, Gut-zu-wissen und Handbuch ändern sich nicht (keine neue Funktion, nur Texte und Knöpfe in bestehenden Leerzuständen).

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse › Übersicht, Zeitraum in der Zukunft oder ohne Daten: ein Satz sagt, warum nichts da ist; «Fitbit verbinden» öffnet die Verbindungs-Seite.
2. Reiter «Velos» ohne Velo: erklärt, was man sieht, und bietet «Velo anlegen».
3. Reiter «Alle Werte» ohne Daten: die Knöpfe «Fitbit verbinden» und «Strava verbinden» sind da.
