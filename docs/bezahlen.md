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
| Pro (01:27) | 1a: Strava, Fitbit und Garmin-Seiten wären «Pro» (`PRO_FEATURES`) |
| Vorlagen (01:27) | 2a: Verkauf von Packlisten und Tourenplänen jetzt vorbereiten |

## Was gebaut ist

- **Seite «Bezahlen»** unter Ich › Die App (`#/me/pay`, `src/pages/Pay.svelte`, Inhalt in `src/lib/pay/info.js`; Mockups BZ1 + BZ2b, Noah 14.10.2026 01:31 «1a 2b», «bz freigeben»): erklärt, was vorbereitet ist, was es kostet, was fehlt, und zeigt sechs Anwendungsfälle als Karten. Nur lesen, keine Knöpfe.

- **Server** `api/pay.js` (Vercel «packgen»), Teile ohne Netz in `api/_lib/pay.js` und `api/_lib/shop.js`. Stripe über seine REST-Schnittstelle mit `fetch`, ohne SDK und ohne Grundgebühr.
- **App** `src/lib/pay/licence.js` und `src/lib/pay/shop.js`: nur Funktionen, keine Knöpfe, keine Texte. `LOCKED = false`, also ist nichts gesperrt.
- **Codes** `tools/pay-code.mjs`: Noah erzeugt Freischalt-Codes auf seinem Computer.
- **Tests** `tests/pay-server.test.js`, `tests/pay-licence.test.js`, `tests/pay-shop.test.js` (nur erfundene Werte).

## Rechnungen ohne Gebühren (0.139.0, Mockups QR1–QR9)

Der Gratis-Weg ohne Stripe (Noah 14.10.2026, alle Mockups freigegeben 04:00 UTC «a», QR9 05:10 UTC «a»):

- **Rechnung schreiben** (`#/me/pay/invoices/new`, `src/pages/InvoiceNew.svelte`): Schweizer QR-Rechnung (SPC 0200; QR-IBAN mit QR-Referenz, sonst RF-Referenz) aus dem eigenen Konto, mit TWINT als zweitem Zahlweg. Konto und TWINT-Nummer nur in `localStorage` (`pg.pay.account`). Senden per Mail (`mailto:`), als PDF (`src/lib/pay/billpdf.js`, ohne Bibliothek) oder als Zahl-Link.
- **Rechnungen** (`#/me/pay/invoices`, `src/pages/Invoices.svelte`, Daten `src/lib/pay/invoices.js` in `settings` 'pay.invoices'): Alle/Offen/Bezahlt, «Bezahlt», «Bezahlt + Mail», «Geld erhalten» (Betrag → passende offene Rechnung), Kontoauszug camt.053/054 (`src/lib/pay/camt.js`: Referenz oder Rechnungsnummer im Text; ohne Referenz Vorschlag über den Betrag, «Selbst wählen», «Rückgängig»), Rechnung aus dem E-Banking (Bild mit QR-Code, `BarcodeDetector`), Sonntags-Erinnerung (Schalter; die Karte auf Heute folgt).
- **Ich habe bezahlt** (QR5): Der Zahl-Link `#/zahlen/<daten>` (`src/pages/PayLink.svelte`) trägt Absender, Zweck, Betrag, TWINT-Nummer, IBAN und Referenz im Teil nach `#`. Die Person tippt «Ich habe bezahlt»; `api/pay.js?step=report` legt nur `{ Rechnungsnummer, Weg, Zeit }` in eine Box (`api/_lib/report.js`, Redis, 60 Tage, höchstens 200). Die Box ist sha256 des Geräte-Schlüssels (`pg.pay.box`); nur das Gerät mit dem Schlüssel liest sie (`step=reports`, `step=forget`). In der App: «Mia sagt: … bezahlt» mit «Stimmt, bezahlt» oder «Noch nicht da».
- **TWINT-Screenshot** (QR6, `src/lib/pay/twintshot.js`, `ShotResult.svelte`): liest Betrag, Rechnungsnummer und Absender auf dem Gerät mit Tesseract.js (lädt beim ersten Gebrauch von jsdelivr, etwa 5 MB). Der Teilen-Weg aus TWINT (share target für Bilder, `public/share-target.js`) folgt nach «Inspiration».
- **Zu zahlen** (QR9, `#/me/pay/bills`, `src/pages/Bills.svelte`, `src/lib/pay/bills.js`, `settings` 'pay.bills'): erhaltene Rechnung fotografieren (Kamera-Knopf), Fälligkeit (sonst 30 Tage), Erinnerung 3 Tage vorher (änderbar), «Zahlteil» zum Kopieren, «Bezahlt», Foto bleibt als Beleg. Die Karte auf Heute (`BillReminder.svelte`) folgt.
- **Tests:** `tests/pay-invoices.test.js`, `tests/pay-bills.test.js`, `tests/pay-report.test.js`, `tests/pay-twintshot.test.js`, e2e `rechnungen`, `zu-zahlen`, `bezahlt-melden`, `twint-teilen` (nur erfundene Werte; IBAN = Beispiel-QR-IBAN des Standards).

## Termine buchen und Shop (0.147.0, Paket B)
`api/booking.js` braucht nur `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Upstash Redis, Gratisstufe). Online bezahlen bei einem Angebot braucht zusätzlich `PAY_MODE=test` und `STRIPE_SECRET_KEY` (nur `sk_test_…`); sonst sagt die Buchungsseite «Online bezahlen ist noch nicht eingerichtet», und Angebote mit «vor Ort» laufen trotzdem. An Stripe gehen nur Angebot, Preis und eine Vorgangsnummer, nie Name oder Kontakt. Namen und Kontakte liegen nur in Redis und fallen 60 Tage nach dem Termin weg. Der Shop ohne Gebühren (SHOP1–SHOP4b) legt Bestellungen über `api/pay.js` in eine eigene Box auf dem Server, bis die App sie abholt; bezahlt wird mit TWINT oder QR-Rechnung.

## Wie es funktioniert

- **App kaufen:** drei Pläne (einmal, Monat, Jahr). Die Preise in `PLANS` sind Platzhalter, bis Noah sie festlegt. Stripe zeigt die Bezahlseite; danach gibt der Server eine signierte Lizenz zurück, die nur im `localStorage` des Geräts liegt (nie im Backup).
- **Konto mit E-Mail (4a):** Stripe legt bei jedem Kauf einen Kunden mit der E-Mail an. Kauf auf einem neuen Gerät wiederherstellen braucht später eine Anmeldung per E-Mail-Link; das ist noch nicht gebaut.
- **Code (4b):** `PG1-<plan>-<id>-<signatur>`. Mit Speicher (Upstash) gilt jeder Code nur einmal, ohne Speicher beliebig oft.
- **Abo:** Die Lizenz gilt bis zum Ende der bezahlten Zeit; danach fragt die App den Server, der bei Stripe nachschaut und eine neue Lizenz gibt.
- **Shop und Buchung:** `CATALOG` enthält nur erfundene Testartikel. Preise kennt nur der Server. Termine haben Plätze; gebucht wird einmal pro Zahlung (braucht Speicher).
- **Pro:** Nur die Teile in `PRO_FEATURES` (Strava, Fitbit, Garmin) bräuchten später einen Kauf; alles andere bleibt gratis. Solange `LOCKED` aus ist, gilt nichts davon.
- **Vorlagen verkaufen:** Artikelart `download`. Nach dem Kauf bekommt das Gerät pro Vorlage eine signierte Berechtigung (`pg.pay.downloads` im localStorage); `?step=download` prüft sie. Den Inhalt der Vorlage liefert ein späterer Schritt.
- **Andere Verkäufer (Marktplatz):** Stripe Connect. Ein Verkäufer braucht ein eigenes Stripe-Konto (`acct_…` in `PAY_SELLERS`); das Geld geht direkt an ihn, die Plattform behält `PAY_PLATFORM_FEE_PCT` Prozent (Standard 0). Ein Verkäufer pro Bestellung.
- **Noah bezahlt in der App (1b):** Noah kauft im Shop eines anderen Verkäufers über dieselbe Kasse.

## Umgebung (nur Namen; Werte nur in Vercel)

`PAY_MODE=test` (sonst aus), `STRIPE_SECRET_KEY` (nur `sk_test_…`; ein Live-Schlüssel wird abgelehnt), `PAY_SIGNING_SECRET`, optional `PAY_SELLERS`, `PAY_PLATFORM_FEE_PCT`, `KV_REST_API_URL` / `KV_REST_API_TOKEN`. Ohne diese Werte antwortet der Server «nicht eingerichtet»; es fliesst nichts.

## Kosten und Pflichten (ehrlich)

- Testmodus: 0 CHF. Stripe-Konto gratis, keine Grundgebühr.
- Echtes Geld später: Stripe nimmt pro Zahlung etwa 2.9 % + 0.30 CHF (Karten aus dem Ausland mehr); Connect kostet pro aktivem Verkäufer zusätzlich.
- Wer an Fremde verkauft: AGB, Datenschutzerklärung, Impressum, Rückgabe- und Stornoregeln, Einnahmen versteuern, Mehrwertsteuer ab 100'000 CHF Umsatz pro Jahr.

## Bewusst noch nicht

Keine Knöpfe zum Bezahlen (brauchen Mockups und Noahs «freigegeben»); sichtbar ist nur die Erklär-Seite, kein Live-Modus, keine echten Preise und Artikel, keine Anmeldung per E-Mail-Link, kein Stripe-Webhook, kein Lager für Produkte.
