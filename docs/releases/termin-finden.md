# Termin finden

PR #… · 28.10.2026 · Auftrag: Noah «1b 2a 3a, 4: 1, 2, 4, 5, 7, 9, 10, 5a» (Thread «Mini-Tools zum Teilen mit Leuten planen»)

## Was ist neu
- Neue Seite **Ich › Mini-Tools** (`#/me/mini`), auch verlinkt aus Ich › Mit Freunden.
- Erstes Mini-Tool **Termin finden** (wie Doodle): Titel, 2 bis 8 Tage wählen (belegte Tage aus Touren und Kalender grau), auf Wunsch eine Uhrzeit, «Link machen».
- Die Gefragten öffnen den Link im Browser (`#/mitmachen/<id>/<schlüssel>`), ohne App und ohne Konto, und tippen pro Tag «Geht», «Vielleicht» oder «Geht nicht». Sie können ihre Antwort später ändern.
- Die Antworten kommen von selbst zurück («Neue Antworten holen»). Bester Tag oben, Balken, Tabelle «Wer kann wann», eigene Zeile «Du».
- Am besten Tag: «Tour an diesem Tag planen», «In den Kalender» (.ics-Datei), «Ergebnis an die Gruppe schicken» (WhatsApp).
- Frage umbenennen, beenden (Server löscht alles, Ergebnis bleibt) oder löschen (mit Rückgängig).

## Was fällt weg oder rutscht tiefer
- nichts. Ich › Meine Sachen hat eine Zeile mehr (unter «Mit Freunden»), Mit Freunden eine Linkzeile über den Reitern.

## Selbst entschieden
- Server-Speicher (Antwort 1b) im bestehenden `/api/sync` als `?action=mini` (`api/_lib/mini.js`), keine neue Server-Datei; eigene Tagesgrenze `mini: 600`.
- Verschlüsselung: Frage mit Schlüssel im Link (wie Reise-Spur). Jede Antwort wird auf dem Gerät der antwortenden Person nur für den öffentlichen Schlüssel des Fragenden verschlossen (ECDH P-256 + AES-GCM). Andere mit dem Link sehen die Antworten nicht; der Server kann nichts lesen.
- Standard 30 Tage offen, wählbar 7/14/30/60; höchstens 60 Antworten pro Frage.
- Auszählen ohne KI (Antwort 3a): «Geht» zählt 1, «Vielleicht» ½; bei Gleichstand mehr «Geht», dann der frühere Tag.
- «In den Kalender» als .ics-Datei statt direkt in Google (geht mit jedem Kalender, kein neues Konto-Recht).
- «Tour planen» legt eine Tour-Idee mit dem ersten Velo an und öffnet Packen.

## Entscheide (für decisions.md)
- 28.10.2026: Mini-Tools als eigene Seite unter Ich, Antworten über kleinen verschlüsselten Speicher, Auszählen ohne KI (Noah «1b 2a 3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Mini-Tools: 1 Termin finden gebaut; als nächstes 2 Mini-Umfrage, dann 4 Anmeldeliste, 5 Spontan-Einladung, 7 Essen, 9 Auslosen, 10 Abfahrtszeit (je ein PR).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Mini-Tools › Termin finden: Titel schreiben, drei Tage antippen, «Link machen».
2. Link kopieren und am Handy (oder in einem privaten Fenster) öffnen: Namen schreiben, pro Tag antworten, «Antwort senden».
3. Zurück in der App «Neue Antworten holen»: der Name steht unter «Wer kann wann», oben steht der beste Tag.
