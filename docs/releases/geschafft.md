# Nach dem Abhaken: die Seite «Geschafft»

PR folgt · 19.11.2026 · Auftrag: Noah «1-5a» (Thread «Training erfassen und auswerten vereinfachen», Umsetzungsauftrag T1: nur die Seite, keine neue Datenstruktur)

## Was ist neu
- Neue Seite «Geschafft» (`#/flow/geschafft?e=<Eintrag>`): oben was du gemacht hast (Aktivität, Dauer wenn bekannt, Quelle: von dir, Strava, Stoppuhr, Plan), darunter ein beobachtender Satz («Das 2. Mal diese Woche», nur Zählung, nie Wertung).
- Karte «Diese Woche»: Stunden (nur aus Einträgen mit Dauer), die sieben Tage mit Haken, «n Tage mit Training». Der Balken «von 6 h Wochenziel» erscheint nur, wenn du ein Stundenziel gesetzt hast (Training › Stundenziel, sonst die Stunden des Wochenplans). Kein erfundenes Ziel.
- Karte «Wochenziele»: die offenen Wochenziele, die der gerade abgehakten Aktivität zuerst (erreicht steht als «erreicht»).
- Bei einer Strava-Aktivität: Vergleich mit dem letzten Mal derselben Sportart (Zeit, Strecke, Puls Ø, «Nur zum Anschauen»). Ohne Strava-Zahlen steht eine stille Zeile.
- Eine Zeile «Heute ein neuer Stern», wenn heute für diese Aktivität ein Stern erreicht wurde, mit Weg zu den Meilensteinen.
- Genau ein nächster Schritt: «Zurück zu Aktiv»; hat der Wochenplan noch eine offene Einheit, steht sie als «Als Nächstes: Do 15:00 · Tennis». Dazu «Alle Zahlen zu diesem Training» (Sportseite), «Meilensteine» und «Rückgängig».
- Die Meldung nach dem Abhaken sagt jetzt «Als Nächstes: Was du geschafft hast» und führt zur Seite.

## Was fällt weg oder rutscht tiefer
- Die zwei Links «Dein Verlauf» und «Meilensteine» in der Meldung nach dem Abhaken. Neu: ein Link «Was du geschafft hast»; «Alle Zahlen zu diesem Training» (= bisher «Dein Verlauf») und «Meilensteine» stehen auf der Seite «Geschafft».
- Sonst nichts. Die Sportseite («Dein Verlauf») bleibt unverändert.

## Selbst entschieden
- Die Seite springt nach dem Abhaken **nicht** von selbst auf (Regel A, 14.10.2026: nichts springt). Sie ist über die Meldung erreichbar, überall wo abgehakt wird (Aktiv, Heute, Erholung, Stoppuhr). Das Aufspringen beim Tippen auf eine Kachel in «Heute abhaken» kommt mit T2, wie von Noah entschieden.
- Dauer und «Gefühl» lassen sich auf der Seite noch nicht ergänzen (das braucht das neue Feld «Gefühl»: T2, Einzelfreigabe).
- «Wochenstunden» zählen nur Aktivitäten des Rings «Bewegen» und nicht den Arbeitsweg; Einträge ohne Dauer zählen als Tag, nicht als Stunden (dann steht «Ohne Dauer zählen nur die Tage»).
- «Rückgängig» auf der Seite nimmt dasselbe zurück wie die Meldung (auch einen dabei gewonnenen Stern). Nach einem Neuladen der App nimmt es nur das Abhaken zurück, die Sterne bleiben (Sterne gehen nie verloren).
- Die Sterne-Meldung (kleines Fenster «Neuer Stern») bleibt wie sie ist; die Seite hat zusätzlich die Zeile.
- Der Vergleich nimmt die letzte Strava-Aktivität desselben Typs (Ride ist nicht GravelRide).
- Die Sportseite behält ihren Namen «Dein Verlauf»; «Geschafft» ist in `docs/namen.md` Nr. 25.
- Fertig-Regel: (1) Seite in `features.js` (`f.geschafft`), (2) Absprung: die Meldung nach jedem Abhaken, (3) «Gut zu wissen»: nicht gebaut, die Seite steht nicht in `ON_PAGES` (keine Karte «Was du hier tun kannst» dort), (4) leerer Zustand: «Noch nichts abgehakt …» mit «Zurück zu Aktiv», (5) nächster Schritt: «Zurück zu Aktiv» und die nächste Einheit, (6) Zeile in `docs/app-stand.md`.

## Entscheide (für decisions.md)
- 19.11.2026: Die Seite nach dem Abhaken heisst «Geschafft» (Noah «1-5a»); Reihenfolge Seite zuerst, dann die Türen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Training erfassen vereinfachen: T1 (Seite «Geschafft») gebaut; T2 «Haken zuerst», T3 «Von selbst», T4 «Plan zuerst» folgen als eigene PRs, T2 und T3 mit Einzelfreigabe wegen des neuen Feldes «Gefühl». Auswerten (18 Reiter auf 5) bleibt Schritt 12 des Gesamtplans.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › «Heute abhaken»: eine Kachel antippen; in der Meldung unten auf «Was du geschafft hast» tippen.
2. Auf «Geschafft»: oben steht, was du gemacht hast, darunter «Das … Mal diese Woche», «Diese Woche» mit den sieben Tagen und die Wochenziele.
3. «Rückgängig» tippen: das Abhaken ist weg und du bist wieder auf Aktiv.
