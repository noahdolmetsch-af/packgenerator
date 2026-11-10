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
| 2a | Karte «Meine Tour» auf Heute, ersetzt die Karte «Vorab» (nur bei geplanter Tour) | #1232 | gebaut | - |
| 2b | Heute-Hauptkarte wählt den Pfad des Moments, mit «Anderes zeigen» | - | offen | - |
| - | **Pause:** Noah macht eine echte Tour und sagt danach, wie es weitergeht | - | - | - |
| 3a | Ort-Vorlage mit 6 Bändern: Velos (zuerst) | - | offen | - |
| 6 | Ich (vier Gruppen mit Satz zum Stand) und Suche, läuft mit 3a | - | offen | - |
| 3b | Ort-Vorlage: Material (fünf Packen-Gruppen als Bänder) | - | offen | - |
| 5a | Ort-Vorlage: Aktiv (Tagesablauf als sanfter Vorschlag), läuft mit 3b | - | offen | - |
| 5b | Ort-Vorlage: Planen | - | offen | - |
| 4b | Tourprofil: eigene Seite pro Tour | - | offen | - |
| 7a | Unterwegs-Modus: Noah schaltet ihn selbst ein (Knopf auf «Meine Tour», kein Autostart) | - | offen | - |
| 7b | Danach, «Das fällt auf» nur nach der Tour, Antwort in Worten | - | offen | - |
| 8 | Tour-Budget | - | gestrichen | - |

Stand `gestrichen`: Noah hat den Schritt am 08.11.2026 gestrichen («E b», in Frage 11 mit «a» bestätigt). Er zählt nicht in «Plan: X von Y».

## Abstimmung mit den anderen Threads

- Zahlen mit Weg (`NumLink`, `SourceLine`) sind online; Seiten bekommen ihre Zahlen vor dem Umbau (Velos V1, Aktiv/Auswerten A1/A2, Touren T2/T3).
- Schritt 1 und 2 fassen `Tour.svelte` und `Home.svelte` erst an, wenn die Heute-PRs gemergt sind.
- Schritt 4a erst nach den Analyse-PRs (#1116, #1132).
- Ab Schritt 3a baut man erst nach der Pause für Noahs echte Tour; Orts-Umbauten laufen dann parallel (3a mit 6, danach 3b mit 5a), sonst nacheinander.
- Jede Änderung an Daten (Speicherstruktur, Backup) braucht eine Einzelfreigabe von Noah.
