# Bessere To-dos und Notizen

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «f1-f3, n1-n3 alle. in einem PR. bilder vorher» (Thread «Verbessern: To-Dos und Notizen»)

Ausgangspunkt war die Analyse im Thread (Bericht mit Vergleich Things, Todoist, Apple Notes, Obsidian, Notion). Noah wählte alle sechs Vorschläge und ausdrücklich **einen** PR (das ersetzt hier die Regel «kleine PRs, keine Bündel»).

## Was ist neu
- **F1 Eingabe-Zeile:** Oben in Planen › Merken steht eine Zeile «Neues To-do …». Schreiben, Enter, fertig. Darunter Heute, Morgen, Wochenende und «Mehr …» (öffnet das ganze Fenster, schon ausgefüllt). «Ein To-do hinzufügen» bleibt darunter.
- **N1 Datum in Alltagssprache** (`src/lib/merken/parse.js`): «Kette ölen morgen 18 Uhr, jeden Sonntag» → Text, Datum, Erinnerung, Wiederholung. Reine Regeln, deutsch und englisch, keine KI. Die gefundenen Teile stehen als Knöpfe unter der Zeile und lassen sich weglassen. Dasselbe gilt im Fenster «To-do» und im Feld «Neu».
- **F2 Wischen und Verschieben:** am Handy To-do nach rechts = erledigt, nach links = morgen (je mit Rückgängig). «Sortieren» zeigt Pfeile und Griff zum Ziehen; die Reihenfolge gilt innerhalb der Gruppe (`todo.pos`).
- **N2 Schritte** (`merken/steps.js`): ein To-do kann Schritte haben (hinzufügen, umbenennen, löschen, mit Pfeilen und Griff sortieren). Die Liste zeigt «3 von 6» und einen Balken; Schritte lassen sich direkt abhaken. Ein wiederkehrendes To-do startet seine Schritte neu.
- **N3 Gehört zu** (`merken/links.js`, `LinkedTodos.svelte`): ein To-do kann zu Tour, Velo oder Notiz gehören. Die Tour (Packen), das Velo (Velos) und die Notiz zeigen ihre offenen To-dos mit Haken und Schritten.
- **F3 Eine Suche, Notiz daneben:** Merken hat ein Suchfeld über To-dos (samt Schritten und Zuordnung) und Notizen; die Notizen-Suche findet auch To-dos. Am Computer (ab 1100 px) öffnet sich eine Notiz **neben** der Liste statt als Fenster darüber.

## Was fällt weg oder rutscht tiefer
- Am Computer (ab 1100 px) öffnet eine Notiz nicht mehr als dunkles Fenster über der Liste, sondern rechts neben ihr (altes Verhalten: unverändert am Handy und in schmalen Fenstern).
- «Ein To-do hinzufügen» (das Fenster) steht jetzt unter der Eingabe-Zeile; der Knopf ist noch da.
- Sonst nichts.

## Selbst entschieden
- Keine Änderung am Datenformat der Datenbank: `steps`, `links` und `pos` sind neue, freiwillige Felder am To-do (Einstellungs-Eintrag `merken`), alte Backups bleiben lesbar.
- Reihenfolge von Hand (`pos`) steht vor «nach Datum»; ein To-do, das auf morgen geschoben wird, verliert seine Handplatzierung.
- Wischen gibt es nur am Handy (Touch), wie bei den Notizen; am Computer stehen «Sortieren» und das Fenster zur Verfügung.
- Die Verknüpfung zeigt Tour/Velo/Notiz nur dort an, wo es offene To-dos gibt (kein leerer Kasten).
- «Wochen» sind in «in 2 Wochen» 14 Tage, «in 1 Monat» 30 Tage (nur Vorschlag, im Fenster änderbar).
- Weggelassen nach der Fertig-Regel: kein neuer «Passt hier»-Absprung (die Funktionen leben auf Merken, Pack, Velos und Notizen selbst).

## Entscheide (für decisions.md)
- 05.11.2026: To-dos und Notizen: alle sechs Ideen (F1–F3, N1–N3) in einem PR, auf Noahs ausdrücklichen Wunsch.

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «Eine App, die mich im Alltag unterstützt»: To-dos schneller erfassen, verbinden und finden. Keine Plan-Dateien geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Merken: «Kette ölen morgen 18 Uhr, jeden Sonntag» in die obere Zeile schreiben; «Morgen», «18:00», «Jede Woche» erscheinen; «Hinzufügen».
2. Das To-do öffnen, zwei Schritte und unter «Gehört zu» eine Tour wählen, speichern: «0 von 2 erledigt» steht in der Liste, die Tour zeigt das To-do.
3. «Sortieren» antippen und ein To-do mit den Pfeilen verschieben; am Handy ein To-do nach links wischen.
4. Am Computer eine Notiz öffnen: sie erscheint rechts neben der Liste.
