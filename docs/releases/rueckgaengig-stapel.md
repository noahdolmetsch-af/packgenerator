# Jedes Rückgängig bleibt

PR (B22) · 27.10.2026 · Auftrag: Noah «ich möchte b13 bis b24 alle umsetzen. 1a 2a 3a 4a 5a» (Thread «Planen Bausteine B13 bis B24»)

## Was ist neu
- Meldungen mit «Rückgängig» stapeln sich unten (höchstens 3). Vorher hat eine zweite Meldung die erste ersetzt, und das erste «Rückgängig» war weg (zweimal nacheinander gelöscht: nur das Zweite kam zurück).
- Meldungen gleiten von unten auf; ein dünner Strich zeigt die 4 Sekunden; zur Seite wischen oder × schliesst sie.
- Gilt überall, wo die App «… gelöscht · Rückgängig» oder «… gespeichert · Rückgängig» zeigt (ein gemeinsamer Baustein).

## Was fällt weg oder rutscht tiefer
- nichts. Die ältere Meldung steht etwas kleiner über der neuen.

## Selbst entschieden
- Eine ältere Meldung **ohne** Rückgängig verschwindet sofort, wenn eine neue kommt (sie hat nichts zu verlieren); nur Meldungen mit Rückgängig bleiben stehen.
- Höchstens 3 Meldungen gleichzeitig, sonst geht die älteste.
- Schliessen-Knopf × mit dem Text «Meldung ausblenden»; bei «Bewegung reduzieren» gleitet nichts und der Zeitstrich fehlt.
- Die neueste Meldung heisst im Code weiter `.rtoast`, die älteren `.rtoast-old`, damit alle bisherigen Tests gleich bleiben.
- Die älteren Meldungen sagen «Zurücknehmen» statt «Rückgängig»: so ist «Rückgängig» immer die neueste, und Tastatur und Vorleser finden sie zuerst.

## Entscheide (für decisions.md)
- 27.10.2026: Bausteine B13 bis B24 und Ideen E1 bis E8 alle bauen, Reihenfolge Bausteine für alle Seiten zuerst (Noah «1a 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuer Schwung, Bausteine B13 bis B24: B22 gebaut; als Nächstes B15 gleitende Umschalter.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Gelernt: zwei Erkenntnisse nacheinander löschen. Unten stehen zwei Meldungen.
2. «Zurücknehmen» bei der oberen tippen: die erste Erkenntnis ist wieder da.
3. Eine Meldung zur Seite wischen: sie verschwindet.
