# Ein Murmeltier als Begleiter

PR (diese Änderung) · 03.11.2026 · Noah 03.11. «E und F» (Paket F, Idee 28 aus `notes/ideen-bewegung-2026-11-03/`); Ziel 5 «Alltag»

## Was ist neu
- **Ein** gezeichnetes Murmeltier als Baustein (`src/lib/murmeltier/Murmeltier.svelte`) mit vier Zuständen: sitzt (`sit`), schläft mit «Zzz» (`sleep`), schaut über einen Hügel (`peek`) und pfeift mit Sprechblase (`whistle`). Mit `state='auto'` sitzt es am Tag und schläft nachts (22:00 bis 05:59).
- Es sitzt auf **leeren Seiten** (neben dem gezeichneten Blatt in `Empty.svelte`, überall wo ein leeres Blatt mit Symbol steht) und **bei Tipps** (die Zeile «Gut zu wissen», `TipLine.svelte`, statt des Blattsymbols).
- Neuer Schalter unter Ich › Darstellung › Bedienung: «Das Murmeltier» (Standard: an). Aus = das Murmeltier ist überall weg (bei Tipps wieder das Blatt).
- Es steht still bei «Bewegung reduzieren»; die kleinen Bewegungen (aufsteigendes «Zzz», Auftauchen) laufen sonst sanft.
- `peek` und `whistle` sind für das Geheimmenü gedacht (Idee H2 «Murmeltier streckt den Kopf raus und pfeift», Thread «Geheimmenü-Ideen fürs Logo»): derselbe Baustein, keine zweite Zeichnung. Hier werden sie noch nicht gezeigt.

## Was fällt weg oder rutscht tiefer
- nichts. Bei Tipps ersetzt das Murmeltier das kleine Blatt-Symbol (mit dem Schalter kommt das Blatt zurück).

## Selbst entschieden
- Das Murmeltier steht links neben dem gezeichneten Blatt, nicht darüber: Der Text und die Knöpfe der leeren Seite bleiben, wo sie waren.
- Als Schalter in «Bedienung», keine eigene Funktion im Katalog (Zusatz ohne eigene Seite, Fertig-Regel 1 bis 5 entfallen).
- Nachts bestimmt die Uhr des Geräts (`partOfDay`, wie die Begrüssung), beim Öffnen der Seite.
- `docs/app-stand.md` ist noch nicht auf `main` (PR #742 offen); die Zeile folgt nach dessen Merge.
- Dieser PR, #763, #766 und #768 ändern teils dieselbe Stelle in `bedienung.js` und `tests/bedienung.test.js`; spätere Merges brauchen einen kleinen Konflikt-Fix, den ich übernehme.

## Entscheide (für decisions.md)
- Ein Murmeltier im ganzen Projekt: dieser Baustein; H2 (Geheimmenü) nutzt ihn (Absprache der Threads, 03.11.2026).

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket F «Schmunzel-Ideen»: Idee 28 gebaut (Zeile in `vorhaben-liste.md` steht in PR #759).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Seite mit einem Tipp öffnen (zum Beispiel Material): vor «Gut zu wissen» sitzt ein kleines Murmeltier.
2. Eine leere Liste öffnen: neben dem Blatt sitzt das Murmeltier (nachts schläft es).
3. Ich › Darstellung › Bedienung: «Das Murmeltier» ausschalten: es ist überall weg.
