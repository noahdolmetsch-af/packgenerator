# Datenquellen: was die App liest und was als Nächstes kommt

Auftrag: Noah 27.10.2026 «1a 2a 3 nur ich verbunden, vorbereiten 4a 5b» und «alles online bringen»
(Thread «Geräte und Datenquellen»). Ziel: Freunde mit anderen Geräten sollen ihre Daten genauso nutzen
können. Kosten null, Daten bleiben auf dem Gerät, wo es geht.

## Heute (geprüft im Code)

| Quelle | Weg | Wer |
|---|---|---|
| Strava | Verbindung über den Server (`api/strava.js`) | Noah; Freunde vorbereitet (`STRAVA_ATHLETES`) |
| Google Health / Fitbit | Verbindung über den Server (`api/_lib/google.js`) | nur Noah |
| Fitbit-Export (Takeout) | Datei, auf dem Gerät | alle |
| FIT-Datei (jede Uhr, jeder Velocomputer) | Datei, auf dem Gerät (`src/lib/fit.js`) | alle |
| GPX, TCX, Strava-CSV | Datei, auf dem Gerät | alle |
| Apple Health | Export-Datei, auf dem Gerät (`src/lib/applehealth.js`) | alle |
| komoot, Ride with GPS | Link und GPX | alle |
| Eigene Eingaben (Gym, Tennis …) | von Hand | alle |

## Plan für weitere Dienste (Schritt 5)

Fakten aus Webquellen vom 27.10.2026, nicht in der App geprüft. Vor dem Bauen nochmals nachsehen.

| Dienst | Was es gibt | Kosten | Vorschlag |
|---|---|---|---|
| **Garmin Connect** | Seit 21.10.2026 ein **persönlicher API-Schlüssel**: jede Person holt ihn selbst in Garmin Connect (Web), ohne Antrag. Nur Abholen («pull»), Zugang 24 h, Schlüssel läuft nach 30 Tagen bis 1 Jahr ab. Gedacht für die eigenen Daten, nicht für Apps, die anderen dienen. Ob ältere Daten kommen, sagen die Quellen unterschiedlich. VO2max, Erholungszeit und Leistungszustand gibt Garmin nicht heraus. Die Firmen-Schnittstelle ist für Firmen und war monatelang pausiert. | gratis | **Zuerst prüfen**: Jeder (Noah und Freunde) trägt den eigenen Schlüssel ein; die App holt Aktivitäten (FIT) und Tageswerte. Läuft wohl über unseren Server (Browser darf Garmin vermutlich nicht direkt fragen, Annahme). |
| **Polar** (AccessLink) | Offene Schnittstelle, Registrierung mit Polar-Flow-Konto, nur lesen. | gratis (Stand der Quellen 2017–2024) | Wenn ein Freund Polar hat: Verbindung wie Strava (pro Person). Bis dahin FIT-Datei. |
| **Oura** | API v2 nur noch mit OAuth2 (persönliche Tokens seit Dez. 2025 weg). Ohne Freigabe höchstens 10 Nutzer. | gratis | Reicht für ein paar Freunde: Verbindung pro Person über den Server, wenn jemand einen Ring hat. |
| **Samsung Health** | Kein Web-Zugang. Export «Persönliche Daten herunterladen» als ZIP mit CSV pro Bereich (kann bis 24 h dauern). | gratis | Export-Datei einlesen wie Apple Health, wenn ein Freund Samsung nutzt. |
| **Health Connect** (Android) | Kein Web-Zugang; nur echte Android-App. | – | Nicht bauen; Samsung-Export oder Strava. |
| **Wahoo, Hammerhead, Coros, Suunto** | Fahrten über Strava oder FIT-Datei. | gratis | Nichts Eigenes bauen. |

## Reihenfolge

1. Apple-Workouts in den Aktiv-Verlauf (wie Fitbit-Trainings).
2. Google/Fitbit pro Person vorbereiten (wie Strava, nach dem Merge von «Strava pro Person»).
3. Garmin persönlicher Schlüssel: kleiner Versuch mit Noahs eigenem Schlüssel (er hat Edge und HRM).
4. Samsung-Export, Polar, Oura: erst wenn ein Freund das Gerät hat.

## Quellen (27.10.2026)

- Garmin Personal API: developer.garmin.com/gc-developer-program/personal/personal-api, gadgetsandwearables.com 21.10.2026, garminrumors.com, tredict.com/blog/garmin_personal_api_chatgpt_and_claude
- Garmin Firmen-Programm pausiert: forums.garmin.com, tryterra.co/blog/garmin-connect-developer-program-pause
- Polar AccessLink: polar.com/blog/introducing-polar-open-accesslink-api, github.com/polarofficial/accesslink-example-python
- Oura: api.ouraring.com/v2/static/json/openapi-1.37.json
- Samsung Health Export: takeoutday.org/guides/how-to-export-samsung-health-data
