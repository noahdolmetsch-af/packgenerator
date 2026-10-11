# Arbeitsweise: so entsteht jeder Release

Gilt ab 9.10.2026, 23:26, für alle folgenden Releases. Quelle: Noahs Anweisung im Projekt-Chat. Ersetzt den «Schnellmodus» vom 9.10.2026 (mehrere Pakete gleichzeitig, Mockups nur für ganz neue Seiten).

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
   - Alle Bilder jeder Runde kommen auf die eine Seite «Offene Mockups»: https://claude.ai/artifact/1EtKR7y8fYJheMwCeyWQyv.
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
