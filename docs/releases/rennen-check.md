# Rennen detailliert planen

PR dieser Seite · 27.10.2026 · Auftrag: Noah «lass uns diesen Check 1:1 jetzt auf die App bringen», «1b 2b» (Thread «Ultra-Rennen Herausforderungen»)

## Was ist neu
- Neue Seite **Touren › Rennen detailliert planen** (`#/racecheck`): alle kommenden (und vergangenen) Rennen, je mit Datum, Countdown und wie weit der Check ausgefüllt ist.
- Pro Rennen der **Rennen-Check** (`#/racecheck/<Rennen>`): die fünf Papier-Blätter 1:1 als Formular. 1 Ablauf A–Z (mit Rennen, vier Fragen, Probefahrt), 2 Soll-Setup mit Velo-Skizze und Taschen (leer/voll in g), 3 Rennen-Grundliste (immer dabei, nur wenn, Tasche), 4 Schlaf-Varianten nebeneinander, 5 eine Nacht Stunde für Stunde.
- Jedes Feld speichert von selbst im Rennen (Einstellung «races», also im Backup). «Antworten laden» übernimmt eine Datei von der Ausfüll-Seite; «Dieses Blatt leeren» fragt zuerst und bietet Rückgängig.
- Wege hin: Touren (Reihe unter dem Titel), Touren › Rennen (Knopf neben «Neues Rennen»), jedes Rennen («Rennen-Check ›» über den Teilen), Suche und «Was die App kann».

## Was fällt weg oder rutscht tiefer
- nichts. In der Reihe unter dem Touren-Titel steht «Rennen detailliert planen» neu zuerst; die anderen Chips rücken einen Platz nach rechts.

## Selbst entschieden
- Die Seite nutzt die bestehenden Rennen (Touren › Rennen); ein neues Rennen wird weiter dort angelegt, damit es nur eine Liste von Rennen gibt.
- Im öffentlichen Code stehen nur allgemeine Beispiele als graue Platzhalter, keine echten Gewichte oder Marken. Noahs eigene Antworten kommen über die private Datei von der Ausfüll-Seite.
- Die Feldnamen sind gleich wie auf der Ausfüll-Seite, damit die Antworten 1:1 passen.
- Uhrzeiten auf Blatt 5 bleiben, wie sie sind; «Sunday» geht durch `t()`.

## Entscheide (für decisions.md)
- 27.10.2026: Rennen-Check als eigene Seite «Rennen detailliert planen» (Noah «1b»), Name «Rennen-Check» (Noah «2b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel 6 «Lange Fahrten unterwegs verstehen», Idee «Packen A–Z»: Papier-Check jetzt in der App. Als Nächstes vorgeschlagen: Links pro Rennen (Handbuch, Regeln, Tracker), Learnings aus vergangenen Rennen, Check ins nächste Rennen übernehmen, Zielzeit nonstop.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen, in der Reihe unter dem Titel «Rennen detailliert planen» antippen: deine Rennen stehen da.
2. Ein Rennen antippen, auf Blatt 1 etwas schreiben, zu Blatt 3 wechseln und zurück: der Text ist noch da.
3. Auf der Ausfüll-Seite «Antworten für die App speichern», dann im Rennen «Antworten laden» und die Datei wählen: deine Antworten stehen in den Feldern.
