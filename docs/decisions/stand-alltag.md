# Dein Stand in Zahlen auf Alltag

25.11.2026 · Auftrag: Noah (Entscheid-Karte «Welcher Bereich als Nächstes?»: «Alltag»), Thread «Mini-Landingpage pro Bereich bauen»

- Zweiter Bereich nach Velos und Material: **Alltag** (Reiter «Alltag» im Ort Woche, `#/me/alltag`). Eigener PR, mit Bildern vor dem Merge, wie bei Velos.
- «Alltag» hat keine einzelne Kennzahl wie die Kilometer. Gewählt: die drei Dinge, die dort wirklich laufen und gleichzeitig Fortschritt oder Handlungsbedarf zeigen: **Tage in Folge draussen** (die Challenge «Draussen», dieselbe Zählung wie die Karte auf Heute), **offene Punkte der Einkaufsliste**, **Tage bis zur nächsten Frist** eines Vertrags. Darunter der Verlauf der Minuten draussen pro Tag (letzte 14 Tage), solange die Challenge läuft.
- Verträge zeigen nur Tage, nie einen Betrag (Bildschirmfotos und Berichte bleiben frei von Beträgen).
- Wie bei Velos: eine Karte für alle (`StandZahlen.svelte`), je Bereich ein Rechenteil (`src/lib/stand/alltag.js`) und eine Hülle (`StandAlltag.svelte`); derselbe Schalter und dasselbe «Ausblenden» mit Rückgängig.
