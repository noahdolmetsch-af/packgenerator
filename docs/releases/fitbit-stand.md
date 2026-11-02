# Fitbit immer aktuell: Stand, letzte Werte, schnellerer neuer Versuch

PR · 02.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Klären: Fitbit-Werte immer aktuell»)

## Was ist neu
- Unter «Dein Körper heute» und «Körperwerte» steht «Stand 07:42» (Zeit des letzten guten Abrufs).
- Kommt nichts Neues von Fitbit, zeigt «Dein Körper heute» die letzten Werte der letzten 7 Tage, mit «von gestern» oder dem Datum.
- Nach einem Fehler erscheint «Jetzt nochmals versuchen».
- Läuft die App, wird jede Minute geprüft, ob 15 Minuten um sind. Nach «keine Verbindung», «zu langsam» oder «Google ausgelastet» schon nach 2 Minuten.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Neue Versuche nach 2 Minuten nur bei Fehlern, die sich selbst beheben können (kein Netz, zu langsam, Google ausgelastet); bei «neuer Login nötig» bleibt es bei 15 Minuten, damit der Server nicht belastet wird.
- Die Zeit steht auf den zwei Fitbit-Kacheln von Heute, nicht auf jeder Karte der App.

## Entscheide (für decisions.md)
- Keiner neu.

## Stand im Plan
- Kein Hintergrund-Abruf ohne offene App (bräuchte einen neuen Teil unter `api/`); nur auf Noahs Wunsch.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: unter «Dein Körper heute» steht «Stand …».
2. Flugmodus an, App neu öffnen, Flugmodus aus: nach 2 Minuten holt sie wieder.
