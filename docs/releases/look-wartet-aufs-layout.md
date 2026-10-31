# Test Ich › Darstellung: wartet, bis die Seite fertig ist

PR #… · 31.10.2026 · Auftrag: Noah «1a», «kannst du damit schon beginnen» (Thread «Merge-Stau abbauen und Tests stabilisieren»)

Nichts davon ist in der App sichtbar.

## Was ist neu
- `tests/e2e/look.spec.js`: Die Prüfung «kein seitliches Scrollen» misst nicht mehr einmal sofort nach dem Umschalten (Kompakt, Dunkel), sondern bis zu 5 Sekunden wiederholt. Auf einem langsamen Läufer zeigte sie kurz 393 statt 390 px (PR #479 und main, Lauf 41209168766).
- Die Prüfung bleibt streng: Am Ende muss die Seite innerhalb des Bildschirms liegen, sonst schlägt sie fehl.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Ich konnte die 393 px lokal nicht nachstellen (der Test läuft grün). Ob es ein kurzes Layout-Zucken oder ein echter Überstand ist, bleibt offen; bleibt es bestehen, zeigt die neue Zusammenfassung (#485) den Test mit Namen, dann suchen wir den Überstand.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Thema «Merge-Stau»: ein wackeliger Handy-Test gehärtet.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App zu prüfen.
2. Unter Actions: Handy-Teil mit `look.spec.js` grün.
