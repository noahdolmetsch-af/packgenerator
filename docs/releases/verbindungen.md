# Verbindungen

PR · 23.11.2026 · Auftrag: Noah «3b» (Punkt 7 der offenen Liste, Thread «Wi gaht's?» um Träume und Visionen erweitern)

## Was ist neu
- Satzfragen in «Wi gaht's?» zeigen darunter, was die App schon weiss, als Tipp-Auswahl (Morgen-Seite, Fenster und Karte auf Heute):
  - «Dein wichtigstes Ziel heute»: deine offenen **To-dos** (überfällig, heute, ohne Datum), deine **Wochenziele** und deine **Aktivitäten**.
  - «Was darf heute liegen bleiben?»: deine offenen To-dos.
  - «Worauf bist du stolz?»: deine **neuen Sterne** (7 Tage) und was du **heute erledigt** hast.
  - Die Musterfragen «Kleinster Schritt», «Diese Woche», «Endlich erledigt», «Wem eine Nachricht?», «Wen wieder sehen?» bieten dasselbe, dazu deine **Menschen** aus «Lange nicht gesehen».
- Die Frage am Abend, ob du das Ziel von heute Morgen erreicht hast, nennt es leise darüber («Heute Morgen: «…»»).
- Ein Tipp setzt die Worte ins Feld (ein zweiter hängt mit « · » an, dieselbe nie doppelt); du kannst alles ändern.

## Was fällt weg oder rutscht tiefer
- nichts. Die Auswahl steht unter dem Feld; die Frage und das Feld bleiben, wo sie waren.

## Selbst entschieden
- Nichts wird kopiert oder gespeichert: die Auswahl liest nur (To-dos aus Merken, Wochenziele, Aktivitäten, Menschen, Sterne) und ändert nichts an diesen Daten. Kein Schema, kein Backup-Format.
- Höchstens 5 Vorschläge je Art; leere Arten fehlen ganz (keine Leerzeile).
- Wartende To-dos und To-dos später als morgen werden nicht angeboten.
- Kein neuer Eintrag in `features.js`; Zeile in `docs/app-stand.md` bei «Wi gaht's?».

## Entscheide (eigene Datei `docs/decisions/verbindungen.md`)
- 23.11.2026: alle fünf Verbindungen in einem PR (Noah «3b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wi gaht's?»: Verbindungen online; offen sind die Visionen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Wi gaht's?» am Morgen: unter «Dein wichtigstes Ziel heute» stehen deine To-dos und Wochenziele.
2. Ein To-do antippen: es steht im Feld. Ein Wochenziel dazu antippen: es hängt mit « · » an.
3. Seite neu laden: der Satz ist gespeichert.
