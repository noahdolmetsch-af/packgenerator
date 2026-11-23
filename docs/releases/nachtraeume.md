# Nachtträume am Morgen

PR · 23.11.2026 · Auftrag: Noah «7» (Liste «Was noch offen ist»), Beschluss vom 04./05.11.2026 (Thread «Wi gaht's? um Träume und Visionen erweitern»)

## Was ist neu
- Neue Morgenfrage **«Was hast du heute Nacht geträumt?»** (Bereich Erholung, 07:00, von Anfang an an): Chips «nichts gemerkt», «schön», «wirr», «spannend», «Albtraum», «wieder derselbe» (mehrere wählbar) und ein Satz dazu. Sie steht in «Wi gaht's? am Morgen» und im Fenster, direkt nach der Schlaffrage.
- Der Satz steht auch im **Tagebuch** als Eintrag mit dem Schlagwort «Traum», ein Eintrag pro Tag. Ändert man den Satz in der Frage, ändert sich derselbe Eintrag. Hat man ihn im Tagebuch selbst umgeschrieben, bleibt dieser Text.

## Was fällt weg oder rutscht tiefer
- nichts. Die Frage kommt dazu; die Musterfrage «Wovon hast du geträumt, nachts oder am Tag?» (Bereich Visionen, aus) bleibt wie sie ist.

## Selbst entschieden
- Name «Nachtträume» (nicht «Träume»: so heissen die Wunschtouren, `docs/namen.md` Zeile 45).
- Am Start an (Frage 1, Vorschlag a). Wird sie als aus gewünscht, ist es eine Zeile in `ON_AT_START`.
- Ohne Satz gibt es keinen Tagebuch-Eintrag; wird der Satz später gelöscht, bleibt der Eintrag stehen (nichts, was man geschrieben hat, geht verloren).
- Keine Datenbank-Änderung: der Eintrag ist eine gewöhnliche Tagebuch-Zeile in der Tabelle `frei` (kein Schema, kein neues Backup-Format).
- Kein neuer Eintrag in `features.js` (keine neue Seite): Zeile in `docs/app-stand.md` bei «Wi gaht's? am Morgen».

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- keine neuen; Noahs Antworten auf die vier Fragen stehen in den PRs der anderen Teile.

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel 5 «Alltag», «Wi gaht's?»: Nachtträume sind online; offen sind Wechsel-Varianten, Verbindungen, Visionen und Lebensträume.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Wi gaht's? am Morgen»: unter der Schlaffrage steht «Was hast du heute Nacht geträumt?».
2. «schön» antippen, einen Satz schreiben, Seite neu laden: Chips und Satz stehen noch da.
3. Tagebuch öffnen: ein Eintrag mit dem Schlagwort «Traum» hat deinen Satz.
