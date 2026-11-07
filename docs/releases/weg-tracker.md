# Weg zum Ziel: Schrittart «GPS-Tracker»

PR # · 07.11.2026 · Auftrag: Noah «a» (05.11.2026 20:35, Thread «Planen: GPS-Tracker im Weg»), Schrittart 5 von «Weg zum Ziel»

## Was ist neu
- Nichts Sichtbares. Es entsteht die Schrittart «GPS-Tracker» für «Weg zum Ziel», als Datei `src/lib/weg/types/tracker.js` und eine Zeile in `types/index.js`. Die Seite folgt als eigener PR (K2).
- Die Vorlage schlägt fünf Schritte vor, rückwärts vom Starttag gezählt: Tracker-Abo klären (42 Tage vorher: Preis, Enddatum, Konto), Tracker laden (21), kurze Testfahrt (14), Familie öffnet den Tracking-Link (12), Akku hält über 24 Stunden (10). Jeder Schritt ist umbenennbar, verschiebbar und löschbar wie alle Schritte; sie gelten für Rennen, Touren und freie Ziele (ein freies Ziel bekommt Tage, sobald es einen Start hat).
- Der Zugang (Login, Passwort) des Trackers wird nie gespeichert. Die Notiz des ersten Schritts sagt: Zugang im Passwortmanager.
- Jeder Schritt hat einen Absprung: Abo → Rennen, Laden und Akku → Strombudget, Testfahrt → Live-Karte, Familie → Vor der Abfahrt.
- Haken von selbst: nur das Abo, und nur wenn der Rennen-Papierkram «Tracker mieten oder laden» schon erledigt ist (die Seite reicht die Papierkram-Zeilen als `ctx.tracker.papers` weiter). Ob eine Testfahrt oder der Link geklappt hat, weiss die App nicht; diese Schritte hakt Noah von Hand ab.
- `tests/weg-tracker.test.js`: 10 Tests (fünf Schritte für jede Zielart, Tage rückwärts, Zeitlinie und Streifen, deutsche Texte, Absprünge, Haken von selbst, kein Zugang gespeichert). Deutsche Texte: `src/lib/i18n/de/weg-tracker.js`.

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche)

## Selbst entschieden
- Keine «Was ist neu»-Datei und keine Änderung in `docs/app-stand.md` und `features.js`: es gibt noch keine Seite, und die Zeile «Weg zum Ziel» gehört dem Seiten-Thread (K2). Fertig-Regel (Seite, Absprung von der Seite, Gut zu wissen, Leere Ansicht, Als Nächstes) kommt mit der Seite.
- Die Schritte tragen einen `key` (plan, charge, test, family, battery), den die Ablage mitspeichert; so wissen Absprung und Haken von selbst, welcher Schritt welcher ist, auch wenn Noah ihn umbenennt. Ein Schritt ohne `key` (ältere, aus einer Vorlage) hat keinen Absprung und wird von Hand abgehakt.
- Die Titel und Notizen werden beim Anlegen in der gerade gewählten Sprache gespeichert (über `t()`), wie die anderen Standardtexte.
- «Tracker laden» als «aufladen und einmal einschalten» verstanden.
- Kein Haken von selbst für Testfahrt, Familie und Akku: es gibt in der App keine Angabe, an der man das erkennen könnte, und ein falscher Haken wäre schlimmer als keiner.

## Entscheide (für decisions.md)
- keine neuen (05.11.2026 «a» steht schon im Entwurf).

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Weg zum Ziel»: Schrittart «GPS-Tracker» gebaut. Seite folgt (K2); `docs/vorhaben.md` und `docs/roadmap.md` ändern sich erst mit der Seite.

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).
