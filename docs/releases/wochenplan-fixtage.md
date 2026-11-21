# Wochenplan, Teil 4: Fixtage, Wunschzeit, Verschieben, «Warum hier?», Konflikt mit Wahl

PR folgt · 10.11.2026 · Auftrag: Noah «freigabe … bau los» (Thread «Prüfen: Trainingsplan Woche packbar»), Reihenfolge 1 bis 5 im Umsetzungsauftrag

## Was ist neu
- **Fixtage:** unter jeder Einheit, die einen festen Tag haben kann (Eishockey, Tennis, Yoga, Gym, Velo draussen und drinnen, Laufen draussen, Ruheblock), stehen die Knöpfe Mo bis So. Ein Tipp macht den Tag fix oder nimmt es zurück («Tennis am Mittwoch ist jetzt fix.»). Ein Fixtag über der Anzahl erhöht die Anzahl, wie im Planer von Teil 1.
- **Wunschzeit:** zu jedem Fixtag eine Auswahl der Startzeit (alle halbe Stunde von 06:00 bis 21:30). Sie liegt im Ziel (`training.weekplan`, gilt jede Woche).
- **Verschieben** (nur diese und die nächste Woche): bei jeder Einheit «Verschieben» öffnet Tag und Zeit. Die Einheit wandert, trägt das Zeichen «verschoben», der Rest der Woche plant sich neu. «Zurück auf den Vorschlag» nimmt es zurück, «Rückgängig» auch. Die Verschiebung gilt nur für diese Woche und liegt in `training.weeklog` unter `pins` (gleiche Einstellung wie die Häkchen aus Teil 3, **keine** neue Tabelle, kein neuer Schema-Stand, kein `api/`). Die Beispielwoche der anderen Jahreszeit lässt sich nicht verschieben.
- **«Warum hier?»:** bei jeder Einheit (ausser Meditation und Dehnen) ein Satz mit dem Grund, den der Planer als Code gibt: «Hier, weil der Tag noch leer war und kein harter Tag daneben ist.», «Ein Fixtag, den du gewählt hast.», «Von dir verschoben.», «Direkt nach dem Gym.», «Intervalle hier, weil …» und die weiteren. Zu jedem Code gibt es einen Test, dass Text und Deutsch da sind.
- **Konflikt mit Wahl:** jeder Punkt unter «Was nicht passt» bietet zwei Wege: den Ausweg («Ein Tennis weniger» oder ««Tennis» zurück auf den Vorschlag») oder **«So lassen»**. «So lassen» ändert nichts und merkt sich die Wahl nur für diesen Besuch; der Punkt bleibt mit «so gelassen» stehen. Hat ein Punkt keinen Ausweg (zum Beispiel «kein Platz»), bleibt nur «So lassen».
- Der Name «Wochenplan» steht jetzt in `docs/namen.md` (Zeile 22).

## Was fällt weg oder rutscht tiefer
- nichts. Die bisherigen Plus und Minus, «Zurück zum Grundplan» und die Häkchen bleiben wie sie sind.

## Selbst entschieden
- **Vergleich mit dem Entwurf («Variabler Plan»):** gleich bei den Tage-Knöpfen unter jeder Einheit, den Knöpfen «Warum?» und «Verschieben» an jeder Einheit, Tag und Zeit zum Wählen, «Zurück auf den Vorschlag», «Du hast die Wahl» mit Ausweg und «So lassen». Weicht ab, weil: (1) die Knöpfe heissen «Warum hier?» (so steht es im Auftrag); (2) die Wunschzeit sitzt bei jedem Fixtag in den Zielen statt auf der Einheit in der Woche, damit sie jede Woche gilt und nicht nur einmal; (3) «So lassen» wird nicht gespeichert (siehe unten); (4) Skitour-Woche und Regenwoche aus dem Entwurf fehlen noch, sie gehören zu Teil 5.
- **«Zurück zum Grundplan»** setzt nur die Ziele zurück. Verschobene Einheiten einer Woche bleiben, sie lassen sich einzeln zurücknehmen (im Entwurf wurden beide gelöscht). Das ist weniger zerstörerisch.
- **Wunschzeit für freie Einheiten** gibt es nicht als eigene Einstellung: wer eine freie Einheit auf eine feste Zeit haben will, macht daraus einen Fixtag oder verschiebt sie.
- **Reihenfolge beim Verschieben:** zwei schnelle Änderungen (Tag, dann Zeit) laufen hintereinander und überschreiben sich nicht; ein nicht gewählter Teil wird aus dem gespeicherten Stand genommen.
- **Namensfrage (a/b, ★ = meine Empfehlung):** ältere Texte nennen die Einheiten aus «Trainingspläne › Ausprobieren» auch «Wochenplan» («Zum Wochenplan», «in deinem Wochenplan»). a) ★ Die neue Seite bleibt «Wochenplan», die älteren Texte heissen «Trainingswoche». b) Beides bleibt, wie es ist. Es ist noch nichts umbenannt; die Antwort kommt mit Teil 5.
- Fertig-Regel: Seite (Katalog unverändert, drei Schritte sind das Höchste), Absprung (bestehend), «Gut zu wissen» (bestehend), leere Ansicht (bestehend), nächster Schritt (bestehend), app-stand (Zeile ergänzt).

## Entscheide (für decisions.md)
- nichts Neues (Entscheide von Teil 1 bis 3 gelten).

## Stand im Plan (roadmap.md / vorhaben.md)
- Variabler Wochenplan (Vorhaben 18): Teil 4 von 5 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Wochenplan: bei «Tennis» unter «Fixtage» «Mi» tippen: eine vierte Einheit steht am Mittwoch. «Rückgängig» tippen.
2. Bei einer Einheit «Verschieben» tippen und einen anderen Tag wählen: sie wandert und trägt «verschoben». Auf «Warum hier?» tippen: «Von dir verschoben.» und «Zurück auf den Vorschlag».
3. «Tennis» auf das Yoga am Montag um 09:30 schieben: «Was nicht passt» zeigt «Tennis zurück auf den Vorschlag» und «So lassen».
