# Wochenrückblick: Verlauf über 8 Wochen

PR folgt · 02.11.2026 · Auftrag: Noah «1a 2b 3a» (Thread «Verbessern Wochenrückblick: Fehler und mehr Daten», Runde 2, PR 1 von 3)

## Was ist neu
- Unter jeder Kachel (Körper, Pulszonen, Velo-km, Wetter) und unter den Sätzen «Gut gelaufen · gefehlt» (Schlaf, Reihe, Stunden, Z1–Z2) steht «Verlauf und alle Zahlen».
- Die Seite `#/flow/review/tile?k=…&w=…` zeigt die gewählte Woche gegen die 7 Wochen davor: Balken mit jedem Wert, Tabelle (jede Woche antippbar), «So wurde gezählt», Link zu Analyse. Jede Woche zählt die gleichen Tage wie die gezeigte Woche.
- Werte: Ruhepuls, HRV, Schlaf, Schritte, Aktivzonenminuten, Anteil Z1–Z2, Velo-km, Tageshöchstwert, Regen, Stunden, Schlafbewertung, Trainingstage in Folge.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Highlights («Längste Aktivität» usw.) öffnen schon die Aktivität selbst; sie bekommen keine zweite Seite.
- Der Satz «geplante Einheiten» hat keinen Verlauf (er ist eine Zählung der Woche, kein Wert über Wochen).
- Wochen ohne Wert bleiben leer («–»), nie 0.

## Entscheide (für decisions.md)
- 02.11.2026: Detailseiten für alle Kacheln und Sätze (Noah «1a»), Verlauf 8 Wochen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Wochenrückblick Runde 2: PR 1 von 3 (PR 2 neue Daten, PR 3 Ältere Wochen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Woche › Wochenrückblick, bei «Körper diese Woche» unter «Ruhepuls» auf «Verlauf und alle Zahlen» tippen.
2. 8 Balken mit Werten, Tabelle, «So wurde gezählt»; in der Tabelle eine Woche antippen öffnet diese Woche.
3. Bei einem Satz unter «Gut gelaufen · gefehlt» das gleiche prüfen.
