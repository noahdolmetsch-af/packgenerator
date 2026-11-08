# Pläne für Skitour, Wandern, Laufen, Kraft und Mobilität

PR folgt · 07.11.2026 · Auftrag: Noah «10 Pläne für Skitouren/Wandern/Kraft», «1-3 a» (Thread «Verbessern Training: intelligentere Wochenpläne»)

## Was ist neu
- Fünf Musterpläne unter Aktiv › Trainingspläne: «Skitour» (10 Wochen), «Wandern» (8), «Laufen 10 km» (8), «Kraft» (8), «Mobilität und Rumpf» (6, kurze Einheiten ab 15 Minuten).
- Ihre Einheiten kommen als Wandern, Laufen bzw. Sonstiges in den Wochenplan (bisher schrieben Pläne nur Velo-Einheiten): `kind` am Plan.
- **Termin statt Renntag:** Skitour, Wandern und Laufen fragen nach einem «Termin (z. B. Tourstart)»; die Auswahl der Rennen entfällt dort.
- **Pläne mischen:** Neben einem Plan in Gebrauch wählst du «Dazu nehmen (beide laufen)» (Voreinstellung) oder «Den anderen ersetzen». Jeder Plan schreibt und nimmt nur seine eigenen Einheiten heraus (`src` = `tpl:<id>`); die anderen Pläne in Gebrauch stehen in `training.tplMore`, unter «In Gebrauch» mit eigenem «Herausnehmen» (mit Rückgängig).

## Was fällt weg oder rutscht tiefer
- «Ausprobieren» ersetzt nicht mehr automatisch den Plan in Gebrauch; ersetzt wird nur auf Wunsch («Den anderen ersetzen»).

## Selbst entschieden
- Gleiche Wochenkurve wie bei den Velo-Plänen (steigend, jede vierte Woche leichter, Abbau am Ende); bei Terminplänen heisst das Ziel «Termin».
- Der Hauptplan bleibt `training.tpl`; zusätzliche Pläne liegen in `training.tplMore`. Verschiebt sich ein Rennen, folgt nur der Hauptplan.
- Geht der Hauptplan raus, rückt der nächste nach.
- Kraft hat drei feste Tage (Mo, Mi, Fr), Zone 3; Mobilität vier Tage.
- «Ausprobieren» liest den Stand aus der Datenbank, nicht aus der Anzeige, damit ein schneller Tipp den anderen Plan nicht überschreibt.
- Kein neuer Eintrag in features.js: die Pläne gehören zur Seite Trainingspläne (Text erweitert).

## Entscheide (für decisions.md)
- 07.11.2026: Ein Plan hat eine eigene Sportart (`kind`, sonst Velo) und kann ein Datum-Plan sein (`event`).
- 07.11.2026: Mehrere Pläne dürfen gleichzeitig laufen; jeder ist einzeln herausnehmbar.

## Stand im Plan (roadmap.md / vorhaben.md)
- Training verbessern: Punkt 10 (Pläne für weitere Sportarten, mischen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Trainingspläne: die neuen Pläne stehen nach den Velo-Plänen; «Skitour» fragt nach einem Termin.
2. Einen Plan «Ausprobieren», dann einen zweiten öffnen: «Dazu nehmen (beide laufen)» wählen, «Ausprobieren».
3. Zurück bei Trainingspläne: beide stehen unter «In Gebrauch»; «Herausnehmen» beim zweiten entfernt nur ihn.
