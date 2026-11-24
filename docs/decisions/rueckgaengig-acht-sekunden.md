# «Rückgängig» bleibt 8 Sekunden (Noah 23.11.2026, «1-5a», Entscheid 3a)

Prüfung «Aktionen in Auswerten»: Hinweise mit «Rückgängig» blieben nur 3,3 bis 3,5 s stehen (Regel «Ü4a»: 4 s, 15.10.2026), zu kurz, um den Hinweis zu lesen und zu entscheiden.

Entscheid: **8 Sekunden**, eine Konstante für alle (`UNDO_MS`, `src/lib/ui/undo.js`), und der Hinweis hält an, solange Maus oder Finger darauf sind oder er den Fokus hat.

Ersetzt: die Regel «Undo bleibt überall 4 Sekunden» (Ü4a, `docs/decisions.md`). Alles andere in «Löschen» (zuerst fragen, Rückgängig anbieten) bleibt bis zu Entscheid 4a (eigener PR).
