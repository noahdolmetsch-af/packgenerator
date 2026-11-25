# Auswerten neu, Teil 2: der Reiter «Woche»

Auftrag: Noah «1b 2a 3b 4a 5a» (Thread «Auswerten völlig neu entwerfen», 24.11.2026), Entwurf B «Wochenbericht» (privat, echte Daten). Vorgehen «a»: drei Teile nacheinander; dies ist Teil 2 (Teil 1: `docs/releases/auswerten-heute.md`).

## Was ist neu
- Neue Seite **«Woche»** (`#/auswerten/woche`), erster Chip des Reiters «Woche» in Auswerten: ein Satz über den Zeitraum («7 h in 5 Einheiten an 4 Tagen»), der Zeitraum davor in einer Zeile mit Prozent, die Zahlen, die Stunden pro Sportart als Balken (Tag für Tag in der Woche, Woche für Woche im Monat, Monat für Monat im Jahr), «Wie du dich erholt hast» (HRV, Ruhepuls, Schlaf der Zeitraum-Mitte gegen dein eigenes Normal der letzten 12 Monate, dasselbe Band wie bei «Heute») und die längsten Einheiten.
- Der Zeitraum ist der Schalter von Auswerten (Woche, Monat, Jahr, Alles, eigener Zeitraum; ‹ › blättert zurück). Die Stunden sind dieselben wie im Sportjahr (`einheiten()`, `training()`).
- «Was habe ich gemacht?» auf «Heute» führt jetzt hierher.

## Was fällt weg oder rutscht tiefer
- Der Reiter «Fahrten» heisst jetzt «Woche» und beginnt mit dem neuen Bericht; alle bisherigen Seiten (Fahrten, Haken, Gelernt, Meilensteine, Challenges, Heatmap, Neuland, Gipfelbuch, Jahr) stehen unverändert als Chips daneben, mit ihren alten Adressen. Nichts fällt weg.

## Selbst entschieden
- Die Zeitraum-Rechnung (Satz, Vorperiode) ist neu und nutzt dieselben Einheiten wie das Sportjahr; die Vorperiode ist der Schritt davor (Woche davor, Monat davor, Jahr davor), nicht das Vorjahr. Bei «Alles» und eigenem Zeitraum gibt es keine.
- Die Erholungs-Mitte braucht mindestens 3 Tage mit Wert; sonst fehlt die Zeile.
- Kein Antippen der Balken (das Fenster mit den Einheiten gibt es im Sportjahr); der Bericht zeigt beim Zeigen die Zahlen im Balkendiagramm.
- Tests: `tests/aktiv-bereich.test.js` und `auswerten-gruppen.spec.js` kennen den neuen Chip «Woche» (erweitert, nichts gelockert).

## Entscheide
- `docs/decisions/auswerten-heute.md` (gilt für alle drei Teile)

## Prüfschritte (nach dem Merge, am Handy)
1. Auswerten › «Woche»: der Satz über die Woche steht zuerst.
2. ‹ antippen: die Woche davor, mit Prozent gegen die davor.
3. «Wie du dich erholt hast»: HRV, Ruhepuls, Schlaf mit Band; auf «Monat» wechseln, die Balken werden Wochen.
