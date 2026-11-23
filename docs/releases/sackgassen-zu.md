# Sackgassen bei Rennen und Unterwegs geschlossen

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «ja» (Thread «Navigation ohne Sackgassen»)

## Was ist neu
- **Rennseite eines Rennens, das es nicht gibt:** Sie zeigte für immer «Laden …», ohne Weg weiter (die Abfrage lieferte für «nicht da» denselben Wert wie für «lädt noch»). Jetzt steht dort «Dieses Rennen ist nicht da» mit «Zu den Rennen». Betrifft auch ein Rennen, das auf einem anderen Gerät liegt.
- **Unterwegs ohne Tour (neue Geräte):** Neben «Tour anlegen» steht jetzt «Zu den Touren».
- **Wege-Wächter:** `SACKGASSE_OFFEN` und `ZURUECK_OFFEN` sind leer. Die zwei «Zurück-Fallen» (`#/inbox/new`, `#/komoot/shared`) waren keine: Die Seite öffnet dort ein Fenster, und die erste Zurück-Taste schliesst es, so wie es gewollt ist (`backclose.js`). Der Wächter zählt einen Schritt mehr, wenn ein Fenster offen ist.
- Neue Prüfung `tests/e2e/rennen-fehlt.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Keine Änderung an den Daten. Das Rennen selbst wird nicht neu angelegt, die Seite sagt nur, dass es fehlt.

## Entscheide
- Keine eigene Datei: Fortsetzung von `docs/decisions/wege-waechter.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Navigation ohne Sackgassen: alle drei Listen des Wege-Wächters sind leer. Folgt: «Weiter zu …» auf Seiten mit nur einem Link, Zurück am Eingang, Suche nach Seiten.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. `…/#/race/gibt-es-nicht` öffnen: «Dieses Rennen ist nicht da» und «Zu den Rennen».
2. Auf einem Gerät ohne Touren Touren › Unterwegs öffnen: «Zu den Touren» steht neben «Tour anlegen».
