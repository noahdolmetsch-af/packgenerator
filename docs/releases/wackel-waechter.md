# Wackel-Wächter: Liste und Ablauf für zufällig rote Tests

PR #1745 · 24.11.2026 · Auftrag: Noah «a-c alle» 24.11.2026 22:19 (Thread «Wackel-Tests zuverlässig machen»; Punkt b)

## Was ist neu
- Nichts Sichtbares geändert, nur Regel und Liste. Neue Datei `docs/wackelliste.md` (Test, Gerät, Ursache, Fix, Stand) und ein neuer Absatz «Wackel-Wächter» in Block 7 von `docs/regeln.md`.
- Der Ablauf: (1) Wer einen Test zufällig rot sieht, meldet ihn **einmal** (Name, Datei:Zeile, Gerät, Link zum Lauf) beim Bündler oder beim Wackel-Thread. (2) Der Wackel-Thread trägt ihn als `offen` ein und macht ihn **noch am selben Tag** stabil: Ursache, 3× pro Gerät grün, eigener Test-PR. (3) Ein offener Fix-PR geht beim Bündler ganz nach vorn; neue Plätze werden nicht gesperrt. (4) Nach dem Nachtlauf trägt der Wackel-Thread jeden roten Test ein, zu dem keine App-Änderung passt. (5) Der Abend-Rundgang meldet Noah jeden Eintrag, der länger als einen Tag `offen` ist.
- Ein Test (`tests/wackelliste.test.js`) hält die Form der Liste: jede Zeile hat einen Stand `offen`, `beobachten` oder `stabil`.

## Was fällt weg oder rutscht tiefer
- «Ein Test, der 2× zufällig fällt, kommt auf die Liste» (Block 4 und `CLAUDE.md`) fällt weg; jetzt reicht das erste Mal. Der alte Wortlaut steht in `docs/regeln-archiv.md`.

## Selbst entschieden
- «Bevor neue PRs dazukommen»: Noah hat auf der Entscheid-Karte «Nur Vorrang» gewählt (25.11.2026 01:33): der Fix-PR geht beim Bündler ganz nach vorn, eine Sperre für neue Plätze gibt es nicht.
- Keine automatische Erkennung gebaut; der Nachtlauf (Punkt c) und der Merge-Stand (Punkt a) kommen vom Koordinator und Bündler.

## Entscheide
- `docs/decisions/wackel-waechter.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `build` und `e2e` grün. In der App nichts zu prüfen.
