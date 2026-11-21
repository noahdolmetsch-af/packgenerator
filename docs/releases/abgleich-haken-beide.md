# Haken von zwei Geräten bleiben beide

PR folgt · 21.11.2026 · Auftrag: Noah «1-5a» (Punkt 4, Thread «Fix Abhaken-Sync zwischen Computer und Handy»)

## Was ist neu
- Haken in **derselben Packliste** (eine Tour: «gepackt» und die Bereit-Liste) und in **derselben Woche des Wochenplans** (`training.weeklog`) gehen nicht mehr verloren, wenn zwei Geräte gleichzeitig ändern. Bisher gewann die neuere Fassung als Ganzes; die ältere lag 30 Tage unter «Von selbst abgeglichen» und die Haken sahen verloren aus. Jetzt bleiben die Haken beider Geräte (`src/lib/sync/merge.js`, eingehängt in `settle()` von `src/lib/sync/engine.js`). Namen, Daten und Reihenfolge kommen weiter von der neueren Fassung.
- Das Ergebnis ist auf beiden Geräten gleich, egal welches rechnet, und ein zweites Zusammenführen ändert nichts: die Geräte beruhigen sich, kein Hin und Her.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Preis, ehrlich gesagt: Die App weiss nicht, was beim letzten Abgleich in der Liste stand. Nahm ein Gerät einen Haken weg, während das andere gleichzeitig dieselbe Liste änderte, kommt der Haken zurück; ebenso ein Gegenstand, den ein Gerät löschte, während das andere etwas anderes abhakte. Es geht nichts verloren, ein Tippen stellt es richtig. Das passiert nur, wenn beide Geräte dieselbe Liste in derselben Abgleich-Lücke ändern; ändert nur eines, gilt wie bisher einfach dessen Stand.
- Nur diese zwei Arten von Einträgen bekommen eine Zusammenführ-Regel (da stehen Haken in einem einzigen Eintrag). Aktivitäts-Haken auf Aktiv (`flowLog`) sind je eigene Einträge und gingen nie verloren. Weitere Arten (zum Beispiel eigene Listen) lassen sich in `merge.js` mit einer Zeile ergänzen, wenn du sie willst.
- Das ist eine Änderung am Abgleich (Datenspeicher): Einzelfreigabe «ok NNN».

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Absicherung des Abgleichs (Noah «1-5a»), Punkt 4 von 5.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Zwei abgeglichene Geräte: dieselbe Tour öffnen, am Handy Gegenstand A, am Computer Gegenstand B abhaken (am besten, ohne zwischendurch abzugleichen).
2. Nach dem Abgleich sind A und B auf beiden Geräten abgehakt.
