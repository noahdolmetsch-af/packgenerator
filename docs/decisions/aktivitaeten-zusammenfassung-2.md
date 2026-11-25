# Aktivitäten-Zusammenfassung, Teil 2

25.11.2026 · Auftrag: Noah «a» (Thread «App doppelt so schnell machen»), Teil 1 online seit 25.11.2026

- Alle Listen, die nie eine Rohkurve brauchen und nichts zurückschreiben, lesen `readLite` (rund 50 Stellen, mit einem Skript umgestellt und mit einem Spion über 168 Adressen und 46 Seiten einzelner Fahrten mit Noahs Daten geprüft). Gründe: ein Leser, der eine Rohkurve verlangt, bekäme `undefined` ohne Fehler, darum entscheidet der Spion und ein Text-Test, nicht das Gefühl.
- Auf der vollen Tabelle bleiben bewusst: die Seite einer Fahrt (`TrainingAct`), Live und «Nach der Fahrt» (Runden), Tour (Fotos), Vorschläge (Höhenprofil), Gipfelbuch (Profil) und alles, was schreibt (Strava-Abruf, Tour bearbeiten, Haken setzen, Heatmap-Nachtrag).
- `liteTable` zählt vor jedem Lesen beide Tabellen (zwei Zählungen, keine Zeilen). Weichen die Zahlen ab (eine Zeile kam an der App vorbei hinein, zum Beispiel von einem älteren Tab oder von einem Test, der direkt in IndexedDB schreibt), antwortet die volle Tabelle und die kleine wird nach einer Sekunde neu gebaut. So ist eine veraltete Antwort nie möglich.
