# Test «Demo-Uhr +12 Monate» wartet auf die Seite

Auftrag: Noah «1a» (Thread «Merge-Stau abbauen und Tests stabilisieren»). Nichts Sichtbares in der App.

## Was ist neu
- Der Gesamttest S8 «demo clock +12 months» wartet nach jedem Neuladen, bis die Seite wirklich da ist (`main`), statt fest 700 ms.
- Ursache: Seit «Kern verkleinern» (#453) lädt die deutsche App zuerst die Texte und erst danach die App (`src/main.js`). Mit den 700 Fixture-Einträgen dauert das länger als 700 ms. Der Test fragte das Jahr, bevor die App und damit die Demo-Uhr gestartet war (leere Seite, Jahr 2026).
- Die Uhr selbst ist in Ordnung: Mit Warten auf die Seite zeigt die App 2027.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Kein Test gelockert: im Gegenteil, die Fehler- und Seitwärts-Prüfungen pro Seite laufen jetzt wirklich auf der geladenen Seite, nicht mehr auf einer leeren.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Tests stabilisieren: S8 behoben, S6 offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App prüfen. Der Gesamttest «Volle Prüfung» ist danach bei S8 grün.
