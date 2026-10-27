# Test «Dokumente» ohne Fehler aus dem PDF-Fenster

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «3a» (Thread «Einzelideen Ich», Frage 3)

## Was ist neu
- Nichts in der App. Der Test «Ich › Dokumente» (`tests/e2e/daten-sicher.spec.js`) setzt Sprache und «Was ist neu gesehen» nur noch dort, wo es einen Speicher (localStorage) gibt.
- Grund: das Fenster, in dem der Browser das PDF zeigt, hat keinen Speicher. Das kleine Start-Skript des Tests brach dort ab («Cannot read properties of null (reading 'getItem')»), und die Fehlerprüfung am Ende des Tests wurde rot. Das passierte nicht bei jedem Lauf, darum sah es nach einer Abhängigkeit von der Uhrzeit aus.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Den Fehler an der Quelle behoben (im Start-Skript des Tests), statt die Fehlerprüfung zu lockern: die App selbst wirft keinen Fehler.

## Entscheide (für decisions.md)
- 27.10.2026: Test «Dokumente» robust machen (Noah «3a»). Steht schon in decisions.md.

## Stand im Plan
- Unverändert.

## Prüfschritte (nach dem Merge)
1. Nichts zu sehen in der App. Auf GitHub ist der Test «Dokumente» grün, auch in den nächsten Läufen.
