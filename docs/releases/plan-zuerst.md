# Tür «Plan zuerst»: Erledigt bei einer Einheit des Wochenplans

PR #1417 · 21.11.2026 · Auftrag: Noah «1-5a» (Thread «Training erfassen und auswerten vereinfachen», Umsetzungsauftrag T4) und «a» auf die Frage «Wohin zählt Erledigt bei einer Einheit?». **Datenänderung: neues Feld `unit` am Eintrag des Haken-Verlaufs und neue Einstellung `training.unitacts`, Einzelfreigabe von Noah nötig.**

## Was ist neu
- «Erledigt ✓» in «Jetzt dran» auf Heute und das Häkchen einer Einheit im Wochenplan öffnen ein kurzes Blatt: Titel «Erledigt: Tennis», die Dauer aus dem Plan ist vorgewählt (Chips 30, 45, 60, 90 und die geplante Zahl), «Wie war's?» (leicht, gut, hart) ist freiwillig, dazu «Abbrechen» und «Speichern».
- «Speichern» hakt die Einheit im Wochenplan ab (wie bisher, `training.weeklog`) und schreibt zusätzlich einen normalen Haken in den Verlauf (`flowLog`) bei der Sportart, zu der die Einheit gehört (`via: 'plan'`, `unit: 'tennis@1'`, `min`, wenn gewählt `feel`). Danach öffnet sich «Geschafft».
- Die Sportart wird einmal gefragt: das Blatt schlägt eine nach dem Namen vor (zum Beispiel «Tennis spielen» für die Einheit Tennis); die Antwort liegt in der neuen Einstellung `training.unitacts`. «Nur im Plan» hakt die Einheit ohne Verlauf ab (wie bisher) und merkt sich nichts.
- **Das Blatt kommt nur beim ersten Mal pro Art von Einheit** (Noah 21.11.: «blatt nur beim ersten mal pro sportart»). Danach ein Tipp: die Einheit ist abgehakt, im Verlauf steht die Dauer aus dem Plan, die Meldung hat «Rückgängig» (nimmt Haken und Plan-Häkchen zurück) und den Link «Was du gemacht hast».
- Im Blatt steht neben den Dauer-Knöpfen das Feld «Eigene Dauer» (Baustein aus «Eigene Dauer», PR 1347).
- «Rückgängig» auf «Geschafft» nimmt bei so einem Haken auch das Häkchen im Plan zurück; nimmt man das Häkchen im Wochenplan weg, geht auch der Haken im Verlauf weg.

## Was fällt weg oder rutscht tiefer
- Beim ersten Mal pro Art von Einheit öffnet ein Tipp auf «Erledigt ✓» oder das Häkchen zuerst das Blatt (ein Tipp mehr: «Speichern»), danach nicht mehr: ein Tipp hakt ab, mit «Rückgängig» in der Meldung.
- Die Meldung «Abgehakt: …» mit «Rückgängig» auf Heute erscheint nur noch bei «Nur im Plan» und bei Meditation, Dehnen und Ruheblock; sonst ersetzt «Geschafft» sie.
- Meditation, Dehnen und Ruheblock haken weiter sofort ab, ohne Blatt.
- Strava «Ja, abhaken» im Wochenplan hakt weiter sofort ab (Strava hat die Zeit).

## Selbst entschieden
- Der Haken im Verlauf zählt überall wie jeder andere (Wochenziele, Sterne, Geschafft); wer dieselbe Einheit zusätzlich auf Aktiv abhakt, hat zwei Haken. Das ist so gewollt («a» von Noah, eine Zählung).
- Die Zuordnung Einheit zu Sportart nach Namen (Wörter wie «tennis», «yoga», «lauf», «velo», «kraft») ist nur ein Vorschlag und immer änderbar; ohne passenden Namen ist keine Sportart vorgewählt, Noah wählt eine oder «Nur im Plan».
- Pausierte Sportarten stehen nicht zur Wahl.
- Die Sportart einer Art von Einheit lässt sich nach dem ersten Mal im Blatt nicht mehr ändern (es kommt nicht mehr). Folge-Idee: ein Link «Zählt bei … ändern» in der Meldung. Mehrere Einheiten am Tag zusammen in einem Blatt: noch nicht gebaut (Folge-PR).
- Die geplante Dauer ist vorgewählt, ein zweiter Tipp darauf nimmt sie weg (dann steht keine Dauer am Haken).
- Fertig-Regel: Seite (f.wochenplan und f.geschafft unverändert, keine neue Seite), Absprung (Blatt hängt am bestehenden «Erledigt»), «Gut zu wissen»: keine neue Karte, leerer Zustand und nächster Schritt: «Geschafft» zeigt beides, App-Stand (Zeilen «Wochenplan» und «Geschafft» ergänzt).

## Datenänderung und Prüfung (CLAUDE.md Regel 3)
- Neues, freiwilliges Feld `unit` am Eintrag von `flowLog`, neue Einstellung `training.unitacts` (`{ v: 1, map: { tennis: '<Sportart-Nummer>' } }`). Keine neue Tabelle, kein neuer Index, keine neue Schema-Version.
- Geprüft in `tests/unitdone.test.js`: Export → Import gibt Einträge mit und ohne `unit` und die Einstellung unverändert zurück, die Datei bleibt gültig; ein altes Backup ohne die Einstellung wird wie bisher eingespielt.

## Stand im Plan (roadmap.md / vorhaben.md)
- Training erfassen vereinfachen: T1 bis T4 gebaut; als Nächstes das nachträgliche Abhaken (gestern und frühere Tage) mit Start-Uhrzeit.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Wochenplan: das Häkchen einer Einheit der Woche antippen: ein Blatt öffnet sich, die geplante Dauer ist gewählt.
2. «gut» tippen, «Speichern»: «Geschafft» öffnet sich, oben steht die Sportart mit der Dauer.
3. «Rückgängig» tippen: du bist auf Aktiv, im Wochenplan ist das Häkchen weg.
