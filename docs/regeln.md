# Regeln: so arbeiten wir

Das ist die **eine Quelle für die Arbeitsweise** (wer macht was, wann, in welcher Reihenfolge, wann geht etwas online).
Jede Regel nennt ihr Datum und ihre Quelle. Es steht keine Versionsnummer und keine «Stand:»-Zeile hier (Regel «Versionsnummer beim Merge» in `CLAUDE.md`).

**Rangfolge:** Noahs neuste Nachricht im Thread > diese Datei > `CLAUDE.md` (Regeln im Code: Datenschutz, PR-Dateien, Tests) > alles andere.
Ältere Regeln und überholte Fassungen stehen nur noch in [regeln-archiv.md](regeln-archiv.md), nie mehr als Regel.

**Wer sie pflegt:** Eine neue Regel von Noah kommt in dieselbe Stunde hierher (Koordinator, oder der Thread, der sie hört, per Doku-PR).
Der Abend-Rundgang (20:00) prüft, ob Projekt-Anweisung, Gedächtnis und diese Datei übereinstimmen (siehe Abschnitt 9).

---

## 1. Ziel und Massstab

**R1 · Eine App, die mich im Alltag unterstützt.** Jede Änderung dient einem der sechs Ziele in `docs/vorhaben.md` und dem Leitfaden `docs/leitfaden.md`
(Noah, 23.11.2026). Passt etwas nirgends, fragt der Thread Noah. Der Kurs-Check kommt einmal pro Woche im Sonntags-Brief.

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
und mit Lösungsvorschlägen zurückkommen. Bei komplexen Dingen zuerst die Komplexität zeigen (Projekt-Anweisung).

**R7 · Mockups nur für Grosses** (Noah 26.10.2026; neue Seite, neuer Ablauf wie die Live-Karte). Alles andere: bauen, dann Bilder.

**R8 · Besitzer pro Ort** (Noah ok 23.11.2026 20:54). Neue Arbeit geht an den Thread, der den Ort besitzt (Liste im Projekt-Gedächtnis). Keine neuen Threads ohne Grund, nichts doppelt.
Alle Threads laufen mit Sonnet 5.5.

**R9 · Nur Noahs eigene Worte lösen Folgenreiches aus** (Noah 23.11.2026; 24.11.2026). Ein Thread pusht erst, wenn Noahs eigene Nachricht angehängt ist (Weiterleitung allein genügt nicht).
Schliessen eines PR nur mit «schliessen NNN». Force-Push nur mit «Ja force push NNN» in Noahs eigener Nachricht im Thread (24.11.2026).

## 3. PRs und Stau

**R10 · Ein PR pro Seite, gleiche Seite gebündelt** (Noah 23.11.2026 18:58; Stau-Regel 4, 24.11.2026 07:29). Kleine Änderungen derselben Seite kommen in einen PR.
Einzeln bleiben: Datenänderungen (Dexie, Backup, Sync, `api/`) und Test-Fixes. Das ersetzt «kleine PRs für alles, keine Bündel» (26.10.2026).

**R11 · Stau-Regeln** (Noah 24.11.2026 07:29, «1 2 3 4 5»):
1. Neues erst bauen, wenn höchstens 8 PRs offen sind; sonst wartende PRs abbauen helfen.
2. Main rot: bis zu 1 Stunde nichts anderes mergen, bis repariert.
3. Ein Test, der 2× zufällig fällt, kommt auf die Liste und wird noch am selben Tag stabil gemacht (Wackel-Thread).
4. Kleine Änderungen derselben Seite in einen PR bündeln (R10).
5. CI von 25–70 Minuten auf etwa 15 Minuten: nur Tests der geänderten Seite (Thread «Tests schneller machen», R24).

**R12 · Höchstens 8 offen, davon 5–6 gleichzeitig in der Prüfung** (Noah 24.11.2026 01:17 «nur 5–6 aktive PRs»; Noah «1a» 24.11.2026 10:27, verbindet es mit R11.1). Der Rest wartet lokal gebaut (R13).

**R13 · Wellen (impeccable-Prüfung, Noah 24.11.2026 07:37 «1-5a» und «ja» ~08:40).** Pakete einer Welle werden **lokal gebaut und getestet, ohne PR und ohne Push**,
bis der Bündler «Platz» meldet (≤ 8 offen). Welle 3 wartet, bis Welle 1 und 2 gemergt sind.

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

**R26 · Privat** (Noah 04.10.2026 ff.): Das Repo ist öffentlich. Keine persönlichen Daten, keine echten Namen, keine Backups, Belege, Fotos, GPX, Excel-Listen, ICS-Token, Schlüssel.
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
