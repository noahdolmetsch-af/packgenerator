# Pfad aus einer Quelle: der Pfad passt zur Seitenleiste

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «ja» (Thread «Navigation ohne Sackgassen»)

## Was ist neu
- Der Anfang des Pfads über einer Seite kommt jetzt aus der einen Karte der App (`src/lib/nav.js`: `pageOf`, `placeOf`, `tabOf`), die auch die Seitenleiste markiert. Neu: `src/lib/nav/wege.js` (rein, getestet in `tests/wege.test.js`) und `src/lib/nav/wege.svelte.js` (Namen wie in der Seitenleiste, mit deinen Umbenennungen aus «Anpassen»).
- Die vier Köpfe, die einen Pfad zeichnen (`PathHead`, `Crumbs`, `Crumb` in Aktiv, `VeloHead`), setzen vor ihre Schritte den Ort und den Reiter der Karte. Von den Schritten, die eine Seite selbst mitgibt, bleiben nur die, die im selben Ort liegen und selbst kein Ort und kein Reiter sind (ein Velo, eine Tour, eine Woche).
- Behoben, was der Wege-Wächter fand: alle **46** Seiten mit falschem Pfad. Beispiele: Woche › Training › Erholung (vorher «Aktiv › Erholung»), Auswerten › Körper › Zusammenhänge (vorher «Ich › Daten › Zusammenhänge»), Velos und Material › Material › Favoriten (vorher «Material › Favoriten»), Auswerten › Körper › Körperwerte (vorher «Aktiv › Körperwerte»).
- `PFAD_OFFEN` im Wege-Wächter ist jetzt leer; ein neuer falscher Pfad macht den Test rot.

## Was fällt weg oder rutscht tiefer
- Der alte Name «Aktiv» im Pfad (Aktiv ist seit 21.11. Teil von «Woche»). Jeder Schritt war vorher ein Link und ist es noch.
- Auf dem Handy zeigt `Crumb` weiter nur den letzten Schritt davor; das ist jetzt bei Trainings-Seiten der Reiter statt «Aktiv».

## Selbst entschieden
- Schritte aus einem anderen Ort fallen weg (z. B. «Ich › Daten» über den Zusammenhängen): Ein Pfad beginnt mit dem Ort der Seite, die Seite kann nicht zwei Orten gehören. «Zurück zu Heute» (Herkunft) bleibt, es ist kein Pfadschritt.
- Ort und Reiter mit gleichem Namen stehen nicht doppelt («Woche › Woche»).
- Nicht angefasst: `PathLine` (zeichnet schon aus der Karte), `TripBand` und die zehn Pfade, die direkt in Seiten stehen (Touren, stimmen schon). Sie ziehen später nach, wenn eine Seite sowieso umgebaut wird.
- Keine Daten, kein Backup, kein `api/`.

## Entscheide
- Keine eigene Datei: Fortsetzung von `docs/decisions/wege-waechter.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Navigation ohne Sackgassen: Schritt 2 (Pfad aus einer Quelle) mit diesem PR. Folgt: Zurück und Scroll-Position, «Weiter zu …».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Woche › Training › Erholung öffnen: über dem Titel steht «Woche › Training», nicht «Aktiv».
2. Auswerten › Körper › Zusammenhänge: der Pfad beginnt mit «Auswerten › Körper», nicht mit «Ich › Daten».
3. Velos und Material › Material › Favoriten: der Pfad beginnt mit «Velos und Material › Material».
