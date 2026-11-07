# Jetzt dran: nur was dringend ist

PR (Jetzt dran, Frage 3) · 5.11.2026 · Auftrag: Noah «3a» (Thread «Überdenke die Kachel «Jetzt dran»»)

## Was ist neu
- «Jetzt dran» zeigt und zählt nur noch Zeilen mit rotem, gelbem oder blauem Punkt (dringend, bald, Information). Die Zahl oben rechts stimmt damit mit den Zeilen überein (Beispiel mit fiktiven Daten: vorher 10, nachher 6).
- Die ruhigen Hinweise (grauer Kreis) stehen eingeklappt darunter in einer Zeile «Gut zu wissen · N»: Ausblick Verschleiss («Kette wachsen …»), «Velos wägen», «Teile seit 12 Monaten auf keiner Tour», bessere Ausrüstung, Aufräumen von Testtouren, nächster Ziel-Schritt ohne Termin.
- Ist nichts dringend, sagt «Jetzt dran» «Nichts Dringendes» und zeigt die eingeklappte Zeile weiter. Der Satz unter der Begrüssung («N Dinge stehen heute an») zählt nur noch Dringendes.

## Was fällt weg oder rutscht tiefer
- Die ruhigen Zeilen rutschen aus «Jetzt dran» hinter «Gut zu wissen · N» (ein Tipp öffnet sie). Alle Knöpfe der Zeilen bleiben.
- Auch «Alle N zeigen» zählt nur noch Dringendes.

## Selbst entschieden
- «Dringend» heisst: jede Zeile, die nicht den Ton «ruhig» hat. Welche Zeile ruhig ist, steht wie bisher im Code bei der Zeile (`tone: 'quiet'`).
- Die Zeile «Gut zu wissen» ist beim ersten Öffnen zu und merkt sich den Zustand nicht (kein neuer Speicher).
- Zwei Prüfungen in `home-0460.spec.js` (Zeilen zählen, Testtouren aufräumen) sind auf den neuen Ort angepasst, ausdrücklich so gewollt.

## Entscheide (für decisions.md)
- 5.11.2026: «Jetzt dran» nur für Dringendes; ruhige Hinweise eingeklappt unter «Gut zu wissen», Zähler nur Dringendes (Noah «3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Jetzt dran: Frage 3 «3a» umgesetzt; Frage 4 («Später» plus Schalter pro Zeilenart) folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute: unter «Jetzt dran» haben alle Zeilen einen roten, gelben oder blauen Punkt, die Zahl oben passt.
2. «Gut zu wissen · N» antippen: die ruhigen Hinweise öffnen sich, nochmals tippen schliesst sie.
