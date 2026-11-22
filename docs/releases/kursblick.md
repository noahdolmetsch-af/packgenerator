# Kursblick: Gold und SMI jeden Tag

PR #<Nummer> · 22.11.2026 · Auftrag: Noah «1-4a» und «ja» (Thread «Mockup für Kurse von Gold, SMI und Aktien»)

## Was ist neu
- Neue kleine App «Kursblick» (`#/kurse`, eigenes Symbol, `apps/kursblick/`, Reiter Heute, Gold, Quellen).
- **Heute:** Gold in CHF pro kg mit Schlusskurs vom Vortag, Veränderung seit dem Referenztag (Standard 1.11.2026; ein Sonntag zählt als letzter Schlusskurs davor, Fr 30.10.2026) und «Ein Verkauf von 1 kg brächte …» (Preis minus Händlerabschlag, Standard 2 %). Dazu der SMI. Zeitraum wählbar: Vortag, Woche, Monat, 3 und 6 Monate, Jahr, 5, 10, 20, 40 Jahre oder «Eigener Zeitraum» (Zahl und Tage, Wochen, Monate, Jahre). Verlaufslinie für Gold oder SMI.
- **Gold:** Verkaufsrechner (Art Barren, Münzen oder Altgold schlägt 2, 4, 8 % vor, Menge in Gramm, Abschlag, Gebühr), Referenztag ändern, alle Zeiträume als Tabelle.
- **Quellen:** pro Kurs der Tag des Schlusskurses, wann er geholt wurde, die Quelle und «Daten seit …»; «Kurse neu holen».
- Server: `api/lake.js` `?action=kurse&id=gold|smi|usdchf` (Logik `api/_lib/kurse.js`): holt Schlusskurse von Stooq, Yahoo als Ausweich; der Tag von heute fehlt (kein Schlusskurs). Gold wird mit dem Dollarkurs desselben Tages von USD pro Unze in CHF pro kg umgerechnet.
- Absprung: Link am Ende des Währungsrechners (Werkzeugkasten); Eintrag in «Kleine Apps» und im Handbuch.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- **Kein Schema, keine Datenbanktabelle:** die Kursreihen sind ein Cache (Cache API des Browsers), keine Nutzerdaten; nur zwei Einstellungen (`kurse.referenz`, `kurse.abschlag`). Das Backup-Format bleibt gleich. Der Datenteil des Bauplans (K3) ist damit klein; Bestand, Ziele und Dividenden kommen später in Welle K-C mit eigener Freigabe.
- **Keine neue Vercel-Funktion** (Grenze 12): der Kursdienst ist eine weitere Aktion von `api/lake.js`. «Der Server speichert die Reihen» heisst: Vercels Cache hält eine Antwort 6 Stunden; es gibt keine Datenbank. Wenn Noah mehr will (eigener Speicher), ist das ein eigener Schritt.
- Die Quellen senden kein CORS, darum fragt nur der Server; kein direkter Weg aus der App wie bei den Haltestellen. Ohne Netz zeigt die App die letzte Antwort und sagt «älter».
- Die Vorschläge für Münzen (4 %) und Altgold (8 %) sind erfundene Richtwerte (Noah ändert sie); der Standardabschlag 2 % ist Noahs Wert.
- Die Verlaufslinie zeigt mindestens einen Monat, damit «Vortag» nicht nur zwei Punkte zeigt; die Zahlen darüber gelten genau für den gewählten Zeitraum.
- Keine Zeile «Was du hier tun kannst» (`ON_PAGES`) und kein «Gut zu wissen» für diese Seite in diesem PR: die kleine App hat ihren eigenen Aufbau; folgt mit der Breite (Welle K-B).
- Der leere Zustand (kein Netz und noch nichts gespeichert) sagt es und bietet «Nochmals» an. Nächster Schritt (Fertig-Regel 5): «Im Reiter Gold ändern» führt vom Verkaufswert zum Rechner.
- Keine Anlageberatung: nur Zahlen. Kein Bankname, keine privaten Zahlen im Repo; Tests nutzen eine erfundene Zufallsreihe.

## Entscheide (für decisions)
- `docs/decisions/kursblick.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- `docs/vorhaben.md` Punkt 19 «Kursblick»: Welle K-A gebaut (K1, K2, K4, K5 und der kleine Teil von K3). Folgt: K-B Breite, K-C Persönliches.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Werkzeugkasten › Währungen: am Ende «Kurse von Gold und SMI: Kursblick» antippen.
2. Auf Heute den Goldpreis, die Veränderung seit 1. Nov. 2026 und den Verkaufswert lesen; «Jahr» antippen.
3. Im Reiter Gold den Händlerabschlag ändern: der Verkaufswert ändert sich und bleibt nach dem Neuladen.
4. **Vor dem Merge:** der Server «packgen» muss nach dem Merge READY sein, dann liefert `…/api/lake?action=kurse&id=gold` die Reihe. Die echten Quellen (Stooq, Yahoo) liessen sich in der Entwicklungsumgebung nicht erreichen: der erste Abruf auf der echten Seite zeigt, ob sie antworten; sonst sagt die Seite «Gerade keine Kurse».
