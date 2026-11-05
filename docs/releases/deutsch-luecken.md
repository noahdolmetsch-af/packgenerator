# Fehlendes Deutsch ergänzt

PR #897 · 05.11.2026 · Auftrag: Noah «ETAPPE 1» (Frontend-Durchklick, Thread «Durchklicken Etappe 1: Heute und Ich»)

Funde E1-002 bis E1-004 (Klasse C, Text). Der Durchlauf mit vielen Einträgen zeigte in der deutschen Ansicht «Show all 15 trips», «Show all 11 rides» und «3 reminders a day». Eine Suche über den ganzen Quelltext (alle `t()`/`tn()`-Texte ohne deutschen Eintrag) fand dieselbe Lücke an weiteren Stellen derselben Dateien. Alle stehen jetzt in `src/lib/i18n/de/durchklick1.js`. Die Zahlen hier sind erfunden.

## Was ist neu
- Deutsch für: «Show all {n} trips/rides», «{n} reminder(s) a day», «{n} reminder(s) wait(s) in the next 14 days», «{n} of 9 fields in {year}» (Bingo), «{n} find(s)», «{n} time(s) taken», «{n} with two roles», «To the debriefs».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Übersetzungen im Stil der Nachbartexte der Ruhigen Ansicht; «Ø {v} {unit}», «max {v} {unit}» (Sensorkurve) und «KI-Helfer» bleiben wie sie sind (Zeichen und deutsches Wort).
- Kein neuer Wächter in diesem PR. Eine Prüfung, die jeden `t()`-Text ohne deutschen Eintrag meldet, wäre eine Idee (Klasse D) für den Schlussbericht.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
