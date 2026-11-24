# Deine Listen treffen sich auf beiden Geräten

PR folgt · 23.11.2026 · Auftrag: Noah (Thread «Abgleich zwischen Handy und Computer sichern»)

## Was ist neu
- **Ursache gefunden:** «Was mir gut tut» ist im Abgleich dabei, aber die ganze Liste war *ein* Eintrag. Änderten beide Geräte die Liste, ersetzte die neuere die andere ganz (die ältere wartete 30 Tage im Verlauf). Ein Gerät, das seine Liste nie gespeichert hatte und nur die sieben Beispiele zeigte, schrieb sie mit dem ersten Haken über die echte Liste des anderen.
- Neue Regel «zusammenführen» (`src/lib/sync/merge.js`, `mergeRoutine`): jeder Eintrag von einem der beiden Geräte bleibt, die Haken und die Antworten «Hat es dir gutgetan?» beider Geräte bleiben, Reihenfolge und Wortlaut kommen vom neueren Stand, ein unveränderter Beispieleintrag verdrängt nie einen geänderten, ein unveränderter und nie abgehakter Beispieleintrag, den nur ein Gerät noch hat, war auf dem anderen gelöscht und geht. Gelöschte eigene Einträge merkt sich die Liste leise (`gone`, höchstens 100), damit sie nicht zurückkommen.
- «Bleibt fürs Velo» in «Kleider heute» lag nur im Browser-Speicher des Geräts und geht jetzt in den Abgleich (Einstellung `wardrobe.everydayKeep`, Auswahl beider Geräte bleibt; alter Stand wird einmal übernommen).
- «Was wird abgeglichen?» (Ich › Daten und Backup, eingeklappt): sagt einfach, was aufs andere Gerät geht und was auf dem Gerät bleibt.
- Landkarte `src/lib/sync/geraet.js` und Schutz-Test `tests/abgleich-karte.test.js`: jede Tabelle ist abgeglichen oder mit Grund «nur Gerät» benannt; jede Datei, die den Browser-Speicher (localStorage, sessionStorage) nutzt, hat eine Zeile mit ihrer Art. Eine neue Nutzung ohne Zeile macht den Test rot. Erklärung für Noah: `docs/abgleich.md`.

## Was fällt weg oder rutscht tiefer
- nichts. Der Preis der Regel: ein Haken, den du auf einem Gerät zurücknimmst, während das andere gleichzeitig etwas anderes an der Liste ändert, kommt zurück; ein eigener Eintrag, den du auf einem Gerät löschst, während das andere die Liste ändert, kommt zurück. Es geht nie etwas verloren, ein Tipp stellt es richtig.

## Selbst entschieden
- Keine Änderung am Speicherformat: `gone` ist ein optionales Feld im bestehenden Eintrag `routine`; alte Einträge ohne `gone` lesen sich wie vorher. Backups bleiben gleich lesbar.
- Andere Listen (Heute-Anordnung, eigene Listen und Typen) behalten die Regel «neuere Änderung gewinnt»; sie sind in `docs/abgleich.md` als Folgearbeit genannt, nicht still verändert.
- Kein Bild in «Was ist neu»: der Fehler hat keinen eigenen Ort (go: null).

## Entscheide (eigene Datei `docs/decisions/abgleich-listen.md`)
- 23.11.2026: Listen werden beim Abgleich zusammengeführt statt ersetzt.

## Stand im Plan (roadmap.md / vorhaben.md)
- nichts geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup öffnen: unten steht «Was wird abgeglichen?».
2. Am Handy bei «Was mir gut tut» › «Liste ändern» einen neuen Eintrag anlegen, am Computer einen anderen Eintrag abhaken.
3. Nach ein paar Minuten zeigen beide Geräte den neuen Eintrag und den Haken.
