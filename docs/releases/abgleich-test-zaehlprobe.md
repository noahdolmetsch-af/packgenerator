# Abgleich-Test: Zähl-Probe mitgezählt

Nur ein Test, nichts an der App.

## Was geändert hat
- `tests/sync-ruhige-runde.test.js`: Holt die Runde etwas vom Server, liest die App die Änderungsliste jetzt dreimal statt zweimal. Das dritte Lesen gehört zur Zähl-Probe aus «Abgleich prüft sich selbst» (#1330), die nach jeder Runde mit Bewegung zählt. Der Test erwartet das und prüft weiter, dass eine ruhige Runde nur einmal liest.

## Was fällt weg
- nichts.

## Selbst entschieden
- Der Test wurde angepasst, nicht gelockert: die ruhige Runde bleibt bei genau einem Lesen. Grund der Anpassung: #1257 und #1330 sind unabhängig voneinander gemerged worden, erst zusammen wurde der Test rot (Pages-Lauf nach #1257).
