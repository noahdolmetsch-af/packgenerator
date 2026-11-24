# «Rückgängig» bleibt 8 Sekunden (Noah 23.11.2026, «1-5a», Entscheid 3a)

Prüfung «Aktionen in Auswerten»: Hinweise mit «Rückgängig» blieben nur 3,3 bis 3,5 s stehen (Regel «Ü4a»: 4 s, 15.10.2026), zu kurz, um den Hinweis zu lesen und zu entscheiden.

Entscheid: **8 Sekunden**, eine Konstante für alle (`UNDO_MS`, `src/lib/ui/undo.js`), und der Hinweis hält an, solange Maus oder Finger darauf sind oder er den Fokus hat.

Ersetzt: die Regel «Undo bleibt überall 4 Sekunden» (Ü4a, `docs/decisions.md`). Alles andere in «Löschen» (zuerst fragen, Rückgängig anbieten) bleibt bis zu Entscheid 4a (eigener PR).

Nachtrag 24.11.2026 (Entscheid 1a, «Jetzt nicht» bei den Tipps in «Ideen»): der Hinweis sagt «ruht 7 Tage» (der Brief nannte 30 Tage; im Code sind es 7 und das bleibt) und hat «Rückgängig». Die Zeit des Hinweises ist die eine Konstante `UNDO_MS`.

Nachtrag 24.11.2026 (Entscheid 2a, neue Frage in «Wi gaht's?»): nach dem Speichern sagt ein Hinweis, wann die Frage kommt («Frage gespeichert. Sie kommt täglich · 20:00.»), mit «Rückgängig» und «Ansehen» (springt zur Frage und hebt sie hervor).

Nachtrag 24.11.2026 (Entscheid 5a, «Stufen ändern» bei den Meilensteinen): der Knopf ist aus der Filterzeile weg; «Zahlen und Stufen ändern» am Seitenende (und die Adresse `?tune=1`) bleibt der Weg.
