# Wochenplan, Teil 3: abhaken, «Heute dran», vergangene Wochen

PR folgt · 10.11.2026 · Auftrag: Noah «freigabe … bau los» (Thread «Prüfen: Trainingsplan Woche packbar»), Reihenfolge 1 bis 5 im Umsetzungsauftrag

## Was ist neu
- **Abhaken von Hand:** in der laufenden Woche hat jede Einheit ein Häkchen (Feld mit 44 px Fläche). Ein Tipp hakt ab, ein zweiter nimmt es zurück, mit einer Meldung. Nächste Woche und die Beispielwoche haben keine Häkchen.
- **Karte «Diese Woche bisher»:** «3 von 14 Einheiten» mit Balken; Meditation und Dehnen zählen getrennt («Meditation und Dehnen: 2 von 7»), der Ruheblock zählt als Einheit, aber nicht für die Stunden.
- **Stabile Nummern:** ein Häkchen gehört zur festen Nummer der Einheit (`tennis@1`, `bikeOut#2`), nie zu «Tennis 2». Ändert sich der Plan, rutscht nichts: fällt eine Einheit weg, bleibt ihr Häkchen gespeichert und erscheint wieder, wenn sie zurückkommt.
- **Zeile «Heute dran» auf Heute** (in «Jetzt dran»): die nächste offene Einheit des Tages («Heute dran: Tennis um 15:00 · 1 weitere») mit «Erledigt ✓»; die Meldung bietet «Rückgängig». Die Zeile ist eine Art Hinweis und lässt sich unter «Zeilen wählen» abschalten (`plan`). Meditation und Dehnen stehen nicht in der Zeile, sie hakt man auf der Seite ab.
- **Vergangene Wochen eingefroren:** die Woche wird bei jedem Besuch (und bei jedem Häkchen) so gespeichert, wie sie gerade ist. Nach dem Sonntag schreibt nichts mehr hinein. Die Karte «Vergangene Wochen» zeigt bis zu zwölf davon («2. Nov. bis 8. Nov.: 7 von 9 Einheiten»), aufklappbar mit allen Einheiten und ✓ oder ○. Später geänderte Ziele berühren sie nicht. Bis zu 52 Wochen bleiben gespeichert.
- **Strava schlägt nur vor:** zu einer offenen Einheit zeigt die Seite eine passende Aktivität desselben Tages («Strava: …, 58 Min. Passt das zu dieser Einheit?», «Ja, abhaken» / «Nein»). Passend heisst: draussen und drinnen getrennt (Velo, Laufen), Tennis, Yoga, Gym; mindestens halb so lang wie die Einheit; keine Pendelfahrt; eine Aktivität dient nur einer Einheit. «Nein» merkt sich die Aktivität. Abgehakt wird nie von selbst.
- **Speicher:** neue Einstellung `training.weeklog` in `db.settings` (reist im Backup und im Sync, **keine** neue Tabelle, kein neuer Schema-Stand, kein `api/`). Test: ein Backup mit dem Verlauf wird wiederhergestellt und ist gleich; ein altes Backup ohne die Einstellung gibt einen leeren Verlauf.

## Was fällt weg oder rutscht tiefer
- nichts. «Meine Wochenziele», «Training-Woche vorschlagen» und «Verpasst? Verschieben» bleiben wie sie sind. Auf Heute kommt eine Zeile in «Jetzt dran» dazu, nur wenn ein Wochenplan gespeichert ist.

## Selbst entschieden
- **Vergleich mit dem Entwurf («Variabler Plan»):** gleich beim Häkchen vor der Zeit, durchgestrichener Name, Karte «Diese Woche» mit «N von M Einheiten» und Balken, Meditation und Dehnen getrennt, Strava-Frage mit «Ja, abhaken» / «Nein». Weicht ab, weil: (1) der Entwurf hatte den Knopf «Alle Häkchen löschen» als Vorführung; hier fehlt er, ein Tipp nimmt jedes Häkchen zurück (kein Sammel-Löschen ohne Frage und Rückgängig); (2) «Wochenstern» und «Serie» sind im Entwurf mit «BEISPIEL, NICHT ECHT» markiert und gehören zu Teil 5; (3) das Strava-Beispiel im Entwurf ist ein Knopf zum Ausprobieren, hier kommt der Vorschlag aus den echten Aktivitäten der Woche.
- **Einfrieren heisst:** die zuletzt gesehene Woche bleibt stehen. Eine Woche, die nie geöffnet wurde (weder Seite noch Heute-Häkchen), hat keinen Eintrag und erscheint nicht; die App erfindet keine Vergangenheit aus den heutigen Zielen.
- Ein Häkchen in einer vergangenen Woche ist nicht möglich (eingefroren); wer eine Einheit vergessen hat, sieht sie als ○.
- «Heute dran» zeigt nur eine Zeile, die erste offene Einheit nach Uhrzeit, und sagt «· n weitere».
- Die Zeile steht auf Ton «info» (nicht «ruhig»), damit sie wie «Weg zum Ziel» direkt unter den dringenden steht und nicht zuletzt.
- Strava: nur Lesen der schon gespeicherten Aktivitäten (`db.activities`), kein neuer Abruf, kein `api/`.
- Die Namensfrage «Wochenplan» (auch ältere Texte nennen die Einheiten aus «Trainingspläne › Ausprobieren» so) bleibt offen und kommt mit Teil 4 als a/b-Frage.
- Fertig-Regel: Seite (Katalog unverändert (drei Schritte sind das Höchste)), Absprung (bestehend; neu die Heute-Zeile), «Gut zu wissen» (bestehend), leere Ansicht («Eine Woche erscheint hier, wenn sie vorbei ist»), nächster Schritt (bestehend), app-stand (Zeile ergänzt).

## Entscheide (für decisions.md)
- nichts Neues (Entscheide von Teil 1 und 2 gelten).

## Stand im Plan (roadmap.md / vorhaben.md)
- Variabler Wochenplan (Vorhaben 18): Teil 3 von 5 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Wochenplan: bei einer Einheit dieser Woche das Häkchen setzen: «Diese Woche bisher» steigt, der Name ist durchgestrichen. Häkchen weg: es sinkt.
2. Heute: unter «Jetzt dran» die Zeile «Heute dran: …» (nur an einem Tag mit Einheit). «Erledigt ✓» tippen, in der Meldung «Rückgängig»: die Zeile ist wieder da.
3. Wochenplan ganz unten: «Vergangene Wochen». Eine Woche, die vorbei ist und die du geöffnet hattest, zeigt sich so, wie sie war.
