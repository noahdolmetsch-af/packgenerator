# Fragen: langes Wort

Auftrag: Noah «Ok» (Thread «Beheben roten Nacht-Rundgang»), dritter Fund des Nacht-Rundgangs vom 08.11.2026: `#/me/abfragen` wurde mit einem sehr langen Namen 849 statt 390 px breit (schon am 07.11. rot).

## Was ist neu
- In «Wi gaht's?» bricht ein sehr langer Name einer Regel oder Frage in seiner Zeile um. Vorher wurde die Seite breiter als das Handy und die Leiste unten rutschte nach rechts weg.
- Technisch: die Textspalte der Zeilen (`.rm` in `src/pages/Abfragen.svelte`) darf schmaler werden (`minmax(0, 1fr)`), der Name (`b`) bricht mit `overflow-wrap: break-word`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur die Zeilen `.rm` angefasst; die anderen Zeilen der Seite (`.nm`, `.ich-m`) waren im Test nicht auffällig.
- Kein Eintrag in `docs/app-stand.md`: keine neue Seite, keine neue Funktion.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wi gaht's? auf dem Handy: «Eigene Regel erstellen» mit einem sehr langen Namen ohne Leerzeichen.
2. Der Name bricht in der Zeile um, die Leiste unten bleibt vollständig sichtbar.
