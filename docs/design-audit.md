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

## Screen-Inventar

Note = tiefste Kriteriumsnote im letzten Audit (– = noch nicht geprüft).

| Bereich | Screen oder Dialog | Letztes Audit | Note |
|---|---|---|---|
| Heute | Startseite | Neubau 0.46 | – |
| Heute | Neu-Blatt, Mehr-Menü, Suche | – | – |
| Touren | Tour/Packen (Liste, Packtag, Velozeichnung, Taschen) | – | – |
| Touren | Tour-Dialog, Vorlagen-Dialog, Lade-Blatt | – | – |
| Touren | Unterwegs | – | – |
| Touren | Rückblick, Vergleich, Tempo, Logbuch | – | – |
| Touren | Vergangene Touren, Fahrten, Jahresrückblick, Teilen | – | – |
| Touren | Vorlagen, Vorlage neu/bearbeiten, Bausteine | – | – |
| Material | Materialliste, Teil-Dialog, Zuordnen, Zusammenlegen | – | – |
| Material | Kleiderschrank | 9.10.2026 (Noah: nicht schön) | 2 |
| Material | Import prüfen, Favoriten, Wunschliste | – | – |
| Velos | Setup, Velo-Dialog, Taschen-Dialog/-Blatt | – | – |
| Velos | Velopflege, Teil-, Werkstattbesuch- und Bestell-Dialog | – | – |
| Weiteres | Inbox/Notiz, Funktionen-Seite | – | – |

Geplante Screens (zuerst Mockup): Im Flow (Übersicht, Tagescheck, Woche, Tennis, Neuland), Einkaufszettel, Lebenslauf eines Teils, Werkstatt-Anleitungen.

## Protokoll

- 9.10.2026: Regel eingeführt. Erste Runde gestartet: Neuentwurf Kleiderschrank, Material, Tour und Velos sowie erste Mockups für Im Flow und 0.47.
