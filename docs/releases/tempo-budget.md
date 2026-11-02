# Tempo-Budget im Build

Auftrag: Noah «1a und b, 2a und b, 3a» (Thread «Klären: App wird langsam»), Bericht `notes/tempo-2026-11-02/README.md`

## Was ist neu
- Der Build bricht ab, wenn das, was beim Start geladen wird (deutsche Texte, App-Kern, Laufzeit), über 4.5 MB JavaScript wächst (`MAX_START_JS_BYTES` in `scripts/size-guard.mjs`). Heute: 3.98 MB.
- Nichts Sichtbares in der App.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- 4.5 MB = rund 13 % Luft über dem Messwert vom 02.11.2026. Wer drüber kommt, verschiebt Texte oder Werkzeuge hinter `import()` oder begründet eine neue Zahl.
- Ein Zeit-Test (Start/Scrollen bei 4× langsam) kommt nicht in die Prüfung: Zeiten schwanken auf GitHub-Rechnern zu stark. Die feste Grösse ist stabil.

## Stand im Plan
- Tempo-Plan: PR 3 von 3 (Grenze für den Start). Heute-Abfragen entlasten folgt, abgestimmt mit dem Heute-Thread.

## Prüfschritte (nach dem Merge)
1. Nichts in der App zu prüfen. Auf GitHub ist die Prüfung «build» grün.
