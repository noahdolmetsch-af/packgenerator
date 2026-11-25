# Heute: «n Dinge dran» springt zur Liste; kleine Knöpfe leichter zu treffen

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «4a» und «1a» (Warteliste 2, Durchklick-Funde 4 und 1)

## Was ist neu
- **Fund 4a (beim Zusammenführen mit main 23.11.: Die gleiche Funktion kam inzwischen mit dem Haken-Block (#1616); dessen Version gilt, meine eigene Umsetzung ist weg, nur der Sprung geschieht sofort statt weich (ein Bild später noch einmal), weil nachladende Karten darüber den Sprung sonst neben die Überschrift enden lassen, der Test `heute-dinge-springt.spec.js` prüft weiter beide Seiten):** Der Satz «Heute sind 8 Dinge dran.» unter dem Gruss ist tippbar (mit «↓») und springt zur Liste «Jetzt dran». Nur die Zeile wird tippbar; die ersten drei Dinge direkt darunter kommen nicht (Noah «4a»).
- **Fund 1:** Auf dem Handy (Touch) bekommen Chips (`a.chip`), «Überspringen» (`button.skip`), «Mehr» (`button.more`) und die Info-Punkte (`button.idot`) eine unsichtbare Tippfläche von 44 px, wie schon `.tap` und die Zurück-Zeile. Das Aussehen und der Computer mit Maus bleiben gleich.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Fund 4b (eine Karte «Meine Tour» mit Packstand) ist schon online (`tour-karte-eine`); hier nichts mehr zu tun.
- Der Sprung scrollt sofort (nicht weich), weil Karten darüber noch nachladen und ein weiches Scrollen sonst daneben landet.
- Fund 1, Rest: `summary` in Analyse und die Textlinks im Fliesstext bleiben für einen späteren PR (dort ändert eine Fläche den Fluss des Textes). Das Wächter-Test-Skript mit Ausnahmeliste liegt nicht im Repo; `tests/tippflaechen-css.test.js` hält fest, dass die Liste der Auswahl nur wachsen darf.

## Entscheide (eigene Datei `docs/decisions/durchklick-1-4.md`)
- 22.11.2026: Noah «1a 2a 3a 4a 5a» – Verweis.

## Stand im Plan
- Warteliste 2 (Durchklick): Fund 1 (CSS) und 4 gebaut; Fund 2 und 3 folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen, unter dem Gruss «Heute sind n Dinge dran ↓» antippen: die Seite springt zu «Jetzt dran».
2. Am Handy knapp neben einen kleinen Chip tippen: er öffnet sich trotzdem.
3. Am Computer sieht alles aus wie vorher.

Keine Datenänderung.
