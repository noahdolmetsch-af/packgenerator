# Wege besser sichtbar (Pfeil und Name)

PR #… · 07.11.2026 · Auftrag: Noah «1a» (Entwurf «Wege besser sichtbar», Punkt 1, Thread «Absprünge: Analyse und Aktiv antippbar machen»)

## Was ist neu
- Eine Zahl oder Zeile, die weiterführt (Bausteine «Zahl mit Weg» und «Quelle-Zeile»), ist ruhig grün und unterstrichen. Der Pfeil ist dunkel und 16 px gross statt 12 px grau.
- Wirkt in der Analyse («Quelle: Fitbit ›») und auf den Velo-Karten (Kilometer, Kosten). Aktiv und Auswerten folgen in den PRs, in denen die Wege gebaut werden.

## Was fällt weg oder rutscht tiefer
- nichts. Gleiche Stellen, gleiche Grösse der Tippfläche (44 px), nur Farbe, Unterstrich und Pfeil.

## Selbst entschieden
- Farbe: die ruhige Akzentfarbe der App (`--accent`), nicht die orange Hervorhebung.
- Keine neue Funktion in `features.js`.

## Entscheide (für decisions.md)
- Eine antippbare Zahl sieht überall gleich aus: grün, unterstrichen, dunkler Pfeil (Noah «1a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Verbesserung 1 (Pfeil) gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Analyse › Ruhepuls: «Quelle: Fitbit ›» ist grün, unterstrichen, der Pfeil dunkel.
2. Velos: die Kilometer der Velo-Karte sehen so aus und öffnen weiter die Velo-Seite.
