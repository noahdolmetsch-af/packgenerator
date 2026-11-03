# Ein Name pro Funktion (Wegweiser 22: gleiche Namen überall)

PR #… · 02.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» und Plan «freigabe» Schritt 1–26 (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
Vier Funktionen hiessen im Katalog, in Tipps, Suche oder Handbuch anders als auf der Seite. Jetzt gilt ein Name:

| Funktion | Vorher | Neu (überall) | Wo |
|---|---|---|---|
| Touren vergleichen (Tipp `trend`) | Gewichtstrend | Touren im Vergleich | Rückblick, Abschnitt «Touren im Vergleich» |
| Sprache (Tipp `lang`) | Deutsch / English | Sprache | Ich › Sprache (Heimatseite jetzt `#/me` statt `#/me/look`, dort stand sie nie) |
| km eintragen (Tipp `km`) | «km für ein Velo» in Neu und Handbuch, «km eintragen» in Tipps und Heute | km eintragen | Neu › km eintragen |
| Tennis-Seite (`f.tennistop`) | Tennis-Seite | Tennis | Titel der Seite Aktiv › Tennis |

- Lücken-Liste (`src/lib/know/heimat.js` GAPS): Touren im Vergleich und Tennis sind jetzt auf ihrer Seite sichtbar, die Liste sinkt von 45 auf 43. Sprache steht jetzt mit der richtigen Seite (Ich) in der Liste, aber als «weiter unten» statt «anderer Name», weil sie am Handy tiefer als 2,5 Bildschirme steht.

## Was fällt weg oder rutscht tiefer
- nichts. Nur Namen ändern sich. Der alte Name «Gewichtstrend» steht nicht mehr als Titel im Katalog.

## Selbst entschieden
- Immer der Name, den die Seite zeigt, weil man ihn dort sieht. Bei «km» der kürzere Name aus Tipps und Heute («km eintragen»), weil er sagt, was man tut.
- Diese 14 Lücken mit Grund «name» bleiben, weil sie keine zwei Namen haben, sondern nur in einer Lage, in einem Fenster oder als Verhalten erscheinen: Sportart einer Tour (im Fenster «Neue Tour»), Alle Taschen nebeneinander (nur auf grossem Bildschirm), Brunnen und Velo-Werkstätten (nur mit Strecke), Liste teilen oder drucken (im Menü ⋯), Notizen werden To-dos (nur bei Notizen), km eintragen (im Fenster «Neu»), Zusatz-Bausteine pro Sportart (auf jeder Sportseite), Offline nutzen (Browser-Aktion), Such-Befehle, Text in Bildern finden, Kamera überall, Knöpfe erklären sich, Fragen in eigenen Worten (Verhalten der App), Weiter fragen (nur unter einer Antwort). Sie gehören zu Schritt 23 «Erscheint, wenn …».

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 22 von 26.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Katalog öffnen und «Touren im Vergleich» suchen: es öffnet den Rückblick bei diesem Abschnitt.
2. «Neu» antippen: die Zeile heisst «km eintragen», das Fenster auch.
3. Im Katalog «Tennis» suchen: der Eintrag heisst wie die Seite.
