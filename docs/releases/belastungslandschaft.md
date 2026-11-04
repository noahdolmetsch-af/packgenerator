# Belastungslandschaft: vergangene Tage und geplante Einheiten

PR #<offen> · 03.11.2026 · Auftrag: Noah «Ich möchte alle 1-7 Ideen umsetzen» (Thread «Umsetzen: Sieben Cockpit-Ideen», Idee 1)

## Was ist neu
- Auf **Aktiv › Form und Erholung** steht unter «Über die Zeit» die neue Karte **«Belastungslandschaft»**: deine letzten 8 Wochen als Landschaft. Der hintere Hügel ist die Fitness, der vordere die Müdigkeit, die dünnen Grate sind die Tagesbelastungen.
- **Geplante Einheiten** aus Training führen die Landschaft 2 Wochen nach rechts weiter, als **gestrichelte, hellere Schätzung** (aus Minuten und Zone).
- Ein Schalter **«Landschaft / Kurven»** zeigt dieselben Tage als genaue Kurven mit Achse (Fitness, Müdigkeit, Tagesbelastung).
- Antippen, Fahren mit der Maus oder ← → (Bild auf/ab: eine Woche) geht durch die Tage. Oben die Zahlen des Tages (Fitness, Müdigkeit, Form, Belastung), unten **seine einzelnen Einheiten**: gemachte als Link zur Fahrt, geplante mit «geplant» und geschätzter Belastung.
- Ohne Plan sagt die Karte, wie man ihn anlegt (Link zu Training). Ohne Aktivitäten steht ein Hinweis, wann die Landschaft kommt.

## Was fällt weg oder rutscht tiefer
- nichts. Das Diagramm «Über die Zeit» bleibt, die neue Karte steht darunter; «Tour-Bereitschaft» rutscht eine Karte nach unten.

## Selbst entschieden
- **Geplante Belastung ist eine Schätzung, nie gemessen:** eine geplante Einheit zählt wie eine Fahrt in der Mitte ihrer Zone (Z1 0,5 · Z2 0,65 · Z3 0,83 · Z4 0,98 · Z5 1,12 der FTP), Belastung = Intensität² × Stunden × 100 (dieselbe Formel wie bei Fahrten mit Leistungsmesser). Ohne Zone gilt Z2. Die Karte sagt es.
- **Heute zählt nur, was du gemacht hast:** erst ab morgen geht der Plan in die Zahlen ein. So zeigen alle Tage bis heute genau die Zahlen von «Über die Zeit» (Regel aus UI-Test T3).
- Erledigte geplante Einheiten (Fahrt der gleichen Art am Tag, oder von Hand «gemacht») zählen nicht doppelt.
- Feste Spanne: 8 Wochen zurück, 2 Wochen voraus (kein Zeitraum-Schalter in dieser Karte).
- Ein Diagramm, eine Achse (Belastungspunkte): Fitness, Müdigkeit und Tagesbelastung teilen sich die Skala; «Form» steht in der Zeile des Tages.
- Kein Schema- und kein Backup-Format geändert: der Plan wird nur gelesen (Einstellung `training.plan`).
- Fertig-Regel: Seite ja (Karte auf «Form und Erholung»); Absprung: Link zu Training für den Plan und Links zu den Fahrten; leerer Zustand ja (ohne Plan, ohne Aktivitäten); «Gut zu wissen» und «Als Nächstes» entfallen (Erweiterung einer Seite).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Cockpit-Ideen (`notes/ideen-cockpit-2026-11-03`): Idee 1 gebaut. Weiter: 2 «Was wäre, wenn» baut auf den geplanten Belastungen dieser Karte auf.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Form und Erholung öffnen, zu «Belastungslandschaft» scrollen.
2. Auf einen Tag tippen oder ← → drücken: oben die Zahlen, unten die Einheiten dieses Tages.
3. Im Training eine Einheit für nächste Woche planen: sie erscheint rechts als gestrichelte Schätzung. «Kurven» antippen für die genauen Linien.
