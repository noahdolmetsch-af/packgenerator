# Schneehinweis nur, wenn Schnee wahrscheinlich ist

PR #<Nummer> · 08.11.2026 · Auftrag: Noah «heute schnee möglich, obwohl es sonnig war und wir einen herrlichen milden 10 grad warmen tag hatten?» (Thread «Prüfen: Schnee bei dir möglich trotz mildem Tag»)

## Was ist neu
- Der rote Hinweis «Schnee bei dir möglich» (Heute und Wetter › «Heute») erscheint nur noch, wenn **in derselben Stunde** alles zutrifft: die Schneefallgrenze liegt auf deiner Höhe (Ort oder eigene Höhe, wie bisher mit 100 m Spielraum), Niederschlag ist zu erwarten (Regenchance ab 50 % oder 0,3 mm, die Regel des Wetterkerns) und die Temperatur beim Ort ist höchstens 2 °C.
- Der Hinweis nennt die Uhrzeit: «Schnee bei dir möglich ab 22 Uhr». Läuft die Stunde schon, steht er ohne Uhrzeit.
- Die Schneefallgrenze selbst und ihre Zeilen bleiben unverändert.

## Was fällt weg oder rutscht tiefer
- Der Hinweis an trockenen oder milden Tagen (kein Niederschlag oder über 2 °C) entfällt. Vorher erschien er schon, wenn die Grenze irgendwann bis Mitternacht tief genug sank.

## Ursache
Die Schneefallgrenze sagt nur, ab welcher Höhe Niederschlag als Schnee fiele. `lowHint` verglich sie bisher nur mit der Höhe des Ortes und schaute weder Niederschlag noch Temperatur an. Am 08.11.2026 (sonnig, 10 °C) sank die Grenze am späten Abend kurz auf 400 m bei einem Ort auf 410 m: Hinweis, obwohl es trocken blieb.

## Selbst entschieden
- 2 °C als Grenze für «kalt genug» (Schnee oder Schneeregen ist bei 2 m Höhe bis etwa 2 °C möglich). Fehlt die Temperatur in einer Stunde, blockiert das den Hinweis nicht.
- Eine Stunde ohne Niederschlag zählt nicht, auch wenn die Grenze sehr tief liegt.
- Der Text auf der Wetterseite sagt jetzt «Es ist Niederschlag zu erwarten, es ist kalt genug und die Grenze sinkt auf … m» (tiefste Grenze der Stunden, die zählen).
- Keine neue Funktion: kein Eintrag in `features.js`, `docs/app-stand.md` bekommt nur den Satz zum Hinweis.

## Entscheide (für decisions.md)
- 08.11.2026: «Schnee bei dir möglich» braucht Grenze auf Ortshöhe, Niederschlag und höchstens 2 °C in derselben Stunde.

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Fehlerkorrektur zur Schneefallgrenze, kein Planpunkt betroffen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. An einem trockenen Tag: Heute zeigt «Schneefallgrenze … m ü. M.» ohne roten Hinweis.
2. An einem Tag mit Schnee in der Vorhersage (Regen und 0–2 °C bei dir): roter Hinweis mit «ab … Uhr».
