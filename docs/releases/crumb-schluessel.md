# Pfad-Zeile: Seite stürzt nicht mehr ab, wenn zwei Schritte dieselbe Adresse haben

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «ja» (Thread «Wackel-Tests zuverlässig machen»)

## Was ist neu
- Ein echter Fehler, den der Test `rundgang.spec.js` («Meine Sportarten» nach Velos) gezeigt hat: Die Pfad-Zeile über dem Titel der Aktiv-Seiten (`src/lib/flow/kit/Crumb.svelte`) nummerierte ihre Schritte nach der Adresse. Der Ort «Velos und Material» und sein erster Reiter teilen die Adresse `#/bikes`. Beim Seitenwechsel zeichnet die Zeile kurz noch mit der alten Adresse, bekam dann zweimal denselben Schlüssel, und die ganze Seite zeigte «Hier ist etwas schiefgelaufen». Lokal in 3 von 8 Läufen am Computer, in der Nacht und in der CI mehrfach.
- Jetzt nummeriert die Zeile ihre Schritte nach der Stelle in der Zeile, wie `PathLine`, `PathHead`, `Crumbs` und `VeloHead` es schon tun. Das Aussehen ändert sich nicht.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur den Schlüssel geändert, nicht die Pfad-Berechnung (`fitSteps`): so bleibt jede Pfad-Zeile Zeichen für Zeichen gleich.
- Keine «Was ist neu»-Datei: für Noah ist nichts Neues sichtbar, nur dass die Seite nicht mehr abstürzt.

## Entscheide (eigene Datei `docs/decisions/crumb-schluessel.md`)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos und Material öffnen, dann ohne Pause über das Menü auf «Woche › Training › Meine Aktivitäten» wechseln: die Seite zeigt ihren Inhalt, nicht «Hier ist etwas schiefgelaufen».
2. In GitHub: `rundgang.spec.js` («Die kleine Tour der Velos …») ist am Computer grün.
