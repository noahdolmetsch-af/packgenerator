# Form im Vergleich zu früher

21.11.2026 · Auftrag: Noah «1a dann b dann alle anderen 2a 3a 4a 5a», Rechnung «ok einverstanden» 22:23 (Thread «Bauen: Sportjahr und Auswertung aller Sportarten», Auftrag K2)

## Was ist neu
- **Karte «Form im Vergleich zu früher»** auf «Form und Erholung»: dieselben Monate (Mai bis Oktober; dieses Jahr bis heute) jedes Jahres nebeneinander. **Watt je Herzschlag** (durchschnittliche Watt geteilt durch durchschnittlichen Puls, Velofahrten mit Leistungsmesser, ab 40 Minuten, mittlerer Wert), **Ruhepuls** (mittlerer Wert, ab 20 Tagen mit Wert) und **Stunden** (alle Aktivitäten).
- Text ohne Wertung: «Watt je Herzschlag: dieses Jahr 1.14, letztes Jahr 1.10.» und dieselbe Zeile für den Ruhepuls.
- **Sicherheitsangabe** (neues Etikett `Sicherheit.svelte`, auch für K3 gedacht): «Zu wenig Daten» (unter 10 Fahrten dieses Jahr oder im Vorjahr, kein früheres Jahr, oder ein Jahr, das mehr als 20 % vom mittleren Wert aller Jahre abweicht, wie ein Datenproblem), «Tendenz» (dieses Jahr gegen das Jahr davor), «Sicher» (dieses Jahr und die zwei Jahre davor gingen jeweils um mindestens 2 % in dieselbe Richtung).
- **Marker (K1)** werden bei Fahrten und Ruhepuls weggelassen; die Stunden zählen alles.
- **«So gerechnet»** erklärt die Rechnung und lässt zwei Grenzen ändern: «Mindestens Fahrten pro Jahr» (Standard 10) und «Kürzeste Fahrt, Minuten» (Standard 40), mit «Zurück zu den üblichen Werten». Neue Einstellung `training.vergleich` in `db.settings` (kein Schema-Wechsel).
- Neue Dateien `src/lib/flow/form/vergleich.js` (rein, mit Tests `tests/form-vergleich.test.js`), `FormVergleich.svelte`, `Sicherheit.svelte`, `tests/e2e/vergleich.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte steht unter «Tour-Bereitschaft», vor «Marker».

## Selbst entschieden
- **Sportjahr unberührt:** Noahs Auftrag nennt die Karte «im Sportjahr und auf Form und Erholung». Sportjahr.svelte gehört gerade dem Diagramm-Thread, darum zuerst nur «Form und Erholung»; die Karte lässt sich danach dort einbinden.
- **Nur Leistungsmesser-Fahrten** (`wDevice`): Strava schätzt Watt sonst, das wäre kein Vergleich.
- **«Sicher» = drei Jahre in einer Reihe** (dieses Jahr und die zwei davor, je ≥ 2 % in dieselbe Richtung). Strenger zu lesen wäre vier Jahre; wenn dir das zu leicht ist, ändere ich es.
- **Ausreisser 20 %** vom Mittel aller Jahre (Vorprüfung: 2024 mit 0.83 gegen 1.07 wäre ein Ausreisser).
- **Marker aller vier Arten** zählen als «ausblenden», auch Ferien.
- **Zwei Grenzen änderbar**, die Schwellen für Ausreisser und Richtung nicht (stehen in `vergleich.js`).
- **Fertig-Regel:** Teil von «Form und Erholung» (Seite, Gut zu wissen und app-stand-Zeile bestehen), Leerzustand mit Satz, Absprung folgt mit K3.

## Entscheide (eigene Datei `docs/decisions/form-im-vergleich.md`)
- 21.11.2026: Rechnung und Sicherheitsangabe wie in Auftrag K2 festgelegt (Noah «ok einverstanden»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Klügere Auswertungen: K2 gebaut (baut auf K1). Offen: K3 (braucht Noahs Zeiträume), K4.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Form und Erholung › «Form im Vergleich zu früher»: Etikett, Satz und eine Zeile pro Jahr.
2. «So gerechnet» öffnen, «Mindestens Fahrten pro Jahr» ändern und mit «Zurück zu den üblichen Werten» wieder zurücksetzen.
