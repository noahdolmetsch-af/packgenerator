# Ziele sichtbar: das Stundenziel im Sportjahr

21.11.2026 · Auftrag: Noah «ich möchte alle entwürfe 1-3 umsetzen» und «Was ich sonst noch verbessern würde» (Thread «Jede Sportart durchgehen», Umsetzungsauftrag S10); gestapelt auf Sportjahr (S3)

## Was ist neu
- Hat das Ziel (`training.goal`) Stunden pro Woche, zeigt das Diagramm im Sportjahr eine **Linie mit diesem Ziel**: pro Balken Stunden pro Woche mal die Tage des Balkens durch 7.
- Im Jahr gibt es schon die Linie «Vorjahr»; wo beides da ist, wählt ein Schalter **Linie: Vorjahr | Ziel**.
- Ein Satz unter den Zahlen sagt «Dein Ziel: 6 h pro Woche. In diesem Zeitraum waren es 5,4 h pro Woche.» mit Link «Ziel ändern».
- Ist der Zieltag vorbei, steht ein ruhiger Satz «Der Zieltag von «…» ist vorbei. Neues Ziel setzen oder lass es weg.» Keine Linie, kein Alarm.
- Nichts wird gespeichert, nichts ändert sich am Ziel selbst. Ohne Ziel oder ohne Stunden im Ziel sieht die Seite aus wie vorher.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Wochenziele je Sportart (`training.sportgoals`, Mal pro Woche) sind nicht in der Linie: das Diagramm zählt Stunden, die Wochenziele zählen Mal. Sie stehen weiter auf den Sportseiten.
- Die Linie ist bei Monats- und Jahresbalken das Ziel auf die ganze Länge des Balkens gerechnet, auch für Monate, die noch kommen.
- Fertig-Regel: Erweiterung einer bestehenden Seite, keine neue Funktion; (2) Absprung: der Link «Ziel ändern» führt in Training, (4) leerer Zustand: ohne Ziel keine Zeile, (6) App-Stand: Zeile «Sportjahr» ergänzt. Kein eigener «Gut zu wissen»-Text (die Seite steht nicht in `ON_PAGES`).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr: S10 gebaut (hängt an S3).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training: ein Ziel mit Stunden pro Woche setzen (falls keines da ist).
2. Auswerten › Sportjahr: im Diagramm die Zielinie und darunter den Satz mit deinen Stunden pro Woche ansehen.
3. «Jahr» wählen und den Schalter «Linie: Vorjahr | Ziel» ausprobieren.
