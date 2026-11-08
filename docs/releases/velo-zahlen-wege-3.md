# Velo-Zahlen als Wege (Teil 3)

PR #… · 08.11.2026 · Auftrag: Noah «was schlägst du vor» zu den Bildern von Teil 2, danach «ok 1149» und Folge-PR (Thread «Absprünge: Velo-Zahlen als Wege»)

Ergänzt `velo-zahlen-wege-2.md` (PR #1149) um fünf Verbesserungen aus der Durchsicht der Bilder.

## Was ist neu
- **Kürzere Tour-Zeile:** ist die nächste Tour mit dem Velo, das gerade offen ist, steht der Velo-Name nicht mehr in der Zeile («nächste Tour: Jura event am 28. Nov. 2026»). Bei einem anderen Velo bleibt der Name, damit klar ist, für wen «passt» oder «n fällig» gilt.
- **«n fällig» nur einmal:** gilt die Tour für das offene Velo und die Zahl ist dieselbe wie im gelben «Jetzt dran», fehlt die Marke in der Tour-Zeile. «bis dahin fällig» und «passt» bleiben.
- **Km-Weg mit ganzem Jahr:** die Kilometer eines Velos öffnen Analyse › Velos mit `&zeit=y` (365 Tage). `velosHref(bikeId)` setzt es; «Alle Velos» (ohne Velo) lässt den Zeitraum, wie er war.
- **Leere Seite erklärt sich:** hat das km-Buch noch keine gezählten Fahrten des Velos, steht «Die N km kommen vom Velo selbst»; sonst bei kurzem Zeitraum der Knopf «Ganzes Jahr zeigen».
- **Einkaufsliste mit Velo:** bei mehreren Velos steht der Eintrag als «Kette (Velo-Name)». Der Name des Velos geht nicht durch `t()`.

## Was fällt weg oder rutscht tiefer
- Die Marke «n fällig» in der Tour-Zeile entfällt, wenn sie dasselbe sagt wie «Jetzt dran» (alter Weg: beide; neuer Weg: nur «Jetzt dran», ein Tipp führt zur Pflege).

## Selbst entschieden
- Die Marke bleibt, wenn die Tour mit einem anderen Velo ist: dort ist sie die einzige Aussage, ob das Tour-Velo bereit ist.
- Der Knopf «Ganzes Jahr zeigen» ändert nur den Zeitraum der Seite (der gespeicherte Zeitraum), nichts an den Daten.
- Keine neue Funktion in `features.js`, `docs/app-stand.md` unverändert.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: V1 (Velo-Zahlen) geschliffen; Pflege in Gruppen und Ort-Vorlage bleiben bei den anderen Threads.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos öffnen: die Zeile «nächste Tour: …» ist kurz; bei einem anderen Velo nennt sie das Tour-Velo und zeigt «passt» oder «n fällig».
2. Auf die Kilometer eines Velos tippen: Analyse zeigt das ganze Jahr, nicht 30 Tage.
3. Velos › Pflege › Verschleiss, «Auf die Einkaufsliste» tippen: der Eintrag heisst «Teil (Velo)».
