# Auswerten neu, Teil 3: der Reiter «Verlauf» (dein Normal über die Jahre)

Auftrag: Noah «1b 2a 3b 4a 5a» und «eigenes normal», «über die jahre verteilt» (Thread «Auswerten völlig neu entwerfen», 24.11.2026), Entwurf C «Cockpit» (privat, echte Daten). Vorgehen «a»: drei Teile nacheinander; dies ist Teil 3 (Teil 1: `auswerten-heute.md`, Teil 2: `auswerten-woche.md`).

## Was ist neu
- Neue Seite **«Verlauf»** (`#/auswerten/verlauf`), erster Chip des dritten Reiters: HRV, Ruhepuls und Schlaf über 4 Wochen, 12 Wochen, 6 Monate oder 2 Jahre (ab 6 Monaten ein Punkt pro Woche) als Linie mit **deinem eigenen Üblichen der letzten 12 Monate als weichem Band** dahinter; die Wahl bleibt gemerkt.
- **«Dein Normal über die Jahre»**: pro Jahr ein Band (hell = fast alle Tage, dunkel = mittlere Hälfte, Strich = Mitte) auf gemeinsamer Skala, dazu eine Zeile «alle Jahre». Nie ein Vergleich mit Alter oder anderen.
- **«Was deine Daten zeigen»**: zwei Muster, die einfache Regeln in allen Nächten finden: HRV nach der Stunde, zu der du ins Bett gingst (vor 22:30, bis Mitternacht, bis 01:30, später) und HRV in der Nacht nach einer Fahrt (keine, unter 1 h, 1 bis 3 h, über 3 h). Jede Gruppe braucht mindestens 15 Nächte, sonst steht «zu wenige Nächte»; immer «Beobachtung, keine Ursache».
- Der Reiter «Verlauf» fasst die Seiten der früheren Reiter «Körper», «Wi gaht's?» und «Eigenes Diagramm» zusammen. Auswerten hat jetzt drei Reiter: Heute, Woche, Verlauf (Noah «2a»).
- «Was tut mir gut?» auf «Heute» führt hierher.

## Was fällt weg oder rutscht tiefer
- Die Reiter «Körper», «Wi gaht's?» und «Eigenes Diagramm» gibt es nicht mehr als Reiter; ihre Seiten (Form, Körperwerte, Erkenntnisse, Gewicht, Wi gaht's, Was mir gut tut, Ideen, Analyse) stehen unverändert, mit ihren alten Adressen, als Chips im Reiter «Verlauf». Nichts fällt weg.

## Selbst entschieden
- Die Muster liegen hier, nicht als eigener Chip: die Seite «Was mir gut tut» (`#/me/wohl`) bleibt unverändert daneben.
- Der Balken bei den Mustern beginnt bei 90 % der tiefsten Gruppe und sagt das in einem Satz darunter, damit kleine Unterschiede nicht grösser wirken als sie sind.
- Linie bei Schlaf in Stunden, bei HRV und Ruhepuls wie gemessen; ab 6 Monaten der Wochenmittelwert mit mindestens 2 Werten pro Woche.
- Tests: `tests/aktiv-bereich.test.js`, `auswerten-gruppen.spec.js` und `gt20-touren.spec.js` kennen drei Reiter und das Chip «Fahrten» unter «Woche» (angepasst, nichts gelockert).

## Entscheide
- `docs/decisions/auswerten-heute.md` (gilt für alle drei Teile)

## Prüfschritte (nach dem Merge, am Handy)
1. Auswerten › «Verlauf»: drei Linien mit weichem Band, «2 Jahre» wechselt auf Wochenpunkte.
2. «Dein Normal über die Jahre»: ein Band pro Jahr.
3. «Was deine Daten zeigen»: Bettzeit und Fahrt, jede Gruppe mit Anzahl Nächte.
4. Chips: Form, Körperwerte, Gewicht, Wi gaht's, Analyse sind noch da.
