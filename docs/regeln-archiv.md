# Regeln-Archiv: ersetzte Fassungen

Stand vor der Aufräumrunde vom 24.11.2026 (Noah «bringe regeln … auf den neusten stand»). Nur Verlauf, keine Regel. Aktuell gilt [regeln.md](regeln.md). Ersetzt eine neue Regel eine alte, kommt die alte hierher, mit Datum.

## Ersetzt am 24.11.2026 17:19: «bei Grün ohne Freigabe online» (Block 5)

Noah 24.11.2026 17:19: «ich möchte für jeden PR vor merge bilder sehen … diese gebe ich frei. das geht an den bündler, und wenn platz ist, geht es online.» Das ersetzt den Normalfall «bei Grün geht alles ohne Freigabe online» für PRs mit sichtbarer Änderung. Die Entscheid-Datei `docs/decisions/alles-freigegeben.md` (23.11.2026) bleibt als Verlauf. Block 5 in der Fassung von 16:58, wörtlich:

~~~~markdown
## Block 5 · Freigabe und Merge

(Noah 23.11.2026 00:03 und 06:00 «alles frei, freie Hand», `docs/decisions/alles-freigegeben.md`; Noah «1-5a» 24.11.2026 16:50; Bilder Noah 24.11.2026 16:53 und 16:54 «1a».)
- **Normalfall: bei grüner Prüfung geht alles ohne Freigabe online.** Kein «ok NNN» pro PR. Dependabot- und Wächter-Reparaturen genauso. Nie auto-mergen bei roter Prüfung.
- **Ausnahme: Noahs Daten könnten verloren gehen** (Löschen, Backup, Sync, Datenbank, `api/`). Dann fragt der Thread **zuerst Noah** und merged erst nach seiner Antwort. Vorher: Test mit der Kopie eines Backups und ein frisches Backup von Noah bereit
  (der Thread bittet ihn darum, wenn sein letztes älter als ein Tag ist; es liegt in `/mnt/project-files/private/`, nie im Repo).
- **«zurück»** von Noah nimmt einen PR sofort zurück (Revert).
- **Bilder zu jedem PR** (Noah 24.11.2026 16:53: «ich möchte ab sofort immer für jeden PR bilder sehen»): Jeder PR mit sichtbarer Änderung zeigt Noah Bilder **schon beim Öffnen**, in der Meldung an ihn, nicht erst bei «Online» (Handy 390 und Computer 1440, deutsch, erfundene Daten, wo sinnvoll vorher und nachher). Ein PR ohne sichtbare Änderung (Test, Doku, CI) braucht kein Bild, nur einen Satz «Nichts Sichtbares geändert, nur …» (Noah «1a» 24.11.2026 16:54). Wie die Bilder aussehen: Block 6.
- **Jeder PR sagt, was er tut:** «Was fällt weg oder rutscht tiefer» (sonst «nichts»), «Was ist neu», Screenshots, 2–4 Prüfschritte, kleine Entscheide unter «Selbst entschieden». Ein Verlust, den Noah nicht freigegeben hat, braucht seine Antwort vor dem Merge. Dateiliste und Fertig-Regel: `CLAUDE.md`.
- Merge-Prüfung (Basis `main`, konfliktfrei, linearer Zweig): `CLAUDE.md`.
~~~~

## Ersetzt am 25.11.2026 01:03: «bei geänderter Technik laufen weiter alle Zeilen» («Ausprobieren» im PR, Block 7)

Noah «1a» 03.11.2026 (`docs/releases/ausprobieren-nur-neue-zeilen.md`, wörtlich): «Der Handy-Test «Ausprobieren» (jede Zeile unter Ich › Was ist neu führt an den richtigen Ort) tippt in einem PR nur noch die Zeilen der eigenen News-Datei. … Die Nacht-Prüfung tippt weiter alle Zeilen. … Ändert ein PR die Update-Liste, die Ziel-Tabelle, `src/lib/know/`, die Seite «Was ist neu» oder die Test-Helfer, laufen weiter alle Zeilen.» Ersetzt für den letzten Satz durch Noah «a» auf der Karte vom 25.11.2026 01:03 (Option «Neueste 200, Rest nachts»): Bei geänderter Technik tippt der PR nur die neuesten 200 Zeilen plus die eigenen; alle übrigen prüft der Nachtlauf. Grund: solche PRs tippten rund 1400 Zeilen, alle 85 Teile lagen in Teil 1 und liefen ins Zeitlimit (PR 1640, dreimal).

## Ersetzt am 25.11.2026 01:26: «höchstens 4 PRs gleichzeitig in der Prüfung» (Block 4)

Noah 24.11.2026 23:18 (Fassung in `docs/regeln.md` Block 4 bis 25.11.2026): «**höchstens 4 PRs gleichzeitig in der Prüfung auf GitHub** (vorher 5–6; Noah: «ich möchte weniger rote tests haben»), **bis 8 offen insgesamt; 6–10 Threads arbeiten gleichzeitig.** Die 4 gelten, sobald main wieder grün ist. Ein neuer PR wird erst geöffnet, wenn in der Prüfung weniger als 4 sind und insgesamt weniger als 8 offen; sonst wartende PRs abbauen helfen.» Ersetzt durch Noah 25.11.2026 01:26 («neu 5 gleichzeitig»): höchstens 5 PRs gleichzeitig in der Prüfung; 8 offen und 6–10 Threads bleiben.

## Ersetzt am 24.11.2026 23:18: «höchstens 5–6 PRs gleichzeitig in der Prüfung» (Block 4)

Noah «a» 24.11.2026 16:58: «höchstens 5–6 PRs gleichzeitig in der Prüfung auf GitHub, bis 8 offen insgesamt; 6–10 Threads arbeiten gleichzeitig. Ein neuer PR wird erst geöffnet, wenn in der Prüfung weniger als 5–6 sind und insgesamt weniger als 8 offen.» Ersetzt für die Zahl in der Prüfung durch Noah 24.11.2026 23:18 («wenn main wieder grün ist, bitte nur 4 tests gleichzeitig laufen lassen ab sofort. ich möchte weniger rote tests haben»): höchstens 4 PRs gleichzeitig in der Prüfung; 8 offen und 6–10 Threads bleiben.

## Ersetzt am 24.11.2026 22:19: Wackel-Regel «2× zufällig» (Block 4)

Block 4 vom 17:19: «**Ein Test, der 2× zufällig fällt,** kommt auf die Liste und wird noch am selben Tag stabil gemacht (Wackel-Thread).» Ersetzt durch Noah «a-c alle» 24.11.2026 22:19 (Vorschlag b): schon ein einmal zufällig roter Test kommt auf die Liste und wird noch am selben Tag stabil gemacht, bevor neue PRs dazukommen.

## Ersetzt am 24.11.2026 18:07: «Entwurf vor dem Bauen» als Bild für Noah (Block 5)

Block 5 vom 17:19 sagte: «Entweder **vor dem Bauen** als Entwurf oder **nach dem Bauen** vom fertigen PR, **wenn möglich mit Noahs aktuellen Daten** …». Ersetzt durch Noah 24.11.2026 18:07 und 18:08 («bilder immer im app design … das gilt immer überall»): Bilder nur aus der echten, gebauten App, ein Bildschirm pro Bild, daneben das Bild der heutigen Online-Version, Prüfung mit impeccable vor dem Senden.

## Ersetzt am 24.11.2026 16:58: PR-Grenze «höchstens 6 offen, Ziel 5»

- Noah 24.11.2026 16:38 «lass uns die grenze auf 5-6 herunter tun. 6-9 ist mir zu vieles gleichzeitig»: «Höchstens 6 PRs offen, Ziel 5. Neues erst bauen, wenn höchstens 5 offen sind.» (Regeln R11.1, R12, R13, Block 4 der ersten Fassung der neun Blöcke.)
- Ersetzt durch Noah «a» 24.11.2026 16:58: höchstens 5–6 PRs gleichzeitig in der Prüfung auf GitHub, bis 8 offen insgesamt; 6–10 Threads gleichzeitig.

## Ersetzt am 24.11.2026 16:38: PR-Grenze «höchstens 8 offen»

- Stau-Regel 1 (Noah 24.11.2026 07:29, «1 2 3 4 5»): «Neues erst bauen, wenn höchstens 8 PRs offen sind; sonst wartende PRs abbauen helfen.»
- R12 (Noah 24.11.2026 01:17 «nur 5–6 aktive PRs», verbunden mit der 8er-Grenze durch Noah «1a» 24.11.2026 10:27): «Höchstens 8 offen, davon 5–6 gleichzeitig in der Prüfung. Der Rest wartet lokal gebaut.»
- Ersetzt durch Noah 24.11.2026 16:38: höchstens 6 offen, Ziel 5.

## Ersetzt am 24.11.2026 16:50: die 33 Regeln R1–R33 (Noah «1-5a», Zusammenfassung auf 9 Blöcke)

Wörtliche Kopie von `docs/regeln.md` unmittelbar vor der Zusammenfassung (R1–R33 mit den Abschnitten 1–9). Entscheide von Noah dazu («1-5a», 24.11.2026 16:50): (1) 9 Blöcke statt 33 Regeln; (2) Technisches nach `CLAUDE.md`; (3) Normalfall ohne Freigabe, aber wenn Noahs Daten verloren gehen könnten (Löschen, Backup, Sync) zuerst Noah fragen; (4) melden nur bei Ergebnis, Blocker oder Frage, plus die zwei festen Rundgänge 08:00 und 20:00; (5) der Plan nach dem Baustopp (R29 «Pläne führt der Bündler zuletzt nach») kommt ins Archiv. Die Datei `docs/plan-nach-baustopp.md` bleibt als Verlauf bestehen.

~~~~markdown
# Regeln: so arbeiten wir

Das ist die **eine Quelle für die Arbeitsweise** (wer macht was, wann, in welcher Reihenfolge, wann geht etwas online).
Jede Regel nennt ihr Datum und ihre Quelle. Es steht keine Versionsnummer und keine «Stand:»-Zeile hier (Regel «Versionsnummer beim Merge» in `CLAUDE.md`).

**Rangfolge:** Noahs neuste Nachricht im Thread > diese Datei > `CLAUDE.md` (Regeln im Code: Datenschutz, PR-Dateien, Tests) > alles andere.
Ältere Regeln und überholte Fassungen stehen nur noch in [regeln-archiv.md](regeln-archiv.md), nie mehr als Regel.

**Wer sie pflegt:** Eine neue Regel von Noah kommt in dieselbe Stunde hierher (Koordinator, oder der Thread, der sie hört, per Doku-PR).
Der Abend-Rundgang (20:00) prüft, ob Projekt-Anweisung, Gedächtnis und diese Datei übereinstimmen (siehe Abschnitt 9).

---

## 1. Ziel und Massstab

**R1 · Eine App, die mich im Alltag unterstützt.** Jede Änderung dient den zwei Zielen aus R2 und dem Leitfaden `docs/leitfaden.md`
(Noah, 23.11.2026; Noah «1-5a» 24.11.2026 16:45: nur noch diese beiden als Massstab, die «sechs Ziele» aus `docs/vorhaben.md` nicht mehr; der Leitfaden bleibt ganz).
Passt etwas nirgends, fragt der Thread Noah. Der Kurs-Check kommt einmal pro Woche im Sonntags-Brief.

**R2 · Zwei Ziele darüber: Klarheit und Auffindbarkeit** (Noah, 23.11.2026 18:09 UTC). Man sieht sofort, wo man ist und was man hier tun kann
(eine Hauptsache pro Bildschirm, sinnvolle Absprünge, nie stecken bleiben). Wichtiges liegt oben und ist mit wenigen Tipps erreichbar,
oft Gebrauchtes (Abhaken) liegt vorne, die Suche findet Verstecktes. Jeder PR wird an beiden gemessen.

**R3 · So fühlt sich die App für Nutzer an** (Nutzerkriterien, gelten für jede Seite):
- Inhalt zuerst: Hilfe steht nie vor dem Inhalt, nur als geschlossene Zeile und am Seitenende (Noah 21.11.2026 «5a»).
- Alles ist ein Vorschlag: nie Pflicht, immer änderbar und abwählbar.
- Alles selbst änderbar: hinzufügen, umbenennen, löschen, immer mit Rückgängig; Sortieren mit Pfeilen und Ziehen. Löschen (Noah «4a» 23.11.2026, Regel seit 24.11.2026, `docs/decisions/loeschen-rueckgaengig.md`): was man schnell wieder anlegt (Idee, Lebensphase, Gewicht, Listenplatz, Foto) geht sofort weg und bietet 8 Sekunden Rückgängig; Dinge mit Verlauf (Frage mit Antworten, Gruppe mit Inhalt, Velo, Tour) fragen zuerst. Im Zweifel fragen.
- Nichts fällt ersatzlos weg; alte Daten und alte Adressen bleiben sichtbar bzw. gültig.
- Keine Längen-Vorgaben für Seiten; Heute wird wie jede andere Seite behandelt (Noah 26.10.2026).
- Erklärtexte überall dort, wo man sich verlieren könnte; Deutsch einfach, ein Wort pro Sache (`docs/namen.md`).

## 2. Zusammenarbeit mit Noah

**R4 · Sprache.** Antworten an Noah: einfaches Deutsch, Länge und Tiefe nach R32. Noah ist kein Entwickler; GitHub-Schritte Klick für Klick.
Pro Nachricht höchstens 3–4 PR-Nummern (Noah, 23.11.2026).

**R5 · Ruhig** (Noah 26.10.2026). Melden nur mit Ergebnis, Blocker oder Frage. Keine Status-Posts zu festen Zeiten ausser den zwei Rundgängen (R30).
Fragt Noah, was offen ist: höchstens 3 Punkte.

**R32 · Ausführlicher antworten, nicht zu knapp** (Noah 24.11.2026 16:29: «ich möchte, dass du ab sofort mehr antwortest. aktuell immer eher zu knapp»). Jede Antwort an Noah erklärt, was passiert ist, warum, was es für ihn bedeutet und was als Nächstes kommt, in einfachem Deutsch und in ganzen Sätzen. Das ersetzt «kurz» in R4 und die Obergrenze von rund 80 Wörtern. R5 gilt weiter für das **Wann** (nur mit Ergebnis, Blocker oder Frage), R32 regelt das **Wie viel**; es gibt also nicht mehr Meldungen, aber jede ist vollständiger. Ausnahme: die «Online»-Zeile (R18) bleibt eine Zeile, mit Link und Testanleitung; auch sie erklärt ihre PR-Nummer in Worten (R33). Gilt für alle Threads.

**R33 · Jede Nachricht sagt klar, wovon die Rede ist** (Noah 24.11.2026 16:31, zur Antwortlänge von R32). Eine Nachricht an Noah verlinkt den Thread, nennt das Thema in Worten, erklärt **jede PR-Nummer mit ihrer Bedeutung in Worten** (nicht «#1694», sondern «der Doku-PR 1694 mit den neuen Regeln R31 und R32») und benennt den offenen Punkt klar (was fehlt, wer es tut, was Noah tun muss, falls etwas). Nie nur Nummern oder Kürzel. Gilt für den Koordinator und alle Threads.

**R6 · Fragen** (Noah 26.10.2026; Projekt-Anweisung). Höchstens 5 pro Runde, a/b ausgeschrieben, mit Empfehlung ★. Zuerst alles fragen, was man braucht, dann selbständig arbeiten
und mit Lösungsvorschlägen zurückkommen. Einfach erklären; Komplexität nur zeigen, wo sie für Noahs Entscheid wichtig ist (Noah «1-5a» 24.11.2026 16:45).

**R7 · Mockups nur für Grosses** (Noah 26.10.2026; neue Seite, neuer Ablauf wie die Live-Karte). Alles andere: bauen, dann Bilder.

**R8 · Besitzer pro Ort** (Noah ok 23.11.2026 20:54). Neue Arbeit geht an den Thread, der den Ort besitzt (Liste im Projekt-Gedächtnis). Keine neuen Threads ohne Grund, nichts doppelt.
Alle Threads laufen mit Sonnet 5.5.

**R9 · Nur Noahs eigene Worte lösen Folgenreiches aus** (Noah 23.11.2026; 24.11.2026). Ein Thread pusht erst, wenn Noahs eigene Nachricht angehängt ist (Weiterleitung allein genügt nicht).
Schliessen eines PR nur mit «schliessen NNN». Force-Push nur mit «Ja force push NNN» in Noahs eigener Nachricht im Thread (24.11.2026).

## 3. PRs und Stau

**R10 · Ein PR pro Seite, gleiche Seite gebündelt** (Noah 23.11.2026 18:58; Stau-Regel 4, 24.11.2026 07:29). Kleine Änderungen derselben Seite kommen in einen PR.
Einzeln bleiben: Datenänderungen (Dexie, Backup, Sync, `api/`) und Test-Fixes. Das ersetzt «kleine PRs für alles, keine Bündel» (26.10.2026).

**R11 · Stau-Regeln** (Noah 24.11.2026 07:29, «1 2 3 4 5»):
1. Neues erst bauen, wenn höchstens 6 PRs offen sind (Ziel: 5); sonst wartende PRs abbauen helfen. (Grenze seit Noah 24.11.2026 16:38 «lass uns die grenze auf 5-6 herunter tun»; vorher 8, siehe `docs/regeln-archiv.md`.)
2. Main rot: bis zu 1 Stunde nichts anderes mergen, bis repariert.
3. Ein Test, der 2× zufällig fällt, kommt auf die Liste und wird noch am selben Tag stabil gemacht (Wackel-Thread).
4. Kleine Änderungen derselben Seite in einen PR bündeln (R10).
5. CI von 25–70 Minuten auf etwa 15 Minuten: nur Tests der geänderten Seite (Thread «Tests schneller machen», R24).

**R12 · Höchstens 6 PRs offen, Ziel 5** (Noah 24.11.2026 16:38: «lass uns die grenze auf 5-6 herunter tun. 6-9 ist mir zu vieles gleichzeitig»). Das ersetzt «höchstens 8 offen, davon 5–6 gleichzeitig in der Prüfung» vom 24.11.2026 10:27. Mehr als 6 offene PRs gibt es nicht; was darüber hinaus fertig wird, wartet lokal gebaut (R13).

**R13 · Wellen (impeccable-Prüfung, Noah 24.11.2026 07:37 «1-5a» und «ja» ~08:40).** Pakete einer Welle werden **lokal gebaut und getestet, ohne PR und ohne Push**,
bis der Bündler «Platz» meldet (≤ 6 offen, R12). Welle 3 wartet, bis Welle 1 und 2 gemergt sind.

**R14 · Warten heisst vorbauen** (Noah 27.10.2026): Wartet ein PR auf CI, geht der Thread am nächsten geplanten Schritt weiter, lokal vorbereitet; gepusht wird nur nach R9–R13.

**R15 · Vor jedem Merge** (Noah 22.11.2026 und 03.11.2026, Lessons) prüfen: `base.ref` ist `main`; der PR ist konfliktfrei (sonst startet GitHub keine CI); der Zweig ist linear
(Rebase statt `git merge main`, ausser GitHub zeigt einen echten Konflikt). Ein Bündler («Mein Überblick») führt die Reihenfolge.

## 4. Freigabe, Merge, «Online»

**R16 · Alles geht bei Grün ohne Freigabe online** (Noah 23.11.2026 00:03 «ich gebe jetzt ausdrücklich alles frei», bekräftigt 06:00 «freie Hand»).
Kein «ok NNN» pro PR mehr, auch nicht für Daten, Backup, Sync, `api/`. Das ersetzt die Einzelfreigaben der Regeln vom 26.10.2026, 21.11.2026 und 22.11.2026.
Dependabot- und Wächter-Reparaturen gehen genauso. Details: `docs/decisions/alles-freigegeben.md`.

**R17 · Was bleibt, auch bei «alles frei»** (Noah 23.11.2026):
- Backup ist Pflicht vor jeder Änderung an Daten, Backup, Sync oder `api/`: Test mit der Kopie eines Backups, frisches Backup von Noah bereit
  (der Thread bittet ihn darum, wenn sein letztes älter als ein Tag ist; aktuelles Backup liegt in `/mnt/project-files/`, nie im Repo). Volle Prüfung für diese PRs.
- «zurück» nimmt einen PR sofort zurück (Revert).
- «Online» erst nach grünem Deploy (GitHub Pages; bei `api/` auch Vercel «packgen» READY und neu deployen).
- Nie auto-mergen bei roter Prüfung. Ein rotes Vercel-Tageslimit hält nicht auf.

**R18 · Nach dem Merge: Live-Test im Browser, dann «Online»** (Noah 23.11.2026 13:17). Auf `…/packgenerator/?fresh=1`, Handy 390 und Computer 1440, Prüfschritte durchgehen,
Version prüfen, Konsole lesen. Bei Fehler zuerst beheben. Die «Online»-Meldung ist eine Zeile mit Thread-Link und Testanleitung.

**R19 · Bilder zu jedem Online-PR** (Noah 23.11.2026 20:46 und 24.11.2026 01:24 und 02:24):
- Handy 390 und Computer 1440, **App und Browser auf Deutsch** (Playwright `locale: 'de-CH'`, `localStorage lang=de` vor dem ersten `goto`).
- Die Bilder **zeigen die Änderung selbst**, nötigenfalls mit erfundenen Beispieldaten. Eine leere App zählt nicht; man sagt dazu, dass die Live-Seite leer ist.
- Ablage `/mnt/project-files/online-bilder/<PR>/` bzw. `…/bilder/<name>/`; der Koordinator hängt sie an. Auch rückwirkend.

**R20 · PR-Inhalt** (Noah 14.10.2026 «3a», 26.10.2026 «4a»): «Was fällt weg oder rutscht tiefer» und «Was ist neu», Screenshots, 2–4 Prüfschritte, kleine Entscheide unter «Selbst entschieden». Ein PR ohne sichtbare Änderung (CI, Tests) sagt das. Ein Verlust, den Noah nicht freigegeben hat, braucht seine Antwort vor dem Merge.
Dateiliste und Fertig-Regel stehen in `CLAUDE.md` («Jeder PR»).

## 5. Tests und CI

Befehle, Specs und die Phone-Test-Mechanik (Label `ok`, `scripts/ci-map.mjs`, Playwright-Pfade) stehen in `CLAUDE.md` unter «Tests». Hier nur die Regeln.

**R21 · Lokal nur das Eigene** (Noah 11.10.2026): eigene Specs, Specs der geänderten Seiten, `guard.spec.js`. Der Gesamttest läuft auf GitHub.

**R22 · Phone-Tests starten mit dem Label `ok`** (Noah 28.10.2026, 05.11.2026). Weil alles frei ist (R16), setzt der Bündler das Label bei Grün; gemergt wird, wenn `e2e (phone)` auf dem aktuellen Kopf grün lief.

**R23 · Nie lockern** (Noah 26.10.2026). Kein Test wird übersprungen, abgeschaltet oder gelockert, um Grün zu bekommen. Ursache beheben, oder den Test anpassen, wenn sich die Oberfläche mit Absicht geändert hat.

**R24 · Volle Prüfung nur einmal pro schwerem PR, am Schluss** (Option A der CI-Messung, Noah «2a» 24.11.2026 10:27, im Bau, Thread «Tests schneller machen»; Label «voll»).
Schwer = berührt `db.js`, `package.json`, `api/`, `.github/`. Bis das live ist, gilt R17 (volle Prüfung für Daten-PRs).

**R25 · Wackel-Tests** (Noah 24.11.2026, Stau-Regel 3; Lessons aus 24 Fällen, 23.11.2026 und 24.11.2026): zuerst Reihenfolge (`--workers=1`); Test nahe der 90-s-Grenze wird geteilt, nie die Frist erhöht;
mehrere rote Tests gleicher Breite = gemeinsame Ursache; PR-Zweige bleiben linear. Die Liste der bekannten Wackler und die Bau-Lessons stehen in der Gedächtnisdatei `build-regeln-flakes-lessons`.

**R31 · Wer eine Seite umbaut, sucht vor dem PR alle Tests, die diese Seite antippen, auch die anderer Bereiche, und lässt sie lokal laufen** (Noah «a» 24.11.2026 15:18). Grund: 1655 (Plus-Menü) und 1681 («Ich») machten main rot, weil fremde Tests den alten Stand erwarteten. Suche z. B. mit `grep` nach Adresse, Überschrift und Beschriftung der Seite in `tests/` (Vitest und e2e). Die gefundenen Tests laufen lokal zusätzlich zu R21; ein Test, der den alten Stand erwartet, wird mit Absicht angepasst, nie gelockert (R23).

## 6. Daten, Privatsphäre, Kosten

**R26 · Privat** (Noah 04.10.2026 ff.; ausdrücklich ergänzt «1-5a» 24.11.2026 16:45): Das Repo ist öffentlich. Keine persönlichen Daten, keine echten Namen, keine Backups, Belege, Fotos, GPX, Excel-Listen, Schlüssel.
**Bankname, IBAN, Konten, Beträge, Fotos und ICS-Token stehen nie in Repo, Chat oder Gedächtnis.** Entwürfe mit Echtdaten (zum Beispiel Seiten oder Dokumente) werden nie öffentlich gemacht.
Privates liegt nur in `/mnt/project-files/private/`. Tests und Bilder nutzen nur erfundene Daten. Gesundheitsdaten sind reine Beobachtung.

**R27 · Gratis** (Noah 26.10.2026): null Kosten. Der KI-Schlüssel bleibt in Vercel (Noah, 23.11.2026).

## 7. Dokumentation

**R28 · Jeder PR bringt seine Doku mit:** `docs/releases/<name>.md`, `src/lib/news/<name>.js`, bei einem Entscheid `docs/decisions/<name>.md`, `docs/app-stand.md` wo sich etwas ändert.
Keine Versionsnummer in Docs (Noah 27.10.2026, «1a»). Vor jeder Abfrage liest jeder Thread `docs/app-stand.md` und das Projekt-Gedächtnis (Noah 03.11.2026).

**R29 · Pläne führt der Bündler zuletzt nach, nur wenn wenig läuft** (Noah 23.11.2026).

## 8. Rundgänge

**R30 · Zwei feste Rundgänge** des Koordinators (Noah 23.11.2026; Abend neu 20:00, Noah «ja» 24.11.2026): 08:00 und 20:00. Der Abendrundgang prüft zusätzlich Abschnitt 9. Sonst keine Status-Posts (R5).

## 9. So bleibt es aktuell

Drei Orte, je eine Aufgabe, **kein Text steht an zwei Orten**:

| Ort | Was dort steht | Wer ändert es |
|---|---|---|
| **Projekt-Anweisung** (Claude-Projekt) | Eine Seite: Ziele, Leitfaden, Nutzerkriterien, 8 wichtigste Arbeitsregeln. Verweist auf diese Datei. | Koordinator, nur nach Noahs Ja |
| **Projekt-Gedächtnis** (`MEMORY.md`) | Nur der aktuelle Stand: Besitzer pro Ort, Offenes, letzte Entscheide. Kein Verlauf, kein «Stand 23.11.». | Koordinator, sofort bei jeder Änderung |
| **Repo** (`docs/regeln.md`, `CLAUDE.md`) | Die vollständigen Arbeits- und Bau-Regeln. | Doku-PR (ein Platz beim Bündler) |

Ablauf bei einer neuen Regel von Noah: (1) Koordinator speichert sie sofort im Gedächtnis unter «Letzte Entscheide»; (2) er legt sie hier mit Datum und Quelle ab (Doku-PR, gebündelt mit anderen Regeln des Tages);
(3) betrifft sie die Ziele oder die 8 wichtigsten Regeln, schlägt er Noah die Änderung der Projekt-Anweisung vor; (4) ersetzt sie eine ältere, wandert die alte in `regeln-archiv.md`.

Der Abend-Rundgang vergleicht: Stehen alle Regeln der Projekt-Anweisung hier? Steht im Gedächtnis eine Regel, die hier fehlt? Gibt es «Stand»-Einträge, die älter als 2 Tage sind und erledigt wurden? Abweichungen meldet er Noah in einer Zeile.
Ein Test (`tests/regeln-doku.test.js`) hält die Form: jede Regel hat Datum/Quelle, `CLAUDE.md` verweist auf diese Datei, und `CLAUDE.md` enthält keinen eigenen Regelblock mehr.
~~~~

## Ersetzt am 24.11.2026 16:45 (Noah «1-5a», Bereinigung der Projekt-Anweisung)

- Satz «zuerst nur Analyse und Entwurf, Produktcode erst nach Umsetzungsauftrag» aus Thema und Anweisung: gestrichen.
- R1 «Jede Änderung dient einem der sechs Ziele in `docs/vorhaben.md` und dem Leitfaden»: jetzt nur noch Klarheit, Auffindbarkeit und Leitfaden. Gleiches in `CLAUDE.md` (Kurs-Check) und `docs/vorhaben.md` (Prüffragen).
- R6 «Bei komplexen Dingen zuerst die Komplexität zeigen»: jetzt «einfach erklären, Komplexität nur wo für Noahs Entscheid wichtig».
- R26 nannte nur «ICS-Token, Schlüssel»: jetzt ausdrücklich Bankname, IBAN, Konten, Beträge, Fotos, ICS-Token und «Entwürfe mit Echtdaten nie öffentlich».

## Alte Projekt-Anweisung: Alte Projekt-Anweisung (bis 24.11.2026)

schritt für schritt denken. bei komplexen dingen mir komplxität aufzeigen. mir sinnvolle vorschläge zur umsetzung liefern. mir rückfragen zur präzisierung stellen wenn nötig.

REGEL: Vor jeder Abfrage zuerst den Ist-Stand der App lesen (Dokument «Was die App kann», gespeichert als docs/app-stand.md im Repo und im Projektordner) sowie das Projekt-Gedächtnis. Alle Überlegungen bauen darauf auf. Keine neue Web-Analyse von Hand. Jeder PR aktualisiert das Dokument.

WICHTIGSTE ZIELE DER APP (Noah, 23.11.26) – jeder Vorschlag und jeder PR wird daran gemessen:
1. Klarheit: Man sieht sofort, wo man ist und was man hier tun kann. Pro Bildschirm gibt es eine Hauptsache. Zudem hat jede Seite sinnvolle Absprünge, der Nutzer bleibt nie irgendwo stecken.
2. Auffindbarkeit: Wichtiges liegt oben, und man erreicht es mit wenigen Tipps. Was man oft braucht, wie Abhaken, liegt vorne. Die Suche hilft dem Nutzer, versteckte Inhalte zu finden.

LEITFADEN / VISION (Noah, 23.11.26, 22:27) – alle Vorhaben werden darauf abgestimmt:
- Eine App, die mich im Alltag unterstützt.
- Aus Touren lernen und das Velo im Griff haben.
- Abenteuer, Meilensteine, neue Routenvorschläge.
- Fitness- und Gesundheitsdaten tracken und intelligente Zusammenhänge zwischen Training, Spass, Erholung und Sonstigem erkennen.
- Viele kleine Dinge, für die ich sonst eine andere App oder den Browser bräuchte: Wetter, Packlisten, To-dos, Wochenplanung, Trainingsplan, Habits und Sportaktivitäten tracken, Analysen, Helfer unterwegs beim Bikepacking-Rennen, Hilfe beim Planen von Rennen.
- Packen fokussiert auf Bikepacking: welche Items in welchen Taschen am Bike (wichtig). Inhalt pro Tasche und Gesamtinhalt, mit und ohne Taschen und Bikes. Intelligente Vorschläge berücksichtigen Wetter und Lieblingsitems. Packen ist nie mehr eine Ausrede: alles hinterlegt, gespeichert und ständig durch User-Feedback aktualisiert.
- Die Meditations-Mini-App kommt wieder stärker in den Vordergrund, zusammen mit den laufenden Challenges.
- Die App weiss aus aktuellen Daten immer, was ich viel und was wenig mache, was Herzfrequenz und Aktivzonenminuten machen, und macht daraus intelligente, sinnvolle Vorschläge (z. B. «heute erholen» oder «heute geht's bombastisch, welcher Berg ruft?»).
- Tagebuch, Kochen, Tennis, Mein Tag, Wochenplan, Analysen/Auswerten und weitere bestehende Tools werden alle weitergezogen, müssen aber gut getestet und optimiert werden.


---

## Altes CLAUDE.md: Altes CLAUDE.md (bis 24.11.2026, unverändert kopiert; die «Current rules» stehen jetzt in `docs/regeln.md`, die Code-Regeln in `CLAUDE.md`)

# Pack Generator: instructions for Claude

Personal tour-preparation PWA for Noah: plan, pack, ride, debrief, bike care. It is built with Svelte 5, Vite and Dexie (IndexedDB) and works offline. It is live on GitHub Pages; each PR also gets a Vercel preview.

Noah writes German and is not a developer. Write replies to him in short, simple German, and explain GitHub steps click by click. The app's source language is English, and the German texts go through `t()`.

**Before every request, read `docs/app-stand.md`** (Noah 03.11.2026: «jeder thread soll das und alles weitere projektrelevante immer vor jeder abfrage berücksichtigen»). It lists what the app can do, with the link of every function, the places, the data and the connections. Do not analyse again what it already says. If the code differs, the code is right and your PR corrects the file; `tests/appstand.test.js` fails on a dead link or a function that sits under no row.

## Current rules (Noah, 26.10.2026 evening, binding, above everything else)

These are the only rules. They replace every older rule here, in `docs/arbeitsweise.md`, in project memory and in older skill texts (bundles, «Noah merges himself», «no ★», Heute N2 protected, length budgets, ideas per release). The project instruction in Claude only points here; project memory keeps the current state, not rules. German summary: `docs/arbeitsweise.md`, section «Stand 26.10.2026 abends». Source: thread «Verschlanken App, Tests und Speicher», Noah 26.10.2026 20:31–20:38 UTC.

1. **Goal:** «Eine App, die mich im Alltag unterstützt.» Every change serves one of the six goals in `docs/vorhaben.md`; if not, ask Noah. **Every change also serves the Leitfaden `docs/leitfaden.md`** (Noah's current vision, 23.11.2026, «Jede Änderung dient dem Leitfaden»); it adds to the goals and replaces no rule. **Above them stand two goals for how the app feels** (Noah 23.11.2026): **Klarheit** (one sees at once where one is and what to do here; one main thing per screen; every page has useful jump-offs, nobody gets stuck) and **Auffindbarkeit** (what matters sits on top and is reached in few taps; what is used often, like Abhaken, sits up front; the search helps to find hidden content). Text in `docs/vorhaben.md`; every PR is checked against both.
2. **Small PRs for everything, no bundles** (Noah «3a, kleinere PRs ab sofort für alles, damit wir agiler sind»). One change, one PR, its own version. No bundler thread, no collecting.
3. **Screenshots + test link, then Noah approves, then Claude merges** (Noah «1b, claude merged selber, aber alles erst nachdem ich die screenshots dazu freigegeben habe»). Every PR, once CI is green, gets screenshots of what changed (phone 390 px + computer 1440 px, fictional data) and 2–4 check steps. Since 27.10.2026 (Noah «1a») Noah checks on the real page after the merge, not on a Vercel test link (the check steps say where to look once it is online). Claude merges only after Noah approved **that** PR («ok 266», a tap on «Freigeben»). A PR with nothing visible (CI, tests) says so and needs Noah's ok too. After the merge: check Pages green (and the Vercel server «packgen» READY when `api/` changed), then one line «Online: …». Never auto-merge. Dependabot and watcher repairs follow the same way. A change to the data storage (Dexie schema, backup format) is first checked with a copy of a backup. **Since 23.11.2026, 00:03 (Noah «du musst mich nicht mehr fragen. ich gebe jetzt ausdrücklich alles frei»): Noah has approved everything in advance. No more «ok NNN» per PR and no more single approvals, data, backup, sync and `api/` included.** Every PR goes online by itself once its checks are green; it still gets screenshots and 2–4 check steps, and Claude still reports one line «Online: …» after the deploy is green (Vercel server READY when `api/` changed). This replaces «Claude merges only after Noah approved that PR», «Never auto-merge» and the single approval for data (22.11.2026, which had loosened it for PRs without data first). What stays: a backup is mandatory before every change to data, backup, sync or `api/` (test with a copy of a backup, and a fresh backup of Noah is on hand; Claude asks him for one when his last is older than a day), the full check runs for these PRs, `zurück` reverts a PR at once, closing a PR needs «schliessen NNN», a force-push needs «Ja force push NNN». Source: `docs/decisions/alles-freigegeben.md`.
4. **Mockups only for big things** (a new page or flow like the Live-Karte). Everything else: build, then screenshots.
5. **Questions:** at most 5 per round, a/b written out, **with Claude's recommendation ★**. Ask what you need up front, then work on your own and come back with proposed solutions.
6. **No page-length requirements** (Noah «keine anforderung an eine länge der seite»): no screen budgets, no «max N screens», no «first screen» rules. **Heute** is treated like every other page (no protected layout).
7. **Every PR** has «Was fällt weg oder rutscht tiefer» and «Was ist neu» (Noah «4a»; in the app the «Neu» tile sits at the bottom of Heute). No new ideas per release. Course check once a week in the Sunday brief.
8. **Order:** Noah says what comes next. «zurück» = revert that PR at once. While a PR waits for CI or for Noah's check, go on with the next planned step as the next small PR (Noah 27.10.2026 00:14 UTC «sobald ein thread am warten ist auf einen PR (testen), soll er immer gleich mit den nächsten sinnvollen und geplanten schritten bereits weiter machen»).
9. **Quiet:** speak only with a result, a blocker or a question, in short German. No status posts at fixed times. When Noah asks what is open, name at most 3 items.
10. **Free and private:** zero costs; private data only outside the repo, no real names.
11. **Always:** everything is a suggestion and changeable; every kind of data and group can be added, renamed and deleted, with Undo; reorder with arrows and drag; explanatory text wherever users could get lost.
12. **Documentation on GitHub for every release** (Noah 26.10.2026 21:19 UTC «bitte immer dokumentation zu jedem release auf github ablegen»): since 27.10.2026 (version at merge time, rule 13) every PR adds **its own file** `docs/releases/<name>.md` (template `docs/releases/README.md`: what changed, «Was fällt weg», «Selbst entschieden», decisions, roadmap/vorhaben state) and its news file `src/lib/news/<name>.js`, both with the same name. `docs/roadmap.md` and `docs/vorhaben.md` change only where their content changes (a plan), never with a version number or a «Stand:» line. Decisions (Noah's answers, a rule, a rejection with its reason) go in **their own file** `docs/decisions/<name>.md`, same name as the release file (Noah 21.11.2026 «2a»); `docs/decisions.md` is history up to that date and gets no more lines. A PR without an app change (CI, tests, rules) still adds its release file. After the merge, memory keeps only the state.
13. **Version number at merge time** (Noah 27.10.2026 «1a»): a PR never changes the version in `package.json`/`package-lock.json`, never adds to the top of `src/lib/whatsnew.js` or to the `newerThan` list, and never writes a version in docs or `SINCE`. `scripts/news.mjs` numbers each merge by its order on `main` (with a news file 0.233.0, without 0.233.1); the PR's checks already show the number it gets if it merges next, and «Online: 0.233.0 …» names it after the merge. So open PRs never conflict over the version and never need «renumber» or a new 45-minute test run for it. How: `src/lib/news/README.md`.

## How we work

- Small decisions you take yourself go in the PR under «Selbst entschieden».
- Everything in the app is a suggestion: never mandatory, always changeable and deselectable.
- A Vercel rate-limit red does not block. Open PRs are no longer renumbered (rule 13); merge main into a PR only when GitHub shows a real conflict. After a merge, tell Noah in one short German line what is new online.
- **Groups everywhere** (Noah, 18.10.2026 «grundsätzlich überall»): every group the user sees or chooses can be renamed and deleted. Deleting asks where the contents go, with «Ohne Gruppe» preselected, and then offers Undo. It never deletes the contents. Names the user typed never go through `t()`. A new kind of group comes with rename and delete and goes in `GROUP_PLACES` (`src/lib/groups.js`), which the guard test `tests/groups.test.js` checks. Use `src/lib/ui/GroupDeleteSheet.svelte` for the delete question.
- **Pages load later** (Tempo, 19.10.2026): only Heute (`Home.svelte`) is imported at the start. A new page goes into `PAGES` in `src/App.svelte` as `Name: () => import('./pages/Name.svelte')` and is shown with `<LazyPage load={PAGES.Name} />` (`src/lib/nav/lazy.js`). Big tools (PDF, text recognition, image models, video) load with `await import()` on first use. The build stops when a JS file passes 3 MB (`scripts/size-guard.mjs`, guard test `tests/size-guard.test.js`).
- **Change everything yourself** (Noah, 19.10.2026 «alle daten können vom nutzer selber hinzugefügt, umbenannt oder gelöscht werden»): every kind of data the user sees can be added, renamed and deleted in the UI. **Delete (rule changed 24.11.2026, Noah «4a» on 23.11.2026 19:49, `docs/decisions/loeschen-rueckgaengig.md`):** what is quickly made again (an idea, a life phase, a weight, a place in a list, a photo) is deleted at once and offers Undo for 8 seconds (`UNDO_MS`, `offerDone`); things with a history (a question with answers, a group with contents, a bike, a tour) ask first in the app's own window (`askDelete`, never `confirm()`) and then offer Undo (`deleteWithUndo`). When unsure, ask. `confirm()` stays forbidden. Nothing is blocked because it is still used: the delete window asks where the dependent things go (e.g. a bike's trips, `src/lib/bikedelete.js`). App lists live in «Listen und Typen» (`STANDARD_LISTS` in `src/lib/standard.js`, applied in `src/lib/lists.js`). Open gaps: `notes/alles-bearbeiten/README.md` in the project folder.
- **Content first** (Noah 21.11.2026 «5a»): help never stands before the content of a page. A page starts with what the user came for. Help is one closed line («Was du hier tun kannst» opens the «?» window, Noah 22.11.2026 «so lassen – immer zugeklappt», and it stays) and «Alle Funktionen von …» at the page end (V7). No new card, tile field or hint line above the content; a hint line inside the content only on Heute. A new function's jump-off and «Gut zu wissen» go into these existing help places (a «Passt hier» row, the «?» window, the line at the page end), never as a new block on top. This loosens Fertig-Regel points (2) and (3): they are met by those places.
- **Course check:** `docs/vorhaben.md` lists every planned project with its why and goals. Before starting, check it fits one of the six goals; if not, ask Noah. Once a week, the Sunday brief carries a short course check with a/b questions.

## Privacy (never break)

- The repo is public. Never commit personal data: no Excel lists, backups, receipts, photos, GPX files, real bike specs, or anything from Noah's private folders.
- Tests, fixtures and screenshots use fictional data only.
- Health data is observation only. Do not name people, teams, studios or workshop staff.
- Secrets (for example the Strava client secret) live only in the Vercel environment, never in the code, chat or files.

## Every PR

- No version bump (rule 13). Add `src/lib/news/<name>.js` (1–3 points, `test` with 2+ steps, German in `de`, new feature ids in `since`; see `src/lib/news/README.md`).
- Add `docs/releases/<name>.md` (same name, template in `docs/releases/README.md`); change `docs/roadmap.md`, `docs/vorhaben.md`, `docs/design-audit.md` only where their content changes, without version numbers; a decision goes in its own `docs/decisions/<name>.md` (see `docs/decisions/README.md`), never at the end of `docs/decisions.md`.
- A new function in `src/lib/features.js` also goes into `FEATURE_MOMENTS` in `src/lib/moment.js` (its moment, or `app`); `tests/moment.test.js` checks it.
- **Names** (Noah 08.11.2026 «namen ok»): one word per thing, the list is `docs/namen.md`. Use its word in every new text; a new thing gets its row there.
- Every new UI text goes through `t('English')` and needs a German entry in `src/lib/i18n/de/*.js`, imported in `de/index.js`. The Gesamttest fails on English words in the German UI. `tests/de-luecken.test.js` fails on any `t()`/`tn()` text without a German entry.
- Use the repo's PR template if there is one; otherwise start the body with «Before:» and «After:».
- **Fertig-Regel** (Wegweiser step 25, Noah 01.11.2026 «speichere schritt 1-26 als geplant … freigabe»): a new function is done only when it has all six: (1) **page**: its entry in `src/lib/features.js` with handbook steps and an example; (2) **jump-off**: a link from the place where the need arises, not only from finder pages (a «Passt hier» row in `PASST_HIER`, `src/lib/passthier.js`, or a link on the page), never as a new block above the content (Content first); `tests/absprung.test.js` fails otherwise, and `NO_JUMP` may only get shorter; (3) **content**: on a page with the card «Was du hier tun kannst» (`ON_PAGES`, `src/lib/seiteninhalt.js`) a «Gut zu wissen» text in `src/lib/wissen/<area>.js` with German (`tests/wissen.test.js`) (it shows in the closed help line, not on top of the page); (4) **empty state**: an empty view says why it is empty and offers the next action (`src/lib/ui/Empty.svelte`); (5) **next step**: after its main action the page points to what usually comes next (like «Als Nächstes» after the debrief); (6) **app state**: a new page or group of functions gets its row in `docs/app-stand.md` (name, link, one line; no version number, no count), `tests/appstand.test.js` fails otherwise. A part left out goes in the PR under «Selbst entschieden» with the reason.
- **Was fällt weg oder rutscht tiefer** (Noah, 14.10.2026 «3a»): every PR has this section. List what is no longer there and what moves behind «Mehr», into a fold or further down, with the old and the new way; write «nichts» if nothing does. A loss that Noah did not approve needs his answer before the merge.

## Tests

- `npm test`: vitest.
- `npx playwright test <spec> --workers=1`, with `E2E_PORT=52xx` and `E2E_SKIP_GESAMTTEST=1`, for your own specs plus `tests/e2e/guard.spec.js`.
- **Phone tests after the approval** (Noah 28.10.2026 «1a», approval by a tap on «Freigeben» or «ok N»): a PR first runs only `build` and `e2e (desktop)` (the Wächter). After Noah approves, put the label `ok` on the PR; that starts `e2e (phone)` (5 parts). Merge only when it ran green on the current head. Before the label, `e2e (phone)` is skipped and looks green, so never auto-merge. Since 05.11.2026 («3a ja») `e2e (phone)` runs only the specs of the pages the PR touches (`scripts/ci-map.mjs`, from the app's own imports, plus the Kern `flow.spec.js` and `guard.spec.js`); a file every page loads, an unclear case, build or workflow files run everything, docs/news/German text files alone run none. The night run is the safety net.
- Before every PR, run locally only your own specs, the specs of the pages you changed and `guard.spec.js` (Noah, 11.10.2026 «1-5 a»). The full Gesamttest runs on GitHub. To run one shard by hand: `npx playwright test tests/e2e/gesamttest --project=desktop --shard=1/2 --workers=2`.
- Tests read their lists (blocks, categories, labels) from the app source instead of keeping copies.
- Afterwards run `git checkout -- qa/` (tests write screenshots there).
- Never skip, disable or loosen a test to get green. Fix the cause, or adapt the test when the UI changed on purpose.
- Test dates use calendar-day arithmetic in Europe/Zurich, never `Date.now() + n*864e5`.
- For «today» in app code, use `localDay()` (src/lib/localday.js), not `toISOString().slice(0,10)`.

## Ersetzt am 24.11.2026 22:19: «Ein Test, der 2× zufällig fällt» (Block 4, `CLAUDE.md`)

Noah «a-c alle» 24.11.2026 22:19 (Wackel-Wächter, `docs/decisions/wackel-waechter.md`): schon das erste zufällige Rot kommt auf die Liste. Wortlaut davor, wörtlich:

- Block 4: «**Ein Test, der 2× zufällig fällt,** kommt auf die Liste und wird noch am selben Tag stabil gemacht (Wackel-Thread).»
- `CLAUDE.md`: «A test that fails twice by chance goes on the list and is made stable the same day.»
