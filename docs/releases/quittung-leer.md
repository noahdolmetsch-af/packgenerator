# Keine leeren Notizen mehr

PR (Jetzt dran, Frage 1) · 5.11.2026 · Auftrag: Noah «1a» (Thread «Überdenke die Kachel «Jetzt dran»»)

## Was ist neu
- Auf Heute stand in «Jetzt dran» die Zeile «Werkstatt-Quittung:» ohne Text. Es war ein Lernpunkt. Ursache: Öffnet man «Notiz + Foto» für einen Beleg, füllt die App «Werkstatt-Quittung: » vor. Die Notiz speicherte sich nach 0,4 Sekunden von selbst, und im Eingang wurde sie als Lernpunkt abgelegt.
- Ein Text, der nur aus einem Stichwort mit Doppelpunkt besteht (`src/lib/barelabel.js`), zählt nicht als Notiz: weder die Selbstspeicherung noch «Speichern» legt sie ohne Foto an («Schreib ein paar Worte oder füge ein Foto an.»). Mit Foto oder mit Text hinter dem Doppelpunkt geht alles wie vorher.
- Lernpunkte ohne Inhalt zeigt Heute nicht mehr, auch nicht die leeren Stellen der App (`learningsFor`, `sparkOf`). Der bestehende leere Lernpunkt bleibt in der Liste unter Rückblick › Lernpunkte und lässt sich dort löschen.

## Was fällt weg oder rutscht tiefer
- Nichts. Eine Notiz nur mit dem Vorspann ohne Foto lässt sich nicht mehr speichern (sie hatte keinen Inhalt).

## Selbst entschieden
- Die Regel gilt für jedes Stichwort mit Doppelpunkt am Ende (bis 60 Zeichen), nicht nur für Quittungen, weil auch andere Vorspänne so aufgebaut sind.
- Der alte leere Lernpunkt in Noahs Daten wird nicht automatisch gelöscht (Regel: nichts löschen ohne Frage). Er ist nur von Heute weg.

## Entscheide (für decisions.md)
- nichts Neues

## Stand im Plan (roadmap.md / vorhaben.md)
- Jetzt dran: Frage 1 «1a» umgesetzt; Fragen 2 bis 4 folgen als eigene PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Neu › Notiz + Foto › «Werkstatt-Quittung», ohne weiter zu schreiben auf «Speichern»: Die App bittet um Worte oder ein Foto, im Eingang entsteht nichts.
2. Heute › «Jetzt dran»: die Zeile «Werkstatt-Quittung:» ist weg.
