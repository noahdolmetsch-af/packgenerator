# Termine wie in Google

PR folgt · 28.10.2026 · Auftrag: Noah «1a 2a 3b» (Thread «Google-Kalender 1:1 in der App steuern»)

## Was ist neu
- Das Termin-Formular unter Ich › Termine und Aufgaben hat jetzt: Beschreibung, Erinnerungen (Benachrichtigung oder E-Mail, Minuten bis Wochen vorher, bis zu 5, oder die Google-Standardwerte), Zeitzone, «Anzeigen als» (Beschäftigt/Frei) und «Wer sieht es» (Standard/Öffentlich/Privat).
- Zwei neue Knöpfe an jedem Termin: «Duplizieren» und «In anderen Kalender kopieren». Beide öffnen das ausgefüllte Formular; erst «In Google eintragen» schickt etwas weg.
- Die Beschreibung kommt als einfacher Text von Google (Google speichert kleines HTML). Sie geht nur zurück, wenn du sie änderst, damit Formatierung in Google nicht verloren geht.
- Server: `eventBody` und `eventRow` in `api/_lib/googleplan.js` kennen Erinnerungen, Verfügbarkeit, Sichtbarkeit, Zeitzone, Beschreibung bis 4000 Zeichen. Kein neuer Server-Schritt, keine neue Google-Erlaubnis.

## Was fällt weg oder rutscht tiefer
- nichts. Das Formular wird länger (kein Seitenlängen-Limit, Regel 6).

## Selbst entschieden
- Gäste und Einladungen sind nicht dabei (Noah «3b»).
- Eine Änderung an einem Termin einer Wiederholung gilt nur für diesen einen; das Formular sagt es. «Alle folgenden» kommt mit PR 3.
- Mehrtägige Termine mit Uhrzeit bleiben wie bisher auf einen Tag begrenzt im Formular.
- Zeitzonen: eine kurze Liste (Zürich zuerst) plus die eigene Zone des Termins.

## Entscheide (für decisions.md)
- 28.10.2026: Google-Kalender 1:1: Option A, Google bleibt die Wahrheit, die App bedient alles; Reihenfolge Editor, Wochenraster, Wiederholung und Farbe; ohne Gäste (Noah «1a 2a 3b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Kalender 1:1: Schritt 1 von 3 (Editor); danach Wochenraster wie bei Google.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Termine und Aufgaben › «Termin eintragen»: Erinnerung «1 Tag» hinzufügen, Beschreibung schreiben, eintragen.
2. In Google denselben Termin öffnen: Erinnerung und Beschreibung stehen da.
3. In der App den Termin öffnen, «Duplizieren» tippen: Formular ist ausgefüllt, nichts ist weg, bis «In Google eintragen».
