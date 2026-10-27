# Arbeitsweise: so entsteht jeder Release

Gilt ab 9.10.2026, 23:26, für alle folgenden Releases. Quelle: Noahs Anweisung im Projekt-Chat. Ersetzt den «Schnellmodus» vom 9.10.2026 (mehrere Pakete gleichzeitig, Mockups nur für ganz neue Seiten).

## Stand 26.10.2026 abends: die einzigen gültigen Regeln

Diese Regeln ersetzen alle Abschnitte weiter unten (sie sind nur noch Geschichte). Die verbindliche Fassung steht in [CLAUDE.md](../CLAUDE.md), Abschnitt «Current rules». Quelle: Noah, Thread «Verschlanken App, Tests und Speicher», 26.10.2026, 20:31–20:38 UTC («passt so. a»).

1. **Ziel:** eine App, die mich im Alltag unterstützt.
2. **Kleine PRs für alles, keine Bündel.** Eine Änderung, ein PR, eine eigene Version.
3. **Screenshots und Testlink, dann Freigabe, dann merged Claude.** Zu jedem PR gibt es Screenshots (Handy und Computer, erfundene Daten) und einen eigenen Testlink. Noah gibt frei, Claude merged und meldet «Online: …». Kein Auto-Merge.
4. **Mockups nur bei grossen Sachen** wie der Live-Karte.
5. **Fragen:** höchstens 5, a/b, mit Empfehlung ★.
6. **Keine Längen-Vorgaben** für Seiten. Heute wird wie jede andere Seite behandelt.
7. **Jeder PR** hat «Was fällt weg» und «Was ist neu». Keine neuen Ideen pro Release. Kurs-Check einmal pro Woche im Sonntags-Brief.
8. **Reihenfolge** bestimmt Noah. «zurück» heisst sofort rückgängig.
9. **Ruhig:** melden nur mit Ergebnis, Blocker oder Frage, keine Status-Meldungen zu festen Zeiten.
10. **Gratis und privat;** alles ist ein Vorschlag, alles änderbar und löschbar mit Rückgängig, Verschieben mit Pfeilen und Ziehen, Erklärtexte.
11. **Dokumentation auf GitHub zu jedem Release** (Noah 26.10.2026, 21:19 UTC): jeder PR führt im selben PR `docs/projektstand.md` (Kopfzeile «Stand» und Zeile in der Tabelle), `status.md`, `decisions.md`, `roadmap.md`, `vorhaben.md` und «Was ist neu» nach. Auch ein PR ohne App-Änderung (Tests, Regeln) bekommt eine Zeile in `projektstand.md` und `decisions.md`.

12. **Versionsnummer beim Merge** (Noah, 27.10.2026, «1a»): ein PR vergibt keine Versionsnummer mehr. Er legt eine eigene Datei `src/lib/news/<name>.js` («Was ist neu») und eine eigene Datei `docs/releases/<name>.md` (Doku) an. Die Nummer entsteht beim Merge aus der Reihenfolge auf `main` (`scripts/news.mjs`): mit «Was ist neu» 0.233.0, ohne 0.233.1. So geraten offene PRs nicht mehr wegen Nummer, «Was ist neu» oder Doku-Kopfzeilen in Konflikt, und die Tests laufen nur einmal. Noah prüft nach dem Merge auf der echten Seite statt auf einem Vercel-Testlink; Bilder und Prüfschritte kommen vorher wie bisher; «zurück» heisst Revert. Punkt 11 gilt weiter, aber in der eigenen Release-Datei statt in den Kopfzeilen von `projektstand.md` und `status.md`.

Die Regeln stehen nur noch an einem Ort (CLAUDE.md). Die Projektanweisung in Claude verweist nur darauf, das Projekt-Gedächtnis hält den Stand fest, nicht die Regeln.

## Stand 26.10.2026 (morgens, Geschichte): was sich seit dem 18.10.2026 geändert hat

Diese Punkte gehen dem Abschnitt «Stand 18.10.2026» vor. Quelle: Noahs Nachrichten im Projekt, festgehalten im [Entscheidungslog](decisions.md) und im [Projektstand](projektstand.md).

1. **Noah mergt jeden PR selbst** (Noah, 26.10.2026, 00:15 UTC: «ich möchte ab sofort alle PR selber mergen. bitte liefere mir ab sofort für alles immer den fertigen PR sowie einen Link zum testen. ich gebe danach selber frei auf github.»): Claude liefert für alles den fertigen PR (Prüfungen grün) und einen Testlink mit kurzer Anleitung. Kein Auto-Merge, Claude führt nie selbst zusammen. Gilt auch für Bibliotheks-Updates und Wächter-Reparaturen. Ersetzt die Regel vom 24.10.2026 («freigabe für alle», «alles ohne meine freigabe online bringen»: Auto-Merge bei grün) und Punkt 3 unten.
2. **Fragen nur vorab:** Was Claude von Noah wissen muss, fragt Claude am Anfang (höchstens 5, a/b). Danach arbeitet Claude selbständig und kommt mit Lösungsvorschlägen für entdeckte Probleme zurück.
3. **Wenige Pakete, ein Bündler:** Bau-Threads liefern Zweig und Commit an den Koordinator. Der Bündler-Thread «Mein Überblick» fasst zusammen, nummeriert, prüft nach der Bündel-Checkliste, öffnet den PR ohne Auto-Merge und schickt Noah PR und Testlink. Ersetzt die sechs Pakete vom 18.10.2026 (Punkt 4 unten).
4. **Nach Noahs Zusammenführen:** Hat der PR `api/` geändert, prüft der Bündler den Server «packgen» auf Vercel. Danach bekommt Noah eine Zeile «Online: …».
5. **Tests unabhängig von der Uhrzeit** (PR #252, 25.10.2026): Heute öffnet in den Tests keine Fenster von selbst; Tests, die ein Fenster prüfen, schalten es gezielt ein. Die Länge von Heute am Handy wird zur Mittagszeit gemessen.
6. **Heute** folgt dem Aufbau N2 (0.169.0, Noah 20.10.2026 «5a»), nicht mehr HN4 (Punkt 11 unten).

## Stand 18.10.2026: Regeln, die damals galten

Diese Regeln gehen den älteren Abschnitten weiter unten vor. Wo unten etwas anderes steht (Mockups vor dem Bau, Bilder vor dem Merge, ★-Empfehlung, Trello, «Noah merged selbst»), ist es Geschichte. Quelle: Noahs Antworten im Projekt vom 13. bis 18.10.2026, festgehalten im [Entscheidungslog](decisions.md).

1. **Ziel:** «Eine App, die mich im Alltag unterstützt.» Jedes Paket dient einem der sechs Ziele in [vorhaben.md](vorhaben.md) (seit 19.10.2026 mit «Alltag», seit 27.10.2026 mit «Lange Fahrten unterwegs verstehen»). Alle Vorhaben stehen in einer Liste: [vorhaben-liste.md](vorhaben-liste.md).
2. **Ohne Mockups, dafür ein Testlink** (Noah, 18.10.2026, 21:52 UTC, «ab sofort, überall»): Claude baut ohne Mockups. Zu jedem Paket bekommt Noah einen Testlink, die Vercel-Vorschau des Paket-PRs, mit dem Satz «eigener Speicher, Backup hochladen zum Testen mit deinen Daten». Bilder sind nicht mehr nötig. Ersetzt «zuerst bauen, dann Bilder» vom 14.10.2026.
3. **Veröffentlichen** (seit 15.10.2026, angepasst 18.10.2026): Claude führt ein Paket zusammen, sobald Noah den Testlink **dieses Pakets** bekommen und «ok» geschrieben hat, die Prüfungen auf dem letzten Commit grün sind und `main` sich nicht bewegt hat. Eine «Freigabe» ohne Paketnamen zählt nicht. Ausnahme: Updates von Abhängigkeiten (Dependabot) werden sofort zusammengeführt, sobald die Prüfungen grün sind. **Seit 26.10.2026 (Noah «ich möchte ab sofort alle PR selber mergen»):** Noah führt jeden PR selbst zusammen, auch Dependabot-Updates und Wächter-Reparaturen; Claude liefert den fertigen PR mit Testlink.
4. **Pakete:** fertige Teile werden zu Paketen gebündelt; jedes Paket ist ein Release mit eigener Version. Reihenfolge und Inhalt stehen im [Projektstand](projektstand.md).
5. **Fragen:** höchstens 5 pro Runde, a/b ausgeschrieben, **ohne ★-Vorauswahl**. Claude fragt und wartet, statt für Noah zu entscheiden.
6. **Alles im Projekt,** nicht mehr in Trello. Fragt Noah, was offen ist: höchstens drei Punkte.
7. **Gratis und privat:** null Kosten; das Repository ist öffentlich, private Daten bleiben ausserhalb, keine echten Namen.
8. **Ruhig:** Claude meldet sich mit Ergebnis, Hindernis oder Frage, kurz und auf Deutsch.
9. **Ideen:** jeder Release schlägt höchstens drei neue Ideen vor; sie kommen in die Ideen-Sammlung.
10. **Jeder PR** hat den Abschnitt «Was fällt weg oder rutscht tiefer».
11. **Heute** folgt dem freigegebenen Aufbau HN4; andere Änderungen an Heute brauchen Noahs ausdrückliches Ja.
12. **Sortieren** geht überall mit Pfeilen und Ziehen. **Erklärtexte** stehen überall dort, wo man sich verlieren könnte.
13. **Tests:** lokal die eigenen Tests und die der betroffenen Seiten, der volle Gesamttest läuft auf GitHub.

## 0. Prinzip Nr. 1 (Noah, 10.10.2026, 09:27, gilt vor allem anderen)

1. **Überblick zuerst:** Claude verschafft sich den aktuellen Stand im Projekt (Repo-Doku, Memory, Trello, offene PRs) und arbeitet nach unseren Regeln, mit den Skills und Plugins des Projekts.
2. **Plan:** eine aktuelle Roadmap, ein Ablauf- und Umsetzungsplan und Arbeitspakete.
3. **Mockups für jedes Arbeitspaket.**
4. **Noah gibt das Mockup frei.** Erst danach baut Claude und öffnet den Pull Request.
5. **Noah merged jeden Release selbst** (seit 10.10.2026, 14:16; die Selbst-Freigabe von 13:52 gilt nicht mehr). Claude öffnet den Pull Request, wenn die eigenen Tests lokal grün sind, und meldet sich, wenn alle Prüfungen auf GitHub grün sind. Die Mockups gibt weiterhin Noah frei.
6. **Nach jedem Schritt** dokumentiert Claude den Fortschritt (Doku, Trello, Memory).
7. **Kleine Dinge** prüft und verbessert Claude selbst. **Bei grösseren Dingen** stellt Claude immer gezielte a/b-Fragen mit ★.

## 1. Nur ein Paket, höchstens zwei gleichzeitig

- Es läuft ein Paket, in Ausnahmefällen zwei. Zwei Bauten gleichzeitig nur, wenn sie verschiedene Bereiche der App ändern (Noah 11.10.2026 «1-5 a», Frage 5). Ein Paket ist gebaut, getestet und als Pull Request offen oder in Arbeit.
- Ein neues Paket beginnt erst, wenn ein offenes gemergt oder abgebrochen ist.
- Die drei am 9.10.2026 schon gebauten Pakete (Material-Detail, Velo-Masse, Bausteine) werden noch fertig gemacht; danach gilt die Regel ohne Ausnahme.

## 2. Vor jedem Release: Mockups, Prüfung, a/b-Fragen

**Schneller werden (Noah 11.10.2026, 00:32, «1-5 a»):** kleine Releases mit einer sichtbaren Sache; eine Mockup-Runde pro Paket mit höchstens 5 Fragen, gebaut wird direkt nach der Antwort; lokal laufen nur die eigenen Tests und die betroffenen Seiten, der volle Gesamttest läuft auf GitHub; wacklige Tests werden in einem eigenen kleinen Release «Tests stabil» behoben. Die Mockups bleiben immer, und Noah merged weiterhin selbst.

Kein Release wird gebaut, bevor diese Schritte erledigt sind:

1. **Mockups** für jeden Screen, Dialog und Zustand, den der Release neu macht oder sichtbar ändert. Computer (1440) und Handy (390), nur hell (Noah 10.10.2026; den Dunkelmodus prüft er in der App). Auch kleine Änderungen an bestehenden Seiten bekommen ein Mockup.
2. **Noah prüft** die Mockups. **So zeigt Claude sie (Noah, 10.10.2026, Priorität 1, «extrem wichtig»):**
   - Alle Bilder jeder Runde kommen auf die eine Seite «Offene Mockups 2»: https://claude.ai/artifact/3j2eefXk4fHn6txJsp4i36 (seit 12.10.2026, Noah «ab sofort einen neuen Ort»; die erste Seite https://claude.ai/artifact/1EtKR7y8fYJheMwCeyWQyv ist voll, dort offene Runden bleiben dort).
   - Jede Runde hat dort einen eigenen Abschnitt. Computer und Handy stehen nebeneinander, und ein Tipp zeigt das Bild gross.
   - Jeder Abschnitt hat eine Zeile «★ ist …» und einen Link zur Fragen-Karte auf Trello.
   - Die Trello-Karte («PG · Dokumente und Fragen») verlinkt auf ihren Abschnitt, und die Antwort im Thread nennt den Link.
   - Nie nur einen Ordnerpfad nennen: Noah hat keinen Link zum Projektordner, und Anhänge im Thread sind begrenzt.
   - Offene Runden stehen oben, beantwortete Runden rutschen nach unten unter «Erledigt».
3. **a/b-Fragen:** zu jedem offenen Punkt eine Frage mit Optionen a/b, die Empfehlung mit ★ markiert, höchstens 5 Fragen, eine Runde pro Paket (seit 11.10.2026, «1-5 a»).
4. **Bauen** erst nach Noahs Antworten. Was Claude danach noch selbst entscheidet, steht im Pull Request unter «Selbst entschieden».

Damit gilt wieder die Regel aus [Design-Audits](design-audit.md): vor jedem neuen oder geänderten Screen zuerst ein Mockup, Noah gibt es frei.

## 3. Freigabe bleibt bei Noah

- Noah merged jeden Pull Request selbst (wieder seit 10.10.2026, 14:16, «ab sofort und überall»). Claude öffnet den Pull Request, lässt lokal die eigenen Tests und die betroffenen Seiten laufen (der volle Gesamttest läuft auf GitHub), wartet, bis alle Prüfungen auf dem letzten Commit grün sind, und schickt Noah dann den Link mit den Klicks «Merge pull request» → «Confirm merge». Ein rotes Vercel-Tageslimit hält nicht auf.
- **Mockup-Prüfung vor jedem Release:** Noah hat die Mockups zu diesem Paket gesehen und kommentiert (Trello-Kommentar oder Antwort im Thread). Der Pull Request nennt den Link unter «Mockup-Prüfung». Ohne Kommentar kein Release-PR, zuerst Noah fragen. Das spart Tests am Schluss und späte Wünsche am Aussehen.
- Jeder Pull Request hat eine Trello-Karte mit Link und Testschritten. Nach dem Merge wandert sie nach «PG · Zu testen».

## 4. Unverändert

- Dokumentationsregel für jeden Release-PR (siehe [Projektdokumentation](README.md#dokumentationsregel-für-jeden-release-pr)).
- Keine persönlichen Daten im öffentlichen Repository; Tests und Bilder nutzen nur erfundene Daten.
- Alles in der App ist ein Vorschlag, nie zwingend, immer änderbar und abwählbar.

## Kurs-Check und Tests vor dem PR (Noah 10.10.2026)

- Vor jedem neuen Paket und in jedem Release-PR wird [vorhaben.md](vorhaben.md) geprüft und nachgeführt (Abschnitt «Kurs-Check» dort). Etwa alle fünf Releases bekommt Noah einen kurzen Kurs-Check mit a/b-Fragen.
- Vor jedem Pull Request laufen lokal `npm test`, die eigenen Playwright-Tests, die Tests der betroffenen Seiten und `guard.spec.js`. Der volle Gesamttest (Computer und Handy, je beide Teile) läuft auf GitHub (Noah 11.10.2026 «1-5 a»; ersetzt die Regel «kompletter Gesamttest lokal»). Tests lesen ihre Listen aus dem App-Code statt Kopien zu führen.
- Gebündelt pushen (Noah 10.10.2026): pro Schritt einmal pushen, nicht nach jedem kleinen Commit. Vercel baut bei «packgen» nur, wenn sich `api/` ändert, und bei «packgenerator» nicht bei reinen Doku-Änderungen (Ignored Build Step in den Vercel-Einstellungen). Grund: Der Gratis-Plan erlaubt etwa 100 Builds pro Tag.
