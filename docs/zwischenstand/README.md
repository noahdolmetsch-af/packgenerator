# Zwischenstand seit Version 0.96 (Stand 14.10.2026)

Diese Mappe erklärt einer aussenstehenden Person in einfachen Worten, was im Pack Generator **seit Version 0.96.0 (11.10.2026)** besprochen, entschieden, umgesetzt und spezifiziert wurde. Sie ist eine Momentaufnahme vom **14. Oktober 2026, ca. 12 Uhr (Zürich)**. Live war zu diesem Zeitpunkt **Version 0.131.2**.

Die Mappe ersetzt keine bestehenden Dokumente. Sie fasst zusammen und verweist weiter. Für Details gelten weiterhin [decisions.md](../decisions.md), [status.md](../status.md), [vorhaben.md](../vorhaben.md) und die Pull Requests auf GitHub.

## Die Dokumente

| Nr. | Dokument | Beantwortet die Frage |
|---|---|---|
| 1 | [Überblick in 5 Minuten](01-ueberblick.md) | Was ist die App, was hat sich seit 0.96 grundsätzlich geändert? |
| 2 | [Umgesetzt und live](02-umgesetzt.md) | Was ist seit 0.96 tatsächlich online (Versionen 0.97.0 bis 0.131.2)? |
| 3 | [Gebaut, wartet auf Freigabe](03-in-arbeit.md) | Was ist fertig gebaut, aber noch nicht online (offene Pull Requests und lokale Arbeiten)? |
| 4 | [Entscheidungen](04-entscheidungen.md) | Welche Entscheide gelten (Ziel, Arbeitsweise, Produkt)? |
| 5 | [Spezifiziert und offen](05-spezifiziert-und-offen.md) | Was ist beschrieben oder als Bild freigegeben, aber noch nicht gebaut? Welche Fragen sind offen? |
| 6 | [Begriffe](06-begriffe.md) | Was bedeuten die Wörter und Kürzel (Tagespaket, Mockup, SN2, AB1 …)? |

## So liest man die Mappe

- **Eilige Leser:** nur Dokument 1.
- **Wer weiterbauen will:** 1, dann 3 und 5. Dort steht, was als Nächstes kommt und worauf gewartet wird.
- **Wer verstehen will, warum etwas so ist:** 4.

## Woher die Angaben stammen

- Versionen und ihre Inhalte: `src/lib/whatsnew.js` und die deutschen Texte in `src/lib/i18n/de/whatsnew.js` auf `main`.
- Entscheide: `docs/decisions.md` sowie Noahs Antworten im Projekt-Chat und in den Threads (zusammengefasst, ohne private Inhalte).
- Offene Arbeiten: die offenen Pull Requests auf GitHub (Stand 14.10.2026, 10:45 UTC) und das Projektgedächtnis der Claude-Sitzungen.

## Was bewusst fehlt

Das Repository ist öffentlich. Darum stehen hier **keine** privaten Daten: keine Gesundheitswerte, keine Bankdaten oder Zahlungsnummern, keine Adressen, keine Namen anderer Personen, keine Inhalte aus Backups, keine echten Velo-Messwerte. Die Mockup-Seiten (Bilder) liegen als private Seiten bei Claude und sind nur für Noah sichtbar; hier stehen nur ihre Kürzel und was sie zeigen.

## Pflege

Diese Mappe ist ein **datierter Schnappschuss**. Sie wird nicht bei jedem Release nachgeführt. Wer einen neuen Zwischenstand braucht, legt eine neue Mappe mit Datum an oder ergänzt am Ende jedes Dokuments einen Abschnitt «Nachtrag <Datum>».
