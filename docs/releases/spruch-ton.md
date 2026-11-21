# Spruch auf Heute: Ton, Schalter, «Nicht mehr solche» (PR 3)

PR folgt · 07.11.2026 · Auftrag: Noah «bau spruch pr3 und 4» (Thread «Entwerfen: täglicher Einstiegs-Spruch»)

## Was ist neu
- Auf der Kachel «Spruch» zwei neue Knöpfe: **«Nicht mehr solche»** und **«Alle Sprüche»**.
- **«Nicht mehr solche»** schaltet den Satz auf der Kachel aus (mit seiner zweiten Formulierung), der nächste kommt, und die Meldung hat **Rückgängig**.
- **«Alle Sprüche»** öffnet ein Fenster:
  - **Ton:** Mix (der Ton wechselt von selbst), Motivierend, Ruhig, Lustig, Vision, Herausforderung.
  - **Woraus die Sprüche entstehen:** ein Schalter pro Quelle (Wetter, Zonenminuten, Schlaf und Puls, Nächste Tour, Schritte, Serie, Velo-Kilometer, Vor einem Jahr, Zitat).
  - **Jeder Satz** (25) mit einer kurzen Beschreibung, seinem Ton und dem Hinweis «passt heute», mit eigenem Schalter.
  - Jede Änderung wird sofort gespeichert; beim Schliessen bietet die Meldung **Rückgängig** für die ganze Änderung. Erlaubt der neue Stand den Satz auf der Kachel nicht mehr, kommt ein passender.
- Hat der gewählte Ton heute nichts zu sagen (zum Beispiel «Vision» ohne Tour, oder «Herausforderung» an einem Tag mit auffälligem Schlaf oder Ruhepuls), sagt die Kachel das und zeigt einen Satz aus dem Mix.
- Alles steht in derselben Einstellung wie der Verlauf (`home.spruch`): `ton`, `offSrc`, `off`. Sie ist im Backup.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die «Seite Alle Sprüche» aus dem Plan ist ein **Fenster** (wie «Welche Zeilen in Jetzt dran?»), keine Seite mit eigener Adresse. So braucht sie keinen Eintrag im Funktionskatalog; der Wächter `heimat.spec` (2,5 Bildschirme) bleibt wie bei PR 1 und 2 unberührt.
- «Nicht mehr solche» schaltet den **Satz** aus, nicht die Quelle. Eine ganze Quelle schaltest du im Fenster aus. Bei Zitaten schaltet es nur dieses Zitat aus; die Zitate selbst pflegst du in der Kissenzeit.
- Die Herausforderungs-Regel (Schlaf und Ruhepuls im Normal) gilt auch bei gewähltem Ton «Herausforderung». Die Zitate haben den Ton «Ruhig» und kommen bei Motivierend, Lustig, Vision und Herausforderung nicht.
- Fertig-Regel: kein neuer Katalog-Eintrag (siehe oben), keine Seite mit «Gut zu wissen». Leere Ansicht: die Kachel sagt, warum sie leer ist, und hat jetzt auch dort «Alle Sprüche». Zeile in `docs/app-stand.md` aktualisiert.
- Nicht in PR 3: eigene Sprüche (PR 4, einzeln, weil Daten).

## Entscheide (für decisions.md)
- 07.11.2026: Tonwahl mit «Mix» als Start; «Alle Sprüche» als Fenster.

## Stand im Plan
- Spruch zum Einstieg: PR 3 von 4 (Ton, Schalter, «Nicht mehr solche»). Plan: `design/tagesspruch/konzept.md` im Projektordner.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute bei der Kachel «Spruch» «Alle Sprüche» tippen, «Ruhig» wählen, «Fertig» tippen: der Satz trägt das Etikett «Ruhig».
2. «Nicht mehr solche» tippen: ein anderer Satz kommt. In der Meldung «Rückgängig» tippen: der erste ist wieder da.
3. Im Fenster eine Quelle ausschalten (zum Beispiel «Zonenminuten») und «Neuer Spruch» mehrmals tippen: keiner davon kommt.
