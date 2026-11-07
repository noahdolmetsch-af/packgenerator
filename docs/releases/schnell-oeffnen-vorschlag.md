# Anpinn-Vorschlag auf Heute

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «6a» (Ideen-Doc «Ideen für alle Bereiche», Teil 6 «Quick Links»; Thread «Bauen: Quick Links 6a und Oben 7a»)

## Was ist neu
- «Du öffnest «Touren» oft. Hier anpinnen?» steht jetzt auch in der Kachel «Schnell öffnen» auf Heute (`src/lib/home/PinsTile.svelte`), mit «Anpinnen» (mit Rückgängig) und «Nein, danke» (30 Tage Ruhe). Vorher kam der Vorschlag nur auf der Seite Quick Links, die man dafür extra öffnen musste.
- Gleicher Vorschlag, gleiche Regel (3 verschiedene Tage in 14 Tagen) und gleicher Zähler wie dort (`suggestions` in `src/lib/quick/usage.js`); ein «Nein, danke» gilt an beiden Orten.

## Was fällt weg oder rutscht tiefer
- Nichts. Die Kachel ist bei einem Vorschlag eine kleine Zeile höher.

## Selbst entschieden
- Der Vorschlag steht nur in der Kachel, nicht als eigene «Jetzt dran»-Zeile: «Jetzt dran» bleibt für Dringendes.
- Eine Seite aufs Mal, nur ausserhalb des Bearbeitens (wie in Quick Links).
- Der neue Pin kommt in die letzte Gruppe, wie beim Hinzufügen aus dieser Kachel.
- Kein neuer Funktionseintrag: der Vorschlag gehört zu `f.quicklinks`. app-stand.md ergänzt in der Zeile «Heute».

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Ideen-Doc 05.11.2026: Teil 6a (Automatische Vorschläge) liegt als Vorschlag auf Quick Links seit Schritt 4 vor; dieser PR zeigt ihn auch auf Heute. 6b (Links je Tageszeit) nicht gewählt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Dieselbe Seite (z. B. Touren) an drei verschiedenen Tagen öffnen.
2. Heute öffnen, «Schnell öffnen»: der Vorschlag steht unter den Kürzeln. «Anpinnen» tippen: die Seite ist ein Kürzel, «Rückgängig» holt sie zurück.
3. «Nein, danke» tippen: der Vorschlag ist weg und kommt 30 Tage nicht wieder.
