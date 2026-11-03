# Funktionen, die auf ihren Moment warten (Wegweiser 23: «Erscheint, wenn …»)

PR #… · 02.11.2026 · Auftrag: Noah Plan «freigabe» Schritt 1–26 (Thread «Entdeckbarkeit versteckter Funktionen planen»), Schritt 23

## Was ist neu
- 15 Funktionen erscheinen nur in einer bestimmten Lage (heimat.js GAPS «when»). Am Ende ihrer Seite steht jetzt ein ruhiger Klappteil «Nur in der passenden Lage · n» mit je einer Zeile «Name + wann sie erscheint» (Satz aus know/wann.js).
- Wo die Beispiel-Tour der Spielwiese die Funktion zeigt (Gut ankommen, Wäsche, Morgenliste, Abend unterwegs), gibt es «Im Beispiel zeigen».
- Ist die Funktion gerade auf der Seite zu sehen (Check-in, Ausland, Morgenliste, Vorbereitung, Gefühl nach der Fahrt), fällt ihre Zeile weg.
- Seiten: Packen (6), Touren (3), Velopflege (2), Verschleiss (1), Unterwegs (1), Training (1), Vorlagen (1).
- Neu: `src/lib/erscheint.js`, `src/lib/ui/ErscheintWenn.svelte` (in `App.svelte` vor «Diese Seite anpassen»), Test `tests/erscheint.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Der Klappteil steht am Seitenende vor «Diese Seite anpassen» und ist zugeklappt.

## Selbst entschieden
- Ein Klappteil am Seitenende statt einer Zeile an der genauen Stelle: die Stelle gibt es nicht, solange die Lage fehlt, und so bleibt die Seite ruhig.
- Wochen-Tipp und Comeback stehen auf Heute: dort keine Zeile (Heute bleibt frei).
- «Im Beispiel zeigen» nur, wo die Beispiel-Tour die Funktion sicher zeigt; sonst nur der Satz.
- «Nicht für mich» markierte Funktionen erscheinen nicht.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 23 von 26.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen und ans Ende scrollen: «Nur in der passenden Lage» aufklappen, dort steht «Gut ankommen» mit dem Moment, in dem es erscheint.
2. Packen öffnen, den Klappteil aufklappen und «Im Beispiel zeigen» antippen: Ich öffnet die Spielwiese.
