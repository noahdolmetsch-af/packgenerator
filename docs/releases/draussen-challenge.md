# Draussen-Challenge: Tagesziel in Minuten auf Heute

Auftrag: Noah 21.11.2026 20:13 UTC («jeden Tag mindestens 90 Minuten draussen … bis zum 31.12.2026 … erinnern und tracken»), Antworten «1a 2b 3a 4a» 20:20 UTC. Thread «Challenges in den Vordergrund stellen».

## Was ist neu
- Eine Karte «Draussen» oben auf Heute (unter den Gewohnheiten): Minuten von heute gegen das Tagesziel (90 Min), «noch 35 Min», ein Balken, jeder Tag der Challenge als Punkt (geschafft, verpasst, heute), Tage in Folge.
- Gezählt wird von selbst, was Strava als draussen kennt (Gehen, Wandern, Laufen, Velo nicht auf der Rolle, Ski, Schneeschuh, Kajak und Paddeln) und was du von Hand dazuzählst, ohne Sportart: +15, +30, +60 oder eigene Minuten, mit Rückgängig (zum Beispiel eine Schneeschuhwanderung mit 120 Min).
- Ab 16 Uhr hat ein noch offener Tag einen stärkeren Rahmen; mit Heimatort steht dort, wann die Sonne untergeht und wann du spätestens losgehst.
- Start: eine ruhige Zeile «Eine Challenge mit Tagesziel starten?» mit «Start» (Fenster: Name, Minuten pro Tag, erster und letzter Tag; vorbelegt 90 Min bis 31.12.) und «Jetzt nicht» (kommt nach 30 Tagen wieder). Ändern, Beenden und Löschen (mit Rückgängig) hinter dem Stift.
- Nach dem letzten Tag zeigt die Karte «n von 40 Tagen geschafft» mit der Zeit draussen insgesamt, «Schliessen» oder «Neue starten».

## Was fällt weg oder rutscht tiefer
- Nichts. Die Karte kommt dazu; die Gewohnheiten rutschen bei laufender Challenge um eine Karte nach unten.

## Selbst entschieden
- Neue Einstellung `outdoor` in den Einstellungen (Backup und Geräteabgleich nehmen sie wie jede Einstellung mit): Name, Minutenziel, erster und letzter Tag, Minuten von Hand je Tag, beendet, geschlossen. Keine neue Tabelle, keine Schema-Version. Wegen der Daten: Einzelfreigabe.
- Strava-Minuten werden direkt aus den gespeicherten Aktivitäten gelesen (nicht aus den Haken von Aktiv), weil dort pro Sportart und Tag nur eine Aktivität zählt; mehrere Spaziergänge am Tag zählen so alle.
- Ein Tag zählt streng ab dem Tagesziel (89 Min zählen nicht); verpasste Tage brechen die Challenge nicht ab, sie bleiben sichtbar. Jokertage gibt es nicht (Noah: «jeden Tag»).
- Das Wort in der App ist «Challenge» (Noahs Wort); die ältere «Vorhaben»-Zeile in Meilensteine bleibt, wie sie ist.
- Die Karte steht bei den Gewohnheiten (kein neuer Kachel-Eintrag der Heute-Wand), damit keine gespeicherte Wand angepasst werden muss.
- Fertig-Regel: Seite (keine neue Seite, Karte auf Heute; Zeile in app-stand.md), Absprung (die Karte steht dort, wo man sie braucht), Inhalt unverändert, leerer Zustand (die Startzeile erklärt die Challenge), nächster Schritt (nach dem Ende «Neue starten»), App-Stand (Zeile «Draussen-Challenge»). Eintrag in `features.js` kommt mit dem zweiten PR (Erinnerung), wenn die Challenge eine eigene Seite bekommt.

## Entscheide (für decisions.md)
- 21.11.2026 (Noah «1a 2b 3a 4a»): Challenges mit Tagesziel in Minuten zählen Strava und freie Minuten von Hand zusammen; Erinnerung als Karte auf Heute plus später ein Knopf «Täglich erinnern»; alle 10 Tage fragt eine Karte nach grossen Plänen; eigene Tagesziele bekommen später eine Seite «Challenges».

## Stand im Plan
- Challenges in den Vordergrund: PR 1 (diese Karte), danach 2 Erinnerung aufs Handy, 3 Frage alle 10 Tage, 4 Seite «Challenges».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: oben steht die Zeile «Eine Challenge mit Tagesziel starten?». «Start» tippen, im Fenster stehen 90 Min und 31.12.; erster Tag 22.11. wählen, «Start» tippen.
2. Auf der Karte «+30 Min» tippen: «30 von 90 Min heute», dann in der Meldung «Rückgängig»: wieder 0.
3. Eigene Minuten (zum Beispiel 120) eintippen: der Tag ist geschafft, ein grüner Punkt erscheint.
