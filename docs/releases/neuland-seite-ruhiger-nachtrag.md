# Neuland-Seite ruhiger: Nachtrag

PR (Nummer folgt beim Öffnen) · 27.11.2026 · Nachtrag zum PR «Neuland-Seite ruhiger und Name beim Mouseover» (#1852), Thread «Neuland-Seite verbessern».

## Was ist neu
- Der Seitenumbau von Neuland (kurzer Kopf, Sammlungen in einer Zeile `data-nl-chips`, Fundliste unter der Sammlung, «Vielleicht gefahren: bitte bestätigen» oben, «So geht's» am Seitenende) ist jetzt wirklich im Code. Er stand in den Texten (News, Release, App-Stand) des PR #1852, fehlte aber im gemergten Code: Beim Neuaufsetzen des Zweigs auf main wurde nur der Mouseover-Teil übernommen, der Seitenumbau nicht. Aufgefallen beim Live-Test nach dem Merge.

## Was fällt weg oder rutscht tiefer
- Wie im Release «neuland-seite-ruhiger» beschrieben: langer Erklärtext unter dem Titel entfällt, «So geht's» steht am Seitenende, die Fundliste steht unter der Sammlung.

## Selbst entschieden
- Keine neue News-Datei: Die News von #1852 kündigt genau diese Änderung schon an. Dieser PR bringt den Code dazu.
- Kein neuer Text: alle Texte und deutschen Einträge stehen bereits.

## Entscheide (eigene Datei `docs/decisions/neuland-seite-ruhiger-nachtrag.md`)
- Siehe `docs/decisions/neuland-seite-ruhiger.md` (Noah «1 2 3 4 5 6 7», 27.11.2026); dieser PR ändert keine Entscheidung.

## Stand im Plan
Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Neuland: unter dem Titel ein Satz, «Was du hier tun kannst», zwei kleine Knöpfe; «So geht's» steht am Seitenende.
2. Die Sammlungen sind eine Zeile; am Handy scrollt sie seitwärts und blendet am Rand aus.
3. Alpenpässe wählen: Karte und Liste zuerst, die Fundliste darunter.
4. Ganz oben steht «2 vielleicht gefahren: bitte bestätigen» (wenn es solche gibt).
