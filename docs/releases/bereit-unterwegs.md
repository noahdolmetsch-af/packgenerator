# Bereit für unterwegs? (Schritt 6 «Offline»)

PR (diese Änderung) · 04.11.2026 · Noah 31.10. «1-5 a» (Schritt 6: Offline, Weg und Karte vorher speichern, Sprache beim Navigieren), 04.11. «kannst du schritt offline bereits vorbereiten?»; Ziel 6 «Lange Fahrten unterwegs verstehen»

## Was ist neu
- Auf der Live-Seite vor dem Start (Tour mit Strecke) neu die Karte «Bereit für unterwegs?» (`ready.js`, `ReadyCard.svelte`) mit zwei Zeilen:
  - Karte entlang der Strecke: «ist auf diesem Handy» (ein gespeicherter Streifen dieser Tour, dessen Kacheln da sind) oder «noch nicht», mit «Karte speichern». Der Knopf öffnet die schon vorhandenen Offline-Streifen (`OfflineBox`) gleich dort.
  - Sprache: «ist an» oder «aus», mit «Sprache einschalten» (setzt dieselbe Option wie in den Einstellungen).
- Sind beide da, steht «Alles bereit. Gute Fahrt.»

## Was fällt weg oder rutscht tiefer
- nichts. Eine Karte mehr vor dem Start, vor dem Tipp «Akku sparen: im Flugmodus fahren». Die Offline-Streifen im «⋯»-Menü bleiben.

## Selbst entschieden
- Nichts ist Pflicht: Die Fahrt startet auch ohne. Die Sprache wird nicht von selbst eingeschaltet (alle Optionen bleiben aus, bis du sie wählst).
- «Weg speichern»: Die Strecke der Tour liegt schon auf dem Handy; eine eigene Zeile dafür gibt es nicht. Die Neuberechnung zu einem Ziel braucht weiter Internet (der Hinweis dazu ist schon da).
- Keine neue Funktion in `features.js`; die Karte gehört zur Live-Karte.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- Schritt 6 gebaut; die sechs Schritte der Live-Navigation sind damit durch.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Seite einer Tour mit Strecke vor dem Start öffnen: «Bereit für unterwegs?» zeigt Karte und Sprache.
2. «Sprache einschalten» antippen: die Zeile wird zu «Die Sprache ist an.» «Karte speichern» antippen: die Offline-Streifen öffnen sich dort.
