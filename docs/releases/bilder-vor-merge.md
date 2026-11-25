# Bilder vor dem Merge: Noah gibt frei

PR (Nummer steht im PR) · 24.11.2026 · Auftrag: Noah «neue regel: ich möchte für jeden PR vor merge bilder sehen» (Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- `docs/regeln.md` Block 5: Bei einer sichtbaren Änderung sieht Noah die Bilder **vor dem Merge** (als Entwurf vor dem Bauen oder vom fertigen PR, wenn möglich mit seinen aktuellen Daten) und gibt sie frei; der Bündler mergt bei Grün und Platz.
- `docs/regeln.md` Block 4: Wartende Threads bauen die nächsten Schritte lokal vor und zeigen Noah Bilder.
- `docs/regeln.md` Block 6 und 8, `CLAUDE.md`: Bilder mit Noahs echten Daten nur privat im Thread, ohne Bankname, IBAN, Konten, Beträge und Fotos; öffentliche Bilder mit erfundenen Daten.
- `docs/regeln-archiv.md`: die Fassung von Block 5 vor dieser Änderung steht wörtlich dort; `docs/decisions/alles-freigegeben.md` trägt oben einen Hinweis, dass sie für sichtbare Änderungen ersetzt ist.
- `docs/regeln.md` Block 5 und `CLAUDE.md`: **Bilder immer im App-Design** (Noah 18:07 und 18:08): nur aus der gebauten App, ein Bildschirm pro Bild mit Kopf und Leiste, daneben das Bild der heutigen Online-Version, vor dem Senden mit impeccable geprüft.
- `docs/regeln.md` Block 3 und 5, `CLAUDE.md`: **Freigaben immer mit Knöpfen** (Noah 19:34): Entscheid-Karte mit «Freigeben» / «Ändern»; ein Druck auf «Freigeben» gilt als Merge-Freigabe; bei Schliessen und Force-Push trägt der Knopf den genauen Wortlaut.
- Nur Doku, nichts sichtbar in der App.

## Was fällt weg oder rutscht tiefer
- «Bei grüner Prüfung geht alles ohne Freigabe online» gilt nur noch für PRs ohne sichtbare Änderung (Test, Doku, CI).

## Selbst entschieden
- PRs ohne sichtbare Änderung gehen weiter bei Grün von selbst online (so verstehe ich Noahs «1a» vom 16:54 und seine Regel vom 17:19); der Koordinator soll das bei Noah bestätigen lassen, falls er auch dort eine Freigabe will.
- «Entwurf vor dem Bauen» bleibt nur bei Grossem möglich, weil Noah keine gezeichneten Skizzen mehr will; er ersetzt die Bilder der gebauten App nicht.
- Die Knöpfe-Regel gilt für jede Freigabe-Frage, auch Schliessen und Force-Push (Lesart des Koordinators, Noah schrieb nur «freigabe ab sofort immer mit buttons»).
- Keine «Was ist neu»-Datei: nichts sichtbar.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 24.11.2026: Bilder vor dem Merge – siehe `docs/decisions/bilder-vor-merge.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` öffnen: Block 5 beginnt mit «Sichtbare Änderung: Noah sieht die Bilder vor dem Merge und gibt sie frei».
