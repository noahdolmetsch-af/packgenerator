# Aktivzonenminuten gegen das eigene Normal

Auftrag: Noah «1a 2a 3 gym normalfall 1h sonst a 4b 5a» (22.11.2026, Thread «Alle Sportarten und Erholung», Schritt K); «alles freigegeben» 23.11.2026

## Was ist neu
- Im Wochenrückblick, Karte «Körper diese Woche», steht bei den Aktivzonenminuten: «Dein Normal: 98 Min. pro Woche (Median aus 5 Wochen)» und, wenn die Uhr ein Jahr zurückreicht, «Dieselbe Woche vor einem Jahr: …».
- Das Normal ist der Median der Wochen davor (bis zu 52, nur Wochen mit mindestens 4 Tagen Werten, Pausenwochen ausgenommen). Ab 4 Wochen.
- Der Richtwert der Uhr (150 pro Woche, oder dein eigener Wert) steht nur als Zeile «Nur zur Orientierung», nie als Ziel.
- Rein lesend (`azmNormal` in `src/lib/weekmore.js`), keine neue Einstellung.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Median statt Mittel: einzelne sehr starke Wochen ziehen das Normal nicht hoch.
- Eine laufende Woche wird mit demselben Wochentagsstück vor einem Jahr verglichen (bis und mit heute).
- Wochen mit weniger als 4 Tagen Werten (halb synchronisiert) zählen nicht fürs Normal.

## Entscheide (eigene Datei `docs/decisions/zonenminuten-normal.md`)
- 22.11.2026: Aktivzonenminuten gegen das eigene Normal (Median je Woche) und das Vorjahr, Richtwert nur als Zeile.

## Stand im Plan (roadmap.md / vorhaben.md)
- Alle Sportarten und Erholung: K erledigt; L folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wochenrückblick › Körper diese Woche › Aktivzonenminuten: eine Zeile «Dein Normal: … Min. pro Woche» und «Nur zur Orientierung: …».
2. Eine frühere Woche als Pause markieren: das Normal ändert sich entsprechend.
