# «Jetzt laden» funktioniert wieder

Fehlerbehebung · 30.10.2026 · Auftrag: Noah «Button jetzt laden funktioniert nicht auf dem smartphone» (Thread «Fix «Jetzt laden» am Smartphone»)

## Was ist neu
- «Jetzt laden» (Balken oben und «Neueste laden» unter Ich) zeigt sofort «Lädt…» und sperrt sich, damit nie «nichts passiert».
- Die Seite wird über eine neue Adresse (`?fresh=…`, das `#` bleibt) geladen statt mit `reload()`. So kann eine alte Kopie (GitHub Pages hält Seiten bis 10 Minuten) sie nicht beantworten. Das Zeichen wird nach dem Laden wieder aus der Adresse entfernt.
- Hängt ein Schritt (Service Worker abmelden, App-Dateien löschen), lädt die App nach 3 Sekunden trotzdem.
- Daten (IndexedDB, localStorage) und Offline-Karten werden nie angefasst.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Ursache am echten Handy nicht prüfbar. Im Browser mit Service Worker lief der alte Weg durch; die Änderung macht ihn gegen Hänger und alte Kopien robust. Offen bleibt, ob der Fehler am Handy genau daran lag.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
