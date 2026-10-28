# Schnellspur: schneller online

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Verbessern Weg von gebaut zu online»)

## Was ist neu
- Nach einem Merge geht `main` online, sobald gebaut ist und die Kurztests (`npm test`) grün sind: etwa 5 Minuten statt 35 Minuten plus Warteschlange.
- Ein laufendes Online-Gehen wird nicht mehr abgebrochen. Kommen inzwischen weitere Merges, gehen sie gleich danach gemeinsam online.
- Ein PR prüft: Bauen und Kurztests, die Browsertests am Handy (5 Teile) und den Wächter am Computer (`guard.spec.js`, jede Hauptseite bei 1440 px). Das sind 8 statt 18 Prüf-Computer; GitHub gibt uns 20 gleichzeitig.
- Neu `.github/workflows/volle-pruefung.yml`: nach jedem Online-Gehen die Browsertests am Computer und der Gesamttest auf genau der Version, die online ist; jede Nacht dazu die Handy-Browsertests. Ist etwas rot, öffnet GitHub eine Meldung «Volle Prüfung: ein Test ist rot», Claude repariert; wird es wieder grün, schliesst sie sich.

## Was fällt weg oder rutscht tiefer
- Weg: «main geht nur online, wenn vorher alle Browsertests grün sind». Neu laufen sie direkt nach dem Online-Gehen; ein Fehler meldet sich als GitHub-Meldung, «zurück» bleibt jederzeit möglich. Der Live-Check nach dem Online-Gehen bleibt.
- Tiefer: die Browsertests am Computer und der Gesamttest laufen nicht mehr pro PR, sondern nach dem Online-Gehen und nachts. Ein Fehler, der nur am Computer auftritt, fällt so manchmal erst nach dem Merge auf. Die Bilder, die Noah freigibt, zeigen weiterhin Handy und Computer.

## Selbst entschieden
- Die Prüfnamen «build», «e2e (phone)» und «e2e (desktop)» bleiben, damit die Branch-Regel auf GitHub nicht geändert werden muss. «e2e (desktop)» ist jetzt der Wächter am Computer statt aller Computer-Tests.
- Nach dem Online-Gehen laufen nur die Computer-Tests und der Gesamttest (die Handy-Tests liefen schon im PR); nachts alles. Die volle Prüfung bricht sich nie selbst ab; wartet schon eine, ersetzt die neuere sie.
- Die neue Meldung hat ein eigenes Label `volle-pruefung`, getrennt vom Live-Check, damit man sieht, welche Prüfung rot ist.

## Entscheide (für decisions.md)
- 27.10.2026: Schnellspur nach dem Merge und leichtere Prüfung pro PR (Noah «1a 2a»). Grund: 18 von 20 Prüf-Computern pro Lauf, 19 Läufe in der Warteschlange, gemergte PRs warteten bis 2 Stunden aufs Online-Gehen.

## Stand im Plan
- Verschlanken (Tests und Tempo): Prüfungen neu verteilt. Als Nächstes: automatischer Eintrag «Online» auf GitHub nach jedem Online-Gehen (Noah «5a»).

## Prüfschritte (nach dem Merge)
1. Im Thread kommt «Online: …» nach etwa 5 bis 10 Minuten statt nach einer halben Stunde oder mehr.
2. Unter github.com/noahdolmetsch-af/packgenerator/actions erscheint nach dem Online-Gehen ein Lauf «Volle Prüfung».
3. Ein neuer PR zeigt die Prüfungen «e2e (phone)» und «e2e (desktop)» nach etwa 15 bis 20 Minuten grün.
