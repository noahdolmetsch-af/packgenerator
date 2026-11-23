# Weitere Fragen auf der Morgen-Seite

PR · 23.11.2026 · Auftrag: Noah «warum haben wir nur noch so wenige fragen? … wie können wir das wieder integrieren?», dann «Beides» (Thread «Mehr Fragen in «Wi gaht's?» zurückholen»)

## Was ist neu
- Auf «Wi gaht's? am Morgen» steht jeden Tag die **Zufallsfrage**: eine der ausgeschalteten Musterfragen, dieselbe wie im Fenster. «Überspringen» gilt für heute, «Nie mehr» nimmt sie ganz aus der Auswahl (dann kommt heute keine andere).
- Unter den Fragen, am Morgen wie am Abend, steht die zugeklappte Zeile **«Weitere Fragen»** mit der Zahl. Offen zeigt sie jede andere Frage der Liste (die der Runde zuerst, acht auf einmal, «Noch N Fragen einblenden»). Eine Antwort wird sofort gespeichert und steht im selben Verlauf; die Frage wird dadurch **nicht eingeschaltet**.
- Eine Frage, die an ist und später am Tag dran wäre (zum Beispiel die Stimmung um 13:00), fragt das Fenster nach einer Antwort von der Seite heute nicht noch einmal.

## Was fällt weg oder rutscht tiefer
- nichts. Die Seite hat zwei Dinge mehr; die Fragen der Runde stehen wie vorher oben.

## Selbst entschieden
- Die Zufallsfrage steht nur am Morgen (die Abend-Seite hat «Weitere Fragen»), und sie folgt denselben Schaltern wie im Fenster (Ich › Deine Fragen › Zufallsfrage).
- Kein neuer Eintrag in `features.js`: keine neue Seite, die Funktion gehört zur Seite «Wi gaht's? am Morgen» (Zeile in `docs/app-stand.md` ergänzt). Das «?»-Fenster bekommt keinen neuen Block (Content first).
- Die Zeile «Weitere Fragen» ist zu, damit die Seite nicht länger wird, wenn man sie nicht braucht.
- Keine Datenänderung: kein neues Feld, kein Schema, kein Backup-Format; die Antworten sind gewöhnliche Antworten der Fragen.

## Entscheide (eigene Datei `docs/decisions/weitere-fragen.md`)
- 23.11.2026: Zufallsfrage und «Weitere Fragen» auf der Morgen-Seite (Noah «Beides»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel 5 «Alltag»: Tagescheck bleibt wie geplant; kein Plan ändert sich.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Wi gaht's? am Morgen» öffnen: unter «Ruhepuls» steht die Zufallsfrage mit «Überspringen» und «Nie mehr»; darunter «Weitere Fragen» mit einer Zahl.
2. «Weitere Fragen» antippen, «Sofa oder Sattel» beantworten, Seite neu laden: die Antwort steht noch da.
3. Ich › Deine Fragen: «Sofa oder Sattel» ist weiter aus.
