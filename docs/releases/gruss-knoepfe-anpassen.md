# Gruss «Wi gahts?» B: Knöpfe anpassen

PR · 05.11.2026 · Auftrag: Noah «alle umsetzen» (Thread «Planen: Tagescheck mit Fragen»), Vorschlag `tagescheck/gruss-wi-gahts-vorschlag.md`, Prüfliste `tagescheck/gruss-pruefliste.md`. Zweiter von vier PRs (nach A, #912).

## Was ist neu
- Im Fenster des Grusses steht unten «Knöpfe anpassen». Es zeigt die Liste aller Knöpfe: die fünf Gesichter, die Gruppen der Gefühle (Energie, Gefühle) und die Pläne.
- Jeder Knopf: umbenennen (Name, bei Gefühlen auch Emoji), ausblenden und wieder zeigen, löschen (mit Frage und Rückgängig), ordnen mit Pfeilen und Ziehen.
- Eigene Gefühle (mit Emoji) und eigene Pläne hinzufügen; eine neue Gruppe von Knöpfen anlegen; Gruppen umbenennen, ordnen und löschen (die Knöpfe gehen in eine andere Gruppe oder in «Ohne Gruppe», vorgewählt).
- Derselbe Editor steht auf «Deine Fragen» (Ich › Wi gaht's?) unter «Knöpfe im Gruss».
- Alte Antworten bleiben lesbar: ein umbenannter Knopf zeigt im Verlauf das neue Wort, ein gelöschter oder ausgeblendeter sein letztes Wort. Die Knöpfe stehen in der Einstellung `hello.buttons` (reist im Backup mit).

## Was fällt weg oder rutscht tiefer
- nichts. Die Standardknöpfe sind unverändert da, bis jemand sie ändert.

## Selbst entschieden
- Eigene Gesichter gibt es nicht (ein Gesicht braucht ein Bild): Gesichter lassen sich umbenennen, ausblenden und löschen; Neues kommt als Gefühl oder Plan dazu.
- Ein gelöschter Knopf bleibt als «gelöscht» in der Einstellung (nur sein Name), damit der Verlauf ihn weiter anzeigt; er ist weder im Fenster noch im Editor zu sehen.
- Neue Standardknöpfe aus späteren Versionen kommen nicht von selbst in eine bereits gespeicherte Liste (die Liste gehört dir).
- Der Editor lädt erst beim ersten Öffnen (gehört nicht zum Start).
- Kein Eintrag in `features.js`: Teil des Grusses; `app-stand.md` nennt den Editor in der Zeile «Heute».

## Entscheide (für decisions.md)
- 05.11.2026: Alle Knöpfe des Grusses sind selbst änderbar (Noah «alle umsetzen», Regel «Alles selbst ändern»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Gruss-Ausbau: Schritt B von D.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute, Gruss antippen, unten «Knöpfe anpassen».
2. Ein Gefühl mit Emoji hinzufügen, eines umbenennen, eines ausblenden, eines löschen (dann «Rückgängig»).
3. «Zurück»: das Fenster zeigt genau deine Knöpfe. Ich › Deine Fragen › «Knöpfe im Gruss»: dieselbe Liste.
4. Ich › Daten › Verlauf: eine frühere Antwort zeigt das neue Wort.
