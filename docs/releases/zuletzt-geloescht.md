# Zuletzt gelöscht

Auftrag: Noah «1a» (23.11.2026, Thread «Papierkorb, Tab-Titel und Ziehen bauen»)

## Was ist neu
- Neue Seite Ich › Daten › «Zuletzt gelöscht» (`#/me/trash`): alles, was du löschst (Velo, Tour, Material, Dokument, Einträge), wartet 30 Tage. «Zurück» bringt es mit dem zurück, was dazugehörte («Kommt mit zurück: 14 Fahrten, 3 Pflegeeinträge»).
- Filter nach Art; der Notizen-Papierkorb steht zusätzlich in der Liste und bleibt, wie er ist.
- Nach 30 Tagen fragt die App einmal «Jetzt endgültig leeren?»; nichts verschwindet von allein.
- Leerzustand: «Nichts gelöscht in den letzten 30 Tagen».
- ⌘Z / Strg Z am Computer nimmt das letzte Löschen zurück (nur wenn kein Feld aktiv ist).
- Technik: Dexie-Schema 21 mit Tabelle `trash` (Schnappschuss der Zeilen); `deleteWithUndo` füllt sie (`src/lib/trash/`). Die Tabelle ist in der Sicherung (`DATA_TABLES`), nicht im Geräteabgleich.

## Was fällt weg oder rutscht tiefer
- nichts. Das Rückgängig-Fenster von 4 Sekunden bleibt wie es war; «Zuletzt gelöscht» kommt dahinter dazu.

## Selbst entschieden
- Eine Zeile wird nur aufgenommen, solange `deleteWithUndo` / `trashed` läuft (Fangfenster des Dexie-Hooks `deleting`), so landen keine inneren Löschungen (Aufräumen, Abgleich) im Papierkorb.
- Löschen eines Velos verschiebt dessen Touren zu einem anderen Velo (`deleteBike`); «Zurück» stellt das Velo mit Fahrten und Pflege her, macht diese Verschiebung aber nicht rückgängig.
- Mehr als 5000 Zeilen in einem Löschvorgang werden nicht aufbewahrt (Speicherschutz); die Rückgängig-Taste von 4 Sekunden gilt trotzdem.
- Fotos und Dokumente liegen bis zu 30 Tage doppelt (im Papierkorb), danach fragt die App.
- Der Papierkorb der Notizen bleibt eigenständig und ist von der neuen Erfassung ausgenommen.
- Der Geräteabgleich trägt den Papierkorb nicht (`syncLocal`): ein Löschen auf einem Gerät ist auf dem anderen nicht «Zurück»-bar.
- Orte mit `askDelete` ohne `deleteWithUndo` sind noch nicht angeschlossen; Material und Dokumente sind es.
- Backup: getestet mit einer Kopie von Noahs Sicherung vom 23.11.2026 (alle Tabellen nach Löschen und «Zurück» gleich, ausser den umgehängten Touren, siehe oben). Vor dem Merge wird eine frische Sicherung angefragt, wenn die letzte älter als ein Tag ist.

## Entscheide (eigene Datei `docs/decisions/zuletzt-geloescht.md`)
- 23.11.2026: «Zuletzt gelöscht» für alles, 30 Tage (Noah «1a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material: ein Teil löschen, Ich › Daten › «Zuletzt gelöscht» öffnen: es steht dort mit Resttagen.
2. «Zurück» tippen: das Teil ist wieder in Material.
3. Am Computer: etwas löschen, ⌘Z drücken: es ist zurück.
