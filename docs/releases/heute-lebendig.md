# Heute wird lebendig

PR #298 · 27.10.2026 · Auftrag: Noah «4a» Bewegung überall dezent (26.10.2026), bewegte Bilder freigegeben mit «freigabe» (27.10.2026, Thread «Neuer Schwung fürs Design»)

## Was ist neu
- Beim Öffnen von Heute erscheinen die Kacheln nacheinander, innerhalb einer halben Sekunde (höchstens zehn Stufen à 40 ms).
- Grosse Zahlen steigen ein, der Pack-Balken füllt sich, der Ring «Was mir gut tut» zeichnet sich.
- Mit «Bewegung reduzieren» auf dem Gerät bewegt sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur Deckkraft, clip-path und der SVG-Strich bewegen sich, nie `transform`: keine Box springt, Tippen und Tests müssen nicht warten.
- Die Verzögerung pro Kachel kommt aus ihrer Stelle in der Wand (`--i` in `Wall.svelte`); «Schnell öffnen» erscheint als ein Block.
- Alles steht in `src/app.css` unter `prefers-reduced-motion: no-preference`.

## Entscheide (für decisions.md)
- 27.10.2026: Bewegung zuerst auf Heute, danach Seite für Seite mit dem neuen Stil (Noah «1a 2a 3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuer Schwung (docs/vorhaben-liste.md): Schritt 1 online, Schritt 2 mit diesem PR; als Nächstes 2b (grosser Haken), Aufklappen am Handy, Stil S2 auf Heute, dann Packen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne die App auf Heute (am besten neu laden).
2. Die Kacheln erscheinen kurz nacheinander, der Pack-Balken füllt sich, der Ring zeichnet sich.
3. Schalte am Handy «Bewegung reduzieren» ein (Einstellungen › Bedienungshilfen) und öffne Heute nochmals: Alles ist sofort da.
