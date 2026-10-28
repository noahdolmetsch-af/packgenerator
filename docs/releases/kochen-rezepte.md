# Kochen

PR #(folgt) · 28.10.2026 · Auftrag: Noah «1b 2a 3a 4a 5a», «ok kochen» (Thread «Einfache Kochrezepte und Mahlzeiten-Tipps»)

## Was ist neu
- Planen › Alltag hat eine vierte Zeile «Kochen» (`#/me/alltag/kochen`).
- 60 eigene, sehr einfache Rezepte (20 Frühstück, 22 Mittag, 28 Abend; manche passen zu zwei Mahlzeiten): höchstens 6 Zutaten und 20 Minuten, Zutaten aus dem normalen Supermarkt. Für die App geschrieben, nichts kopiert. Englisch und Deutsch stehen zusammen in `src/lib/kochen/rezepte.js`.
- Filter: Alle, Frühstück, Zmittag, Abendessen, Meine eigenen (die Rezepte aus Freie Zeit › Meine Sammlungen).
- Ein Rezept zeigt die Zutaten für 1 bis 8 Portionen, «Auf die Einkaufsliste» (mit Rückgängig) und «Alle Schritte auf einen Blick».
- «Nie mehr zeigen» blendet ein Rezept aus (Rückgängig); «Ausgeblendet» am Ende der Liste holt es zurück.

## Was fällt weg oder rutscht tiefer
- nichts. Auf Heute ändert sich nichts (Noah «1b»).

## Selbst entschieden
- Salz, Pfeffer und Wasser stehen nicht auf den Zutatenlisten; das Rezept sagt das.
- Eine Zutat geht als «Banane, 2 Stück» auf die Einkaufsliste, in der Sprache der App. Was schon offen auf der Liste steht, kommt nicht doppelt.
- Die gewählten Portionen werden nicht gespeichert; jedes Rezept startet mit 1 Portion.
- Zutaten tragen schon Merkmale (Fleisch, Fisch, Milch, Ei, Nüsse, Gluten, scharf) für «Was isst du nicht?» im dritten Schritt.
- Eigene Rezepte bearbeitest du weiter in Freie Zeit; ein App-Rezept anpassen kommt später.

## Entscheide (für decisions.md)
- 28.10.2026: Kochen als eigene Seite in Alltag, nichts auf Heute; eigene einfache Rezepte offline im Repo; ein Tipp pro Mahlzeit mit Rotation; kurzer Start (was du nicht isst, wie lange); Kochmodus ein Schritt pro Bildschirm mit Timer, dazu alle Schritte auf einen Blick (Noah «1b 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Kochen (Ziel 5 Alltag): Schritt 1 von 4. Danach Kochmodus mit Timer, Tipps des Tages mit kurzem Start, Nährwerte pro Portion. Später: Bezug zum Training, Link zur Suche im Online-Shop.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Alltag öffnen: unten steht «Kochen». Antippen.
2. «Frühstück» tippen, dann «Overnight Oats mit Banane». Mit «+» 2 Portionen wählen: 100 g Haferflocken, 300 ml Milch.
3. «Auf die Einkaufsliste» tippen, dann Planen › Alltag › Einkaufsliste: die vier Zutaten stehen dort.
