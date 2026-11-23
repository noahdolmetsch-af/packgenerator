# Plan: die ganze App aus einem Guss

Die Schritte aus dem Entwurf «Die ganze App aus einem Guss» (Noah 07.11.2026 «1-5a»; Fragen 1–5 am selben Abend mit «1a 2a 3a 4a 5a» bestätigt; Reihenfolge und Entscheide am 08.11.2026 in einem zweiten Durchgang der Fragen 1–11 neu festgelegt). Entwurf: https://claude.ai/artifact/VdWiqzEZgkByonBDYzrrFt, ergänzt durch https://claude.ai/artifact/1ukLWgB5y9ExhT6enzDeVT (Tour von A bis Z und Datencenter).

Der Test `tests/plan.test.js` liest diese Tabelle. Wer die Zahl sehen will: `node scripts/plan-stand.mjs` («Plan: X von Y online»).

## So pflegt man die Tabelle

- **Stand:** `offen` (nichts gebaut), `gebaut` (PR offen oder gemergt, aber noch nicht geprüft online), `online` (auf der echten Seite, Noah hat es freigegeben), `gestrichen` (Noah hat den Schritt gestrichen; kein PR, kein Weg, zählt nicht mit).
- **PR:** Nummer mit `#`, bei `gebaut` und `online` Pflicht.
- **Weg:** woran man den Schritt in der App erkennt. Bei `online` Pflicht. Der Test wird rot, wenn ein Weg später fehlt (eine Seite, ein Baustein oder eine Funktion wurde entfernt). Schreibweise: `datei:<Pfad>`, `text:<Pfad>|<Wort>`, `funktion:<Kennung>`, mehrere mit `;`, `-` heisst «noch kein Weg».
- **Wer pflegt:** der Bau-PR eines Schritts setzt seine Zeile auf `gebaut`; nach der Freigabe und dem Merge steht sie auf `online`. Ein Schritt wird nie zurückgesetzt, ausser Noah entscheidet es (dann Eintrag mit Grund in `tests/fixtures/plan-online.json` unter `abgeloest`).
- **Bild-Vergleich:** Jeder Bau-PR zeigt sein Bild neben dem freigegebenen Entwurf und schreibt «gleich» oder «weicht ab, weil …».

Reihenfolge der Bauschritte (jeder PR einzeln mit Bildern und «ok»; abgestimmt mit den anderen Threads, siehe unten; Entscheide: `docs/decisions.md`):

| Schritt | Titel | PR | Stand | Weg |
| --- | --- | --- | --- | --- |
| 0a | Tour-Stand rechnen (ohne Anzeige) | #1136 | online | datei:src/lib/tourpfad/stand.js; datei:tests/tourstand.test.js |
| 0b | Seite «Meine Datenquellen» | #1143 | online | datei:src/pages/Quellen.svelte; funktion:f.quellen |
| 1 | Pfad-Baustein (baut auf «Weg zum Ziel» als Linie auf), Tour-Pfad mit 4 Phasen | #1184 | online | datei:src/pages/Tourpfad.svelte; datei:src/lib/ui/Pfad.svelte; funktion:f.tourpfad |
| 1b | Vier Phasen statt Schrittleiste (die Leiste der Tour zeigt Planen, Vorbereiten, Unterwegs, Danach und Auswertung) | #1205 | gebaut | - |
| 4a | Datencenter-Einstieg: erster Reiter «Fragen» in Auswerten (die Suche zeigt auch Fragen) | #1226 | gebaut | - |
| 2a | Karte «Meine Tour» auf Heute, ersetzt die Karte «Vorab» (nur bei geplanter Tour) | #1232 | online | datei:src/lib/home/MeineTour.svelte; datei:src/lib/tourpfad/karte.js; datei:tests/meinetour.test.js |
| 9 | Adress-Tabelle: entfällt als eigener Schritt. Die Seitenleiste (10) ändert keine Adresse; jeder Schritt, der eine Adresse ändert, bringt seine Weiterleitung in `redirectOf` selbst mit, ohne Hinweis (Durchklick DK6) | - | gestrichen | - |
| 10 | Seitenleiste 11 → 8 Orte: Quick Links, Inspiration und Ausrüstung sind keine eigenen Orte mehr | #1284 | online | datei:src/lib/nav/SideBar.svelte; datei:tests/seitenleiste.test.js |
| 2b | Heute: Hauptkarte nach Lage und «Mehr für heute»; erst nach den Entscheiden des Threads «Startseite ruhiger» | - | offen | - |
| 4b | Tourseite mit vier Phasen (Plan, Packen, Unterwegs, Danach), Packliste zuerst; ersetzt die drei Schrittlisten | #1293 | online | datei:tests/e2e/packliste-zuerst.spec.js |
| 7a | Unterwegs-Modus: Noah schaltet ihn selbst ein (Knopf auf «Meine Tour», kein Autostart) | - | offen | - |
| 7b | Danach, «Das fällt auf» nur nach der Tour, Antwort in Worten | - | offen | - |
| 11 | Planen: 11 → 3 Reiter (Woche, Notizen, Alltag) | #1303 | online | datei:tests/e2e/planen-drei-reiter.spec.js |
| 12a | Auswerten: 18 → 5 Reiter nach Frage geordnet (Überblick, Körper, Fahrten, Wi gaht's?, Eigenes Diagramm); die alten Seiten als Chips | #1305 | online | datei:tests/e2e/auswerten-gruppen.spec.js |
| 12b | Auswerten: Eigenes Diagramm zuerst, die Auswahl darunter (Seite Analyse) | #1344 | online | datei:tests/e2e/analyse-diagramm.spec.js |
| 13 | Velos und Material: ein Bereich mit vier Reitern (Velos, Pflege, Material, Sets) und Chips, «Sets» statt Ausrüstung, der Schalter am Handy fällt weg (= V5 des Auftrags «App vereinfachen») | #1488 | online | datei:tests/e2e/velos-material-bereich.spec.js |
| 6 | Ich (vier Gruppen mit Satz zum Stand, «Wartet auf dich» zuerst) und Suche | - | offen | - |
| V1 | Woche: «n von m Einheiten erledigt» und die Ziele der Woche auf der Woche-Seite | #1349 | gebaut | - |
| V3 | Woche: Aktiv › Woche, Training › Woche, Wochenplan und Mein Trainingsplan führen auf die eine Woche, eine Ziel-Zahl «n von m Einheiten» | - | offen | - |
| V4a | Menü mit fünf Bereichen: Bereich «Woche» (Planen und Aktiv zusammen: Woche, Training, Notizen, Alltag), Auswerten mit eigenem Platz; Seitenleiste und Handy-Leiste (alle Adressen bleiben) | #1368 | gebaut | - |
| V4b2 | Meditation nach «Alltag», «Woche leichter/härter», Karte «Dein Stand» auf Training | #1459, #1476, #1480 | online | datei:tests/wochenart-backup.test.js |
| V4b | Training als Zeitplan der Woche (Einheiten mit Uhrzeit, freier Slot → «Neue Einheit», «Härter», «Dein Stand»); Meditation nach «Alltag» | #1409 | gebaut | - |
| V7 | «Alles hier» fällt weg, am Seitenende «Alle Funktionen ›» | #1424 | gebaut | - |
| 14 | Streichliste umsetzen (W1–W4 ganz weg, M1–M8 hinter «Mehr», Z1–Z8 zusammenlegen), je Punkt ein PR | - | offen | - |
| 15 | Handy: Leiste unten mit den fünf Bereichen (Heute, Woche, Touren, Velos und Material, Auswerten); kommt mit V4a (Menü) und V6 (Abkürzungen) | - | offen | - |
| 3s | Streifen-Baustein (Weg B), ersetzt durch die neue Ordnung | - | gestrichen | - |
| 3a | Streifen einstecken: Velos (Weg B), ersetzt durch Schritt 13 | - | gestrichen | - |
| 3b | Streifen einstecken: Material (Weg B), ersetzt durch Schritt 13 | - | gestrichen | - |
| 5a | Streifen einstecken: Aktiv (Weg B), Aktiv behält seine vier Reiter | - | gestrichen | - |
| 5b | Streifen einstecken: Planen (Weg B), ersetzt durch Schritt 11 | - | gestrichen | - |
| 8 | Tour-Budget | - | gestrichen | - |

**Neue Ordnung (Noah 18.11.2026 «1a 2a 3b 4b 5b»):** Sie ersetzt Weg B (Streifen oben, 10.11.2026). Acht Orte (Heute, Planen, Touren, Aktiv, Auswerten, Velos, Material, Ich) mit 23 statt 52 Reitern, eine Tourseite mit vier Phasen, ein Wegweiser «alt → neu» (`docs/wegweiser-neue-ordnung.md`) und die Streichliste mit Noahs Entscheid (Empfehlungen übernommen). Jeder Schritt ist ein eigener kleiner PR, nur Oberfläche, jeder mit Bildern neben dem Prototyp und Noahs «ok». Prototyp: https://claude.ai/artifact/8pjQB9ZWbsKxDaneViBekf. Eine Pause für Noahs echte Tour gibt es nicht mehr (3b: durchbauen). Gebaut ist davon noch nichts; die Reihenfolge steht oben in der Tabelle.

Stand `gestrichen`: Schritt 8 hat Noah am 08.11.2026 gestrichen («E b», in Frage 11 mit «a» bestätigt). 3s, 3a, 3b, 5a und 5b sind seit 18.11.2026 durch die neue Ordnung ersetzt («1a»). Sie zählen nicht in «Plan: X von Y».

## Abstimmung mit den anderen Threads

- Zahlen mit Weg (`NumLink`, `SourceLine`) sind online; Seiten bekommen ihre Zahlen vor dem Umbau (Velos V1, Aktiv/Auswerten A1/A2, Touren T2/T3).
- Schritt 1 und 2 fassen `Tour.svelte` und `Home.svelte` erst an, wenn die Heute-PRs gemergt sind. Der Heute-Schritt 2b kommt nach den Entscheiden des Threads «Startseite ruhiger» (Noah 18.11.2026 «4b»).
- Schritt 4a erst nach den Analyse-PRs (#1116, #1132).
- Gebaut wird in diesem Thread, ein PR nach dem anderen auf demselben Branch, ohne Stapel (Noah 18.11.2026 «5b»). Eine Pause für die echte Tour gibt es nicht («3b»).
- Jede Änderung an Daten (Speicherstruktur, Backup) braucht eine Einzelfreigabe von Noah.
