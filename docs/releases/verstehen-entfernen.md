# Die Seite «App verstehen» ist weg

PR folgt · 22.11.2026 · Auftrag: Noah «wir können das ganze raus nehmen "app verstehen"» (Thread «Seite «Verstehen» auf Aktualität prüfen»)

## Was ist neu
- Nichts Neues. Ich › App verstehen (`#/me/verstehen`, sieben Lektionen) gibt es nicht mehr: Seite, Zeile unter Ich, Funktion `f.verstehen` (Handbuch, Beispiel, Suche, Karte der App) und alle deutschen Texte sind entfernt.

## Was fällt weg oder rutscht tiefer
- Die Seite «App verstehen» mit den Lektionen Landkarte, Backup, Haken, Merge, Wort ändern, Konten, Helfer einweisen → nichts. Der Weg zum Backup bleibt Ich › Daten und Backup.
- Die Zeile «App verstehen» unter Ich → nichts.
- Der Eintrag in der Karte der App und in der Suche → nichts.

## Selbst entschieden
- Das Notfall-Handbuch (`docs/notfall-handbuch.md`) und die Konten-Liste (`docs/konten.md`) bleiben auf GitHub. Sie sind eigene Dateien und nicht Teil der Seite; nur der Satz «In der App: Ich › App verstehen» im Handbuch ist gestrichen. Wenn auch sie weg sollen, ist das ein eigener Schritt.
- Die gespeicherten Häkchen (Einstellung `verstehen`) bleiben unberührt in den Daten liegen und werden nicht mehr gelesen. Kein Datenformat, kein Backup und kein Schema berührt, nichts wird gelöscht.
- Die alte Neuigkeit «Deine App verstehen» bleibt in der Liste «Was ist neu» (Geschichte), ohne Knopf zur Seite (`go: null`).
- `f.verstehen` steht in `tests/fixtures/funktionen.json` unter «abgeloest» (mit Grund), damit der Verlust-Test die Absicht sieht.
- `tests/e2e/karte-der-app.spec.js` sucht jetzt «Datenschutz» statt «verstehen».
- Die Fehler der Seite (Hinweise zu Test-Link, Haken, Version, Wächter) erledigen sich damit; die Fragen 1 bis 4 aus dem Thread sind hinfällig.

## Entscheide
- Siehe `docs/decisions/verstehen-entfernen.md`.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich öffnen: keine Zeile «App verstehen».
2. Ich › Karte der App › «verstehen» suchen: kein Treffer «App verstehen».
3. `#/me/verstehen` im Adressfeld: die App landet auf Heute.
