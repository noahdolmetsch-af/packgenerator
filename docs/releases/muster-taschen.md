# Muster-Taschen im Muster-Rennen

Auftrag: Noah «1-5a» (23.11.2026, Frage 4a), Station 3 des Rundgangs der Stärken. Ziele: Klarheit und Auffindbarkeit.

## Was ist neu
- Das Muster-Rennen hat drei **gezeichnete Beispiel-Taschen** (Satteltasche, Rahmentasche, Lenkerrolle) im Rennmodus-Kasten «Was liegt wo?»: Name, Etikett «Beispiel», Inhalt und Gewicht stehen im Bild. Keine echten Fotos.
- Station 3 des Rundgangs der Stärken («Welche Tasche …?») zeigt diesen Kasten.
- Wer das Muster-Rennen schon hatte, bekommt die Taschen beim nächsten Start des Rundgangs. «Muster zurücksetzen» stellt sie wieder her, «Muster löschen» nimmt sie mit weg (mit Rückgängig).

## Was fällt weg oder rutscht tiefer
- Nichts. Der Kasten «Was liegt wo?» sagt im Muster-Rennen nicht mehr «Noch kein Taschen-Foto», sondern zeigt die drei Beispiele.

## Selbst entschieden
- Die Bilder sind gezeichnete SVG in `db.photos` (Feld `bagShot`, `sample`), keine neuen Teile oder Taschen in deinem Material; deine echten Daten bleiben unberührt.
- Ein eigenes Foto derselben Tasche geht immer vor (die gezeichneten tragen ein sehr altes Datum).
- Die Packliste des Muster-Rennens bleibt leer: Dafür bräuchte es Beispiel-Teile in deinem Material. Das ist ein eigener Schritt, falls gewünscht.
- Der Test «Taschen-Fotos» in `bagshot.spec.js` erwartete einen leeren Kasten im Muster-Rennen; er erwartet jetzt die drei Beispiele (Änderung mit Absicht).

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 23.11.2026: Muster-Taschen gezeichnet statt echter Fotos (Noah «1-5a», Frage 4a): `docs/decisions/muster-taschen.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Rundgang der Stärken: Schritt 2 (Muster-Taschen) fertig; «So sieht's aus» folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rennen › Muster-Rennen › Unterwegs: der Kasten «Was liegt wo?» hat drei Taschen.
2. Ein Tipp öffnet das gezeichnete Bild mit Name, Inhalt und Gewicht.
3. «Muster löschen»: die Taschen sind weg; deine eigenen Fotos bleiben.
