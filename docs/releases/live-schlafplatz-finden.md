# Schlafplatz finden (Schritt 1)

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah, Vorschlag «Schlafplatz finden» (Wildcampen), Antworten «1b 2a 3a und b 4a, kein Hinweis» (Thread «Live Navigation»)

## Was ist neu
- Im Menü «⋯» der Live-Karte die Zeile «Schlafplatz finden».
- «In meiner Nähe suchen» holt einmal pro Tipp aus OpenStreetMap: Unterstände, Hütten, Biwakschachteln und überdachte Haltestellen im Umkreis von 8 km. Das nächste steht zuerst, mit Distanz.
- «Hingehen» plant den Veloweg dorthin (das bestehende Fenster «Neu planen zu …»).
- «Als Schlafplatz speichern» merkt sich, wo du stehst, in der Liste deiner eigenen Punkte (Art «Schlafplatz»). Eigene Plätze lassen sich umbenennen und löschen, mit Rückgängig.
- Filter-Knöpfe: Hütte und Unterstand, Biwakschachtel, Haltestelle, Meine Schlafplätze.

## Was fällt weg oder rutscht tiefer
- nichts. Im Menü kommt eine Zeile dazu.

## Selbst entschieden
- Die Suche läuft nur auf Tipp, nie im Hintergrund (freie Server, wie «Stopps in der Nähe»).
- Ein Hinweis «Regeln je Kanton» steht nur als kleine Zeile im Fenster (Noah «kein Hinweis» heisst: kein eigener Warnhinweis auf der Karte).
- Eigene Plätze zeigen sich auch auf der Karte, weil sie in der bestehenden Liste der eigenen Punkte liegen.

## Entscheide (für decisions.md)
- Schlafplatz finden in drei Schritten: 1 Dächer und eigene Plätze, 2 berechnete gute Plätze (weg von Häusern und Strassen, flach, Wasser, Waldrand), 3 rote Verbotsflächen (Wildruhezonen, Jagdbann, Naturschutz).

## Stand im Plan (roadmap.md / vorhaben.md)
- Schlafplatz finden Schritt 1 erledigt; Schritte 2 und 3 folgen als eigene PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Fahrt starten, «⋯» › «Schlafplatz finden» › «In meiner Nähe suchen»: Dächer mit Distanz.
2. Name eingeben, «Als Schlafplatz speichern»: der Platz steht in der Liste; umbenennen, löschen, «Rückgängig».
3. «Hingehen» bei einem Platz: das Fenster «Neu planen zu …» öffnet sich mit diesem Ort.
