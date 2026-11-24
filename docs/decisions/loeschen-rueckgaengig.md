# Löschen: Rückgängig genügt bei Schnellem, die Rückfrage bleibt bei Dingen mit Verlauf (Noah 23.11.2026, «4a»)

Quelle: Noah 23.11.2026 19:49 «1-5a», Entscheid 4a der Prüfung «Aktionen in Auswerten» (`/mnt/project-files/notes/fragen-bereich-2026-11-23/auswerten-aktionen/`).

## Befund
Die Regel in `CLAUDE.md` sagte: «Löschen fragt zuerst und bietet Rückgängig.» Gelebt wurde etwas anderes: Phase, eigene Idee und Gewicht löschen sofort mit «Rückgängig» (und der Hinweis blieb nur 4 s). Das ist bewusst nicht still übergangen, sondern hier geändert.

## Neue Regel
- **Schnell wieder anlegbar** (Idee, Lebensphase, Gewicht, ein Ort in einer Liste, ein Foto im Album, ein Schritt in einer Saisonliste): sofort weg, Hinweis mit «Rückgängig» für **8 Sekunden** (`UNDO_MS`, PR «Rückgängig 8 s»), der Hinweis pausiert beim Daraufzeigen.
- **Dinge mit Verlauf** (eine Frage mit Antworten, ein Bereich mit Inhalt, ein Velo, eine Tour): ein Fenster der App fragt zuerst (`askDelete`, bei Gruppen `GroupDeleteSheet`: wohin der Inhalt geht, «Ohne Gruppe» vorgewählt), danach «Rückgängig» (`deleteWithUndo`).
- `confirm()` bleibt verboten. Im Zweifel fragen.

## Einordnung der Stellen in Auswerten und «Wi gaht's?» (Stand 24.11.2026)
Keine Stelle löscht ohne Rückfrage **und** ohne Rückgängig; keine muss deshalb geändert werden.
- Fragen (eigene und der Liste), Regeln, Bereiche in «Wi gaht's?» (`Abfragen.svelte`): fragen zuerst (Fenster), danach Rückgängig. ✔ Verlauf geschützt.
- «Eigene Ideen» (`Ideen`), Gewicht (`Weight.svelte`), Lebensphasen, Neuland-Einträge, Saison-Punkte und Album-Fotos (`Wohl.svelte`): sofort weg, «Rückgängig» 8 s. ✔ Schnell Anlegbares.
- Orte im Gipfelbuch (`Gipfelbuch.svelte`): sofort weg, die Zeile «… entfernt · Rückgängig» bleibt bis zur nächsten Aktion stehen (nicht zeitgebunden). Ein Ort hat Besuche (leichter Verlauf), darum bleibt es bei dieser längeren Rückgängig-Zeit; kein Fenster nötig.
- Gelernt (`LearningSheet`): fragt zuerst, danach Rückgängig. ✔

Offen gelassen: Stellen ausserhalb von Auswerten und «Wi gaht's?» werden nicht umgebaut; sie folgen der neuen Regel, wenn sie ohnehin angefasst werden.
