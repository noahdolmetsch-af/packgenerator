# Weg zum Ziel: Schrittart «GPS-Tracker»

PR # · 07.11.2026 · Auftrag: Noah «a» vom 05.11.2026 (Thread «Planen: GPS-Tracker im Weg»)

## Was ist neu
- Nichts Sichtbares. Die Seite «Weg zum Ziel» zeigt die Schrittart automatisch, sobald sie in der Liste `TYPES` steht.
- `src/lib/weg/types/gps.js`: fünf Schritte, damit die Leute zu Hause die Fahrt verfolgen können und der Tracker am Tag nicht ausfällt:
  - **Tracker-Abo vorbereiten** (45 Tage vor dem Start): Frist, Kosten und Konto als Notiz.
  - **Tracker laden** (22 Tage): voll laden, Kabel und Powerbank in die Tasche, am Tag vorher nochmals.
  - **Testfahrt mit dem Tracker** (21 Tage): kurze Fahrt, erscheint der Punkt auf der Karte?
  - **Familie öffnet den Link** (20 Tage): der Link geht an die Leute zu Hause, sie öffnen ihn auf ihrem Handy.
  - **Akku hält 24 Stunden** (14 Tage): einen Tag und eine Nacht laufen lassen.
- **Login und Passwort speichert die App nie.** In der Notiz steht nur der Hinweis «Zugang liegt im Passwortmanager». `looksLikeSecret(text)` erkennt Notizen, die nach Login oder Passwort aussehen («Passwort: …», «pw=…», «Das Passwort ist …»), damit die Seite vor dem Speichern warnen kann.
- Der Streifen «x von 5 geregelt» zählt diese fünf Schritte (`typeProgress(goal, 'gps', …)`).
- Eine Zeile in `src/lib/weg/types/index.js`, deutsche Texte in `src/lib/i18n/de/weg-gps.js`, Tests in `tests/weg-gps.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche)

## Selbst entschieden
- Alle fünf Schritte werden von Hand abgehakt: die App weiss nicht, ob ein Tracker funktioniert (`auto` antwortet «unbekannt»).
- Vorgeschlagen werden die Schritte für Ziele der Art «Rennen» und «Tour»; ein freies Ziel bekommt keine (von Hand hinzufügen geht). Bei einer Tour ohne Rennen ist ein Tracker für die Familie genauso sinnvoll.
- Links: Abo und Laden zeigen auf das Rennen (Links und Papierkram) bzw. «Vor der Abfahrt» ohne Rennen; Testfahrt und Akku auf die Live-Karte; «Familie öffnet den Link» auf «Vor der Abfahrt» (Kontakte).
- Tage vor dem Start (45, 22, 21, 20, 14) angelehnt an den Papierkram im Rennen («Tracker mieten oder laden» 14 Tage). Alle änderbar, jeder Schritt hat einen eigenen Tag, Namen, Löschen und Ordnen wie überall in `weg.js`.
- Der bestehende Test `tests/weg-rennplanung.test.js` prüft die Registry jetzt mit «enthält Rennplanung» statt mit der ganzen Liste, damit jede neue Schrittart keinen fremden Test anfassen muss. Geprüft wird weiter dasselbe.
- Kein Eintrag in `features.js`, keine «Was ist neu»-Datei: es gibt noch keine Seite. Die Fertig-Regel kommt mit der Seite «Weg zum Ziel».
- Offen für die Seite: das Notizfeld des Abo-Schritts soll `looksLikeSecret` benutzen und warnen.

## Entscheide (für decisions.md)
- 05.11.2026: GPS-Tracker im Weg = fünf Schritte, Zugang nie in der App (Noah «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Weg zum Ziel»: Schrittart «GPS-Tracker» gebaut, sichtbar mit der Seite. `docs/vorhaben.md` und `docs/roadmap.md` ändern sich nicht.

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).
