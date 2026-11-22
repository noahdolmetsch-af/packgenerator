# Fehler-Melder: die App merkt sich ihre Fehler, nur auf dem Gerät

Auftrag: Noah «2, 1, 4», Schritt 1, und «a» (nur auf dem Gerät), Thread «Prüfungen so einrichten, dass main grün bleibt»

## Was ist neu
- **Die App merkt sich Fehler still.** Fängt sie einen Fehler ab (die Fehlerkarte «Das ist hier schiefgegangen» einer Seite) oder entgeht ihr einer (ein Programmfehler im Hintergrund, ein nicht abgefangenes Versprechen), schreibt sie eine Zeile in den Speicher des Browsers (`localStorage`, Schlüssel `pg.errors`): Fehlertext, Seite (die Adresse ohne Parameter), Zeit, Version. Höchstens 30, die neuesten bleiben. Derselbe Fehler auf derselben Seite zählt innerhalb einer Minute nur einmal (eine Schleife füllt die Liste nicht).
- **Karte «Gemerkte Fehler» ganz unten in Ich › Daten und Backup** (unter dem Tempo-Messer): «Keine Fehler gemerkt» oder «N Fehler gemerkt» mit den letzten fünf (Zeit, Seite, Text), «Fehler kopieren» (eine Zeile pro Fehler, neueste zuerst, zum Schicken) und «Liste leeren».
- **Nichts verlässt das Gerät.** Kein Server, kein `api/`, kein Backup, kein Abgleich. Die Zeilen stehen nur in diesem Browser.
- **Was nicht drinsteht:** Namen, Werte, deine Einträge. Lange Texte in Anführungszeichen (könnten von dir getippt sein) werden zu «…», Web-Adressen zu Dateinamen, der Text ist auf 200 Zeichen gekürzt. Offline-Meldungen («Failed to fetch»), abgebrochene Anfragen und die harmlose Warnung «ResizeObserver loop» zählen nicht als Fehler.

## Was fällt weg oder rutscht tiefer
- Nichts. Neue Karte, nichts ersetzt.

## Selbst entschieden
- **Übergang:** Die Karte ist eine Übergangszeile (Marke `UEBERGANG-FEHLERZEILE`: `src/lib/fehler/FehlerZeile.svelte`, ihr Import und ihre Verwendung in `DataPanel.svelte`, `src/lib/i18n/de/fehlermelder.js`). Der Thread «Neue Verbesserungen finden» liest die Einträge mit `takeErrors()` in sein Logbuch (L1b) und zeigt sie dort als Art «Fehler». Dann fällt die Karte weg. Abgestimmt: es gibt nur eine Liste, keine eigene Tabelle von mir.
- **`localStorage` statt Datenbank:** funktioniert auch, wenn die Datenbank selbst kaputt ist, braucht keine Änderung des Schemas oder des Backup-Formats und ist (wie der Schalter des Tempo-Messers) nur dieses Gerät.
- **Kein «Rückgängig» bei «Liste leeren»:** Es sind die App-eigenen Notizen, keine Daten von dir (Regel «alles löschbar mit Undo» gilt für deine Daten).
- **Nicht in `features.js` und nicht in `app-stand.md`:** Werkzeug für uns, keine Funktion für den Alltag; wie der Tempo-Messer. Die Fertig-Regel gilt damit nicht als neue Funktion.
- Einzelfreigabe, weil es Speicher betrifft (Noah: «wenn es api/ oder Speicher braucht, Einzelfreigabe»). Es ändert aber weder Dexie noch Backup noch `api/`.

## Entscheide (für decisions.md)
- 21.11.2026: Fehler-Melder nur auf dem Gerät, ohne Server (Noah «a»). Eine Fehlerliste: Logbuch (Art «Fehler»), bis dahin die Übergangskarte.

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «Eine App, die mich im Alltag unterstützt». Noah «2, 1, 4»: Rundgang (#1353), Fehler-Melder (dieser PR), danach Wackel-Test-Liste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup, ganz nach unten: «Gemerkte Fehler». Meist steht dort «Keine Fehler gemerkt».
2. Benutze die App ein paar Tage. Stehen dort Fehler, tippe «Fehler kopieren» und schick sie mir.
