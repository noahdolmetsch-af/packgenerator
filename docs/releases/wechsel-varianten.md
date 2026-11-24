# Wechsel-Varianten

PR · 23.11.2026 · Auftrag: Noah «2a» (Punkt 7 der offenen Liste, Thread «Wi gaht's?» um Träume und Visionen erweitern)

## Was ist neu
- Jede der 29 Fragen, die am Start an sind, hat zwei weitere Formulierungen («Wie gut hast du geschlafen: Murmeltier oder Zombie?» / «Hast du wie ein Murmeltier geschlafen?»). Die Formulierung wechselt von Tag zu Tag, am selben Tag bleibt sie gleich (Seite und Fenster stimmen überein).
- Neu in Ich › Deine Fragen: Abschnitt «Worte der Fragen» mit dem Schalter **«Immer die Hauptfrage»** (am Start aus). Er stellt den Wechsel ab.

## Was fällt weg oder rutscht tiefer
- nichts. Bedeutung, Antwortform und Antworten bleiben gleich; Listen, Verlauf und Einstellungen zeigen weiter den Haupttext.

## Selbst entschieden
- Der Wechsel rechnet aus Tag und Frage (kein Zufall, kein neuer Speicher). Jede Formulierung kommt etwa an jedem dritten Tag.
- Eigene und umbenannte Fragen, Fragen aus deinen Daten und die Zufallsfrage bleiben, wie sie sind.
- Der Schalter ist ein Feld in den Einstellungen der Fragen (`mainOnly`), ohne Schema-Änderung; er geht mit ins Backup wie alle Einstellungen.
- Kein neuer Eintrag in `features.js`; Zeile in `docs/app-stand.md` bei «Deine Fragen».

## Entscheide (eigene Datei `docs/decisions/wechsel-varianten.md`)
- 23.11.2026: Wechsel-Varianten bauen, Schalter «Immer die Hauptfrage» (Noah «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wi gaht's?»: Wechsel-Varianten online; offen sind Verbindungen und Visionen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Wi gaht's?» am Morgen: die Fragen stehen in Worten, die an anderen Tagen anders lauten.
2. Ich › Deine Fragen › «Worte der Fragen»: «Immer die Hauptfrage» einschalten.
3. Wieder «Wi gaht's?» am Morgen: alle Fragen stehen im Haupttext.
