# Plan: die ganze App aus einem Guss

Die Schritte aus dem Entwurf «Die ganze App aus einem Guss» (Noah 07.11.2026 «1-5a»; Fragen 1–5 am selben Abend mit «1a 2a 3a 4a 5a» bestätigt). Entwurf: https://claude.ai/artifact/VdWiqzEZgkByonBDYzrrFt, ergänzt durch https://claude.ai/artifact/1ukLWgB5y9ExhT6enzDeVT (Tour von A bis Z und Datencenter).

Der Test `tests/plan.test.js` liest diese Tabelle. Wer die Zahl sehen will: `node scripts/plan-stand.mjs` («Plan: X von Y online»).

## So pflegt man die Tabelle

- **Stand:** `offen` (nichts gebaut), `gebaut` (PR offen oder gemergt, aber noch nicht geprüft online), `online` (auf der echten Seite, Noah hat es freigegeben).
- **PR:** Nummer mit `#`, bei `gebaut` und `online` Pflicht.
- **Weg:** woran man den Schritt in der App erkennt. Bei `online` Pflicht. Der Test wird rot, wenn ein Weg später fehlt (eine Seite, ein Baustein oder eine Funktion wurde entfernt). Schreibweise: `datei:<Pfad>`, `text:<Pfad>|<Wort>`, `funktion:<Kennung>`, mehrere mit `;`, `-` heisst «noch kein Weg».
- **Wer pflegt:** der Bau-PR eines Schritts setzt seine Zeile auf `gebaut`; nach der Freigabe und dem Merge steht sie auf `online`. Ein Schritt wird nie zurückgesetzt, ausser Noah entscheidet es (dann Eintrag mit Grund in `tests/fixtures/plan-online.json` unter `abgeloest`).
- **Bild-Vergleich:** Jeder Bau-PR zeigt sein Bild neben dem freigegebenen Entwurf und schreibt «gleich» oder «weicht ab, weil …».

Reihenfolge der Bauschritte (jeder PR einzeln mit Bildern und «ok»; abgestimmt mit den anderen Threads, siehe unten):

| Schritt | Titel | PR | Stand | Weg |
| --- | --- | --- | --- | --- |
| 0a | Tour-Stand rechnen (ohne Anzeige) | #1136 | online | datei:src/lib/tourpfad/stand.js; datei:tests/tourstand.test.js |
| 0b | Seite «Meine Datenquellen» | #1143 | online | datei:src/pages/Quellen.svelte; funktion:f.quellen |
| 1 | Pfad-Baustein (baut auf «Weg zum Ziel» als Linie auf), Tour-Pfad mit 4 Phasen | #1181 | gebaut | - |
| 2a | Karte «Meine Tour» auf Heute (nur bei geplanter Tour, Hinweise als eine Zeile) | - | offen | - |
| 2b | Heute-Hauptkarte nach Moment | - | offen | - |
| 3a | Ort-Vorlage mit 6 Bändern: Velos | - | offen | - |
| 3b | Ort-Vorlage: Material (fünf Packen-Gruppen als Bänder) | - | offen | - |
| 4a | Datencenter-Einstieg: erster Reiter «Fragen» in Auswerten | - | offen | - |
| 4b | Tourprofil | - | offen | - |
| 5a | Ort-Vorlage: Aktiv | - | offen | - |
| 5b | Ort-Vorlage: Planen | - | offen | - |
| 6 | Ich und Suche (ein PR) | - | offen | - |
| 7a | Unterwegs-Modus | - | offen | - |
| 7b | Danach, «Das fällt auf», Antwort in Worten | - | offen | - |
| 8 | Tour-Budget (Datenänderung, Einzelfreigabe, zuletzt) | - | offen | - |

## Abstimmung mit den anderen Threads

- Zahlen mit Weg (`NumLink`, `SourceLine`) sind online; Seiten bekommen ihre Zahlen vor dem Umbau (Velos V1, Aktiv/Auswerten A1/A2, Touren T2/T3).
- Schritt 1 und 2 fassen `Tour.svelte` und `Home.svelte` erst an, wenn die Heute-PRs gemergt sind.
- Schritt 4a erst nach den Analyse-PRs (#1116, #1132).
- Schritt 8 ist die einzige Änderung an Daten; sie braucht eine Einzelfreigabe von Noah.
