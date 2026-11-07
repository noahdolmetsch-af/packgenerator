# Weg zum Ziel: die Seite (K2)

PR # · 07.11.2026 · Auftrag: Noah «1b 2b 3a 4a 5a», «1d 2b 3a 4e 5a+e+c», «Ok» (Thread «Entwerfen Weg zum grossen Ziel»)

## Was ist neu
- Neue Seite **Touren › Weg zum Ziel** (`#/trips/weg`, `#/trips/weg?g=<id>`): ein grosses Ziel mit Starttag nennen, die Schritte stehen auf einer Zeitlinie (weit weg, aufbauen, vorbereiten, letzte zwei Wochen, nach dem Start, noch kein Tag).
- Jeder Schritt: abhaken, auf einen anderen Tag verschieben, umbenennen, löschen (mit Rückgängig); eigene Schritte schreiben. Ziele umbenennen, ordnen (Pfeile), löschen (mit Rückgängig); Starttag ändern.
- Freie Ziele und Ziele ohne Starttag gehen (Noah 2b); die Schritte bekommen ihren Tag, sobald der Start gesetzt ist.
- Die Schrittarten (Training, Velo, Packen …) dockt jeder Thread mit einer Datei in `src/lib/weg/types/` an; die Seite liest `defaults`, `auto`, `link` und `load` aus der Liste. Solange nur «Eigener Schritt» da ist, schreibt man die Schritte selbst.
- Bei einem Rennen-Ziel kann man eines seiner Rennen aus Touren wählen (freiwillig); Name und Starttag werden übernommen und das Ziel merkt sich die Tour (`tripId`), damit die Schrittarten es finden.
- Von der Seite aus: Kachel in «Alles hier» unter Touren.

## Was fällt weg oder rutscht tiefer
- nichts (eine Kachel mehr unter «Alles hier» in Touren)

## Selbst entschieden
- Fertig-Regel: (1) Seite mit Eintrag in features.js über `featreg/weg.js` (Handbuch-Schritte, Beispiel); (2) Absprung: Kachel in «Alles hier» (`alleshier.js`); (3) «Gut zu wissen»: die Seite hat noch keine Karte «Was du hier tun kannst», darum kein Text; (4) leere Ansicht: `Empty` mit «Neuer Weg»; (5) «Als Nächstes»: kommt, sobald es Schrittarten mit Folgeseiten gibt (jeder Schritt hat dann seinen «Öffnen»-Link); (6) Zeile in `docs/app-stand.md`.
- Schritte werden nicht mit Pfeilen geordnet: Die Reihenfolge ergibt sich aus dem Tag; den Tag ändert man am Schritt. Ziele lassen sich mit Pfeilen ordnen.
- Die Heute-Zeile, «Reicht die Zeit?», Meilenstein-Leiste, Wetterfenster, Rückblick und Vorlage folgen als eigene kleine PRs (je mit Bildern).
- Ablage unverändert aus #1050 (Einstellungs-Eintrag `weg`, im Backup).

## Entscheide (für decisions.md)
- keine neuen (siehe #1050)

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G: Seite gebaut; Schrittarten kommen von den sieben Threads.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › «Weg zum Ziel» öffnen, «Neuer Weg» tippen, «Rennen im Mai» mit einem Starttag in einigen Monaten anlegen.
2. Einen eigenen Schritt «Zug buchen» mit Tag schreiben, abhaken, löschen und «Rückgängig» tippen.
3. Den Starttag ändern: die Schritte mit «Tage vor dem Start» wandern mit, Schritte mit eigenem Tag bleiben.
