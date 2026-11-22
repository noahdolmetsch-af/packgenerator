# Plan nach dem Baustopp

Stand 22.11.2026, 22:35 (Zürich). **Der Baustopp ist seit 22.11., 22:25 aufgehoben (Noah).** **Seit 22:48 gehen PRs ohne Daten nach grüner Prüfung von selbst online (Noah «a»):** Bilder und «Online»-Meldung bekommst du trotzdem. PRs mit Daten, Backup, Sync oder `api/` brauchen weiter dein «ok» als Einzelfreigabe, dazu den Test mit Backup-Kopie (siehe `docs/decisions/keine-freigabe-ohne-daten.md`). Wo unten bei einem PR ohne Daten «ok» oder «dein ok» steht, ist das überholt. Runde 1 läuft, die Wellen steuert der Bündler nach diesem Plan. Die Abschnitte «Baustopp» und «Vor dem Aufheben» unten sind Verlauf, nicht mehr in Kraft. Die volle Seite mit Bildern und Tabellen liegt als Claude-Doc im Projekt; hier steht, was später nicht verloren gehen darf. Entscheide von heute: `docs/decisions/plan-nach-baustopp.md`.

## Baustopp 22.11., 19:15 bis 22:25 (Noah, aufgehoben)

«Ab sofort nur noch begonnene Tests online stellen. Nichts Neues anfangen, alles auf die Warteliste, was nicht gerade schon läuft. Gründlich testen.»

- Schon offene PRs mit «ok» werden fertig gemergt, dazu ein Fix, der `main` grün macht. Keine neuen PRs, kein neues «go».
- Lokal gebaute Arbeit ohne PR bleibt liegen (Warteliste).
- Ausnahme, von Noah beschlossen: **Runde 1** (Sportjahr S5, Kleiderschrank, Diagramme). Sie **hält**, bis der neue rote Test `umweg-zurueck.spec.js` geklärt ist. Danach gehen ihre PRs in die Prüfung und brauchen Noahs «ok».
- Dieser Doku-Stand ist kein Bau und eine Doku-Ausnahme nach der Regel «Test, CI, Doku».

## Grosser Test vom 22.11. (Lauf 401, `main` 9f228fa)

Rot: 8 von 22 Teilen (Gesamttest ×4, Browser desktop 5 und 6); Browser desktop 1 und phone 1 vom Zeitlimit abgebrochen. Zehn Tests waren schon in den letzten Nächten rot, einer ist neu (`umweg-zurueck.spec.js`). Ob das echte Fehler oder wackelige Tests sind, klärt der Bündler Test für Test. Daten-PRs warten darauf.

## Tore: welche Prüfung für welche Art PR

| Art | Beispiele | Prüfung | Freigabe |
|---|---|---|---|
| Ansicht | Texte, Seiten, Kacheln, Hilfen | Wächter plus betroffene Seite; Bilder 390 und 1440 px mit erfundenen Daten | «ok N», dann Label ok, Handy-Tests, Merge |
| Rechnung | Eine Rechnung, Auswerten, Karte, Sportjahr | wie Ansicht, dazu Test mit der Fixture von Fund F1: alle Seiten zeigen dieselben km und Stunden | «ok N» |
| Daten | Strava-Aufräumen, neue Einstellungen, Backup, Abgleich, `api/` | volle Prüfung; Test mit Kopie eines Backups; ältere Backups öffnen sich weiter; bei `api/` danach Vercel «packgen» READY | Einzelfreigabe pro PR, «Online» erst nach grünem Deploy |

Gruppen von «ok» höchstens 3 Nummern; höchstens 3 gebaute PRs warten gleichzeitig.

## Datenthema

- **Handy startete leer (22.11., 18:29):** Ursache gilt als knapper Handy-Speicher (Platz ist geschaffen). Noah verzichtet auf weitere Bilder und den Backup-Test im Gastprofil. Claude testet die Wiederherstellung stattdessen mit einer privaten Kopie eines Backups, nie im Repo.
- **Strava-Doppel:** Ursache im Code gefunden (neue Einträge bekommen eine zufällige Nummer statt der Strava-Nummer). Fix und Zeile «Aufräumen?» liegen lokal bereit; Einzelfreigabe und Backup-Kopie nötig; online erst nach dem Baustopp.
- **Eine Rechnung (F1):** Wochenrückblick, Auswerten und Sportjahr rechnen dieselbe Woche verschieden. Wird Schritt B.
- **«Wi gaht's?» (F2):** Gruss-Gesichter speichern künftig als Skalenfrage `spass.stimmung`; alte `hallo.gaht` bleiben und werden weiter gelesen (Daten-PR, Einzelfreigabe).
- **Neue Einstellungen** (Pausenwochen, Nebelmeer, Tippfehler «Stimmt so», Wertliste-Preise, Gym 1 h): je PR Einzelfreigabe; vorher «altes Backup mit neuer App öffnen».
- **Server `api/`** (KI Schritt 8): Einzelfreigabe; vorher Push mit dem Strava-Schlüssel prüfen, erst danach den alten Vercel-Schlüssel löschen.

## Wellen

**Weniger PRs (Noah «ja», 22.11., 22:34): etwa 8 statt rund 15.** (1) Test-PR und die drei Fixes als ein PR. (2) Die übrigen fertigen Stücke ohne Daten als ein bis zwei PRs statt je drei. (3) Wochenrückblick in zwei PRs statt drei, mit A, I, Gym 1 h und Gruss-Skala darin; F bleibt allein. (4) Wetter als ein PR. (5) Kursblick als ein PR. Daten sollen einzeln mit Backup-Kopie bleiben; Empfehlung dazu: Strava-Aufräumen (A) allein lassen, die Einstellungen (I, Gym, Gruss-Skala) dürfen mit, jeder PR mit Daten braucht Einzelfreigabe und Backup-Kopie. Preis: grössere PRs brauchen länger in der Prüfung, und ein roter Test hält alles darin auf. Die Zeile «2 Eine Rechnung» in der Tabelle (drei mittlere PRs) ist damit überholt. **Reihenfolge (Noah 22.11., 22:55 «warteliste nach allem anderen»): die Warteliste (Welle 4) kommt ganz zum Schluss, also nach Wetter und Kursblick.**


| Welle | Inhalt | Art |
|---|---|---|
| Runde 1 (läuft) | Sportjahr S5, Kleiderschrank, Diagramme; zuerst das Fertige ohne Daten | Ansicht |
| 0 Aufräumen | Merge von 1436, Nachtlauf lesen, lokale Zweige auf neuen `main` umstellen und testen, Entwurf 1451 fertig machen | kein neuer Bau |
| 1 Daten sicher | Strava-Fix, «Aufräumen?», Logbuch zurücklesen, Sync-Nachttest; eigene Mini-Welle: KI Schritt 8 (`api/`) | Daten, Einzelfreigabe |
| 2 Eine Rechnung | Wochenrückblick in **drei mittleren PRs**: (1) B, D, E; (2) C, G, H; (3) J, K, L. Einzeln mit Einzelfreigabe: A, I, Gym 1 h, Gruss-Gesichter. F bekommt einen eigenen PR. Sportjahr S5 zuerst (überschneidet D), S13 «Sportseiten schlanker» ganz am Schluss, die Liste geht vorher an Noah | Rechnung; I und Gym Daten |
| 3 Fertiges von vorher | TrainingPeaks W2 und W3, Kleiderschrank, Prototyp V4b2 (drei PRs, der zweite schreibt `hard` in `training.weeklog`, also Daten), Challenges, Diagramme Schritt 2, Ideen S6 | Ansicht |
| 4 Warteliste (ganz zum Schluss, nach Wetter und Kursblick) | Suche, Durchklick 1 bis 4, «Was ist neu» mit Bildern, Packen nach vorn, Logbuch L5, Tippfehler N4, Wertliste N5, Nebelmeer, Testfunde F3, F4, F6, Training «Ein Haken für alles», KI Schritt 9; danach «schliessen 1043» | meist Ansicht |

Wochenrückblick, Schritte nach F: **J** Erholung und Rituale, **K** Aktivzonen gegen das eigene Normal, **L** Zusammenhänge ab 20 Mal. Gym zählt neu im Normalfall 1 h statt 20 min (Einstellung, Einzelfreigabe vor dem Bau). Der Wochenrückblick-Thread steht auf «warte»: gebaut wird erst nach Noahs «weiter».

## Threads

Nur vier Threads arbeiten (Stand 21:00): dieser Planungs-Thread, Sportjahr (S5 vorbereiten), Sync (Strava-Zweig) und der Bündler (1436, grosser Test). Alle anderen warten, keiner baut still. Geschlossen werden: «Prüfen, was vergessen ging» und «Gründlich testen» (jetzt), die übrigen nach ihrer Welle. Der Bündler-Thread bleibt bis Ende Welle 4; der Wochenbrief läuft weiter.

## Vor dem Aufheben des Baustopps

- **Noah:** Fragen der Planung beantworten (erledigt am 22.11.); vor dem ersten Daten-PR ein frisches Backup speichern (letztes: 22.11., 21:08).
- **Claude:** Nachtlauf der Nacht auf den 23.11. und die Wackel-Liste lesen; jeden lokalen Zweig mit Basis, Tests und Rebase-Bedarf auflisten; Strava-Fix mit privater Backup-Kopie durchspielen; «altes Backup mit neuer App öffnen» für jede neue Einstellung vorbereiten; Prüfseite für Welle 1 vorbereiten.
- Aufgehoben wird der Baustopp erst, wenn Noah es schreibt.
