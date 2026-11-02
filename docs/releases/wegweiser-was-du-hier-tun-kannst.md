# Was du hier tun kannst (Wegweiser 11: Inhalte auf der Seite, Bereich Lust)

PR #… · 01.11.2026 · Auftrag: Noah «1-5a» (Inhalte auf der Seite) und «einverstanden» (PR 11 nach PR 2), Thread «Entdeckbarkeit versteckter Funktionen planen»

## Was ist neu
- Karte «Was du hier tun kannst» oben auf der Seite (`src/lib/ui/SeitenInhalt.svelte`, Daten `src/lib/seiteninhalt.js`): jede Funktion der Seite mit Namen und einem Satz, wozu sie gut ist (Katalog), «So geht es» öffnet Schritte und Beispiel (Handbuch).
- Zuerst auf den Seiten des Bereichs Lust (dünnster Bereich der Inhalts-Prüfung): Träume, Kompass, Inspiration, Freie Zeit › Worauf hab ich Lust, Reise-Wünsche, Was mir wesentlich ist, Erste Nacht. Die anderen Bereiche folgen je mit einem PR (12–20).

## Was fällt weg oder rutscht tiefer
- Der Inhalt dieser Seiten rutscht um die Höhe der Karte tiefer. Mit × wird die Karte auf dieser Seite zu einer Zeile.

## Selbst entschieden
- Eingeschaltet wird pro Seite (`ON_PAGES`), nicht pro Moment, weil eine Seite Funktionen aus mehreren Momenten hat.
- Höchstens 4 Funktionen sichtbar, dann «Alle n zeigen».
- «So geht es» ist pro Funktion aufklappbar, damit die Karte kurz bleibt. Zugeklappt merkt sich die App pro Seite (Einstellungen, also im Backup).
- Nie auf Heute.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17: PR 11 (Baustein + Bereich Lust).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume öffnen: oben steht «Was du hier tun kannst».
2. Bei einer Funktion «So geht es» antippen: Schritte und Beispiel öffnen sich.
3. × antippen: es bleibt eine Zeile, auch nach Neuladen.
