# Fragen aus deinen Daten, Schritt 1

PR folgt · 03.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5a» und «bau stufe 1» (Thread «Brainstorme intelligenteren Tagescheck»)

## Was ist neu
- Wenn dein **Ruhepuls** von heute mindestens 5 über deinem Üblichen der letzten 30 Tage liegt, stellt das Morgen- oder Abendfenster als erste Frage: «Was hast du gestern gemacht, das dich heute so aus der Ruhe bringt?» Antworten: Spät gegessen, Alkohol, Hartes Training, Stress, Wenig geschlafen, Nichts Besonderes, dazu ein eigener Satz.
- Unter der Frage steht **«Warum frage ich das?»** mit den Zahlen (heute und üblich).
- Ich › Deine Abfragen › **«Fragen aus deinen Daten»**: ein Schalter pro Regel.
- Hinter den Kulissen: ein kleiner Regel-Motor (`src/lib/datenfragen.js`), den die nächsten Regeln benutzen. Bis zu 3 Fragen aus Daten pro Tag, eine Regel fragt frühestens 3 Tage nach der letzten Antwort wieder.

## Was fällt weg oder rutscht tiefer
- nichts. Die Frage kommt zusätzlich und steht im Fenster vor den anderen. Mit «Mehr Fragen anzeigen» sind die übrigen weiter erreichbar.

## Selbst entschieden
- Schritt 1 von 3 in Stufe 1: nur die Ruhepuls-Regel. Schlaf kurz und Stimmung tief folgen als nächster PR, die Seite mit Schwelle und Text als dritter.
- Die Schwelle (+5, 30 Tage, mindestens 7 Tage mit Wert) ist dieselbe wie bei «Was zusammenpasst». Änderbar wird sie auf der Seite im dritten PR.
- Die Antwort steht im Verlauf (Gruppe «Körper und Werte»), zählt aber nicht als Frage der Liste und erscheint nicht unter «Deine Abfragen».
- Fertig-Regel: Eintrag in `features.js`, «Passt hier», «Gut zu wissen» und leerer Zustand kommen mit der Seite «Fragen aus deinen Daten» (PR 3). In diesem PR gibt es nichts Leeres, die Frage erscheint nur, wenn ein Wert auffällt.

## Entscheide (für decisions.md)
- 03.11.2026: Fragen aus Daten sitzen im normalen Fenster, bis zu 3 pro Tag, ruhiger Ton (Noah «1b 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Fragen aus deinen Daten»: Stufe 1, Schritt 1 gebaut (Motor + Ruhepuls).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Du siehst die Frage nur, wenn dein Ruhepuls heute auffällt. Ob das so ist, zeigt Ich › Daten › Fitbit.
2. Dann steht im Morgen-Check als erste Frage die nach «gestern» mit der Zeile «Warum frage ich das?».
3. Ich › Deine Abfragen: rechts «Fragen aus deinen Daten» mit dem Schalter.
