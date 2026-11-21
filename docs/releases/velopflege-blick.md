# Velopflege auf einen Blick

PR folgt · 21.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Velopflege zum Inspektions-Begleiter machen»), Schritt A von A–E

## Was ist neu
- Oben auf der Pflege-Seite eines Velos steht der Block «Auf einen Blick» (`src/lib/care/GlanceCard.svelte`, Rechnung `src/lib/care/glance.js`):
  - **Kette**: km geleistet, Balken gegen die Lebensdauer (dein Limit gilt, Messwerte der Kettenlehre rechnen dazu), «noch etwa N km», «Fällig etwa Monat Jahr» aus dem Tempo der letzten 8 Wochen, letzte Messung, seit wann und zu welchem Preis; «Kette erfassen» und «Prognose und alle Teile».
  - **Letzter Service**: Tag, Werkstatt, Preis, km, Seither-km und wann der nächste fällig ist.
  - **Letzter Check**: Tag, Stufe, was er fand, wann der nächste fällig ist, Tag der letzten grossen Inspektion.
  - **Kosten des Jahres**: Werkstatt plus selbst bezahlte Teile.
- Jede Kachel ohne Daten sagt, warum sie leer ist, und führt zum nächsten Schritt.
- Es gibt keine neue Datenhaltung: alles wird aus Fahrtenbuch, Teilen, Werkstattbesuchen und Inspektionen gerechnet.

## Was fällt weg oder rutscht tiefer
- nichts. Die graue Zeile unter dem Titel («Kette 720 von 1’000 km») und die Karte «Verschleiss» bleiben; Schritt B (Seite umbauen) entscheidet, was dort zusammenrückt.

## Selbst entschieden
- Der Block steht ganz oben im geöffneten Velo, noch über «Lückenlose km», weil Noah ihn auf den ersten Blick sehen will. Das Umordnen der übrigen Seite folgt in Schritt B.
- Kosten: nur Preise, die schon erfasst sind (Besuche mit Summe, Teile mit Preis). Fehlt ein Preis, steht «Besuch ohne Preis», es wird nichts geschätzt.
- «Letzter Service» fällt auf den letzten Werkstattbesuch zurück, wenn kein Service eingetragen ist, und heisst dann «Letzter Werkstattbesuch».
- Keine neue Funktion in `features.js`: es ist ein Block der bestehenden Seite «Velopflege», ohne eigene Seite. Die «Fertig-Regel» Teil 1 (Katalog) und 2 (Absprung) entfallen deshalb; Teil 3 («Gut zu wissen») und 5 (Als Nächstes) folgen mit dem Begleiter in Schritt C.

## Entscheide (für decisions.md)
- 21.11.2026: Velopflege wird zum Inspektions-Begleiter, in fünf kleinen Schritten A bis E, A zuerst (Noah «1a 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Velopflege-Begleiter: Schritt A gebaut, B bis E offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege: ganz oben steht «Auf einen Blick» mit Kette, Service, Check und Kosten.
2. Auf «Kette erfassen» tippen, eine Messung speichern: «Kettenlehre» in der Kachel zeigt den neuen Wert.
3. Ein Velo ohne Service oder Check: die Kachel sagt, warum sie leer ist, und hat einen Knopf.
