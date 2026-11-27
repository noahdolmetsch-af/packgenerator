# Verbessern-Knopf: Platz unten auf jeder Seite

27.11.2026 · Auftrag: Noahs Test von «Frag Gemini» (Samsung A56, 27.11. 00:29): der schwebende Knopf «Verbessern» deckte den ersten Dienst-Knopf zu; Koordinator: «eigenes Paket, nach 1821», Regel «Nie abgeschnitten» (24.11.)

- Solange der Knopf schwebt, setzt `Improve.svelte` das Merkmal `data-improve-fab` an `html`; dann hat der Hauptteil (`main`) unten 48 px (Handy) oder 72 px (Computer) Platz. Das gilt für jede Seite gleich, ohne dass eine Seite etwas wissen muss.
- Verworfen: Platz am `body` (macht die Seitenleiste am Computer kürzer, ein weisser Streifen unter ihr); Platz in `App.svelte` (gemeinsamer Teil, löst alle Wächter aus, und der Platz würde auch bleiben, wenn Noah den Knopf ausblendet); nur die Gemini-Seite zu ändern (andere Seiten haben dasselbe Loch, Heute und Ich am Handy gemessen).
- Der Wächter `tests/e2e/verbessern-platz.spec.js` misst auf sechs Seiten, dass die tiefste sichtbare Zeile über dem Knopf liegt.
