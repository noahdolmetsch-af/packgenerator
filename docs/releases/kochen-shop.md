# Zutaten online suchen (Kochen)

PR #(folgt) · 01.11.2026 · Auftrag: Noah (Thread «Einfache Kochrezepte und Mahlzeiten-Tipps»), «Link zur Suche im Online-Shop»

## Was ist neu
- Unter den Zutaten eines Rezepts steht «Online suchen: Migros | Coop». Wählst du einen Shop, hat jede Zutat einen kleinen Link, der die Suche dieses Shops im Browser öffnet. Nochmals tippen schaltet es aus.
- Die App baut nur die Adresse (`src/lib/kochen/shop.js`); sie sendet nichts und braucht keinen Zugang. Offline ist die Seite wie vorher, der Link braucht Internet.

## Was fällt weg oder rutscht tiefer
- nichts. Ohne gewählten Shop kommt nur die Zeile «Online suchen» dazu.

## Selbst entschieden
- Migros und Coop als Start; weitere Shops sind eine Zeile in `SHOPS`. Die Suchadressen sind die öffentlichen Suchseiten (`/de/search?query=` und `/de/search/?text=`); ändert ein Shop seine Adresse, ist es eine Zeile.
- Die Wahl steht in den Kochen-Einstellungen (`shop`), ist änderbar und ausschaltbar.
- Bei eigenen Rezepten steht die ganze Zeile als Suchtext.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Kochen (Ziel 5 Alltag): Link zum Online-Shop gebaut. Damit sind die geplanten Schritte fertig.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Alltag › Kochen › ein Rezept: unter den Zutaten «Migros» tippen.
2. Jede Zutat zeigt einen kleinen Link; er öffnet die Migros-Suche.
3. «Migros» nochmals tippen: die Links sind weg.
