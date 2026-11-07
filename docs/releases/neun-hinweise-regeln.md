# Neun Hinweise «Du könntest jetzt …» (Regeln)

PR #… · 07.11.2026 · Auftrag: Noah «das ebenfalls» (die neun Hinweise der UI-Prüfung, Rang 12–20) und «können wir hier schon etwas vorbereiten» (Thread «Absprünge in der ganzen App umsetzen»)

Dieser PR ändert nichts, was man in der App sieht. Er legt nur das Regelbuch der neun Hinweise bereit. Die Karte auf Heute, die sie zeigt, kommt erst nach den offenen Heute-PRs und der Karte «Meine Tour».

## Was ist neu
- `src/lib/hinweise/regeln.js` (rein, getestet, ohne Datenbank und Uhr): `hinweise(c, today, state, notForMe, max)` gibt höchstens drei Hinweise zurück. Die Seite übergibt, was sie weiss (`c`) und den Tag.
- Die neun Hinweise, jeder mit Auslöser, Wegen und Status («neu», «zum Teil da», «gibt es schon»): Packliste ans Wetter (Tour in 1 bis 3 Tagen, Regen, Teil fehlt), Ruhetag (zwei harte Tage, ein freier Tag), Fahrt einplanen (Wochenziel offen, freies trockenes Fenster), Fahrt einer Tour zuordnen (Strava-Fahrt ohne Tour am Tourtag), mehr Pause einplanen (ab drei Touren), heute locker (drei harte Tage), Ruhepuls ansehen (vier Tage über der eigenen Bandbreite), Kette vor der Tour wechseln (Verschleiss gegen Tourlänge), Fitbit verbinden (nutzt die Regel aus #1134, falls sie dort schon steht).
- «Heute nicht» und «Diese Woche nicht» (`putAway`), dauerhaft ausschalten (`switchOff`), «Nicht für mich» (`notForMe`).
- Deutsche Texte `src/lib/i18n/de/hinweise.js`, Test `tests/hinweise.test.js` mit erfundenen Daten.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Jeder Hinweis ist ein Vorschlag mit Weg zum Ort, an dem man es tun kann, und lässt sich wegschieben.
- Gesundheit nur als Beobachtung: «heute locker» und «Ruhepuls» stehen immer zuletzt, mit «Beobachtung, keine Ursache» beziehungsweise «Nur ein Hinweis», nie als Befehl.
- Die Tage stehen als Datum in den Parametern; die Karte schreibt den Wochentag in der Sprache der Person.
- Schwellen (zum Beispiel 3 Touren, 10 Minuten, 4 Tage) stehen im Code und im Test, damit sie leicht zu ändern sind.
- Keine «Was ist neu»-Datei und keine Funktion in `features.js`, weil noch nichts Sichtbares entsteht.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Rang 12–20 (Hinweise) als Regelbuch vorbereitet, die Karte auf Heute folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts Sichtbares: die App sieht aus wie vorher.
