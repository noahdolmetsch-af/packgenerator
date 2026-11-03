# Schlafplatz wählen im Nacht-Blatt

PR (diese Änderung) · 03.11.2026 · Noah «2a und b» (02.11.) und «ok schlafplatz» (02.11. 22:52), Ziel 6 «Lange Fahrten unterwegs verstehen»

## Was ist neu
- Im Nacht-Blatt (⋯-Menü der Live-Karte) bei «Bett»: «Ändern» öffnet die Liste «Andere Schlafplätze in der Nähe» (Hotel, Dach, Biwak; bei Regen zuerst Dächer, bei Kälte zuerst Betten; `SleepList.svelte`).
- Pro Platz: «Wählen» (wird «Mein Bett», gespeichert im Rennen unter `bedChoice`), «Dorthin navigieren» (öffnet den Umweg-Planer mit dem Platz als Ziel) und «Als Notfall-Bett merken» (`emergencyBed`).
- «Auf der Karte wählen» schliesst das Blatt und lässt das Bett mit einem Tipp auf die Karte wählen. «Wieder den Vorschlag nehmen» entfernt die Wahl.
- Jede Wahl bietet Rückgängig an.

## Was fällt weg oder rutscht tiefer
- nichts. Das Bett aus dem Plan bleibt der Vorschlag, bis du eines wählst.

## Selbst entschieden
- Die Liste bleibt nach «Wählen» offen, damit man gleich noch ein Notfall-Bett wählen kann.
- Nur im Rennen gespeichert (Daten im Rennen-Eintrag, kein Schema-Wechsel).
- Notfall-Bett und Ausstieg (nächster Bahnhof) folgen als eigener PR.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Nacht-Blatt»: Schlafplatz-Wahl gebaut; danach Wasser, Kälte/Regen, Licht/Akku, Schritt 6 «Offline».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte starten, «⋯» › «Nacht-Blatt» › «Ändern»: eine Liste mit Schlafplätzen erscheint.
2. Einen mit «Wählen» antippen: er steht als «Mein Bett». Bei einem anderen «Als Notfall-Bett merken»: er steht als «Notfall-Bett», mit Rückgängig.
