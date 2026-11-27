# Die Seite steht im Pfad nur einmal

27.11.2026 · Auftrag: Noah (Knopf im impeccable-Lauf vom 26.11., Fund F-10; 27.11. «gerne normal einreihen»)

- Trägt der letzte Schritt des Pfads über dem Titel denselben Namen wie die Seite selbst («Auswerten › Verlauf › Wi gaht's? › Wi gaht's?»), fällt dieser Schritt weg. Die Seite steht zuletzt, ohne Link.
- Die Regel sitzt an einer Stelle (`withoutPage` in `src/lib/nav/wege.js`, von `fitSteps` benutzt) und gilt für alle Seiten mit `VeloHead`, `PathHead` und `Crumbs`; die Zeile `Crumb` der Aktiv-Seiten bleibt, wie sie ist (auf dem Handy zeigt sie nur den letzten Schritt).
- Nur der letzte Schritt zählt; derselbe Name weiter vorn im Pfad bleibt.
