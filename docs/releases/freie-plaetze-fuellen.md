# Freie Prüfplätze sofort füllen, bis zu 6 mit Notbremse

PR (Nummer steht im PR) · 25.11.2026 · Auftrag: Noah «a» 20:08 und «a» 20:09 (Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- `docs/regeln.md` Block 4: Freie Prüfplätze werden sofort mit dem nächsten fertigen, freigegebenen Paket gefüllt, auch wenn ein Bereich mit Vorrang noch läuft; die Reihenfolge der Wichtigkeit gilt beim Mergen. Bereiche mit mehreren Teilen bringen jeden Teil als eigenen PR.
- `docs/regeln.md` Block 4: **höchstens 6 PRs gleichzeitig in der Prüfung** (vorher 5), mit **Notbremse**: zweimal main rot an einem Tag, dann für den Rest des Tages wieder 5.
- `CLAUDE.md` («Limits»): beide Punkte.
- `docs/regeln-archiv.md`: der alte Satz «Der Bündler vergibt Plätze in dieser Reihenfolge» und die Fassung «höchstens 5» wörtlich.
- Nur Doku, nichts sichtbar in der App.

## Was fällt weg oder rutscht tiefer
- «Höchstens 5 PRs gleichzeitig in der Prüfung» (jetzt 6, mit Notbremse).
- Plätze werden nicht mehr streng nach der Reihenfolge der Wichtigkeit vergeben; die Reihenfolge entscheidet nur noch beim Mergen.

## Selbst entschieden
- Die Regel kommt in denselben PR wie «Neue Ideen nur notieren» (derselbe Zweig, dieser PR war noch offen und wartete auf einen Platz), damit zwei Doku-PRs keinen Platz doppelt belegen.
- «Fertig» heisst: freigegeben und in der Prüfung lauffähig; ein Paket ohne Freigabe von Noah füllt keinen Platz (Block 5).
- Die Notbremse zählt «main rot» pro Kalendertag in Europe/Zurich, und der Bündler zählt (mein Vorschlag, Noah nannte keinen Zähler).

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 25.11.2026: Freie Prüfplätze sofort füllen – siehe `docs/decisions/freie-plaetze-fuellen.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` Block 4 öffnen: «Freie Plätze sofort füllen» steht unter «Neue Ideen nur notieren».
