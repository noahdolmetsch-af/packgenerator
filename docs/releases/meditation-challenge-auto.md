# Challenge zählt Meditation von selbst

PR (offen) · 26.11.2026 · Auftrag: Noah «1-5a» und «ja» vom 24.11.2026 (Schritt 2 der Meditationsseite, Thread «Challenges nach Gelegenheit bauen»)

## Was ist neu
- Eine Challenge in Minuten kann «Gehört zu: Meditation» bekommen (Kästchen im Challenge-Fenster, Feld `link: 'meditation'` am Ziel in der Einstellung `tagesziele`). Jede Meditationssitzung (Tabelle `flowLog`, `actId: 'meditation'`) zählt dann zu den Minuten des Tages, innerhalb vom ersten bis zum letzten Tag der Challenge.
- Erreicht eine Sitzung das Tagesziel, ist der Tag von selbst abgehakt; die Karte sagt «10 von 10 Min · 12 Min aus der Meditation» und der Knopf heisst «Von selbst abgehakt».
- Die Challenge «30 Tage Meditation» (Seite Meditation und Challenges › Ideen) startet mit angehaktem Kästchen. Der Angebotstext heisst jetzt «Jede Sitzung zählt von selbst.»
- Die Sitzungen werden bei jedem Lesen aus dem Verlauf gerechnet und nie in die Challenge geschrieben (`withAuto` in `src/lib/tagesziel.js`). Wird eine Sitzung gelöscht oder nachgetragen, stimmt der Tag sofort wieder.
- Die Handy-Erinnerung der Challenge (falls eine Uhrzeit gesetzt ist) schickt für heute nichts, wenn die Sitzungen das Ziel schon erreicht haben (`medToday` in `src/lib/push/client.js`, `src/lib/push/schedule.js`).

## Was fällt weg oder rutscht tiefer
- nichts. Der Satz «Hake sie hier oder auf Heute ab» fällt aus dem Angebot weg, abhaken geht weiter von Hand (und die Minuten von Hand zählen zu den Sitzungen dazu).

## Selbst entschieden
- Gespeichert wird nur die Verknüpfung (`link`), die Minuten aus den Sitzungen werden gerechnet: so zählt nichts doppelt, und das Löschen einer Sitzung wirkt sofort.
- Das Kästchen steht nur bei Challenges in Minuten (bei Schritten oder Anzahl ergibt «Meditation» keinen Sinn).
- «Abhaken zurücknehmen» nimmt nur die Minuten von Hand weg, die Sitzungen bleiben; ist der Tag nur durch Sitzungen erreicht, ist der Knopf ausgegraut («Von selbst abgehakt»).
- Eine schon laufende Challenge wird nicht still verknüpft: wer sie verknüpfen will, hakt das Kästchen im Fenster (Stift) an.
- Keine eigene Seite und kein eigener Absprung: die Funktion steht im bestehenden Challenge-Fenster und auf der Meditationsseite, daher keine neue Zeile in `FEATURE_MOMENTS`.

## Entscheide (eigene Datei `docs/decisions/meditation-challenge-auto.md`)
- 26.11.2026: Verknüpfung statt Doppelbuchung.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Meditation öffnen, «Challenge: 30 Tage Meditation» starten: das Kästchen «Gehört zu: Meditation» ist angehakt.
2. Eine Sitzung von 10 Minuten oder mehr beenden: die Karte steht auf «Von selbst abgehakt».
3. Stift auf der Karte: das Kästchen lässt sich ausschalten, dann zählen nur noch Minuten von Hand.
