# Ideen gehen nicht aus

PR #NNNN · 27.11.2026 · Auftrag: Noah («ich kann nicht mehr ideen laden. bitte verbessern»)

## Was ist neu
- Jeder Bereich in Auswerten › Verlauf › Ideen hat sechs Tipps. «Andere Idee» zeigt den nächsten, «Mag ich» legt den Tipp in deine Ideen und bringt den nächsten.
- Die weiteren Bereiche (unter «n weitere Bereiche») sind volle Karten mit den gleichen Knöpfen, nicht mehr nur eine Zeile.
- Ein Tipp, den du schon in deinen Ideen hast, kommt nicht nochmals. Sind alle sechs drin, sagt die Karte das.
- Der Pfad über «Ideen» zeigt am Computer die Seite nur einmal.

## Was fällt weg oder rutscht tiefer
- Die kleine Liste der weiteren Bereiche (Name, Zahl, ein Tipp als Text) fällt weg; an ihrer Stelle stehen volle Karten.

## Selbst entschieden
- Sechs Tipps pro Bereich (der bisherige und fünf neue), auf Deutsch geschrieben, ohne Gesundheitsversprechen.
- Die Stelle im Tipp-Stapel wird pro Bereich im Gerät gemerkt (`ideas.tipIx`), damit «Andere Idee» nach dem Neuladen nicht von vorn beginnt.
- «Jetzt nicht» bleibt nur bei den drei schwächsten Bereichen (dort ruht der Tipp 7 Tage); bei den weiteren Bereichen gibt es nichts zu verstecken.
- Fertig-Regel: Seite, Absprung und Hilfe bestehen schon (Ideen); neue Texte laufen durch `t()`; Leerzustand: «Alle Ideen dieses Bereichs sind schon in deinen Ideen.»

## Entscheide (eigene Datei `docs/decisions/ideen-mehr.md`)
- 27.11.2026: Ideen gehen nicht aus, «Andere Idee» und «Mag ich» bringen den nächsten Tipp.

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Verlauf › Ideen: bei einer Karte «Andere Idee» tippen, Seite neu laden, der Tipp bleibt.
2. «Mag ich → in meine Ideen»: Tipp steht unten in «Meine Ideen», die Karte zeigt den nächsten.
3. «weitere Bereiche» öffnen: jede Karte hat beide Knöpfe.
4. Am Computer: der Pfad über dem Titel nennt «Ideen» nur einmal.
