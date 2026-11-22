# Wackel-Test «Wetter nach Höhe auf Heute» repariert

21.11.2026 · Auftrag: Noah «ja» zu «jeden Tag einen Wackel-Test an der Ursache reparieren» (Thread «Prüfungen so einrichten, dass main grün bleibt»)

## Was ist neu
- Nichts in der App; nur der Test `hoehe-heute.spec.js` ändert sich.
- Ursache: Der Test schaltete den Wetter-Ersatz (die erfundenen Luftschichten) erst ein, nachdem Heute schon geladen war. Heute fragt die Luftschichten nur einmal beim Zeichnen der Seite. Auf einem ausgelasteten Rechner kam die Frage manchmal vor dem Ersatz, und die Zeile «Temperaturen nach Höhe» erschien nie.
- Reparatur: Der Test gibt den Ersatz beim Start mit (`openHome(..., { weather: mock })`), vor dem ersten Laden von Heute. Nachgestellt unter Last (12 Läufe gleichzeitig): vorher 6 von 12 rot, nachher 12 von 12 grün.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Keine «Was ist neu»-Datei und keine Änderung in `app-stand.md`: nichts in der App ändert sich.
- Der Test wurde nicht gelockert: er prüft dieselben Zeilen und denselben Schalter wie vorher.
- `hoehe.spec.js` (Wetter-Seite) hat die Lücke nicht: es öffnet eine andere Seite, die ihre Daten erst dann holt.

## Prüfschritte (nach dem Merge)
1. In der Nachtprüfung steht «Wetter nach Höhe auf Heute» nicht mehr in der Wackel-Liste.
