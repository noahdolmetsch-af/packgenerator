# Gruss «Wi gahts?» D: «Woran liegt's?» und «Wie war's?» am Abend

PR (Nummer folgt) · 07.11.2026 · Auftrag: Noah «alle umsetzen» (Thread «Planen: Tagescheck mit Fragen»), Prüfliste `tagescheck/gruss-pruefliste.md`. Vierter und letzter von vier PRs (nach A #912, B #1047, C).

## Was ist neu
- Im Fenster des Grusses steht unter den Gefühlen der Knopf «Woran liegt's?» (zugeklappt). Er zeigt freiwillige Knöpfe: Schlaf, Wetter, Arbeit, Mensche, Körper, beliebig viele. Eine ruhige Zeile zählt, was in den letzten 30 Tagen genannt wurde («Schlaf 5×, Arbeit 3×»): nur Zählen, keine Deutung, kein Urteil.
- Ab 18 Uhr fragt der Gruss «Wie war's?» statt «Was häsch vor?»: Wörter für den Tag (Gschafft, Schön, Streng, Gmüetlech, Mühsam, Spannend) und das Textfeld. Tagsüber bleibt alles wie bisher.
- Beide Listen stehen unter «Knöpfe anpassen» (und auf Ich › Deine Fragen › «Knöpfe im Gruss»): hinzufügen, umbenennen, ausblenden, löschen (Rückgängig), ordnen.
- Die Antworten gehen in dieselbe Geschichte «Deine Abfragen» (`hallo.grund`, `hallo.tag`). Die Stimmung geht wie bisher in den Balance-Ring (Spass); «Woran liegt's?» und «Wie war's?» zählen dort nicht.

## Was fällt weg oder rutscht tiefer
- Am Abend (ab 18 Uhr) steht im Fenster «Wie war's?» an der Stelle von «Was häsch vor?». Wer abends einen Plan eintragen will: Das Textfeld bleibt, die Plan-Knöpfe sind erst morgens (6–18 Uhr) da. Sollen sie auch abends bleiben, ist es ein kleiner PR.

## Selbst entschieden
- «Abend» ist 18:00–21:59 wie bei der Tagesuhr; nachts gibt es das Fenster nicht (Nachttext).
- Die Zähl-Zeile erscheint nur, wenn es etwas zu zählen gibt, und nennt höchstens drei.
- Eine schon gespeicherte Knopf-Liste (aus B/C) bekommt die zwei neuen Listen mit den Standardwörtern.
- Kein Eintrag in `features.js`: Teil des Grusses; `app-stand.md` nennt es in der Zeile «Heute».

## Entscheide (für decisions.md)
- 05.11.2026: «Woran liegt's?» ist freiwillig und nur Zählen; am Abend fragt der Gruss nach dem Tag (Noah «alle umsetzen»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Gruss-Ausbau: Schritt D von D (fertig).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute, Gruss antippen, «Woran liegt's?» öffnen, ein, zwei Dinge wählen.
2. Wieder öffnen: unter den Knöpfen steht die Zähl-Zeile.
3. Abends (ab 18 Uhr) Gruss antippen: «Wie war's?» mit Wörtern für den Tag.
