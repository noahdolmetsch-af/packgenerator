# Tempo-Messer

Auftrag: Noah «a» (Thread «Klären: App wird langsam»), Bericht `notes/tempo-2026-11-02/README.md`

## Was ist neu
- Ich › Daten › «Tempo-Messer»: ein Schalter. An, misst die App nur auf diesem Gerät den Start (erste Anzeige, Bremsen beim Start), die Bilder beim Scrollen (wie viele über 50 ms, das schlimmste) und welche Programmdateien und Seiten bremsen (Chrome «long animation frames»). Dazu nur Zahlen: Anzahl Teile, Touren, Fahrten, Notizen und Kerne des Geräts.
- Eine Zeile zum Kopieren, die Noah schicken kann. Es wird nichts gesendet und nichts gespeichert ausser dem Schalter selbst (nur dieses Gerät).
- Aus = alles Gemessene wird vergessen. Die Messung lädt erst, wenn der Schalter an ist (kein Mehr-Gewicht beim Start).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Als Karte ganz unten in Ich › Daten, nicht in der Suche und nicht in `features.js` (Werkzeug für uns, keine Funktion für den Alltag).
- Firefox/Safari kennen «long animation frames» nicht: dann zeigt die Zeile nur Start und Bilder.

## Stand im Plan
- Tempo-Plan: PR 4 (Messer). Die Auswertung der ersten Zeile von Noahs Handy entscheidet, was als Nächstes gebaut wird.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten, ganz nach unten: «Tempo-Messer» einschalten.
2. Zu Heute wechseln, ein paar Mal auf und ab scrollen, zurück zu Ich › Daten.
3. Eine Zeile mit Zahlen steht da. «Zeile kopieren» tippen und mir schicken.
