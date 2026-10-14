# Bezahlen (vorbereitet, unsichtbar, Testmodus)

Stand: 14.10.2026. Noahs Wunsch «ich möchte eine bezahlfunktion einführen» (01:06 UTC) und seine Antworten (01:12–01:16 UTC): alles vorbereiten, für den Nutzer vorerst unsichtbar, Kosten 0, mit Testmodus starten.

| Frage | Antwort |
|---|---|
| 1 Wer bezahlt? | a und b: andere bezahlen Noah, und Noah bezahlt in der App |
| 2 Wofür? | a: die ganze App, einmal oder als Abo |
| 3 Wie oft? | a und b: einmal und Abo |
| 4 Konto mit E-Mail oder Code? | beides vorbereiten |
| 5 Kosten | 0, Testmodus |
| 6 Was jetzt? | a und b: App-Zahlung und Grundgerüst für Shop und Buchung |
| 7 Wer verkauft? | beides: Noah und andere (Marktplatz) |

## Was gebaut ist

- **Server** `api/pay.js` (Vercel «packgen»), Teile ohne Netz in `api/_lib/pay.js` und `api/_lib/shop.js`. Stripe über seine REST-Schnittstelle mit `fetch`, ohne SDK und ohne Grundgebühr.
- **App** `src/lib/pay/licence.js` und `src/lib/pay/shop.js`: nur Funktionen, keine Knöpfe, keine Texte. `LOCKED = false`, also ist nichts gesperrt.
- **Codes** `tools/pay-code.mjs`: Noah erzeugt Freischalt-Codes auf seinem Computer.
- **Tests** `tests/pay-server.test.js`, `tests/pay-licence.test.js`, `tests/pay-shop.test.js` (nur erfundene Werte).

## Wie es funktioniert

- **App kaufen:** drei Pläne (einmal, Monat, Jahr). Die Preise in `PLANS` sind Platzhalter, bis Noah sie festlegt. Stripe zeigt die Bezahlseite; danach gibt der Server eine signierte Lizenz zurück, die nur im `localStorage` des Geräts liegt (nie im Backup).
- **Konto mit E-Mail (4a):** Stripe legt bei jedem Kauf einen Kunden mit der E-Mail an. Kauf auf einem neuen Gerät wiederherstellen braucht später eine Anmeldung per E-Mail-Link; das ist noch nicht gebaut.
- **Code (4b):** `PG1-<plan>-<id>-<signatur>`. Mit Speicher (Upstash) gilt jeder Code nur einmal, ohne Speicher beliebig oft.
- **Abo:** Die Lizenz gilt bis zum Ende der bezahlten Zeit; danach fragt die App den Server, der bei Stripe nachschaut und eine neue Lizenz gibt.
- **Shop und Buchung:** `CATALOG` enthält nur erfundene Testartikel. Preise kennt nur der Server. Termine haben Plätze; gebucht wird einmal pro Zahlung (braucht Speicher).
- **Andere Verkäufer (Marktplatz):** Stripe Connect. Ein Verkäufer braucht ein eigenes Stripe-Konto (`acct_…` in `PAY_SELLERS`); das Geld geht direkt an ihn, die Plattform behält `PAY_PLATFORM_FEE_PCT` Prozent (Standard 0). Ein Verkäufer pro Bestellung.
- **Noah bezahlt in der App (1b):** Noah kauft im Shop eines anderen Verkäufers über dieselbe Kasse.

## Umgebung (nur Namen; Werte nur in Vercel)

`PAY_MODE=test` (sonst aus), `STRIPE_SECRET_KEY` (nur `sk_test_…`; ein Live-Schlüssel wird abgelehnt), `PAY_SIGNING_SECRET`, optional `PAY_SELLERS`, `PAY_PLATFORM_FEE_PCT`, `KV_REST_API_URL` / `KV_REST_API_TOKEN`. Ohne diese Werte antwortet der Server «nicht eingerichtet»; es fliesst nichts.

## Kosten und Pflichten (ehrlich)

- Testmodus: 0 CHF. Stripe-Konto gratis, keine Grundgebühr.
- Echtes Geld später: Stripe nimmt pro Zahlung etwa 2.9 % + 0.30 CHF (Karten aus dem Ausland mehr); Connect kostet pro aktivem Verkäufer zusätzlich.
- Wer an Fremde verkauft: AGB, Datenschutzerklärung, Impressum, Rückgabe- und Stornoregeln, Einnahmen versteuern, Mehrwertsteuer ab 100'000 CHF Umsatz pro Jahr.

## Bewusst noch nicht

Keine sichtbaren Knöpfe oder Seiten (brauchen Mockups und Noahs «freigegeben»), kein Live-Modus, keine echten Preise und Artikel, keine Anmeldung per E-Mail-Link, kein Stripe-Webhook, kein Lager für Produkte.
