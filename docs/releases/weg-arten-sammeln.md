# Weg zum Ziel: Schrittarten melden sich selbst an

PR # · 07.11.2026 · Auftrag: Noah «ok» zum Vorschlag «Liste der Schrittarten so umbauen, dass jede Art in eine eigene Datei kommt» (Thread «Umbauen: Schrittarten ohne Konflikte»)

## Was ist neu
- Nichts Sichtbares. `src/lib/weg/types/index.js` sammelt die Schrittarten selbst aus dem Ordner (`import.meta.glob`). Bisher stand dort pro Art eine `import`-Zeile und ein Eintrag in `TYPES`; jeder PR mit einer neuen Art änderte dieselben Zeilen und kollidierte mit den anderen.
- Neue Art = neue Datei `src/lib/weg/types/<name>.js`, sonst nichts. Die Reihenfolge im Blatt «Neuer Weg» kommt aus der Zahl `order` in der Art (Eigener Schritt 0, Rennplanung 10, Packen testen 20, Nachtplan 30, Bike ready 40); Arten ohne `order` folgen danach, nach ihrem `type` sortiert.
- Die fünf bestehenden Arten bekommen nur die Zeile `order`; ihr Verhalten ist gleich. Reihenfolge und Texte im Blatt sind wie vorher.
- `tests/weg-arten.test.js`: jede Datei im Ordner ist eine Art, jede Art wird gefunden, keine handgeschriebene Liste in `index.js`, Reihenfolge, Rückfall `typeOf` auf den eigenen Schritt, `collect` und `suggestions`.
- `docs/technik-handbuch.md`: Abschnitt «Weg zum Ziel: Schrittarten» mit der Regel «neue Art = neue Datei». `docs/app-stand.md`: ein Satz in der Zeile «Weg zum Ziel».

## Was fällt weg oder rutscht tiefer
- nichts. Nur die Pflicht, eine Art in `types/index.js` einzutragen, fällt weg.

## Selbst entschieden
- `order` als Zahl in der Art statt einer Liste in `index.js` (eine Liste wäre wieder dieselbe Zeile für alle).
- Eine Datei im Ordner ohne `type` wird übersehen statt zum Absturz zu führen; der Test prüft, dass jede Datei eine Art ist.
- Keine News-Datei: nichts Sichtbares. Keine neue Funktion, Fertig-Regel entfällt.
- Offene PRs mit einer neuen Art (#1064, #1065, #1075, #1097 u. a.) ändern noch `types/index.js`. Nach diesem PR löst jeder den Konflikt, indem er seine Zeilen dort weglässt (Datei der Art bleibt); der Bündler kann das beim Nachziehen von `main` tun.

## Entscheide (für decisions.md)
- keine neuen Entscheide.

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Rückwärts-Plan zu einem grossen Ziel»: Technik für die weiteren Schrittarten (Meilensteine, Erholung, Wetterfenster). Plan unverändert.

## Prüfschritte
Nichts zu prüfen auf der Seite. Wer will: Touren › Weg zum Ziel › «Neuer Weg»: die Schrittarten stehen wie vorher da.
