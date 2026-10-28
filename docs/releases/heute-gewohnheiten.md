# Deine Gewohnheiten oben auf Heute

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1a 2a und b 3b» (27.10.2026), Thread «Heute ruhiger»

## Warum
Noah fragte, warum oben auf Heute genau die Meditation steht. Die Karte kam am 14.10.2026 (HN4 «ME1», «Meditation, dann Tageskarte, dann Tourkarte») und am 21.10.2026 für alle nach oben (P6 «Heute ergänzen», «2b»). Sie nahm fest die Meditation; wählen ging nicht.

## Was ist neu
- Die Karte oben zeigt bis zu drei Gewohnheiten, die man wählt (3b): Aktivitäten aus Aktiv (2a) oder Punkte aus «Das tut mir gut» (2b), untereinander (`src/lib/home/HabitCards.svelte`).
- Gewählt wird im Fenster «Welche Gewohnheiten oben auf Heute?» (`HabitsSheet.svelte`), geöffnet mit dem Stift auf der Karte oder unter «Startseite anpassen» (1a). Reihenfolge mit Pfeilen und Ziehen, «✕» nimmt eine weg, Schliessen bietet Rückgängig an.
- Meditation behält ihre Karte (startet die Sitzung). Andere Aktivitäten: «Abhaken» (derselbe Haken wie in Aktiv, zweiter Tipp nimmt zurück) und «Mit Stoppuhr». Punkte aus «Das tut mir gut»: «Abhaken» für heute (`HabitCard.svelte`).
- Gespeichert in der Einstellung `homeHabits` (`[{ kind, id }]`, `src/lib/home/habits.js`). Kein Schema-Wechsel; das Backup nimmt die Einstellung mit.

## Was fällt weg oder rutscht tiefer
- nichts. Ohne Wahl zeigt die Karte die Meditation wie bisher.

## Selbst entschieden
- Eine gelöschte oder pausierte Aktivität und ein gelöschter Punkt fallen still aus der Karte; ist nichts mehr übrig, steht dort ein kurzer Hinweis mit «Gewohnheiten wählen».
- Die Kachel heisst im Katalog weiter «Meditation», damit bestehende Wände und Tests gleich bleiben.
- Abhaken einer Aktivität trägt das Tagesziel ein wie ein Tipp in Aktiv; Dauer und Ort gibt es über «Mit Stoppuhr».
- Test «Daumen-Zone» (Material am Handy) misst jetzt erneut, bis die Seite fertig gewachsen ist; vorher mass er manchmal, während die Liste noch lud (gleiche Prüfung, nur ohne Wackeln).

## Entscheide (für decisions.md)
- 27.10.2026: Hauptkarte oben auf Heute wählbar: Stift auf der Karte und «Startseite anpassen» (1a), Aktivitäten aus Aktiv und Punkte aus «Das tut mir gut» (2a+b), bis zu drei (3b).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Heute ruhiger» (Ziel Alltag): Teil der persönlichen Startseite.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen, Stift auf der Meditationskarte tippen: «Welche Gewohnheiten oben auf Heute?» geht auf.
2. Eine Aktivität (z. B. Dehnen) und einen Punkt aus «Das tut mir gut» hinzufügen, «Fertig»: oben stehen drei Karten.
3. Bei der neuen Karte «Abhaken» tippen: der Punkt von heute wird grün, ein zweiter Tipp nimmt ihn zurück.
