# Sicherung prüfen

PR folgt · 02.11.2026 · Auftrag: Noah «1a danach 3 und 4» (Thread «Finden: Was wir übersehen haben»)

## Was ist neu
- Ich › Daten und Backup, oben in «Alles in Ordnung?»: neuer Knopf «Sicherung prüfen». Er liest eine Sicherungsdatei nur zum Anschauen und sagt «Diese Sicherung ist gut» mit Zahlen (Ausrüstung, Touren, Velos), oder was nicht stimmt (fremde Datei, leer, Einträge ohne ID, doppelte Einträge). Nichts wird eingelesen oder geändert (`src/lib/backupcheck.js`).
- Unter den Knöpfen eine ruhige Zeile: ob es eine zweite Kopie ausser Haus gibt. «Senden» zählt automatisch, sonst der Knopf «Habe ich gerade gemacht». Ab 30 Tagen heisst es «ist 30 Tage alt». Nur ein Hinweis, nie Pflicht.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Zweite Kopie: die App kann nicht sehen, wohin eine Datei gespeichert wird. Darum zählt «Senden» (Teilen-Menü) automatisch, alles andere bestätigt Noah mit einem Tipp.
- Passwort-gesicherte Dateien werden mit dem Passwort dieses Geräts geprüft; ohne passendes Passwort steht ein Hinweis.
- Kein neuer Eintrag in `PASST_HIER`: der Knopf sitzt oben auf der Seite, in «Alles in Ordnung?» (nicht im zugeklappten Teil, sonst schlägt der Heimat-Test an).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Lücken-Vorschläge 02.11.: Schritt 1 (Sicherung prüfen + zweite Kopie) gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup öffnen, oben «Alles in Ordnung?».
2. «Sicherung prüfen» tippen und eine Sicherungsdatei wählen: «Diese Sicherung ist gut».
3. Eine andere Datei (z. B. ein Foto) wählen: eine Meldung, nichts geändert.
