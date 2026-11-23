# Bilder entstehen von allein (Werkzeug)

Auftrag: Noah «1b 2a 3a 4b 5a» (Thread «Neuheiten in der App besser zeigen»), Schritt 1 von 4 von Weg B. Dieser PR ändert die App noch nicht: er legt das Werkzeug an, das die Bilder macht. Die Anzeige in der App kommt im nächsten PR.

## Was ist neu
- `npm run news:bilder` macht zu jeder Zeile einer «Was ist neu»-Datei, die eine genaue Stelle hat («Ausprobieren»), ein Handy-Bild der Stelle mit orangem Rahmen («nachher»). Wo es die Stelle vorher schon gab, macht es dasselbe Bild vom Stand vor der Änderung («vorher»), sonst nur «nachher».
- Die Bilder liegen in `public/news/<name>/` (`<zeile>-nachher.jpg`, `<zeile>-vorher.jpg`), klein (etwa 10 bis 40 KB), nicht im Programmcode.
- Der Build trägt die Bilder in die Neuheit ein (`bilder`), niemand führt eine Liste von Hand.
- Der Test `tests/newsbild.test.js` prüft Namen, Grösse (höchstens 90 KB) und dass die Zeile existiert.
- Beschreibung in `src/lib/news/README.md`, Abschnitt «Bilder».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Bildformat JPEG statt WebP: Playwright schreibt JPEG von sich aus, ohne weiteres Programm; Qualität 70 gibt etwa 10 bis 40 KB.
- Höchstens drei Bilder pro Neuheit (die ersten drei Zeilen mit genauer Stelle), damit ein PR klein bleibt.
- Die Bilder legt der PR-Autor selbst ins Repo (ein Befehl), nicht eine Automatik nach dem Merge: so gehen keine Schreibrechte für `main` auf, und die Bilder sind im PR sichtbar.
- Noch keine Pflicht: der Test verlangt heute kein Bild. Die Pflicht kommt als letzter PR, nachdem die Anzeige steht und die anderen Threads es wissen.
- Keine neue Funktion im Katalog, keine neue Seite, darum kein neuer Eintrag in `docs/app-stand.md`.

## Entscheide (eigene Datei)
- `docs/decisions/news-bilder.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuheiten besser zeigen (Weg B): Schritt 1 (Werkzeug) fertig; folgt: Schieber in «Was ist neu» mit den Bildern der letzten Nacht, Karte auf Heute nach Ort, Pflicht per Test.

## Prüfschritte (nach dem Merge auf der echten Seite)
Nichts zu sehen in der App. Zum Prüfen im Repo: `npm run news:bilder -- <name>` legt in `public/news/<name>/` die Bilder an.
