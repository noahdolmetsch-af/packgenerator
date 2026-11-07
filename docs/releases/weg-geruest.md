# Weg zum Ziel: Gerüst (K1)

PR # · 07.11.2026 · Auftrag: Noah «1b 2b 3a 4a 5a» und «1d 2b 3a 4e 5a+e+c» (Thread «Entwerfen Weg zum grossen Ziel»)

## Was ist neu
- Nichts Sichtbares. Es entsteht das Gerüst für «Weg zum Ziel»: ein grosses Ziel mit Starttag, von dem die App Schritte rückwärts zählt.
- `src/lib/weg/weg.js`: Ablage (Einstellungs-Eintrag `weg`, im Backup und im Abgleich wie jeder Eintrag, keine neue Tabelle, keine neue Dexie-Version), Ziele und Schritte (umbenennen, löschen, ordnen, abhaken, eigene Tage, eigene Schritte), Zeitlinie, Fortschritt, «Reicht die Zeit?» (Puffer), Abhaken von selbst, Heute-Zeile, Vorlage aus einem Weg.
- `src/lib/weg/types/`: die Schnittstelle für Schrittarten. Je Art eine Datei und eine Zeile in `index.js`. Vorerst nur «Eigener Schritt».
- `tests/weg.test.js`: 16 Tests, darunter der Durchlauf Backup-Datei → zurückspielen (ersetzen und zusammenführen) und der Import eines alten Backups ohne den Eintrag.

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche)

## Selbst entschieden
- Keine «Was ist neu»-Datei und keine Zeile in `docs/app-stand.md` und `features.js`: es gibt noch keine Seite. Fertig-Regel (Seite, Absprung, Gut zu wissen, Leere Ansicht, Als Nächstes, App-Stand) kommt mit der Seite im nächsten PR.
- Die Ablage ist an einer Kopie geprüft (Test «Backup-Kopie»): der Eintrag geht in die Datei und zurück, ein altes Backup ohne ihn lässt die Liste leer.
- Ziel-Arten heissen `race`, `trip`, `free` (Rennen, Tour, frei). Ein freies Ziel ohne Starttag hat Schritte ohne Tag, bis ein Start gesetzt ist.
- Ein vom Nutzer abgewählter Haken wird nie wieder von selbst gesetzt; ein Haken von selbst wird nie zurückgenommen.

## Entscheide (für decisions.md)
- 05.11.2026: Der Weg bekommt eine eigene Seite unter Touren mit eigener Ablage, auch freie Ziele, Standardschritte, Wetterfenster ab 7 Tagen, ruhiger Vorschlag bei Rückstand (Noah «1b 2b 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Rückwärts-Plan zu einem grossen Ziel»: Gerüst gebaut, Seite und Schrittarten folgen als kleine PRs. `docs/vorhaben.md` und `docs/roadmap.md` ändern sich erst mit der Seite.

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).
