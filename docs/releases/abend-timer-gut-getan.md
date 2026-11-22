# Mein Abend: Zeit ohne Handy

PR (offen) · 05.11.2026 · Auftrag: Noah «Touren 2a und b» (Thread «Bauen: Freie Zeit Teil 1»)

## Was ist neu
- Auf «Mein Abend» ein Kasten «Zeit ohne Handy»: 10, 20, 30 oder 45 Minuten wählen, Start, Handy weglegen. Die Zeit zählt herunter; Abbrechen geht jederzeit.
- Wenn die Zeit um ist, fragt die Seite «Hat es dir gut getan?» mit «Hat gut getan», «Nicht so» und «Überspringen».
- «Dieser Abend hat gut getan» gibt es auch ohne Timer. «Zurücknehmen» macht es rückgängig.
- Darunter steht, wie viele Abende in den letzten 30 Tagen gut getan haben (ein Abend zählt einmal).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Timer speichert die Endzeit (`eveTimer` im Freie-Zeit-Eintrag). Wer die Seite verlässt und zurückkommt, sieht die Restzeit oder «Zeit ist um». Ein Ton oder eine Meldung im Hintergrund gibt es nicht (die App kann bei geschlossener Seite nicht klingeln); bei offener Seite vibriert das Gerät kurz.
- Die Rückmeldung steht als Zeile der Art `evening` in der Tabelle `frei` (kein neues Schema, im Backup enthalten).
- Keine neue Funktion in `features.js` (Ergänzung von «Mein Abend»).

## Entscheide (für decisions.md)
- 05.11.2026: Abend-Timer ohne Hintergrund-Ton (Grund: Handy soll weg, Push wäre das Gegenteil).

## Stand im Plan (roadmap.md / vorhaben.md)
- Freie Zeit Teil 1: Abend erledigt (alle vier Ergänzungen als eigene PRs).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Freie Zeit › Mein Abend › «Zeit ohne Handy»: 10 Minuten, «Start».
2. Seite verlassen und zurückkommen: Die Zeit läuft weiter.
3. Nach Ablauf «Hat gut getan» tippen: Die Zahl darunter steigt.
