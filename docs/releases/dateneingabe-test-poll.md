# Test «Werte eingeben»: das Warten liest ein Feld, das vor dem Speichern noch fehlt

PR #1743 · 25.11.2026 · Auftrag: Wackel-Wächter (Thread «Wackel-Tests zuverlässig machen»; `dateneingabe.spec.js:69`, `TypeError … pressureF`, gemeldet vom Thread «Tempo» auch auf unverändertem main)

## Was ist neu
- Nichts Sichtbares geändert, nur Test für «Werte eingeben». Der Test wartet mit `expect.poll`, bis der Soll-Druck im Velo gespeichert ist, und las dabei `…find(bike).fit.pressureF`. Solange das Velo noch keinen Eintrag `fit` hat (vor dem ersten Speichern), wirft das ein `TypeError`, und das Warten bricht ab, statt nochmal zu lesen.
- Das Warten liest jetzt vorsichtig (`?.fit?.pressureF`) und wartet damit wirklich, bis der Wert da ist. Dasselbe an den zwei Nachbarstellen (Sattelhöhe, eigener Wert). Dieselben Prüfungen wie vorher.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert, keine feste Wartezeit. Auf main liess sich der Fehler in 12 Läufen nicht nachstellen; die Ursache folgt aus dem Code. Mit dem Fix 3 frische Läufe grün (Handy und Computer).

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.
