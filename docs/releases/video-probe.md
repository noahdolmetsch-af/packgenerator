# Erst die Video-Grösse ausprobieren

PR #<Nummer> · 28.10.2026 · Auftrag: Noah «bauen» (Thread «Ideen einzeln», Idee 10) und «1a 2a 3a 4a» (Thread «Videos in der App einschätzen»)

## Was ist neu
- Ich › Werkzeugkasten › Video verkleinern: Nach dem Wählen eines Videos gibt es zwei Knöpfe. «Zuerst 5 Sekunden ansehen» rechnet nur 5 Sekunden aus der Mitte des Videos, spielt sie ab und nennt die Grösse des ganzen Videos (Schätzung). «Ganzes Video verkleinern» macht wie bisher alles.
- Wer die Grösse ändert, sieht das Teststück nicht mehr (es passt nicht mehr) und kann neu ansehen.
- Videos in Notizen werden mit demselben Programmteil verkleinert wie im Werkzeug (vorher war der Code doppelt, mit anderen Einstellungen).

## Was fällt weg oder rutscht tiefer
- Das Video startet nicht mehr sofort nach dem Wählen: ein Tipp mehr auf «Ganzes Video verkleinern» (alt: sofort; neu: Wahl, dann Knopf).

## Selbst entschieden
- Teststück = 5 Sekunden aus der Mitte; ein kürzeres Video zählt ganz.
- Die Schätzung rechnet vom Teststück auf die ganze Länge hoch. Es ist eine Schätzung, kein Versprechen.
- Notiz-Videos bleiben ohne Ton und 480 px; neu nimmt der Browser MP4, wenn er es kann, sonst WebM.
- Kein Dexie-Schema, kein `api/`, nichts im Backup anders.

## Entscheide (für decisions.md)
- 28.10.2026: Video-Probe gebaut; Reihenfolge der weiteren Video-Schritte: Standbild, Video-Link, Videos im Album, Clip kürzen, Diashow (Noah «1a 2a 3a 4a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Videos: Schritt 1 von 6 (Video-Probe).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Werkzeugkasten › Video verkleinern, ein kurzes Video wählen.
2. «Zuerst 5 Sekunden ansehen»: ein Teststück läuft, die Grösse des ganzen Videos steht darunter.
3. «Ganzes Video verkleinern»: wie bisher, mit «Speichern oder teilen».
