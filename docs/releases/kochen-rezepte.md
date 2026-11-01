# Kochen

PR #(folgt) · 28.10.2026 · Auftrag: Noah «1b 2a 3a 4a 5a», «ok kochen» (Thread «Einfache Kochrezepte und Mahlzeiten-Tipps»)

## Was ist neu
- Planen › Alltag hat eine vierte Zeile «Kochen» (`#/me/alltag/kochen`).
- 104 eigene, sehr einfache Rezepte (31 Frühstück, 33 Mittag, 50 Abend; manche passen zu zwei Mahlzeiten, 6 Desserts und Snacks zu keiner): höchstens 6 Zutaten und 20 Minuten, Zutaten aus dem normalen Supermarkt. Für die App geschrieben, nichts kopiert. Englisch und Deutsch stehen zusammen in `src/lib/kochen/rezepte.js`.
- Gruppen als zweite Filterreihe (Noah 28.10.2026 «sinnvolle gruppen … je 4»): Fleisch, Reis, Desserts, Shakes, Power Food, Protein-Bomben, Carbs, Veggies, Grill, Sonntags-Brunch, Fast Food, je mindestens 4 Rezepte (44 neue Rezepte dafür). Gruppen überall: umbenennen, sortieren (Pfeile und Ziehen), löschen (fragt, wohin die Rezepte gehen; Rückgängig), eigene dazu, zurück zu den Standard-Gruppen. Auf der Rezeptseite tippst du eine Gruppe an, um das Rezept hinein oder heraus zu nehmen.
- Filter: Alle, Frühstück, Zmittag, Abendessen, Meine eigenen (die Rezepte aus Freie Zeit › Meine Sammlungen).
- Ein Rezept zeigt die Zutaten für 1 bis 8 Portionen, «Auf die Einkaufsliste» (mit Rückgängig) und «Alle Schritte auf einen Blick».
- «Nie mehr zeigen» blendet ein Rezept aus (Rückgängig); «Ausgeblendet» am Ende der Liste holt es zurück.

## Was fällt weg oder rutscht tiefer
- nichts. Auf Heute ändert sich nichts (Noah «1b»).

## Selbst entschieden
- Ein Rezept kann in mehreren Gruppen sein (z. B. Pouletspiessli in Fleisch und Grill). Eine gelöschte Gruppe löscht nie Rezepte.
- Zmittag heisst wie sonst in der App «Zmittag».
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
2. In der zweiten Reihe «Sonntags-Brunch» tippen: 9 Rezepte. «Fotzelschnitten» öffnen, mit «+» 2 Portionen wählen: 6 Scheiben Toastbrot, 4 Eier.
3. «Auf die Einkaufsliste» tippen, dann Planen › Alltag › Einkaufsliste: die fünf Zutaten stehen dort.
4. Zurück zu Kochen, ganz unten «Gruppen» öffnen: «Grill» umbenennen, dann löschen; die Rezepte bleiben unter «Alle».
