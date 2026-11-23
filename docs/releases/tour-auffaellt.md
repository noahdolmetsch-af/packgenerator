# «Das fällt auf» nach der Tour

Plan «ganze App», Schritt 7b · Auftrag: Noah «Danach, «Das fällt auf» nur nach der Tour, Antwort in Worten» (Entwurf 07.11.2026); Variante a «Ein Satz aus der Fahrt» (23.11.2026, Thread «Prototyp»)

## Was ist neu
- Im **Tour-Pfad** (Touren › die Tour › «Schritt n von 4») steht unter den vier Phasen die Karte **«Das fällt auf»** mit **einem Satz**, aber nur, wenn der Rückblick der Tour gespeichert ist. «Warum?» zeigt die Regel dahinter.
- Der Satz kommt aus dem, was schon erfasst ist, in dieser Reihenfolge (der erste, der zutrifft): (1) gefahrene gegen geplante Kilometer ab 15 % Abstand («Du bist 200 km gefahren, geplant waren 300 km: 33 % weniger.»), (2) drei oder mehr Teile als «Nicht gebraucht» markiert (mit dem Gewicht, wo es bekannt ist), (3) etwas unter «Gefehlt» eingetragen.
- Fällt nichts auf, steht nichts da; die Seite sagt nie «alles gut». Es wird nichts gespeichert, kein Schema, kein Backup-Feld.
- Code: Regel `src/lib/tourpfad/auffaellt.js`, Karte `src/lib/tourpfad/Auffaellt.svelte`, eingebaut in `src/pages/Tourpfad.svelte`.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- **Ort:** der Tour-Pfad (dort liegt die Phase «Danach»); die Karte «Meine Tour» auf Heute ist nach dem Rückblick weg, also kein Platz dort. Eine zweite Stelle (zum Beispiel am Ende des Rückblicks) wäre ein eigener kleiner PR.
- **Gefahrene km:** die Fahrten, die der Tour zugeordnet sind; ohne Fahrt die km aus dem Rückblick.
- **Keine Wertung, kein Rat:** der Satz nennt nur die Zahl und den Abstand, ohne «zu wenig» oder «du solltest».
- **Fertig-Regel:** Seite: die Karte steht im Tour-Pfad (Zeile in `docs/app-stand.md` ergänzt); Absprung: der Tour-Pfad hat seinen Weg (Heute, «Schritt n von 4»); «Gut zu wissen»: der Tour-Pfad hat keine «Was du hier tun kannst»-Karte, «Warum?» erklärt die Regel; Leer-Zustand: ohne Auffälliges ist die Karte weg; nächster Schritt: die Phase «Danach» führt weiter; keine neue Funktion in `features.js`.
- Tests: `tests/tourauffaellt.test.js`, `tests/e2e/tourpfad.spec.js` (neuer Test).

## Entscheide (für decisions.md)
- keine neuen (Variante a gewählt, steht oben)

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App», Zeile 7b: gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Den Tour-Pfad einer Tour mit gespeichertem Rückblick öffnen.
2. Unter den Phasen steht «Das fällt auf» mit einem Satz.
3. «Warum?» tippen: die Regel öffnet sich.
