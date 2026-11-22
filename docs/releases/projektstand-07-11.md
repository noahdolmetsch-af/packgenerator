# Projektstand 07.11.2026 auf GitHub aktualisiert

PR folgt · 07.11.2026 · Auftrag: Noah «Stand auf Github aktualisieren (Projektstand etc). und auf claude sichern» (Thread «Aktualisieren: Projektstand auf GitHub»)

## Was ist neu
- `docs/stand-und-plan.md` ist auf den Abend des 07.11.2026 nachgeführt: offene PRs aus der PR-Liste von GitHub (freigegeben mit Label «ok» und wartend auf «ok NNN»), alles, was seit dem 05.11. online ging, die Etappen, «Was auf dich wartet». Quelle: `git log` von `main`, PR-Liste, Release-Dateien.
- `docs/app-stand.md` hat die Funktionen, die seit dem 05.11. auf `main` sind und noch keine Zeile hatten: Training (Bibliothek, Heute passt, Verpasst, Wochenlast), Live-Karte («Bereit für unterwegs?», Sonne und Mond, Kleidungs-Tipp, «Wie fährst du?», Belag, Reserve-Router), Tennis (Gutscheine, Fester Termin, Warteliste, Gruppenstunden, Abo, Stundenkarte), Schrittarten von «Weg zum Ziel», Heute (starker Knopf, Körperwerte, 12 Monate), Velo-Zahlen und die Bausteine, die überall gelten (Diagramme zum Antippen, Zahlen mit Weg, Doppeltipp-Schutz, «Zum Inhalt springen»).
- Nur Dokumentation, kein Appcode, keine privaten Daten, keine Versionsnummer.

## Was fällt weg oder rutscht tiefer
- nichts. Aus `stand-und-plan.md` ist nur gestrichen, was erledigt ist (zum Beispiel die Liste der PRs vom 5.11., die inzwischen online sind).

## Selbst entschieden
- Offene PRs stehen als «offen» oder «wartet», nicht als online. Wo der Stand nur in einem Thread steht (Etappe 3 und Schlussbericht, Zahlart Überweisung, Pausen-Planer), steht «Stand im Thread prüfen» statt einer Vermutung.
- Die Plan-Datei `docs/plan-ganze-app.md` ist als «noch nicht auf GitHub» geführt, weil kein PR dazu offen ist.
- `app-stand.md`: bestehende Zeilen ergänzt, keine neue Zeile mit neuem Link (kein Ort ist neu).

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung an `roadmap.md`, `vorhaben.md`, `decisions.md`.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf GitHub `docs/stand-und-plan.md` öffnen: oben steht «7. November 2026, abends».
2. Stichprobe: Ein PR aus der Tabelle «Wartet auf dein ok» (zum Beispiel #1132) ist auf GitHub noch offen.
