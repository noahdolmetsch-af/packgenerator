# Türme, Brücken, Wasserfälle

PR (diese Änderung) · 07.11.2026 · Auftrag: Noah «ok N18» (Thread «Träume N12, N18, N10 bauen»), Idee N18 von «Träume und Neuland»; «5b» vom 28.10.2026: automatisch jede Woche

## Was ist neu
- Touren › Rückblick › Neuland: drei neue Sammlungen «Aussichtstürme», «Hängebrücken» und «Wasserfälle» (`COLLECTIONS` in `src/lib/neuland/neuland.js`, Merkmal `osm`). Die App findet sie auf Fahrten wie die Pässe (250 m, Wasserfälle 300 m), du kannst jeden Ort selbst abhaken, ausblenden, ergänzen; jede Sammlung lässt sich wie die anderen ausschalten, ordnen, umbenennen, als Ziel wählen («Herausforderungen mit Ende»).
- Die Orte stammen aus OpenStreetMap (Overpass, kostenlos, kein Schlüssel): benannte Aussichtstürme, Wasserfälle und Hängebrücken auf Wegen der Schweiz (`src/lib/neuland/osm.js`). Die App fragt einmal pro Woche von selbst, wenn Neuland aufgeht (und nach einer Fahrt auf Heute); bei einem Fehler erst nach 6 Stunden wieder. «Jetzt laden» beziehungsweise «Neu laden» unter der Liste fragt sofort.
- Leere Liste: sagt, warum sie leer ist (noch nicht geladen), und bietet «Jetzt laden» an. Unter jeder Liste steht das Ladedatum, die Zahl der Orte und «Daten © OpenStreetMap-Mitwirkende».
- Neue Funktion im Katalog: `f.osmsets`.

## Was fällt weg oder rutscht tiefer
- Neuland: drei Chips mehr in der Reihe der Sammlungen (hinter «Gemeinden»); alte Wege bleiben.
- Playwright-Tests dürfen die Overpass-Server nicht erreichen (`NO_REAL_SERVER`), wie schon bei Vercel und GitHub.

## Selbst entschieden
- **Speicher:** Die Orte liegen in der Tabelle `meta` (Schlüssel `neuland.osm`, wird nie exportiert, kein Dexie-Schema-Wechsel). Was du erreicht hast, steht wie bisher im Neuland-Stand (`ticks`, im Backup) unter den Orts-Kennungen `o-n123`. Nach einem Import auf einem neuen Gerät lädt die App die Orte einfach neu. Das Backup-Format ist gleich.
- Nur Orte mit Namen zählen (sonst viele namenlose Treffer). Hängebrücken nur auf Wegen (Pfad, Fussweg, Fahrweg), nicht Strassenbrücken.
- Alle drei Sammlungen sind von Anfang an eingeschaltet, mit leerer Liste bis zum Laden; wer sie nicht will, schaltet sie unter «Sammlungen wählen» aus.
- Kanton-Filter bei Zielen gibt es für diese Sammlungen nicht (die Orte tragen keinen Kanton).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: N18 gebaut. Offen: N10 «Eine Fundliste».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Neuland: «Wasserfälle» wählen; nach einigen Sekunden steht «Aus OpenStreetMap geladen am …: N Orte».
2. «Neu laden» tippen: das Datum bleibt heute, die Zahl bleibt etwa gleich.
3. Einen Wasserfall oder Turm von Hand abhaken (Kreis links): er bleibt abgehakt, auch nach «Neu laden».
