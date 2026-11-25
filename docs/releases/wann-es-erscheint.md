# Wann eine Funktion erscheint

PR #<Nummer> · 27.10.2026 · Auftrag: Noah «2a» (Thread «332 Use Cases sichtbar machen»)

## Was ist neu
- 17 Funktionen zeigen sich nur in der passenden Lage (z. B. Vorabend, Auslandstour, nach drei Wochen Pause). Im Katalog «Was die App alles kann» steht bei ihnen jetzt eine Zeile mit Uhr: wann sie erscheinen.
- Die Sätze stehen in `src/lib/know/wann.js`. In `heimat.js` haben diese 17 jetzt den Grund `when` statt `name`; ein Test prüft, dass beide Listen gleich sind.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Eine eigene Zeile in Schräg mit kleiner Uhr unter dem Text, statt den Text selbst zu ändern; so bleibt der Text kurz (zwei Zeilen).
- «Tipp der Woche» zählt zu den 17: die Kachel kommt nur, solange es noch nicht ausprobierte Tipps gibt.

## Entscheide (für decisions.md)
- 27.10.2026: Funktionen, die nur in ihrer Lage erscheinen, sagen im Katalog wann (Noah «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- 332 Use Cases sichtbar: die 17 «nur in der passenden Lage» sind erklärt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne «Was die App alles kann» und suche «Bereit für morgen».
2. Unter dem Eintrag steht «Erscheint am Vorabend einer Tour.» mit einer kleinen Uhr.
3. Suche «Ausland»: «Erscheint bei einer Tour in einem anderen Land.»
