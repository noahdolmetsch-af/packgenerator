# Anmeldeliste mit Warteliste

PR #… · 28.10.2026 · Auftrag: Noah «1b 2a 3a, 4: 1, 2, 4, 5, 7, 9, 10, 5a» (Thread «Mini-Tools zum Teilen mit Leuten planen»), Idee 4

## Was ist neu
- Drittes Mini-Tool **Anmeldeliste** unter Ich › Mini-Tools (`#/me/mini/liste`): Titel, auf Wunsch Tag, Zeit und Ort, Anzahl Plätze (1 bis 50).
- Die Gefragten sehen im Browser, wie viele Plätze noch frei sind, schreiben ihren Namen und tippen «Ich bin dabei» (oder «Auf die Warteliste», wenn alles belegt ist). Danach steht dort ihr Platz oder ihr Platz auf der Warteliste. «Abmelden» gibt den Platz frei; die nächste Person rückt von selbst nach.
- In der App: «x von y Plätzen belegt», die Liste «Angemeldet» und die «Warteliste» in der Reihenfolge der Anmeldung, «Liste an die Gruppe schicken» (WhatsApp, nur Namen).
- Jemanden von der Liste nehmen, mit Rückgängig. Umbenennen, beenden und löschen wie bei den anderen Mini-Tools.

## Was fällt weg oder rutscht tiefer
- nichts. Unter Mini-Tools gibt es eine Werkzeug-Zeile mehr.

## Selbst entschieden
- Reihenfolge = Zeitpunkt der ersten Anmeldung. Der Server merkt sich diese Zeit (`t0`); eine geänderte Anmeldung behält ihren Platz.
- Der Server zählt nur Plätze: Er gibt die Anzahl Anmeldungen und den eigenen Platz zurück, liest aber keine Namen (die bleiben nur für dich verschlossen).
- Neue Server-Schritte im bestehenden `/api/sync?action=mini`: `place` (mein Platz), `leave` (abmelden), `drop` (du nimmst jemanden von der Liste; bleibt gespeichert, damit Rückgängig geht). Keine neue Server-Datei.
- Eine Anmeldung ist eine Person; Begleitung schreibt man in die Notiz.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Mini-Tools: 1, 2 und 4 gebaut; als nächstes 5 Spontan-Einladung, 7 Essen, 9 Auslosen, 10 Abfahrtszeit (je ein PR).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Mini-Tools › Anmeldeliste: Titel schreiben, 2 Plätze, «Link machen».
2. Link in drei privaten Fenstern öffnen und dreimal anmelden: die dritte Anmeldung steht auf der Warteliste.
3. Im ersten Fenster «Abmelden»: im dritten Fenster nach dem Neuladen «Du bist dabei». In der App zeigt «Neue Antworten holen» das an.
