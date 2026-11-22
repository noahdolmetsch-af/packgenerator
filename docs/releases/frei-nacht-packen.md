# «Erste Nacht» beim Packen einer Tour mit Nacht draussen

PR #<NUM> · 22.11.2026 · Auftrag: Noah «Freie Zeit 3b» (Thread «App-Landkarte», Durchsicht Freie Zeit)

## Was ist neu
- Bei einer Tour mit einer Nacht draussen (Biwak oder Biwak + Zelt) zeigt die Gruppe «Vorher und am Abend» unter «Mehr zu dieser Tour» eine Zeile «Passt hier» mit «Erste Nacht» und «Gute Nacht». «Erste Nacht» öffnet die geführte erste Nacht, «Gute Nacht» die Seite, auf der du mehrtägigen Touren Bescheid gibst, wo du schläfst.

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile ist neu; bei Touren ohne Nacht draussen ändert sich nichts.

## Selbst entschieden
- Die Zeile steht in der Gruppe «Vorher und am Abend» (zugeklappt, unter der Packliste), nicht über der Packliste (Regel «Inhalt zuerst»).
- Sie erscheint nur bei «Nacht draussen» (Biwak, Biwak + Zelt), nicht bei Hotel oder Hütte: «Erste Nacht» ist eine Nacht draussen nahe zu Hause und würde sonst bei Touren mit Bett stören. Wenn du sie auch bei Hotel und Hütte willst, ist es eine Zeile im Code.
- «Gute Nacht» (Bescheid geben, wo du schläfst) kommt als zweite Taste dazu, weil eine Zeile «Passt hier» immer 2 bis 4 Funktionen zeigt (`tests/passthier.test.js`) und es zu einer Nacht draussen passt.
- «Passt hier» ist nur ein Vorschlag; wer «Erste Nacht» unter «Nicht für mich» ausgeblendet hat, sieht die Zeile nicht.
- Dein früheres «3a» (nichts bauen) ist durch dein «3b» ersetzt.

## Entscheide
Siehe `docs/decisions/frei-nacht-packen.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- App-Landkarte, Freie Zeit: Schritt 3 mit «3b» abgeschlossen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour mit «Biwak» oder «Biwak + Zelt» beim Packen öffnen, «Vorher und am Abend» aufklappen: «Passt hier» zeigt «Erste Nacht» und «Gute Nacht».
2. «Erste Nacht» tippen: die geführte erste Nacht öffnet sich.
3. Eine Tour ohne Nacht draussen: keine solche Zeile.
