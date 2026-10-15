# 3. Gebaut, wartet auf Freigabe

Stand 14.10.2026, ca. 10:45 UTC. Zurück zur [Übersicht](README.md).

Hier steht, was **fertig gebaut** ist, aber **noch nicht online**. Es ist in einem offenen Pull Request (PR) auf GitHub oder als lokaler Zweig einer Claude-Sitzung. Online geht es erst, wenn Noah den PR merged.

## Die Reihenfolge

Die Pakete bauen aufeinander auf und berühren teils dieselben Dateien. Darum gilt diese Reihenfolge:

| Schritt | Version | Was | Wo |
|---|---|---|---|
| 1 | 0.131.3 | Kamera-Knopf für Belege | PR #164 (einzeln von Noah freigegeben) |
| 2 | 0.132.0 | Tagespaket 13.+14.10. | PR #151 |
| 3 | 0.133.0 | Design-Refresh: «Wi gaht's?», Seiten neu, Kacheln antippbar | Zweig `claude/design-refresh-0133`, PR folgt nach Schritt 2 |
| 4 | 0.134.0 | Standard-Paket und «Listen und Typen» | PR #159 |
| 5 | 0.135.0 | Meditation zentral mit Timer | Zweig `claude/project-thread-j2uxcs`, PR folgt |
| 6 | 0.136.0 | Texte im Flow («Gut zu wissen», «Das kann die App hier») | lokal, PR folgt |
| danach | offen | Training mit Strava, Rechnungen, Inspiration, Merken | lokal, siehe unten |

Die Nummern ab 0.133.0 sind Arbeitsnummern. Wenn `main` weiterrückt, wird umnummeriert.

## Schritt 1: Kamera-Knopf (PR #164, 0.131.3)

Wo immer ein Beleg erfasst wird (Werkstattbesuch, Neu › Werkstattbesuch, Eingang › als Rechnung ablegen), öffnet ein Knopf am Handy direkt die Kamera; daneben «Galerie». Am Computer ein Knopf «Foto wählen». Bilder K1–K4 freigegeben am 14.10. CI grün.

## Schritt 2: Tagespaket 0.132.0 (PR #151)

Bündelt sieben einzelne PRs (#150, #152 bis #157) und zwei lokale Arbeiten in einem Release:

| Teil | Inhalt |
|---|---|
| Tages-Check T1–T4 | Morgen- und Abend-Check, Ring «Deine Balance», «Deine 15 Fragen». Ersetzt den alten Check-Dialog unter Aktiv. |
| Aktiv ausweiten AK1–AK3 (#150) | Wochenansicht, Seite Erholung, Sporttasche. |
| Feinschliff (#152) | Werkstattbesuch aus «Neu» speichert einen echten Besuch; drei Tour-Zustände mit Filter (siehe Regel in [Dokument 4](04-entscheidungen.md)); ruhiges Update-Band, Fehlerseite, bekannte Werte vorausgefüllt. |
| Werte überall (#153) | Höhenmeter und Puls neben den Kilometern, Jahresziele. |
| Velo-Setup UC3-1–UC3-3 (#155) | Fünfter Velo-Reiter «Setup» mit eigenen Fotos (nur auf dem Gerät), Gesamtgewicht, Taschen-Plan, Setup-Logbuch. |
| Kluge Suche (#154) | Findet trotz Tippfehlern und ähnlicher Wörter, kurze Filter wie «Material unter 200 g», «Für Claude kopieren», Chrome-KI am Computer, Aktionen «jetzt erledigen» oben. Ohne Mockups, auf Noahs Wunsch. |
| Kleine Apps + Handbuch (#157) | Meditation, Packliste und Velopflege als eigene kleine Apps mit eigenem Symbol auf dem Startbildschirm (gleiche Daten wie die grosse App). Benutzerhandbuch `docs/handbuch.md` mit einem Eintrag pro Funktion. |
| App-Wartung | Sicherung vor jedem Update, monatliche Wartungszeile auf Heute, Prüfung der Gratis-Grenzen und Links. Ohne Mockups, auf Noahs Wunsch. |
| Bedienung | Hoher Kontrast (aus), Vibration als Rückmeldung, Nachtruhe, Ladeplatzhalter, Vorlese-Knopf, wählbare Startseite. |
| Bezahlen (#156) | Erklärseite unter Ich › Bezahlen. Die Stripe-Grundlage (Testmodus) ist unsichtbar. |
| Doku «Links nach aussen» | Spezifikation DG-X1 bis DG-X16 (welche externen Seiten wo verlinkt werden), noch nicht gebaut. |

Was dabei wegfällt oder tiefer rutscht, steht im PR selbst (alter Check-Dialog weg, Langdruck-Tipp auf Heute später, Velo-Reiter etwas kleiner beschriftet).

Ausserdem fürs nächste Tagespaket gemeldet: **#160** (Doku Release-Analyse und neue PR-Regel), **#161** (leere App ohne Beispiel-Taschen) und die lokale Arbeit **Inspiration**.

## Schritt 3: Design-Refresh 0.133.0

Liegt auf dem Zweig `claude/design-refresh-0133`. Enthält die Bildrunden, die Noah am 13. und 14.10. freigegeben hat:

- **Seiten neu SN1–SN7:** die bisher nie neu gezeichneten Seiten (Unterwegs, Rückblick/Logbuch/Tempo, Vorlagen und Bausteine, Vergangene Touren, Import prüfen und Favoriten, Funktionen, Velo-/Taschen-/Teil-Fenster).
- **Erweiterungen:** SN2 plus/extra (Leistung, Pulszonen, Leistungskurve, «ähnliche Tour»), SN3 plus (Bausteine in Gruppen), SN4 plus und SN4g–SN4i (Touren-Seite mit Packmodus-Band, Filtern, Kacheln «Gute Tage», «Offene Rückblicke», «Karte aller Touren»), SN5 plus, SN6 plus (Funktionen-Seite mit «Passt gerade», Top 5, «Neu seit letztem Besuch»).
- **Seiten-Kacheln SK1–SKX5:** bis 7 Kacheln pro Seite, nach Nutzung sortiert, Links nach aussen an der Sache.
- **komoot SN1b–SN1d:** «Tour aus komoot» und «In komoot öffnen».
- **Deine Abfragen AB1–AB6 und «Wi gaht's?»:** eigene Tagesfragen statt fester Fragen, 50 lustige Fragen (31 an), ein Verlauf und eine Auswertung. Die Seite heisst «Wi gaht's?»; sie übernimmt den Ring «Deine Balance», feste Runden 07:00 und 20:30 und die 7-Tage-Werte. Der alte Tages-Check aus 0.132.0 geht dafür.
- **Begrüssung HG1:** «Hoi …, wi gaht's dir hüt und was häsch vor?» oben auf Heute, je nach Tageszeit (Morge, Tag, Abig, Nacht). Der Name steht nur in den Einstellungen auf dem Gerät.
- **Bedienung FE1, FE13, FE14, FE16** (Daumenzone u. a.), ohne Bilder auf Noahs Wunsch.
- **Kacheln antippbar KT** (freigegeben 14.10. 10:31): Pfeil und «Öffnen» auf Kacheln, ••• auf Aktivitäten, einmalige Einführung, Hover-Effekt am Computer.

## Schritt 4: Standard-Paket und Listen (PR #159, 0.134.0)

- **Standard-Paket:** alle Grundlisten an einem neutralen Ort (`src/lib/standard.js`), damit es später ein persönliches und ein Standard-Profil geben kann.
- **Listen und Typen LI1–LI4:** unter Ich › Die App lassen sich die Material-Kategorien selbst ändern, umsortieren (Pfeile) und löschen. Ein Link «Liste bearbeiten» steht dort, wo die Liste gebraucht wird. Weitere Listen folgen einzeln.

## Schritt 5: Meditation zentral (0.135.0)

Bilder ME1–ME3 und Z1–Z5 freigegeben am 13.10. Meditation wird erster Reiter in Aktiv, Name überall «Meditation» (statt «Kissenzeit»), eigener Rückblick, Timer (zählt hoch, Zifferblatt wählbar, Klangschale am Ende, Log mit Notiz). Die Karte oben auf Heute folgt, sobald 0.133.0 online ist. Offen: Reihenfolge an einem Tourtag (Tour-Karte oder Meditation oben).

## Schritt 6: Texte im Flow (0.136.0)

Bilder IF1–IF3 freigegeben am 14.10. Pro Seite eine Tippzeile «Gut zu wissen», ein aufklappbarer Teil «Das kann die App hier» und Kacheln «Weiter» mit Links; englische Seiten mit Übersetzungslink. Zuerst für Aktiv, Sportarten später.

## Lokal gebaut, noch ohne PR

| Arbeit | Stand | Wartet auf |
|---|---|---|
| Training TR1–TR4 (Strava-Kachel «Letzte Aktivität», Aktiv › Training, Pulszonen, Wochenplan, Leistungsfelder) | gebaut, Datenbank-Version 10 geplant | Tagespaket auf `main`; Bildfreigabe TR5–TR7 für weitere Analysen |
| Rechnungen (Bezahlfunktion Schritt 1 und 2) | gebaut: QR-Rechnung, TWINT privat, «Geld erhalten», Kontoauszug abgleichen, Sonntags-Erinnerung, «Zu zahlen» für erhaltene Rechnungen, Zahl-Link für Kunden | #156 auf `main`; Karte auf Heute nach 0.133.0 |
| Inspiration UC2-1, UC2-2, UC2-4 | gebaut: eigener Ort für eigene Links, App erkennt den Typ (Video, Route, Hör-Tipp, Produkt, Rennen), Notiz wird Packregel | nächstes Tagespaket |
| Merken (To-dos) PL1–PL3 | erster Teil gebaut | Bestätigung der Fragen 2 bis 5; Karte auf Heute nach 0.133.0 |

## Hinweis zur Datenbank

Mehrere Pakete erweitern die Datenbank im Browser (Dexie). Die Versionsnummern sind vergeben: 9 = «Deine Abfragen» (0.133.0), 10 = Training mit Strava, 11 = Meditations-Timer. Wer später kommt, baut auf der höheren Nummer auf.
