# Herausforderungen mit Ende

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N5

## Was ist neu
- Touren › Träume: neuer Teil «Herausforderungen mit Ende» (`src/lib/neuland/NeulandGoals.svelte`, Fenster `GoalSheet.svelte`, Logik `src/lib/neuland/ziele.js`).
- Ein eigenes Neuland-Ziel mit Enddatum, zwei Arten:
  - «Neue»: z. B. 5 neue Gemeinden bis Ende Monat. Es zählt, was ab heute zum ersten Mal erreicht wird.
  - «Alle»: z. B. alle Seen im Kanton Zürich bis Ende Jahr. Es zählt alles davon, je erreicht. Der Kanton ist freiwillig (Gemeinden, Pässe, Hütten, Gipfel, Seen).
- Drei fertige Vorschläge zum Antippen, dazu «Eigene Herausforderung». Jede Sammlung geht, auch eigene.
- Jede Zeile zeigt «2 von 5 · noch 12 Tage» und einen Balken. Geschafft: Haken und «Geschafft am …», einmal eine kurze Meldung. Abgelaufen: «Zeit abgelaufen seit …», mit dem Stift verlängerbar.
- Ändern und Löschen im Fenster (Löschen fragt und bietet Rückgängig). Ein eigener Name ist möglich.
- Speicher: Einstellung `neuland.goals` (im Backup). Neue Funktion im Katalog: `f.nlgoals`.

## Was fällt weg oder rutscht tiefer
- Träume: «Rennen zum Planen», «Gesammelt» und «Tourarten» rücken unter den neuen Teil.

## Selbst entschieden
- Die App zählt aus Neuland (Routen, Fahrten, eigene Haken), auch wenn die Sammlung dort ausgeschaltet ist.
- Eine Änderung von Sammlung oder Art startet das Zählen ab heute neu; eine geschaffte bleibt geschafft, solange Zahl und Kanton gleich bleiben.
- Die Vorschläge nehmen den Heimkanton aus Neuland (sonst den Kanton des Wohnorts, sonst Zürich).
- Kein Stern in der Vitrine (das bleibt bei den Sport-Herausforderungen); eine Fundliste kommt mit N10.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 3 von 20 (N5). Als Nächstes N2 «Neuland-Runde».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume öffnen und zu «Herausforderungen mit Ende» scrollen.
2. «5 neue Gemeinden diesen Monat» antippen, «Herausforderung starten»: die Zeile zeigt «0 von 5» und die Tage bis Monatsende.
3. Den Stift antippen, «Löschen»: die Zeile geht, «Rückgängig» holt sie zurück.
