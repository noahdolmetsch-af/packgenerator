# Zurück an dieselbe Stelle, Link auf einen Abschnitt

PR #1783 · 23.11.2026 · Auftrag: Noah «ja» (Thread «Navigation ohne Sackgassen», Punkte 4 und 5)

## Was ist neu
- **Position merken:** Nach «Zurück» (Taste am Handy, Zurück im Browser) steht eine lange Seite dort, wo du sie verlassen hast. Vorher sprang die App bei jedem Adresswechsel nach oben, auch zurück auf eine lange Liste. Ein Schritt vorwärts (ein Link) öffnet weiter oben an der Spitze. Die Positionen gelten nur in diesem Fenster (Sitzung) und für die letzten 60 Adressen (`src/lib/nav/scrollmem.js`, `sessionStorage`, nichts wird gesendet).
- **Link auf einen Abschnitt:** Eine Adresse kann einen Abschnitt nennen, `#/me/look?at=look-ops`. Die Seite öffnet mit ihm im Bild und lässt ihn kurz leuchten (derselbe Ring wie bei «Ausprobieren»). Der Abschnitt ist ein Element mit dieser `id` oder `data-at`. Fehlt er, bleibt die Seite wie sie ist (`src/lib/nav/at.js`). Link-Bauer nehmen `atHref(href, id)`.
- Wie es geht: Jeder Eintrag des Verlaufs bekommt beim Anzeigen eine Marke (`history.state.pgv`); ein Schritt auf einen Eintrag mit Marke gilt als Zurück oder Vorwärts im Verlauf. Die Seite wartet bis zu 1,5 Sekunden, bis sie lang genug ist (Seiten laden später), und lässt los, sobald du selbst scrollst.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur dieses Fenster merkt sich die Stellen, nichts geht in die Daten, ins Backup oder zum Server (kein Dexie-Schema, kein Backup nötig).
- Der gleiche Reiter wird nach Zurück schon heute über die Adresse (Reiter steht in der Adresse oder in «zuletzt geöffneter Reiter» je Ort) wieder geöffnet; offene Aufklapper werden nicht gemerkt.
- Die Abschnitt-Links sind jetzt das Gerüst; die Stellen, die sie nutzen («Weiter zu …», «Passt hier», Wochenbrief), kommen in den nächsten PRs. Ein Beispiel ist `#/me/look?at=look-ops`.
- Auf dem Handy kann die Stelle um eine Werkzeugleiste (etwa 60 px) abweichen; der Test erlaubt 120 px.

## Entscheide
- Keine eigene Datei: Fortsetzung von `docs/decisions/wege-waechter.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Navigation ohne Sackgassen: Punkte 4 und 5 mit diesem PR. Folgt: «Weiter zu …» und die Sackgassen, Zurück am Eingang (nie aus der App), Suche nach Seiten.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Darstellung öffnen, weit nach unten scrollen, auf einen Link zu einer anderen Seite tippen, dann auf Zurück: du bist wieder an derselben Stelle.
2. Auf einen Link tippen: die neue Seite öffnet oben.
3. `…/#/me/look?at=look-ops` öffnen: der Abschnitt «Bedienung» ist im Bild und leuchtet kurz.
