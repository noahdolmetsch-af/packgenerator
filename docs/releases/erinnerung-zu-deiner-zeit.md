# Erinnerung zu deiner Zeit

PR #? · 27.10.2026 · Auftrag: Noah «ich möchte alle umsetzen 1a 2a 3a 4a 5a» (Thread «Brainstormen intelligentere vernetzte App», Idee A2)

## Was ist neu
- Die App merkt sich, um welche Zeit du den Abend-Check am Vorabend einer Tour öffnest (ab 16:00, der erste Mal pro Abend, die letzten 8 Abende).
- Ab 3 Abenden schlägt sie auf «Gepackt» und unter Ich › Erinnerungen aufs Handy vor: «Du machst den Abend-Check meist um 21:30. Erinnerung auf 21:15 verschieben?» mit «Verschieben» und «Nein, danke».
- «Verschieben» ändert die Zeit in Eigene Werte und bietet «Rückgängig».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Zuerst nur die Abend-Erinnerung: sie ist die einzige Erinnerung mit einer festen Uhrzeit, die die App selbst setzt und bei der man den Moment des Erledigens sieht (Öffnen des Abend-Checks).
- Vorschlag = Mittelwert (Median) minus 15 Minuten, auf eine Viertelstunde; nur wenn er mindestens 30 Minuten von der heutigen Zeit abweicht.
- «Nein, danke» merkt sich genau diesen Vorschlag; ändert sich deine Gewohnheit, kommt ein neuer.
- Die gemerkten Zeiten liegen in den Einstellungen (`remindLearn`), also auch in der Sicherung.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «App denkt mit» A2 gebaut; als Nächstes A3 (freie Zeit plus gutes Wetter).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Vorabend einer Tour den Abend-Check öffnen, an drei Abenden etwa zur gleichen Zeit.
2. Danach zeigt «Gepackt» die Frage «Erinnerung auf … verschieben?»; «Verschieben» ändert die Zeit unter Ich › Eigene Werte.
