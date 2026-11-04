# Ausstieg im Nacht-Blatt

PR (diese Änderung) · 03.11.2026 · Noah 02.11. Vorschlag 1 («Notfall-Bett/Ausstieg»), 03.11. «freigabe bitte fortfahren»; Ziel 6 «Lange Fahrten unterwegs verstehen»

## Was ist neu
- Im Nacht-Blatt neu der Teil «Ausstieg» (`exit.js`): der nächste Bahnhof auf dem Weg vor dir und der nächste hinter dir, mit Abstand, Weg neben der Strecke und Ankunft (vor dir), dazu «Dorthin navigieren».
- Der Notfall-Bett-Teil (schon da) und der Ausstieg stehen zusammen: ein Plan B auf einer Seite.

## Was fällt weg oder rutscht tiefer
- nichts. Ein Teil mehr im Nacht-Blatt, zwischen Bett und letztem Laden.

## Selbst entschieden
- Der «nächste» Bahnhof zählt Weg auf der Strecke plus Weg daneben; Reichweite 150 km.
- Ein Hinweis sagt, dass Ticket und Veloplatz vor Ort zu prüfen sind (keine Zugdaten in diesem PR).
- Nichts wird gespeichert; keine neue Funktion in `features.js`.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- Notfall-Bett/Ausstieg gebaut; danach Kälte/Regen, Licht/Akku, Schritt 6 «Offline».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte mit Strecke starten, «⋯», Nacht-Blatt: «Ausstieg» nennt einen Bahnhof vor und einen hinter dir.
2. «Dorthin navigieren» antippen: das Blatt schliesst sich, der Weg wird geplant.
