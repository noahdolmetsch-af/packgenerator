# Fenster-Test mit vier Uhrzeiten läuft jede Nacht mit

25.11.2026 01:44 · Auftrag: Noah, Knopf «Ja, jede Nacht mitlaufen» (Thread «Gesamttest der ganzen App»); Regeln dazu: Noah «ja» 24.11.2026 23:40

- Der Fenster-Test (`tests/e2e/gesamttest/fenster-zeit.spec.js`) gehört zum nächtlichen Gesamttest: das Fenster «Wi gaht's?» und die Fenster hinter «Neu», Suche, «?» und «Verbessern» werden zu vier Uhrzeiten (07:30, 12:30, 19:15, 23:30) und in vier Grössen (Laptop 1440×800, Laptop 1366×768, Handy 390, Handy 320) geöffnet, bis unten gescrollt und auf Lage, erreichbare Knöpfe und Texte geprüft.
- Er läuft nur nachts (Gesamttest-Auftrag in `volle-pruefung.yml`), nicht im PR (`E2E_SKIP_GESAMTTEST`).
- Grund: Noahs Bild «Wi gaht's? am Abend» zeigte ein abgeschnittenes Fenster am Laptop 1440×800, das kein Test gesehen hatte (Regel «Nie abgeschnitten», Block 1).
