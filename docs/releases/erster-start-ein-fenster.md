# Erster Start in einem Fenster

Auftrag: Noah «1-5a» (23.11.2026, Thread «Klarheit und Auffindbarkeit ab erstem Öffnen»), Punkt V1. Ziele: Klarheit und Auffindbarkeit.

## Was ist neu
- Das Fenster beim ersten Start ist **eines** statt drei: Willkommen, drei Zeilen «Hier kannst du» (Touren planen und packen, täglich abhaken, Velo und Material pflegen), der Hauptknopf «Los, mit Beispielen starten» (alle Beispiele), leise «Leer starten», «Ich nutze die App schon auf einem anderen Gerät» und «Später». Die Sprache wählt man oben rechts (DE · EN).
- Ich › Daten und Backup › **«Beispiele anpassen»**: das Fenster mit den drei Interessen (Touren mit Übernachtung, Tagesfahrten, Abhaken und Alltag). Was schon da ist, steht als «Schon da»; angehakt ist, was fehlt. Es kommt nur dazu, was fehlt; ein Beispiel, das man verändert hat, wird nie überschrieben. «Beispiele entfernen» findet auch die später geholten.

## Was fällt weg oder rutscht tiefer
- Der Interessen-Schritt beim ersten Start → Ich › Daten und Backup › «Beispiele anpassen» (beim ersten Start kommen alle Beispiele; wer weniger will, nimmt «Leer starten» und holt dann, was passt).
- Das Angebot «Rundgang starten» im ersten Fenster → bleibt auf Heute («Neu hier?») und im Handbuch (Ich › Handbuch › Rundgang).
- Der Satz «Nur schauen? … Spielwiese» im ersten Fenster: die Spielwiese bleibt unter Ich › Ausprobieren.

## Selbst entschieden
- «Später» (und ×, Escape, Zurück) schliesst wie bisher, ohne etwas zu wählen; die Frage kommt beim nächsten Start wieder.
- Nach der Wahl schliesst das Fenster und ein kurzer Hinweis sagt, was passiert ist und wo man es wieder wegnimmt.
- «Beispiele anpassen» fügt nur hinzu. Wegnehmen einzelner Teile bleibt «Beispiele entfernen» (alle, mit Rückgängig), damit nichts, was jemand geändert hat, verloren geht.
- Test «Einzelidee Heute 7» (Interessen im ersten Fenster) ist nach `erststart.spec.js` («Beispiele anpassen») umgezogen.
- Keine neue Funktion im Katalog (`f.firststart` beschreibt es); die Zeile in `docs/app-stand.md` steht bei «Daten und Backup».

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 23.11.2026: Erster Start in einem Fenster, Interessen unter «Beispiele anpassen» (Noah «1-5a»): `docs/decisions/erster-start-ein-fenster.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Klarheit und Auffindbarkeit: V1 fertig; V2 (leere Heute-Seite) folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup › «Beispiele anpassen»: drei Zeilen, was da ist sagt «Schon da».
2. Das Gewünschte anhaken, «Beispiele übernehmen»: nur das kommt dazu.
3. «Beispiele entfernen»: alles Beispielhafte geht, Eigenes bleibt.
