# Direkt zum Neuen

PR #… · 27.10.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Entwerfen Ausprobieren-Knopf bei Neuigkeiten»)

## Was ist neu
- «Ausprobieren» und jede Zeile in Ich › Was ist neu (auch die Kachel «Neu» auf Heute und die Liste in «Was die App
  alles kann») springen an die genaue Stelle: Seite, Reiter, Fenster oder Aufklapper öffnen sich, die Stelle
  leuchtet 3 Sekunden, unten steht kurz «Neu hier: …» mit ✕.
- Was nur manchmal erscheint (z. B. auf der Live-Karte während einer Fahrt), führt auf die Seite und sagt in einer
  Zeile, wann es erscheint; wo es passt, mit «Im Beispiel zeigen» (Spielwiese).
- Gleicher Sprung wie im Katalog («332 Use Cases», `src/lib/know/spot.js`), kein zweiter Mechanismus.
- Jede neue Neuigkeit (`src/lib/news/*.js`) muss pro Punkt `go` angeben; `tests/newsgo.test.js` passt auf,
  `tests/e2e/ausprobieren.spec.js` tippt jede Zeile einmal an.

## Was fällt weg oder rutscht tiefer
- nichts. Zeilen ohne genaues Ziel führen wie bisher auf ihre Seite.
- «Ausprobieren» nimmt nicht mehr einfach den ersten Punkt mit Link, sondern den ersten mit genauer Stelle.

## Selbst entschieden
- Die Zeile «Neu hier: …» verschwindet nach 8 Sekunden von selbst.
- Die Kachel «Neu» auf Heute lädt den Sprung erst beim Tippen, damit Heute leicht bleibt.
- Die alten Versionen bekommen ihr Ziel in eigenen kleinen PRs über `src/lib/know/newsgo-map.js` (nach Text der
  Zeile), neueste zuerst; dieser PR legt die Datei leer an.
- Die Neuigkeit «Shop, Rechnungen … nicht mehr im Katalog» bekommt keinen Knopf (es gibt nichts zu zeigen).
- Die 15 Neuigkeiten, die seit dem Bau auf main dazukamen, haben ihr Ziel gleich in diesem PR bekommen (sonst wäre der Wächter-Test rot). Reine Korrekturen ohne Ort bekommen keinen Link.
- Muster-Rennen: Wer nach dem Tipp schon woanders ist, wird nicht mehr zum Muster-Rennen zurückgeholt, wenn es fertig erstellt ist (fiel beim Antippen aller Zeilen auf).

## Entscheide (für decisions.md)
- 27.10.2026: Jede Neuigkeit führt genau an ihre Stelle; ein gemeinsamer Sprung für Katalog, Neuigkeiten und
  später Tipps, Handbuch, Rundgang und Rennen (Noah «1a 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Ausprobieren» bei Neuigkeiten: Schritt 1 von 3 (Mechanismus); danach alte Neuigkeiten nach Bereich, dann die
  anderen Stellen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu › «Ausprobieren» beim neuesten Update: die Stelle leuchtet, unten «Neu hier: …».
2. «Update oder Funktion suchen»: «Bereiche» eingeben, das Update öffnen, eine Zeile antippen: Heute öffnet sich
   und die erste Bereichs-Überschrift leuchtet.
3. Ich › Mit Freunden › Kontaktkarte über Was ist neu öffnen: die Karte leuchtet.
