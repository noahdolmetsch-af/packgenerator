# Ankunfts-Bericht

Auftrag: Noah 26.11.2026 «4a» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»).

## Was ist neu
- Am Ende der Strecke zeigt die Live-Karte von selbst den Ankunfts-Bericht: Zeit unterwegs, gefahren und gestanden; die Stopps (Zahl und längster); Pause gegen Plan, wenn ein Plan lief; Handy-Akku von … auf …; die Zeit im Dunkeln und pro Licht der Anteil einer vollen Ladung.
- «Später» klappt den Bericht zu; «Ankunfts-Bericht ansehen» bringt ihn zurück.
- Der Bericht erscheint nur, wenn mindestens die Hälfte der Strecke gefahren wurde und man am Ziel ist.

## Was fällt weg oder rutscht tiefer
nichts.

## Selbst entschieden
- Der Bericht liegt als Zeile im bestehenden Meldungsstreifen der Live-Karte, kein neuer Block auf der Seite.
- Er rechnet nur aus den Fahrdaten auf dem Gerät; nichts wird gesendet.
- Pro Licht steht, wie viel einer vollen Ladung es in der Zeit im Dunkeln gebraucht hat (aus dem Modus, der brannte).
- Das Fahrende bleibt Sache des Knopfes «Fahrt beenden»; der Bericht beendet nichts.

## Entscheide
- 26.11.2026: `docs/decisions/ankunft-bericht.md`

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Strecke mit der Live-Karte bis zum Ziel fahren.
2. Am Ziel erscheint der Bericht; «Später» klappt ihn zu, «Ankunfts-Bericht ansehen» zeigt ihn wieder.
