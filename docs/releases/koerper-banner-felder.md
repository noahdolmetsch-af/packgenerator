# Dein Körper heute in einem Band (Schritt 1: Felder)

Auftrag: Noah «1-4a» (23.11.2026, Thread «Körper-Banner auf Heute bauen»)

## Was ist neu
- «Dein Körper heute» zeigt vier Felder nebeneinander: Ruhepuls, Zonenminuten, Schlaf, HRV.
- Ruhepuls: «geholt 07:12» (oder «geholt gestern 22:40», wenn der Wert von gestern ist). Die Zeit ist die letzte Änderung der Tageszeile aus Fitbit (`at` in `healthDays`).
- Zonenminuten: heute und «gestern 46».
- Schlaf und HRV: neben «üblich …» (Median der letzten 30 Tage, ab 7 Werten). Liegt der Wert 15 % oder mehr daneben, steht ein kleiner Pfeil (tiefer/höher), nie eine Wertung (`usualOf`, `offOf` in `src/lib/home/body.js`).
- Schlaf als «4 h 10» (Stunden und Minuten).
- Unter den Werten steht «Stand …» mit «Jetzt holen» immer (vorher nur nach einem Fehler).
- Am Computer öffnet ein Tipp auf ein Feld seinen Verlauf (Körperwerte); am Handy bleibt das «Details»-Fenster.

## Was fällt weg oder rutscht tiefer
- Der Schlafwert (Score) steht nicht mehr in der Kachel; er bleibt im «Details»-Fenster (Handy) und in Körperwerte.
- Die Zeile «gestern 52» beim Ruhepuls fällt weg (ersetzt durch «geholt»); der Vergleich mit gestern steht weiter bei den Zonenminuten, im «Details»-Fenster ist er im Wochenvergleich.
- Das «Details»-Fenster hat zusätzlich einen Ring für die HRV.

## Selbst entschieden
- «geholt» nutzt die letzte Änderung der Tageszeile, nicht den Moment, an dem genau dieser Wert kam: das müsste pro Wert gespeichert werden (Datenänderung), das ist nicht in diesem Schritt.
- Ruhepuls bekommt noch keinen Pfeil: seine Grenze (einstellbar, «Was auffällt») kommt im dritten Schritt.
- Schritte, Draussen und Heutestufe folgen in Schritt 2, die ruhigen Hinweise in Schritt 3, die Position unter dem Gruss nach dem Merge von #1513.

## Entscheide (eigene Datei `docs/decisions/koerper-banner.md`)
- 23.11.2026: Banner-Entwurf freigegeben (1–4 a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Körper-Banner: Schritt 1 von 3 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Dein Körper heute»: vier Felder, beim Ruhepuls «geholt …» mit Uhrzeit.
2. Unter Schlaf und HRV steht «üblich …»; liegt ein Wert weit daneben, steht ein kleiner Pfeil.
3. Unter den Werten «Stand …» und «Jetzt holen»; ein Tipp holt Fitbit neu.
