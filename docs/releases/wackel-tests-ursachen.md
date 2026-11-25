# Wackel-Tests: vier Ursachen behoben

PR #1783 · 23.11.2026 · Auftrag: Noah «ja» (Thread «Wackel-Tests zuverlässig machen»)

## Was ist neu
- Nichts in der App. Nur Testcode; kein Test gelockert, keiner gelöscht, kein App-Verhalten geändert.
- `tests/e2e/v0620-masse.spec.js` («Velos vergleichen: die Masse-Zeilen stehen zuerst»): Der Test wählte alle Velos an, bevor die Auswahl-Knöpfe gezeichnet waren, zählte «keiner aus» und hörte sofort auf; die Tabelle hatte dann nur zwei Velos. Jetzt wartet er auf die vier Knöpfe und prüft am Ende, dass keiner mehr aus ist. Vorher am Handy 6 von 8 Läufen rot, jetzt 0 von 24.
- `tests/e2e/gut-zu-wissen-suche.spec.js`: Nach «Gut zu wissen ausblenden» lud der Test die Seite neu, bevor die Einstellung in IndexedDB geschrieben war (1 von 8 Läufen auf Handy und Computer rot). Jetzt wartet er wie in der ersten Runde auf die Bestätigung «ausgeblendet», die erst nach dem Schreiben erscheint. Der Fehler kam aus dem Test, nicht aus der App und nicht von der Navigation.
- `tests/e2e/live-speichern.spec.js` und `tests/e2e/pf.spec.js` (PF13, Szenario 2): Die Test-Uhr `clock.js` verschiebt `Date` im ganzen Node-Arbeiter auf einen Mittwoch der Monatsmitte und lässt es nach jedem Test verschoben. Ein Spec ohne festgesetzte Seitenuhr, der danach im selben Arbeiter lief, rechnete «heute» und «morgen» auf dem Testtag, die Seite stand aber auf dem echten Tag: die kurze Fahrt «morgen» lag in der Vergangenheit, die Live-Fahrt (echte GPS-Zeit) lag in der «Zukunft» der Seitenuhr. Im Nachtlauf rot, im Wiederholungsversuch (frischer Arbeiter) grün. Neu: `tests/e2e/realtime.js` gibt diesen beiden Specs die echte Zeit. Nachgestellt mit `gut-zu-wissen-suche` vor `pf.spec` im selben Arbeiter: vorher PF13 rot, nachher alles grün.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur die belegten Wackler repariert. Dieselbe Ursache (Test-Uhr bleibt verschoben) kann jeden der rund 170 Specs treffen, die `test` direkt aus `@playwright/test` holen und im Testcode `Date` lesen. Eine Gesamtlösung (die Verschiebung nur Specs geben, die `clock.js` laden) würde alle diese Specs ändern und braucht Noahs ok; sie steht als Vorschlag im Entscheid.
- `gruppe.spec.js`, `velopflege-kurz.spec.js` und `tippzahl.spec.js` liessen sich lokal nicht rot machen (je 8 Läufe auf Handy und Computer grün; `tippzahl` hat seit 21.11. schon das Warten auf eine stabile Linkliste). Sie bleiben unberührt, bis eine Nachtliste einen echten Fehlertext zeigt.
- Keine «Was ist neu»-Datei, weil nichts Sichtbares ändert.

## Entscheide (eigene Datei `docs/decisions/wackel-tests-ursachen.md`)
- 23.11.2026: Test-Uhr-Verschiebung bleibt, Specs ohne feste Seitenuhr lesen die echte Zeit über `realtime.js`; Gesamtlösung nur mit Noahs ok.

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung (Ziel 6 «Eine App, die im Alltag unterstützt»: verlässlichere Prüfungen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: die Prüfung `e2e` zeigt für `v0620-masse`, `gut-zu-wissen-suche`, `live-speichern` und `pf` grün.
2. Nach der nächsten Nacht: die Wackel-Liste (Issue «Wackel-Tests: Ursache reparieren») nennt diese Tests nicht mehr.
