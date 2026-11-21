# Tür «Haken zuerst»: abhaken, danach Dauer und Gefühl

PR #1308 · 20.11.2026 · Auftrag: Noah «1-5a» (Thread «Training erfassen und auswerten vereinfachen», Umsetzungsauftrag T2). **Datenänderung: neues Feld `feel` am Eintrag des Hakens, Einzelfreigabe von Noah nötig.**

## Was ist neu
- Auf Aktiv hakt ein Tipp auf eine Kachel in «Heute abhaken» wie bisher sofort ab und öffnet danach die Seite «Geschafft» für diesen Haken. Die Meldung unten wird dabei geschlossen (die Seite hat ihr eigenes «Rückgängig»).
- Auf «Geschafft» steht oben eine freiwillige Karte «Freiwillig: wie lange und wie war es»: Chips für die Dauer (30, 45, 60, 90 Min) und für das Gefühl (leicht, gut, hart). Nichts ist vorgewählt; ein zweiter Tipp auf den gewählten Chip nimmt die Antwort zurück, ein anderer ersetzt sie.
- Die Dauer steht danach oben in der Kopfzeile und zählt in «Diese Woche». Bei einem Haken von Strava gibt es keine Dauer-Chips (Strava hat die Zeit), das Gefühl schon.
- Neues Feld `feel` am Eintrag im Verlauf (`flowLog`): `light`, `good` oder `hard`. Alte Einträge ohne `feel` bleiben gültig; das Backup nimmt das Feld mit, ohne dass sich das Datenformat (Tabellen, Version) ändert.

## Was fällt weg oder rutscht tiefer
- Auf Aktiv bleibt ein Tipp auf eine Kachel nicht mehr auf der Seite stehen, sondern öffnet «Geschafft»; zurück geht es mit «Zurück zu Aktiv». Die Meldung «… abgehakt» mit «Rückgängig» erscheint dort nicht mehr (das «Rückgängig» steht auf der Seite). Ein zweiter Tipp auf eine abgehakte Kachel nimmt wie bisher zurück und bleibt auf Aktiv.
- Auf Heute (Kachel «Im Flow», «Aktiv heute») springt nichts: dort bleibt es bei der Meldung mit dem Link «Was du geschafft hast».
- Der kleine Hinweis «fast ein nächster Stern» aus der Meldung erscheint auf Aktiv nach dem Abhaken nicht mehr (die Seite zeigt nur neue Sterne). Siehe «Selbst entschieden».
- Der Weg über langes Drücken und ••• bleibt unverändert.

## Selbst entschieden
- Das Gefühl wird als Wort gespeichert (`light`, `good`, `hard`), nicht als Zahl; Anzeige leicht, gut, hart.
- Die Dauer-Chips gelten auch für Haken der Stoppuhr und des Plans, nicht für Strava und nicht für den Arbeitsweg. Das Gefühl gilt für alle.
- Die Chips stehen für jeden Haken, den man auf der Seite ansieht (auch am nächsten Tag), nicht nur direkt danach. So lässt sich nachtragen.
- Gefühl und Dauer ändern nichts an Zielen, Sternen oder Zählungen ausser an den Wochenstunden (die zählen Dauer).
- Das 1-bis-10-«Wie anstrengend» der Strava-Aktivitäten (`feelToAsk`) bleibt unberührt; es kommt mit T3.
- Der Hinweis «fast ein nächster Stern» war eine Zeile der Meldung. Er kommt nicht auf die Seite, weil das ein eigener Schritt wäre; die Meldung selbst bleibt ausserhalb von Aktiv.
- Fertig-Regel: Seite (`f.geschafft` ergänzt, Schritte und Beispiel neu), Absprung (die Kachel auf Aktiv führt direkt hin, sonst die Meldung), «Gut zu wissen»: keine Karte auf dieser Seite, leerer Zustand und nächster Schritt wie in T1, App-Stand (Zeile «Geschafft» ergänzt, Aktiv-Zeile geändert).

## Entscheide (für decisions.md)
- 19.11.2026: Tippen auf eine Kachel in «Heute abhaken» hakt sofort und öffnet «Geschafft» mit den freiwilligen Feldern Dauer und Gefühl (Noah «1-5a»).

## Datenänderung und Prüfung (CLAUDE.md Regel 3)
- Neues, freiwilliges Feld `feel` am Eintrag von `flowLog`. Kein neuer Index, keine neue Tabelle, keine neue Schema-Version; Einträge ohne das Feld bleiben gültig.
- Geprüft in `tests/feel.test.js`: Export → Import gibt Einträge mit und ohne `feel` unverändert zurück, die Datei bleibt gültig; ein altes Backup ohne `feel` wird wie bisher eingespielt.

## Stand im Plan (roadmap.md / vorhaben.md)
- Training erfassen vereinfachen: T1 (Seite «Geschafft»), T2 (Tür «Haken zuerst») gebaut; T3 «Von selbst» und T4 «Plan zuerst» folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › «Heute abhaken»: eine noch nicht abgehakte Kachel antippen: die Seite «Geschafft» öffnet sich.
2. «45 Min» und «gut» tippen: beide sind markiert, oben steht «· 45 Min».
3. «gut» noch einmal tippen: es ist wieder weg. Dann «Rückgängig» tippen: das Abhaken ist weg und du bist wieder auf Aktiv.
