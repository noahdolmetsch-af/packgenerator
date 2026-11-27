# Wertliste für die Versicherung

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «1-5 a» (Warteliste 7)

## Was ist neu
- Die Seite **Wertliste** (`#/gear/wertliste`, `src/pages/WertListe.svelte`, Regeln `src/lib/wertliste/wertliste.js`): alle Velos (Rahmennummer, Kaufdatum, Preis aus dem Garantie-Blatt) und alles Material (ohne Essen) mit Preis. Oben die Summe, die Zahl der Velos und Teile und «n ohne Preis».
- Knöpfe **Velos**, **Material**, **Nur über CHF 50** und **Ohne Preis**; jede Zeile hat einen Haken (alles ist vorgewählt, nur die gewählten zählen).
- Fehlt ein Preis oder ein Kaufdatum, steht in der Zeile ein Feld zum Nachtragen; es speichert ins Material oder ins Velo (Garantie-Blatt, Kaufdatum), mit einem Rückgängig.
- **PDF erstellen** schreibt das PDF auf dem Gerät (`src/lib/wertliste/pdf.js`, pdf-lib lädt erst jetzt): Titel mit Stand, Tabelle Velos, Tabelle Material, Summe, «Preis laut Kauf, nicht der heutige Wert», die Teile ohne Preis, «Belege vorhanden: n von m». Dann Vorschau, «Teilen oder speichern» und eine Kopie in Ich › Dokumente › «Versicherung».
- Wege hin: das Diebstahl-Blatt eines Velos («Passt hier»), «Alles hier» im Material.

## Was fällt weg oder rutscht tiefer
- nichts. Das Diebstahl-Blatt bleibt, wie es ist; es bekommt nur die Zeile «Passt hier» am Ende.

## Selbst entschieden
- Ein Velo-Preis liegt im Garantie-Blatt (`sheets.warranty.price`), das Kaufdatum in `bought`: dort schreibt auch das Nachtragen hin (wie die Seiten der Velos es lesen).
- «Beleg vorhanden» gilt für Velos mit einem Werkstatt-Besuch am Kaufdatum (der bestehende «Beleg»-Link des Diebstahl-Blatts). Für Material gibt es keinen Beleg-Vermerk.
- Das Material zählt mit Stückzahl (ein Taschenpaar = 2 × Preis); der Filter «Nur über CHF 50» rechnet die Zeile.
- Die Kopie in den Dokumenten geht nicht zu Drive (`upload: false`); wer Drive nutzt, kann sie dort selbst hochladen.
- Die Gruppe heisst «Versicherung» (Text der Dokumentgruppe, umbenennbar und löschbar wie jede Gruppe).
- Keine neue Einstellung, kein neues Datenfeld: die Seite liest Velos, Material und Werkstatt-Besuche und schreibt nur Preis und Kaufdatum.

## Entscheide (eigene Datei `docs/decisions/wertliste.md`)
- 22.11.2026: Noah «1-5 a».

## Stand im Plan
- Warteliste 7: Wertliste mit Summe, Nachtragen, PDF und Kopie gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material › «Alles hier» › Wertliste: die Summe steht oben; «n ohne Preis» nennt, was fehlt.
2. Bei einer Zeile ohne Preis eintippen: die Summe wächst, «Rückgängig» nimmt es zurück.
3. «PDF erstellen» › «Teilen oder speichern»; Ich › Dokumente › Versicherung zeigt die Kopie.

**Daten:** das Nachtragen schreibt in Material und Velos (bestehende Felder, keine Schemaänderung): Test mit einer Backup-Kopie vor dem Merge; ein frisches Backup von Noah liegt vor dem Merge bereit.
