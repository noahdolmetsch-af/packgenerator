# «Zuletzt gelöscht» für Training und Ferien

Auftrag: Noah «1a» (23.11.2026, Thread «Zuletzt gelöscht und weitere Bausteine»), Folge von `docs/releases/papierkorb-todos-mein-tag.md`; Koordinator: «Training und Ferien auch anschliessen, passt zu «nichts darf wegfallen»»

## Was ist neu
- Eine Trainingseinheit, die du aus dem Plan weglässt (Woche › «Weglassen», Woche planen › «X»), und ein gelöschter Aufenthalt in «Ferien und Abwesenheit» warten 30 Tage unter Ich › Daten › «Zuletzt gelöscht» (neue Art «Woche» im Filter).
- «Zurück» bringt eine Einheit in `training.plan` zurück; ein Aufenthalt kommt mit den Einträgen zurück, die er in der Woche gemacht hat (Packliste, Velo-Service; `pack:<id>`).
- Ferien löschen hatte kein «Rückgängig»; jetzt hat es das (wie alles andere) und «Zuletzt gelöscht».
- Technik: ein Papierkorb-Eintrag kann mehrere Stücke aus Listen in Einstellungen halten (`parts`); `path` sagt, unter welchem Namen die Liste im Eintrag liegt (`training.plan` ist `{ sessions: [...] }`). Tabelle `trash` und Sicherung ändern sich nicht.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Bei «Woche planen › X» (Einheit weglassen) kommt jetzt «Rückgängig» dazu; vorher gab es keins.
- Alles andere an der Woche (Wetter-Verschieben, Vorschläge «Nie vorschlagen») bleibt, wie es ist: das sind keine Löschungen von Daten.
- Keine Änderung an Speicher oder Sicherung.

## Entscheide (eigene Datei `docs/decisions/papierkorb-training-ferien.md`)
- 24.11.2026: Training und Ferien kommen in «Zuletzt gelöscht».

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Woche › Ferien und Abwesenheit: einen Aufenthalt eintragen, öffnen, löschen: «Rückgängig» erscheint.
2. Ich › Daten › «Zuletzt gelöscht»: er steht dort unter «Woche».
3. «Zurück» tippen: er ist wieder in der Liste.
