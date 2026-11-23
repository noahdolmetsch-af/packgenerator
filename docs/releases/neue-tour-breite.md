# Karte «Bereit zur Abfahrt?» passt wieder auf schmale Handys

PR (offen) · 23.11.2026 · Auftrag: Bündler «sets.spec:190 als kleinen Fix-PR» (Thread «Warteliste»)

## Was ist neu
- Auf Handys mit 320 px Breite ragte die Karte «Bereit zur Abfahrt?» (Ampel auf der Packliste) 17 px über den Rand: der Pfeil in der Kopfzeile fand keinen Platz, und ein langes Wort in einer Zeile machte die Karte zu breit. Jetzt bleibt die Karte in der Breite der Seite; auf schmalen Handys rutschen Zustand und Pfeil in eine zweite Zeile, lange Wörter brechen um. Kein neuer Text, keine Daten.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur CSS in `src/lib/trip/TourAmpel.svelte` (`grid-template-columns: minmax(0, 1fr)`, `overflow-wrap: anywhere`, Kopfzeile darf umbrechen: Zustand und Pfeil rutschen auf eine zweite Zeile); keine News-Datei, weil kaum etwas zu sehen ist (Patch-Nummer).

## Entscheide
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert. Dient dem Ziel «Klarheit»: nichts ragt über den Rand.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour mit Packliste auf einem schmalen Handy (320 px) öffnen: die Karte «Bereit zur Abfahrt?» liegt innerhalb des Rands, die Seite lässt sich nicht seitwärts schieben.
2. Die Karte antippen: die Zeilen sind lesbar, lange Namen brechen um.
