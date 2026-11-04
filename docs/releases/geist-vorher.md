# Geist vor der Fahrt wählen

PR #<offen> · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4b 5b» (Thread «Klären: Geisterfahrten im Frontend», Frage 4b)

## Was ist neu
- Auf der Live-Karte, vor dem Start: Kasten «Gegen wen fährst du heute?». Zur Wahl stehen deine letzte Fahrt auf dieser Tour (vorgewählt), bis zu fünf frühere und «Ohne Geist».
- Während der Fahrt heisst der Block «Gegen deinen Geist» (vorher «Gegen deine letzte Fahrt») und hat ein Auswahlfeld, um den Geist zu wechseln. Die Zeile nennt den Tag des Geists.
- Wer «Ohne Geist» wählt, sieht den Vergleich während der Fahrt nicht.

## Was fällt weg oder rutscht tiefer
- Der Titel «Gegen deine letzte Fahrt» heisst jetzt «Gegen deinen Geist». Ohne Auswahl bleibt es die letzte Fahrt, wie bisher.

## Selbst entschieden
- Nur in der App aufgezeichnete Fahrten können ein Geist sein. Strava-Fahrten haben hier keine gespeicherte Spur; sie als Geist zu nutzen wäre eine neue Speicherung (mit Prüfung der Backup-Kopie) und ein eigener Schritt.
- Die Wahl gilt nur für diese Fahrt und wird nicht gespeichert. Kein Schema und kein Backup-Format geändert.
- Fertig-Regel: Erweiterung einer vorhandenen Funktion («Gegen dich selbst», Live-Karte), Seite, Absprung und Wissen sind dort schon vorhanden.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Geist-Karte (Cockpit-Idee 4): Schritt 4 von 5 (Geist vor der Fahrt). Weiter: Hausrunde-Satz.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte mit einer Tour öffnen, die du schon in der App aufgezeichnet hast: Der Kasten «Gegen wen fährst du heute?» steht über «Während der Fahrt».
2. Eine frühere Fahrt wählen, starten: der Block «Gegen deinen Geist» nennt den Tag.
3. «Ohne Geist» wählen: der Vergleich bleibt weg.
