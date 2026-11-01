# Neuer Weg, wenn du vom Weg zum Ziel abkommst

PR (diese Änderung) · 01.11.2026 · Auftrag: Noah «1-5 a» zu «Live-Navigation richtig gut machen» (Schritt 4 von 6)

## Was ist neu
- Fährst du auf dem Weg zu einem Ziel mehr als 80 m von der Linie weg, plant die App nach 15 Sekunden von deinem Standort aus einen neuen Weg zum gleichen Ziel.
- Die Meldung «Neuer Weg zum Ziel von hier aus.» hat «Rückgängig»: der alte Weg kommt zurück.

## Was fällt weg oder rutscht tiefer
- nichts. Der Weg zum Ziel blieb bisher stehen, auch wenn man abgebogen war.

## Selbst entschieden
- Gleiche Schwellen wie beim Weg zurück auf die Strecke (80 m, 15 s, höchstens alle 60 s). Ohne Netz oder ohne Antwort des Routers passiert nichts, die Linie bleibt.
- Gilt nur für den Weg zu einem Ziel, nicht für Wege zurück auf die Strecke (die planen sich schon selbst neu).
- Kein eigener Schalter: ein Ziel zu wählen heisst, hinfahren zu wollen. Beenden geht wie bisher mit «Navigation beenden».

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Live-Navigation richtig gut: Schritt 4 von 6 (Neuberechnung zum Ziel).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ziel wählen, «Hinfahren»; auf eine andere Strasse abbiegen und ein paar Sekunden weiterfahren.
2. Eine neue Linie von dir zum Ziel erscheint, mit «Rückgängig» in der Meldung.
