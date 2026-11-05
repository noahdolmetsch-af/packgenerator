# Fester Termin für Stammkunden

PR · 05.11.2026 · Auftrag: Noah «8a» (Thread «Planen Tennisstunden anbieten bis bezahlen»), Zusatzidee 8

## Was ist neu
- Im Kundenblatt gibt es «Fester Termin»: Wochentag und Uhrzeit (beides leer: keiner). Die Kundenliste zeigt «Fester Termin Donnerstag 17:00».
- Gibt es in den nächsten 7 Tagen (auch derselbe Wochentag der nächsten Woche) in einem Angebot genau diese Zeit, mit freiem Platz und noch nicht von dieser Person gebucht, zeigt Heute «Fester Termin: Mia · Do 17:00 ist frei» mit dem Knopf «Vorschlagen». Die Nachricht («Dein fester Termin ist frei …») ist fertig, du sendest sie selbst.
- Gespeichert am Kunden (Einstellung «booking.customers», im Backup).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Es ist nur ein Vorschlag: nichts wird von selbst gebucht oder gesendet.
- Gibt es die Zeit nicht als freie Zeit im Angebot, kommt keine Zeile (Noah öffnet die Zeit selbst).
- Pro Kunde höchstens eine Zeile, für den nächsten passenden Tag der Woche.
- Fertig-Regel: Zeile in app-stand.md entfällt (die Angebote haben dort noch keine eigene Zeile; Kundenliste ist unverändert dieselbe Seite); Gut-zu-wissen-Text entfällt (Seite hat die Karte nicht).

## Entscheide (für decisions.md)
- 05.11.2026: Fester Termin pro Kunde als Wochenvorschlag auf Heute, keine automatische Buchung (Noah «8a»).

## Stand im Plan
- Zusatzideen Dienstleistung: 9 von 12 (Stammkunden).

## Prüfschritte (nach dem Merge)
1. Kunden → einen Kunden öffnen → «Fester Termin»: Wochentag und Uhrzeit wählen, speichern.
2. Im Angebot genau diese Zeit freigeben: Heute zeigt «Fester Termin» mit «Vorschlagen».
