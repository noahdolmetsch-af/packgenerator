# Wetter für Zuhause oder die nächste Tour

PR · 01.11.2026 · Auftrag: Noah «2a» (Thread «Klären: Wohnort und Wetter pro Tour»)

## Was ist neu
- Oben auf der Wetter-Seite (Ich › Wetter) zwei Knöpfe: «Wohnort» und «Nächste Tour: <Name>». Ein Tipp wechselt den Ort der ganzen Seite.
- «Nächste Tour» ist die nächste geplante Tour mit eigenem Ort oder Routenstart. Hat die Tour einen eigenen Ort, gilt er vor dem Routenstart.
- Die Suche nach einem anderen Ort bleibt wie sie war.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur zwei Knöpfe, kein Dropdown: mehr Touren erreicht man über «Mehr Wetter» in der Tour (Adresse `#/wetter?trip=…` wie bisher).
- Die Wetter-Seite nahm bisher nur den Routenstart; jetzt zuerst den eigenen Ort der Tour (gleiche Reihenfolge wie die Tour-Seite).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wetter öffnen: oben «Wohnort» (und «Nächste Tour: …», wenn eine geplant ist).
2. «Nächste Tour» antippen: der Ortsname und das Wetter wechseln. «Wohnort» antippen: zurück.
