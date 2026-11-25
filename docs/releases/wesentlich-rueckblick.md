# Was mir wesentlich ist: Quartals-Erinnerung und Vergleich mit früher

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «8b» (Thread «Bauen: Freie Zeit Teil 2»), Idee «Was mir wesentlich ist – einmal pro Quartal eine Erinnerung, die Antworten neu anzusehen; Vergleich mit früher»

## Was ist neu
- Drei Monate (91 Tage) nach dem letzten Eintrag zeigt Heute eine ruhige Zeile: «Seit 3 Monaten hast du nicht mehr aufgeschrieben, was dir wesentlich ist. Schaust du es dir wieder an?» mit «Ansehen» und «Später» (wartet 14 Tage). Sie erscheint wie der Impuls des Tages nur, wenn sonst nichts Dringendes ansteht.
- Auf der Seite steht ein Schalter «Auf Heute erinnern» (vorgewählt an, jederzeit aus). Ist die Zeit um, sagt die Seite es auch oben.
- Neu «Damals und heute»: ab zwei Einträgen steht der neueste neben einem früheren (vorgewählt: der von etwa drei Monaten davor; im Auswahlfeld frei wählbar) mit den Wörtern, die geblieben, neu oder weg sind. Der Hinweis sagt ehrlich: Das ist nur ein Hinweis aus den Wörtern.
- Nichts wird verschickt; es gibt keine Benachrichtigung ausserhalb der App.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Standard «an», weil Noah die Erinnerung gewählt hat; sie ist leise (eine Zeile, «Später», ein Schalter).
- Vergleich nur über Wörter (ab 4 Buchstaben, ohne Füllwörter, Deutsch und Englisch), keine KI und kein Netz.
- Heute: kleine Änderung in `Home.svelte` (Zeile und Bedingung «nichts Dringendes»), neue Datei `src/lib/home/WesentlichHint.svelte`.
- Fertig-Regel: Seite und Absprung bestehen (`f.freiwesentlich`); keine neue Seite.

## Entscheide (für decisions.md)
- 05.11.2026: Die Quartals-Erinnerung ist eine ruhige Zeile auf Heute, keine Benachrichtigung.

## Stand im Plan (roadmap.md / vorhaben.md)
- Freie Zeit, Ergänzung «Was mir wesentlich ist»: gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Freie Zeit › Was mir wesentlich ist: zwei Einträge; darunter «Damals und heute» mit Geblieben / Neu / Weg.
2. Den Schalter «Auf Heute erinnern» aus- und anschalten.
3. Nach drei Monaten ohne neuen Eintrag: Heute zeigt die Zeile; «Später» blendet sie für zwei Wochen aus.
