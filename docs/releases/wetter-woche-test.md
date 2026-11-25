# Test «Wetter-Woche»: nur die Tage zählen

Nichts Sichtbares geändert, nur ein Test. Auftrag: Bündler 25.11.2026 (der Test `vorschlaege.spec.js` «weather light on every tour …» war auf vollen Läufen rot).

## Was ist neu
- Der Test zählt die sieben Tage der Wetter-Woche jetzt mit `ul.wxweek li`. Vorher zählte er alle `li` im Abschnitt, und der Abschnitt hat unter den Tagen noch die drei Startzeiten (`[data-vs-wx-starts]`), also zehn statt sieben, sobald die Stundendaten geladen waren.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur der Selektor im Test wurde enger gemacht; die Seite bleibt, wie sie ist.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.
