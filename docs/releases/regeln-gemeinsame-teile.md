# Regel «Gemeinsame Teile» in den Regeln

PR (Nummer steht im PR) · 26.11.2026 · Auftrag: Noah «1-8» (26.11.2026 08:43, Thread «Tests auf den neuen App-Stand bringen», Test-Plan Schritt 5); Eintrag über den Koordinator (Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- `docs/regeln.md` Block 7: Regel «Gemeinsame Teile»: Ändert ein PR die Seitenleiste, die Reiter, den Seitenkopf, das Fenster-System oder die globalen Stile, laufen im PR zusätzlich zum Kern die Wächter für alle Seiten und Fenster und alle Tests, die an diesen Teilen hängen.
- `CLAUDE.md` («Tests»): gleicher Punkt mit den Namen `SHARED_PARTS`, `SHARED_WAECHTER`, `CORE_SPECS`.
- Nur Doku, nichts sichtbar in der App; die Technik kam mit PR 1803.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Entscheid-Datei `docs/decisions/pr-auswahl-gemeinsame-teile.md` gibt es schon (mit PR 1803), darum hat dieser PR keine zweite.
- Die Zahlen «etwa 70» und «etwa 50» stehen so in der Weiterleitung des Koordinators und sind hier Richtwerte, nicht geprüft.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 26.11.2026: PR-Auswahl bei gemeinsamen Teilen – siehe `docs/decisions/pr-auswahl-gemeinsame-teile.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` Block 7 öffnen: «Gemeinsame Teile» steht vor «Nachtlauf».
