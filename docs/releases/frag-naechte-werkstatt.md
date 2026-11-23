# Frag die App beantwortet Nächte draussen und den letzten Werkstattbesuch

Auftrag: Noah «1a 2b 3a 4a 5a» (21.11.2026), Vorschlag S6. Zweiter Schritt: die zwei ersten neuen Fragearten aus der Liste «Fragen ohne Antwort» (PR 1464).

## Was ist neu
- **«Wie viele Nächte habe ich draussen geschlafen?»**: zählt die Nächte der Touren mit «Biwak» oder «Biwak + Zelt» (`trip.overnight = 'outdoor'`), ohne übersprungene und ohne Hotel. Ohne Zeitangabe gilt dieses Jahr; «diesen Monat», «letzten Monat», «diese Woche» gehen auch. Nur schon geschlafene Nächte zählen (die Nacht von heute noch nicht). Hat keine Tour «Biwak», sagt die Antwort, wo man das einstellt («Wo schläfst du?»).
- **«Wann war ich zuletzt in der Werkstatt?»**: nennt Datum und Alter des letzten Besuchs, Werkstatt, Velo, Zahl der Arbeiten und Betrag; darunter pro anderes Velo das Datum seines letzten Besuchs. Link zu «Besuche und Belege».
- Beide Fragen stehen als Beispiele im Assistenten.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Keine Datenänderung: es wird nur gelesen (Touren, Besuche), nichts gespeichert, kein Schema-Wechsel.
- Nächte nur von Touren mit ausdrücklichem «Biwak» zählen (nicht wie der Jahresrückblick «alles ausser Hotel»), weil die Frage «draussen» heisst. Der Jahresrückblick zählt weiter wie bisher.
- «Werkstatt» in einer Frage nach dem Packen («Was muss ich für die Werkstatt packen?») bleibt eine Packfrage.
- Neue Datei `src/lib/assistent/luecken.js` statt weiterer Regeln in `answers.js`; Beispiele und Deutsch in `src/lib/i18n/de/luecken.js`.
- Kein neuer `features.js`-Eintrag: eine Verfeinerung von «Frag die App» (Zeile in `docs/app-stand.md` bekommt einen Satz).

## Entscheide
- Siehe `docs/decisions/frag-naechte-werkstatt.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Klügere App: S3, S5, S1 und S6 Schritt 1 gemacht; S6 Schritt 2 (diese Fragen) hier; danach S4 nach K3.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Assistent öffnen, das Beispiel «Wann war ich zuletzt in der Werkstatt?» tippen: die Antwort nennt das Datum des letzten Besuchs.
2. «Wie viele Nächte habe ich dieses Jahr draussen geschlafen?» fragen: die Antwort zählt die Nächte oder sagt, wie man eine Tour markiert.
