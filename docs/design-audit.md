# Design-Audits

Regel (Noah, 9.10.2026): Ein schönes Design ist genau so wichtig wie die Funktionen. Das gilt für jede Seite, Unterseite, jeden Dialog, jedes Blatt, jeden Leer- und Fehlerzustand. Keine neue Funktion wird gebaut, bevor das Design-Audit ihrer Runde erledigt ist.

## Wann

- **Vor jedem Funktions-Release (0.x.0):** eine Audit-Runde. Die Korrekturen kommen vorher als Design-Release (0.x.y).
- **Vor jedem neuen Screen oder Dialog:** zuerst ein Mockup auf der Designfläche (Computer 1440 und Handy 390, hell und dunkel). Noah gibt es frei, erst dann wird gebaut.
- **In jedem PR, der Oberfläche ändert:** Vorher/Nachher-Bilder der geänderten Screens in der PR-Beschreibung.

## Zwei Richtungen pro Runde

1. **Rückblickend:** alle Screens, die sich seit der letzten Runde geändert haben, plus ein rotierender Bereich aus dem Inventar unten. So wird jeder Screen mindestens jede dritte Runde angeschaut.
2. **Vorausschauend:** Mockups für Screens und Dialoge der nächsten Funktion. Noah beantwortet die a/b-Fragen dazu vor dem Bau.

## Ablauf

1. **Bilder** jedes Screens im Umfang: Computer 1440 und Handy 390 (bei vollen Screens auch 320), hell und dunkel, mit seinen Dialogen, dem Leer- und dem Fehlerzustand. Nur künstliche Daten im Repository; die Bilder liegen im Projektordner `design/audit-<version>/`.
2. **Bewertung 1 bis 5 pro Screen** in acht Kriterien:
   1. Freude: sieht es gut aus, würde man es jemandem zeigen?
   2. Ruhe: kein Textlärm, keine wiederholten Beschriftungen pro Zeile, Seltenes eingeklappt.
   3. Hierarchie: ein Blickfang, eine klare Hauptaktion, abgesetzte Überschriften, Zahlen rechtsbündig.
   4. Einheitlichkeit: gleiche Farben, Bausteine, Symbole und Abstände wie im Stilblatt.
   5. Handy: 44 px Tippflächen, kein seitliches Scrollen, untere Leiste erreichbar.
   6. Lesbarkeit: keine mitten im Wort getrennten Wörter, genug Kontrast, Schriftgrössen.
   7. Zustände: leer, ladend, Fehler und erledigt sehen gestaltet aus, nicht vergessen.
   8. Aufwand: Tipps und Felder für die Hauptaufgabe.
3. **Befunde** mit Schwere (A kaputt, B unschön und verwirrend, C Feinschliff) und dem verletzten Prinzip. Jeder Screen mit einer Note unter 4 bekommt ein Vorschlags-Mockup.
4. **Durchgang mit Noah, Screen für Screen,** auf der Designfläche, mit a/b-Fragen und ★ für die Empfehlung.
5. **Design-Release** mit den Korrekturen; die Noten im Inventar werden nachgeführt.

## Noahs fünf Prinzipien (PDF 8.10.2026)

1. Schrittweise zeigen: seltene Optionen, Ausnahmen und Wenn-dann-Regeln eingeklappt.
2. Kein Textlärm: Abschnittstitel plus ruhiges Symbol statt Beschriftung in jeder Zeile.
3. Hierarchie und Summen: Überschriften abgesetzt, Zahlen rechtsbündig mit gleich breiten Ziffern.
4. Umschalter für Zustände, kleine Abzeichen statt roter Zeilen.
5. Zeilenaktionen am Computer ruhig, bei Hover und Fokus voll, am Handy immer sichtbar.

Bildsprache: «Gletscher» (gewählt 9.10.2026), hell und dunkel. Die Farbwerte stehen in `src/app.css`.

## Regel: Eine Abarbeitungsliste leert sich selbst

Noah, 9.10.2026 (0.47): Eine Liste, die man abarbeitet, leert sich selbst: Eine eingeordnete Zeile geht weg (ruhig, etwa 150 ms), die nächste rückt nach und bekommt den Fokus, ein Hinweis «✓ Name → Ziel · Rückgängig» bietet die Rücknahme an; «Rückgängig» stellt die Zeile an ihrem Platz wieder her. Eine leere Liste zeigt eine ruhige Zeile mit einer Aktion. Gilt nicht für Listen, deren Zeilen sichtbar bleiben sollen (Packliste, Material, Entscheide, die bis zum Übernehmen änderbar sind). Umgesetzt in 0.47: Kleiderschrank «Noch einordnen», Inbox, Material → Prüfen. Ab 0.47.1 ist die Inbox eine Liste neueste zuerst; eine eingeordnete Notiz bleibt als Link an ihrem Platz (Noah). Begründung pro Ort in `docs/decisions.md`.

## Wächter

Automatische Prüfungen bei jedem PR (Skill «packgenerator-einheitlich»), damit alte und neue Seiten gleich aussehen und sich gleich bedienen lassen. Sie fangen Fehler wie die Beschriftung mit der globalen Klasse `.sw` (ein Buchstabe pro Zeile) oder die Pflege-Chips «Di ch tm ilc h».

1. **Stil-Prüfung** (`scripts/style-lint.mjs`, läuft mit `npx vitest run` in `tests/style-lint.test.js`), pro Datei in `src/`:
   - `colour`: keine Farbwerte (hex, `rgb()`, `hsl()`) ausserhalb von `src/app.css`, nur `var(--…)`, `transparent`, `currentColor`, `inherit`;
   - `breakword`: kein `overflow-wrap: anywhere` und kein `word-break: break-all`;
   - `global`: eine Komponente definiert keine eigene Regel `.x { … }` für eine Klasse, die `src/app.css` schon global gestaltet (`.sw`, `.btn`, `.card`, `.lbl`, `.num` …);
   - `fontsize`: Schriftgrössen nur über die Stufen `var(--fs-page|section|sub|body|label|small)`, auch in `font: …`.
2. **Konsistenz-Test** (`tests/e2e/guard.spec.js`, Playwright): 20 Hauptseiten (Heute, Touren, Packen, Vorlagen, Vergangene Touren, Unterwegs, Rückblick, Fahrt hochladen, 12 Monate, Material, Wiegen, Wunschliste, Import prüfen, Favoriten, Bausteine, Kleiderschrank, Velos Setup und Pflege, Inbox, Funktionen) am Handy mit 320 und 390 px und am Computer mit 1440 px, mit den künstlichen Daten aus `tests/e2e/home0460-fixture.js`. Gezählt: `hscroll` (seitliches Scrollen), `wordbreak` (ein Wort steht auf zwei Zeilen), `target` (Handy: Knopf oder Link kleiner als 44 × 44 px; Links mitten in einem Satz sind erlaubt), `h1` (nicht genau ein Seitentitel), `primary` (mehr als ein Hauptknopf `.btn.hi`, nur gemeldet, nie rot).
3. **Noch alles da?** (`tests/e2e/functions.spec.js`): jede der 16 Funktionen aus «Alle 16 Funktionen» ist von Heute aus mit höchstens zwei Tipps erreichbar und öffnet ihre Seite oder ihr Fenster ohne Konsolenfehler. Fehlt eine, wird der Test rot.

**Grundlinie** `tests/guard-baseline.json`: die Verstösse, die es beim Einführen schon gab (`style`: Datei → Regel → Anzahl; `layout`: Seite@Breite → Regel → Anzahl). Rot wird nur, wer mehr Verstösse hat als dort steht, oder eine neue Datei mit Verstössen. Die Meldung nennt jede Stelle (Datei:Zeile oder Element und Wort).

- **Die Grundlinie darf nur kleiner werden.** Ein PR, der eine Zahl erhöht, erklärt in der Beschreibung warum. Wer Verstösse behebt, senkt die Zahl im selben PR.
- Stil neu schreiben: `node scripts/style-lint.mjs --update` (ohne `--update` druckt es die Übersicht und was kleiner werden kann).
- Seiten neu schreiben: `GUARD_UPDATE=1 npx playwright test tests/e2e/guard.spec.js`, dann `node scripts/style-lint.mjs --merge-e2e` (druckt die Übersicht der Seiten; im Update-Lauf listet der Test jeden Befund, das ist die Aufräumliste).

## Screen-Inventar

Note = tiefste Kriteriumsnote im letzten Audit (– = noch nicht geprüft).

| Bereich | Screen oder Dialog | Letztes Audit | Note |
|---|---|---|---|
| Heute | Startseite | Neubau 0.46 | – |
| Heute | Neu-Blatt, Mehr-Menü, Suche | – | – |
| Touren | Tour/Packen (Liste, Packtag, Velozeichnung, Taschen) | 9.10.2026 (0.47: Velo mit Taschen oben, Gewichtskarte) | 3 |
| Touren | Tour-Dialog, Vorlagen-Dialog, Lade-Blatt | 9.10.2026 (0.47.3: Wetter-Chips wie auf der Tourseite, Trocken/Regen) | 3 |
| Touren | Unterwegs | – | – |
| Touren | Rückblick, Vergleich, Tempo, Logbuch | – | – |
| Touren | Vergangene Touren, Fahrten, Jahresrückblick, Teilen | – | – |
| Touren | Vorlagen, Vorlage neu/bearbeiten, Bausteine | – | – |
| Material | Materialliste, Teil-Dialog, Zuordnen, Zusammenlegen | 9.10.2026 (0.47: Reiter, Karten, Punkte) | 3 |
| Material | Kleiderschrank | 9.10.2026 (0.47 neu gebaut nach Mockup) | 4 |
| Material | Import prüfen, Favoriten, Wunschliste | – | – |
| Velos | Setup, Velo-Dialog, Taschen-Dialog/-Blatt | 9.10.2026 (0.47: nur Kopfband in der Gletscher-Schrift) | 3 |
| Velos | Velopflege, Teil-, Werkstattbesuch- und Bestell-Dialog | 9.10.2026 (0.47: Schrift vereinheitlicht, «Jetzt fällig» als Karten; Dialoge noch alt) | 3 |
| Weiteres | Inbox/Notiz, Funktionen-Seite | 9.10.2026 (0.47: Inbox leert sich selbst) | 3 |

Geplante Screens (zuerst Mockup): Im Flow (Übersicht, Tagescheck, Woche, Tennis, Neuland), Einkaufszettel, Lebenslauf eines Teils, Werkstatt-Anleitungen.

## Offen: Angleichen

Nach der Mitziehen-Regel: was in 0.47 noch nicht auf dem neuen Stand ist, mit Zielrelease.

- Baukasten in `src/lib/ui/` (PageHead, SectionHead, Card, Row, Badge, Button, Stat, Empty, Toast) als echte Komponenten; 0.47 nutzt gemeinsame Klassen in `app.css` (`.surf`, `.zlabel`, `.bignum`, `.tbar`, `.pill`). Ziel 0.48.
- Wächter-Tests (Stil-Lint, Konsistenz-Test pro Route bei 320/390/1440 hell und dunkel, Bild-Vergleich). Ziel 0.48.
- Ein gemeinsamer Toast mit «Rückgängig»: Kleiderschrank, Inbox und Prüfen haben je einen eigenen. Ziel 0.48.
- Material: Seitenspalte «Wo das Gewicht steckt» als Gewichtskarte wie auf der Tour; Teil-Dialog. Ziel 0.48.
- Packtag (PackStage) mit derselben Velozeichnung und Gewichtskarte wie Planen. Ziel 0.48.
- Velos/Setup: nur das Kopfband ist angeglichen; Zeichnung, Taschen-Blatt und Dialoge folgen. Velopflege-Dialoge (Teil, Werkstattbesuch, Bestellung). Ziel 0.48.
- Material → Wiegen und Import prüfen «Unsicher»: bleiben bewusst (siehe decisions.md), Optik auf Karten-Token. Ziel 0.48.
- Heute, Touren-Übersicht, Rückblick, Unterwegs: Karten-Token wirken schon, Kopf und Zahlen noch nicht nach Stilblatt. Ziel D2/D3.

## Protokoll

- 9.10.2026: Regel eingeführt. Erste Runde gestartet: Neuentwurf Kleiderschrank, Material, Tour und Velos sowie erste Mockups für Im Flow und 0.47.
- 9.10.2026, 0.47 «Aufpimpen» (D1): Kleiderschrank nach Mockup neu (Note 2 → 4); Tour/Packen mit Velo und Gewichtskarte, Material mit Reitern und Karten, Velopflege mit einer Schriftordnung und «Jetzt fällig» als Karten, Setup-Kopfband angeglichen, Inbox und Prüfen leeren sich selbst. Neue Regel «Eine Abarbeitungsliste leert sich selbst». Bilder vorher/nachher: `design/audit-0.47/` (Velopflege: `care-*`). Offenes unter «Offen: Angleichen».
- 9.10.2026, 0.47.3: Tour-Dialog: Wetter-Chips setzen statt umschalten, Trocken/Regen als zwei Chips wie auf der Tourseite (Note 3). Packliste: das ••• bleibt rechts in seiner Zeile, wenn «Rückgängig» erscheint; alle •••-Menüs bleiben bei 320 und 390 px im Bild (`ui/inview.js`). Bilder: `design/v0473/vorher`, `nachher`.
