# Sonnen-Ausfahrt: Wochenzeile und kürzere Fahrt (Schritt C)

Auftrag: Noah «1-5a» (Thread «Entwickeln: Über die Nebelgrenze motivieren», Antwort 3a: «Ja, leise»). Baut auf der Karte «Sonne über dem Nebel» (Schritt A, #1015) auf. D folgt als eigener PR, B und E sind zurückgestellt.

## Was ist neu
- In der Karte «Sonne über dem Nebel» steht unter der Fahrt eine Zeile «Aktive Zonenminuten diese Woche: 62 von 150.» (mit «Das Wochenziel ist erreicht.», wenn es erreicht ist). Sie braucht Fitbit-Werte dieser Woche; ohne Werte fehlt die Zeile.
- War die letzte Nacht deutlich kürzer als dein Normal (unter 85 % des Mittelwerts der letzten 30 Tage, mindestens 7 Werte), steht zusätzlich eine zweite Möglichkeit: «Kürzeste Fahrt über dem Nebel: …, 16 km, etwa 1:59 h.» mit «Diese Fahrt zeigen». Das Wort Schlaf kommt nirgends vor, es gibt keinen Rat und keine Begründung.
- Ausschalten: Ich › Aussehen › Vorschläge › Leistungstipps (derselbe Schalter wie bei «Heute locker?» auf Aktiv). Aus = beide Zeilen weg.

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte wird an Tagen mit Fitbit-Werten um eine bis zwei Zeilen höher; was darunter steht, rutscht entsprechend tiefer.

## Selbst entschieden
- Keine Schätzung «so eine Fahrt bringt 70 bis 90 Minuten», wie im Entwurf: die App hat keine verlässliche Grundlage dafür, und eine erfundene Zahl wäre kein Hinweis, sondern Ratespiel. Die Zeile nennt nur den Stand der Woche.
- «Deutlich zu kurz» = unter 85 % deines eigenen Normals; die zweite Fahrt zeigt sich nur, wenn sie mindestens 15 Minuten kürzer ist als die gezeigte. Ist die gezeigte schon die kürzeste, bleibt die Karte, wie sie ist.
- Nur der Schlaf löst die zweite Möglichkeit aus, nicht der Ruhepuls: so ist es in der Frage 3a beschrieben, und ein Wert weniger ist ruhiger.
- Kein neuer Schalter: derselbe wie bei den anderen Hinweisen aus deinen Aktivitäten (Leistungstipps).
- Das Wochenziel ist das bestehende Ziel für aktive Zonenminuten (Standard 150, ändert sich dort).
- Keine neue Funktion in `features.js` (gehört zu «Weather for a ride»), keine Daten- oder Backup-Änderung, nichts in `api/`.

## Entscheide (für decisions.md)
- 06.11.2026: Die Sonnen-Ausfahrt richtet sich leise nach Erholung und Wochenziel: Stand der Woche, nach kurzer Nacht die kürzeste Fahrt als zweite Möglichkeit, ohne Rat (Noah «3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Idee «Nebelgrenze motiviert»: A und C umgesetzt, D folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. An einem Nebelmorgen mit Sonne darüber (Karte «Sonne über dem Nebel» auf Heute): unter der Fahrt steht «Aktive Zonenminuten diese Woche: … von …» (mit Fitbit-Werten).
2. Nach einer deutlich kürzeren Nacht und mit einer zweiten, kürzeren Fahrt steht «Kürzeste Fahrt über dem Nebel» daneben; «Diese Fahrt zeigen» tauscht die Fahrt in der Karte.
3. Ich › Aussehen › Vorschläge › Leistungstipps aus: beide Zeilen sind weg.
