# App schöner: Farbe pro Bereich, Leiter, leere Zustände, Bewegung, Zahlen, Icons

24.11.2026 · Auftrag: Noah «nur 1-6» und «1b 2a 3a 4a 5a» (Thread «App mit impeccable schöner machen»)

- **Farbe pro Bereich (1b):** jeder Bereich hat wieder seine Farbe; «+ Neu», gewählte Chips, der Strich unter dem Reiter und die Hauptknöpfe folgen ihr. Das **ersetzt «Salbei statt Farbe pro Ort» vom 20.10.2026** (UI-Grundlagen). Werte (weiss auf Farbe mindestens 5,4:1): Heute Salbei `#4a7360`, Woche ocker `#7a5c14`, Touren terrakotta `#a64b2a`, Velos und Material blau `#2f6690`, Auswerten pflaume `#6a4f93`, Wetter himmel `#2a6f8c`. Ausschaltbar: Ich › Darstellung › Bedienung › «Farbe pro Bereich» (`areacolor`). Verworfen: nur «+ Neu» färben (b ohne Hauptknöpfe).
- **Feinschliff (2a):** Ecken-Leiter 4·8·12·16·Pille (`--r-1…--r-4`, `--r-pill`), drei Schatten (`--shadow-1…3`), Wächter-Regeln `radius`, `shadow` und `upper` nur mit Grundlinie (keine Massenersetzung der Ecken und Schatten). Sichtbare Fehler wurden gleich behoben: ein Pin-Knopf (ein gesetzter Pin trägt die Bereichsfarbe, am Handy kleiner und ohne Schatten), Versalien-Überschriften weg (118 Stellen in 104 Dateien; Versalien nur noch für Einheiten).
- **Leere Zustände (3a):** `Empty size="klein"` (ein Satz und ein Knopf) für die ersten rund 40 Stellen; zuerst die Sackgassen in Aktiv, Rückblick, Training und Heute-Kacheln.
- **Bewegung (4a):** Dauer-Werte 120/200/320 ms (`--t-fast`, `--t-base`, `--t-sheet`), Momente: Haken wächst kurz, eine erledigte oder gelöschte Zeile klappt weg, Aufklappen gleitet. Alles steht still bei «Bewegung: Aus» und bei reduzierter Bewegung.
- **Zahlen und Icons (5a):** Diagramm-Hauptfarbe folgt der Bereichsfarbe; `Stat` (`src/lib/ui/Stat.svelte`) ist der eine Zahlenstil; Icon-Grössen 14/16/20/24 mit Strich 2; Wetter hat ein eigenes Symbol (Wolke mit Sonne); ✓ ★ ✕ stehen als Icons.
- Nicht in dieser Runde (Noah): Tippflächen am Handy (7), neue Teile (8).
