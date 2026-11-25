# «Ausprobieren»: fünf Neuigkeits-Zeilen führen wieder an die Stelle (Auswerten, Touren-Vorschläge)

PR #<Nummer> · 25.11.2026 · Auftrag: Wackel-Wächter (Thread «Wackel-Tests zuverlässig machen»; gemeldet vom Thread «Tests schneller machen», weil der Nachtlauf jetzt die neuesten 200 Zeilen tippt)

## Was ist neu
- Nichts Sichtbares geändert, nur das Ziel von fünf Zeilen in «Was ist neu». Sie waren kein Wackler, sondern durch Umbauten veraltet und fielen nur nicht auf, weil bisher kein PR-Lauf sie tippte:
  - Zeitraum auf Auswerten (2 Zeilen): `#/auswerten` ist seit dem Umbau «Heute» die Seite mit den Reitern, der Zeitraum-Schalter wohnt auf der alten Übersicht `#/auswerten/uebersicht`. Die Zeilen führen jetzt dorthin.
  - Touren-Vorschläge (2 Zeilen «Schwierigkeit» und «Kanton»): Am Handy stehen die Filtergruppen seit dem Umbau in einem Fenster. Die Zeile tippt zuerst «Ändern ›» (nur wenn die Gruppe nicht schon sichtbar ist) und zeigt dann die Gruppe.
  - Touren-Vorschläge, Wochenwetter einer Tour (1 Zeile): Der Abschnitt «Wetter für diese Tour» erscheint nur mit einer Vorhersage. Ohne sie sagt die Zeile wie die Nachbarzeile, wo er steht (`where`, mit deutschem Text).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert, keine feste Wartezeit. Lokal Handy und Computer grün (4 Läufe von «Ausprobieren» mit diesen drei Neuigkeitsdateien); vorher waren 5 Zeilen rot, auch ohne Last.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App: Ich › Neuigkeiten, bei «Ein Zeitraum für Auswerten» «Ausprobieren» tippen: der Zeitraum-Schalter leuchtet.
