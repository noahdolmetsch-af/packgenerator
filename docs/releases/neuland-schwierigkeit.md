# Wie schwer ist der Ausflugstipp?

PR #? · 23.11.2026 · Auftrag: Noah «1b 2a 3a» (Thread «Challenges nach Gelegenheit bauen»), Schritt 3 von 4. Baut auf dem PR «Startort» auf.

## Was ist neu
- Jeder Ausflugstipp in «Heute passt» nennt vor der Strecke seine Schwierigkeit: **Locker**, **Mittel** oder **Knackig**.
- Die Regel steht in einer ruhigen Zeile unter der Liste: Locker bis 40 km Runde, mittel ab 40 km, knackig ab 70 km; ein Ort über 800 m ist mindestens mittel, über 1500 m knackig (Höhe nur, wo sie bekannt ist).

## Was fällt weg oder rutscht tiefer
nichts. Eine Zeile kommt unter die Liste, ein Wort in die Beschreibung jedes Orts.

## Selbst entschieden
- Nur eine **Anzeige**, kein Filter: drei Orte mit Filter wären oft weniger als drei. Ein Filter «nur locker» wäre ein eigener Schritt, wenn du ihn willst.
- Die Schwellen sind eine grobe Schätzung (Luftlinie mal Strassenfaktor, keine echten Höhenmeter) und stehen offen in `src/lib/neuland/tipps.js` (`LEVEL_KM`, `LEVEL_ALT`). Die echten Höhenmeter zeigt «Runde hindurch».
- Keine neuen Daten, kein Backup-Einfluss.

## Entscheide
nichts Neues (Noah «2a»).

## Stand im Plan
- Challenges nach Gelegenheit: Schritt 3 von 4 gebaut (Zeit, Startort, Schwierigkeit). Es folgt der Absprung aus der Draussen-Karte.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: in «Heute passt» steht vor jeder Strecke «Locker», «Mittel» oder «Knackig».
2. «6 h» wählen: weiter entfernte Orte werden mittel oder knackig.
3. Unter der Liste die Regel lesen.
