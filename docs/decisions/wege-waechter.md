# Navigation: erst messen, dann reparieren

23.11.2026 · Auftrag: Noah «ja» (Thread «Navigation ohne Sackgassen»; Punkte aus seiner Nachricht 06:36 und 06:38)

- Der Umbau der Navigation beginnt mit einem Wächter-Test, der jede Adresse öffnet (`tests/e2e/wege-waechter.spec.js`). Offene Fälle stehen in drei Listen im Test und dürfen nur kürzer werden. Grund: Parallel bauen andere Threads an Seiten; ohne Wächter entstehen während des Umbaus neue Sackgassen. Verworfen: erst alles reparieren und dann einen Wächter schreiben.
- Eine Quelle für Ort, Reiter und Pfad ist `src/lib/nav.js` (`pageOf`, `placeOf`, `tabOf`, `PLACE_TABS`). Die Seitenleiste und die Markierung lesen sie schon; der Pfad über der Seite soll sie künftig auch lesen und nicht von Hand schreiben.
- Die untere Leiste am Handy gibt es schon (`PlaceBar`: Heute, Woche, Touren, Velos und Material, Auswerten; «Ich» oben rechts). Sie wird nicht neu gebaut, nur verbessert, wo ein Ort fehlt (Wetter).
