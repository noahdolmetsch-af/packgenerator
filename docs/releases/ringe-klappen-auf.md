# Ringe klappen in ihre Sportarten auf (Aktiv)

PR #… · 08.11.2026 · Auftrag: Noah «2a» des Entwurfs «Wege besser sichtbar» (Thread «Absprünge: Analyse und Aktiv antippbar machen»), baut auf #1141 auf

## Was ist neu
- Aktiv › «Ringe»: eine Zeile mit mehreren Sportarten (zum Beispiel «Bewegen») klappt auf und listet sie, jede mit eigenem Stand («2 von 4») und einem Weg zu ihrem Wert in der Analyse (7 Tage). Unten steht «Alle in «Haken ausgewertet»».
- Hat ein Ring nur eine Sportart, öffnet der Tipp wie bisher direkt deren Wert.

## Was fällt weg oder rutscht tiefer
- Der Tipp auf einen Ring mit mehreren Sportarten öffnete bisher «Haken ausgewertet». Das geht jetzt über den letzten Eintrag der aufgeklappten Liste (ein Tipp mehr).

## Selbst entschieden
- Ruhende Sportarten (Saisonpause) stehen nicht in der Liste von «Bewegen» und «Erholung», wie sie auch nicht gezählt werden. «Achtsam» zählt alle seine Sportarten.
- Neuer Text nur «Alle in «Haken ausgewertet»». Keine neue Funktion in `features.js`.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Verbesserung 2 (Ringe klappen auf) gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › «Ringe»: auf «Bewegen» tippen, die Sportarten erscheinen mit ihrem Stand.
2. Eine antippen: ihr Wert öffnet sich in der Analyse.
3. Zurück, nochmals auf «Bewegen» tippen: die Liste schliesst sich.
