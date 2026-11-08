# Weg zum Ziel: der nächste Schritt auf Heute

Auftrag: Noah 05.11.2026 (Entwurf G4), Thread «Entwerfen Weg zum grossen Ziel»

## Was ist neu
- In «Jetzt dran» auf Heute steht eine Zeile mit dem nächsten offenen Schritt des Weges, der als Erster startet: «Weg «Rennen im Mai»: Velo-Check».
- Ist der Schritt fällig oder überfällig, steht rechts «Erledigt ✓» (mit Rückgängig). Sonst steht «Weg zum Ziel» und führt auf den Weg; die Zeile ist ruhig und hat «Später».
- Im «…» des Weges lässt sich die Zeile ausschalten («Nächsten Schritt des Weges auf Heute zeigen»).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Zeile benutzt die vorhandene Heute-Zeilen-Mechanik (ruhige Zeile mit «Später», «Zeilen wählen»); kein neues Kachel-Layout.
- Eine Zeile pro Tag, nur für den Weg, der als Erster startet (`todayStep` in `src/lib/weg/weg.js`, schon getestet).
- «Gut zu wissen» entfällt (Seite ohne Karte «Was du hier tun kannst»).
- Daten: nichts Neues; der Schalter `onToday` stand schon im Eintrag `weg`.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G: Heute-Zeile gebaut. Offen: «Reicht die Zeit?» (Puffer-Balken).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Weg zum Ziel: Weg mit Starttag und einem Schritt haben; auf Heute steht unter «Jetzt dran» eine Zeile mit dem nächsten Schritt.
2. Im «…» des Weges den Haken «Nächsten Schritt des Weges auf Heute zeigen» wegnehmen: die Zeile ist weg.
