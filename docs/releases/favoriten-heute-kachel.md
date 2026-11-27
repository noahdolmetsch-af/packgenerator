# Favoriten als Karten auf Heute

PR folgt · 27.11.2026 · Auftrag: Noah «1-5a», «a» (grosse Karten am Handy) und «Priorität» (Thread «Lieblingsinhalte besser sichtbar machen»)

Schritt 2 von 4 des Konzepts «Favoriten» (Schritt 1: Stern statt Pin, online).

## Was ist neu
- Auf Heute steht die Kachel **«Favoriten»** ganz oben, direkt unter dem Gruss und vor «Abhaken»: die ersten sechs Favoriten als Karten mit Symbol, Name und einer leisen zweiten Zeile (deine Notiz, sonst die Gruppe). Am Handy zwei grosse Karten nebeneinander.
- **«Alle N ›»** öffnet das Fenster «Favoriten» mit allen Favoriten nach Gruppen: Gruppe umbenennen oder löschen (die Favoriten gehen, wohin du willst, mit «Rückgängig»), Stern nimmt einen Favoriten heraus, Pfeile ordnen, «Neue Gruppe» und «Fertig» stehen fest im Fuss.
- **«Oft genutzt»**: bis zu zwei Seiten, die du oft öffnest, stehen leise unter den Karten; der Stern merkt sie, das Kreuz («Nein, danke») hält sie 30 Tage zurück.
- Wer schon eine eigene Heute-Ansicht hat, bekommt die Kachel einmal ganz oben; wer sie wegnimmt oder verschiebt, behält das.

## Was fällt weg oder rutscht tiefer
- «Abhaken» (und alles darunter) rutscht am Handy ein Stück nach unten, weil die Karten Platz brauchen (Noah «a» am 27.11.2026).
- Die Kachel steht nicht mehr unter der zugeklappten Zeile «Mehr» (Bereich «Schnell öffnen»), sondern oben; der Bereich «Schnell öffnen» gibt es auf Heute nicht mehr.
- Die lange Liste mit Zeilen auf Heute fällt weg; sie steht im Fenster «Alle» und im Stift «Favoriten ändern».

## Selbst entschieden
- Die Vorschau pro Karte (zum Beispiel Packfortschritt) kommt mit Schritt 3, wo Tour, Packliste und Velo Sterne bekommen. Bis dahin zeigt die zweite Zeile die Notiz oder die Gruppe.
- Das Symbol einer Karte folgt dem Bereich der Funktion (vorher, unterwegs, nachher, Velo, aktiv, Daten); eine gemerkte Ansicht bekommt das Link-Symbol.
- «Alle N ›» lädt das Fenster erst beim Antippen (die Seite startet nicht schwerer).

## Entscheide (eigene Datei `docs/decisions/favoriten-heute-kachel.md`)
- 27.11.2026: Favoriten-Kachel als erste Kachel, Karten, «Alle»-Fenster, «Oft genutzt»

## Stand im Plan (roadmap.md / vorhaben.md)
- Favoriten, Schritt 2 (Heute-Kachel): erledigt mit diesem PR; offen: Sterne an Tour, Packliste und Velo mit Vorschau, Suche, Wort «Bewährtes».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: die Kachel «Favoriten» steht oben, sechs Karten; ein Tipp öffnet die Funktion.
2. «Alle N ›» antippen: das Fenster öffnet, Gruppen lassen sich umbenennen, ein Stern nimmt einen Favoriten heraus (mit «Rückgängig»), «Fertig» schliesst.
3. Eine oft geöffnete Seite wird unter den Karten vorgeschlagen; der Stern merkt sie.
