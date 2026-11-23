# Überall dieselbe Antwort für heute

PR #(folgt) · 23.11.2026 · Auftrag: Noah «ja» (Thread «Form und Erholung klüger machen»), Folge von «Form und Erholung, klarer»

Die Seite Form und Erholung sagt seit dem letzten PR «Heute Ruhe oder eine lockere halbe Stunde», wenn Schlaf und HRV deutlich tief sind. Training («Heute passt», Wochenvorschlag), der Tour-Pfad und weitere Karten rechneten aber noch mit der Stufe der reinen Punktezahl (z. B. «locker» bei 42) und konnten sich so widersprechen.

## Was ist neu
- `readiness()` in `src/lib/form.js` gibt als `level` jetzt die Antwort für heute (`tagesantwort.js`) zurück; die Punktezahl und die Stufe der Zahl allein (`scoreLevel`) bleiben unverändert. Alle Stellen, die `level` lesen (Training «Heute passt», Wochenvorschlag, «Meine Tour», Live, Träume), sagen damit dasselbe wie die Seite Form und Erholung.
- Wirkung: Sind zwei oder mehr Erholungswerte deutlich tief, erscheint «Heute passt eine leichtere» eher; die Antwort hebt nie an.

## Was fällt weg oder rutscht tiefer
- nichts. An Tagen mit gutem Schlaf und guter HRV ändert sich nichts.

## Selbst entschieden
- Die Anpassung steht an einer Stelle (`readiness()`), nicht in jedem Verbraucher, damit sich nichts wieder auseinanderentwickelt. Die Zahl (Punkte) bleibt, weil Verlauf und Diagramme sie nutzen.
- Keine Datenänderung, kein Backup nötig. Kein neuer Eintrag in `features.js`.

## Entscheide (eigene Datei `docs/decisions/heute-passt-angleichen.md`)
- 23.11.2026: Überall dieselbe Antwort für heute.

## Stand im Plan (roadmap.md / vorhaben.md)
- Gehört zu Ziel «Eine App, die mich im Alltag unterstützt». Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Form und Erholung: Antwort oben merken (an einem Tag mit tiefem Schlaf und tiefer HRV: «Ruhe oder lockere halbe Stunde»).
2. Training › Woche: «Heute passt eine leichtere» erscheint dann und «Dein Stand» nennt dieselbe Stufe.
