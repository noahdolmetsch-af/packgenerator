# Fragen aus deinen Daten, Stufe 2: Vermutungen testen

PR folgt · 05.11.2026 · Auftrag: Noah «bau Stufe 2», Schritt 6 (Thread «Bauen: Tagescheck Stufe 2»)

## Was ist neu
- **Eine Vermutung zum Testen:** Zeigt «Was zusammenpasst» schon einen Hinweis (z. B. «An Tagen mit mehr als 7 h Schlaf war deine Stimmung 8, sonst 5») und ist heute ein Tag, der dazu passt (heute mehr als 7 h Schlaf), fragt der Check «Stimmt das heute?» mit Ja, Nein oder Nicht sicher. Der Hinweis steht als Grund darunter.
- Ich › Deine Abfragen: Regel «Eine Vermutung zum Testen» mit Schalter, Mindeststärke des Hinweises (30 bis 80 Prozent) und eigener Frage.
- Die Antwort steht im Verlauf (Ich › Verlauf) wie jede andere.

## Was fällt weg oder rutscht tiefer
- nichts. «Erkenntnisse» zeigt die Sätze wie bisher; ihre Wörter liegen jetzt in einer gemeinsamen Datei (`src/lib/erkenntnisse/words.js`).

## Selbst entschieden
- Gefragt wird nur bei Hinweisen vom gleichen Tag zwischen etwas Gemessenem (Schlaf, Schritte, Ruhepuls, Sonne, Regen, Termine, Velokilometer, Meditation, eigene Zahlen) und einem Gefühl (Stimmung, Akku, Zufriedenheit, Schlaf gefühlt). «Am Tag danach»-Hinweise und zwei Gefühle zusammen werden nicht abgefragt.
- Ein passender Tag heisst: der gemessene Wert von heute liegt über der Schwelle des Hinweises (der Satz sagt «An Tagen mit mehr …»).
- Nur der stärkste passende Hinweis, höchstens alle 3 Tage (wie die anderen Regeln, «seltener» geht auch hier).
- Gerechnet wird nur auf diesem Gerät; der Code dafür wird erst geladen, wenn die Regel an ist (der Start bleibt klein). Die Antworten ändern die Hinweise nicht, sie sind für dich im Verlauf.
- Kein Schema- und kein Backup-Format geändert.
- Fertig-Regel: Katalog und «Gut zu wissen» nennen «Fragen aus deinen Daten» allgemein; der Absprung ist der Link «Sieh, was zusammenpasst» im Kasten.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- «Fragen aus deinen Daten», Stufe 2 ist mit diesem Schritt komplett. Weiter: Stufe 3 (Kalender, To-Dos, Gewicht, Achtsamkeit, eigene Regeln, Tonwahl, die zwei Fragensysteme zusammenführen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Erkenntnisse: ein Hinweis mit Schlaf, Sonne o. Ä. und Stimmung oder Akku ist da.
2. An einem Tag, der dazu passt, fragt der Check «Stimmt das heute?» mit dem Hinweis als Grund. Antworte «Ja, das passt»; die Antwort steht unter Ich › Verlauf.
3. Ich › Deine Abfragen: «Eine Vermutung zum Testen» hat Schalter und Mindeststärke.
