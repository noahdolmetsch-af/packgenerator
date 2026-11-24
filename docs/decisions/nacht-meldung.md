# Nachtlauf mit Morgenmeldung

24.11.2026 · Auftrag: Noah «a-c alle» (Thread «Tests schneller machen»), Punkt c

Auf die Frage, was zusätzlich gegen rote Tests getan werden kann (a Prüfung direkt vor dem Merge auf dem neuesten main, b Wackel-Wächter, c Nachtlauf), antwortete Noah «a-c alle».

- **Entscheid (c):** Der Nachtlauf (`volle-pruefung.yml`) schreibt jede Nacht eine kurze Meldung, ob alles grün ist, und nennt bei Rot die roten Tests. Der Koordinator liest sie in der Morgenrunde und sagt es Noah.
- **Grund:** Bisher gab es nur bei **neu** rot eine Mail; eine grüne Nacht blieb stumm, und «grün» sah aus wie «nicht gelaufen». Ausserdem startete der Lauf in den letzten 20 Nächten erst gegen 09:00 bis 10:30 UTC und nicht um 02:07 UTC.
- **Kosten:** keine.
- **Offen:** ob die Startzeit am Abend (21:17 UTC) das Ergebnis vor 08:00 liefert; sonst Anstoss durch den Wächter-Lauf von 02:17 UTC.
