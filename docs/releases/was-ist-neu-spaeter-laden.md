# «Was ist neu» erst beim Öffnen laden

PR · 05.11.2026 · Auftrag: Noah «a» (Thread «Erklären und beheben: Start-Grenze bei 98 %»), Teil 2 von 2 (Teil 1: Handbuch, `handbuch-spaeter-laden.md`)

## Was ist neu
- Die Liste aller Versionen mit allen Texten (Englisch und Deutsch) gehört nicht mehr zum Start. Beim Start liegen die neuesten 10 Versionen ganz (Kachel «Neu» auf Heute, Hinweis nach einem Update) und für jede Version eine kurze Zeile (Version, Tag, Zahl der Punkte). Der Rest lädt mit den Seiten «Was ist neu», «Weg und Releases» und der Liste in «Was die App kann».
- Gemessen (lokaler Aufbau, beide Teile zusammen): vom Wächter gezählter Start 4.52 → 3.37 MB (73 % der 5,0 MB), ganzer Start 3.97 → 3.02 MB, gzip 1.35 → 1.10 MB. Die Grenze von 5,0 MB bleibt.
- In der App ändert sich nichts Sichtbares. Die Seiten «Was ist neu» und «Weg und Releases» brauchen beim ersten Öffnen einen Augenblick länger; offline geht alles weiter.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- `scripts/news.mjs` schreibt zusätzlich `src/lib/news/neu.gen.js` und `archiv.gen.js` (beide nicht in git, wie `index.gen.js`, das für Tests und Werkzeuge ganz bleibt). Neue «Was ist neu»-Dateien laufen wie bisher; die Zahl 10 steht in `NEW_COUNT`.
- Die von Hand nummerierten alten Versionen (`whatsnew-alt.js`, Deutsch in `whatsnew-alt-de.js`, Kurzzeilen in `whatsnew-alt-index.js`) sind aus `whatsnew.js` ausgelagert; `tests/whatsnew-split.test.js` prüft, dass die Kurzzeilen zur Liste passen.
- Deutsche Texte, die auch ausserhalb der Liste gebraucht werden (zusammen 39 + die vom Generator errechneten), bleiben beim Start in `src/lib/i18n/de/whatsnew.js` (jetzt 3 KB statt 235 KB).
- Playwright-Dateien und Unit-Tests, die die ganze Liste brauchen, lesen sie aus `src/lib/whatsnew-full.js` (ohne t()/Runen, für Node) oder `whatsnew-all.js` (App).
- Keine «Was ist neu»-Datei und keine Zeile in `docs/app-stand.md`: nichts Sichtbares, keine neue Funktion.

## Entscheide (für decisions.md)
- 05.11.2026: Noah «a»: «Was ist neu» erst beim Öffnen laden (neueste 10 am Start, Rest später).

## Stand im Plan
- Tempo: Teil 2 fertig. Start-Grenze bei 73 % statt 98 %.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute ganz unten: Kachel «Neu» zeigt die neueste Version mit deutschem Text.
2. Ich › Was ist neu: die Liste ist da, ältere Versionen aufklappen, Texte auf Deutsch.
3. Ich › Weg und Releases: «Was kommt» und die Versionen erscheinen auf Deutsch.
