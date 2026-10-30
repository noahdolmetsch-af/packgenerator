# Mini-Umfrage

PR #… · 28.10.2026 · Auftrag: Noah «1b 2a 3a, 4: 1, 2, 4, 5, 7, 9, 10, 5a» (Thread «Mini-Tools zum Teilen mit Leuten planen»), Idee 2

## Was ist neu
- Zweites Mini-Tool **Mini-Umfrage** unter Ich › Mini-Tools (`#/me/mini/umfrage`).
- Start mit einer Vorlage («Wohin geht die Tour?», «Wie war die Tour?») oder leer. Bis 10 Fragen: eine Antwort, mehrere Antworten, Skala 1 bis 5, Ja oder Nein, kurzer Text. Reihenfolge mit Pfeilen und Ziehen, alles änderbar. Auf Wunsch anonym.
- Die Gefragten öffnen den Link im Browser, ohne App und ohne Konto, und antworten Frage für Frage mit «Weiter» und «Zurück». Jede Frage kann ausgelassen werden; die Antwort ist später änderbar.
- Ergebnis: oben eine Zusammenfassung in Sätzen (ohne KI gezählt), darunter pro Frage Balken, Schnitt oder die Textantworten mit den häufigsten Wörtern. «Ergebnis an die Gruppe schicken» (WhatsApp).
- Umbenennen, beenden und löschen (mit Rückgängig) wie bei «Termin finden».

## Was fällt weg oder rutscht tiefer
- nichts. Ich › Mini-Tools hat eine Werkzeug-Zeile mehr.

## Selbst entschieden
- Gleicher verschlüsselter Speicher wie «Termin finden» (`/api/sync?action=mini`), keine Server-Änderung. Die Antwort heisst intern `r`, weil `a` schon die Antwort-Nummer ist.
- Anonym: das Namensfeld fehlt bei den Gefragten, und die App speichert keinen Namen, auch wenn einer mitkäme.
- Häufige Wörter: nur Wörter ab 3 Buchstaben, die mindestens zwei Personen schreiben, ohne Füllwörter (und, keine, sehr …).
- Standard 14 Tage offen (wählbar 7/14/30/60).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Mini-Tools: 1 Termin finden, 2 Mini-Umfrage gebaut; als nächstes 4 Anmeldeliste, 5 Spontan-Einladung, 7 Essen, 9 Auslosen, 10 Abfahrtszeit (je ein PR).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Mini-Tools › Mini-Umfrage: «Wohin geht die Tour?» antippen, eine Frage ändern, «Link machen».
2. Link am Handy (oder in einem privaten Fenster) öffnen: Namen schreiben, mit «Weiter» durch die Fragen, «Antwort senden».
3. Zurück in der App «Neue Antworten holen»: oben steht die Zusammenfassung, darunter die Balken.
