# Fix: eine Neuheiten-Datei für den Velos-Merge

PR (offen) · 24.11.2026 · Auftrag: Bündler, main war nach #1702 rot

## Was ist neu
- Nichts Sichtbares geändert, nur: #1702 kam als ein Merge mit zwei Neuheiten-Dateien an, dadurch bekamen beide dieselbe Version (0.1240.0) und `whatsnew.test` und `version-at-merge.test` wurden rot. Die Datei `velos-pflege-oben` ist in `velos-fahrtenbuch` aufgegangen (beide Punkte, alle deutschen Texte). Die Neuheit zeigt jetzt beide Änderungen unter einer Version.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Release- und Entscheid-Dateien beider Änderungen bleiben, sie zählen nicht für die Version.
- Lehre fürs nächste Mal: ein PR mit zwei Commits und je einer Neuheiten-Datei wird beim Zusammenfassen (Squash) zu einem Commit; deshalb nur EINE Neuheiten-Datei pro PR.

## Entscheide
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
