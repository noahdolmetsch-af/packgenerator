# Heute in Bereichen

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «3a 4a» (26.10.2026) und «ok teil 3» (27.10.2026), Thread «Heute ruhiger»

## Was ist neu
- Heute zeigt die Kacheln ausserhalb des Bearbeitens in Bereichen mit Überschrift: Jetzt, Dein Körper, Deine Woche, Unterwegs und Velos, Schnell öffnen, Entdecken (`src/lib/home/sections.js`: `SECTIONS`, `SECTION_OF`, `sectionsOf`, `inAreas`). Innerhalb eines Bereichs gilt die Reihenfolge der Wand.
- Eine Karte, neben die die nächste nicht passt, füllt ihre Zeile bis zum Ende (`fillers`), damit keine Karte allein mit leerem Platz daneben steht.
- «Neu», «Schon probiert?» und «Tipp der Woche» stehen unter «Entdecken» nebeneinander.
- Schalter `homeSections` unter «Startseite anpassen» (Standard an). Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- nichts. Die Kacheln stehen nur in Bereichen gruppiert; im Bearbeiten bleibt die Wand wie bisher.

## Selbst entschieden
- Im Bearbeiten bleibt die Wand ohne Bereiche (Ziehen und Grössen wie bisher), ein Satz erklärt das.
- Die Bereiche lassen sich ausschalten (alles ist ein Vorschlag).
- «Was mir gut tut» steht in «Jetzt»; eine Kachel ohne festen Bereich geht nach ihrem Katalog-Bereich.
- «Gewicht diese Woche?» steht in «Jetzt» gleich unter der Tour-Karte, nicht in «Dein Körper»: so ist die Frage am Handy ohne langes Scrollen zu sehen (ein Test fand sie sonst erst nach fast 3 Bildschirmen).

## Entscheide (für decisions.md)
- 26.10.2026: Heute in Bereichen mit Überschrift, «Entdecken» nebeneinander (Noah «3a 4a»). Grund: Orientierung statt einer langen Kachelwand.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Heute ruhiger» (Ziel Alltag): mit Teil 3 fertig (Teil 1 0.219.0, Teil 2 0.233.0).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: über den Karten stehen die Überschriften Jetzt, Dein Körper, Deine Woche, Unterwegs und Velos, Schnell öffnen. Vorher war es eine lange Kachelwand.
2. Am Computer: keine Karte steht mehr allein mit leerem Platz daneben.
3. Ganz unten «Startseite anpassen»: der Schalter «Kacheln in Bereichen» schaltet die Überschriften aus und wieder ein.
