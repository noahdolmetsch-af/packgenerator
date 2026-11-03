# Kochmodus

PR #(folgt) · 28.10.2026 · Auftrag: Noah «5a», «ok kochen» (Thread «Einfache Kochrezepte und Mahlzeiten-Tipps»), Schritt 2 von 4

## Was ist neu
- Jedes Rezept mit Schritten hat «Kochen starten». Der Kochmodus zeigt einen Schritt pro Bildschirm in grosser Schrift, «Schritt 2 von 5», Punkte für den Fortschritt, «Zurück» und «Weiter», am Ende «Fertig».
- Schritte mit Wartezeit (89 Schritte in 74 Rezepten) haben einen Timer: Start, Pause, Weiter, zurück auf den Anfang. Er läuft weiter, wenn du zum nächsten Schritt gehst; eine kleine Zeile zeigt ihn und springt zurück. Am Ende klingelt und vibriert das Handy, und eine Zeile sagt, welcher Schritt fertig ist.
- Der Bildschirm bleibt an, solange der Kochmodus offen ist (auch nach dem Entsperren wieder).
- «Alle Schritte» zeigt den ganzen Ablauf mit den Zutaten und den Minuten; erledigte Schritte haben ein Häkchen, ein Tipp auf einen Schritt springt dorthin.
- Jeder Schritt hat seine eigene Adresse (`#/me/alltag/kochen/<id>?cook=2`): die Zurück-Taste des Handys geht einen Schritt zurück. Am Computer gehen auch die Pfeiltasten; Esc beendet.

## Was fällt weg oder rutscht tiefer
- nichts. Die Liste «Alle Schritte auf einen Blick» auf der Rezeptseite bleibt; darüber steht neu «Kochen starten».

## Selbst entschieden
- Einen Timer gibt es nur bei Schritten mit echter Wartezeit (kochen, backen, ziehen lassen), nicht bei jedem Schritt mit Minuten.
- Der Klang ist der tiefe Klangschalen-Ton der Timer-Seite; ein iPhone kann nicht vibrieren.
- Die Timer gehen beim Beenden des Kochmodus verloren (sie werden nicht gespeichert).
- Eigene Rezepte aus Freie Zeit haben den Kochmodus auch, aber ohne Timer.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Kochen (Ziel 5 Alltag): Schritt 2 von 4. Danach Tipps des Tages mit kurzem Start, dann Nährwerte pro Portion.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Alltag › Kochen › «Teigwarensalat mit Pesto» öffnen und «Kochen starten» tippen.
2. In Schritt 1 beim Timer «Start», dann «Weiter»: oben zeigt eine kleine Zeile den laufenden Timer.
3. «Alle Schritte» tippen, dann Schritt 4: «Schritt 4 von 4» mit «Fertig».
