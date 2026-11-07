# Noah-Wissen: was du über die App wissen und selbst tun musst

Für Noah, in einfachem Deutsch. Schnappschuss vom **5. November 2026**. Diese Seite ist die kurze Antwort auf «Was muss ich in Zukunft noch wissen?». Alles Genaue steht in den verlinkten Dateien. **Hier stehen nie Passwörter, Schlüssel oder Mail-Adressen**, denn das Repository ist öffentlich.

**Die wichtigste Nachricht:** Im Alltag musst du nichts tun. Die App läuft auf deinen Geräten weiter, auch offline und auch dann, wenn niemand mehr am Code arbeitet. Nur die Extras (Strava, Google, KI, Abgleich, Erinnerungen aufs Handy) hängen an Konten und Diensten; sie fallen einzeln aus, nicht alle zusammen. Das einzig wirklich Gefährliche ist, **keine Sicherung deiner Daten zu haben**.

---

## 1. Wo du etwas freigibst (und wie)

| Du schreibst oder tippst | Was Claude dann tut |
|---|---|
| **«ok NNN»** (zum Beispiel «ok 942») oder Tipp auf **«Freigeben»** | Setzt das Label `ok` auf genau diesen PR; das startet die Handy-Tests; der Bündler führt ihn zusammen, sobald alles grün ist; danach kommt eine Zeile «Online: …» mit Prüfschritten |
| **«zurück NNN»** | Macht diesen PR sofort rückgängig (Revert) |
| **«schliessen NNN»** | Schliesst einen PR ohne Merge. Nur auf dieses Wort, nie von selbst |
| **«1a 2b 3a …»** | Antwort auf eine Frage-Runde (höchstens 5 Fragen, a/b ausgeschrieben, Empfehlung mit ★) |
| **«ok Mockup»** oder «ok <name>» | Freigabe der Bilder einer ganz neuen Seite; danach wird gebaut |

**Merke:** Nur dein «ok» für genau diesen PR zählt. Kein früherer Satz, keine Design-Karte vor dem PR gilt als Freigabe. **Kleine sichere PRs** (nur Text oder Ansicht, alle Tests grün, nichts mit Daten, Backup, Abgleich oder dem Server `api/`) hast du am 31.10.2026 pauschal freigegeben; sie brauchen keine Einzelkarte. **Dependabot-PRs** (Updates der Bibliotheken) gehen grün von selbst durch.

Wo du die offenen PRs siehst: https://github.com/noahdolmetsch-af/packgenerator/pulls. Die ausführliche Übersicht mit Reihenfolge: [Stand und Plan](stand-und-plan.md).

---

## 2. Was nur du prüfen kannst

Claude und die Test-Roboter arbeiten mit **erfundenen Daten** und erreichen manche Dienste nicht. Das siehst nur du, auf deiner echten Seite (https://noahdolmetsch-af.github.io/packgenerator/) und mit deinen Geräten:

- **Wetter mit echten Daten:** Nebelgrenze und Temperaturen nach Höhe (Nullgradgrenze der Karte gegen die Wetterzeile; Nebel gegen eine Webcam), Regenradar der Landi und SRF-Webcams im Fenster.
- **Deine Verbindungen:** Strava, Fitbit/Google, Termine, Mail. Sie laufen nach einiger Zeit ab; die App sagt dann «Neu verbinden».
- **Abgleich Handy und Computer:** erscheint wirklich alles auf dem anderen Gerät (zum Beispiel ein neues Velo)?
- **Auf dem Handy unterwegs:** GPS-Aufzeichnung und Live-Karte bei einer echten Fahrt, Erinnerungen aufs Handy (Push), Offline-Karten, Ton (Kuhglocken sind nur mit Schalter an).
- **Echte Daten:** Wie fühlt sich die App mit deinem vollen Datenbestand an (Tempo)? Das testet Claude nur mit erfundenen Daten.
- **Tennis und Rechnungen:** was an Kundinnen und Kunden geht; die Bezahlfunktion läuft nur im Testmodus.
- **Gefühl:** ob etwas verständlich, nützlich und ruhig ist. Das Ziel ist «Eine App, die mich im Alltag unterstützt».

Das grosse Durchklicken führt dazu eine Liste «Nur Noah» in jedem Etappenbericht.

---

## 3. Deine Wartungs-Checkliste

| Wie oft | Was | Wo |
|---|---|---|
| Alle 14 Tage (die App erinnert dich) | **Backup exportieren** und an **zwei** Orten ablegen (zum Beispiel Google Drive und USB-Stick) | Ich › Daten und Backup › Backup exportieren |
| Einmal einrichten (Computer) | **Auto-Backup in einen Ordner** | Ich › Daten und Backup › Auto-Backup in einen Ordner |
| Nach jeder «Online»-Meldung | Die genannten 2 bis 4 Prüfschritte auf der echten Seite ansehen; bei Problem «zurück NNN» | Die Meldung im Chat |
| Wenn eine Mail von GitHub kommt (Wächter oder Live-Check, «Issue») | Lesen. Einmalig und am nächsten Tag zu: nichts tun. Mehrere Tage: im Thread melden | GitHub › Issues |
| Wenn die App «Neu verbinden» sagt | Antippen und erlauben | In der App |
| Wenn die KI-Knöpfe weg sind | Das Guthaben ist leer. Nichts tun ist in Ordnung; sonst Guthaben kaufen | https://console.anthropic.com › Billing |
| Nach einer Änderung am Server (`api/`) | Prüfen, dass der Server «packgen» **Ready** zeigt (Claude meldet es) | https://vercel.com › packgen › Deployments |
| Alle drei Monate (freiwillig) | **Code-ZIP** herunterladen und zu den Backups legen | GitHub › grüner Knopf Code › Download ZIP |
| Alle drei Monate (freiwillig) | Konten-Runde: Kann ich mich bei GitHub, Vercel, Google, Strava, Anthropic noch anmelden? Sind die Wiederherstellungs-Codes zu Hause? | [Konten-Liste](konten.md) |
| Wöchentlich (Sonntags-Brief) | Kurs-Check: passt das Geplante zu den sechs Zielen? Kurze a/b-Fragen beantworten | Projekt-Chat |
| Wenn dein Claude-Abo endet | Vorher auf beiden Geräten Backup exportieren; neue Fehler bleiben dann liegen | [Wann du etwas tun musst](wann-du-etwas-tun-musst.md), Abschnitt 6 |

**Nie tun:** die Websitedaten der App löschen (löscht deine Daten); Schlüssel oder Passwörter in Chat, Datei oder Issue schreiben; persönliche Dateien (Backups, Fotos, Belege, GPX, Excel) auf GitHub hochladen; einen PR mit roten Haken mergen (ausser beim Zurücknehmen, wenn es eilt).

---

## 4. Konten und Dienste (ohne Zugangsdaten)

Die ganze Tabelle mit Zweck, Kosten, Fundort und «was fällt aus, wenn es wegfällt» steht in der [Konten-Liste](konten.md). Kurz:

- **GitHub** (Code, Tests, Wächter, die App online): das wichtigste Konto. Ohne Zugang kann niemand mehr etwas ändern.
- **Vercel «packgen»** (Server für die Extras, mit allen Schlüsseln) und **Vercel «packgenerator»** (alte Test-Links).
- **Upstash** (Schliessfach des Servers: Logins, Abgleich).
- **Google Cloud**, **Strava (API)**, **Anthropic**, **Google AI Studio (Gemini)**, **cron-job.org**, **Trello**: je ein Extra.
- **Ohne Konto:** Wetter (Open-Meteo, MeteoSchweiz), Lawinen (SLF), ÖV (transport.opendata.ch), Karten (OpenStreetMap), Seetemperaturen, öffentliche Routen, Router (brouter.de). Fällt einer aus, fehlt nur diese Anzeige.
- **Keine eigene Internet-Adresse:** nichts läuft ab, was bezahlt werden müsste.
- Die Namen der Schlüssel stehen in der Konten-Liste, ihre Werte **nur** in Vercel und in deinem Passwort-Manager. Die privaten Angaben (mit welcher Mail wo, wo die Wiederherstellungs-Codes liegen) stehen im Projektordner unter `private/`, nie im Repository.

**Kosten:** alles gratis ausser dem KI-Guthaben bei Anthropic (mit Deckel pro Monat). Regel: zuerst null Kosten.

---

## 5. Wenn etwas kaputt ist (Kurzfassung)

1. **App startet nicht:** auf der Fehlerseite «Neueste Version laden». Nie «Websitedaten löschen».
2. **Nur ein Extra geht nicht:** in der App neu verbinden; sonst bei Vercel nachsehen, ob «packgen» Ready ist.
3. **Seit der neuen Version ist etwas schlechter:** «zurück NNN» im Chat, oder auf GitHub beim neuesten gemergten PR «Revert».
4. **Mail vom Wächter:** das Issue lesen; mehrere Tage in Folge: im Thread melden.

Genaue Klicks: [Notfall-Handbuch](notfall-handbuch.md).

---

## 6. Wenn Claude nicht mehr da ist: einen anderen Helfer einweisen

Die App ist gewöhnliche Web-Technik (Svelte, Vite, JavaScript). Jede Entwicklerin, jeder Entwickler und andere KIs (zum Beispiel Copilot, ChatGPT, Gemini) können daran arbeiten. Gib dem Helfer diese Dateien:

1. [CLAUDE.md](../CLAUDE.md): die verbindlichen Regeln.
2. [App-Stand](app-stand.md): was die App kann, mit Link zu jeder Funktion.
3. [Stand und Plan](stand-und-plan.md): was offen und geplant ist.
4. [Technik-Handbuch](technik-handbuch.md): wie der Code funktioniert und wie man ihn pflegt.
5. [Notfall-Handbuch](notfall-handbuch.md) und [Konten-Liste](konten.md).

Die Vorlage für die erste Nachricht steht im Notfall-Handbuch, Teil 4. Schlüssel gibst du nie weiter; wenn in Vercel etwas geändert werden muss, klickst du selbst.

---

## 7. Wörter, die oft vorkommen

| Wort | Bedeutung |
|---|---|
| **PR** (Pull Request) | Eine Änderung, die auf GitHub zur Prüfung wartet. Eine Änderung = ein PR |
| **Merge** | Die Änderung wird in die Hauptversion (`main`) übernommen und geht danach online |
| **Label `ok`** | Dein Zeichen am PR; startet die Handy-Tests |
| **Bündler** | Die Claude-Sitzung, die freigegebene PRs nacheinander zusammenführt |
| **Wächter** | Der automatische Prüfer, der alle 3 Stunden den Server fragt und jeden Morgen die echte App prüft |
| **Pages** | GitHub Pages: der Dienst, der die App ausliefert |
| **Vercel «packgen»** | Der kleine Server für die Extras |
| **Dexie / IndexedDB** | Die Datenbank im Browser deines Geräts (dein «Rucksack») |
| **Etappe** | Ein Teil des grossen Durchklickens (1 Heute und Ich bis 6 Querschnitt, 7 Schlussbericht) |
| **Idee A bis G** | Je nach Zusammenhang die Bewegungs-Pakete oder die Ideen von «Neuer Schwung 2»; im Zweifel nach dem Thread fragen |
| **Revert / «zurück»** | Eine Änderung rückgängig machen |

Mehr Wörter: [Aufbau](aufbau.md), Teil 7 «Kleines Wörterbuch».

---

## 8. Wo steht was

| Du willst wissen … | Datei |
|---|---|
| Was die App heute kann | [App-Stand](app-stand.md) |
| Was heute geplant und offen ist | [Stand und Plan](stand-und-plan.md) |
| Was früher geschah und warum | [Verlauf und Entscheide](verlauf-und-entscheide.md) |
| Wie der Code funktioniert, wie man ihn pflegt | [Technik-Handbuch](technik-handbuch.md) |
| Aufbau in einfachen Worten | [Aufbau](aufbau.md) |
| Wenn etwas kaputt ist | [Notfall-Handbuch](notfall-handbuch.md) |
| Alle Konten | [Konten-Liste](konten.md) |
| Die seltenen Fälle (neues Handy, Login abgelaufen, …) | [Wann du etwas tun musst](wann-du-etwas-tun-musst.md) |
| Strava verbinden | [Strava verbinden](strava-verbinden.md) |
| KI-Helfer einrichten | [KI-Helfer einrichten](ki-helfer-einrichten.md) |
| Regeln für jeden Helfer | [CLAUDE.md](../CLAUDE.md) |
