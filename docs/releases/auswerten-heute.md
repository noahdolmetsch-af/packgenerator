# Auswerten neu, Teil 1: «Heute» und dein eigenes Normal

Auftrag: Noah «1b 2a 3b 4a 5a» (Thread «Auswerten völlig neu entwerfen», 24.11.2026), Entwürfe A/B/C mit echten Daten (privat). Vorgehen «a»: drei Teile nacheinander (Teil 1 Rechenteil und «Heute», Teil 2 «Woche», Teil 3 «Verlauf»).

## Was ist neu
- Auswerten beginnt mit **«Heute»** (`#/auswerten`): zuerst die Antwort für heute mit Grund und den Knöpfen «Für heute vormerken» und «Ich sehe das anders», dann «Dein Normal» (HRV, Ruhepuls, Schlaf gegen deine eigenen letzten 12 Monate, die letzten 4 Wochen als zweite Zahl), dann «Deine vier Fragen».
- Die Erholung (Bereitschaft) rechnet jetzt gegen das Normal der letzten 12 Monate statt der letzten 30 Tage; die 28 Tage stehen als zweite Zahl daneben (Noah «4a»).
- Das Rechenteil `src/lib/auswerten/normal.js` und `muster.js` (mit Tests) liegt bereit für «Woche» und «Verlauf».

## Was fällt weg oder rutscht tiefer
- Die alte Startseite von Auswerten (Formkarte, «Im Fokus», «Überblick», «Letzte 7 Tage», «Wi gaht's?») steht unverändert unter `#/auswerten/uebersicht`, im Reiter «Heute» als Chip «Übersicht» und als Link «Die alte Übersicht». Nichts fällt weg.
- Die Bereitschaft kann sich an einzelnen Tagen leicht ändern, weil das Normal jetzt länger zurückreicht.

## Selbst entschieden
- Der Reiter heisst «Heute» und enthält die Chips Heute, Fragen, Übersicht; die anderen vier Reiter bleiben bis Teil 2 und 3 unverändert (kleinste Änderung der Navigation).
- «Vormerken» legt einen Merken-Eintrag für heute an (Bereich Sport, Quelle `auswerten:heute`), mit Rückgängig.
- Die vier Fragen führen vorerst zu den bestehenden Seiten; Teil 2 und 3 richten zwei davon auf «Woche» und «Verlauf» aus.
- Nur Ansehen: nichts wird gespeichert ausser dem Merken-Eintrag auf Tipp.
- Tests: `tests/aktiv-bereich.test.js` und `tests/fuenforte.test.js` kennen den neuen Chip «Heute» (erweitert, nichts gelockert); Browser-Tests, die den alten Start prüfen, öffnen `#/auswerten/uebersicht`.

## Entscheide
- `docs/decisions/auswerten-heute.md`

## Prüfschritte (nach dem Merge, am Handy)
1. Auswerten öffnen: zuerst die Antwort für heute mit Grund.
2. «Dein Normal»: bei HRV, Ruhepuls, Schlaf Band, «Üblich: … bis …» und «Letzte 4 Wochen».
3. «Für heute vormerken» antippen: «In Merken für heute.» erscheint, Rückgängig nimmt es zurück.
4. «Die alte Übersicht» antippen: die frühere Startseite ist unverändert da.
