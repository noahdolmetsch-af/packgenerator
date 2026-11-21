# Verlust-Wächter: beim Vereinfachen geht keine Funktion verloren

PR #<Nummer> · 07.11.2026 · Auftrag: Noah «1a 2a 3a 4b 5a» und «ok» (Thread «Vereinfachen der App ohne Verlust», Schritt 1 der Reihenfolge)

## Was ist neu
- Nichts in der App. Neu ist ein Test, `tests/verlust.test.js`, mit der Liste `tests/fixtures/funktionen.json` (alle Kennungen aus `features.js`).
- **R1, keine Funktion geht verloren:** Verschwindet oder heisst eine bekannte Funktion plötzlich anders, wird der PR rot. Absicht trägt man unter `abgeloest` mit Grund ein, damit Noah es im PR sieht.
- **R2, versteckt heisst auffindbar:** Jede Funktion steht in der Karte der App, die Suche findet sie über ihren englischen und deutschen Namen, und ihr Link führt auf eine Seite oder Aktion, die die App kennt. Wer später eine Funktion hinter «Mehr» oder in «Einfach» legt, trägt sie unter `versteckt` mit dem Weg dorthin ein (`wo`, zum Beispiel «Packen › Mehr › Vorher und am Abend»).
- Neue Funktionen sind frei. Die Liste der Kennungen frischt man mit `VERLUST_AKTUALISIEREN=1 npx vitest run tests/verlust.test.js` auf (fügt nur hinzu, entfernt nie).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Liste liegt unter `tests/fixtures/`, nicht in `src/`, damit sie nicht in die App gebündelt wird.
- Die Liste wächst nicht mit jedem PR, sonst würden offene PRs dieselbe Datei ändern. Sie wird bei Gelegenheit aufgefrischt.
- Keine «Was ist neu»-Datei, weil nichts Sichtbares ändert (wie bei anderen Test-PRs).
- Die vollständige Tabelle «Funktion → neuer Ort» (Entwurf) ist hier noch nicht gebaut: Der Weg steht pro versteckter Funktion unter `versteckt.wo`; eine Gesamttabelle kann ein späterer Schritt aus diesen Einträgen erzeugen.
- Abgestimmt mit den Threads «Absprünge in der ganzen App umsetzen» und «Skizzieren: Tour von A bis Z und Datencenter»: Beide ändern vorerst keine Funktion. Die Ort-Vorlage trägt verschobene Einstiege bei Bedarf unter `abgeloest` oder `versteckt` ein.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Vereinfachen ohne Verlust», Schritt 1 (Verlust-Wächter): gebaut, wartet auf Noahs ok.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: Der Test `tests/verlust.test.js` läuft in `build` grün.
