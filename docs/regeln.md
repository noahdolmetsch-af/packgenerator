# Regeln: so arbeiten wir

Das ist die **eine Quelle für die Arbeitsweise**, in neun Blöcken (Noah «1-5a» 24.11.2026 16:50: von 33 Einzelregeln auf 9 Blöcke, etwa eine Seite).
Jeder Block nennt sein Datum und seine Quelle. Es steht keine Versionsnummer und keine «Stand:»-Zeile hier (Regel «Versionsnummer beim Merge» in `CLAUDE.md`).

**Rangfolge:** Noahs neuste Nachricht im Thread > diese Datei > `CLAUDE.md` (Regeln im Code, Technisches zu PRs und Tests) > alles andere.
Die alten 33 Regeln R1–R33 und alle überholten Fassungen stehen wörtlich in [regeln-archiv.md](regeln-archiv.md), nie mehr als Regel.

---

## Block 1 · Massstab

(Noah 23.11.2026 18:09 UTC und 22:27 Leitfaden; Noah «1-5a» 24.11.2026 16:45 und 16:50.)
Die App soll Noah im Alltag unterstützen. Jede Änderung dient **Klarheit** (man sieht sofort, wo man ist und was man hier tun kann: eine Hauptsache pro Bildschirm, sinnvolle Absprünge, nie stecken bleiben),
**Auffindbarkeit** (Wichtiges oben und mit wenigen Tipps erreichbar, Häufiges vorne, die Suche findet Verstecktes) und dem Leitfaden `docs/leitfaden.md` (bleibt ganz). Andere Ziele sind kein Massstab mehr.
Passt etwas nirgends, fragt der Thread Noah. Der Kurs-Check kommt einmal pro Woche im Sonntags-Brief.
So fühlt sich die App für Nutzer an, auf jeder Seite:
- **Inhalt zuerst:** Hilfe steht nie vor dem Inhalt, nur als geschlossene Zeile und am Seitenende.
- **Alles ist ein Vorschlag** und alles ist selbst änderbar, mit Rückgängig. **Nichts fällt ersatzlos weg**; alte Daten und Adressen bleiben gültig. Die Lösch-Regel steht in `CLAUDE.md`.
- Keine Längen-Vorgaben für Seiten; Erklärtexte dort, wo man sich verlieren könnte; einfaches Deutsch, ein Wort pro Sache (`docs/namen.md`).

## Block 2 · Wie ich mit Noah schreibe

(Noah 26.10.2026 «ruhig» und «Fragen»; 23.11.2026; Noah 24.11.2026 16:29 und 16:31 «mehr antworten, klar sagen, wovon die Rede ist»; 16:45 und 16:50.)
- **Wann:** Nur mit Ergebnis, Blocker oder Frage. Dazu zwei feste Rundgänge des Koordinators, **08:00 und 20:00** (der Abend prüft Block 9). Sonst keine Status-Posts. Fragt Noah, was offen ist: höchstens 3 Punkte.
- **Wie viel:** ausführlich, nicht zu knapp. Was ist passiert, warum, was bedeutet es für Noah, was kommt als Nächstes, in einfachem Deutsch und ganzen Sätzen. Noah ist kein Entwickler; GitHub-Schritte Klick für Klick.
- **Klar, wovon die Rede ist:** Jede Nachricht verlinkt den Thread, nennt das Thema in Worten, erklärt **jede PR-Nummer mit ihrer Bedeutung in Worten** (höchstens 3–4 PR-Nummern pro Nachricht) und benennt den offenen Punkt. Nie nur Nummern oder Kürzel.
- **Fragen:** höchstens 5 pro Runde, a/b ausgeschrieben, mit Empfehlung ★. Zuerst alles fragen, was man braucht, dann selbständig arbeiten. Komplexität nur zeigen, wo sie für Noahs Entscheid wichtig ist.
- **Mockups** nur für Grosses (neue Seite, neuer Ablauf). Alles andere: bauen, dann Bilder.
- **Ausnahme: die «Online»-Zeile** bleibt eine Zeile mit Thread-Link, Testanleitung und der PR-Nummer in Worten (Block 6).

## Block 3 · Wer macht was

(Noah ok 23.11.2026 20:54; Noah 23.11.2026 und 24.11.2026.)
- **Besitzer pro Ort:** Neue Arbeit geht an den Thread, der den Ort besitzt (Liste im Projekt-Gedächtnis). Keine neuen Threads ohne Grund, nichts doppelt. Alle Threads laufen mit Sonnet 5.5.
- **Nur Noahs eigene Worte lösen Folgenreiches aus:** Ein Thread pusht erst, wenn Noahs eigene Nachricht angehängt ist (Weiterleitung allein genügt nicht). Einen PR schliessen nur mit «schliessen NNN», einen Force-Push nur mit «Ja force push NNN».
- Der Bündler («Mein Überblick») führt die Merge-Reihenfolge und setzt das Label `ok`; der Koordinator hat keinen GitHub-Zugriff.

## Block 4 · PRs und Stau

(Noah 23.11.2026 18:58; Noah 24.11.2026 07:29 «1 2 3 4 5», 10:27, 16:38, 16:58 «a».)
- **Ein PR pro Seite**, kleine Änderungen derselben Seite gebündelt. Einzeln bleiben Datenänderungen (Dexie, Backup, Sync, `api/`) und Test-Fixes.
- **Grenzen** (Noah «a» 24.11.2026 16:58, ersetzt «höchstens 6 offen» von 16:38): **höchstens 5–6 PRs gleichzeitig in der Prüfung auf GitHub, bis 8 offen insgesamt; 6–10 Threads arbeiten gleichzeitig.** Ein neuer PR wird erst geöffnet, wenn in der Prüfung weniger als 5–6 sind und insgesamt weniger als 8 offen; sonst wartende PRs abbauen helfen.
- **Was darüber hinaus fertig wird** (Wellen der impeccable-Prüfung), wird **lokal gebaut und getestet, ohne PR und ohne Push**, bis der Bündler «Platz» meldet (Platz heisst: unter den Grenzen oben). Wartet ein PR auf CI, geht der Thread am nächsten Schritt weiter, lokal vorbereitet (Noah 27.10.2026).
- **Main rot:** bis zu 1 Stunde nichts anderes mergen, bis repariert.
- **Ein Test, der 2× zufällig fällt,** kommt auf die Liste und wird noch am selben Tag stabil gemacht (Wackel-Thread).
- Ziel der CI: etwa 15 Minuten statt 25–70, mit Tests nur der geänderten Seite (Thread «Tests schneller machen»).

## Block 5 · Freigabe und Merge

(Noah 23.11.2026 00:03 und 06:00 «alles frei, freie Hand», `docs/decisions/alles-freigegeben.md`; Noah «1-5a» 24.11.2026 16:50; Bilder Noah 24.11.2026 16:53 und 16:54 «1a».)
- **Normalfall: bei grüner Prüfung geht alles ohne Freigabe online.** Kein «ok NNN» pro PR. Dependabot- und Wächter-Reparaturen genauso. Nie auto-mergen bei roter Prüfung.
- **Ausnahme: Noahs Daten könnten verloren gehen** (Löschen, Backup, Sync, Datenbank, `api/`). Dann fragt der Thread **zuerst Noah** und merged erst nach seiner Antwort. Vorher: Test mit der Kopie eines Backups und ein frisches Backup von Noah bereit
  (der Thread bittet ihn darum, wenn sein letztes älter als ein Tag ist; es liegt in `/mnt/project-files/private/`, nie im Repo).
- **«zurück»** von Noah nimmt einen PR sofort zurück (Revert).
- **Bilder zu jedem PR** (Noah 24.11.2026 16:53: «ich möchte ab sofort immer für jeden PR bilder sehen»): Jeder PR mit sichtbarer Änderung zeigt Noah Bilder **schon beim Öffnen**, in der Meldung an ihn, nicht erst bei «Online» (Handy 390 und Computer 1440, deutsch, erfundene Daten, wo sinnvoll vorher und nachher). Ein PR ohne sichtbare Änderung (Test, Doku, CI) braucht kein Bild, nur einen Satz «Nichts Sichtbares geändert, nur …» (Noah «1a» 24.11.2026 16:54). Wie die Bilder aussehen: Block 6.
- **Jeder PR sagt, was er tut:** «Was fällt weg oder rutscht tiefer» (sonst «nichts»), «Was ist neu», Screenshots, 2–4 Prüfschritte, kleine Entscheide unter «Selbst entschieden». Ein Verlust, den Noah nicht freigegeben hat, braucht seine Antwort vor dem Merge. Dateiliste und Fertig-Regel: `CLAUDE.md`.
- Merge-Prüfung (Basis `main`, konfliktfrei, linearer Zweig): `CLAUDE.md`.

## Block 6 · Nach dem Merge

(Noah 23.11.2026 13:17, 20:46; Noah 24.11.2026 01:24, 02:24 und 16:53.)
- **Live-Test im Browser** auf der echten Seite (Handy 390, Computer 1440), Prüfschritte durchgehen, Konsole lesen. Bei Fehler zuerst beheben.
- **«Online» erst nach grünem Deploy** (GitHub Pages; bei `api/` auch Vercel «packgen» bereit und neu deployen). Die Meldung ist **eine Zeile** mit Thread-Link, Link zur Seite, Testanleitung, und die PR-Nummer in Worten.
- **Bilder** (zu jedem PR, Block 5; nach dem Merge noch einmal von der Live-Seite): Handy und Computer, **App und Browser auf Deutsch**, die Bilder **zeigen die Änderung selbst**, nötigenfalls mit erfundenen Beispieldaten. Eine leere App zählt nicht. Ablage `/mnt/project-files/online-bilder/<PR>/`; der Koordinator hängt sie an. Auch rückwirkend.

## Block 7 · Tests

(Noah 11.10.2026; 26.10.2026; Noah «a» 24.11.2026 15:18; Noah «2a» 24.11.2026 10:27; Lessons 23./24.11.2026.)
- **Lokal:** die eigenen Tests und die Tests der geänderten Seite. **Wer eine Seite umbaut, sucht vor dem PR auch alle fremden Tests, die diese Seite antippen** (Adresse, Überschrift, Beschriftung in `tests/`), und lässt sie lokal laufen. Der Gesamttest läuft auf GitHub.
- **Nie lockern:** Kein Test wird übersprungen, abgeschaltet oder gelockert, um Grün zu bekommen. Ursache beheben, oder den Test mit Absicht anpassen, wenn sich die Oberfläche mit Absicht geändert hat.
- **Volle Prüfung** nur einmal pro schwerem PR (berührt `db.js`, `package.json`, `api/`, `.github/`), am Schluss (im Bau, Thread «Tests schneller machen»); bis dahin gilt sie für Daten-PRs.
- Befehle, Phone-Test-Mechanik (Label `ok`) und Lessons zu Wackel-Tests: `CLAUDE.md`.

## Block 8 · Privat und gratis

(Noah 04.10.2026 ff.; Noah 26.10.2026 «gratis»; Noah 23.11.2026 «KI-Schlüssel in Vercel»; ausdrücklich ergänzt Noah «1-5a» 24.11.2026 16:45.)
Das Repo ist öffentlich. Keine persönlichen Daten, keine echten Namen, keine Backups, Belege, Fotos, GPX, Excel-Listen, Schlüssel.
**Bankname, IBAN, Konten, Beträge, Fotos und ICS-Token stehen nie in Repo, Chat oder Gedächtnis.** Entwürfe mit Echtdaten (zum Beispiel Seiten oder Dokumente) werden nie öffentlich gemacht.
Privates liegt nur in `/mnt/project-files/private/`. Tests und Bilder nutzen nur erfundene Daten. Gesundheitsdaten sind reine Beobachtung.
**Null Kosten.** Der KI-Schlüssel bleibt in Vercel.

## Block 9 · Aktuell halten

(Noah 03.11.2026, 23.11.2026, 24.11.2026; Noah «1-5a» 24.11.2026 16:50.)
Drei Orte, je eine Aufgabe, **kein Text steht an zwei Orten**:

| Ort | Was dort steht | Wer ändert es |
|---|---|---|
| **Projekt-Anweisung** (Claude-Projekt) | Eine Seite: Ziele, Leitfaden, Nutzerkriterien, die wichtigsten Arbeitsregeln. Sie zeigt auf die Blöcke 1–8 und diese Datei. | Koordinator, nur nach Noahs Ja |
| **Projekt-Gedächtnis** (`MEMORY.md`) | Nur der aktuelle Stand: Besitzer pro Ort, Offenes, letzte Entscheide. Kein Verlauf. | Koordinator, sofort bei jeder Änderung |
| **Repo** (`docs/regeln.md`, `CLAUDE.md`) | Die neun Blöcke und die Regeln für den Code. | Doku-PR (ein Platz beim Bündler) |

Ablauf bei einer neuen Regel von Noah: (1) Koordinator speichert sie sofort im Gedächtnis unter «Letzte Entscheide»; (2) er legt sie im passenden Block hier ab, mit Datum und Quelle (Doku-PR, gebündelt mit anderen Regeln des Tages);
(3) betrifft sie die Ziele oder die wichtigsten Arbeitsregeln, schlägt er Noah die Änderung der Projekt-Anweisung vor; (4) ersetzt sie eine ältere, wandert die alte wörtlich in `regeln-archiv.md`.
Jeder PR bringt seine Doku mit (`CLAUDE.md`, «Jeder PR»); vor jeder Abfrage liest jeder Thread `docs/app-stand.md` und das Projekt-Gedächtnis (Noah 03.11.2026).

Der Abend-Rundgang (20:00) vergleicht: Stehen alle Regeln der Projekt-Anweisung hier? Steht im Gedächtnis eine Regel, die hier fehlt? Gibt es «Stand»-Einträge, die erledigt und älter als 2 Tage sind? Abweichungen meldet er Noah in einer Zeile.
Ein Test (`tests/regeln-doku.test.js`) hält die Form: neun Blöcke in dieser Reihenfolge, jeder mit Datum und Quelle, `CLAUDE.md` verweist auf diese Datei und nennt nur Blöcke, die es gibt.
