# Weg zum Ziel: Erholung (K5)

PR # · 07.11.2026 · Auftrag: Noah «4e» (Erholungsschritte aus Aktiv › Erholung), Thread «Entwerfen Weg zum grossen Ziel»

## Was ist neu
- Neue Schrittart **Erholung** (`src/lib/weg/types/erholung.js`): vier Schritte für die letzte Woche vor dem Start: «Schlaf: drei Nächte früh ins Bett» (6 Tage vorher, führt zu den Routinen), «Dehnen und Ausrollen» (4 Tage, führt zu Aktiv › Erholung), «Essen: Vorräte für die Fahrt» (3 Tage), «Velo-Check ein letztes Mal» (2 Tage, führt zu den Velos).
- Gleiche vier Vorschläge für Rennen, Tour und freies Ziel.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nichts hakt sich von selbst ab (`auto` ist immer null): Die App weiss nicht, wie du geschlafen hast oder ob die Vorräte da sind.
- Die Schritte stehen in der Zeitlinie unter «Letzte zwei Wochen», ohne eigenen Streifen (die Zeitlinie zeigt sie schon; ein zweiter Streifen wäre doppelt). Falls Noah den Streifen aus dem Entwurf G6 doch will, ist das ein eigener kleiner PR.
- Nichts wird gespeichert; kein Eingriff in Datenhaltung oder Backup. «Gut zu wissen» entfällt (Seite ohne Karte «Was du hier tun kannst»).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G: «4e» gebaut; als Nächstes Wetterfenster (4a), Rückblick (5a/5e/5c).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Weg zum Ziel › «Neuer Weg»: Schritte der Erholung angehakt lassen, anlegen.
2. In «Letzte zwei Wochen» stehen vier Schritte in der Woche vor dem Starttag.
3. Bei «Dehnen und Ausrollen» auf «Öffnen» tippen: Aktiv › Erholung öffnet sich.
