# Wochenstand: Draussen und Meditation

PR #? · 24.11.2026 · Auftrag: Noah «1-3» (Vorschlag 3 von 3, Thread «Challenges nach Gelegenheit bauen»)

## Was ist neu
- Auf der Wochenkarte (Heute, Sonntag 17 Uhr bis Montag 12 Uhr) steht unter «In Bewegung an … Tagen» eine ruhige Zeile: **«Draussen an 5 von 7 Tagen · Meditation an 3 Tagen»**.
- «Draussen» zählt die Tage der Woche, an denen die Challenge ihr Tagesziel erreicht hat (Strava und von Hand zusammen, wie die Karte «Draussen»); «von 7» zählt nur die Tage, die die Challenge in dieser Woche schon galt (Start am Mittwoch: «von 5»). «Meditation» zählt die Tage mit mindestens einer Sitzung.
- Reine Rechnung `weekStand` in `src/lib/home/wochenstand.js` (Test `tests/wochenstand.test.js`), kein neues Datenformat.

## Was fällt weg oder rutscht tiefer
Nichts. Eine Zeile kommt dazu; ohne Challenge und ohne Meditation fehlt sie.

## Selbst entschieden
- Nur zum Anschauen, nie eine Wertung (kein «gut» oder «zu wenig»).
- Die Zeile steht innerhalb der Wochenkarte, nicht als neuer Block (Content first); die Karte erscheint ohnehin nur Sonntagabend und Montagvormittag.
- Eine beendete Challenge (Knopf «Beenden») zählt nicht mehr in der Zeile; ihre Tage bleiben in der Karte «Draussen» sichtbar.

## Entscheide
Noah «1-3» (alle drei Vorschläge bauen), siehe `docs/decisions/tipp-minuten.md`.

## Stand im Plan
- Vorschlag 3 von 3 gebaut (Tipp → Minuten, bestes Fenster heute, Wochenstand).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Sonntagabend (ab 17 Uhr) Heute öffnen: die Wochenkarte zeigt die Zeile.
2. Mit deiner Woche vergleichen: Tage mit genug Minuten draussen, Tage mit einer Meditation.
