# Weg zum Ziel: Startvorschlag bei offenem Zeitraum

PR #1173 · 08.11.2026 · Auftrag: Noah «4a» (Entwurf G3, untere Karte), Thread «Entwerfen Weg zum grossen Ziel»

## Was ist neu
- Ein Weg **ohne Starttag** bekommt die Karte «Solange der Starttag offen ist». Mit «Trockenen Start finden» nennt man einen Zeitraum (von, bis).
- Die App sucht in der Vorhersage des Wohnorts 3 trockene Tage hintereinander (trocken = unter 1 mm und unter 40 % Regenchance, wie bei den Traum-Fenstern) und schlägt vor: «Start Do 11.06. setzen». Dazu «Anderes Fenster» (nächstes Fenster, dann wieder das erste) und «Nein danke» (Zeitraum geht).
- «Start … setzen» setzt den Starttag; die Schritte bekommen ihre Tage, der Zeitraum ist erledigt.
- Hat die App keinen Vorschlag, sagt die Karte warum: kein Wohnort, noch keine Vorhersage, Zeitraum liegt hinter der Vorhersage (sie reicht 16 Tage), oder keine 3 trockenen Tage in Folge.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Kein neuer Netzzugriff: die Vorhersage kommt aus dem Speicher der Traum-Fenster (`db.meta` `dreams.wx`, gleicher Ort wie «Wohnort», 3 Stunden frisch). Das Holen macht dieselbe Funktion wie bei den Träumen.
- Der Zeitraum steht im Weg selbst (`goal.period = { from, to }` im Eintrag `weg`, ohne neue Tabelle und ohne neue Dexie-Version). Ältere Einträge ohne `period` laufen unverändert. Ein Starttag beendet den Zeitraum.
- Start = erster Tag des trockenen Fensters; mindestens 3 Tage, ab heute.
- «Gut zu wissen» entfällt (Seite ohne Karte «Was du hier tun kannst»).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G: Startvorschlag gebaut. Offen: Rückblick «geplant gegen wirklich» (5a/5e/5c), Heute-Zeile.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Weg zum Ziel, Weg ohne Starttag: Karte «Solange der Starttag offen ist».
2. «Trockenen Start finden», Zeitraum in den nächsten zwei Wochen wählen: Vorschlag «Start … setzen» oder ein Satz, warum es keinen gibt.
3. «Start … setzen»: Der Kopf nennt den Start, die Schritte haben Tage.
