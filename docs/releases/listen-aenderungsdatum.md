# Änderungsdatum der Listen

Auftrag: Noah «1a und c und d alle» (Thread «Pfad auf jeder Seite anzeigen»), Schritt 6 von 6. Umfang laut Karte «a»: nur Listen und Typen.

## Was ist neu
- In Ich › Listen und Typen steht über einer geänderten Liste «Zuletzt von dir geändert: <Datum>».
- Das Datum wird bei jedem Speichern der Liste gesetzt und steckt im selben Eintrag wie die Änderungen. Es reist in Backups mit.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Ein Datum pro Liste, nicht pro Eintrag (kleiner, kein Eingriff in andere Tabellen).
- Kein neues Dexie-Schema, kein Hook, kein Eingriff in Sync: es ist ein zusätzliches Feld im bestehenden Eintrag «Überschreibungen» der Einstellungen. Ältere Backups ohne Datum laden wie bisher; das Datum kommt bei der nächsten Änderung.
- Backup-Kopie-Test: `tests/listchanged.test.js` lädt ein Backup ohne Datum und ein Backup mit Datum (Export, Import).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- Schritt 6 von 6 (alle Schritte des Pfad-Plans fertig). Änderungsdatum für alle Daten wäre ein eigener, grösserer Schritt (Backup und Sync betroffen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Listen und Typen › Themen der Notizen: eigenes Thema hinzufügen. Über der Liste steht «Zuletzt von dir geändert» mit dem heutigen Datum.
2. «Auf Standard zurücksetzen»: die Zeile verschwindet.
