# Packliste zuerst auf der Seite «Planen» einer Tour

Schritt 4b des Plans `docs/plan-ganze-app.md` · 19.11.2026 · Auftrag: Noah «1a» (Thread «Ganze App neu denken: klickbarer Prototyp»)

## Was ist neu
- Auf der Seite «Planen» einer Tour (Touren, die Tour, Reiter 1) steht die Packliste jetzt direkt nach dem Kopf, dem Strom-Hinweis, der Ampel «Bereit zur Abfahrt», den Tipps und den Bedingungen. Vorher kamen erst Strecke, Velo und Taschen, Gewicht, Etappen und Planungs-Notizen.
- Mit erfundenen Daten (zwei Tage, 17 Teile, drei Taschen): auf dem Handy beginnt die Liste nach 2460 statt 4350 px, am Computer nach 1170 statt 2140 px.
- Strecke, Velo und Taschen, Gewicht, Etappen und Planungs-Notizen stehen unverändert da, nur unter der Liste. Es ist nichts ausgeblendet, kein Knopf und keine Adresse ändern sich.

## Was fällt weg oder rutscht tiefer
- Strecke, Velo und Taschen (mit der Zeichnung), Gewicht, Etappen und Planungs-Notizen rutschen unter die Packliste (Seite «Planen» einer Tour). Wer zuerst die Strecke einstellen will, scrollt kurz nach unten.
- Sonst fällt nichts weg.

## Selbst entschieden
- Nur die Reihenfolge ändert sich. Die Reiter «Planen», «Vorbereiten», «Unterwegs», «Danach» und «Auswertung» gab es schon (Schritt 1b, #1205); die Seite «Vorbereiten» hatte die Liste schon oben. Darum ist dieser Schritt klein.
- Ein eigener Reiter «Packen» wird nicht neu gebaut: «Vorbereiten» ist die Phase «Packen» des Entwurfs (Namensliste `docs/namen.md`, Zeile 1).
- Die Karten «Wie anstrengend wird es?», «Gut zu wissen» und die Bedingungen bleiben vor der Liste, weil sie zur Liste gehören (die Bedingungen ändern, was auf der Liste steht).
- Test `tests/e2e/packliste-zuerst.spec.js` prüft, dass die Liste über den Planungs-Karten steht.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: Schritt 4b gebaut. Als Nächstes 7a, 7b, 11, 12, 13, 6; Heute (2b) erst nach «Startseite ruhiger».

## Prüfschritte (nach dem Merge, auf der echten Seite)
1. Öffne unter «Touren» eine geplante Tour (Reiter «Planen»).
2. Die Packliste steht vor «Strecke», «Velo und Taschen», «Gewicht» und «Etappen».
3. Alle diese Karten sind weiter da, nur weiter unten.
