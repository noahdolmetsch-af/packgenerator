# Fitbit-Werte pro Person vorbereitet

PR #? · 27.10.2026 · Auftrag: Noah «alles online bringen», Schritt 4 im Plan «Geräte und Datenquellen» (Google pro Person, gleich wie Strava pro Person)

## Was ist neu
- Nichts Sichtbares. Der Server (`api/_lib/google.js`) kann jetzt die Fitbit-Werte mehrerer Personen auseinanderhalten.
- Ein Freund, dessen Strava schon verbunden ist (siehe «Strava pro Person vorbereitet»), kann sein eigenes Google verbinden. Google fragt ihn **nur** nach den Fitbit-Werten (Schlaf, Aktivität, Messwerte), auch wenn die App mehr verlangen würde.
- Seine Zugänge liegen getrennt (`google:tokens:<id>`). Er sieht nie Noahs Werte, und Mail, Kalender, Aufgaben und Drive bleiben nur für Noah (Antwort «owner_only»).
- «Trennen» bei einem Freund löscht nur seine Google-Zugänge.
- Die Freundes-Zuordnung (`strava:device:<hash>`) liegt jetzt in `api/_lib/oauth.js`, damit Strava und Google dieselbe nutzen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Noahs Google-Zugang behält seinen Namen `google:tokens`: keine neue Anmeldung.
- Freunde bekommen nur Fitbit, weil die anderen Google-Dienste in der App Noahs eigene Daten sind (Kalender, Mail, Drive-Ordner).
- Solange die Google-App im Testmodus ist, muss Noah einen Freund einmal als Testnutzer in Google Cloud eintragen. Erst nötig, wenn ein Freund wirklich mitmacht.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Geräte und Datenquellen: Schritt 4 von 5 (Google pro Person vorbereitet). Offen: Apple-Trainings in die Aktiv-Liste, Garmin mit eigenem Schlüssel (wartet auf Noah).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbindungen: Fitbit/Google zeigt «verbunden» wie vorher.
2. Heute: Schlaf und Schritte von heute kommen wie vorher.
