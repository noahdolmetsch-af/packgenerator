# Menü-Test unabhängig von den ruhigen Punkten

Auftrag: Reparatur zu «Ruhige Punkte an allen Orten» (Noah «4a», 23.11.2026).

## Was ist neu
- Nichts Sichtbares. Der Test `nav.spec.js` («jede Adresse markiert ihren Ort») liest die Namen der Orte im Menü jetzt ohne die Zahl bzw. den Punkt und ohne deren versteckte Worte. Vorher brach er, sobald bei «Plan» heute offene Haken standen («2 Plan, Plan: 2 Haken offen heute» statt «Plan»), zum Beispiel auf PR 1614.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Test bleibt streng: gleiche Namen, gleiche Reihenfolge, gleicher markierter Ort; nur die Zahl und der Punkt zählen nicht zum Namen. Der Test wird nicht übersprungen oder gelockert.
- Keine News-Datei (nichts Sichtbares), also eine Patch-Nummer.

## Entscheide
- Keine.

## Stand im Plan
- Nichts geändert.

## Prüfschritte
1. CI: `nav.spec.js` läuft auf dem Handy grün, auch wenn bei «Plan» Haken offen sind.
