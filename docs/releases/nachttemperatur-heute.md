# Nachttemperatur auf Heute

PR · 06.11.2026 · Auftrag: Noah «1a und c 2a 3a 4a 5a» (Thread «Planen: Nachttemperatur beim Wetter zeigen»)

Zweiter von drei kleinen PRs. PR 1 (Karte auf der Wetterseite) ist online. PR 3 (Abend-Push, api/) folgt als eigener PR. Die Orte-Liste (Noah «2a») folgt, sobald die Höhen-Karte (#924) auf `main` ist.

## Was ist neu
- Heute, in den Wetterzeilen unter der Nebelgrenze: eine ruhige Zeile für den Wohnort, z. B. «Nacht: heute früh 5 °C, morgen früh 7 °C · 2° wärmer als gestern früh». Tippen öffnet die Wetterseite.
- Der Hinweis in der Zeile: Frost in den nächsten drei Nächten («Frost in 3 Tagen (unter 0 °C)»), sonst die Veränderung zu gestern früh (ab 2°). Ohne beides steht nur die Nacht.
- Ausschalten: Wetterseite, Karte «Nachttemperatur», «Nachtzeile einstellen» (Einstellung `nachtHome`, wie `fogHome`). Ohne Wohnort oder ohne Wert steht keine Zeile.
- Dieselbe kleine Abfrage wie die Karte (`nacht.js`, 3 Stunden gemerkt, nicht im Backup): wer beide öffnet, fragt nicht doppelt.

## Was fällt weg oder rutscht tiefer
- nichts. Auf Heute steht eine Zeile mehr unter den Wetterzeilen; alles darunter rutscht um etwa eine Zeile tiefer.

## Selbst entschieden
- Die Zeile steht bei den anderen Wetterzeilen von Heute (Schneefallgrenze, Nebelgrenze), nicht in «Jetzt dran»: es ist eine ruhige Information, kein Fälliges.
- Nur ein Hinweis pro Zeile, damit sie kurz bleibt: Frost geht vor der Veränderung zu gestern. «Frostfrei in X Tagen» und «5 Plus» stehen nur auf der Wetterseite.
- Keine neue Funktion in `features.js` (gehört zu «Wetter für eine Fahrt»), kein neuer Eintrag in `app-stand.md` ausser dem Satz bei «Wetter».

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Nachttemperatur auf Heute. Offen: Orte-Liste (nach #924), Abend-Push (PR 3, api/).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute: unter den Wetterzeilen steht «Nacht: heute früh … °C, morgen früh … °C».
2. Die Zahl mit der Karte auf der Wetterseite vergleichen: sie ist gleich.
3. Tippen auf die Zeile: die Wetterseite öffnet sich.
4. Wetter › «Nachtzeile einstellen»: ausschalten, auf Heute ist die Zeile weg.
