# Gutscheine

PR · 05.11.2026 · Auftrag: Noah «9a» (Thread «Planen Tennisstunden anbieten bis bezahlen»), Zusatzidee 9

## Was ist neu
- Im Kundenblatt gibt es «Gutscheine»: Betrag in CHF oder Anzahl Stunden, mit einem kurzen Code (zum Beispiel GUT-7K2M). Entfernen jederzeit.
- Die Kundenliste zeigt «Gutschein: 25 CHF, noch 25».
- Bereitest du für diese Person eine Rechnung vor, zieht der Entwurf den Gutschein ab: Betrag-Gutscheine den Rest, Stunden-Gutscheine die Stunden. Der Zweck nennt den Code («Gutschein GUT-7K2M: 25 CHF»). Den Betrag kannst du im Formular ändern.
- Gespeichert am Kunden (Einstellung «booking.customers», im Backup).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Gutschein gilt als eingelöst, sobald der Rechnungsentwurf vorbereitet ist (nichts wird gesendet). Brichst du den Entwurf ab, korrigierst du den Rest im Kundenblatt (Gutschein entfernen und neu anlegen).
- Bei einer Rechnung für mehrere Personen wird nichts abgezogen.
- Mehrere Gutscheine werden der Reihe nach verbraucht (der älteste zuerst).
- Fertig-Regel: app-stand-Zeile und Gut-zu-wissen-Text entfallen (Kundenseite hat dort keine Zeile und keine Karte).

## Entscheide (für decisions.md)
- 05.11.2026: Gutscheine (Betrag oder Stunden, mit Code) am Kunden, Abzug im Rechnungsentwurf (Noah «9a»).

## Stand im Plan
- Zusatzideen Dienstleistung: 10 von 12 (Gutscheine).

## Prüfschritte (nach dem Merge)
1. Kunden → einen Kunden öffnen → «Gutscheine»: 25 CHF hinzufügen, speichern.
2. Rechnung für eine Stunde dieses Kunden vorbereiten: der Betrag ist 25 tiefer, der Zweck nennt den Code.
