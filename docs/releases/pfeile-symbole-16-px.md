# Schmale Handys: Pfeile in «Listen und Typen» und Symbole im Touren-Plan wieder 16 px

PR #PRNR · 25.11.2026 · Auftrag: main reparieren (Bündler, Vorrang; guard «layout group 2» und «group 3» auf dem Handy waren rot seit PR 1733)

## Was ist neu
- Die Pfeile («›») der Zeilen in «Listen und Typen» (4 Stellen in `src/pages/Lists.svelte`) und die Symbole vor «Sport pro Tag», «Unklare Stellen» und «Grenzübertritt» im Touren-Plan (`src/lib/tourplan/TourPrep.svelte`) sind 16 px statt 20 px gross. Die 16 px stehen auf der Leiter der Symbolgrössen (14 · 16 · 20 · 24).
- Grund: «App schöner, Runde 2b» (PR 1733) hat diese Symbole von 18 auf 20 px gebracht. Bei 320 px Breite brachen dadurch «Kategorien» und «Grenzübertritt» auf eine zweite Zeile, und der Wächter-Test «Nie abgeschnitten» (guard) wurde rot. Gemessen bei 320 px: «Kategorien» steht in einer Zeile, «Grenzübertritt» passt.
- Kaum sichtbar: die Zeichen sind wenige Pixel kleiner; deshalb kein Bild und keine Neuigkeit.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Keine Neuigkeits-Datei, kein Bild: nichts Sichtbares von Belang (Bündler-Auftrag lässt das zu). Falls Noah doch Bilder will, folgen sie nach.
- Der Patch stammt vom Thread «App schöner» (er hat die Breiten bei 320 px gemessen); dieser Thread hat ihn nur als PR geöffnet und geprüft: guard (Handy, alle 8 Gruppen), `lists.spec.js` und `touren-a2.spec.js` grün, Unit-Tests 10770 grün.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Handy 320 px: «Ich» › «Listen und Typen»: «Kategorien» steht in einer Zeile.
2. Tour › Planen: «Grenzübertritt» steht in einer Zeile.
