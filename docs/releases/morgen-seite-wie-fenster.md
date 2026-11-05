# Morgen-Seite wie das Fenster

PR · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4a» zu «ein Fragebogen» (Thread «Planen: Tagescheck mit Fragen»)

## Was ist neu
- Die Seite `#/check/morning` zeigt oben die Fragen der Morgenrunde aus «Deine Fragen», dieselben wie das Fenster «Morgen-Check»: in fünf Stufen, mit Hinweis auf gestern, «Überspringen» je Frage.
- Eine Antwort wird sofort gespeichert. Im Fenster oder auf der Seite beantwortet, steht sie im anderen schon drin; das Fenster fragt nichts, was auf der Seite beantwortet ist. «Überspringen» gilt für beide.
- Schlaf, Akku und Stimmung landen wie bisher auch im Tages-Check (Ringe, Rückblick, Kachel «Morgen-Check»).
- Das Ziel des Tages ist die Textfrage «Dein Ziel für heute» (nicht mehr die Knöpfe). Der Abend fragt weiter «Ziel von heute Morgen erreicht?»: mit dem Ziel aus der Antwort.
- «Deine 15 Fragen»: die Fragen 1–5 und 7 sind aus der Tabelle; ein Hinweis führt zu «Deine Fragen».

## Was fällt weg oder rutscht tiefer
- Die wechselnde Frage (Körper/Kopf, Pool) und «Die wechselnden Fragen bearbeiten» stehen nicht mehr auf der Morgen-Seite. Ersatz: «Körper und Beine» und die anderen Fragen aus «Deine Fragen» (dort lassen sich Fragen ändern, ausschalten, ergänzen).
- Die Ziel-Knöpfe (Velo, Pause, …) sind weg; das Ziel ist ein Satz. Alte Ziele aus den Knöpfen zählen am Abend weiter.
- Stimmung steht in der Grundeinstellung um 13:00 und kommt damit in der Abendrunde, nicht mehr oben auf der Morgen-Seite. Wer sie am Morgen will, stellt die Zeit unter «Deine Fragen» um.
- Die Kachel «Deine 15 Fragen» auf Heute zählt am Morgen nur noch Schlaf, Akku, Stimmung und «Worauf freust du dich?».
- Der Abend (Seite `#/check/evening`) ist noch unverändert; er folgt im nächsten PR.

## Selbst entschieden
- Die Seite hält die Fragen der Runde, die an sind (nicht nur fällige): so sieht man alle und kann eine Antwort ändern.
- Fitbit-Vorbelegung bleibt dem Fenster; die Seite hat ihre Karte «Deine Nacht» daneben.
- Die Seite «Deine 15 Fragen» behält ihren Namen und ihre 9 Abendfragen bis zum nächsten PR.
- Kein Eintrag in `features.js`: keine neue Funktion, die Seite bleibt.

## Entscheide (für decisions.md)
- 04.11.2026: Seite und Fenster fragen dasselbe, aus «Deine Fragen» (Noah «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Tagescheck-Bereinigung: Schritt 2 von 3 (ein Fragebogen), erste Hälfte: Morgen. Danach Abend, dann Gruss «Wi gahts?».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › Morgen-Check: Schlaf und Akku in fünf Stufen; «okay» tippen, Seite neu laden: die Antwort steht noch da.
2. Im Fenster «Morgen-Check» (Heute) dieselbe Frage: schon beantwortet.
3. Ich › Deine Fragen: eine Morgenfrage ausschalten: sie ist von der Seite weg.
