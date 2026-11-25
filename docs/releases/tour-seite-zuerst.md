# Tour-Seite: Packliste zuerst

PR #1776 · 24.11.2026 · Auftrag: Noah 24.11.2026 07:37 UTC «1-5a» (impeccable ganze App, Welle 1, Paket 2; Bericht `touren.md`, Fund 1)

## Was ist neu
- Auf `#/pack` steht die Packliste gleich nach dem Kopf: auf dem Handy bei etwa 1190 px statt bei 2850 px (Gesamttest-Daten, 390 px breit). Am Computer stand sie schon links vorn.
- Eine Chip-Reihe statt 19 Chips: Aufgaben, Strecke, Wetter und «Alle n ›». «Alle n ›» öffnet ein Fenster «Auf dieser Seite» mit jeder Sprungmarke der Seite (auch «Packliste», «Zwiebel-Check», «Planen B» …).
- Eine Zeile vor der Liste: «12–22 °C · trocken · Zwiebel: passt ›». Ein Tipp führt zur Karte mit den Bedingungen und der Zwiebel.
- Am Handy kommen unter den Taschen zuerst das Gewicht, dann Velo und Taschen, danach die Strecke.
- Die Angaben im Kopf (Datum, Dauer, Velo, Wetter, Gewicht) sind am Handy ruhiger Text statt vier Pillen; jede bleibt ein eigener 44-px-Tipp.

## Was fällt weg oder rutscht tiefer
- Das Band «Alles bleibt änderbar, bis du losfährst. Als Vorlage speichern»: der Satz steht jetzt in der geschlossenen Karte «Bereit zur Abfahrt?»; «Als Vorlage speichern» steht im Menü «…» der Packliste (dort war es schon).
- Die zweite Sprungleiste «Auf dieser Seite: Ans Wetter angepasst» fällt weg (die Reihe oben und «Alle n» ersetzen sie).
- 16 Sprung-Chips rutschen hinter «Alle n ›» (ein Tipp mehr).
- «Strom: …», «Wie anstrengend wird es?», das Rezept und der Tipp des Tages rutschen unter die Liste.
- Am Handy rutschen die Bedingungen (Dauer, Pro Tag, Wetter, Zwiebel) und «Ans Wetter angepasst» unter die Liste; die Zeile vor der Liste führt hin. Am Computer stehen sie wie bisher rechts neben der Liste.
- Am Handy rutscht die Strecke unter Gewicht und Velo mit Taschen.

## Selbst entschieden
- Die Angaben im Kopf bleiben einzelne Tipps (ein Fenster je Angabe) und werden nicht zu einer Zeile verschmolzen: das bestehende Fenster ändert immer nur eine Angabe, und «Velo ändern» soll ein Tipp bleiben.
- Das Kürzel «Tour · in 5 Tagen · Standard» über dem Titel bleibt (eine kleine Zeile).
- Die Falte «Gewicht · Basisgewicht» unter der Liste bleibt vorerst; sie in die Karte «Gewicht» zu legen (Fund 4) ist ein eigener Schritt, damit dieser PR klein bleibt.
- Der Wächter prüft «Packliste vor 1200 px» am Handy: die Karte «Gehört zu» über dem Titel (Paket 12) ist noch offen; sobald sie eine geschlossene Zeile ist, gilt das Ziel 700 px.
- Mit PR 1514 (Packen in Schritten): beide ändern `CalmPack.svelte`; wer später kommt, löst die Konflikte.

## Entscheide (eigene Datei `docs/decisions/tour-seite-zuerst.md`)
- 24.11.2026: Hauptsache zuerst, je Seite ein PR (Noah «1-5a»)

## Stand im Plan (roadmap.md / vorhaben.md)
- Impeccable ganze App: Welle 1, Paket 2 (Tour-Seite) erledigt; Fund 4 (Falte «Gewicht» in die Karte) offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Packliste einer Tour am Handy öffnen: Titel, eine Chip-Reihe, die Zeile mit dem Wetter, «Bereit zur Abfahrt?», dann «Packliste».
2. «Alle n ›» tippen: das Fenster zeigt alle Teile der Seite; «Wetter» führt zur Karte mit den Bedingungen.
3. Ans Ende der Seite scrollen: «Gewicht», «Velo und Taschen», dann «Strecke».
