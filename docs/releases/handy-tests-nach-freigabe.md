# Handy-Tests erst nach der Freigabe

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah «1a» und «kannst du das für mich übernehmen? ich möchte nicht ok N schreiben» (Thread «Verbessern Weg von gebaut zu online»)

## Was ist neu
- Nichts in der App. Auf GitHub prüft ein neuer PR zuerst nur das Schnelle: Die App wird gebaut, die Einzeltests laufen, und der Wächter prüft am Computer. Das braucht 2 Test-Computer statt 7.
- Die langen Handy-Tests (5 Teile, etwa 15 Minuten) starten erst, wenn Noah freigibt, mit einem Tipp auf «Freigeben». Claude setzt dann das Etikett «ok» auf den PR, und das startet die Tests. Sind sie grün, mergt Claude.
- Darum warten fertige PRs nicht mehr hinter Tests von PRs, die sich noch ändern.

## Was fällt weg oder rutscht tiefer
- Die Handy-Tests vor der Freigabe. Bisher liefen sie bei jedem PR sofort, neu erst nach der Freigabe. Noah hat das am 28.10.2026 gewählt («1a»).

## Selbst entschieden
- Das Etikett heisst «ok». Andere Etiketten starten keine Tests.
- Der Lauf, den das Etikett startet, baut die App nicht noch einmal und bricht die laufende Prüfung nicht ab.

## Entscheide (für decisions.md)
- 28.10.2026: Handy-Tests erst nach der Freigabe (Etikett «ok»). Freigabe per Tipp auf «Freigeben», kein «ok N» nötig.

## Stand im Plan (roadmap.md / vorhaben.md)
- Verschlanken (Tests und Tempo): weniger Wartezeit bis online.

## Prüfschritte (nach dem Merge)
1. Nichts in der App anzuschauen.
2. Ein neuer PR zeigt unter «Checks» zuerst nur «build» und «e2e (desktop)». «e2e (phone)» läuft erst nach deiner Freigabe.
