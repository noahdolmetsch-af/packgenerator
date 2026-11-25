# Schreibweise-Vorschlag für eigene Regeltexte

PR #1773 · 25.11.2026 · Auftrag: Noah (Gesamttest, Entscheid-Karte: «Vorschlag beim Speichern von «Regel ändern»»)

## Was ist neu
- Speicherst du den Text einer Regel (die Frage einer Regel unter «Die App fragt dich» oder im Fenster «Regel ändern»), schlägt eine ruhige Zeile die Schreibweise vor: Satzanfang gross und «5 Std.» statt «5h».
- «Übernehmen» setzt den Vorschlag ein, «So lassen» blendet die Zeile aus. Sonst bleibt dein Text genau so, wie du ihn getippt hast; ein bestehender Text wird nie umgeschrieben und die Zeile erscheint nur nach dem Speichern, nicht beim Öffnen der Seite.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur diese zwei Dinge werden vorgeschlagen (Satzanfang, «5h» → «5 Std.»). Nach Kürzeln wie «Std.» oder «Min.» wird das nächste Wort nicht gross geschrieben.
- Die Zeile steht direkt unter dem Feld, nicht als Fenster, und braucht nur einen Tipp zum Wegschicken.

## Entscheide (eigene Datei `docs/decisions/wg-schreibweise.md`)
- 25.11.2026: Schreibweise nur als Vorschlag beim Speichern eigener Regeltexte.

## Stand im Plan (roadmap.md / vorhaben.md)
- Nichts geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wi gaht's? › «Die App fragt dich»: bei einer Regel ins Feld «Die Frage» «warum hast du weniger als 5h geschlafen?» schreiben und das Feld verlassen.
2. Eine Zeile «Vorschlag zur Schreibweise: Warum hast du weniger als 5 Std. geschlafen?» erscheint; «Übernehmen» ersetzt den Text, «So lassen» blendet die Zeile aus.
