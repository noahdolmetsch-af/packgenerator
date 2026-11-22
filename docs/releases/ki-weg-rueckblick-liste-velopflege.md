# Keine KI-Entwürfe mehr in Rückblick, Packliste und Velopflege

PR folgt · 21.11.2026 · Auftrag: Noah «a» (Thread «Entfernen aller KI-Funktionen», Schritt 2 von 7)

## Was ist neu
- Der Rückblick hat kein «Entwurf holen» mehr; Lernpunkte und Zusammenfassung schreibst du selbst, die Notizen unterwegs bleiben.
- Im Menü der Packliste fehlt «Liste prüfen». Die Hinweise aus früheren Touren («Vergessen?», Regeln) bleiben.
- Velopflege: «Jetzt fällig» kommt nur aus deinen eigenen km, Intervallen und Messwerten; keine Claude-Vorschläge mehr.
- Aus dem Helfer-Code entfernt: `ListCheck`, `DebriefDraft`, `helper/care.js` und die Bausteine für Rückblick, Liste und Wartung (`payload.js`, `logic.js`). Der Server bleibt unverändert.

## Was fällt weg oder rutscht tiefer
- «Entwurf holen» im Rückblick → nichts; Ersatz sind die Notizen unterwegs und die eigenen Lernpunkte.
- «Liste prüfen» (Knopf und Menü) in Packen → nichts.
- Claude-Karten in «Jetzt fällig» (Velopflege) → die eigenen Fälligkeiten der App bleiben.
- Im Helfer unter Ich › KI-Helfer fallen die drei Orte «Packen», «Rückblick» und «Velopflege» weg.

## Selbst entschieden
- Die drei E2E-Tests (Rückblick-Entwurf, Liste prüfen, Wartung) und die Unit-Tests der Bausteine sind entfernt; ihre Orte gibt es nicht mehr. Der Test «vor dem Einrichten» bleibt und prüft weiter, dass diese Orte keinen Helfer zeigen.
- Kein Eintrag im Verlust-Wächter nötig: keine dieser Stellen war eine eigene Funktion im Katalog.
- Nichts mit `api/`, Daten oder Backup wird angefasst; Server und Client des Helfers bleiben bis Schritt 4 bis 6.
- Übrige deutsche Texte der entfernten Stellen bleiben bis Schritt 7 in `de/*.js`.

## Entscheide
- Siehe Schritt 1: alle KI-Funktionen mit Claude und Gemini werden entfernt (Noah «a»); «KI im Gerät» bleibt.

## Stand im Plan
- KI entfernen: Schritt 2 von 7.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rückblick öffnen, «Wie war's?»: kein «Entwurf holen», die Notizen sind da.
2. Packen, ••• Menü der Liste: kein «Liste prüfen».
3. Velos › Pflege: «Jetzt fällig» zeigt nur eigene Teile.
