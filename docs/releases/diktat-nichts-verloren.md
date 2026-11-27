# Diktat: nichts geht verloren

Auftrag: Noah 27.11.2026 (Foto der Notiz mit laufender Aufnahme, danach «die Fehlermeldung kam erst, als ich auf Speichern geklickt habe») (Thread «Spracheingabe bei Notizen reparieren»).

## Was ist neu
- Wer bei laufendem Mikrofon auf «Speichern» tippt, behält das Gesprochene: Die Aufnahme endet zuerst, die Wörter, die der Browser noch «hört» (grau, kursiv unter dem Feld), werden Text im Feld, erst dann wird gespeichert. Vorher stand das Feld noch leer, und es kam «Schreib ein paar Worte …».
- Dasselbe bei «Stopp», bei einer Pause des Browsers und beim Vorlesen einer Antwort: der angefangene Satz wird Text, statt zu verfallen. Bestätigt der Browser denselben Satz nach dem Stopp, steht er nicht doppelt.
- Die rote Zeile «Schreib ein paar Worte …» verschwindet, sobald Wörter ankommen (Notizen und Schnell-Notiz).
- Gilt für alle Felder mit Mikrofon (Notizen, Schnell-Notiz, Tagebuch, Pflege, Rückblick …): jeder Speichern-Knopf beendet die Aufnahme zuerst. Mit «Whisper auf diesem Gerät» wartet der Tipp, bis der Text geschrieben ist, und gilt dann.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Ursache aus dem Code, nicht auf dem Handy nachgestellt: Chrome auf Android meldet Wörter in langen Aufnahmen oft erst nach einer Pause als «fertig». Bis dahin standen sie nur in der grauen Zeile, und Stopp und Speichern warfen sie weg.
- Der überdeckte «Verbessern»-Knopf unten auf dem Bild gehört zum PR «Frag Gemini» (1836) und ist hier nicht angefasst.
- Kein neues Fenster, keine neue Einstellung: die Aufnahme sieht aus wie bisher.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Notizen: Mikrofon tippen, einen Satz sagen, bei «Hört zu» auf «Speichern» tippen: die Notiz steht mit dem Satz in der Liste.
2. Mikrofon, Satz, Stopp-Quadrat: der Satz steht im Feld, kein roter Hinweis.
