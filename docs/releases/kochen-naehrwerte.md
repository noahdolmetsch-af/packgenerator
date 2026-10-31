# Nährwerte (Kochen)

PR #(folgt) · 29.10.2026 · Auftrag: Noah «4a», «ok kochen» (Thread «Einfache Kochrezepte und Mahlzeiten-Tipps»), Schritt 4 von 4

## Was ist neu
- Ein Rezept zeigt «Pro Portion (ungefähr)»: Energie in kcal, Kohlenhydrate, Eiweiss und Fett in Gramm. Die Werte gelten für eine Portion und ändern sich nicht mit den gewählten Portionen.
- Die Liste «Alle Rezepte» und die Tipps des Tages zeigen die kcal jedes Rezepts.
- Berechnet wird offline aus den Zutaten (`src/lib/kochen/naehrwerte.js`): für jede der 128 Zutaten gerundete Richtwerte pro 100 g und das Gewicht der Einheit (ein Ei, ein Esslöffel, eine Handvoll).

## Was fällt weg oder rutscht tiefer
- nichts. In der Liste steht pro Zeile ein Stück mehr («420 kcal»).

## Selbst entschieden
- Die Werte sind nicht aus der Schweizer Nährwertdatenbank kopiert, sondern gerundete Richtwerte aus allgemeinem Wissen, von Hand für die App geschrieben; darum steht überall «ungefähr». Ein genauerer Abgleich mit der Datenbank bleibt möglich (nur die Tabelle ändert sich).
- Eigene Rezepte aus Freie Zeit zeigen keine Werte (sie haben keine Mengen); fehlt eine Zutat in der Tabelle, steht kein Wert da, die App rät nicht.
- Zwei Rezepte wurden angepasst, damit eine Portion nicht zu gross wird (weniger Rahm bei den Tortellini). Ein Test prüft, dass jede Portion zwischen 100 und 1100 kcal liegt und dass die Gramm zu den kcal passen.
- Bezug zum Training (Aktiv) bleibt ein späterer Schritt.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Kochen (Ziel 5 Alltag): Schritt 4 von 4 gebaut. Später: Bezug zum Training, Link zur Suche im Online-Shop.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Alltag › Kochen › «Overnight Oats mit Banane»: «Pro Portion (ungefähr)» zeigt kcal, Kohlenhydrate, Eiweiss und Fett.
2. «+» für 2 Portionen tippen: die Werte bleiben gleich.
3. In der Liste zeigt jedes Rezept seine kcal.
