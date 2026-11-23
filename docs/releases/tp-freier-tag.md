# Ein Recovery Day aus TrainingPeaks bleibt frei

Auftrag: Noah «Recovery Day ja» (22.11.2026, Thread «TrainingPeaks ins Wochen-Soll einrechnen»), Vorschlag aus W2/W3. Die Datenänderung (`rest` im Plan-Eintrag) braucht Noahs ok für diese PR-Nummer und die Prüfung mit einer Kopie.

## Was ist neu
- Ein Eintrag aus dem TrainingPeaks-Feed ohne Dauer, dessen Titel «Recovery Day», «Rest day», «Day off», «Ruhetag», «Erholungstag», «Regenerationstag» oder «Freier Tag» sagt, ist keine Einheit (keine Stunden), sondern ein freier Tag. Vorher wurde er als «Eintrag ohne Dauer» weggelassen.
- Der Wochenplan setzt auf einen freien Tag keine freie Einheit (Velo, Laufen, Gym, Sauna …). Was fest steht (Eishockey, Tennis …), bleibt. Unter den Stunden steht: «TrainingPeaks hat am Dienstag einen freien Tag: Der Plan setzt dort nichts anderes ein.»
- Die Karte «TrainingPeaks-Plan» (Ich › Verbindungen) nennt die freien Tage in der Ergebniszeile.
- Ein Recovery Day mit Dauer bleibt eine normale Einheit.

## Was fällt weg oder rutscht tiefer
- Freie Einheiten des Plans rutschen vom freien Tag auf einen anderen Tag. Sonst nichts. Zurück: TrainingPeaks-Link herausnehmen, oder den freien Tag in TrainingPeaks löschen und neu laden.

## Daten (Prüfung mit Kopie)
- Kein Dexie-Schema, kein `api/`. Neu ist ein optionales Feld `rest` (Liste von Tagen) im bestehenden Eintrag `training.plan`, daneben `sessions`. Ohne Recovery Days gibt es das Feld nicht; alte Backups ohne `rest` laden unverändert (Test).
- Alle Schreiber von `training.plan` behalten `rest` (`planValue`): Meine Woche, Trainingspläne, der Feed. Der Feed ersetzt die Liste bei jedem Abruf; das Entfernen des Links löscht sie.
- Freie Tage sind nie Einheiten: `planOf` gibt sie nicht aus, sie erscheinen in keiner Liste und zählen keine Stunden. Nur der Wochenplan liest sie (`plannerSessions`).

## Selbst entschieden
- Erkannt wird nur über den Titel und nur ohne Dauer; ein Titel wie «Recovery ride» ist kein freier Tag.
- Feste Einheiten und selbst angeheftete Einheiten bleiben auf dem freien Tag; es gibt dafür noch keine Warnung in «Was nicht passt».
- Vergangene Wochen bleiben wie sie waren (eingefrorener Stand).

## Entscheide (eigene Datei `docs/decisions/tp-freier-tag.md`)
- 22.11.2026: Recovery Day hält den Tag frei (Noah «Recovery Day ja»).

## Stand im Plan (roadmap.md / vorhaben.md)
- TrainingPeaks im Wochen-Soll: der offene Vorschlag «Recovery Day» ist damit gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbindungen › TrainingPeaks-Plan: «Jetzt abrufen». Die Ergebniszeile nennt die freien Tage.
2. Training › Wochenplan: unter den Stunden steht «TrainingPeaks hat am … einen freien Tag», und an diesem Tag steht keine freie Einheit.
