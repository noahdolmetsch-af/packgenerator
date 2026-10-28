# Fertig, aber noch nicht online

PR #… · 28.10.2026 · Auftrag: Noah «1-5 a» (Thread «Beheben alte Version auf Geräten»), Frage 5

## Was ist neu
- Ich › Hilfe: Unter «Version … auf diesem Gerät» steht, wie viele fertige (gemergte) Änderungen noch nicht
  online sind, zum Beispiel «2 fertige Änderungen sind noch nicht online (meist etwa 5 Minuten)».
- Die App fragt dazu GitHub öffentlich, ohne Konto und gratis (`src/lib/versionline.js`): Welcher Merge ging
  zuletzt online (letzter erfolgreicher «Build and deploy» auf main), und welche Merges kamen danach.
- Ist nichts unterwegs oder ist GitHub nicht erreichbar, fehlt die Zeile.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- GitHub beantwortet ohne Konto 60 Fragen pro Stunde: Die App fragt darum höchstens alle 2 Minuten.
- Die Browser-Tests fragen GitHub nie echt (`playwright.config.js`, wie beim Server packgen).
- Gezählt werden nur gemergte PRs, nicht das Einmergen von main in einen PR.

## Entscheide (für decisions.md)
- 27.10.2026: siehe `neueste-version.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Neueste Version auf Geräten: Schritt 3 von 3, damit fertig.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne gleich nach einem Merge Ich › Hilfe: Unter der Version steht, wie viele Änderungen noch nicht online sind.
2. Ein paar Minuten später ist die Zeile weg, und online steht die neue Version.
