# Belag und Schwierigkeit

PR # · 06.11.2026 · Auftrag: Noah «4a» (Thread «Verbessern: Routing und Navigation»)

## Was ist neu
- Jeder Weg von «Neu planen zu …» zeigt eine Zeile «Belag: 85 % befestigt, 15 % unbefestigt» (bei vielen Stücken ohne Angabe auch «… % unklar»). Sie steht in der Wegauswahl bei jedem der bis zu drei Wege und auf der Karte des gewählten Wegs auf der Live-Karte.
- Die Zahlen kommen aus den Kartendaten, die brouter.de mitschickt (`messages`: Länge und OpenStreetMap-Angaben je Stück: Belag, Wegart, Glätte, MTB- und Wanderskala). Neu in `src/lib/live/belag.js`, getestet in `tests/belag.test.js`.
- Eine Warnung nur dort, wo sie für deine Art zu fahren zählt («Wie fährst du?»): unbefestigte Stücke bei «kurz und asphaltiert» (ab 5 %) und «ruhige Strassen» (ab 10 %), holprige Stücke bei allen ausser Mountainbike, Treppen bei allen (ab 5 m): «Vielleicht musst du das Velo tragen.»
- Ohne Daten (Reserve-Router, ein früher gespeicherter Umweg) steht nichts.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Stücke ohne Belag-Angabe: Strassen und Radwege zählen als befestigt (so ist es in OpenStreetMap üblich), Feldwege und Pfade ohne Angabe als «unklar», nie als gut. Pflasterstein (`sett`) zählt als befestigt.
- Die Zeile steht nur dort, wo ein Weg geplant wird (Wegauswahl und Karte des Umwegs), nicht bei der Überraschungsrunde und der Runde durch einen Ort: dort zählt die Stufe (Entspannt, Neugierig, Wild).
- Schwellen (5 % und 10 %, mindestens 300 m unbefestigt; 200 m holprig; 5 m Treppen) sind Annahmen.
- Keine neue Funktion im Sinn der Fertig-Regel (Erweiterung eines bestehenden Fensters), darum kein Eintrag in `features.js` und `app-stand.md`.

## Entscheide (für decisions.md)
- 05.11.2026: Belag und Schwierigkeit aus den Wegdaten zeigen, mit Warnung nach Art zu fahren (Noah «4a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Routing und Navigation: Schritt 4 von 4 gebaut; offen sind der Funkloch-Notausstieg (1b) und der Test der BRouter-Android-App (1c).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live › «⋯ › Neu planen zu …», einen Ort wählen: jeder Weg hat eine Zeile «Belag: … % befestigt …».
2. Einen Weg nehmen: die Karte zeigt die Zeile wieder. Eine Warnung erscheint nur bei unbefestigten Stücken (Rennvelo), holprigen Stücken (Gravel) oder Treppen.
