# «Ausprobieren» führt zur Geist-Karte

PR #<offen> · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4b 5b» (Thread «Klären: Geisterfahrten im Frontend», Frage 1)

## Was ist neu
- «Ausprobieren» bei «Schlag deinen Geist» (Ich › Was ist neu) öffnete bisher Training › Woche. Die Karte liegt aber in einer einzelnen Fahrt. Jetzt öffnet es die **neueste Velofahrt mit Puls, zu der es eine frühere Fahrt zum Antreten gibt**, und die Karte leuchtet.
- Die Zeile unten erklärt, was die Karte tut («wer vorn liegt und wie ähnlich die beiden Fahrten sind»), statt den Beschreibungssatz zu wiederholen.
- Gibt es keine solche Fahrt, öffnet sich Training und eine Zeile sagt, was eine Fahrt dafür braucht.
- Gilt auch für die drei Punkte des schon veröffentlichten Updates «Schlag deinen Geist» (`src/lib/news/ghost.js`).

## Was fällt weg oder rutscht tiefer
- nichts. Der Knopf «Ausprobieren» bleibt, er führt nur an die richtige Stelle.

## Selbst entschieden
- Neues Feld `ride: 'ghost'` und `note` im `go` einer News-Zeile (`know/newsgo.js`, `newsRun.js`): die Seite ist die neueste passende Fahrt, nicht eine feste Adresse.
- Kein Schema- und kein Backup-Format geändert; es wird nur gelesen.
- Fertig-Regel: Es gibt keine neue Funktion, nur einen besseren Weg dorthin.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Geist-Karte (Cockpit-Idee 4): Schritt 1 von 5 (Ausprobieren). Weiter: Ergebnis oben, Texte, Geist vor der Fahrt wählen, Hausrunde-Satz.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu: das Update «Schlag deinen Geist» öffnen und «Ausprobieren» tippen.
2. Eine Fahrt öffnet sich, die Karte «Schlag deinen Geist» leuchtet, darunter eine kurze Zeile.
3. Wer keine passende Fahrt hat: Training öffnet sich mit einer Zeile, was nötig ist.
