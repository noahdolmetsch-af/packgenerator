# Gewicht in Stufen

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «1a 4a 5b» (Thread «Packen nach Taschen am Bike ausbauen») und «5a» beim Finden-Thread (Knopf «Taschen wiegen»)

## Was ist neu
- Die Karte «Gewicht» auf der Packliste hat unten den Block «Gesamtgewicht»: **Nur die Teile**, **Mit Taschen**, **Mit Velo**, **Mit dir**. Jede Zeile nennt, was sie dazu bringt («+ 1.2 kg»). Fehlt irgendwo ein Gewicht, steht «~» davor und ein Satz erklärt es.
- Eine Tour ohne Velo zeigt dieselbe Karte, ohne die Zeile «Mit Velo» (Noah «4a»). Die Zeile «Mit dir» erscheint, wenn dein Körpergewicht eingetragen ist.
- Knopf «Taschen wiegen» im Block: öffnet die erste Tasche ohne gewogene Zahl (sonst die erste Tasche) mit dem Feld «Gepackte Tasche auf der Waage». Derselbe Weg ist `#/pack?weigh` (für die Zeile «Taschen wiegen» im Neu-Menü, Finden-Thread).

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile «System: … · Taschen: … · Velo: …» im aufgeklappten Gewicht bleibt, die Karte «Gewicht» bekommt nur einen Block dazu.

## Selbst entschieden
- Rechnung aus `tripStats` (`src/lib/pack/gesamt.js`): getragene Taschen (Rücken, Hüfte) zählen zu «Mit Taschen», nicht zu «Nur die Teile», damit nichts doppelt zählt.
- Touren ohne Velo zeigten die Karte «Gewicht» bisher gar nicht; jetzt zeigen alle Touren mit Teilen sie.
- Kein neuer Eintrag in `features.js`: es ist ein Block der bestehenden Karte «Gewicht» (Zeile in `docs/app-stand.md` ergänzt).
- Keine Datenänderung: alle Zahlen sind gerechnet, nichts wird gespeichert.

## Entscheide (eigene Datei `docs/decisions/gesamtgewicht-stufen.md`)
- 23.11.2026: vier Zeilen untereinander, auch ohne Velo, Knopf «Taschen wiegen» (Noah «1a», «4a», «5a»)

## Stand im Plan (roadmap.md / vorhaben.md)
- Packen nach Taschen am Bike (Leitfaden): Schritt 2 von 3 (danach «Tasche lernen»)

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Packliste einer Velotour mit Taschen öffnen: in der Karte «Gewicht» steht «Gesamtgewicht» mit vier Zeilen.
2. «Taschen wiegen» tippen: die erste ungewogene Tasche öffnet sich, der Cursor steht im Feld.
3. Eine Tour ohne Velo öffnen: die Karte zeigt «Nur die Teile» und «Mit Taschen», keine Zeile «Mit Velo».
