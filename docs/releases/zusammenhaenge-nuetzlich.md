# Zusammenhänge, mit denen du etwas anfangen kannst

Auftrag: Noah «ja» (Thread «Zusammenhänge nützlicher machen», 23.11.2026). Seite: Auswerten › Körper › Zusammenhänge (`#/me/insights`).

## Was ist neu
- **Deine stärksten Hebel** ganz oben (bis 3): was du selbst tun kannst (Schlaf, Velo, Meditation, Schritte, Aktivzonenminuten, jede Aktivität aus Aktiv) und womit es in den letzten 90 Tagen einherging, mit Tipp («Probier es heute: früher ins Bett»). Nur in die gute Richtung (mehr Akku, Stimmung, Schlaf, HRV, tieferer Ruhepuls), jede Sache nur einmal. Ruhepuls, Wetter und Termine sind keine Hebel.
- **Alle Aktivitäten** aus Aktiv (Training, Sauna, Kaltwasser, Freunde, Meditation, Gewohnheiten) werden mit Schlaf (Fitbit), Schlafgefühl, Ruhepuls, HRV, Akku und Stimmung verglichen, am gleichen Tag und am Tag danach. Gezählt wie in Analyse (`countedActs`: Haken plus Strava-Sportarten ohne Haken). Eine Aktivität braucht 6 Tage mit Haken und darf nicht an fast jedem Tag stehen; höchstens 8, die meistgehakten zuerst. Weil das viele Paare sind, gilt für sie |ρ| ≥ 0.35 und je 5 Tage auf beiden Seiten.
- **Jeder Satz und jeder Hebel ist antippbar**: ein kleines Bild mit den Tagen mit und ohne nebeneinander (ein Punkt pro Tag, ein Strich für das Mittel). `MitOhne.svelte`, nur Anschauen.
- **«Teste es 14 Tage»** bei allem, was man tun kann: legt unter «Experiment mit Ende» einen Test an (Frage, Ziel, 14 Tage, gemessen am Wert), dessen Rückblick nach 14 Tagen das Ergebnis neben die 14 Tage davor stellt. Läuft schon einer mit der gleichen Frage, steht dort «Dein Test läuft».
- **«Bald sichtbar: N Zusammenhänge»** statt der langen Liste «Sammelt noch Tage»: ab 7 Tagen zählt ein Paar als bald sichtbar; schon ab 8 Tagen zeigt eine Zeile den ersten Trend («noch nicht sicher»). Die ganze Liste bleibt aufklappbar dahinter.
- **Runde Schwellen**: «mehr als 9.6 km» wird «mehr als 10 km», Schlaf in halben Stunden, Schritte in 500ern, Minuten in 5ern; nur wenn auf beiden Seiten noch Tage bleiben.
- **Pfad** richtiggestellt: Auswerten › Körper › Zusammenhänge (stand: Ich › Daten).
- HRV ist ein neuer Wert in den Sätzen.

## Was fällt weg oder rutscht tiefer
- Die lange Liste «Sammelt noch Tage» steht nicht mehr offen, sondern hinter «Alles, was noch Tage sammelt» (aufklappen: gleiche Liste).
- Die Überschrift «Zusammenhänge» über den Sätzen heisst jetzt «Alles, was zusammenhängt» (stand doppelt zur Seitenüberschrift).
- Sonst nichts; alte Sätze, Schalter für eigene Fragen und der Ruhepuls-Hinweis sind unverändert.

## Selbst entschieden
- Hebel nur in die gute Richtung; Dinge, die etwas verschlechtern («Bremsen»), baue ich nicht (Noah wählte nur 2 und 3 von meinen Ideen).
- Gewohnheiten sind Aktivitäten in Aktiv und laufen so mit; Aktivitäten ohne Haken zählen nicht als «nicht gemacht» (wie Velo-km und Meditation: ein Tag ohne Haken gilt nur an Tagen mit Antwort oder Fitbit-Zeile als 0).
- Meditation gegen Stimmung am gleichen Tag bleibt der bisherige Satz, damit er nicht doppelt steht.
- Keine neue Funktion im Katalog (die Seite ist `f.insights`), keine Änderung an Datenbank, Backup, Sync oder `api/`: der Test liegt in der bestehenden Einstellung «Experiment mit Ende».
- «Gut zu wissen» und die Zeile «Passt hier» der Seite bleiben; der Hinweis zu den Aktivitäten steht in der Karte «Ebenfalls verglichen».

## Entscheide (eigene Datei `docs/decisions/zusammenhaenge-nuetzlich.md`)
- 23.11.2026: Noah «ja» zum 6-Punkte-Plan; Bremsen nicht bauen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Folgt als kleine PRs: Muster (wenig Schlaf, viele Aktivzonenminuten, Sportarten, Wochentage), Wetter und Training, Erholungszeit, Gegenbeispiele, «Neu diese Woche», Bester Bereich, Heute-Zeile.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Körper › Zusammenhänge: oben «Deine stärksten Hebel», jeder mit «Probier es heute: …».
2. Auf einen Hebel oder Satz tippen: ein Bild mit den Tagen «Mit …» und «Sonst».
3. «Teste es 14 Tage» tippen: «Dein Test läuft» erscheint, «Test öffnen» führt zu «Experiment mit Ende».
4. Weiter unten «Bald sichtbar: N Zusammenhänge»; «Alles, was noch Tage sammelt» öffnet die alte Liste.
5. Oben im Pfad steht «Auswerten › Körper».
