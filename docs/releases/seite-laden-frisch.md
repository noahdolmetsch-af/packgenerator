# Seite lädt nach einem Update frisch

Fehlerbehebung · 30.10.2026 · Auftrag: Noah (Bilder vom Handy: «Hier ist etwas schiefgelaufen» auf «Touren», «Failed to fetch dynamically imported module … Ride-….js»)

## Was ist neu
- Fehlt beim Öffnen einer Seite ein App-Teil (nach einem Update ist der alte Name weg), lädt die App einmal frisch: alte Offline-Kopie weg, neue Adresse, Daten bleiben. Vorher: normales Neuladen, das die alte Kopie wieder beantworten konnte.
- Höchstens einmal pro Minute, nie während einer aufgezeichneten Fahrt (wie bisher).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Baut auf dem Neuladen-Weg von #454 auf (gleiche Funktion `freshReload`); keine Doppelarbeit. Ursache am echten Handy nicht geprüft.
- Kein News-Eintrag: nichts Sichtbares ausser, dass der Fehler seltener erscheint.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
