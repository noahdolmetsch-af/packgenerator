# Konten-Liste

Stand 26.10.2026. Alle Konten, die Pack Generator braucht. **Hier stehen nie Passwörter, Schlüssel oder Mail-Adressen**: das Repository ist öffentlich. Die privaten Angaben (mit welcher Mail du wo angemeldet bist, wo die Wiederherstellungs-Codes liegen) stehen in deinem Projektordner unter `private/konten-privat.md` und in deinem Passwort-Manager.

Zurück zum [Notfall-Handbuch](notfall-handbuch.md).

## Die Konten

| Konto | Wofür | Kosten | Anmelden und nachsehen | Wenn es wegfällt |
|---|---|---|---|---|
| **GitHub** | Code, Tests, Wächter, die App online (GitHub Pages) | gratis (öffentliches Repository) | https://github.com/noahdolmetsch-af/packgenerator | Das wichtigste Konto. Ohne Zugang kann niemand mehr etwas ändern. Die App auf deinen Geräten läuft weiter |
| **Vercel, Projekt «packgen»** | Der Server für alle Extras (Ordner `api/`). Hier liegen alle Schlüssel | gratis (Hobby) | https://vercel.com › packgen › Deployments (soll **Ready** sein), Settings › Environment Variables | Strava, Google, KI, Abgleich, Erinnerungen fallen aus |
| **Vercel, Projekt «packgenerator»** | Test-Links für neue Versionen | gratis | https://vercel.com › packgenerator | Keine Test-Links mehr |
| **Upstash** (über Vercel verbunden) | Schliessfach des Servers: Logins, Abgleich Handy-Computer | gratis | Vercel › packgen › Storage | Abgleich und Logins weg, deine Daten auf den Geräten bleiben |
| **Google Cloud** | Erlaubnis für Fitbit, Termine, Aufgaben, Mail, Drive | gratis | https://console.cloud.google.com › APIs & Services › Credentials | Google-Extras fallen aus |
| **Strava** (API-App) | Fahrten holen | gratis | https://www.strava.com/settings/api | Strava-Fahrten kommen nicht mehr |
| **Anthropic** | KI-Helfer (Claude in der App) | Guthaben, Deckel pro Monat | https://console.anthropic.com › Billing | KI-Knöpfe verschwinden |
| **Google AI Studio** (Gemini) | Gratis-KI | gratis | https://aistudio.google.com › API keys | Weniger KI |
| **cron-job.org** | Wecker: ruft den Server regelmässig für Erinnerungen aufs Handy | gratis | https://console.cron-job.org | Keine Erinnerungen aufs Handy |
| **Trello** | Abgleich deiner To-dos mit dem Board «Packgenerator» | gratis | https://trello.com | Kein Trello-Abgleich |

**Ohne Konto** (offene Gratis-Dienste): Wetter (Open-Meteo, MeteoSchweiz), Lawinen (SLF), ÖV (transport.opendata.ch), Karten (OpenStreetMap), Seetemperaturen (Alplakes), Ride with GPS (öffentliche Routen). Fällt einer aus, fehlt nur diese Anzeige.

**Keine eigene Internet-Adresse:** Die App läuft unter `github.io` und der Server unter `vercel.app`. Es gibt keine Domain, die ablaufen oder bezahlt werden muss.

## Die Schlüssel (nur die Namen)

Die Werte stehen nur in Vercel › packgen › Settings › Environment Variables und in deinem Passwort-Manager. Ein Helfer braucht nur diese Namen.

| Name | Gehört zu | Wenn er fehlt oder abläuft |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic | KI-Helfer aus |
| `HELPER_TOKEN`, `HELPER_MONTHLY_CHF` | KI-Helfer: Zugang und Monats-Deckel | KI-Helfer aus |
| `GEMINI_API_KEY` | Google AI Studio | Keine Gratis-KI |
| `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` | Strava API-App | Strava aus |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud | Google-Extras aus |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash (setzt Vercel selbst) | Abgleich und Logins aus |
| `TRELLO_API_KEY` | Trello | Trello aus |

Der Wächter prüft jeden Morgen, ob diese Schlüssel da sind und funktionieren, und schickt bei einem Fehler eine Mail.

## Logins, die ablaufen können

Diese Logins machst du in der App selbst. Sie laufen ab, wenn du ein Passwort änderst oder etwas lange nicht benutzt. Die App sagt es dir dann.

- **Strava:** in der App «Mit Strava verbinden».
- **Google** (Fitbit, Termine, Mail, Drive): in der App «Mit Google verbinden». Genaue Klicks: [Wann du etwas tun musst](wann-du-etwas-tun-musst.md), Abschnitt 2.
- **Trello:** in der App beim Trello-Abgleich neu verbinden (Suche: «Trello»).
