# Versionsnummer beim Merge

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1a» (Frage im Projekt-Chat: Nummer beim Merge statt pro PR; nach dem Merge auf der echten Seite testen)

## Was ist neu
- Ein PR vergibt keine Versionsnummer mehr. Er legt `src/lib/news/<name>.js` («Was ist neu») und `docs/releases/<name>.md` (diese Art Datei) an.
- `scripts/news.mjs` zählt beim Bauen die Merges auf `main` seit 0.232.0: ein Merge mit «Was ist neu»-Datei gibt die nächste Nummer (0.233.0), einer ohne eine kleine (0.233.1). Ein höher von Hand gesetztes `package.json` gewinnt, damit die offenen PRs (#282, #290, Touren c, Knöpfe) unverändert weiterlaufen.
- Nichts wird nach dem Merge auf `main` geschrieben (das wäre durch die Branch-Regel gesperrt und würde die Tests ein zweites Mal starten).

## Was fällt weg oder rutscht tiefer
- Weg: Version in `package.json`/`package-lock.json` hochzählen, Eintrag oben in `whatsnew.js`, Zeile in der `newerThan`-Liste, Kopfzeilen in `projektstand.md`/`status.md` pro PR, «Renumber» nach fremden Merges.
- Weg: Vercel-Testlink als Prüfort; Noah prüft nach dem Merge auf der echten Seite.
- Sonst nichts; in der App sieht man keinen Unterschied.

## Selbst entschieden
- Lösung über die Merge-Reihenfolge statt einer GitHub-Action, die nach dem Merge auf `main` schreibt: die Branch-Regel verlangt grüne Prüfungen für jeden Commit auf `main`, ein Action-Commit würde abgewiesen oder einen zweiten Testlauf brauchen.
- Kleine Nummer (0.233.1) für Merges ohne «Was ist neu» (Tests, Regeln, Bibliotheken), damit jede Version auf der Seite eindeutig ist.
- Auch die Doku pro PR in eine eigene Datei, weil die Kopfzeilen von `projektstand.md` und `status.md` sonst weiter jeden zweiten PR in Konflikt bringen.
- Ohne volle Git-Geschichte (Vercel-Vorschau) ist die Nummer nur geschätzt; die echte Seite (GitHub Pages) baut immer mit der vollen Geschichte.

## Entscheide (für decisions.md)
- 27.10.2026: Versionsnummer beim Merge (Noah «1a»). Grund: keine Konflikte mehr wegen Nummer und «Was ist neu», Tests nur einmal pro PR.

## Stand im Plan
- Verschlanken (Tests und Tempo): erledigt für Nummer und «Was ist neu». Offen als möglicher nächster Schritt: die deutschen Texte (`src/lib/i18n/de/index.js`) ebenfalls ohne gemeinsame Zeile einbinden.

## Prüfschritte
1. Nach dem Merge Ich öffnen: unten steht die Version, z. B. 0.232.1 (dieser Merge hat keine «Was ist neu»-Datei).
2. Beim nächsten App-PR: er ändert `package.json` nicht, und nach dem Merge zeigt Ich › Was ist neu ihn oben mit der nächsten Nummer.
