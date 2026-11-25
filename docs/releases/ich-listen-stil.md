# Listen sehen bei jedem Besuch gleich aus

PR #<Nummer> · 19.11.2026 · Auftrag: Noah «mache einen kompletten test der website … behebe dabei kleine fehler direkt» (Thread «Ganze Website testen und Fehler beheben»)

## Was ist neu
- Ich › Mini-Tools: Die Liste der sieben Werkzeuge war nach dem Neuladen (oder über einen angepinnten Link) blosser Text mit Aufzählungspunkten und unterstrichenen Titeln; Titel und Beschreibung klebten aneinander («Termin findenWelcher Tag passt allen?»).
- Ich › Hinweise und News: Dieselbe Ursache. «Deine Quellen» (Bikepacking.com, Adresse daneben statt darunter) war auf einem 320-px-Handy so breit, dass die ganze Seite 376 px breit wurde und sich zur Seite schieben liess. Jetzt 320 px.
- Ursache bei beiden: Die Zeilen-Stile (`src/lib/ich/ich.css`) wurden nie von der Seite selbst geladen; sie standen nur da, wenn vorher eine andere Ich-Seite offen war. `MiniTools.svelte` und `Hinweise.svelte` laden die Datei jetzt selbst.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur diese zwei Seiten angefasst. Ein Lauf über alle 171 Links der App (jede Seite direkt geladen, Handy und Computer, dazu 320 px, dunkel, Englisch) hat sonst keine ungestaltete Seite gefunden.
- Kein neuer Test: der Fehler zeigt sich nur beim direkten Laden einer Seite, die ihre Stile von einer anderen Seite erbt.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Mini-Tools öffnen und neu laden (am Handy: nach unten ziehen): Die Werkzeuge stehen als Zeilen mit Symbol, Titel und einer Zeile darunter.
2. Ich › Hinweise und News öffnen und neu laden: Unter «Deine Quellen» steht jeder Feed als Zeile, der Name oben, die Adresse darunter.
