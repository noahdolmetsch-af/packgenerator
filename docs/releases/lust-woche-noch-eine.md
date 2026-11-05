# Worauf hab ich Lust: Woche und «Noch eine»

PR (offen) · 05.11.2026 · Auftrag: Noah «Touren 2a und b» (Thread «Bauen: Freie Zeit Teil 1»)

## Was ist neu
- Ein Kasten «Deine Woche» auf «Worauf hab ich Lust?»: Wetter der nächsten 3 Stunden am Wohnort (trocken oder Regen/Gewitter) und freie Minuten bis zum nächsten Termin im Google-Kalender (Kopie auf dem Gerät).
- Trocken: Ideen draussen zählen +1. Regen: Ideen draussen −3, Ideen drinnen +1. Die freie Zeit wählt die grösste passende Zeit-Taste (15 Min. bis 2 Stunden), solange du keine eigene Zeit gewählt hast.
- «Noch eine» würfelt eine weitere Idee unter den fünf besten, die noch nicht gezeigt sind.
- Eigene Ideen können «Draussen», «Drinnen» oder «Egal» sagen.
- Ein Häkchen schaltet die Woche aus.
- Nebenbei behoben: «passt zu deiner Laune» usw. unter den Ideen hatten keine deutschen Texte.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Ohne Wohnort oder Kalender zeigt der Kasten, was fehlt (mit Link zu den Kalender-Einstellungen), und die Ideen laufen wie bisher.
- Zuordnung der mitgelieferten Ideen: draussen = Intervalle, Hügelwiederholungen, kurzer Lauf, Bälle schlagen, Frisbee, Kurven üben, Balance, Spaziergang, Velo-Café, lange Runde; drinnen = Spieleabend, Yoga, Dehnen, Küchentanz; der Rest egal.
- Das Wetter wird nur geladen, wenn die Woche an ist und ein Wohnort gesetzt ist; es nutzt dieselbe Abfrage wie die Karte «Freie Zeit und gutes Wetter» (kein neuer Server-Aufruf).
- Keine neue Funktion in `features.js` (Ergänzung).
- Speicherung: `lustWeek` und `out` im Freie-Zeit-Eintrag, kein neues Schema.

## Entscheide (für decisions.md)
- 05.11.2026: Wetter und freie Zeit ändern nur die Reihenfolge der Lust-Ideen, nie die Auswahl (Grund: alles bleibt ein Vorschlag).

## Stand im Plan (roadmap.md / vorhaben.md)
- Freie Zeit Teil 1: Lust erledigt; Abend folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Freie Zeit › «Worauf hab ich Lust?» öffnen: Der Kasten «Deine Woche» zeigt Wetter und freie Zeit (mit gesetztem Wohnort und Kalender).
2. «Noch eine» tippen: Eine weitere Idee erscheint.
3. Häkchen bei «Wetter und freie Zeit aus meiner Woche nutzen» entfernen: Der Kasten zeigt keine Zeilen mehr.
