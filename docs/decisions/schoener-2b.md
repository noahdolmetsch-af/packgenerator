# App schöner, Runde 2b: Icon-Leiter und Zahlenstil

24.11.2026 · Auftrag: Noah «1-7 alle, zuerst 1-4» (Thread «App mit impeccable schöner machen»), baut auf `docs/decisions/schoener-1-6.md` auf

- **Icon-Leiter 14·16·20·24, Strich 2 (2,5 beim Haken)** (Noah «5a» aus Runde 1): 18 px wird 20 px; Test `tests/icons.test.js`. Verworfen: 18 px zu 16 px (zu klein in Kacheln und Überschriften).
- **Zeichen im Markup werden Icons** (✓ ★ ✗ 🚩 🎉); Zeichen in Übersetzungstexten bleiben.
- **`Stat` ist der Zahlenstil** auch in Woche; Bereitschaft-Ring in Statusfarbe, nie in der Bereichsfarbe.
- **Knopf-Formen Touren:** ein Hauptknopf, Nebenaktionen als ruhige Text-Links; ein externer Link bekommt den Pfeil (Tour aus komoot).
