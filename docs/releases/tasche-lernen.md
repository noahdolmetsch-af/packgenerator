# Tasche lernen

PR #1785 · 23.11.2026 · Auftrag: Noah «3a» (Thread «Packen nach Taschen am Bike ausbauen»)

## Was ist neu
- Packst du ein Teil auf mindestens drei abgeschlossenen Touren in eine andere Tasche als seine übliche (und auf mindestens 80 % seiner Touren in dieselbe), steht in der Karte «Bereit zur Abfahrt?» die Zeile «Übliche Tasche: … packst du oft woanders hin» (Ton «Tipp», ändert die Überschrift der Karte nicht).
- Ein Tipp öffnet das Fenster «Wohin du Teile immer wieder legst»: «Künftig in: <Tasche>» macht sie zur üblichen Tasche des Teils (mit «Rückgängig»), «Nicht mehr fragen» hält das Teil aus der Frage heraus (mit «Rückgängig»).

## Was fällt weg oder rutscht tiefer
- nichts. Die übliche Tasche ändert sich nie von allein; sie lässt sich weiter im Fenster des Teils (Zeile «Übliche Tasche») einstellen.

## Selbst entschieden
- Als «umgelegt» zählt nur, was von der üblichen Tasche abweicht und nicht durch eine fehlende Tasche an der Tour entstand (`slotFor`): so lernt die App nur, was du selbst getan hast.
- Getragene Orte (Rücken, Hüfte), «Am Körper» und «Montiert» werden nicht gelernt.
- Neuer Ton «Tipp» (Glühbirne) in der Tour-Ampel, damit ein Vorschlag nicht «Fast bereit» auslöst.
- Daten: schreibt nur das bestehende Feld `item.defaultBag` auf Tipp und die neue Einstellung `bagLearnOff` (Liste von Teil-IDs, kommt in jedes Backup mit). Kein Dexie-Schema, kein neues Backup-Format. Backup-Prüfung mit einer Kopie von Noahs Backup: siehe PR.

## Entscheide (eigene Datei `docs/decisions/tasche-lernen.md`)
- 23.11.2026: «Künftig in …?» nur auf Tipp, mit Rückgängig (Noah «3a»)

## Stand im Plan (roadmap.md / vorhaben.md)
- Packen nach Taschen am Bike (Leitfaden): Schritt 3 von 3 (Lieblingsteile, Gesamtgewicht und «Tasche lernen» gebaut)

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour mit einem Teil öffnen, das du auf drei früheren Touren immer in dieselbe andere Tasche gelegt hast.
2. Karte «Bereit zur Abfahrt?» aufklappen: die Zeile «Übliche Tasche» erscheint (nur wenn es so ein Teil gibt).
3. Zeile tippen, «Künftig in: …» tippen, «Rückgängig» in der Meldung tippen: die alte Tasche ist zurück.
