# Aufgeräumt nach dem Ausbau der KI

PR folgt · 22.11.2026 · Auftrag: Noah «a» (Thread «Entfernen aller KI-Funktionen», Schritt 9)

## Was ist neu
- Nichts Sichtbares. Alte deutsche Texte des KI-Helfers, der Gemini-Antworten und ihrer Fehlermeldungen sind aus `src/lib/i18n/de/*.js` entfernt (rund 150 Zeilen, nur solche, die im Code nirgends mehr vorkommen; `helfer.js` behält neun kurze Wörter, die andere Stellen noch brauchen).
- Doku: `docs/aufbau.md` und `docs/vorhaben.md` nennen den KI-Helfer nicht mehr als Teil des Servers; `docs/konten.md` sagt, dass die alten KI-Schlüssel in Vercel liegen bleiben.
- Entscheide in `docs/decisions/ki-weg-aufraeumen.md`: «Weiter fragen bei …» und «Mit Claude besprechen» bleiben, «KI im Gerät» bleibt, die Schlüssel in Vercel bleiben.

## Was fällt weg oder rutscht tiefer
- Nichts. Es gibt keine Anzeige mehr, die einen der entfernten Texte brauchte.

## Selbst entschieden
- Entfernt habe ich nur deutsche Einträge, deren englischer Text im ganzen Code (Quellcode, Fixtures, Server, Skripte) nicht mehr vorkommt. Im Zweifel blieb ein Eintrag stehen.
- Die vielen anderen, schon früher verwaisten deutschen Einträge (rund 1 450, nicht KI-bezogen) bleiben; sie sind kein Teil dieses Auftrags.
- Kein `api/`, keine Daten.

## Entscheide
- Siehe `docs/decisions/ki-weg-aufraeumen.md`.

## Stand im Plan
- KI entfernen: Schritt 9 von 9. Damit ist der Auftrag erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Darstellung und Bedienung: «KI im Gerät» ist weiter da.
2. Assistent öffnen, eine Frage stellen: «Weiter fragen bei» zeigt weiter die Dienste.
3. Eine beliebige Seite öffnen: kein englisches Wort mitten im deutschen Text.
