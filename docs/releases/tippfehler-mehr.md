# Tippfehler-Frage: Material-Gewicht, Kilometerstand und Dauer

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «1-5 a», «3a» (Warteliste 6, PR 2–4 in einem)

## Was ist neu
- **Material-Gewicht:** unter dem Gramm-Feld eines Gegenstands (neu und bearbeiten) fragt die leise Zeile «Meintest du 320 g?», wenn «32000» getippt wurde. Verglichen wird mit den eigenen Gewichten der Sammlung (ab drei) und groben Aussengrenzen.
- **Kilometerstand:** beim Eintragen des Zählerstands (Neu › Kilometer) wird der Wert mit dem letzten Stand des Velos verglichen; «22880» bei 2288 km fragt «Meintest du 2288 km?».
- **Dauer:** bei einer eigenen Dauer in Minuten (Mindauer-Feld) fragt die Zeile, wenn der Wert weit ausserhalb des Üblichen liegt.
- Immer dieselbe Zeile (`TypoZeile.svelte`) mit «Ja, …» und «Stimmt so»; Speichern geht immer.

## Was fällt weg oder rutscht tiefer
- nichts. Die Dauer hat weiter ihre Fehlermeldung für Unsinn («Ganze Minuten von 1 bis …»).

## Selbst entschieden
- Beträge und Daten (PR 4 der Spez) sind nicht dabei: sie haben keine feste Grösse, die eine Regel erkennt; sie bleiben offen.
- Dauer: Obergrenze 600 min (statt 1440), damit «Meintest du 60?» bei 6000 greift.
- Keine neue Funktion in `features.js`: es sind Felder bestehender Seiten; kein Absprung nötig.

## Entscheide (eigene Datei `docs/decisions/tippfehler-mehr.md`)
- 22.11.2026: Noah «1-5 a», «3a».

## Stand im Plan
- Warteliste 6: Gewicht, Material, Kilometer und Dauer gebaut; Beträge und Daten offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ausrüstung › Gegenstand anlegen › Gewicht 32000 g tippen, Feld verlassen: «Meintest du 320 g?».
2. Neu › Kilometer › Velo mit Stand wählen, einen zehnfach zu hohen Stand tippen: die Zeile schlägt den wahrscheinlichen Stand vor.
3. «Stimmt so» antippen: die Zeile geht und kommt für diesen Wert nicht wieder.

**Daten:** nutzt dieselbe Einstellung `typo.ok` wie PR 1 (Backup-Kopie-Test dort); keine neue Datenänderung.
