# Hinweise, die zuhören

PR folgt · 21.11.2026 · Auftrag: Noah «1a 2b 3a 4a 5a» (Thread «Ideen für bessere App und Inhalte sammeln»), Vorschlag S5 «Hinweise lernen aus dem Wegtippen».

## Was ist neu
- Schickst du einen Hinweis an drei verschiedenen Tagen innerhalb von zwei Wochen mit «Nicht heute» weg, fragt die App **einmal** an der Stelle des Hinweises: «Diesen Hinweis leiser stellen?» Mit «Ja, leiser» wird die Art ausgeschaltet (Rückgängig 4 Sekunden, und der Text sagt, wo sie wieder eingeschaltet wird), mit «So lassen» fragt die App 60 Tage nicht mehr.
- Gilt für zwei Arten: die Ruhetag-Zeile in Aktiv (schaltet «Leistungstipps» aus) und die Fahrt über dem Nebel auf Heute.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur zwei Arten zum Start (Ruhetag, Sonnen-Ausfahrt), weil sie ein klares «Nicht heute» haben. Faustregel und «Wetter gedreht» haben keines; sie kommen dazu, wenn sie eines bekommen.
- Der zweite Teil des Vorschlags («oft angetippte Hinweise stehen weiter oben») ist **nicht** gebaut: Er würde die Reihenfolge der Seite je nach Verhalten ändern. Das wäre eine eigene Frage an dich.
- Die App schaltet nie von selbst etwas aus, auch nicht nach dem Fragen ohne deinen Tipp.
- Speicherung: eine neue Einstellung `hintSkips` (nur die letzten 10 Tage je Art). Kein Schema-Wechsel; sie kommt ins Backup wie jede Einstellung.

## Entscheide (für decisions.md)
- 21.11.2026: «4a» Hinweise lernen aus dem Wegtippen (siehe route-erfahrung.md).

## Stand im Plan (roadmap.md / vorhaben.md)
- Klügere App: S5 gebaut (PR offen), nächste S1, S6, S4.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Schicke die Ruhetag-Zeile oder die Fahrt über dem Nebel an drei Tagen mit «Nicht heute» weg.
2. Am dritten Tag erscheint «Diesen Hinweis leiser stellen?»: «Ja, leiser» ausprobieren, dann «Rückgängig».
