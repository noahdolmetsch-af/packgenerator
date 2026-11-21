# Ganze Wochen merken

PR folgt · 07.11.2026 · Auftrag: Noah «PR 11 Ganze Wochen merken», Antworten «1a 2a 3a 4a» (Thread «Verbessern Training: intelligentere Wochenpläne»)

## Was ist neu
- **Woche merken:** Bei jeder Woche mit Einheiten steht «Woche merken» (Name, Gruppe). Gemerkt werden Wochentag, Name, Art, Sportart, Minuten und Zone; keine Daten, kein «erledigt».
- **Meine Wochen:** Liste mit Einheiten und Stunden. «Einsetzen» zeigt die Woche, dann «Zu meinen Einheiten hinzufügen» (vorgewählt) oder «Meine Einheiten ersetzen» (entfernt nur Einheiten dieser Woche, die nicht erledigt sind). Beides mit Rückgängig.
- **Verwalten:** Umbenennen, eigene Gruppen (umbenennen, löschen mit «Ohne Gruppe» vorgewählt), Pfeile und Ziehen, Entfernen mit Rückgängig. Höchstens 20 Wochen (Einstellung `training.weeks`, wandert mit dem Backup).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- «Meine Wochen» steht in der Karte «Woche planen» direkt unter den Tagen, also bei der Woche und beim Wochenvorschlag (3a).
- Leere Zustände: «Noch keine Woche gemerkt …»; bei 20 Wochen steht ein Hinweis statt des Knopfs.
- Kein eigener Eintrag in features.js: gehört zur Seite Training.

## Entscheide (für decisions.md)
- 07.11.2026: Gemerkte Wochen sind Vorlagen ohne Datum; Ersetzen entfernt nur nicht erledigte Einheiten der Woche.

## Stand im Plan (roadmap.md / vorhaben.md)
- Training verbessern: Punkt 11 (Ganze Wochen merken).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training: zwei, drei Einheiten planen, «Woche merken», Namen geben, «Merken».
2. Andere Woche, «Meine Wochen › Einsetzen»: Woche ansehen, «Zu meinen Einheiten hinzufügen»; «Rückgängig» nimmt sie heraus.
3. «Meine Wochen verwalten»: Gruppe anlegen, umbenennen, löschen, Woche entfernen und zurückholen.
