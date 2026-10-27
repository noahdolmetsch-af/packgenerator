# Strava pro Person vorbereitet

PR #? · 27.10.2026 · Auftrag: Noah «3: nur ich bleibe verbunden, allerdings bereiten wir vor, dass sich andere Personen mit ihrem eigenen Strava verbinden können» (Thread «Geräte und Datenquellen»)

## Was ist neu
- Nichts Sichtbares. Der Server (`api/strava.js`) kann jetzt mehrere Strava-Konten auseinanderhalten.
- Ein Freund kann sein eigenes Strava verbinden, **sobald** seine Strava-Athleten-Nummer in der Vercel-Einstellung `STRAVA_ATHLETES` (Komma-Liste) steht. Heute ist sie leer: nur Noah ist verbunden, alles bleibt wie bisher.
- Die Zugänge eines Freundes liegen getrennt (`strava:tokens:<id>`). Sein Geräte-Schlüssel öffnet nur sein Strava, nie Noahs Strava und nie Google (Fitbit, Kalender, Mail, Drive).
- «Trennen» bei einem Freund löscht nur seine Zugänge und seinen Schlüssel.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Noahs Zugang behält den alten Namen `strava:tokens`: keine neue Anmeldung, der Wächter (`api/_lib/health.js`) bleibt gleich.
- Freunde nur per Liste (`STRAVA_ATHLETES`), nicht «jeder, der sich anmeldet»: so verbindet sich niemand aus Versehen.
- Strava erlaubt einer neuen App nur einen Athleten, bis Strava mehr freigibt (gratis Antrag im Strava-Entwicklerbereich). Diesen Antrag stellt Noah erst, wenn ein Freund wirklich mitmacht.

## Entscheide (für decisions.md)
- 27.10.2026: Strava bleibt vorerst nur für Noah verbunden; der Server ist für Freunde vorbereitet.

## Stand im Plan (roadmap.md / vorhaben.md)
- Geräte und Datenquellen: Schritt 2 von 5 (Strava pro Person vorbereitet). Danach Apple-Health-Export, Google pro Person, Plan Samsung/Polar/Oura/Garmin Connect.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege › Strava: «verbunden» wie vorher.
2. Aktiv: neue Strava-Fahrten kommen wie vorher.
