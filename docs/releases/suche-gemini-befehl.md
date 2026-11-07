# Freie Sätze in der Suche

PR (Nummer folgt) · 07.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5a» (Thread «Erklären: mit der App sprechen und Befehle ausführen»), Etappe 2 von 2 · ändert `api/helper.js` (Einzelfreigabe, danach den Vercel-Server «packgen» prüfen)

## Was ist neu
- Ein Satz, den die festen Regeln nicht kennen, kann Gemini (gratis) in Aktionen übersetzen. In der Suche erscheint «Gemini verstehen lassen» (Satz ab drei Wörtern, keine Frage). Gesprochen (Mikrofon) läuft die Übersetzung von selbst, wenn «Gemini beantwortet gesprochene Fragen» an ist.
- Immer zuerst die Vorschau «Ich würde das tun», mit Haken pro Aktion und «OK» / «Verwerfen» (Noah 3a). Erst nach «OK» wird geschrieben, mit dem gleichen Code und dem gleichen «Rückgängig» wie bei den Regeln.
- Erlaubte Aktionen (feste Liste, nichts Löschendes): Liste mit Punkten, Aufgabe (mit Tag), Notiz, Messwert (Gewicht, Ruhepuls, Schlaf), Velopflege (Kette, Dichtmilch, Waschen; bei mehreren Velos fragt die Vorschau «Welches Velo?»), Tour planen und Wetter (öffnen nur ihre Seite).
- Zu Gemini gehen nur der Satz, der heutige Tag und die Namen der Velos und Touren (Noah 4a). Keine Notizen, Fotos, Gesundheitswerte, Backups.
- Server: `api/helper.js`, Aufgabe «gemini» mit `mode: 'command'` (kein neues File unter `api/`). Gemini antwortet in festem JSON; `commandText()` behält nur erlaubte Arten und Felder, begrenzt Längen und höchstens 8 Aktionen. Die App prüft jeden Wert noch einmal (`fromAi` in `src/lib/suche/befehl.js`). Die Tagesgrenze von Gemini (200) gilt weiter, ein Satz kostet einen Aufruf.
- Ich › Suche: neuer Schalter «Gemini versteht Sätze» (an), ohne Helfer-Code erscheint nichts.

## Was fällt weg oder rutscht tiefer
- nichts. Während Gemini einen Satz übersetzt oder ein Vorschlag offen ist, zeigt die Suche nicht zusätzlich «Die App antwortet», «Als neues Material erfassen» und die Gemini-Antwort auf Fragen.

## Selbst entschieden
- Als «Befehl» zählt ein Satz ohne «?» und ohne Fragewort am Anfang (wie, was, wann, wo …), mit mindestens drei Wörtern. Fragen bleiben bei den bisherigen Antworten.
- Geplant war (Antwort 3a): Regel-Sätze sofort mit Rückgängig, Gemini-Sätze erst mit Vorschau. So ist es gebaut.
- Eine Aufgabe ohne Tag wird eine einfache Aufgabe in Merken (ohne Erinnerung); mit Tag kommt die Erinnerung um 08:00 wie bei «Erinnere mich».
- Ein vergangener Tag zählt nicht als Erinnerungstag (wird eine Aufgabe ohne Tag).
- Reihenfolge der weiteren Aktionen (Antwort 5a): Packliste ergänzen, Velo anlegen, Tour verschieben, je ein eigener PR. Diese sind hier noch nicht dabei.
- Fertig-Regel: keine neue Seite; Beispiel in den Prüfschritten und im Sprachsuche-Eintrag von `app-stand.md`.

## Entscheide (für decisions.md)
- 07.11.2026: Gemini übersetzt nur in eine feste Liste von Aktionen und führt nie selbst etwas aus; erst Vorschau, dann «OK» (Noah 3a). Zu Gemini gehen Satz, Tag und Namen von Velos und Touren (4a). Nur Gemini, kein Claude für Befehle (2a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Sprachbefehle: Etappe 2 gebaut. Offen: Packliste ergänzen, Velo anlegen, Tour verschieben (je eigener PR), dann Hin-und-her-Sprechen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Der Helfer-Code ist in Ich › KI-Helfer gespeichert. Oben in die Suche tippen: «Trag das Reifenpumpen auf Freitag ein und merk dir, dass die Bremse quietscht».
2. «Gemini verstehen lassen» antippen: «Ich würde das tun» zeigt zwei Aktionen mit Haken, noch ist nichts geschrieben.
3. «OK» antippen: beides ist eingetragen, «Rückgängig» nimmt es zurück.
4. Ich › Suche: der Schalter «Gemini versteht Sätze» schaltet es aus.
