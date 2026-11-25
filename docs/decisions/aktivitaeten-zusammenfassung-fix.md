# Aktivitäten-Zusammenfassung, Korrektur

25.11.2026 · Auftrag: Noah «a» (Thread «App doppelt so schnell machen»)

- Die Zählung beider Tabellen vor jedem Lesen (aus Teil 2, PR 1760) wird zurückgenommen. Grund: das Zählen von `activities` liest einen Speicher von 36 MB und kostete Sekunden, wenn eine Seite zwanzigmal fragt (Heute am Handy, 4× gebremst: Inhalt nach 9–11 s statt 2–4 s, Touren 5 s statt 1 s; gemessen mit Noahs Backup in drei Bauvarianten). Die Zählung steht weiter einmal beim Start (`startLite`).
- Regel für künftige Änderungen an `liteTable`/`readLite`: sie läuft bei jedem Lesen jeder Liste; sie darf nichts tun, was `activities` anfasst (kein `count`, kein Lesen). Neue Sicherungen gehören in den Start oder in die Nachführung.
- Bleibt: das Warten mit `Dexie.Promise` (liveQuery merkt spätere Speichern); es kostet nichts.
