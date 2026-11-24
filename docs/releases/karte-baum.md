# Karte der App als Baum

Auftrag: Noah 24.11.2026 «ich bin total unzufrieden mit dem ergebnis» zur Karte der App (508 Punkte in einem Haufen), Wahl «a) Baum: Ort, Reiter, Seiten» (Thread «Versteckte Inhalte auffindbar machen»).

## Was ist neu
- Die Karte (Ich › Karte der App) zeigt zuerst nur die **Orte**, zugeklappt. Unter jedem Namen steht eine Zeile mit seinen Reitern («Woche · Training · Notizen · Alltag»), so sieht man den Aufbau, ohne etwas zu öffnen.
- Ein Ort öffnet zu seinen **Reitern** (aus `PLACE_TABS` in `nav.js`, in der Reihenfolge der Leiste), ein Reiter zu seinen **Seiten** als ruhige Liste mit dem Punkt (gefüllt, Ring, Stern) vorn. Kleine Reiter (bis fünf Seiten) stehen offen.
- «Ich» ist nach den fünf Gruppen der Seite «Ich» gegliedert (Daten, Erinnerungen, Einstellungen, Hilfe, Mehr). Der Test `tests/appmap.test.js` prüft, dass jede Zeile von `Me.svelte` in einer Gruppe liegt.
- Was zu keinem Reiter passt, steht unter «Weitere Seiten», ein Fenster ohne Adresse unter «Fenster und Aktionen». Keine Funktion fällt weg: «Alle n Funktionen» und die Suche bleiben.
- Die Filter «Noch nie geöffnet» und «Neu» klappen alle Orte auf.

## Was fällt weg oder rutscht tiefer
- Die Punktewolke (alle Seiten eines Ortes als Chips auf einmal) fällt weg: die Seiten stehen einen oder zwei Tipps tiefer, unter ihrem Reiter.
- Chips, die zur selben Seite eines Reiters führen, sind eine Zeile (Beispiel: die Seiten unter einem Reiter von Woche).

## Selbst entschieden
- Der Name einer Seite unter einem Reiter ist der Name des Chips der Leiste, sonst der Name der Funktion auf der Seite.
- «Ich» hat keine Reiter in `nav.js`; seine Gruppen stehen als Liste `ICH_GROUPS` in `src/lib/appmap.js`, mit dem Test gegen `Me.svelte`.
- Heute und Wetter haben je nur eine Gruppe: ihre Seiten stehen ohne Reiter-Zeile.
- Keine Datenänderung, kein neues Backup-Format.

## Entscheide (eigene Datei)
- `docs/decisions/karte-baum.md`
