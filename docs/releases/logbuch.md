# Verbesserungs-Logbuch, Schritt 1: Speicher und Seite

21.11.2026 · Auftrag: Noah «freigabe» (Entwurf: https://claude.ai/artifact/V1T1DcxH66ej3EJrvRFHSt, Antworten «1a 2b 3a 4a 5a»; Thread «Neue Verbesserungen finden», Umsetzungsauftrag L1 in `notes/neue-verbesserungen-2026-11-21/umsetzungsauftrag-logbuch.md`)

## Was ist neu
- Neue Seite **Verbesserungs-Logbuch** (`#/me/logbuch`), erreichbar über eine Zeile auf Ich. Man hält fest, was in der App stört oder fehlt: Art (13 in vier Gruppen: Falsch, Verständlich, Aufbau, Neu), Dringlichkeit «Stört jetzt / Irgendwann», ein Satz, Seite und Block.
- Liste mit Filter nach Gruppe, Stand (Offen, Bild-Entwurf gemacht, Erledigt, Notiert), «Erledigt» mit einem Tipp, ändern und löschen (mit Frage und Rückgängig).
- Neue Tabelle `logbuch` (Dexie Version 20). Sie ist in jedem Backup und in «Sicherung prüfen», aber **nicht** im automatischen Geräteabgleich.
- Für den stillen Fehler-Melder (Thread «Prüfungen»): `addAutoError()` legt einen abgefangenen Fehler als einen Eintrag der Art «Fehler» an, derselbe Fehler auf derselben Seite zählt nur hoch, höchstens 50 solche Einträge. Angeschlossen wird er in einem eigenen PR, wenn das Auffang-Modul gemergt ist.
- Schritt 2 (Knopf «Verbessern», Block antippen), 3 (Foto der Seite) und 4 («Auftrag kopieren», «Bilder speichern») folgen als eigene PRs.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- **Nicht im Geräteabgleich:** die Einträge und später ihre Fotos bleiben auf dem Gerät, wo sie entstanden sind (Fotos sind gross, die Notizen gehören zum Gerät). Das heisst: Einträge vom Handy sieht man am Computer nur über ein Backup. Wenn Noah das anders will, ist es eine Zeile in `syncLocal` (`src/lib/db.js`).
- Der neue Eintrag hat in diesem Schritt noch kein Foto und keinen Knopf auf jeder Seite; Seite und Block werden von Hand eingetragen.
- Die Regel «was zuerst ein Bild bekommt» (Noah «3a») steht als `routeOf` im Code und als Text auf der Seite («Was passiert damit?»), noch ohne Automatik.
- Felder `source` ('user' oder 'auto') und `count` sind schon in der Tabelle, damit der Fehler-Melder keine Schemaänderung braucht.
- Fertig-Regel: (1) `f.logbuch` in `featreg/logbuch.js` mit So geht's und Beispiel, (2) Absprung: Zeile auf Ich, (3) «Gut zu wissen»: nicht gebaut, die Seite steht nicht in `ON_PAGES`, (4) leerer Zustand siehe Seite, (5) nächster Schritt: «Was passiert damit?», (6) Zeile im App-Stand.
- Namen: «Verbesserungs-Logbuch» in `docs/namen.md` Nr. 30 (Arbeitsname).

## Entscheide (für decisions.md)
- Logbuch statt Merker: 13 Arten in 4 Gruppen, Dringlichkeit, Foto immer dabei (kommt in Schritt 3), Knopf «Verbessern» auf jeder Seite, ausblendbar (Noah 21.11.2026).
- Kleine Dinge (Text, Hinweis, Erklärung, Fehler, Zahl falsch, Zu langsam) gehen direkt als kleiner PR mit Vorher-Nachher-Bild; Anordnung, Layout, Bedienung, Weg damit, Finde ich nicht, Fehlt / Idee und alles mit mehreren Seiten zuerst als Bild-Entwurf; «Gut so» ist nur eine Notiz.

## Stand im Plan (roadmap.md / vorhaben.md)
- Verbesserungs-Logbuch: Schritt 1 von 4 gebaut (Ziel 1 «Eine App, die mich im Alltag unterstützt»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › «Verbesserungs-Logbuch» › «Neuer Eintrag»: «Text ändern» wählen, einen Satz schreiben, «Speichern»: der Eintrag steht in der Liste.
2. «Erledigt» tippen: der Eintrag wird blass und der Zähler oben sinkt. «Ändern» › «Löschen»: nach der Frage kommt «Rückgängig».
3. Ich › Daten und Backup: Backup machen und «Sicherung prüfen»: die Datei nennt die Einträge des Logbuchs.
