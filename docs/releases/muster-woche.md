# Muster-Woche: erfundene Haken für Abhaken und Mein Tag

Auftrag: Noah «1-5a» (23.11.2026, Rundgang der Stärken, Schritt 4). Ziele: Klarheit und Auffindbarkeit.

## Was ist neu
- Die Beispiele (erster Start, Ich › Daten und Backup › «Beispiele anpassen», «Muster ansehen») bringen mit dem Interesse **«Abhaken und Alltag»** jetzt eine **erfundene Woche mit Haken**: sechs Tage, 14 Haken (Meditation, Yoga, Velo, Liegestütze, Sauna, Dehnen, Laufen), mit Dauer oder Anzahl.
- So sind «Heute abhaken» und «Mein Tag» beim ersten Blick nicht leer, und man sieht, wie ein Tag und eine Woche mit Haken aussehen.
- «Beispiele entfernen» nimmt die Beispiel-Haken zusammen mit den Beispiel-Tätigkeiten weg, mit Rückgängig. Deine eigenen Haken bleiben immer; eine Tätigkeit, die du selbst abgehakt hast, bleibt.
- Für die Seite Mein Tag gibt es die Zeile «So sieht's aus» als Bereich `week` in `src/lib/firststart/sosieht.js` (`<SoSiehts area="week" />`): Sie holt nur das Interesse «Abhaken und Alltag».

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Die Seite Mein Tag gehört den Alltag-Threads: Die Zeile wird dort von ihnen eingesetzt (Übergabe nach dem Merge). Dieser PR liefert Daten und den Bereich `week`.
- Die Beispiel-Haken tragen die Kennung `ex-tick-n` in den Daten. Eine Markierung «Beispiel» im Bildschirm gibt es dort nicht (ein Haken ist kein eigenes Ding mit Namen); der Weg zurück steht im Hinweis beim Holen.
- Der erste Start mit «Los, mit Beispielen starten» bringt die Woche mit (alle Interessen gewählt); ohne «Abhaken und Alltag» kommt sie nicht.

## Entscheide (eigene Datei)
- 23.11.2026: Muster-Woche als Beispiel-Daten im Haken-Protokoll (Noah «1-5a»): `docs/decisions/muster-woche.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Rundgang der Stärken: Schritt 4 (Muster-Woche als Daten) fertig; die Zeile auf Mein Tag setzen die Alltag-Threads.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup › «Beispiele anpassen», «Abhaken und Alltag» wählen, «Beispiele einsetzen».
2. Mein Tag, Reiter «Abhaken»: die Haken der letzten sechs Tage sind da.
3. Ich › Daten und Backup › «Beispiele entfernen»: die Beispiel-Haken gehen, eigene bleiben.
