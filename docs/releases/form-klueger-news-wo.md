# Form und Erholung: News-Zeilen finden ihren Ort

PR #(folgt) · 23.11.2026 · Auftrag: Bündler «Mein Überblick» (Fix nach dem Merge von #1518, Thread «Form und Erholung klüger machen»)

Der Test «Was ist neu» springt zum genauen Ort lief bei einem anderen PR komplett und fand bei den Zeilen der News von «Form und Erholung, klarer» keinen Ort, weil die Elemente ohne Daten fehlen.

## Was ist neu
- Die vier Zeilen mit einem Ziel in `src/lib/news/form-klueger.js` bekommen eine «wo»-Zeile (Steht ganz oben / direkt unter der Antwort / weiter unten, sobald Strava-Aktivitäten da sind), mit deutschem Text. Die Schritte bleiben.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur die News-Datei geändert, nichts gelockert. Geprüft mit `NEWS_ONLY=form-klueger.js` und `NEWS_ONLY=heute-passt-angleichen.js` (ausprobieren.spec, Handy).
- Keine Datenänderung, kein Backup, kein api/. Kein Entscheid, daher keine Datei in `docs/decisions/`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu: bei «Form und Erholung, klarer» führt «Ausprobieren» zur Seite; ohne Daten steht die «wo»-Zeile.
