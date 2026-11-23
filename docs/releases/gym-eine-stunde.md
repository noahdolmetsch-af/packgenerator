# Gym zählt eine Stunde

Auftrag: Noah «1a 2a 3 gym normalfall 1h sonst a 4b 5a» (22.11.2026, Thread «Alle Sportarten und Erholung»)

## Was ist neu
- Der Standardwert für einen Gym-Haken ohne Minuten ist 1 Stunde (vorher 20 Minuten für eGym). Er steht unter Aktiv › Meine Aktivitäten › Übliche Dauer als «60 Min. (Standard)» und zählt mit «ca.» in Sportjahr, Wochenkarte und Wochenrückblick.
- Wer für Gym einen eigenen Wert eingestellt hat, behält ihn. Die Laufband-Regel (20 Minuten) bleibt vor Gym.

## Was fällt weg oder rutscht tiefer
- Der Standardwert 20 Minuten für Gym entfällt. Gym-Haken ohne Minuten zählen mit «ca.» mehr: 14 Haken sind dann ca. 14 Std. statt ca. 4:40 Std. Nichts wird gespeichert oder umgeschrieben; die Zahl entsteht beim Lesen.

## Selbst entschieden
- Keine Schema- oder Backup-Änderung: der Wert steht nur im Programm (`STANDARD_RULES` in `src/lib/flow/usualmin.js`). Trotzdem ändert sich eine Zahl, die Noah sieht (Gym-Stunden), darum nennt der PR es und wartet auf Noahs Ok.
- Wo die Uhr eine echte Dauer kennt, bietet «Dauer nachtragen» sie als Tipp an (im PR «Rhythmus und Vergleiche»).

## Entscheide (eigene Datei `docs/decisions/gym-eine-stunde.md`)
- 22.11.2026: Gym-Normalfall 1 Stunde.

## Stand im Plan (roadmap.md / vorhaben.md)
- Alle Sportarten und Erholung: Gym 1 h erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Aktivitäten › Übliche Dauer: Gym zeigt «60 Min. (Standard)».
2. Sportjahr: Gym-Einheiten ohne Minuten zählen mit «ca.» je eine Stunde.
